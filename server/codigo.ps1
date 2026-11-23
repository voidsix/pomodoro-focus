# Crea o cambia un código de descuento de Foco Pro.
# Ejemplos:
#   .\codigo.ps1 FOCO500 500                 → $500, sin límite de usos ni vencimiento
#   .\codigo.ps1 PARCIAL 700 -Usos 50        → $700, hasta 50 compras
#   .\codigo.ps1 VERANO 800 -Dias 15         → $800, vence en 15 días
#   .\codigo.ps1 FOCO500 -Borrar             → lo desactiva
#   .\codigo.ps1 -Lista                      → muestra los códigos y cuántas veces se usaron
param([string]$Codigo, [int]$Precio, [int]$Usos = 0, [int]$Dias = 0, [switch]$Borrar, [switch]$Lista)
$db = 'https://foco-estudio-1b47c-default-rtdb.firebaseio.com'
$h = @{ Authorization = 'Bearer ' + (gcloud auth print-access-token) }
if ($Lista) {
  $all = Invoke-RestMethod -Headers $h "$db/promo.json"
  if (-not $all) { 'No hay códigos.'; return }
  $all.PSObject.Properties | ForEach-Object {
    $v = $_.Value
    $vence = if ($v.until) { [DateTimeOffset]::FromUnixTimeMilliseconds($v.until).LocalDateTime.ToString('dd/MM/yyyy') } else { 'nunca' }
    '{0,-12} ${1,-6} usos: {2}{3}  vence: {4}' -f $_.Name, $v.price, [int]$v.used, $(if ($v.max) { " de $($v.max)" } else { '' }), $vence
  }
  return
}
$Codigo = ($Codigo.ToUpper() -replace '[^A-Z0-9]', '')
if (-not $Codigo) { 'Falta el código.'; return }
if ($Borrar) { Invoke-RestMethod -Method Delete -Headers $h "$db/promo/$Codigo.json" | Out-Null; "Código $Codigo desactivado."; return }
if ($Precio -le 0) { 'Falta el precio (en pesos).'; return }
$data = @{ price = $Precio }
if ($Usos -gt 0) { $data.max = $Usos }
if ($Dias -gt 0) { $data.until = [DateTimeOffset]::UtcNow.AddDays($Dias).ToUnixTimeMilliseconds() }
Invoke-RestMethod -Method Patch -Headers $h -ContentType 'application/json' -Body ($data | ConvertTo-Json) "$db/promo/$Codigo.json" | Out-Null
"Código $Codigo listo: Foco Pro a `$$Precio."
