"""
DiseaseWatch Backend — FastAPI Application

Post-Disaster Public Health Incident Monitoring and Response System.
This is a hackathon prototype for surveillance purposes only.
Not a medical diagnosis or prescription system.
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.ml.risk_model import get_model
from app.api import auth, camps, reports, analysis, alerts, actions, dashboard


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Initialize ML model on startup."""
    print("DiseaseWatch Backend starting...")
    print("Training ML model...")
    get_model()
    print("ML model ready.")
    yield
    print("DiseaseWatch Backend shutting down.")


app = FastAPI(
    title="DiseaseWatch API",
    description=(
        "Post-Disaster Public Health Incident Monitoring and Response System. "
        "Hackathon prototype — surveillance aid only, not a medical diagnosis system."
    ),
    version="1.0.0",
    lifespan=lifespan,
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routes
app.include_router(auth.router)
app.include_router(camps.router)
app.include_router(reports.router)
app.include_router(analysis.router)
app.include_router(alerts.router)
app.include_router(actions.router)
app.include_router(dashboard.router)


@app.get("/")
async def root():
    return {
        "name": "DiseaseWatch API",
        "version": "1.0.0",
        "status": "running",
        "note": "Hackathon prototype — surveillance aid only",
    }


@app.get("/api/health")
async def health_check():
    return {"status": "healthy"}
