# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What This Project Is

SIGNOVA Practice I/II — a Vietnamese Sign Language (VSL) practice backend + web demo. Users upload a video of themselves signing a target gloss; the backend scores the attempt against a reference bank and returns feedback for the frontend to display.

- **Practice I**: score a single target gloss, return segment timing + skeleton overlay payload.
- **Practice II**: same as Practice I, plus a SPOTER ONNX classifier that detects if the user signed the wrong word from a lesson set.

## Running the Project

**Prerequisites**: Python 3.11, Node.js + npm, `ffmpeg` on PATH.

### Backend API (macOS/Linux)

```bash
# Setup venv (first time)
python3.11 -m venv .venv && source .venv/bin/activate
pip install -r requirements_api.txt

# Run API (default port 8010)
source .venv/bin/activate
uvicorn api:app --host 127.0.0.1 --port 8010 --reload

# With a custom bank
SIGNOVA_BANK_ROOT=outputs/reference_bank_30_unique_video_ref20_template uvicorn api:app --port 8010
```

### Backend API (Windows PowerShell)

```powershell
# Setup venv (first time or -Recreate to rebuild)
.\scripts\setup_venv.ps1

# Run API (default port 8010, bank: outputs/reference_bank_20_best_allcam1_fe)
.\scripts\run_api.ps1

# Run with custom port (models/spoter_v3.0.onnx and gloss.csv are present locally,
# so Practice II works without -SignModelPath on this machine)
.\scripts\run_api.ps1 -Port 8014
```

API docs at `http://127.0.0.1:8010/docs` (or whichever port).

### Frontend

```bash
cd web && npm install && npm run dev
# Open http://127.0.0.1:5173
```

```powershell
.\scripts\run_web.ps1 -Port 5175
```

Type-check only (no build output):
```bash
cd web && npx tsc --noEmit
```

No test runner is configured — type checking and build are the verification path.

### Batch Testing

```powershell
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
| `SIGNOVA_SIGN_MODEL_PATH` | `models/spoter_v3.0.onnx` if present, else hardcoded Windows path | SPOTER ONNX model for Practice II classifier |
| `SIGNOVA_SIGN_GLOSS_CSV` | `gloss.csv` if present, else hardcoded Windows path | Gloss label CSV for classifier |

`models/spoter_v3.0.onnx` and `gloss.csv` are committed to this repo — Practice II works out of the box without extra env vars.

### Frontend (`web/src/`)

React 18 + TypeScript + Vite 5 + Tailwind CSS v3. See `web/CLAUDE.md` for full frontend architecture details.

- **`router.tsx`** — four routes: `/` (LandingPage), `/practice` (App), `/learn` (LearnDashboard), `/learn/:unitId/:lessonId` (LearnPage).
- **`App.tsx`** — owns all state/handlers; renders `ControlPanel` (aside) and `StagePanel` (main stage with dual video panels).
- **`api/`** — Axios-based API layer: `client.ts` (factory + error handler), `endpoints/`, `types.ts` (all API interfaces), `index.ts` (barrel re-export).
- **`overlay.ts`** — `normalizeAnalysis()` + `drawOverlay()` render the skeleton on canvas, coloring joints red/green based on `bad_joint_indices` from the API.
- **`data/`** — static data files: `learnDashboardData.ts` (unit/lesson tree), `learnData.ts` (vocabulary flashcards), `landingData.ts` (bilingual vi/en landing content).

Some legacy components use `.jsx` (not `.tsx`) — do not convert them unless you are also updating all their imports and type annotations.

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

- `frame_stride=2` is the tested-best config for the 20-gloss bank — avoid changing without re-evaluating.
- Browser cannot reliably play raw `mp4v/mpeg4` from OpenCV; the `/playback/*` routes transcode to H.264 with `faststart` via ffmpeg.
- Practice II classifier is optional — `GET /health` reports `practice_ii_ready: false` if the model files are missing, and `/practice-ii/analyze-video` returns 503.
- Reference videos in `display_reference_manifest.json` point to `All_cam1/` dataset clips. API starts without them; `/playback/reference/{gloss}` will 404 if clips are missing.
- `npm run build` runs `vite build` only — it does **not** run `tsc`. Run `npx tsc --noEmit` separately to type-check.
- Page UI specs for new pages live in `web/src/guide/` — read the relevant spec before implementing a new page.
