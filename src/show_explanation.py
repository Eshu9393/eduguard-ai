import httpx

from app.schemas import FIELD_TO_COLUMN
from data_preprocessing import load_data

row = load_data().iloc[2]  # a real student whose actual outcome was Enrolled
payload = {f: row[c].item() for f, c in FIELD_TO_COLUMN.items()}

body = httpx.post("http://127.0.0.1:8000/predict", json=payload, timeout=30).json()
print("prediction  :", body["prediction"], body["probabilities"])

exp = body["explanation"]
if exp is None:
    print("explanation : None (is models/baseline.json present?)")
else:
    print(f"typical student's Dropout score: {exp['typical_student_score']}")
    print(f"this student's Dropout score   : {exp['student_score']}")
    for f in exp["top_factors"]:
        print(f"  {f['effect']:+.3f}  {f['feature']} = {f['value']:g} (typical {f['typical_value']:g})")
    print(f"  {exp['other_features_effect']:+.3f}  all other features combined")