param(
    [int]$ApiPort = 8014,
    [int]$WebPort = 5175,
    [string]$SignModelPath = "",
    [string]$SignGlossCsvPath = "",
    [string]$BankRoot = ""
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

Write-Host "Starting API on http://127.0.0.1:$ApiPort ..."
Start-Process powershell -ArgumentList $apiArgs

Start-Sleep -Seconds 2

Write-Host "Starting Web on http://127.0.0.1:$WebPort ..."
Start-Process powershell -ArgumentList $webArgs

Write-Host ""
Write-Host "Restart complete."
Write-Host "API docs: http://127.0.0.1:$ApiPort/docs"
Write-Host "Web:      http://127.0.0.1:$WebPort"
