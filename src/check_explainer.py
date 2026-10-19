import json
import time

import joblib

from app.explainer import DropoutExplainer
from data_preprocessing import load_data, split_data

pipe = joblib.load("models/pipeline.joblib")
meta = json.load(open("models/metrics.json"))
explainer = DropoutExplainer(pipe, meta["features"])
_, X_test, _, y_test = split_data(load_data(), "B")

for i in range(3):
    row = X_test.iloc[[i]]
    t0 = time.time()
    res = explainer.explain(row)
    real = pipe.predict_proba(row)[0][explainer.dropout_idx]
    print(f"\nStudent {i}: actual outcome = {y_test.iloc[i]}")
    print(f"  typical student's Dropout score: {res['typical_student_score']:.3f}")
    print(f"  this student's Dropout score   : {real:.3f}")
    print(f"  additivity gap                 : {abs(real - res['student_score']):.6f}")
    print(f"  ({time.time() - t0:.1f}s)")
    for e in res["effects"][:6]:
        print(f"  {e['effect']:+.3f}  {e['feature']} = {e['value']:g} "
              f"(typical {e['typical_value']:g})")