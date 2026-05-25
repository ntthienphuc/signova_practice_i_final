import json
import requests
from datetime import datetime, timezone
from sqlalchemy import func
from sqlalchemy.orm import Session
from app.config import settings
from app.models.user import User
from app.models.ai_recommendation import AIRecommendation
from app.models.link import ParentLearnerLink, SchoolLearnerLink
from app.models.progress import LearnerTopicProgress, LearnerWordProgress
from app.models.curriculum import Word, Topic

def _get_progress_summary_data(db: Session, user: User) -> dict:
    """
    Gather stats about linked learners for Parent or School user.
    """
    summary = {
        "role": user.role,
        "learners": []
    }

    if user.role == "parent":
        # Get linked children
        links = db.query(ParentLearnerLink).filter(
            ParentLearnerLink.parent_user_id == user.id,
            ParentLearnerLink.status == "approved"
        ).all()
        learner_ids = [link.learner_user_id for link in links]
        
        # Include parent self progress if they have attempts
        from app.routers.progress import get_or_create_learner_profile
        get_or_create_learner_profile(user, db)
        learner_ids.append(user.id)
    elif user.role == "school":
        links = db.query(SchoolLearnerLink).filter(
            SchoolLearnerLink.school_user_id == user.id,
            SchoolLearnerLink.status == "approved"
        ).all()
        learner_ids = [link.learner_user_id for link in links]
    else:
        return summary

    for lid in learner_ids:
        learner_user = db.query(User).filter(User.id == lid).first()
        if not learner_user:
            continue
        
        # Determine learner display name
        display_name = learner_user.username
        is_self = (lid == user.id)
        if is_self:
            display_name = "Bản thân (Phụ huynh)"
        elif learner_user.learner_profile:
            display_name = learner_user.learner_profile.display_name

        # Topic progress details
        t_progress = db.query(LearnerTopicProgress).filter(
            LearnerTopicProgress.learner_user_id == lid
        ).all()
        topics_info = []
        for tp in t_progress:
            topic = db.query(Topic).filter(Topic.id == tp.topic_id).first()
            title = topic.title if topic else tp.topic_id
            topics_info.append({
                "topic_title": title,
                "completed_words": tp.completed_words,
                "completed": tp.completed
            })

        # Word details (struggling and completed)
        w_progress = db.query(LearnerWordProgress).filter(
            LearnerWordProgress.learner_user_id == lid
        ).all()
        
        struggling_words = []
        completed_words = []
        
        for wp in w_progress:
            word = db.query(Word).filter(Word.id == wp.word_id).first()
            if not word:
                continue
            word_gloss = word.gloss
            
            # Struggling if failed attempts exceed correct attempts or score is low despite practicing
            if wp.failed_attempt_count > wp.correct_attempt_count or (wp.best_practice1_score is not None and wp.best_practice1_score < 90):
                struggling_words.append(word_gloss)
            elif wp.correct_attempt_count > 0 or (wp.best_practice1_score is not None and wp.best_practice1_score >= 90):
                completed_words.append(word_gloss)

        summary["learners"].append({
            "name": display_name,
            "username": learner_user.username,
            "role": learner_user.role,
            "is_self": is_self,
            "streak": learner_user.learner_profile.learning_streak if learner_user.learner_profile else 0,
            "xp": learner_user.learner_profile.xp if learner_user.learner_profile else 0,
            "topic_progress": topics_info,
            "struggling_words": struggling_words,
            "completed_words": completed_words
        })

    return summary

def _generate_fallback_recommendation(progress_data: dict) -> dict:
    """
    Rules-based fallback generator if Gemini API key is missing or fails.
    """
    role = progress_data.get("role", "parent")
    learners = progress_data.get("learners", [])
    
    # Filter out parent self progress for parent dashboard kids review unless there is only parent progress
    kids_only = [l for l in learners if not l.get("is_self")]
    
    if not learners or (role == "parent" and not kids_only and len(learners) <= 1 and learners[0].get("xp") == 0):
        if role == "parent":
            return {
                "recommendation": "Chào mừng ba mẹ đến với Signova! Hiện tại chưa có bé nào học tập được liên kết với tài khoản của ba mẹ. Ba mẹ hãy vào mục **Tài khoản** để tự tạo tài khoản riêng cho bé hoặc kết nối để cùng bắt đầu học nhé! Mascot Signova rất hào hứng được đồng hành cùng gia đình! 🦉✨",
                "action_items": [
                    "Tạo tài khoản học tập trực tiếp cho con ở tab Tài khoản",
                    "Khám phá các chủ đề học tập thú vị cùng Signova"
                ]
            }
        else:
            return {
                "recommendation": "Chào mừng nhà trường đến với Signova School! Hiện tại chưa có học sinh nào được liên kết với tài khoản lớp học của thầy cô. Thầy cô hãy chia sẻ tài khoản trực tiếp hoặc tạo tài khoản cho các bé để bắt đầu theo dõi tiến trình học ngôn ngữ ký hiệu nhé! 🏫🦉",
                "action_items": [
                    "Tạo hoặc liên kết tài khoản học sinh ở tab Tài khoản",
                    "Xem lại danh sách giáo trình của trường"
                ]
            }

    # Analyze the first learner/kid for detailed feedback
    target = kids_only[0] if kids_only else learners[0]
    name = target["name"]
    struggling = target["struggling_words"]
    streak = target["streak"]
    xp = target["xp"]
    
    if xp == 0:
        if role == "parent":
            return {
                "recommendation": f"Bé **{name}** vừa gia nhập Signova nhưng chưa bắt đầu bài học nào cả. Ba mẹ hãy dành khoảng 10 phút tối nay để cùng con bắt đầu học thử 3 từ đầu tiên trong **Chủ đề 1** nhé. Học ngôn ngữ ký hiệu cùng ba mẹ sẽ vui và dễ nhớ hơn rất nhiều đấy! 🌟👶",
                "action_items": [
                    f"Cùng bé học thử 3 từ đầu tiên trong Chủ đề 1",
                    f"Khích lệ bé đăng nhập bằng tài khoản và trải nghiệm bài đầu tiên"
                ]
            }
        else:
            return {
                "recommendation": f"Học sinh **{name}** trong danh sách lớp chưa bắt đầu thực hiện bài tập thực hành nào. Thầy cô có thể nhắc nhở bé tham gia học các từ cơ bản của Chủ đề 1 trong buổi tự học sắp tới nhé! 📚🏫",
                "action_items": [
                    f"Nhắc nhở học sinh {name} tham gia luyện tập từ cơ bản",
                    "Tổ chức thi đua nhận XP giữa các bạn học sinh trong lớp"
                ]
            }

    if struggling:
        words_str = ", ".join(f"'{w}'" for w in struggling[:3])
        if role == "parent":
            return {
                "recommendation": f"Mascot Signova thấy bé **{name}** đang luyện tập rất tích cực (đã đạt {xp} XP)! Tuy nhiên, bé đang gặp chút bỡ ngỡ với các từ: **{words_str}** (lỗi khớp chuyển động tay hơi cao). Ba mẹ hãy cùng con xem kỹ video hướng dẫn mẫu và sửa tư thế tay nhé! Bé sẽ làm được thôi! 💪🦉",
                "action_items": [
                    f"Cùng bé ôn tập lại từ bị sai: {words_str}",
                    f"Khen ngợi bé vì sự kiên trì luyện tập vượt qua từ khó"
                ]
            }
        else:
            return {
                "recommendation": f"Lớp học ghi nhận học sinh **{name}** thực hiện nhiều lượt luyện tập nhưng đang gặp trở ngại ở các từ: **{words_str}**. Thầy cô có thể dành 2 phút cuối tiết học để hướng dẫn trực tiếp tư thế tay chuẩn cho học sinh này nhé! 🧑‍🏫📖",
                "action_items": [
                    f"Hướng dẫn trực tiếp cử chỉ chuẩn của từ {words_str} cho học sinh {name}",
                    "Tạo bài tập kiểm tra nhỏ để củng cố phản xạ cho học sinh"
                ]
            }

    # If no struggling words and has XP, congratulate them!
    if role == "parent":
        return {
            "recommendation": f"Tuyệt vời quá! Bé **{name}** đang duy trì tiến độ học tập cực tốt với **{streak} ngày** học liên tiếp và tổng cộng **{xp} XP** tích lũy. Bé đã nắm rất vững các từ vựng đã học. Ba mẹ hãy tiếp tục khích lệ và đồng hành cùng bé chinh phục các từ tiếp theo nhé! 🎉🦉",
            "action_items": [
                f"Tuyên dương bé {name} vì đã chăm chỉ tự học ngôn ngữ ký hiệu",
                "Cho phép bé bắt đầu học bài mới của chủ đề tiếp theo"
            ]
        }
    else:
        return {
            "recommendation": f"Học sinh **{name}** đang thể hiện xuất sắc với tiến độ học đều đặn và đạt **{xp} XP** cao. Không có từ vựng nào bị đánh giá sai lệch tư thế đáng lo ngại. Lớp học đang đi đúng hướng, thầy cô hãy tiếp tục phát huy nhé! 🌟🏫",
            "action_items": [
                f"Khen thưởng thành tích học tập tốt của học sinh {name} trước lớp",
                "Khuyến khích học sinh giúp đỡ các bạn khác cùng tiến bộ"
            ]
        }

def generate_recommendation(db: Session, user: User, force_refresh: bool = False) -> AIRecommendation:
    """
    Retrieves or generates (and caches) the AI Recommendation for Parent/School.
    """
    # 1. Check if we already have a recommendation in DB
    rec = db.query(AIRecommendation).filter(AIRecommendation.user_id == user.id).first()
    
    if rec and not force_refresh:
        # Check cache age
        time_diff = datetime.now(timezone.utc) - rec.updated_at.replace(tzinfo=timezone.utc)
        minutes_passed = time_diff.total_seconds() / 60.0
        if minutes_passed < settings.gemini_update_interval_minutes:
            return rec

    # 2. Re-generate recommendation
    progress_data = _get_progress_summary_data(db, user)
    
    api_key = settings.gemini_api_key
    gemini_data = None
    
    if api_key:
        try:
            # Call Google Gemini API
            url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={api_key}"
            headers = {"Content-Type": "application/json"}
            
            prompt_role_desc = "phụ huynh học sinh (ba mẹ)" if user.role == "parent" else "thầy cô giáo nhà trường"
            prompt = (
                "Bạn là Mascot Signova - chú chim cú đáng yêu, cực kỳ thân thiện và am hiểu ngôn ngữ ký hiệu của Signova.\n"
                f"Bạn đang viết lời khuyên cho {prompt_role_desc} dựa trên dữ liệu học tập dưới đây.\n"
                "Hãy phân tích tiến độ, số từ đúng, và các từ mà bé/học sinh đang học sai nhiều (lỗi khớp chuyển động cao).\n"
                "Sau đó viết một đoạn văn khuyên bảo ngắn gọn (3-4 câu) bằng tiếng Việt thật sinh động, truyền động lực, sử dụng emoji thích hợp.\n"
                "Đồng thời, đề xuất 2-3 việc cần làm cụ thể ngắn gọn, thực tiễn để ba mẹ/thầy cô đồng hành cùng bé.\n\n"
                f"Dữ liệu tiến độ học tập: \n{json.dumps(progress_data, ensure_ascii=False, indent=2)}\n\n"
                "Yêu cầu trả về đúng duy nhất định dạng JSON có cấu trúc như sau (không kèm markdown block hay văn bản thừa khác bên ngoài JSON):\n"
                "{\n"
                '  "recommendation": "Đoạn văn khuyên bảo thân thiện bằng tiếng Việt...",\n'
                '  "action_items": [\n'
                '    "Việc cụ thể cần làm 1",\n'
                '    "Việc cụ thể cần làm 2"\n'
                '  ]\n'
                "}"
            )
            
            payload = {
                "contents": [
                    {
                        "parts": [
                            {"text": prompt}
                        ]
                    }
                ],
                "generationConfig": {
                    "responseMimeType": "application/json"
                }
            }
            
            response = requests.post(url, headers=headers, json=payload, timeout=12)
            if response.status_code == 200:
                res_json = response.json()
                text_content = res_json["candidates"][0]["content"]["parts"][0]["text"].strip()
                # Clean prefix/suffix markdown wrappers if Gemini model didn't respect responseMimeType
                if text_content.startswith("```json"):
                    text_content = text_content[7:]
                if text_content.endswith("```"):
                    text_content = text_content[:-3]
                text_content = text_content.strip()
                
                gemini_data = json.loads(text_content)
        except Exception as e:
            print(f"Error calling Gemini API: {e}. Falling back to rules-based recommendations.")
    
    # 3. Fallback if Gemini failed or wasn't configured
    if not gemini_data:
        gemini_data = _generate_fallback_recommendation(progress_data)

    # 4. Save to DB
    if not rec:
        rec = AIRecommendation(
            user_id=user.id,
            recommendation_text=gemini_data["recommendation"],
            action_items_json=gemini_data["action_items"]
        )
        db.add(rec)
    else:
        rec.recommendation_text = gemini_data["recommendation"]
        rec.action_items_json = gemini_data["action_items"]
        rec.updated_at = func.now()
        
    db.commit()
    db.refresh(rec)
    return rec
