from app.predictor import Predictor
from app.schemas import FIELD_TO_COLUMN, StudentFeatures
from data_preprocessing import load_data

df = load_data()
predictor = Predictor()

for i in [0, 1, 2]:
    row = df.iloc[i]
    student = StudentFeatures(**{f: row[c].item() for f, c in FIELD_TO_COLUMN.items()})
    result = predictor.predict(student)
    print(f"row {i}: actual={row['Target']:9} predicted={result['prediction']:9} {result['probabilities']}")