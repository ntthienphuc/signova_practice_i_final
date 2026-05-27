param(
    [int]$Port = 5175
)

$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $PSScriptRoot
$WebRoot = Join-Path $Root "web"
Set-Location $WebRoot

if (-not (Test-Path (Join-Path $WebRoot "node_modules"))) {
    npm install
}

Write-Host "Web dev server: http://localhost:$Port (also accessible via local network IP)"
npm run dev -- --host --port $Port
