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

# Run with custom port
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

### Python Unit Tests

```bash
source .venv/bin/activate
python -m pytest tests/                          # run all tests
python -m pytest tests/test_scoring_engine.py   # run a single test file
```

Tests in `tests/` exercise the scoring engine and DB/auth layer directly (no API server needed). They import from `signova_practice_i/` and `app/` so must be run from the repo root.

### Database Migrations (Alembic)

```bash
# Apply all pending migrations
source .venv/bin/activate
alembic upgrade head

# Create a new migration after editing models
alembic revision --autogenerate -m "description"

# Seed curriculum data from the reference bank into the DB
python scripts/seed_curriculum.py
```

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

### Backend — Two Layers

The backend has two distinct layers mounted on the same FastAPI `app`:

**1. Signova core (`api.py` + `signova_practice_i/`)** — the CV/ML engine. Handles video upload, pose extraction, scoring, and overlay generation. No authentication required; practice endpoints accept optional auth and save attempts when a user is logged in.

**2. User management (`app/`)** — auth, profiles, progress tracking, and social linking. All routes are prefixed and registered into the same FastAPI app via `app.include_router(...)` in `api.py:create_app()`.

### Core Pipeline (`api.py` + `signova_practice_i/`)

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

### Services Layer (`app/services/`)

Business logic called by routers, not by `api.py` directly:

- **`practice.py`** — `save_practice_attempt()` persists a `PracticeAttempt` row and updates `LearnerWordProgress` (best score, fail/correct counts) when an authenticated user submits a video.
- **`gamification.py`** — XP and streak calculations; called after a successful practice save.
- **`gemini.py`** — `generate_recommendation()` calls the Google Gemini 1.5 Flash API to produce a Vietnamese coaching message for parent/school dashboards. Falls back to a rules-based generator if `GEMINI_API_KEY` is not set. Results are cached in the `ai_recommendations` DB table and refreshed after `GEMINI_UPDATE_INTERVAL_MINUTES`.

### User Management Layer (`app/`)

All routers live in `app/routers/` and are registered in `api.py:create_app()`:

| Router | Prefix | Purpose |
|---|---|---|
| `auth.py` | `/auth` | Register, login, refresh token, `/auth/me`, update-profile |
| `curriculum.py` | `/curriculum` | Serve curriculum topics/words from DB |
| `progress.py` | `/progress` | Track learner word/topic progress, XP, resume state |
| `link.py` | `/links` | Parent↔Learner and School↔Learner connection requests |
| `dashboard.py` | `/dashboard` | Aggregated dashboard views for parent/school roles |

**User roles**: `learner`, `parent`, `school`, `admin`. Each role gets its own profile model (`LearnerProfile`, `ParentProfile`, `SchoolProfile`). Practice endpoints use `get_current_user_optional` — they work anonymously but persist `PracticeAttempt` records when authenticated.

**Auth**: JWT access tokens (60 min) + refresh tokens (7 days), signed with `JWT_SECRET_KEY` / `JWT_REFRESH_SECRET_KEY`. `app/auth/dependencies.py` exports `get_current_user` (raises 401 if missing) and `get_current_user_optional` (returns None).

### Configuration via Environment Variables

| Variable | Default | Purpose |
|---|---|---|
| `SIGNOVA_BANK_ROOT` | `outputs/reference_bank_20_best_allcam1_fe` | Path to reference bank directory |
| `SIGNOVA_SIGN_MODEL_PATH` | `models/spoter_v3.0.onnx` if present | SPOTER ONNX model for Practice II |
| `SIGNOVA_SIGN_GLOSS_CSV` | `gloss.csv` if present | Gloss label CSV for classifier |
| `DATABASE_URL` | Neon PostgreSQL connection string in `app/config.py` | PostgreSQL DB for user/progress data |
| `JWT_SECRET_KEY` | Default in `app/config.py` | Access token signing key |
| `JWT_REFRESH_SECRET_KEY` | Default in `app/config.py` | Refresh token signing key |
| `GEMINI_API_KEY` | None (optional) | Google Gemini 1.5 Flash key for AI dashboard recommendations |
| `GEMINI_UPDATE_INTERVAL_MINUTES` | `60` | How often to regenerate cached recommendations |

All settings are loaded by `app/config.py` via pydantic-settings; override via `.env` file or shell env. The defaults in `app/config.py` point to the shared Neon instance — set `DATABASE_URL` to a local Postgres for local development. A `docker-compose.yml` at the root starts a local PostgreSQL container on port 5432.

`models/spoter_v3.0.onnx` and `gloss.csv` are committed to this repo — Practice II works out of the box without extra env vars.

### Frontend (`web/src/`)

React 18 + TypeScript + Vite 5 + Tailwind CSS v3. See `web/CLAUDE.md` for full frontend architecture details.

**Routes** (`router.tsx`):

| Path | Component | Notes |
|---|---|---|
| `/` | `LandingLayout` → `LandingPage` | Navbar with locale toggle |
| `/practice` | `PracticePage` | Tab-based shell: practice + learn |
| `/learn-dashboard` | `PracticePage` | Same shell, different initial tab |
| `/learn/:topicId/:wordOrder` | `LearnWordPage` | Word-level learn + Practice I cycle |

**Component hierarchy**: `PracticePage` is the top-level authenticated shell — it owns the `Sidebar`, `AuthModal`, and switches between `TopicGrid`, `TopicSummary`, `StudyStage`, `PracticeWorkspace`, and `DashboardPlaceholder` tabs. `App.tsx` is the original standalone practice tool; it is composed inside `PracticeWorkspace`.

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

outputs/learn_img/
  <gloss>.png                    # custom illustration for each word
```

`bank.npz` is the scoring bank (multiple references per gloss). `display_reference_manifest.json` maps each gloss to one "best" clip for frontend playback. These are intentionally separate — scoring needs many references, display needs one clean example.

Word illustrations in `outputs/learn_img/<gloss>.png` are served at `GET /learn-image/{gloss}`. The endpoint falls back to a placeholder if the PNG is missing — it does **not** 404.

## Important Notes

- `frame_stride=2` is the tested-best config for the 20-gloss bank — avoid changing without re-evaluating.
- Browser cannot reliably play raw `mp4v/mpeg4` from OpenCV; the `/playback/*` routes transcode to H.264 with `faststart` via ffmpeg.
- Practice II classifier is optional — `GET /health` reports `practice_ii_ready: false` if the model files are missing, and `/practice-ii/analyze-video` returns 503.
- Reference videos in `display_reference_manifest.json` point to `All_cam1/` dataset clips. API starts without them; `/playback/reference/{gloss}` will 404 if clips are missing.
- `npm run build` runs `vite build` only — it does **not** run `tsc`. Run `npx tsc --noEmit` separately to type-check.
- After editing any `app/models/` SQLAlchemy model, run `alembic revision --autogenerate` and `alembic upgrade head`. The DB schema is never modified manually.
