param(
    [string]$PythonVersion = "3.11",
    [switch]$Recreate
)

$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $PSScriptRoot
Set-Location $Root

$VenvDir = Join-Path $Root ".venv"
$PythonExe = Join-Path $VenvDir "Scripts\python.exe"

if ($Recreate -and (Test-Path $VenvDir)) {
    Write-Host "Xoá .venv cũ tại: $VenvDir"
    Remove-Item -LiteralPath $VenvDir -Recurse -Force
}

if (-not (Test-Path $PythonExe)) {
    Write-Host "Tạo .venv bằng Python $PythonVersion"
    py -$PythonVersion -m venv $VenvDir
}

if (-not (Test-Path $PythonExe)) {
    throw "Không tạo được .venv tại $VenvDir"
}

Write-Host "Cài requirements_api.txt vào .venv"
& $PythonExe -m pip install -r requirements_api.txt

Write-Host "Kiểm tra dependency"
& $PythonExe -m pip check

Write-Host ""
Write-Host "Sẵn sàng chạy API:"
Write-Host "  .\\scripts\\run_api.ps1"
