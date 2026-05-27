# 🚀 SIGNOVA HuggingFace Spaces Deployment Guide

## Quick Setup

Your HuggingFace Spaces backend is ready! Here's how to get it fully working.

---

## Problem: Large ONNX Model File

The ONNX model file (`spoter_v3.0.onnx`) is too large (~62MB) to push via git to HF Spaces. 

**Solution:** Use HF Spaces **Files** tab to upload it directly (no git needed).

---

## Step 1: Push Code to HF Spaces

```powershell
# First, make sure you have the model-download script committed
cd d:\signova_practice_i_final
git status  # should be clean

# Note: Git history might still have large files. That's OK for now.
# We'll handle the model differently in HF Spaces.
```

### If git push still fails:

Use web interface instead:
1. Go to: https://huggingface.co/spaces/thienphuc12339/signova_backend
2. Click **Settings** → **Clone Repository**
3. Copy the HTTPS URL and clone locally, or push via web UI

---

## Step 2: Upload ONNX Model to HF Spaces

1. **Go to your HF Spaces**: https://huggingface.co/spaces/thienphuc12339/signova_backend

2. **Click "Files" tab** at the top

3. **Upload file**:
   - Click upload or drag-drop
   - Select: `spoter_v3.0.onnx` from your local `models/` folder
   - It will appear in the Files tab

4. **Verify**: Once uploaded, it should be at `/models/spoter_v3.0.onnx` in the space

---

## Step 3: Configure Environment Variables (Optional)

In HF Spaces Settings:

```
SIGNOVA_SIGN_MODEL_PATH=/models/spoter_v3.0.onnx
SIGNOVA_SIGN_GLOSS_CSV=/code/gloss.csv
SIGNOVA_BANK_ROOT=/code/outputs/reference_bank_20_best_allcam1_fe
```

The Dockerfile and `download_models.py` script will attempt automatic download if needed.

---

## Step 4: Start the Space

1. Go to your space
2. Click **App** tab
3. HF should automatically build and run the Docker container
4. Wait for deployment (check **Logs** for progress)
5. Once ready, you'll get a public URL like: `https://thienphuc12339-signova-backend.hf.space`

---

## Verification

### Check if backend is running:
```
https://thienphuc12339-signova-backend.hf.space/health
```

Should return:
```json
{
  "status": "ok",
  "practice_ii_ready": true  // or false if model not found
}
```

### API Documentation:
```
https://thienphuc12339-signova-backend.hf.space/docs
```

---

## Troubleshooting

### Space shows "Building" forever
- Check **Logs** tab for errors
- Common issues:
  - Missing dependencies in `requirements_api.txt`
  - Large files in git (remove from `.gitignore`)
  - Model file not found

### Practice II returns 503 (unavailable)
- ONNX model file not found
- Upload `spoter_v3.0.onnx` via HF Files tab
- Or set `SIGNOVA_SIGN_MODEL_PATH` to correct path

### API endpoints not responding
- Wait for Docker build to complete (check Logs)
- Verify space is running (not paused)
- Check `entrypoint.sh` is executable

---

## Local Frontend Connection

Now that backend is on HF Spaces:

```powershell
# Run web locally, connecting to HF backend
.\scripts\run_web_remote.ps1

# Or manually:
$env:VITE_API_BASE_URL = "https://thienphuc12339-signova-backend.hf.space"
cd web && npm run dev
```

---

## Git History Cleanup (Optional, Advanced)

If you want to clean git history to remove the large model file:

```powershell
# Using BFG Repo-Cleaner (recommended)
# Install: https://rtyley.github.io/bfg-repo-cleaner/

bfg --delete-files models/spoter_v3.0.onnx

# Or using git filter-branch (slower)
git filter-branch --tree-filter 'rm -f models/spoter_v3.0.onnx' HEAD

# Force push (CAREFUL - this rewrites history!)
git push origin core_practice -f
```

---

## References

- [HF Spaces Docs](https://huggingface.co/docs/hub/spaces)
- [Docker in HF Spaces](https://huggingface.co/docs/hub/spaces-sdks-docker)
- [Setting Secrets/Env Vars](https://huggingface.co/docs/hub/spaces#configuration)
