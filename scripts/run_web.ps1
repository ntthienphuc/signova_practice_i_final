param(
    [int]$Port = 5173
)

$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $PSScriptRoot
$WebRoot = Join-Path $Root "web"
Set-Location $WebRoot

if (-not (Test-Path (Join-Path $WebRoot "node_modules"))) {
    npm install
}

Write-Host "Web dev server: http://127.0.0.1:$Port"
npm run dev -- --host 127.0.0.1 --port $Port
