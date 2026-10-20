import json
import logging
from pathlib import Path

import joblib
import pandas as pd

from app.explainer import DropoutExplainer
from app.schemas import FIELD_TO_COLUMN, StudentFeatures

logger = logging.getLogger(__name__)
MODEL_DIR = Path(__file__).resolve().parents[1] / "models"


class Predictor:
    def __init__(self, model_dir: Path = MODEL_DIR):
        self.pipeline = joblib.load(model_dir / "pipeline.joblib")
        with open(model_dir / "metrics.json") as f:
            self.metadata = json.load(f)
        self.columns = self.metadata["features"]
        self.classes = list(self.pipeline.classes_)
        logger.info("Loaded pipeline with classes %s", self.classes)
        try:
            self.explainer = DropoutExplainer(self.pipeline, self.columns, model_dir)
        except FileNotFoundError:
            logger.warning("baseline.json missing; explanations disabled. "
                           "Run: python src/evaluate.py")
            self.explainer = None

    def predict(self, student: StudentFeatures, top_k: int = 6) -> dict:
        row = {FIELD_TO_COLUMN[f]: v for f, v in student.model_dump().items()}
        X = pd.DataFrame([row])[self.columns]  # same columns, same order as training
        proba = self.pipeline.predict_proba(X)[0]
        probabilities = {c: round(float(p), 4) for c, p in zip(self.classes, proba)}
        result = {
            "prediction": max(probabilities, key=probabilities.get),
            "probabilities": probabilities,
            "explanation": None,
        }
        if self.explainer is not None:
            exp = self.explainer.explain(X)
            top = exp["effects"][:top_k]
            total = exp["student_score"] - exp["typical_student_score"]
            result["explanation"] = {
                "typical_student_score": round(exp["typical_student_score"], 4),
                "student_score": round(exp["student_score"], 4),
                "top_factors": [
                    {"feature": e["feature"], "value": e["value"],
                     "typical_value": e["typical_value"], "effect": round(e["effect"], 4)}
                    for e in top
                ],
                "other_features_effect": round(total - sum(e["effect"] for e in top), 4),
            }
        return result