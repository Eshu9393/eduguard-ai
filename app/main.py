from fastapi import FastAPI

app = FastAPI(
    title="EduGuard AI",
    description="Explainable student outcome prediction (Dropout / Enrolled / Graduate).",
    version="0.1.0",
)


@app.get("/")
def root():
    return {
        "service": "EduGuard AI",
        "description": "Predicts student outcomes from early academic data.",
        "docs": "/docs",
    }


@app.get("/health")
def health():
    return {"status": "ok"}