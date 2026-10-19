from sklearn.pipeline import Pipeline
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import StratifiedKFold, cross_val_predict
from sklearn.metrics import classification_report
from data_preprocessing import load_data, split_data, build_preprocessor, RANDOM_STATE

df = load_data()
X_train, X_test, y_train, y_test = split_data(df, "B")
cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=RANDOM_STATE)

for cw in [None, "balanced"]:
    pipe = Pipeline([
        ("pre", build_preprocessor("B")),
        ("model", LogisticRegression(max_iter=2000, class_weight=cw)),
    ])
    pred = cross_val_predict(pipe, X_train, y_train, cv=cv)
    print(f"\n=== class_weight={cw} ===")
    print(classification_report(y_train, pred, digits=3))