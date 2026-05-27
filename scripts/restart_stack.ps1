param(
    [int]$ApiPort = 8014,
    [int]$WebPort = 5175,
    [string]$SignModelPath = "",
    [string]$SignGlossCsvPath = "",
    [string]$BankRoot = "",
    [switch]$KeepDb
)

$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $PSScriptRoot
Set-Location $Root

function Stop-PortListeners {
    param([int[]]$Ports)

    $listeners = Get-NetTCPConnection -LocalPort $Ports -State Listen -ErrorAction SilentlyContinue
    if (-not $listeners) {
        return
    }

    $pids = $listeners | Select-Object -ExpandProperty OwningProcess -Unique
    foreach ($procId in $pids) {
        try {
            $proc = Get-Process -Id $procId -ErrorAction Stop
            Write-Host "Stopping PID $procId ($($proc.ProcessName))"
            Stop-Process -Id $procId -Force -ErrorAction Stop
        }
        catch {
            Write-Warning "Cannot stop PID ${procId}: $($_.Exception.Message)"
        }
    }
}

Write-Host "Cleaning old listeners on ports $ApiPort and $WebPort ..."
Stop-PortListeners -Ports @($ApiPort, $WebPort)
Start-Sleep -Seconds 1

if (-not $KeepDb) {
    Write-Host "Cleaning database signova.db if exists..."
    $dbFile = Join-Path $Root "signova.db"
    if (Test-Path $dbFile) {
        Remove-Item -Path $dbFile -Force
        Write-Host "Deleted existing signova.db"
    }
} else {
    Write-Host "Keeping existing database signova.db."
}

Write-Host "Running database migrations..."
$alembicExe = Join-Path $Root ".venv\Scripts\alembic.exe"
& $alembicExe upgrade head

Write-Host "Seeding curriculum and default badges..."
$pythonExe = Join-Path $Root ".venv\Scripts\python.exe"
$seedScript = Join-Path $Root "scripts\seed_curriculum.py"
& $pythonExe $seedScript

$apiArgs = @(
    "-NoExit",
    "-ExecutionPolicy", "Bypass",
    "-File", (Join-Path $Root "scripts\run_api.ps1"),
    "-Port", $ApiPort
)
if (-not [string]::IsNullOrWhiteSpace($BankRoot)) {
    $apiArgs += @("-BankRoot", $BankRoot)
}
if (-not [string]::IsNullOrWhiteSpace($SignModelPath)) {
    $apiArgs += @("-SignModelPath", $SignModelPath)
}
if (-not [string]::IsNullOrWhiteSpace($SignGlossCsvPath)) {
    $apiArgs += @("-SignGlossCsvPath", $SignGlossCsvPath)
}

$webArgs = @(
    "-NoExit",
    "-ExecutionPolicy", "Bypass",
    "-File", (Join-Path $Root "scripts\run_web.ps1"),
    "-Port", $WebPort
)

Write-Host "Starting API on http://localhost:$ApiPort (also on local network)..."
Start-Process powershell -ArgumentList $apiArgs

Start-Sleep -Seconds 2

Write-Host "Starting Web on http://localhost:$WebPort (accessible from network)..."
Start-Process powershell -ArgumentList $webArgs

Write-Host ""
Write-Host "Restart complete."
Write-Host "API docs: http://localhost:$ApiPort/docs"
Write-Host "Web:      http://localhost:$WebPort  (use your LAN IP for mobile access)"
