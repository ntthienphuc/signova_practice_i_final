# run_web_remote.ps1 - Run web with API URL from .env.local
# Usage: .\run_web_remote.ps1

Write-Host "🚀 Starting SIGNOVA Web" -ForegroundColor Cyan

# Read API URL from web/.env.local
$envFile = Join-Path (Get-Location) "web" ".env.local"
if (-not (Test-Path $envFile)) {
    Write-Host "❌ Error: $envFile not found" -ForegroundColor Red
    exit 1
}

# Extract VITE_API_BASE_URL from .env.local
$apiUrl = Get-Content $envFile | Where-Object { $_ -match "^VITE_API_BASE_URL" } | ForEach-Object { $_.Split("=")[1].Trim() }

if (-not $apiUrl) {
    Write-Host "❌ Error: VITE_API_BASE_URL not found in $envFile" -ForegroundColor Red
    exit 1
}

Write-Host "📡 Backend URL: $apiUrl" -ForegroundColor Green
Write-Host "🌐 Web will be available at: http://127.0.0.1:5173" -ForegroundColor Green
Write-Host ""

# Set environment variable from .env.local
$env:VITE_API_BASE_URL = $apiUrl

# Navigate to web directory
Push-Location web

# Install dependencies if needed
if (-not (Test-Path "node_modules")) {
    Write-Host "📦 Installing dependencies..." -ForegroundColor Cyan
    npm install
}

# Run dev server
npm run dev

Pop-Location
