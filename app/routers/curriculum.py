from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db import get_db
from app.models.curriculum import Topic, Word
from app.schemas.curriculum import CurriculumSchema
from signova_practice_i.bank_store import BankStore
from pathlib import Path
import os
from urllib.parse import quote
from typing import Any, Dict

router = APIRouter(tags=["curriculum"])

APP_DIR = Path(__file__).resolve().parent.parent.parent
DEFAULT_BANK_ROOT = APP_DIR / "outputs" / "reference_bank_20_best_allcam1_fe"
bank_root = Path(os.getenv("SIGNOVA_BANK_ROOT", str(DEFAULT_BANK_ROOT)))
store = BankStore(bank_root)

def build_reference_study_payload(gloss: str) -> Dict[str, Any] | None:
    asset = store.get_display_reference(gloss)
    if asset is None:
        return None
    source_path = Path(str(asset["video_path"]))
    return {
        "gloss": gloss,
        "video_id": asset.get("video_id"),
        "score": asset.get("score"),
        "poster_url": f"/learn-image/{quote(gloss, safe='')}",
        "reference": {
            "video_url": f"/reference-video/{quote(gloss, safe='')}",
            "playback_url": f"/playback/reference/{quote(gloss, safe='')}",
            "segment": None,
            "video_filename": source_path.name,
        },
    }

@router.get("/curriculum", response_model=CurriculumSchema)
def get_curriculum(db: Session = Depends(get_db)):
    topics = db.query(Topic).order_by(Topic.order_index).all()
    result_topics = []
    
    for t in topics:
        words = db.query(Word).filter(Word.topic_id == t.id).order_by(Word.order_index).all()
        words_schema = []
        glosses = []
        
        for w in words:
            glosses.append(w.gloss)
            study_payload = build_reference_study_payload(w.gloss)
            words_schema.append({
                "order": w.order_index,
                "gloss": w.gloss,
                "checkpoint_group": w.checkpoint_group,
                "study": study_payload
            })
            
        result_topics.append({
            "id": t.id,
            "slug": t.slug,
            "title": t.title,
            "subtitle": t.subtitle,
            "order_index": t.order_index,
            "word_count": len(words),
            "checkpoint_sizes": [5, 10],
            "glosses": glosses,
            "words": words_schema
        })
        
    return {"topics": result_topics}

@router.get("/topics")
def get_topics(db: Session = Depends(get_db)):
    topics = db.query(Topic).order_by(Topic.order_index).all()
    return {"topics": [t.id for t in topics]}

@router.get("/vocabulary/{gloss}")
def get_vocabulary_detail(gloss: str, db: Session = Depends(get_db)):
    word = db.query(Word).filter(Word.gloss == gloss).first()
    if not word:
        raise HTTPException(status_code=404, detail=f"Unknown gloss: {gloss}")
    study = build_reference_study_payload(gloss)
    if study is None:
        raise HTTPException(status_code=404, detail=f"No reference data for gloss: {gloss}")
    return study
