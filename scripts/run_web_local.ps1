# run_web_local.ps1 - Run web connecting to LOCAL backend
# Usage: .\run_web_local.ps1

Write-Host "🚀 Starting SIGNOVA Web (Local Backend Mode)" -ForegroundColor Cyan
Write-Host "📡 Backend URL: http://127.0.0.1:8010" -ForegroundColor Green
Write-Host "🌐 Web will be available at: http://127.0.0.1:5173" -ForegroundColor Green
Write-Host ""
Write-Host "⚠️  Make sure backend is running with: .\run_api.ps1" -ForegroundColor Yellow
Write-Host ""

# Set environment variable for local backend
$env:VITE_API_BASE_URL = "http://127.0.0.1:8010"

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
