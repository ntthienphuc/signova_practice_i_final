import sys
from pathlib import Path

# Add project root to path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

def test_direct_creation_flow():
    from fastapi.testclient import TestClient
    from api import app
    from app.db import SessionLocal
    from app.models.user import User
    
    client = TestClient(app)
    
    # Clean database from test users
    db = SessionLocal()
    try:
        for username in ["test_p1", "test_c1", "test_c2", "test_s1", "test_st1"]:
            u = db.query(User).filter(User.username == username).first()
            if u:
                db.delete(u)
        db.commit()
    finally:
        db.close()

    print("1. Creating Parent account...")
    res = client.post("/auth/register", json={
        "username": "test_p1",
        "password": "password123",
        "role": "parent"
    })
    assert res.status_code == 201
    parent_token = res.json()["access_token"]
    p_headers = {"Authorization": f"Bearer {parent_token}"}

    print("2. Creating child account directly from parent...")
    child_data = {
        "username": "test_c1",
        "password": "password456",
        "display_name": "Nguyen Gia Bao",
        "dob": "2015-06-15"
    }
    res = client.post("/auth/create-child", json=child_data, headers=p_headers)
    assert res.status_code == 200
    assert res.json()["ok"] is True
    assert "child_id" in res.json()
    print("   Child created successfully.")

    print("3. Verifying parent cannot create duplicate child...")
    res = client.post("/auth/create-child", json=child_data, headers=p_headers)
    assert res.status_code == 400
    assert "already registered" in res.json()["detail"].lower()
    print("   Duplicate validation passed.")

    print("4. Verifying parent dashboard contains newly created child progress...")
    res = client.get("/dashboard/parent", headers=p_headers)
    assert res.status_code == 200
    dash_data = res.json()
    assert len(dash_data["linked_learners"]) == 1
    assert dash_data["linked_learners"][0]["username"] == "test_c1"
    assert dash_data["linked_learners"][0]["display_name"] == "Nguyen Gia Bao"
    print("   Parent-child auto-linking verified.")

    print("5. Creating School account...")
    res = client.post("/auth/register", json={
        "username": "test_s1",
        "password": "password123",
        "role": "school",
        "school_name": "Signova Academy"
    })
    assert res.status_code == 201
    school_token = res.json()["access_token"]
    s_headers = {"Authorization": f"Bearer {school_token}"}

    print("6. Creating student account directly from school...")
    student_data = {
        "username": "test_st1",
        "password": "password789",
        "display_name": "Tran Van Binh",
        "class_name": "3A",
        "student_code": "HS005"
    }
    res = client.post("/auth/create-student", json=student_data, headers=s_headers)
    assert res.status_code == 200
    assert res.json()["ok"] is True
    assert "student_id" in res.json()
    print("   Student created successfully.")

    print("7. Verifying school dashboard contains student data with auto-linking...")
    res = client.get("/dashboard/school", headers=s_headers)
    assert res.status_code == 200
    school_dash = res.json()
    assert len(school_dash["linked_learners"]) == 1
    assert school_dash["linked_learners"][0]["username"] == "test_st1"
    assert school_dash["linked_learners"][0]["class_name"] == "3A"
    assert school_dash["linked_learners"][0]["student_code"] == "HS005"
    print("   School-student auto-linking verified.")

    print("\nALL BACKEND API TESTS PASSED SUCCESSFULLY!")

if __name__ == "__main__":
    test_direct_creation_flow()
