param(
    [Parameter(Mandatory = $true)][string]$DatasetRoot,
    [string]$OutDir = "outputs\reference_bank_custom",
    [string]$Glosses = "",
    [string]$GlossFile = "outputs\unique_gloss_selection_400.json",
    [int]$ReferencesPerGloss = 20,
    [int]$FrameStride = 2,
    [int]$MaxFrames = 64,
    [int]$TargetLen = 64,
    [string]$Cam = "cam_1"
)

$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $PSScriptRoot
Set-Location $Root
$PythonExe = Join-Path $Root ".venv\Scripts\python.exe"
if (-not (Test-Path $PythonExe)) {
    $PythonExe = "python"
}

if (-not (Test-Path $DatasetRoot)) {
    throw "Không tìm thấy dataset root: $DatasetRoot"
}

$ArgsList = @(
    "build_video_reference_bank.py",
    "--dataset-root", $DatasetRoot,
    "--cam", $Cam,
    "--out-dir", $OutDir,
    "--references-per-gloss", "$ReferencesPerGloss",
    "--target-len", "$TargetLen",
    "--frame-stride", "$FrameStride",
    "--max-frames", "$MaxFrames"
)

if (-not [string]::IsNullOrWhiteSpace($Glosses)) {
    $ArgsList += @("--glosses", $Glosses)
} else {
    $ArgsList += @("--gloss-file", $GlossFile)
}

& $PythonExe @ArgsList

Write-Host ""
Write-Host "Build xong bank: $OutDir"
Write-Host "Chạy API với bank này:"
Write-Host "  .\scripts\run_api.ps1 -BankRoot `"$OutDir`""
