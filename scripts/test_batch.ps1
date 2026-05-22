param(
    [Parameter(Mandatory = $true)][string]$DatasetRoot,
    [string]$ApiUrl = "http://127.0.0.1:8010",
    [string]$OutDir = "tests\batch_latest",
    [int]$NumWords = 10,
    [int]$CorrectPerWord = 2,
    [int]$WrongPerWord = 2,
    [int]$FrameStride = 2,
    [int]$MaxFrames = 64,
    [bool]$AutoSegment = $true,
    [int]$SegmentMinFrames = 12,
    [string]$SegmentMaxFrames = "",
    [int]$SegmentPadFrames = 8,
    [string]$Cam = "cam_1"
)

$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $PSScriptRoot
Set-Location $Root
$PythonExe = Join-Path $Root ".venv\Scripts\python.exe"
if (-not (Test-Path $PythonExe)) {
    $PythonExe = "python"
}

$ArgsList = @(
  "batch_inference_test.py",
  "--api-url", $ApiUrl,
  "--dataset-root", $DatasetRoot,
  "--out-dir", $OutDir,
  "--cam", $Cam,
  "--num-words", $NumWords,
  "--correct-per-word", $CorrectPerWord,
  "--wrong-per-word", $WrongPerWord,
  "--frame-stride", $FrameStride,
  "--max-frames", $MaxFrames,
  "--segment-min-frames", $SegmentMinFrames,
  "--segment-pad-frames", $SegmentPadFrames
)

if ($AutoSegment) {
  $ArgsList += "--auto-segment"
} else {
  $ArgsList += "--no-auto-segment"
}

if (-not [string]::IsNullOrWhiteSpace($SegmentMaxFrames)) {
  $ArgsList += @("--segment-max-frames", $SegmentMaxFrames)
}

& $PythonExe @ArgsList
