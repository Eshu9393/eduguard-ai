from sklearn.pipeline import Pipeline
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import GradientBoostingClassifier
from sklearn.metrics import make_scorer, recall_score
from sklearn.model_selection import GridSearchCV, StratifiedKFold
from data_preprocessing import load_data, split_data, build_preprocessor, RANDOM_STATE

SCORING = {
    "macro_f1": "f1_macro",
    "dropout_recall": make_scorer(recall_score, labels=["Dropout"], average="macro"),
}

SEARCHES = {
    "LogReg": (
        LogisticRegression(max_iter=3000),
        {"model__C": [0.01, 0.1, 1, 10],
         "model__class_weight": [None, "balanced"]},
    ),
    "GradBoost": (
        GradientBoostingClassifier(random_state=RANDOM_STATE),
        {"model__n_estimators": [100, 200],
         "model__learning_rate": [0.05, 0.1],
         "model__max_depth": [2, 3]},
    ),
}

if __name__ == "__main__":
    df = load_data()
    X_train, X_test, y_train, y_test = split_data(df, "B")
    cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=RANDOM_STATE)

    for name, (model, grid) in SEARCHES.items():
        pipe = Pipeline([("pre", build_preprocessor("B")), ("model", model)])
        gs = GridSearchCV(pipe, grid, scoring=SCORING, refit="macro_f1", cv=cv, n_jobs=-1)
        gs.fit(X_train, y_train)
        i = gs.best_index_
        print(f"\n{name}: best params {gs.best_params_}")
        print(f"  macro-F1 {gs.cv_results_['mean_test_macro_f1'][i]:.3f} | "
              f"dropout recall {gs.cv_results_['mean_test_dropout_recall'][i]:.3f}")
        print("  all configs (macro-F1 / dropout recall):")
        for p, f, r in zip(gs.cv_results_["params"],
                           gs.cv_results_["mean_test_macro_f1"],
                           gs.cv_results_["mean_test_dropout_recall"]):
            print(f"    {f:.3f} / {r:.3f}  {p}")