import json
import logging
from pathlib import Path

import joblib
import pandas as pd

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

    def predict(self, student: StudentFeatures) -> dict:
        row = {FIELD_TO_COLUMN[f]: v for f, v in student.model_dump().items()}
        X = pd.DataFrame([row])[self.columns]  # same columns, same order as training
        proba = self.pipeline.predict_proba(X)[0]
        probabilities = {c: round(float(p), 4) for c, p in zip(self.classes, proba)}
        return {
            "prediction": max(probabilities, key=probabilities.get),
            "probabilities": probabilities,
        }