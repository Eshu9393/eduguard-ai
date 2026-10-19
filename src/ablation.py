from sklearn.compose import ColumnTransformer
from sklearn.ensemble import GradientBoostingClassifier
from sklearn.metrics import make_scorer, recall_score
from sklearn.model_selection import StratifiedKFold, cross_validate
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder, StandardScaler

from data_preprocessing import RANDOM_STATE, load_data, split_data
from features import BINARY, CATEGORICAL, FEATURES_B

PARAMS = dict(learning_rate=0.1, max_depth=3, n_estimators=200)
SCORING = {
    "accuracy": "accuracy",
    "macro_f1": "f1_macro",
    "dropout_recall": make_scorer(recall_score, labels=["Dropout"], average="macro"),
}
VARIANTS = {
    "full B": [],
    "B without fees/debtor": ["Tuition fees up to date", "Debtor"],
    "B without fees/debtor/gender/macro": [
        "Tuition fees up to date", "Debtor", "Gender",
        "Inflation rate", "Unemployment rate", "GDP",
    ],
}


def make_pipe(cols):
    binary = [c for c in cols if c in BINARY]
    categorical = [c for c in cols if c in CATEGORICAL]
    numeric = [c for c in cols if c not in BINARY + CATEGORICAL]
    pre = ColumnTransformer([
        ("bin", "passthrough", binary),
        ("cat", OneHotEncoder(handle_unknown="ignore", sparse_output=False), categorical),
        ("num", StandardScaler(), numeric),
    ])
    model = GradientBoostingClassifier(random_state=RANDOM_STATE, **PARAMS)
    return Pipeline([("pre", pre), ("model", model)])


if __name__ == "__main__":
    df = load_data()
    X_train, _, y_train, _ = split_data(df, "B")
    cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=RANDOM_STATE)

    for name, drop in VARIANTS.items():
        cols = [c for c in FEATURES_B if c not in drop]
        res = cross_validate(make_pipe(cols), X_train[cols], y_train,
                             cv=cv, scoring=SCORING, n_jobs=-1)
        print(f"{name:38} | {len(cols)} features | "
              f"acc {res['test_accuracy'].mean():.3f} | "
              f"macro-F1 {res['test_macro_f1'].mean():.3f} | "
              f"dropout recall {res['test_dropout_recall'].mean():.3f}")