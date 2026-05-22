param(
    [Parameter(Mandatory = $true)][string]$DatasetRoot,
    [Parameter(Mandatory = $true)][string]$PoseRoot,
    [string]$OutFile = "outputs\unique_gloss_selection_400.json",
    [int]$NumGlosses = 10,
    [int]$SamplesPerGloss = 10,
    [int]$TargetLen = 40,
    [string]$Cam = "cam_1"
)

$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $PSScriptRoot
Set-Location $Root
$PythonExe = Join-Path $Root ".venv\Scripts\python.exe"
if (-not (Test-Path $PythonExe)) {
    $PythonExe = "python"
}

& $PythonExe select_unique_glosses.py `
  --dataset-root $DatasetRoot `
  --pose-root $PoseRoot `
  --cam $Cam `
  --out-file $OutFile `
  --num-glosses $NumGlosses `
  --samples-per-gloss $SamplesPerGloss `
  --target-len $TargetLen
