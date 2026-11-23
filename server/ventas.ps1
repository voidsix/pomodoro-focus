# Control de ventas de Foco Pro: cruza cada orden creada con su estado en Mercado Pago
# y con la Pro de la cuenta. Sirve para asegurarte de que todo el que pagó tiene su Pro.
#   .\ventas.ps1                  → lista todas las órdenes y marca los problemas
#   .\ventas.ps1 -Arreglar        → además activa la Pro a quien pagó y no la tiene
#   .\ventas.ps1 -Activar UID     → activa la Pro a mano a una cuenta (por ejemplo, regalo o reclamo)
param([switch]$Arreglar, [string]$Activar)
$project = 'foco-estudio-1b47c'
$db = 'https://foco-estudio-1b47c-default-rtdb.firebaseio.com'
$h = @{ Authorization = 'Bearer ' + (gcloud auth print-access-token) }
$mp = @{ Authorization = 'Bearer ' + (gcloud secrets versions access latest --secret=mp-access-token --project $project 2>$null) }
function Read-Db($path) { Invoke-RestMethod -Headers $h "$db/$path.json" }
function Set-Pro($uid, $orderId, $amount) {
  $body = @{ at = [DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds(); pay = "$orderId"; amount = $amount } | ConvertTo-Json
  Invoke-RestMethod -Method Put -Headers $h -ContentType 'application/json' -Body $body "$db/users/$uid/pro.json" | Out-Null
}

if ($Activar) {
  Set-Pro $Activar 'manual' 0
  "Pro activada a mano para $Activar."
  return
}

# Todas las órdenes conocidas (con precio/código) y la última de cada cuenta
$ids = @{}
$meta = Read-Db 'orderMeta'
if ($meta) { $meta.PSObject.Properties | ForEach-Object { $ids[$_.Name] = $_.Value } }
$last = Read-Db 'orders'
if ($last) { $last.PSObject.Properties | ForEach-Object { if (-not $ids.ContainsKey($_.Value.id)) { $ids[$_.Value.id] = [pscustomobject]@{ uid = $_.Name; price = 1200; code = $null } } } }
if ($ids.Count -eq 0) { 'Todavía no hay órdenes.'; return }

$pagadas = 0; $problemas = 0
foreach ($id in $ids.Keys) {
  $m = $ids[$id]
  try { $o = Invoke-RestMethod -Headers $mp "https://api.mercadopago.com/v1/orders/$id" } catch { "{0}  no se pudo consultar en Mercado Pago" -f $id; continue }
  $pago = $o.status -eq 'processed' -and $o.status_detail -eq 'accredited'
  $devuelto = $o.status -eq 'refunded' -or $o.status_detail -eq 'partially_refunded'
  $pro = Read-Db "users/$($o.external_reference)/pro"
  $fecha = if ($m.at) { [DateTimeOffset]::FromUnixTimeMilliseconds($m.at).LocalDateTime.ToString('dd/MM HH:mm') } else { '' }
  $estado = if ($devuelto) { 'DEVUELTO' } elseif ($pago) { 'PAGADO' } else { "sin pagar ($($o.status))" }
  $marca = ''
  if ($pago -and -not $devuelto) {
    $pagadas++
    if (-not $pro) {
      $problemas++; $marca = '  <-- PAGÓ Y NO TIENE PRO'
      if ($Arreglar) { Set-Pro $o.external_reference $id ([double]$o.total_paid_amount); $marca += ' (arreglado)' }
    } else { $marca = '  ok, tiene Pro' }
  } elseif ($devuelto -and $pro -and $pro.pay -eq "$id") { $problemas++; $marca = '  <-- DEVUELTO Y SIGUE CON PRO' }
  '{0,-11} ${1,-6} {2,-10} {3,-22} cuenta {4}{5}' -f $fecha, $o.total_amount, $(if ($m.code) { $m.code } else { '-' }), $estado, $o.external_reference, $marca
}
''
"Pagadas: $pagadas · Problemas: $problemas"
if ($problemas -and -not $Arreglar) { 'Corré .\ventas.ps1 -Arreglar para activar las Pro que faltan.' }
