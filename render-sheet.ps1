# Prints dist/sheet.html to a blank one-page PDF form with headless Edge.
# Usage (from this folder): powershell -NoProfile -ExecutionPolicy Bypass -File render-sheet.ps1
$d = $PSScriptRoot
$url = "file:///" + (($d -replace '\','/') -replace ' ','%20') + "/dist/sheet.html"
$edge = "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
$out = "$d\dist\360-Pro-Install-Time-Study-blank.pdf"
$p = Start-Process -FilePath $edge -ArgumentList @("--headless=new","--disable-gpu","--no-pdf-header-footer","--virtual-time-budget=8000","--print-to-pdf=`"$out`"",$url) -PassThru
if (-not $p.WaitForExit(90000)) { $p.Kill(); Write-Output "timed out" } else { Write-Output "wrote $out" }
