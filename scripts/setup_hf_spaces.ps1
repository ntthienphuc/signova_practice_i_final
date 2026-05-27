# Setup HuggingFace Spaces Deployment
# This helps deploy SIGNOVA backend to HF Spaces

Write-Host "🚀 SIGNOVA HuggingFace Spaces Deployment Setup" -ForegroundColor Cyan
Write-Host ""

# Check git status
Write-Host "📋 Checking git status..." -ForegroundColor Yellow
$status = git status --porcelain
if ($status) {
    Write-Host "⚠️  You have uncommitted changes:" -ForegroundColor Red
    Write-Host $status
    Write-Host ""
    Write-Host "Please commit or stash your changes first:" -ForegroundColor Yellow
    Write-Host "  git add . && git commit -m 'your message'" -ForegroundColor Gray
    exit 1
}

Write-Host "✓ Git status is clean" -ForegroundColor Green
Write-Host ""

# Check if git history contains large files
Write-Host "🔍 Checking git history for large files..." -ForegroundColor Yellow
$largeFiles = @()
git rev-list --all --objects | ForEach-Object {
    $size = $_.split(' ')[0] | xargs -I{} git cat-file -s {} 2>$null
    if ($size -gt 10000000) {  # > 10MB
        $largeFiles += $_
    }
}

if ($largeFiles.Count -gt 0) {
    Write-Host "⚠️  Found large files in git history (HF won't accept these):" -ForegroundColor Red
    $largeFiles | ForEach-Object { Write-Host "  - $_" }
    Write-Host ""
    Write-Host "📖 See HF_SPACES_SETUP.md for cleanup instructions" -ForegroundColor Yellow
} else {
    Write-Host "✓ No large files found" -ForegroundColor Green
}

Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Read HF_SPACES_SETUP.md for complete instructions"
Write-Host "2. Try git push: git push huggingface core_practice:main"
Write-Host "3. If push fails, upload model via HF Spaces 'Files' tab"
Write-Host "4. Access your backend at: https://thienphuc12339-signova-backend.hf.space"
Write-Host ""
Write-Host "📚 Documentation: HF_SPACES_SETUP.md"
