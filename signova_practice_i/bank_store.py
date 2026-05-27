from __future__ import annotations

import json
from pathlib import Path
from typing import Any, Dict, Sequence

from .pose_utils import ReferenceBank, load_reference_bank_npz


class BankStore:
    def __init__(self, bank_root: str | Path):
        self.bank_root = Path(bank_root)
        self.manifest_path = self.bank_root / "reference_bank_manifest.json"
        if not self.manifest_path.exists():
            raise FileNotFoundError(f"Missing bank manifest: {self.manifest_path}")
        self.manifest = json.loads(self.manifest_path.read_text(encoding="utf-8"))
        import unicodedata
        self.display_manifest_path = self.bank_root / "display_reference_manifest.json"
        if self.display_manifest_path.exists():
            display_manifest = json.loads(self.display_manifest_path.read_text(encoding="utf-8"))
            self.display_references = {}
            for item in display_manifest.get("references", []):
                key = unicodedata.normalize("NFC", str(item["gloss"])).strip().lower()
                self.display_references[key] = item
        else:
            self.display_references = {}
        self._banks: Dict[str, ReferenceBank] = {}

    def list_glosses(self) -> list[str]:
        return [item["gloss"] for item in self.manifest["glosses"]]

    def list_topics(self) -> list[dict[str, object]]:
        return self.manifest.get("topics", [])

    def get(self, gloss: str) -> ReferenceBank:
        import unicodedata
        normalized_gloss = unicodedata.normalize("NFC", gloss).strip().lower()
        if normalized_gloss in self._banks:
            return self._banks[normalized_gloss]
        for item in self.manifest["glosses"]:
            item_normalized = unicodedata.normalize("NFC", item["gloss"]).strip().lower()
            if item_normalized != normalized_gloss:
                continue
            bank_path = Path(item["bank_path"])
            if not bank_path.is_absolute():
                bank_path = self.bank_root / bank_path
            bank = load_reference_bank_npz(gloss, bank_path)
            self._banks[normalized_gloss] = bank
            return bank
        raise KeyError(f"Unknown gloss: {gloss}")

    def all_banks(self, glosses: Sequence[str] | None = None) -> Dict[str, ReferenceBank]:
        selected = list(glosses) if glosses is not None else self.list_glosses()
        return {gloss: self.get(gloss) for gloss in selected}

    def get_display_reference(self, gloss: str) -> Dict[str, Any] | None:
        import unicodedata
        key = unicodedata.normalize("NFC", gloss).strip().lower()
        item = self.display_references.get(key)
        if item is None:
            return None
        video_path = Path(str(item["video_path"]))
        if not video_path.is_absolute():
            video_path = self.bank_root.parent.parent / video_path
            if not video_path.exists():
                video_path = self.bank_root.parent / Path(str(item["video_path"]))
        return {
            **item,
            "video_path": str(video_path),
        }
