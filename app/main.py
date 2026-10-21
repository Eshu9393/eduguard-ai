import json
from pathlib import Path
import logging
from contextlib import asynccontextmanager
from fastapi.middleware.cors import CORSMiddleware
from fastapi import FastAPI, HTTPException, Request

from app.predictor import Predictor
from app.schemas import PredictionResponse, StudentFeatures

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("eduguard")
REPORTS_DIR = Path(__file__).resolve().parents[1] / "reports"

@asynccontextmanager
async def lifespan(app: FastAPI):
    try:
        app.state.predictor = Predictor()  # loaded ONCE at startup
    except FileNotFoundError:
        logger.error("Model files not found. Run: python src/evaluate.py")
        app.state.predictor = None
    yield


app = FastAPI(
    title="EduGuard AI",
    description="Explainable student outcome prediction (Dropout / Enrolled / Graduate).",
    version="0.1.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type"],
)

def get_predictor(request: Request) -> Predictor:
    predictor = request.app.state.predictor
    if predictor is None:
        raise HTTPException(status_code=503, detail="Model is not loaded.")
    return predictor


@app.get("/")
def root():
    return {
        "service": "EduGuard AI",
        "description": "Predicts student outcomes from early academic data.",
        "docs": "/docs",
    }


@app.get("/health")
def health(request: Request):
    return {"status": "ok", "model_loaded": request.app.state.predictor is not None}


@app.get("/model-info")
def model_info(request: Request):
    meta = get_predictor(request).metadata
    return {k: meta[k] for k in
            ["feature_set", "features", "params", "random_state",
             "test_accuracy", "test_macro_f1", "test_weighted_f1"]}


@app.post("/predict", response_model=PredictionResponse)
def predict(student: StudentFeatures, request: Request):
    result = get_predictor(request).predict(student)
    logger.info("Prediction made: %s", result["prediction"])
    return result

@app.get("/model-performance")
def model_performance(request: Request):
    meta = get_predictor(request).metadata
    labels = meta.get("labels")
    if labels is None:
        raise HTTPException(
            status_code=503,
            detail="Evaluation results missing. Run: python src/evaluate.py",
        )
    comparison = None
    path = REPORTS_DIR / "model_comparison.json"
    if path.exists():
        comparison = json.loads(path.read_text())
    return {
        "test": {
            "accuracy": meta["test_accuracy"],
            "macro_f1": meta["test_macro_f1"],
            "weighted_f1": meta["test_weighted_f1"],
            "labels": labels,
            "confusion_matrix": meta["confusion_matrix"],
            "per_class": {c: meta["report"][c] for c in labels},
        },
        "comparison": comparison,
    }