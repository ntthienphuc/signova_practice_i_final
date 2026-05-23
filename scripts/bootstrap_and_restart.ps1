param(
    [int]$ApiPort = 8014,
    [int]$WebPort = 5175,
    [string]$SignModelPath = "",
    [string]$SignGlossCsvPath = "",
    [string]$BankRoot = "",
    [string]$PythonVersion = "3.11",
    [switch]$RecreateVenv,
    [switch]$ReinstallWeb
)

$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $PSScriptRoot
Set-Location $Root

$pythonExe = Join-Path $Root ".venv\Scripts\python.exe"
$nodeModules = Join-Path $Root "web\node_modules"

function Require-Command {
    param(
        [string]$Name,
        [string]$HelpText
    )

    if (-not (Get-Command $Name -ErrorAction SilentlyContinue)) {
        throw "$Name chưa có trên máy. $HelpText"
    }
}

Write-Host "Preparing Signova workspace..."

Require-Command -Name "py" -HelpText "Hãy cài Python 3.11 và bảo đảm lệnh 'py' dùng được."
Require-Command -Name "npm" -HelpText "Hãy cài Node.js LTS để có npm."

if ($RecreateVenv -or -not (Test-Path $pythonExe)) {
    Write-Host "Setting up Python virtual environment..."
    $setupArgs = @(
        "-ExecutionPolicy", "Bypass",
        "-File", (Join-Path $Root "scripts\setup_venv.ps1"),
        "-PythonVersion", $PythonVersion
    )
    if ($RecreateVenv) {
        $setupArgs += "-Recreate"
    }
    & powershell @setupArgs
}
else {
    Write-Host ".venv already exists. Skipping Python install."
}

if ($ReinstallWeb -and (Test-Path $nodeModules)) {
    Write-Host "Removing existing web/node_modules ..."
    Remove-Item -LiteralPath $nodeModules -Recurse -Force
}

if (-not (Test-Path $nodeModules)) {
    Write-Host "Installing web dependencies with npm ci..."
    Push-Location (Join-Path $Root "web")
    try {
        npm ci
    }
    finally {
        Pop-Location
    }
}
else {
    Write-Host "web/node_modules already exists. Skipping npm install."
}

Write-Host "Starting Signova stack..."

$restartArgs = @(
    "-ExecutionPolicy", "Bypass",
    "-File", (Join-Path $Root "scripts\restart_stack.ps1"),
    "-ApiPort", $ApiPort,
    "-WebPort", $WebPort
)
if (-not [string]::IsNullOrWhiteSpace($BankRoot)) {
    $restartArgs += @("-BankRoot", $BankRoot)
}
if (-not [string]::IsNullOrWhiteSpace($SignModelPath)) {
    $restartArgs += @("-SignModelPath", $SignModelPath)
}
if (-not [string]::IsNullOrWhiteSpace($SignGlossCsvPath)) {
    $restartArgs += @("-SignGlossCsvPath", $SignGlossCsvPath)
}

& powershell @restartArgs
