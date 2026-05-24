# 🚀 SIGNOVA Quick Commands

## Fastest Setup (Local Backend)

```powershell
# Terminal 1: Backend API
.\scripts\run_api.ps1

# Terminal 2: Web Frontend  
.\scripts\run_web_local.ps1

# Visit: http://127.0.0.1:5173
```

---

## Fastest Setup (Remote Backend - No Local Backend Needed)

```powershell
.\scripts\run_web_remote.ps1
# Visit: http://127.0.0.1:5173
```

---

## Command Cheat Sheet

| What | Command |
|------|---------|
| Backend only | `.\scripts\run_api.ps1` |
| Web + Local Backend | `.\scripts\run_web_local.ps1` |
| Web + Remote Backend | `.\scripts\run_web_remote.ps1` |
| Full stack (Docker) | `docker-compose up --build` |
| Type check web | `cd web && npx tsc --noEmit` |
| Backend docs | http://127.0.0.1:8010/docs |
| Frontend | http://127.0.0.1:5173 |

---

## Environment Configuration

**File:** `web/.env.local` (git-ignored)

```env
# For local backend (default)
VITE_API_BASE_URL=http://127.0.0.1:8010

# For remote HF Spaces backend
VITE_API_BASE_URL=https://thienphuc12339-signova-backend.hf.space

# For custom backend
VITE_API_BASE_URL=https://your-custom-backend.com
```

---

## Backend URLs Reference

| Environment | URL |
|-------------|-----|
| Local Dev | `http://127.0.0.1:8010` |
| Remote Spaces | `https://thienphuc12339-signova-backend.hf.space` |
| Custom | Configure in `.env.local` |

---

## Recommended Development Setup

1. **One-time setup:**
   ```powershell
   .\scripts\setup_venv.ps1  # Backend
   cd web && npm install      # Frontend
   ```

2. **Daily workflow (2 terminals):**
   ```powershell
   # Terminal 1: Backend
   .\scripts\run_api.ps1
   
   # Terminal 2: Frontend
   .\scripts\run_web_local.ps1
   ```

3. **Access points:**
   - API: http://127.0.0.1:8010/docs
   - Web: http://127.0.0.1:5173

---

## Troubleshooting

**"Cannot connect to backend"**
- Check `.env.local` has correct `VITE_API_BASE_URL`
- Verify backend running: http://127.0.0.1:8010/docs
- Check browser console for CORS errors

**"ffmpeg not found"**
- Add ffmpeg to PATH or install via Chocolatey: `choco install ffmpeg`

**"Port already in use"**
- Change port: `.\scripts\run_api.ps1 -Port 8014`
- Or kill process: `netstat -ano | findstr :8010`

---

See [BACKEND_SETUP.md](BACKEND_SETUP.md) for complete documentation.
