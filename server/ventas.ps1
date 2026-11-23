# Control de ventas de Foco Pro: lista los pagos de Foco Pro en Mercado Pago y los cruza con la
# Pro de cada cuenta. Sirve para asegurarte de que todo el que pagó tiene su Pro.
#   .\ventas.ps1                  → lista los pagos y marca los problemas
#   .\ventas.ps1 -Arreglar        → además activa la Pro a quien pagó y no la tiene
#   .\ventas.ps1 -Activar UID     → activa la Pro a mano a una cuenta (por ejemplo, regalo o reclamo)
param([switch]$Arreglar, [string]$Activar)
$project = 'foco-estudio-1b47c'
$db = 'https://foco-estudio-1b47c-default-rtdb.firebaseio.com'
$h = @{ Authorization = 'Bearer ' + (gcloud auth print-access-token) }
$mp = @{ Authorization = 'Bearer ' + (gcloud secrets versions access latest --secret=mp-access-token --project $project 2>$null) }
function Read-Db($path) { Invoke-RestMethod -Headers $h "$db/$path.json" }
function Set-Pro($uid, $payId, $amount) {
  $body = @{ at = [DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds(); pay = "$payId"; amount = $amount } | ConvertTo-Json
  Invoke-RestMethod -Method Put -Headers $h -ContentType 'application/json' -Body $body "$db/users/$uid/pro.json" | Out-Null
}

if ($Activar) { Set-Pro $Activar 'manual' 0; "Pro activada a mano para $Activar."; return }

$res = Invoke-RestMethod -Headers $mp "https://api.mercadopago.com/v1/payments/search?sort=date_created&criteria=desc&limit=100"
$pagos = @($res.results | Where-Object { $_.metadata.app -eq 'foco-pro' -or "$($_.description)".StartsWith('Foco Pro') })
if ($pagos.Count -eq 0) { 'Todavía no hay pagos de Foco Pro.'; return }

$aprobados = 0; $problemas = 0
foreach ($p in $pagos) {
  $uid = "$($p.external_reference)"
  $pro = Read-Db "users/$uid/pro"
  $fecha = ([datetime]$p.date_created).ToString('dd/MM HH:mm')
  $devuelto = $p.status -in @('refunded', 'charged_back') -or [double]$p.transaction_amount_refunded -gt 0
  $estado = if ($devuelto) { 'DEVUELTO' } elseif ($p.status -eq 'approved') { 'PAGADO' } else { $p.status }
  $marca = ''
  if ($p.status -eq 'approved' -and -not $devuelto) {
    $aprobados++
    if (-not $pro) {
      $problemas++; $marca = '  <-- PAGÓ Y NO TIENE PRO'
      if ($Arreglar) { Set-Pro $uid $p.id ([double]$p.transaction_amount); $marca += ' (arreglado)' }
    } else { $marca = '  ok, tiene Pro' }
  } elseif ($devuelto -and $pro -and $pro.pay -eq "$($p.id)") { $problemas++; $marca = '  <-- DEVUELTO Y SIGUE CON PRO' }
  $code = if ($p.metadata.code) { $p.metadata.code } else { '-' }
  '{0,-11} ${1,-7} {2,-9} {3,-10} {4,-12} cuenta {5}{6}' -f $fecha, $p.transaction_amount, $code, $estado, $p.payment_method_id, $uid, $marca
}
''
"Pagados: $aprobados · Problemas: $problemas"
if ($problemas -and -not $Arreglar) { 'Corré .\ventas.ps1 -Arreglar para activar las Pro que faltan.' }
