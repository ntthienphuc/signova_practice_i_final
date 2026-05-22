# SIGNOVA Practice I/II - Bank 20 Glosses

Repo này là bản backend + web demo cho 2 flow:

- `Practice I`: người dùng luyện đúng 1 gloss mục tiêu, upload video, server tự cắt đoạn ký hiệu chính, chấm với bank reference và trả feedback để frontend vẽ đỏ/xanh.
- `Practice II`: người dùng làm bài trong lesson 5 hoặc 10 từ, server vừa chấm theo target gloss vừa dùng classifier để bắt trường hợp ký nhầm sang từ khác trong lesson.

Phiên bản hiện tại mặc định chạy với **bank 20 gloss tốt nhất** ở:

```text
outputs/reference_bank_20_best_allcam1_fe
```

## 1. Repo Này Có Gì

```text
signova_practice_i_final/
  api.py
  signova_practice_i/
  web/
  scripts/
  outputs/
    reference_bank_20_best_allcam1_fe/
    reference_bank_30_unique_video_ref20_template/
```

Thành phần chính:

- `api.py`: FastAPI app cho Practice I/II.
- `signova_practice_i/`: AI core gồm extract pose, auto-segment, scoring, classifier, payload visualization.
- `web/`: React + Vite demo frontend.
- `scripts/run_api.ps1`: chạy API.
- `scripts/run_web.ps1`: chạy web demo.
- `scripts/setup_venv.ps1`: tạo `.venv` và cài dependency.
- `scripts/infer_video.ps1`: gọi API nhanh bằng PowerShell.
- `scripts/test_all_cam1_api.py`: batch test HTTP trên dataset local.

## 2. Bank 20 Glosses

Bank mặc định hiện tại có 20 gloss:

```text
Làm bài tập
Không nên
Tường
Mới
Cầu lông
Thái Lan
Trường Cao đẳng
Con chó
Quần đùi
Nhân viên phục vụ
Tháng mười
Buổi tối
Mũ
Nhảy dây
Bơi lội
Ngày Quốc tế Lao động
Hoàng hôn
Dài
Dụng cụ học tập
Giúp đỡ
```

Manifest:

- [reference_bank_manifest.json](/d:/signova_practice_i_final/outputs/reference_bank_20_best_allcam1_fe/reference_bank_manifest.json)
- [display_reference_manifest.json](/d:/signova_practice_i_final/outputs/reference_bank_20_best_allcam1_fe/display_reference_manifest.json)

Thông số bank:

```text
cam: cam_1
frame_stride: 2
max_frames: 64
target_len: 64
references_per_gloss: 20
gloss_count: 20
```

`display_reference_manifest.json` map mỗi gloss tới 1 clip reference để frontend phát ở panel phải.

## 3. Kiến Trúc Hiện Tại

Flow chính:

1. FE chọn task random hoặc nhập `target_gloss`.
2. FE upload video lên API.
3. Backend extract pose bằng MediaPipe Holistic.
4. Backend tự cắt đoạn ký hiệu chính bằng heuristic hoạt động tay.
5. Backend normalize + resample pose để chấm với bank.
6. Backend trả:
   - score
   - decision
   - segment timing
   - overlay compact payload
   - reference video URL / playback URL
7. FE tự seek video user/reference theo thời gian do API trả và tự vẽ overlay.

Điểm quan trọng:

- Backend **không render overlay video**.
- Backend **không bắt FE phải extract landmark**.
- FE chỉ cần upload video, nhận JSON, phát video và vẽ canvas overlay.

## 4. Practice I Và Practice II

### Practice I

Input:

- `target_gloss`
- `video`

Output chính:

- `score`
- `decision.accept_as_target`
- `decision.possible_wrong_word`
- `feedback.main_errors`
- `segment`
- `overlay`
- `playback`

### Practice II

Input:

- `target_gloss`
- `lesson_glosses`
- `video`

Output thêm:

- `decision.wrong_word_detected`
- `decision.predicted_wrong_gloss`

Ý nghĩa:

- nếu người dùng ký đúng target nhưng hơi lệch, server trả feedback kiểu Practice I
- nếu người dùng ký nhầm hẳn sang gloss khác trong lesson, server cố đoán gloss nhầm đó để FE quay lại flow sửa đúng target

## 5. API Contract

### `GET /health`

Kiểm tra server đang lên, bank nào đang active, classifier đã sẵn sàng chưa.

### `GET /app-config`

Trả config FE cần dùng:

- gloss list
- topic list
- random lesson sizes
- render mode hiện tại

### `GET /glosses`

Trả danh sách gloss đang active trong bank.

### `GET /topics`

Trả topic list từ manifest bank. Với bank 20 hiện tại có 1 topic:

```text
Best 20 Glosses
```

### `GET /practice-i/task/random`

Random 1 target gloss cho Practice I.

### `GET /practice-ii/task/random?lesson_size=5`

Random 1 lesson set cho Practice II.

### `GET /reference-video/{gloss}`

Trả clip reference gốc cho gloss.

### `GET /playback/reference/{gloss}`

Trả clip reference đã transcode H.264 để browser phát ổn định.

### `GET /playback/attempt/{attempt_id}`

Trả clip upload của user đã transcode H.264 để FE preview ổn định.

### `POST /practice-i/analyze-video`

Multipart form:

- `target_gloss`
- `video`
- `lesson_glosses`: optional
- `frame_stride`: mặc định `2`
- `max_frames`: optional
- `auto_segment`: mặc định `true`
- `segment_min_frames`: mặc định `12`
- `segment_max_frames`: optional
- `segment_pad_frames`: mặc định `8`
- `overlay_frame_count`: mặc định `32`
- `return_visualization`: mặc định `false`

### `POST /practice-ii/analyze-video`

Giống Practice I nhưng thêm:

- `lesson_glosses`
- `classifier_top_k`
- `wrong_word_min_lesson_score`
- `wrong_word_min_margin`

### Legacy aliases

Hai route cũ vẫn còn để tương thích:

- `POST /practice-i/video`
- `POST /practice-ii/video`

## 6. Response Quan Trọng Nhất

### `segment`

Thời gian đoạn ký hiệu chính trong video user:

```json
{
  "start_ms": 133,
  "end_ms": 2469
}
```

FE dùng dữ liệu này để seek video user.

### `reference.segment`

Thời gian đoạn tương ứng trong video reference.

FE dùng để seek panel phải.

### `playback`

Chứa:

- `user_video_url`
- `reference_video_url`
- `user_segment`
- `reference_segment`

### `overlay`

Compact payload để FE vẽ:

- `joint_names`
- `connections`
- `user_frames`
- `reference_frames`
- `bad_joint_indices`

Payload này nhẹ hơn `visualization`.

### `visualization`

Payload đầy đủ hơn, phục vụ debug / analysis:

- `user_pose`
- `reference_pose`
- `joint_status`
- `alignment`
- `correction_vectors`

Web demo hiện tại chủ yếu dùng `overlay + playback`.

## 7. Cài Môi Trường

Yêu cầu:

```text
Python 3.11
Node.js + npm
Windows PowerShell
```

Setup nhanh:

```powershell
.\scripts\setup_venv.ps1
```

Nếu muốn dựng lại sạch:

```powershell
.\scripts\setup_venv.ps1 -Recreate
```

## 8. Chạy API

Mặc định script sẽ ưu tiên bank 20 gloss:

```powershell
.\scripts\run_api.ps1
```

Mặc định:

```text
http://127.0.0.1:8010/docs
```

Đổi port:

```powershell
.\scripts\run_api.ps1 -Port 8014
```

Chạy với sign model ngoài repo:

```powershell
.\scripts\run_api.ps1 `
  -Port 8014 `
  -SignModelPath "D:\Project\MultiModel\App\models\spoter_v3.0.onnx" `
  -SignGlossCsvPath "D:\Project\MultiModel\App\gloss.csv"
```

Chạy với bank khác:

```powershell
.\scripts\run_api.ps1 -BankRoot "outputs\reference_bank_30_unique_video_ref20_template"
```

## 9. Chạy Web Demo

```powershell
.\scripts\run_web.ps1 -Port 5175
```

Mở:

```text
http://127.0.0.1:5175
```

Web demo hỗ trợ:

- Practice I
- Practice II
- random task
- upload video
- play segment theo timing từ API
- panel trái user, panel phải reference
- overlay skeleton đỏ/xanh

## 10. Chạy End-to-End Nhanh

Terminal 1:

```powershell
.\scripts\run_api.ps1 -Port 8014 `
  -SignModelPath "D:\Project\MultiModel\App\models\spoter_v3.0.onnx" `
  -SignGlossCsvPath "D:\Project\MultiModel\App\gloss.csv"
```

Terminal 2:

```powershell
.\scripts\run_web.ps1 -Port 5175
```

Sau đó:

1. mở web
2. chọn `Practice I` hoặc `Practice II`
3. bấm `Random`
4. upload video
5. bấm `Upload Và Phân Tích`
6. bấm `Play Segment`

## 11. Gọi API Bằng Script

Ví dụ Practice I:

```powershell
.\scripts\infer_video.ps1 `
  -VideoPath "C:\path\to\video.mp4" `
  -TargetGloss "Mũ" `
  -Port 8014
```

Ví dụ Practice II:

```powershell
.\scripts\infer_video.ps1 `
  -VideoPath "C:\path\to\video.mp4" `
  -TargetGloss "Mũ" `
  -Mode practice_ii `
  -LessonGlosses "Mũ,Cầu lông,Con chó,Thái Lan,Mới" `
  -Port 8014
```

## 12. Batch Test

Batch test HTTP trên dataset local:

```powershell
.\.venv\Scripts\python.exe .\scripts\test_all_cam1_api.py `
  --api-url http://127.0.0.1:8014 `
  --manifest-path outputs\reference_bank_20_best_allcam1_fe\reference_bank_manifest.json `
  --out-dir tests\all_cam1_api_compact_http_140_fs2 `
  --frame-stride 2 `
  --overlay-frame-count 24 `
  --check-reference-routes
```

Script này dùng để:

- test Practice I
- test Practice II lesson 5
- test Practice II lesson 10
- đo latency
- đo payload size
- kiểm tra route reference video

## 13. Build Lại Bank 20 Gloss

Script chọn bank 20 tốt nhất:

```powershell
.\.venv\Scripts\python.exe .\scripts\build_best20_bank.py
```

Repo cũng vẫn giữ bank top 30 cũ để tham khảo:

```text
outputs/reference_bank_30_unique_video_ref20_template
```

## 14. FE Simulator Export

Script mô phỏng FE và export video side-by-side:

```powershell
.\.venv\Scripts\python.exe .\scripts\fe_simulate_export.py `
  --api-url http://127.0.0.1:8014 `
  --mode practice_i `
  --target-gloss "Làm bài tập" `
  --video-path "All_cam1\021128.mp4"
```

Output gồm:

- `user_overlay.mp4`
- `reference_overlay.mp4`
- `fe_side_by_side.mp4`
- `api_response.json`

## 15. Dữ Liệu Và Reference

Bank dùng để chấm và clip dùng để hiển thị là hai thứ khác nhau:

- `bank_path`: pose/template/tolerance để scoring
- `display_reference_manifest.json`: chọn 1 clip reference “đẹp” để FE phát ở panel phải

Điều này quan trọng vì:

- scoring cần nhiều reference
- FE chỉ cần 1 clip minh họa tốt nhất

## 16. Lưu Ý Kỹ Thuật

- Dataset `All_cam1` trong máy local không bắt buộc để chạy API nếu bank đã build sẵn, nhưng hiện display reference của bank 20 đang trỏ vào clip trong `All_cam1`.
- Browser không phát ổn định `mp4v/mpeg4` gốc, nên backend có route playback H.264 riêng.
- Auto-segment là heuristic, không phải alignment học máy full.
- `frame_stride=2` hiện là cấu hình tốt nhất đã test cho bank 20.
- Backend hiện tối ưu cho flow upload video, chưa tối ưu cho realtime streaming.

## 17. Glosses Hiện Active

Danh sách active gloss FE sẽ thấy từ `/app-config`:

```text
Làm bài tập
Không nên
Tường
Mới
Cầu lông
Thái Lan
Trường Cao đẳng
Con chó
Quần đùi
Nhân viên phục vụ
Tháng mười
Buổi tối
Mũ
Nhảy dây
Bơi lội
Ngày Quốc tế Lao động
Hoàng hôn
Dài
Dụng cụ học tập
Giúp đỡ
```

## 18. File Quan Trọng Nên Xem Trước

- [api.py](/d:/signova_practice_i_final/api.py)
- [signova_practice_i/pose_utils.py](/d:/signova_practice_i_final/signova_practice_i/pose_utils.py)
- [signova_practice_i/scoring.py](/d:/signova_practice_i_final/signova_practice_i/scoring.py)
- [signova_practice_i/video_engine.py](/d:/signova_practice_i_final/signova_practice_i/video_engine.py)
- [web/src/App.jsx](/d:/signova_practice_i_final/web/src/App.jsx)
- [web/src/overlay.js](/d:/signova_practice_i_final/web/src/overlay.js)

README này mô tả đúng trạng thái hiện tại của repo với **bank 20 gloss** là default runtime.
