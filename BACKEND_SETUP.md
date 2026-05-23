# SIGNOVA Backend & Frontend Setup Guide

This guide explains how to optimally run SIGNOVA with your frontend only handling the web, while the backend runs separately.

## 🎯 Quick Start

### Option 1: Local Backend (Development) ⭐ Recommended
Best for active backend development.

```powershell
# Terminal 1: Run the backend API
.\scripts\run_api.ps1

# Terminal 2: Run the web frontend
.\scripts\run_web_local.ps1
```

**Endpoints:**
- Frontend: http://127.0.0.1:5173
- Backend API: http://127.0.0.1:8010
- API Docs: http://127.0.0.1:8010/docs

---

### Option 2: Remote HuggingFace Spaces Backend (Production-like) 🚀
Best for testing against live deployment or when you don't need to modify the backend.

```powershell
# Just run the web (no backend needed locally)
.\scripts\run_web_remote.ps1
```

**Endpoints:**
- Frontend: http://127.0.0.1:5173
- Backend API: https://thienphuc12339-signova-backend.hf.space
- No local backend needed

---

## 📋 Detailed Setup

### Prerequisites
- Python 3.11 (for backend)
- Node.js 18+ (for frontend)
- ffmpeg on PATH (for video processing)

### Backend Setup (Optional - only needed for Option 1)

#### First time setup:
```powershell
.\scripts\setup_venv.ps1
```

#### Run the backend:
```powershell
.\scripts\run_api.ps1
# Optional: custom port
.\scripts\run_api.ps1 -Port 8014
```

The backend will:
- Load reference bank from `outputs/reference_bank_20_best_allcam1_fe/`
- Load SPOTER model from `models/spoter_v3.0.onnx` (if exists)
- Start at http://127.0.0.1:8010 (or custom port)
- Provide API docs at /docs

### Frontend Setup

#### First time setup:
```powershell
cd web
npm install
cd ..
```

#### Run the frontend:

**Option A: Connect to local backend**
```powershell
.\scripts\run_web_local.ps1
```

**Option B: Connect to remote backend**
```powershell
.\scripts\run_web_remote.ps1
```

**Manual (custom port):**
```powershell
cd web
$env:VITE_API_BASE_URL = "http://127.0.0.1:8010"
npm run dev -- --port 5175
cd ..
```

---

## 🔄 How to Switch Between Local & Remote Backend

The frontend uses the `VITE_API_BASE_URL` environment variable to determine which backend to connect to.

### Method 1: Using Scripts (Easiest)
```powershell
# Switch to local backend
.\scripts\run_web_local.ps1

# Switch to remote backend
.\scripts\run_web_remote.ps1
```

### Method 2: Manual Environment Setup
```powershell
# For local backend
$env:VITE_API_BASE_URL = "http://127.0.0.1:8010"
cd web && npm run dev

# For remote backend
$env:VITE_API_BASE_URL = "https://thienphuc12339-signova-backend.hf.space"
cd web && npm run dev
```

### Method 3: Edit `.env.local`
```
# .env.local
VITE_API_BASE_URL=http://127.0.0.1:8010  # or remote URL
```

---

## 📦 Backend Architecture

The SIGNOVA backend provides these key endpoints:

### Practice Endpoints
- `POST /practice-i/analyze-video` - Analyze single sign attempt
- `POST /practice-ii/analyze-video` - Analyze with wrong-word detection
- `GET /playback/*` - Stream transcoded videos

### Authentication & User Data
- `POST /auth/register` - User registration
- `POST /auth/login` - User login
- `GET /auth/me` - Get current user
- `GET /dashboard/*` - Dashboard data
- `POST /progress/*` - Update progress

### Configuration
- `GET /health` - Health check (shows Practice II availability)
- `GET /app/config` - Get app configuration

See http://127.0.0.1:8010/docs for full API documentation (when backend is running).

---

## 🔌 Backend Connection Options

| Option | URL | Best For | Requires Local Backend |
|--------|-----|----------|------------------------|
| **Local Development** | `http://127.0.0.1:8010` | Active backend development | ✅ Yes |
| **Remote HF Spaces** | `https://thienphuc12339-signova-backend.hf.space` | Testing/Demo/Staging | ❌ No |
| **Custom Remote** | `https://your-domain.com/api` | Production deployment | ❌ No |

---

## 🐳 Docker Deployment (Optional)

The project includes a `Dockerfile` and `docker-compose.yml` for deployment.

```powershell
# Build and run with Docker Compose
docker-compose up --build

# Customize with:
# - SIGNOVA_BANK_ROOT: Custom reference bank path
# - SIGNOVA_SIGN_MODEL_PATH: Custom SPOTER model
# - SIGNOVA_SIGN_GLOSS_CSV: Custom gloss labels
```

---

## 🛠️ Troubleshooting

### Frontend can't connect to backend
1. Check `VITE_API_BASE_URL` environment variable
2. Verify backend is running: `http://127.0.0.1:8010/docs`
3. Check browser console (F12) for CORS errors
4. Make sure `/docs` endpoint works before trying `/practice-i/analyze-video`

### Backend fails to start
1. Ensure venv is activated: `.\scripts\setup_venv.ps1`
2. Check reference bank exists: `outputs/reference_bank_20_best_allcam1_fe/`
3. Verify ffmpeg is installed: `ffmpeg -version`
4. Check port is not in use: `netstat -ano | findstr :8010`

### Slow video processing
- Backend uses MediaPipe Holistic (CPU) - first frame is slow (~3-5s)
- Set `frame_stride=2` for faster processing (default in 20-gloss bank)
- GPU acceleration requires CUDA setup

---

## 📚 References

- [Backend CLAUDE.md](../CLAUDE.md) - Backend architecture details
- [Frontend CLAUDE.md](web/CLAUDE.md) - Frontend architecture details
- [API Documentation](http://127.0.0.1:8010/docs) - OpenAPI docs (when backend running)
