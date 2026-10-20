import json

from pydantic import ValidationError

from app.schemas import FIELD_TO_COLUMN, StudentFeatures
from data_preprocessing import load_data

df = load_data()
row = json.loads(df.iloc[[0]].to_json(orient="records"))[0]
payload = {field: row[col] for field, col in FIELD_TO_COLUMN.items()}

student = StudentFeatures(**payload)
print("Valid payload accepted:", student.age_at_enrollment, student.sem1_approved)

bad = dict(payload, age_at_enrollment=5, gender=2)
try:
    StudentFeatures(**bad)
except ValidationError as e:
    print("Bad payload rejected with", e.error_count(), "errors:")
    for err in e.errors():
        print(" -", err["loc"][0], "->", err["msg"])