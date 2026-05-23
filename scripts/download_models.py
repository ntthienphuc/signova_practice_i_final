#!/usr/bin/env python3
"""Download SIGNOVA ONNX model from release or cloud storage"""

import os
import sys
import subprocess
from pathlib import Path

def download_model():
    """Download spoter_v3.0.onnx model"""
    models_dir = Path(__file__).parent / "models"
    models_dir.mkdir(exist_ok=True)
    
    model_path = models_dir / "spoter_v3.0.onnx"
    
    # If model already exists, skip
    if model_path.exists():
        print(f"✓ Model already exists at {model_path}")
        return True
    
    print("📥 Downloading ONNX model...")
    
    # Try multiple download sources
    sources = [
        # GitHub releases (adjust to your actual release URL)
        "https://github.com/ntthienphuc/signova_practice_i_final/releases/download/v1.0/spoter_v3.0.onnx",
        # Alternative: Direct cloud storage URL (if you have one)
        # "https://your-cloud-storage.com/spoter_v3.0.onnx"
    ]
    
    for source in sources:
        try:
            print(f"  Trying: {source}")
            subprocess.run(
                ["curl", "-L", "-o", str(model_path), source],
                check=True,
                capture_output=True
            )
            
            if model_path.exists() and model_path.stat().st_size > 10_000_000:
                print(f"✓ Model downloaded successfully ({model_path.stat().st_size / 1_000_000:.1f} MB)")
                return True
        except (subprocess.CalledProcessError, FileNotFoundError):
            print(f"  ✗ Failed to download from {source}")
            continue
    
    print("⚠️  Could not download ONNX model. Practice II will be disabled.")
    print("    To enable: manually place spoter_v3.0.onnx in models/")
    return False

if __name__ == "__main__":
    success = download_model()
    sys.exit(0 if success else 1)
