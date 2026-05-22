param(
    [string]$ZipPath = ""
)

$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $PSScriptRoot
$Parent = Split-Path -Parent $Root

if ([string]::IsNullOrWhiteSpace($ZipPath)) {
    $ZipPath = Join-Path $Parent "signova_practice_i_final.zip"
}

if (Test-Path $ZipPath) {
    Remove-Item -LiteralPath $ZipPath -Force
}

Compress-Archive -Path $Root -DestinationPath $ZipPath -Force
Get-Item $ZipPath | Select-Object FullName,Length

