import os
import sys
from pathlib import Path

# Add project root to path
project_root = str(Path(__file__).resolve().parent.parent)
if project_root not in sys.path:
    sys.path.insert(0, project_root)
if 'app' in sys.modules:
    del sys.modules['app']

from sqlalchemy.orm import Session
from app.db import SessionLocal
from app.models.curriculum import Topic, Word
from signova_practice_i.bank_store import BankStore

APP_DIR = Path(__file__).resolve().parent.parent
DEFAULT_BANK_ROOT = APP_DIR / "outputs" / "reference_bank_20_best_allcam1_fe"

CURRICULUM_TOPIC_SIZE = 10
CURRICULUM_TITLES = [
    ("topic_1", "Chủ đề 1", "10 từ đầu tiên"),
    ("topic_2", "Chủ đề 2", "10 từ tiếp theo"),
]

def seed():
    db: Session = SessionLocal()
    try:
        bank_root = Path(os.getenv("SIGNOVA_BANK_ROOT", str(DEFAULT_BANK_ROOT)))
        store = BankStore(bank_root)
        glosses = store.list_glosses()
        
        print(f"Loaded {len(glosses)} glosses from reference bank.")
        
        # 1. Seed Topics
        for topic_index, (topic_id, title, subtitle) in enumerate(CURRICULUM_TITLES):
            topic = db.query(Topic).filter(Topic.id == topic_id).first()
            if not topic:
                topic = Topic(
                    id=topic_id,
                    slug=topic_id,
                    title=title,
                    subtitle=subtitle,
                    order_index=topic_index
                )
                db.add(topic)
                print(f"Added topic: {topic_id}")
            else:
                print(f"Topic {topic_id} already exists.")
                
        db.flush()
        
        # 2. Seed Words
        for topic_index, (topic_id, title, subtitle) in enumerate(CURRICULUM_TITLES):
            start = topic_index * CURRICULUM_TOPIC_SIZE
            end = start + CURRICULUM_TOPIC_SIZE
            topic_glosses = glosses[start:end]
            
            for local_index, gloss in enumerate(topic_glosses, start=1):
                word = db.query(Word).filter(Word.gloss == gloss).first()
                if not word:
                    word = Word(
                        gloss=gloss,
                        topic_id=topic_id,
                        order_index=local_index,
                        checkpoint_group=1 if local_index <= 5 else 2,
                        poster_url=f"/learn-image/{gloss}",
                        reference_video_url=f"/reference-video/{gloss}",
                        reference_playback_url=f"/playback/reference/{gloss}"
                    )
                    db.add(word)
                    print(f"Added word index {local_index} to {topic_id}")
                else:
                    word.poster_url = f"/learn-image/{gloss}"
                    word.reference_video_url = f"/reference-video/{gloss}"
                    word.reference_playback_url = f"/playback/reference/{gloss}"
                    print(f"Updated word paths at index {local_index}")
                    
        # 3. Seed Badges
        from app.models.gamification import Badge
        default_badges = [
            {"code": "first_attempt", "name": "Khởi đầu mới", "description": "Thực hiện lượt luyện tập đầu tiên.", "icon": "🚀", "rule_type": "attempts_count"},
            {"code": "first_correct_word", "name": "Đúng chuẩn", "description": "Đạt trạng thái Đạt (Accepted) cho một từ.", "icon": "✅", "rule_type": "accepted_attempts_count"},
            {"code": "five_words_done", "name": "Chăm chỉ", "description": "Học xong 5 từ vựng.", "icon": "📚", "rule_type": "words_studied"},
            {"code": "checkpoint_clear", "name": "Vượt ải", "description": "Vượt qua bài checkpoint kiểm tra 5 từ.", "icon": "🏁", "rule_type": "checkpoint_passed"},
            {"code": "topic_finisher", "name": "Làm chủ chủ đề", "description": "Hoàn thành tất cả các từ trong chủ đề.", "icon": "👑", "rule_type": "completed_topics"},
            {"code": "three_day_streak", "name": "Kiên trì", "description": "Duy trì chuỗi học tập 3 ngày liên tục.", "icon": "🔥", "rule_type": "streak_days"},
            {"code": "practice_master_80", "name": "Cao thủ 80+", "description": "Đạt điểm số 80 trở lên trong một lần tập.", "icon": "🎖️", "rule_type": "score_threshold"},
            {"code": "practice_master_90", "name": "Đỉnh cao 90+", "description": "Đạt điểm số 90 trở lên trong một lần tập.", "icon": "🏆", "rule_type": "score_threshold"},
        ]
        for b_data in default_badges:
            badge = db.query(Badge).filter(Badge.code == b_data["code"]).first()
            if not badge:
                badge = Badge(
                    code=b_data["code"],
                    name=b_data["name"],
                    description=b_data["description"],
                    icon=b_data["icon"],
                    rule_type=b_data["rule_type"]
                )
                db.add(badge)
                print(f"Added badge: {b_data['code']}")
            else:
                print(f"Badge {b_data['code']} already exists.")

        db.commit()
        print("Seeding curriculum and badges successfully completed.")
        
    except Exception as e:
        db.rollback()
        print(f"Error seeding database: {e}")
        raise e
    finally:
        db.close()

if __name__ == "__main__":
    seed()
