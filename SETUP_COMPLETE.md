# 🎉 SIGNOVA Backend-Frontend Setup - COMPLETE

Your SIGNOVA project is now optimally configured for development with separated frontend and backend.

## ✅ What Was Done

### 1. **Environment Configuration**
- ✅ Created `web/.env.local` - Configure which backend the web connects to
- ✅ Created `web/.env.example` - Reference template for environment variables
- ✅ Frontend now supports dynamic API URL configuration via `VITE_API_BASE_URL`

### 2. **Convenient Run Scripts** (in `scripts/`)
- ✅ `run_web_local.ps1` - Run web connecting to LOCAL backend (port 8010)
- ✅ `run_web_remote.ps1` - Run web connecting to REMOTE HF Spaces backend
- ✅ `run_api.ps1` - Backend API (already existed)

### 3. **Documentation**
- ✅ `BACKEND_SETUP.md` - Complete setup & architecture guide
- ✅ `QUICK_START.md` - Quick reference cheat sheet

---

## 🚀 START HERE - Choose Your Development Style

### Option A: Local Backend Development (Recommended) ⭐

**When to use:** You're actively working on the backend, or want full control locally.

```powershell
# Terminal 1: Start backend
.\scripts\run_api.ps1

# Terminal 2: Start web
.\scripts\run_web_local.ps1
```

**Access:**
- Frontend: http://127.0.0.1:5173
- Backend API: http://127.0.0.1:8010
- API Docs: http://127.0.0.1:8010/docs

---

### Option B: Remote Backend (Production-like) 🚀

**When to use:** You only want to develop/test the frontend against a live backend.

```powershell
# Just run web - no backend needed locally!
.\scripts\run_web_remote.ps1
```

**Access:**
- Frontend: http://127.0.0.1:5173
- Backend: https://thienphuc12339-signova-backend.hf.space (remote)

---

## 📋 One-Time Setup

### Backend (only if using Option A - Local Backend)
```powershell
# First time only
.\scripts\setup_venv.ps1
```

### Frontend (required for both options)
```powershell
cd web
npm install
cd ..
```

---

## 🔄 How to Switch Backends

### Easiest: Use the Scripts
```powershell
# Switch to local backend
.\scripts\run_web_local.ps1

# Switch to remote backend  
.\scripts\run_web_remote.ps1
```

### Alternative: Edit `.env.local`
```env
# For local backend
VITE_API_BASE_URL=http://127.0.0.1:8010

# For remote HF Spaces
VITE_API_BASE_URL=https://thienphuc12339-signova-backend.hf.space
```

Then run: `cd web && npm run dev`

---

## 📚 Key Files Created

| File | Purpose |
|------|---------|
| `web/.env.local` | Your local config (git-ignored) |
| `web/.env.example` | Reference/template |
| `scripts/run_web_local.ps1` | Start web + local backend |
| `scripts/run_web_remote.ps1` | Start web + remote backend |
| `BACKEND_SETUP.md` | Complete documentation |
| `QUICK_START.md` | Quick reference |

---

## 🎯 Backend Information

### Current Backend URLs
| Environment | URL |
|---|---|
| **Local** | http://127.0.0.1:8010 |
| **Remote (HF Spaces)** | https://thienphuc12339-signova-backend.hf.space |

### What's the Difference?

**Local Backend:**
- Runs on your machine
- Port 8010 by default (customizable)
- Includes API docs at `/docs`
- Good for: Development, debugging, offline work

**Remote Backend:**
- Hosted on HuggingFace Spaces
- Always available online
- Good for: Testing frontend, demos, CI/CD

---

## 🔍 Verify Everything Works

### Test Backend (if running local)
```powershell
# Should return {"status":"ok","practice_ii_ready":true}
curl http://127.0.0.1:8010/health
```

### Test Frontend Connection
1. Open http://127.0.0.1:5173
2. Try uploading a video to `/practice`
3. Check browser console (F12) for API calls

---

## 💡 Pro Tips

1. **Two-terminal workflow** (Recommended)
   - Terminal 1: Backend (`.\scripts\run_api.ps1`)
   - Terminal 2: Frontend (`.\scripts\run_web_local.ps1`)
   - This mimics production but with fast reload

2. **Use remote for staging tests**
   - `.\scripts\run_web_remote.ps1` to test against live backend
   - No need to keep local backend running
   - Great for testing before deployment

3. **Environment variables persist in terminal**
   - Change API URL without editing files
   - PowerShell: `$env:VITE_API_BASE_URL = "..."`

---

## ❓ Common Questions

**Q: Can I use both backends?**  
A: Yes! Run `.\scripts/run_web_local.ps1` and `.\scripts/run_web_remote.ps1` on different ports, or switch between them in `.env.local`.

**Q: What if I want a custom backend?**  
A: Edit `web/.env.local`:
```env
VITE_API_BASE_URL=https://your-custom-backend.com
```

**Q: Do I need the HF Spaces backend running?**  
A: Only if you choose Option B (remote). Option A uses your local backend.

**Q: Can I deploy to production easily?**  
A: Yes! See `docker-compose.yml` and `Dockerfile` for containerized deployment.

---

## 📖 Next Steps

1. **Choose Option A or B** above
2. **Run one-time setup** (if needed)
3. **Start your terminals** according to your choice
4. **Open http://127.0.0.1:5173**
5. **Start developing!**

For detailed information, see:
- [BACKEND_SETUP.md](BACKEND_SETUP.md) - Full documentation
- [QUICK_START.md](QUICK_START.md) - Command reference
- [CLAUDE.md](CLAUDE.md) - Backend architecture
- [web/CLAUDE.md](web/CLAUDE.md) - Frontend architecture

---

**Questions?** Check the troubleshooting section in [BACKEND_SETUP.md](BACKEND_SETUP.md) or review the API docs at http://127.0.0.1:8010/docs (when backend is running).

Happy coding! 🎉
