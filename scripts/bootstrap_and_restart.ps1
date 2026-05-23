param(
    [int]$ApiPort = 8014,
    [int]$WebPort = 5175,
    [string]$SignModelPath = "",
    [string]$SignGlossCsvPath = "",
    [string]$BankRoot = "",
    [string]$PythonVersion = "3.11",
    [switch]$RecreateVenv,
    [switch]$ReinstallWeb,
    [switch]$KeepDb
)

$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $PSScriptRoot
Set-Location $Root

$pythonExe = Join-Path $Root ".venv\Scripts\python.exe"
$nodeModules = Join-Path $Root "web\node_modules"
$requirementsCheckScript = @'
from importlib.metadata import PackageNotFoundError, version
from pathlib import Path
import sys

try:
    from packaging.requirements import Requirement
except Exception:
    print("missing:packaging")
    sys.exit(1)

req_path = Path("requirements_api.txt")
missing = []

for raw_line in req_path.read_text(encoding="utf-8").splitlines():
    line = raw_line.strip()
    if not line or line.startswith("#"):
        continue
    req = Requirement(line)
    try:
        installed = version(req.name)
    except PackageNotFoundError:
        missing.append(f"{req.name} (not installed)")
        continue
    if req.specifier and installed not in req.specifier:
        missing.append(f"{req.name}=={installed} !~ {req.specifier}")

if missing:
    print("requirements-mismatch")
    for item in missing:
        print(item)
    sys.exit(1)

print("requirements-ok")
'@

function Require-Command {
    param(
        [string]$Name,
        [string]$HelpText
    )

    if (-not (Get-Command $Name -ErrorAction SilentlyContinue)) {
        throw "$Name chưa có trên máy. $HelpText"
    }
}

function Test-PythonEnvironment {
    param([string]$PythonPath)

    if (-not (Test-Path $PythonPath)) {
        return $false
    }

    $tempFile = Join-Path $env:TEMP "signova_requirements_check.py"
    Set-Content -LiteralPath $tempFile -Value $requirementsCheckScript -Encoding UTF8

    try {
        & $PythonPath $tempFile | Out-Host
        if ($LASTEXITCODE -ne 0) {
            return $false
        }

        & $PythonPath -m pip check | Out-Host
        if ($LASTEXITCODE -ne 0) {
            return $false
        }

        return $true
    }
    finally {
        Remove-Item -LiteralPath $tempFile -ErrorAction SilentlyContinue
    }
}

Write-Host "Preparing Signova workspace..."

Require-Command -Name "py" -HelpText "Hãy cài Python 3.11 và bảo đảm lệnh 'py' dùng được."
Require-Command -Name "npm" -HelpText "Hãy cài Node.js LTS để có npm."

if ($RecreateVenv -or -not (Test-PythonEnvironment -PythonPath $pythonExe)) {
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
    Write-Host ".venv is ready and dependencies match. Skipping Python install."
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
if ($KeepDb) {
    $restartArgs += "-KeepDb"
}

& powershell @restartArgs
