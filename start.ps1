$ErrorActionPreference = 'Stop'
Set-Location $PSScriptRoot
if (!(Test-Path 'node_modules')) { & npm.cmd install; if ($LASTEXITCODE) { exit $LASTEXITCODE } }
& npm.cmd run build
if ($LASTEXITCODE) { exit $LASTEXITCODE }
$beatsPhp = if (Test-Path '.runtime/php/php.exe') { Join-Path $PSScriptRoot '.runtime/php/php.exe' } else { 'php' }
Write-Host 'BEATS: http://localhost:8080 (stop: Ctrl+C)'
& $beatsPhp -S 0.0.0.0:8080 -t dist
