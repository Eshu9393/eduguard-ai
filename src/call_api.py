import httpx
from app.schemas import FIELD_TO_COLUMN
from data_preprocessing import load_data

URL = "http://127.0.0.1:8000"
row = load_data().iloc[0]
payload = {f: row[c].item() for f, c in FIELD_TO_COLUMN.items()}

r = httpx.post(f"{URL}/predict", json=payload)
print("valid  :", r.status_code, r.json())

r = httpx.post(f"{URL}/predict", json=dict(payload, age_at_enrollment=5))
print("invalid:", r.status_code, r.json()["detail"][0]["msg"])

r = httpx.get(f"{URL}/model-info")
print("info   :", r.status_code, r.json()["test_accuracy"])