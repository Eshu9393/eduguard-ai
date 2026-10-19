from sklearn.pipeline import Pipeline
from sklearn.dummy import DummyClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import make_scorer, recall_score
from sklearn.model_selection import StratifiedKFold, cross_validate
from data_preprocessing import load_data, split_data, build_preprocessor, RANDOM_STATE

SCORING = {
    "accuracy": "accuracy",
    "macro_f1": "f1_macro",
    "dropout_recall": make_scorer(recall_score, labels=["Dropout"], average="macro"),
}

if __name__ == "__main__":
    df = load_data()
    cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=RANDOM_STATE)
    models = {
        "Dummy": DummyClassifier(strategy="most_frequent"),
        "LogReg": LogisticRegression(max_iter=2000),
    }
    for fs in ["A", "B", "C"]:
        X_train, X_test, y_train, y_test = split_data(df, fs)
        for name, model in models.items():
            pipe = Pipeline([("pre", build_preprocessor(fs)), ("model", model)])
            res = cross_validate(pipe, X_train, y_train, cv=cv, scoring=SCORING)
            print(f"Set {fs} | {name:7} | "
                  f"acc {res['test_accuracy'].mean():.3f} | "
                  f"macro-F1 {res['test_macro_f1'].mean():.3f} | "
                  f"dropout recall {res['test_dropout_recall'].mean():.3f}")