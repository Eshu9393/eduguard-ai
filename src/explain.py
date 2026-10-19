import joblib
import numpy as np
import shap
from data_preprocessing import load_data, split_data, RANDOM_STATE

FEATURE_SET = "B"

if __name__ == "__main__":
    pipe = joblib.load("models/pipeline.joblib")
    df = load_data()
    X_train, X_test, y_train, y_test = split_data(df, FEATURE_SET)

    pre = pipe.named_steps["pre"]
    model = pipe.named_steps["model"]
    names = pre.get_feature_names_out()

    background = pre.transform(X_train.sample(100, random_state=RANDOM_STATE))
    X_sample = pre.transform(X_test.sample(100, random_state=RANDOM_STATE))

    explainer = shap.Explainer(
        model.predict_proba, background,
        algorithm="permutation", feature_names=names,
    )
    explanation = explainer(X_sample, max_evals=500)

    dropout_idx = list(model.classes_).index("Dropout")
    sv_dropout = explanation.values[:, :, dropout_idx]

    importance = np.abs(sv_dropout).mean(axis=0)
    top = np.argsort(importance)[::-1][:10]
    print("Top 10 features for the Dropout class (mean |SHAP|, 100 test students):")
    for i in top:
        print(f"  {importance[i]:.3f}  {names[i]}")