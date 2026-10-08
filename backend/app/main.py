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


import asyncio
from app.services.keep_alive import start_keep_alive
from app.services.seed_supabase import seed_supabase_data

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Initialize ML model, sync database, and keep-alive worker on startup."""
    print("DiseaseWatch Backend starting...")
    print("Training ML model...")
    get_model()
    print("ML model ready.")
    
    # Try seeding Supabase if tables are empty
    try:
        seed_res = seed_supabase_data()
        print(f"Supabase seed status: {seed_res}")
    except Exception as e:
        print(f"Supabase seed note: {e}")

    # Launch keep-alive background worker for Render 24/7 uptime
    keep_alive_task = asyncio.create_task(start_keep_alive(interval_seconds=600))
    yield
    keep_alive_task.cancel()
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
    allow_origin_regex=".*",
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
    from app.services.supabase_client import get_supabase
    client = get_supabase()
    db_ok = False
    if client:
        try:
            client.table("camps").select("id").limit(1).execute()
            db_ok = True
        except Exception:
            pass
    return {
        "status": "healthy",
        "database": "connected" if db_ok else "in-memory-fallback"
    }
