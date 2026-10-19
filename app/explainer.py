import json
from pathlib import Path

import numpy as np
import pandas as pd
import shap

MODEL_DIR = Path(__file__).resolve().parents[1] / "models"


class DropoutExplainer:
    """Explains a student's Dropout score relative to a 'typical student'."""

    def __init__(self, pipeline, columns, model_dir: Path = MODEL_DIR, seed: int = 42):
        self.pipeline = pipeline
        self.columns = list(columns)
        self.dropout_idx = list(pipeline.classes_).index("Dropout")

        with open(model_dir / "baseline.json") as f:
            self.baseline = pd.DataFrame([json.load(f)])[self.columns]

        # The preprocessor knows which columns are integer codes/flags
        pre = pipeline.named_steps["pre"]
        int_cols = {c for name, _, cols in pre.transformers_
                    if name in ("bin", "cat") for c in cols}
        self.dtypes = {c: ("int64" if c in int_cols else "float64") for c in self.columns}

        masker = shap.maskers.Independent(self.baseline.to_numpy(dtype=float), max_samples=1)
        self._explainer = shap.Explainer(self._dropout_score, masker,
                                         algorithm="permutation", seed=seed)

    def _dropout_score(self, arr):
        X = pd.DataFrame(np.atleast_2d(arr), columns=self.columns).astype(self.dtypes)
        return self.pipeline.predict_proba(X)[:, self.dropout_idx]

    def explain(self, row: pd.DataFrame, max_evals: int = 1200) -> dict:
        x = row[self.columns].to_numpy(dtype=float)
        exp = self._explainer(x, max_evals=max_evals, silent=True)
        values = exp.values[0]
        base = float(exp.base_values[0])
        effects = [
            {
                "feature": c,
                "value": row[c].iloc[0].item(),
                "typical_value": self.baseline[c].iloc[0].item(),
                "effect": float(v),
            }
            for c, v in zip(self.columns, values)
        ]
        effects.sort(key=lambda e: abs(e["effect"]), reverse=True)
        return {
            "typical_student_score": base,
            "student_score": base + float(values.sum()),
            "effects": effects,
        }