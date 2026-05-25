import sys
from pathlib import Path

# Add project root to path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

def test_ai_recommendation_flow():
    from fastapi.testclient import TestClient
    from api import app
    from app.db import SessionLocal
    from app.models.user import User
    from app.models.ai_recommendation import AIRecommendation

    client = TestClient(app)

    # Clean database from test users & recommendations
    db = SessionLocal()
    try:
        for username in ["test_p_ai", "test_s_ai"]:
            u = db.query(User).filter(User.username == username).first()
            if u:
                db.query(AIRecommendation).filter(AIRecommendation.user_id == u.id).delete()
                db.delete(u)
        db.commit()
    finally:
        db.close()

    print("1. Creating Parent account for AI test...")
    res = client.post("/auth/register", json={
        "username": "test_p_ai",
        "password": "password123",
        "role": "parent"
    })
    assert res.status_code == 201
    parent_token = res.json()["access_token"]
    p_headers = {"Authorization": f"Bearer {parent_token}"}

    print("2. Verifying parent dashboard contains AI recommendation block...")
    res = client.get("/dashboard/parent", headers=p_headers)
    assert res.status_code == 200
    dash_data = res.json()
    assert "ai_recommendation" in dash_data
    ai_rec = dash_data["ai_recommendation"]
    assert "recommendation" in ai_rec
    assert "action_items" in ai_rec
    assert len(ai_rec["action_items"]) > 0
    print("   AI recommendation block found on parent dashboard.")

    print("3. Verifying Parent can refresh AI recommendation via POST endpoint...")
    res = client.post("/dashboard/refresh-ai", headers=p_headers)
    assert res.status_code == 200
    refresh_data = res.json()
    assert "recommendation" in refresh_data
    assert "action_items" in refresh_data
    print("   AI recommendation refresh endpoint works successfully.")

    print("4. Creating School account for AI test...")
    res = client.post("/auth/register", json={
        "username": "test_s_ai",
        "password": "password123",
        "role": "school",
        "school_name": "AI Academy"
    })
    assert res.status_code == 201
    school_token = res.json()["access_token"]
    s_headers = {"Authorization": f"Bearer {school_token}"}

    print("5. Verifying school dashboard contains AI recommendation block...")
    res = client.get("/dashboard/school", headers=s_headers)
    assert res.status_code == 200
    school_dash = res.json()
    assert "ai_recommendation" in school_dash
    s_ai_rec = school_dash["ai_recommendation"]
    assert "recommendation" in s_ai_rec
    assert "action_items" in s_ai_rec
    print("   AI recommendation block found on school dashboard.")

    print("\nALL AI RECOMMENDATION BACKEND TESTS PASSED SUCCESSFULLY!")

if __name__ == "__main__":
    test_ai_recommendation_flow()
