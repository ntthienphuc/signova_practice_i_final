# SIGNOVA Learning Flow

Repo này là bản app demo đã được dọn lại để chỉ giữ phần đang chạy: backend FastAPI, web React, bank final 20 từ, reference video local, và model Practice II local.

Web hiện có 2 phần:

- landing page ở `/`
- practice app ở `/practice`

Mục tiêu hiện tại là demo trọn flow `Học -> Practice I -> Practice II` trên **2 topic**, mỗi topic **10 từ**.

## Flow hiện tại

Tab `Học` hoạt động theo tuần tự:

1. Màn hình đầu hiển thị **2 topic** được chia từ bank 20 từ.
2. Bấm vào một topic sẽ vào lộ trình học của topic đó.
3. Với mỗi từ:
   - xem **từ**
   - xem **hình minh họa**
   - xem **video reference**
   - bấm sang **Practice I** để luyện ngay từ đó
4. Học xong **5 từ đầu** sẽ vào **Practice II** cho đúng 5 từ đó.
5. Sau checkpoint 5 từ, tiếp tục học 5 từ còn lại.
6. Học xong đủ **10 từ** sẽ vào **Practice II** tổng kết cho cả topic.
7. Kết thúc topic sẽ có màn **summary**.

Hai tab `Dashboard Gia đình` và `Dashboard Trường học` vẫn được giữ chỗ, chưa làm logic thật.

## Repo hiện có

- Backend FastAPI ở [api.py](api.py)
- Core AI ở [signova_practice_i](signova_practice_i)
- Web React ở [web](web)
- Bank final 20 gloss ở [outputs/reference_bank_20_best_allcam1_fe](outputs/reference_bank_20_best_allcam1_fe)
- Reference video local ở [outputs/reference_bank_20_best_allcam1_fe/reference_videos](outputs/reference_bank_20_best_allcam1_fe/reference_videos)
- Model Practice II local ở [models/spoter_v3.0.onnx](models/spoter_v3.0.onnx)
- Gloss map local ở [gloss.csv](gloss.csv)

## 20 gloss active

- `Làm bài tập`
- `Không nên`
- `Tường`
- `Mới`
- `Cầu lông`
- `Thái Lan`
- `Trường Cao đẳng`
- `Con chó`
- `Quần đùi`
- `Nhân viên phục vụ`
- `Tháng mười`
- `Buổi tối`
- `Mũ`
- `Nhảy dây`
- `Bơi lội`
- `Ngày Quốc tế Lao động`
- `Hoàng hôn`
- `Dài`
- `Dụng cụ học tập`
- `Giúp đỡ`

## 2 topic hiện tại

`Topic 1`
- 10 từ đầu tiên trong bank 20 từ

`Topic 2`
- 10 từ còn lại trong bank 20 từ

Backend tự build curriculum qua endpoint `/curriculum`.

## Kiến trúc

### Backend làm

- extract pose từ video
- auto-segment đoạn sign chính
- normalize và so với reference bank
- chấm `Practice I`
- với `Practice II`: classifier ONNX + bank ranking để detect ký nhầm từ
- trả JSON cho FE tự phát lại và vẽ overlay

### Frontend làm

- hiển thị landing page giới thiệu sản phẩm
- lấy curriculum từ backend
- dẫn flow học theo topic
- upload video
- phát clip user và reference
- seek theo segment backend trả về
- vẽ overlay trên video

Backend **không render video kết quả**.

## API chính

### `GET /app-config`

Trả cấu hình app cơ bản, gồm `curriculum_topics`.

### `GET /curriculum`

Trả curriculum đầy đủ cho 2 topic, mỗi word gồm:

- `gloss`
- `order`
- `checkpoint_group`
- `study.poster_url`
- `study.reference.video_url`
- `study.reference.playback_url`

### `POST /practice-i/analyze-video`

Multipart form:

- `target_gloss`
- `video`
- optional:
  - `lesson_glosses`
  - `frame_stride`
  - `auto_segment`
  - `overlay_frame_count`

### `POST /practice-ii/analyze-video`

Multipart form tương tự, nhưng `lesson_glosses` phải chứa lesson set hiện tại.

### `GET /poster/reference/{gloss}`

Trả ảnh minh họa lấy từ reference video.

### `GET /reference-video/{gloss}`

Trả file reference video gốc.

### `GET /playback/reference/{gloss}`

Trả bản playback H.264 cho browser.

## Segment + playback

App hiện dùng hướng:

- backend chọn `segment`
- frontend tự seek vào `start_ms/end_ms`
- frontend tự vẽ overlay

Segmenter hiện là hybrid:

- `activity-based`
- `arm-cycle-based`

Mục tiêu là tránh ăn nhầm cử động rác khi người dùng mới bấm quay hoặc sắp dừng quay.

## Cấu trúc thư mục

```text
signova_practice_i_final/
├─ api.py
├─ gloss.csv
├─ models/
│  └─ spoter_v3.0.onnx
├─ outputs/
│  └─ reference_bank_20_best_allcam1_fe/
│     ├─ banks/
│     ├─ reference_bank_manifest.json
│     ├─ display_reference_manifest.json
│     └─ reference_videos/
├─ requirements_api.txt
├─ restart_signova.bat
├─ scripts/
│  ├─ restart_stack.ps1
│  ├─ run_api.ps1
│  ├─ run_web.ps1
│  └─ setup_venv.ps1
├─ signova_practice_i/
└─ web/
```

## Yêu cầu

- Windows
- Python `3.11`
- Node.js `18+`
- `ffmpeg` trong `PATH`

## Setup lần đầu

```powershell
.\scripts\setup_venv.ps1
```

Script web sẽ tự `npm install` nếu `node_modules` chưa có.

## Chạy app

### Cách nhanh nhất

```powershell
.\restart_signova.bat
```

Script này sẽ:

- dọn process cũ trên port API/Web
- bật lại API
- bật lại web

Mặc định:

- API: `http://127.0.0.1:8014`
- Web: `http://127.0.0.1:5175`

### Chạy tay

Terminal 1:

```powershell
.\scripts\run_api.ps1
```

Terminal 2:

```powershell
.\scripts\run_web.ps1
```

## Link chạy

- API docs: `http://127.0.0.1:8014/docs`
- Landing page: `http://127.0.0.1:5175/`
- Practice app: `http://127.0.0.1:5175/practice`

## Runtime cache

Backend tự sinh playback H.264 và poster vào:

```text
outputs/web_playback_cache/
```

Thư mục này là runtime cache và đã được ignore.

## Ghi chú

- Repo này đã bỏ dataset lớn, script benchmark cũ, bank 30 gloss cũ, và output test thừa.
- Nếu đổi API base trong web rồi muốn quay về mặc định, refresh cứng `Ctrl + F5`.
- Nếu cần restart sạch toàn bộ, dùng lại `restart_signova.bat`.
