param(
    [int]$Port = 8010,
    [string]$BankRoot = "",
    [string]$SignModelPath = "",
    [string]$SignGlossCsvPath = ""
)

$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $PSScriptRoot
Set-Location $Root
$PythonExe = Join-Path $Root ".venv\Scripts\python.exe"
if (-not (Test-Path $PythonExe)) {
    $PythonExe = "python"
}

if ([string]::IsNullOrWhiteSpace($BankRoot)) {
    $Best20Bank = Join-Path $Root "outputs\reference_bank_20_best_allcam1_fe"
    if (Test-Path $Best20Bank) {
        $BankRoot = $Best20Bank
    }
    else {
        $BankRoot = Join-Path $Root "outputs\reference_bank_30_unique_video_ref20_template"
    }
}

if (-not (Test-Path $BankRoot)) {
    throw "Không tìm thấy bank: $BankRoot"
}

$env:SIGNOVA_BANK_ROOT = $BankRoot
if (-not [string]::IsNullOrWhiteSpace($SignModelPath)) {
    $env:SIGNOVA_SIGN_MODEL_PATH = $SignModelPath
}
if (-not [string]::IsNullOrWhiteSpace($SignGlossCsvPath)) {
    $env:SIGNOVA_SIGN_GLOSS_CSV = $SignGlossCsvPath
}
Write-Host "SIGNOVA_BANK_ROOT=$env:SIGNOVA_BANK_ROOT"
if ($env:SIGNOVA_SIGN_MODEL_PATH) {
    Write-Host "SIGNOVA_SIGN_MODEL_PATH=$env:SIGNOVA_SIGN_MODEL_PATH"
}
if ($env:SIGNOVA_SIGN_GLOSS_CSV) {
    Write-Host "SIGNOVA_SIGN_GLOSS_CSV=$env:SIGNOVA_SIGN_GLOSS_CSV"
}
Write-Host "API docs: http://127.0.0.1:$Port/docs"
& $PythonExe -m uvicorn api:app --host 127.0.0.1 --port $Port
