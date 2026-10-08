"""Report API routes — health and environmental."""
from fastapi import APIRouter, HTTPException
from app.models.schemas import (
    HealthReportCreate, HealthReportResponse,
    EnvironmentalReportCreate, EnvironmentalReportResponse
)
from app.services.demo_data import demo_store

router = APIRouter(prefix="/api/reports", tags=["Reports"])


@router.get("/health")
async def get_health_reports(camp_id: str = None):
    """Get health reports, optionally filtered by camp."""
    if camp_id:
        reports = demo_store.get_camp_health_reports(camp_id)
    else:
        reports = demo_store.health_reports

    # Enrich with camp names
    result = []
    for r in sorted(reports, key=lambda x: x["reported_at"], reverse=True):
        camp = demo_store.get_camp(r["camp_id"])
        result.append({**r, "camp_name": camp["name"] if camp else "Unknown"})
    return result


@router.get("/environmental")
async def get_environmental_reports(camp_id: str = None):
    """Get environmental reports, optionally filtered by camp."""
    if camp_id:
        reports = demo_store.get_camp_env_reports(camp_id)
    else:
        reports = demo_store.environmental_reports

    result = []
    for r in sorted(reports, key=lambda x: x["reported_at"], reverse=True):
        camp = demo_store.get_camp(r["camp_id"])
        result.append({**r, "camp_name": camp["name"] if camp else "Unknown"})
    return result


@router.post("/health")
async def create_health_report(report: HealthReportCreate):
    """Submit a new health report."""
    camp = demo_store.get_camp(report.camp_id)
    if not camp:
        raise HTTPException(status_code=404, detail="Camp not found")

    report_data = {
        "camp_id": report.camp_id,
        "symptoms": report.symptoms.model_dump(),
        "case_count": report.case_count,
        "affected_people": report.affected_people,
        "severity": report.severity.value,
        "notes": report.notes,
    }

    created = demo_store.add_health_report(report_data)
    return {**created, "camp_name": camp["name"]}


@router.post("/environmental")
async def create_environmental_report(report: EnvironmentalReportCreate):
    """Submit a new environmental report."""
    camp = demo_store.get_camp(report.camp_id)
    if not camp:
        raise HTTPException(status_code=404, detail="Camp not found")

    report_data = {
        "camp_id": report.camp_id,
        "issue_type": report.issue_type,
        "severity": report.severity.value,
        "description": report.description,
        "location": report.location,
    }

    created = demo_store.add_environmental_report(report_data)
    return {**created, "camp_name": camp["name"]}


@router.patch("/health/{report_id}/verify")
async def verify_health_report(report_id: str, status: str = "verified"):
    """Verify or reject a health report."""
    if status not in ("verified", "rejected"):
        raise HTTPException(status_code=400, detail="Status must be 'verified' or 'rejected'")

    result = demo_store.verify_report(report_id, status, "health")
    if not result:
        raise HTTPException(status_code=404, detail="Report not found")
    return result


@router.patch("/environmental/{report_id}/verify")
async def verify_environmental_report(report_id: str, status: str = "verified"):
    """Verify or reject an environmental report."""
    if status not in ("verified", "rejected"):
        raise HTTPException(status_code=400, detail="Status must be 'verified' or 'rejected'")

    result = demo_store.verify_report(report_id, status, "environmental")
    if not result:
        raise HTTPException(status_code=404, detail="Report not found")
    return result
