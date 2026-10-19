import json
import os

from sklearn.dummy import DummyClassifier
from sklearn.ensemble import GradientBoostingClassifier, RandomForestClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import make_scorer, recall_score
from sklearn.model_selection import StratifiedKFold, cross_validate
from sklearn.pipeline import Pipeline
from sklearn.svm import SVC
from sklearn.tree import DecisionTreeClassifier

from data_preprocessing import RANDOM_STATE, build_preprocessor, load_data, split_data

FEATURE_SET = "B"
SCORING = {
    "accuracy": "accuracy",
    "precision_macro": "precision_macro",
    "recall_macro": "recall_macro",
    "f1_macro": "f1_macro",
    "f1_weighted": "f1_weighted",
    "dropout_recall": make_scorer(recall_score, labels=["Dropout"], average="macro"),
}
MODELS = {
    "Dummy (majority)": DummyClassifier(strategy="most_frequent"),
    "Logistic Regression": LogisticRegression(max_iter=2000),
    "Decision Tree": DecisionTreeClassifier(max_depth=5, random_state=RANDOM_STATE),
    "Random Forest": RandomForestClassifier(n_estimators=200, random_state=RANDOM_STATE, n_jobs=-1),
    "SVM": SVC(random_state=RANDOM_STATE),
    "Gradient Boosting": GradientBoostingClassifier(random_state=RANDOM_STATE),
    "Gradient Boosting (tuned)": GradientBoostingClassifier(
        random_state=RANDOM_STATE, learning_rate=0.1, max_depth=3, n_estimators=200),
}

if __name__ == "__main__":
    df = load_data()
    X_train, _, y_train, _ = split_data(df, FEATURE_SET)  # test split stays untouched
    cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=RANDOM_STATE)

    results = []
    for name, model in MODELS.items():
        pipe = Pipeline([("pre", build_preprocessor(FEATURE_SET)), ("model", model)])
        res = cross_validate(pipe, X_train, y_train, cv=cv, scoring=SCORING, n_jobs=-1)
        row = {"model": name}
        for metric in SCORING:
            scores = res[f"test_{metric}"]
            row[metric] = {"mean": round(float(scores.mean()), 4),
                           "std": round(float(scores.std()), 4)}
        results.append(row)
        print(f"{name:27} acc {row['accuracy']['mean']:.3f} | "
              f"macro-F1 {row['f1_macro']['mean']:.3f} | "
              f"dropout recall {row['dropout_recall']['mean']:.3f}")

    os.makedirs("reports", exist_ok=True)
    with open("reports/model_comparison.json", "w") as f:
        json.dump({"feature_set": FEATURE_SET, "cv_folds": 5,
                   "random_state": RANDOM_STATE, "n_train": len(X_train),
                   "results": results}, f, indent=2)
    print("Saved reports/model_comparison.json")