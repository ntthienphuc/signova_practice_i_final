#!/usr/bin/env python3
"""Download SIGNOVA ONNX model from Google Drive."""

import os
import sys
from pathlib import Path

import gdown


GOOGLE_DRIVE_MODEL_ID = "1bovGilZArSEYd3GQ8dV-F33Z-2_Badxw"


def download_model() -> bool:
    """Download spoter_v3.0.onnx into /code/models or SIGNOVA_SIGN_MODEL_PATH."""

    project_root = Path(__file__).resolve().parents[1]

    model_env_path = os.getenv("SIGNOVA_SIGN_MODEL_PATH", "").strip()
    if model_env_path:
        model_path = Path(model_env_path)
    else:
        model_path = project_root / "models" / "spoter_v3.0.onnx"

    model_path.parent.mkdir(parents=True, exist_ok=True)

    if model_path.exists() and model_path.stat().st_size > 10_000_000:
        print(f"✓ Model already exists at {model_path}")
        return True

    print("📥 Downloading ONNX model from Google Drive...")
    print(f"Target path: {model_path}")

    try:
        gdown.download(
            id=GOOGLE_DRIVE_MODEL_ID,
            output=str(model_path),
            quiet=False,
        )

        if model_path.exists() and model_path.stat().st_size > 10_000_000:
            print(
                f"✓ Model downloaded successfully "
                f"({model_path.stat().st_size / 1_000_000:.1f} MB)"
            )
            return True

        print("⚠️ Download finished but file size looks wrong.")
        return False

    except Exception as exc:
        print(f"⚠️ Could not download ONNX model: {exc}")
        print("Practice II will be disabled unless the model exists in /code/models.")
        return False


if __name__ == "__main__":
    success = download_model()
    sys.exit(0 if success else 1)
