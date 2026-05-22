# SIGNOVA Practice I - Gói Final Top 30

Gói này là backend cho Practice I/II:

- `Practice I`: người dùng upload video ký hiệu, server extract pose bằng MediaPipe, tự cắt đúng đoạn người dùng đang luyện, so sánh với reference bank của từ mục tiêu, rồi trả feedback JSON + visualization payload để FE tự vẽ đỏ/xanh.
- `Practice II`: ngoài feedback kiểu Practice I, server dùng thêm sign classifier để đoán người dùng đang ký nhầm sang từ nào trong lesson set 5/10 từ, rồi trả `predicted_wrong_gloss` để frontend quay lại flow sửa theo target.

## 1. Nội Dung

```text
signova_practice_i_final/
  api.py
  signova_practice_i/
  scripts/
  outputs/
    reference_bank_30_unique_video_ref20_template/
    unique_gloss_selection_400_top30.json
  requirements_api.txt
  README.md
```

- `api.py`: FastAPI server cho Practice I/II.
- `signova_practice_i/`: extract video, auto-segment, normalize pose, scoring, sign classifier, visualization payload.
- `scripts/`: lệnh one-click để chạy API, inference, test batch, build bank, zip.
- `outputs/reference_bank_30_unique_video_ref20_template/`: bank final cho 30 từ.
- `reference_bank_manifest.json`: danh sách gloss, reference video và 3 topic.
- `reference_bank_tests.json`: validation nội bộ của bank.

## 2. Phương Pháp

Mỗi gloss lưu một template bank thay vì chỉ 1 video reference:

- `template_xy`: 20 trajectory mẫu đã normalize.
- `median_xy`: trajectory trung tâm để debug.
- `tolerance`: biên độ chấp nhận cho từng joint theo từng thời điểm.
- `reference_ids`: ID video dùng làm mẫu.

Khi user upload video:

1. Server extract pose bằng MediaPipe.
2. Tự tìm các đoạn tay hoạt động: wrist cao hơn vùng vai, wrist motion, lateral motion, confidence.
3. Merge các cụm active bị overlap trong cùng một attempt.
4. Nếu video có nhiều attempt, chọn đoạn khớp target bank tốt nhất và bỏ các đoạn outlier.
5. Normalize đoạn được chọn theo vai/ngực.
6. So với template gần nhất của target gloss.
7. Joint nào vượt tolerance thì FE tô đỏ ở user panel, joint đúng thì FE tô xanh ở reference panel.
8. API trả pose/alignment/error map/correction vectors để FE tự render.

Practice I dùng template bank vì cần feedback theo bộ phận cơ thể. Practice II dùng thêm pose-based classifier để bắt trường hợp người dùng ký nhầm sang từ khác trong lesson set.

Practice II trong repo hiện tại dùng thêm model ONNX SPOTER:

- input: video user + `target_gloss` + `lesson_glosses`
- output: top dự đoán trong lesson set, `predicted_wrong_gloss` nếu phát hiện ký nhầm
- feedback sửa vẫn dựa trên target bank giống Practice I để frontend tái dùng cùng flow correction

## 3. Bank Final Top 30

Bank final:

```text
outputs/reference_bank_30_unique_video_ref20_template
```

Thông số:

```text
gloss_count: 30
references_per_gloss: 20
total_reference_videos: 600
cam: cam_1
source: video_mediapipe_upload_pipeline
frame_stride: 2
max_frames: 64
target_len: 64
```

Selection được chọn từ 400 gloss bằng pose precomputed trong:

```text
C:\Users\ADMIN\Desktop\vsl_code\temp\vsl400_public\cam_1\*.pose
```

Tiêu chí chọn là greedy-farthest trên trajectory pose đã normalize, ưu tiên các từ ít giống nhau để giảm nhầm lẫn.

## 4. 3 Topic

### Đời sống & đồ vật

```text
Con chó
Quần đùi
Mũ
Tường
Dài
Mới
Vợ
Dụng cụ học tập
Mũ bảo hiểm
Con dê
```

### Thời gian & địa điểm

```text
Ngày Quốc tế Lao động
Hoàng hôn
Ngày Nhà giáo Việt Nam
Buổi tối
Thái Lan
Rạp chiếu phim
Bình minh
Buổi sáng
Trường Cao đẳng
Tháng mười
```

### Hành động & thể thao

```text
Nhân viên phục vụ
Múa
Làm bài tập
Giúp đỡ
Nhảy dây
Bóng rổ
Bơi lội
Cầu lông
Thấp (đồ vật)
Không nên
```

API có endpoint:

```text
GET /topics
```

Frontend nên dùng `/topics` để render lesson bank theo topic.

## 5. Kết Quả Validation

Validation nội bộ sau khi build bank top 30:

```text
same_accept_count: 58/60
different_reject_count: 58/60
same_avg_score: 94.4
different_avg_score: 55.58
```

Auto-segment smoke test trước đó:

```text
input video: 206 frames, gồm idle + 2 attempt
selected segment: source frame 22 -> 90
decision: accept_as_target=true, top1=Con chó
```

## 6. Cài Venv Và Dependencies

```powershell
cd "C:\Users\ADMIN\Desktop\vsl study\signova_practice_i_final"
.\scripts\setup_venv.ps1
```

Yêu cầu môi trường đã verify chạy ổn:

```text
Python 3.11
Windows PowerShell
```

Nếu muốn dựng lại sạch từ đầu:

```powershell
.\scripts\setup_venv.ps1 -Recreate
```

Nếu muốn tự cài tay:

```powershell
py -3.11 -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r requirements_api.txt
.\.venv\Scripts\python.exe -m pip check
```

## 7. Chạy API One-Click

```powershell
cd "C:\Users\ADMIN\Desktop\vsl study\signova_practice_i_final"
.\scripts\run_api.ps1
```

`run_api.ps1` sẽ tự ưu tiên dùng `.\.venv\Scripts\python.exe` nếu có.

Mặc định:

```text
http://127.0.0.1:8010/docs
```

Đổi port:

```powershell
.\scripts\run_api.ps1 -Port 8020
```

Chạy với bank khác:

```powershell
.\scripts\run_api.ps1 -BankRoot "outputs\reference_bank_custom"
```

Nếu model sign nằm ngoài repo, truyền thêm path:

```powershell
.\scripts\run_api.ps1 `
  -SignModelPath "D:\Project\MultiModel\App\models\spoter_v3.0.onnx" `
  -SignGlossCsvPath "D:\Project\MultiModel\App\gloss.csv"
```

## 8. Inference Một Video

Terminal 1:

```powershell
.\scripts\run_api.ps1
```

Terminal 2:

```powershell
.\scripts\infer_video.ps1 `
  -VideoPath "C:\path\to\video.mp4" `
  -TargetGloss "Con chó"
```

Tùy chỉnh:

```powershell
.\scripts\infer_video.ps1 `
  -VideoPath "C:\path\to\video.mp4" `
  -TargetGloss "Con chó" `
  -Port 8010 `
  -FrameStride 2 `
  -AutoSegment $true `
  -SegmentMinFrames 12 `
  -SegmentPadFrames 8
```

Ghi chú:

- Với video dài hoặc có nhiều lần làm, nên để `MaxFrames` trống để server thấy toàn bộ video rồi tự cắt.
- `SegmentPadFrames=8` giữ thêm đầu/cuối động tác sau khi phát hiện tay hoạt động.
- Nếu muốn ép đoạn cắt không quá dài, dùng `-SegmentMaxFrames 80`.

Gọi `Practice II` với lesson set 5 hoặc 10 từ:

```powershell
.\scripts\infer_video.ps1 `
  -VideoPath "C:\path\to\video.mp4" `
  -TargetGloss "Con chó" `
  -Mode practice_ii `
  -LessonGlosses "Con chó,Mũ,Dài,Mới,Vợ"
```

Response có các trường chính:

- `attempt_id`
- `score`
- `decision.accept_as_target`
- `decision.possible_wrong_word`
- `decision.wrong_word_detected`
- `decision.predicted_wrong_gloss`
- `segment.start_ms`
- `segment.end_ms`
- `feedback.main_errors`
- `visualization.user_pose`
- `visualization.reference_pose`
- `visualization.joint_status`
- `visualization.alignment`
- `visualization.correction_vectors`

## 9. API

### `GET /health`

Kiểm tra server và bank.

### `GET /glosses`

Trả danh sách 30 gloss đang hỗ trợ.

### `GET /topics`

Trả 3 topic, mỗi topic 10 gloss.

### `POST /practice-i/analyze-video`

Multipart form:

- `target_gloss`: từ mục tiêu.
- `video`: file `.mp4`.
- `lesson_glosses`: optional, nếu muốn chỉ rank trong một lesson set nhỏ.
- `frame_stride`: mặc định `1`.
- `max_frames`: optional, chỉ nên dùng để debug nhanh.
- `auto_segment`: mặc định `true`.
- `segment_min_frames`: mặc định `12`.
- `segment_max_frames`: optional.
- `segment_pad_frames`: mặc định `8`.
- `return_visualization`: mặc định `true`.

Ví dụ:

```powershell
curl.exe -X POST "http://127.0.0.1:8010/practice-i/analyze-video" `
  -F "target_gloss=Con chó" `
  -F "frame_stride=2" `
  -F "auto_segment=true" `
  -F "segment_pad_frames=8" `
  -F "return_visualization=true" `
  -F "video=@C:\path\to\video.mp4"
```

### `POST /practice-ii/analyze-video`

Multipart form:

- `target_gloss`: từ mục tiêu cần kiểm tra.
- `lesson_glosses`: danh sách gloss trong bài hiện tại, phân tách bằng dấu phẩy.
- `video`: file `.mp4`.
- các tham số segment giống `practice-i/analyze-video`.
- `classifier_top_k`: mặc định `3`.
- `wrong_word_min_lesson_score`: mặc định `0.45`.
- `wrong_word_min_margin`: mặc định `0.10`.
- `return_visualization`: mặc định `true`.

Ví dụ:

```powershell
curl.exe -X POST "http://127.0.0.1:8010/practice-ii/analyze-video" `
  -F "target_gloss=Con chó" `
  -F "lesson_glosses=Con chó,Mũ,Dài,Mới,Vợ" `
  -F "frame_stride=2" `
  -F "auto_segment=true" `
  -F "segment_pad_frames=8" `
  -F "return_visualization=true" `
  -F "video=@C:\path\to\video.mp4"
```

## 10. Chạy Batch Test

API phải đang chạy trước.

```powershell
.\scripts\test_batch.ps1 `
  -DatasetRoot "C:\Users\ADMIN\Desktop\vsl_code\temp\vsl400_public" `
  -ApiUrl "http://127.0.0.1:8010" `
  -OutDir "tests\batch_latest" `
  -NumWords 30
```

## 11. Build Lại Bank Top 30

Chọn lại 30 từ từ pose precomputed:

```powershell
python select_unique_glosses.py `
  --dataset-root "C:\Users\ADMIN\Desktop\vsl_code\temp\vsl400_public" `
  --pose-root "C:\Users\ADMIN\Desktop\vsl_code\temp\vsl400_public" `
  --cam cam_1 `
  --out-file outputs\unique_gloss_selection_400_top30.json `
  --num-glosses 30 `
  --samples-per-gloss 10 `
  --target-len 40
```

Build bank từ video upload pipeline:

```powershell
.\scripts\build_bank.ps1 `
  -DatasetRoot "C:\Users\ADMIN\Desktop\vsl_code\temp\vsl400_public" `
  -OutDir "outputs\reference_bank_30_unique_video_ref20_template" `
  -GlossFile "outputs\unique_gloss_selection_400_top30.json" `
  -ReferencesPerGloss 20
```

## 12. Thêm Từ Mới

Cách hiện tại là build lại bank với danh sách gloss mới.

```powershell
.\scripts\build_bank.ps1 `
  -DatasetRoot "C:\Users\ADMIN\Desktop\vsl_code\temp\vsl400_public" `
  -OutDir "outputs\reference_bank_custom" `
  -Glosses "Con chó,Mũ,Dài,Bia" `
  -ReferencesPerGloss 20
```

Sau đó chạy API với bank mới:

```powershell
.\scripts\run_api.ps1 -BankRoot "outputs\reference_bank_custom"
```

## 13. Zip Lại Gói Final

```powershell
.\scripts\zip_final.ps1
```

Mặc định tạo:

```text
C:\Users\ADMIN\Desktop\vsl study\signova_practice_i_final.zip
```

## 14. Ghi Chú Kỹ Thuật

- Auto-segment là heuristic dựa trên tay lên/tay xuống và chuyển động cổ tay, sau đó dùng target bank để chọn attempt tốt nhất.
- Nếu người dùng đứng quá lệch camera hoặc MediaPipe mất wrist liên tục, segment có thể ngắn. Khi đó tăng `SegmentPadFrames` hoặc yêu cầu quay rõ nửa thân trên.
- Backend không render overlay video. FE/mobile nên dùng `visualization` payload để vẽ user panel và reference panel.
