# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What This Project Is

SIGNOVA Practice I/II — a Vietnamese Sign Language (VSL) practice backend + web demo. Users upload a video of themselves signing a target gloss; the backend scores the attempt against a reference bank and returns feedback for the frontend to display.

- **Practice I**: score a single target gloss, return segment timing + skeleton overlay payload.
- **Practice II**: same as Practice I, plus a SPOTER ONNX classifier that detects if the user signed the wrong word from a lesson set.

## Running the Project

**Prerequisites**: Python 3.11, Node.js + npm, `ffmpeg` on PATH.

### Backend API

```powershell
# Setup venv (first time or -Recreate to rebuild)
.\scripts\setup_venv.ps1

# Run API (default port 8010, bank: outputs/reference_bank_20_best_allcam1_fe)
.\scripts\run_api.ps1

# Run with custom port and sign model (required for Practice II classifier)
.\scripts\run_api.ps1 -Port 8014 `
  -SignModelPath "D:\...\spoter_v3.0.onnx" `
  -SignGlossCsvPath "D:\...\gloss.csv"

# Run with a different bank
.\scripts\run_api.ps1 -BankRoot "outputs\reference_bank_30_unique_video_ref20_template"
```

API docs available at `http://127.0.0.1:8010/docs` (or whichever port).

### Frontend

```powershell
.\scripts\run_web.ps1 -Port 5175
# Open http://127.0.0.1:5175
```

Or directly with npm:
```bash
cd web && npm install && npm run dev
```

### Batch Testing

```powershell
# HTTP batch test against local dataset
.\.venv\Scripts\python.exe .\scripts\test_all_cam1_api.py `
  --api-url http://127.0.0.1:8014 `
  --manifest-path outputs\reference_bank_20_best_allcam1_fe\reference_bank_manifest.json `
  --out-dir tests\results `
  --frame-stride 2 --overlay-frame-count 24 --check-reference-routes
```

### Rebuild Reference Bank

```powershell
.\.venv\Scripts\python.exe .\scripts\build_best20_bank.py
```

## Architecture

### Backend Pipeline (`api.py` + `signova_practice_i/`)

Request flow for `POST /practice-i/analyze-video`:

1. **Upload** — video received as multipart form, saved to temp dir, transcoded to H.264 via ffmpeg for browser playback.
2. **Pose extraction** (`video_engine.py`) — MediaPipe Holistic extracts body + hand landmarks per frame into a `PoseSequence` (shape: `[frames, joints, 2]`).
3. **Auto-segmentation** (`segmentation.py`) — heuristic selects the main sign segment based on hand activity; returns a `Segment(start_frame, end_frame)`.
4. **Scoring** (`pose_utils.py: compare_to_reference_bank`) — normalized/resampled pose compared against all reference templates in the bank; returns score, bad_mask per joint per frame.
5. **Ranking** (`scoring.py: rank_sequence_against_banks`) — pose ranked against all lesson banks to detect wrong-word cases.
6. **Decision** (`scoring.py`) — `decision_for_target` (Practice I) or `decision_for_practice_ii` (Practice II, uses SPOTER ONNX classifier via `sign_classifier.py`).
7. **Overlay payload** (`pose_utils.py: build_compact_overlay_payload`) — compact JSON with `joint_names`, `connections`, `user_frames`, `reference_frames`, `bad_joint_indices` (frame-indexed list of bad joint indices). Backend does **not** render video.
8. **Response** — JSON with `score`, `decision`, `segment` (ms timing), `playback` (H.264 URLs + segment timing), `overlay`, `reference`.

### Key Data Structures

- **`PoseSequence`** — dataclass with `.xy` (float32 array `[F, J, 2]`), `.conf`, `.names` (joint name list), `.groups` (body/left_hand/right_hand index lists).
- **`ReferenceBank`** — loaded from `.npz` via `load_reference_bank_npz`; holds multiple reference templates + tolerance arrays for scoring.
- **`BankStore`** (`bank_store.py`) — lazy-loads `ReferenceBank` per gloss from `reference_bank_manifest.json`; also maps glosses to display reference clips via `display_reference_manifest.json`.

### Configuration via Environment Variables

| Variable | Default | Purpose |
|---|---|---|
| `SIGNOVA_BANK_ROOT` | `outputs/reference_bank_20_best_allcam1_fe` | Path to reference bank directory |
| `SIGNOVA_SIGN_MODEL_PATH` | hardcoded Windows path | SPOTER ONNX model for Practice II classifier |
| `SIGNOVA_SIGN_GLOSS_CSV` | hardcoded Windows path | Gloss label CSV for classifier |

### Frontend (`web/src/`)

React 19 + TypeScript + Vite 5 + Tailwind CSS. See `web/CLAUDE.md` for frontend-specific architecture.

- **`App.tsx`** — owns all state/handlers; renders `ControlPanel` (aside) and `StagePanel` (main stage with dual video panels).
- **`api/`** — Axios-based API layer: `client.ts` (factory + error handler), `endpoints/`, `types.ts` (all API interfaces), `index.ts` (barrel re-export).
- **`overlay.ts`** — `normalizeAnalysis()` + `drawOverlay()` render the skeleton on canvas, coloring joints red/green based on `bad_joint_indices` from the API.
- **`pages/LandingPage.tsx`** — assembles 9 data-driven landing sections; routing not yet wired.

The frontend uses `segment.start_ms` / `segment.end_ms` from the API response to seek both video elements to the correct window, then draws canvas overlays frame-by-frame as the video plays.

### Bank Structure

```
outputs/reference_bank_20_best_allcam1_fe/
  reference_bank_manifest.json   # gloss list + bank_path per gloss
  display_reference_manifest.json  # 1 display clip per gloss for frontend panel
  <gloss_slug>/
    bank.npz                     # reference templates + tolerances
```

`bank.npz` is the scoring bank (multiple references per gloss). `display_reference_manifest.json` maps each gloss to one "best" clip for frontend playback. These are intentionally separate — scoring needs many references, display needs one clean example.

## Important Notes

- The sign model path in `api.py` defaults to a hardcoded Windows path (`D:\Project\...`). On non-Windows or different machines, pass via env var or `-SignModelPath` script arg.
- Reference videos in `display_reference_manifest.json` point to `All_cam1/` dataset clips (local machine). API still starts without them; `/playback/reference/{gloss}` will 404 if the clips are missing.
- `frame_stride=2` is the tested-best config for the 20-gloss bank — avoid changing without re-evaluating.
- Browser cannot reliably play raw `mp4v/mpeg4` from OpenCV; the `/playback/*` routes transcode to H.264 with `faststart` via ffmpeg.
- Practice II classifier is optional — `GET /health` reports `practice_ii_ready: false` if the model files are missing, and `/practice-ii/analyze-video` returns 503.
