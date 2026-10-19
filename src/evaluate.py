import json
import os

import joblib
import matplotlib.pyplot as plt
from features import BINARY, CATEGORICAL
from sklearn.ensemble import GradientBoostingClassifier
from sklearn.metrics import (ConfusionMatrixDisplay, accuracy_score,
                             classification_report, f1_score,confusion_matrix)
from sklearn.pipeline import Pipeline

from data_preprocessing import (RANDOM_STATE, FEATURE_SETS, build_preprocessor,
                                load_data, split_data)

FEATURE_SET = "B"
PARAMS = dict(learning_rate=0.1, max_depth=3, n_estimators=200)
LABELS = ["Dropout", "Enrolled", "Graduate"]

if __name__ == "__main__":
    df = load_data()
    X_train, X_test, y_train, y_test = split_data(df, FEATURE_SET)

    pipe = Pipeline([
        ("pre", build_preprocessor(FEATURE_SET)),
        ("model", GradientBoostingClassifier(random_state=RANDOM_STATE, **PARAMS)),
    ])
    pipe.fit(X_train, y_train)
    pred = pipe.predict(X_test)

    print(classification_report(y_test, pred, digits=3))

    os.makedirs("reports/figures", exist_ok=True)
    ConfusionMatrixDisplay.from_predictions(
        y_test, pred, labels=LABELS, cmap="Blues")
    plt.title("Test set confusion matrix")
    plt.savefig("reports/figures/confusion_matrix.png", dpi=150, bbox_inches="tight")
    plt.close()

    os.makedirs("models", exist_ok=True)
    joblib.dump(pipe, "models/pipeline.joblib")
    metrics = {
        "feature_set": FEATURE_SET,
        "features": FEATURE_SETS[FEATURE_SET],
        "params": PARAMS,
        "random_state": RANDOM_STATE,
        "test_accuracy": accuracy_score(y_test, pred),
        "test_macro_f1": f1_score(y_test, pred, average="macro"),
        "test_weighted_f1": f1_score(y_test, pred, average="weighted"),
                "labels": LABELS,
        "confusion_matrix": confusion_matrix(y_test, pred, labels=LABELS).tolist(),
        "report": classification_report(y_test, pred, output_dict=True),
    }
    with open("models/metrics.json", "w") as f:
        json.dump(metrics, f, indent=2)
        baseline = {}
    for c in X_train.columns:
        if c in BINARY or c in CATEGORICAL:
            baseline[c] = int(X_train[c].mode().iloc[0])
        else:
            baseline[c] = float(X_train[c].median())
    with open("models/baseline.json", "w") as f:
        json.dump(baseline, f, indent=2)
    print("Saved models/pipeline.joblib and models/metrics.json")