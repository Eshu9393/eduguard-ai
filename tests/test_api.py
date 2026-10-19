import pytest
from fastapi.testclient import TestClient

from app.main import app

VALID_STUDENT = {
    "gender": 1, "debtor": 0, "scholarship_holder": 0, "displaced": 1,
    "international": 0, "educational_special_needs": 0, "daytime_attendance": 1,
    "tuition_fees_up_to_date": 1,
    "marital_status": 1, "application_mode": 17, "course": 9238,
    "previous_qualification": 1, "nationality": 1,
    "mothers_qualification": 19, "fathers_qualification": 19,
    "mothers_occupation": 5, "fathers_occupation": 5,
    "application_order": 1, "previous_qualification_grade": 130.0,
    "admission_grade": 125.0, "age_at_enrollment": 19,
    "inflation_rate": 1.4, "unemployment_rate": 11.1, "gdp": 0.32,
    "sem1_credited": 0, "sem1_enrolled": 6, "sem1_evaluations": 8,
    "sem1_approved": 5, "sem1_grade": 12.5, "sem1_without_evaluations": 0,
}


@pytest.fixture(scope="module")
def client():
    with TestClient(app) as c:  # "with" runs the startup (model loading)
        yield c


def test_root(client):
    r = client.get("/")
    assert r.status_code == 200
    assert r.json()["service"] == "EduGuard AI"


def test_health_reports_model_loaded(client):
    r = client.get("/health")
    assert r.status_code == 200
    assert r.json() == {"status": "ok", "model_loaded": True}


def test_model_info(client):
    r = client.get("/model-info")
    assert r.status_code == 200
    body = r.json()
    assert body["feature_set"] == "B"
    assert len(body["features"]) == 30


def test_predict_valid(client):
    r = client.post("/predict", json=VALID_STUDENT)
    assert r.status_code == 200
    body = r.json()
    assert body["prediction"] in {"Dropout", "Enrolled", "Graduate"}
    assert set(body["probabilities"]) == {"Dropout", "Enrolled", "Graduate"}
    assert sum(body["probabilities"].values()) == pytest.approx(1.0, abs=0.01)
    assert "estimate" in body["disclaimer"]


@pytest.mark.parametrize("change", [
    {"age_at_enrollment": 5},        # below allowed range
    {"gender": 2},                   # not 0 or 1
    {"sem1_grade": 25.0},            # above the 0-20 scale
    {"admission_grade": "high"},     # wrong type
    {"sem1_aproved": 3},             # misspelled extra field
])
def test_predict_rejects_invalid_values(client, change):
    r = client.post("/predict", json={**VALID_STUDENT, **change})
    assert r.status_code == 422


def test_predict_rejects_missing_field(client):
    payload = {k: v for k, v in VALID_STUDENT.items() if k != "sem1_approved"}
    r = client.post("/predict", json=payload)
    assert r.status_code == 422
    assert "sem1_approved" in str(r.json()["detail"])

def test_model_performance(client):
    r = client.get("/model-performance")
    assert r.status_code == 200
    test = r.json()["test"]
    assert test["labels"] == ["Dropout", "Enrolled", "Graduate"]
    cm = test["confusion_matrix"]
    assert len(cm) == 3 and all(len(row) == 3 for row in cm)
    assert set(test["per_class"]) == {"Dropout", "Enrolled", "Graduate"}