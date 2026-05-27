import httpx
import time
import sys
from pathlib import Path

# Add project root to path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

BASE_URL = "http://127.0.0.1:8010"

def test_flow():
    # We will test using direct HTTP requests against the running API.
    # To run this test, the uvicorn API must be running.
    # For local script test, we can mock it or we can import the FastAPI app and use TestClient.
    # Using FastAPI TestClient is much simpler because we don't need uvicorn running!
    
    from fastapi.testclient import TestClient
    from api import app
    from app.db import SessionLocal
    from app.models.user import User
    
    client = TestClient(app)
    
    # Clear any previous test users to ensure clean state
    db = SessionLocal()
    try:
        u1 = db.query(User).filter(User.username == "test_learner_1").first()
        if u1:
            db.delete(u1)
        u2 = db.query(User).filter(User.username == "test_parent_1").first()
        if u2:
            db.delete(u2)
        db.commit()
    finally:
        db.close()

    print("1. Testing Learner Registration (Minimal: Username + Password)...")
    reg_data = {
        "username": "test_learner_1",
        "password": "password123"
    }
    res = client.post("/auth/register", json=reg_data)
    assert res.status_code == 201
    tokens = res.json()
    assert "access_token" in tokens
    assert "refresh_token" in tokens
    learner_access_token = tokens["access_token"]
    print("   Learner registered successfully.")

    print("2. Testing Learner Login...")
    login_data = {
        "username": "test_learner_1",
        "password": "password123"
    }
    res = client.post("/auth/login", data=login_data)
    assert res.status_code == 200
    assert "access_token" in res.json()
    print("   Learner logged in successfully.")

    print("3. Testing GET /auth/me fallback fields...")
    headers = {"Authorization": f"Bearer {learner_access_token}"}
    res = client.get("/auth/me", headers=headers)
    assert res.status_code == 200
    user_me = res.json()
    assert user_me["username"] == "test_learner_1"
    assert user_me["role"] == "learner"
    assert user_me["email"] is None
    assert user_me["learner_profile"]["display_name"] == "test_learner_1"
    print("   GET /auth/me fallback check passed.")

    print("4. Testing Parent Registration (Minimal: Username + Password)...")
    reg_parent = {
        "username": "test_parent_1",
        "password": "password123",
        "role": "parent"
    }
    res = client.post("/auth/register", json=reg_parent)
    assert res.status_code == 201
    parent_access_token = res.json()["access_token"]
    print("   Parent registered successfully.")

    print("5. Testing search-learner from Parent...")
    p_headers = {"Authorization": f"Bearer {parent_access_token}"}
    res = client.get("/links/search-learner?query=learner_1", headers=p_headers)
    assert res.status_code == 200
    search_results = res.json()
    assert len(search_results) >= 1
    assert search_results[0]["username"] == "test_learner_1"
    print("   Parent successfully searched and found the learner.")

    print("6. Testing Parent Link Request...")
    link_req = {"learner_username": "test_learner_1"}
    res = client.post("/links/parent/request", json=link_req, headers=p_headers)
    assert res.status_code == 200
    link_data = res.json()
    assert link_data["status"] == "pending"
    link_id = link_data["id"]
    print(f"   Parent sent linkage request. Link ID: {link_id}")

    print("7. Testing Learner get pending requests...")
    res = client.get("/links/pending", headers=headers)
    assert res.status_code == 200
    pendings = res.json()
    assert len(pendings["parent_links"]) == 1
    assert pendings["parent_links"][0]["id"] == link_id
    print("   Learner successfully fetched pending link requests.")

    print("8. Testing Learner Approve Request...")
    res = client.post(f"/links/parent/{link_id}/approve", headers=headers)
    assert res.status_code == 200
    print("   Learner approved the parent request.")

    print("9. Testing Dashboard blockage for Learner and Parent success...")
    # Learner Dashboard should fail with 403
    res = client.get("/dashboard/learner", headers=headers)
    assert res.status_code == 403
    print("   Learner dashboard is successfully blocked (403 Forbidden).")
    
    # Parent Dashboard should succeed
    res = client.get("/dashboard/parent", headers=p_headers)
    assert res.status_code == 200
    parent_dash = res.json()
    assert len(parent_dash["linked_learners"]) == 1
    assert parent_dash["linked_learners"][0]["username"] == "test_learner_1"
    print("   Parent dashboard works and returns the linked learner data.")

    print("10. Testing Review Words Route...")
    res = client.get("/progress/review-words", headers=headers)
    assert res.status_code == 200
    review_data = res.json()
    assert "words" in review_data
    print("    Review words endpoint returned successfully.")

    print("\nALL TESTS PASSED SUCCESSFULLY! BACKEND LAYER IS STABLE.")

if __name__ == "__main__":
    test_flow()
