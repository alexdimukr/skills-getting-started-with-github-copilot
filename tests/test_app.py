from fastapi.testclient import TestClient
from src import app as app_module

client = TestClient(app_module.app)


def test_get_activities():
    resp = client.get("/activities")
    assert resp.status_code == 200
    data = resp.json()
    # Basic sanity checks
    assert isinstance(data, dict)
    assert "Chess Club" in data


def test_signup_and_unregister_cycle():
    activity = "Chess Club"
    email = "testuser@example.com"

    # Ensure clean state
    if email in app_module.activities[activity]["participants"]:
        app_module.activities[activity]["participants"].remove(email)

    # Sign up
    resp = client.post(f"/activities/{activity}/signup", params={"email": email})
    assert resp.status_code == 200
    assert email in app_module.activities[activity]["participants"]
    assert "Signed up" in resp.json().get("message", "")

    # Signing up again should fail (already signed up)
    resp_dup = client.post(f"/activities/{activity}/signup", params={"email": email})
    assert resp_dup.status_code == 400

    # Unregister
    resp_un = client.delete(f"/activities/{activity}/unregister", params={"email": email})
    assert resp_un.status_code == 200
    assert email not in app_module.activities[activity]["participants"]


def test_signup_missing_activity():
    resp = client.post("/activities/NoSuchActivity/signup", params={"email": "x@y.com"})
    assert resp.status_code == 404


def test_unregister_not_registered():
    activity = "Programming Class"
    email = "not-registered@example.com"
    # Ensure email not present
    if email in app_module.activities[activity]["participants"]:
        app_module.activities[activity]["participants"].remove(email)

    resp = client.delete(f"/activities/{activity}/unregister", params={"email": email})
    assert resp.status_code == 404
