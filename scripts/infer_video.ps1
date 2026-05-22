param(
    [Parameter(Mandatory = $true)][string]$VideoPath,
    [Parameter(Mandatory = $true)][string]$TargetGloss,
    [ValidateSet("practice_i", "practice_ii")][string]$Mode = "practice_i",
    [string]$LessonGlosses = "",
    [int]$Port = 8010,
    [int]$FrameStride = 2,
    [string]$MaxFrames = "",
    [bool]$AutoSegment = $true,
    [int]$SegmentMinFrames = 12,
    [string]$SegmentMaxFrames = "",
    [int]$SegmentPadFrames = 8,
    [int]$ClassifierTopK = 3,
    [double]$WrongWordMinLessonScore = 0.45,
    [double]$WrongWordMinMargin = 0.10
)

$ErrorActionPreference = "Stop"

if (-not (Test-Path $VideoPath)) {
    throw "Không tìm thấy video: $VideoPath"
}

$Url = "http://127.0.0.1:$Port/$($Mode.Replace('_','-'))/analyze-video"
Write-Host "Gửi video lên API: $Url"

$Form = @(
    "-F", "target_gloss=$TargetGloss",
    "-F", "frame_stride=$FrameStride",
    "-F", "auto_segment=$($AutoSegment.ToString().ToLower())",
    "-F", "segment_min_frames=$SegmentMinFrames",
    "-F", "segment_pad_frames=$SegmentPadFrames",
    "-F", "return_visualization=true",
    "-F", "video=@$VideoPath"
)

if (-not [string]::IsNullOrWhiteSpace($LessonGlosses)) {
    $Form += @("-F", "lesson_glosses=$LessonGlosses")
}

if (-not [string]::IsNullOrWhiteSpace($MaxFrames)) {
    $Form += @("-F", "max_frames=$MaxFrames")
}

if (-not [string]::IsNullOrWhiteSpace($SegmentMaxFrames)) {
    $Form += @("-F", "segment_max_frames=$SegmentMaxFrames")
}

if ($Mode -eq "practice_ii") {
    $Form += @(
        "-F", "classifier_top_k=$ClassifierTopK",
        "-F", "wrong_word_min_lesson_score=$WrongWordMinLessonScore",
        "-F", "wrong_word_min_margin=$WrongWordMinMargin"
    )
}

curl.exe -X POST $Url @Form
