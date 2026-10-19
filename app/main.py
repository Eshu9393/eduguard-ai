import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException, Request

from app.predictor import Predictor
from app.schemas import PredictionResponse, StudentFeatures

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("eduguard")


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