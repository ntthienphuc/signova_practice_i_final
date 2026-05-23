# run_web_remote.ps1 - Run web connecting to REMOTE HuggingFace Spaces backend
# Usage: .\run_web_remote.ps1

Write-Host "🚀 Starting SIGNOVA Web (Remote HuggingFace Backend Mode)" -ForegroundColor Cyan
Write-Host "📡 Backend URL: https://thienphuc12339-signova-backend.hf.space" -ForegroundColor Green
Write-Host "🌐 Web will be available at: http://127.0.0.1:5173" -ForegroundColor Green
Write-Host ""
Write-Host "⚠️  Using remote backend - no need to run local API" -ForegroundColor Yellow
Write-Host ""

# Set environment variable for remote backend
$env:VITE_API_BASE_URL = "https://thienphuc12339-signova-backend.hf.space"

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
