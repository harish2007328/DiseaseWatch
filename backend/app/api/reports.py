"""Report API routes — health and environmental."""
from fastapi import APIRouter, HTTPException
from app.models.schemas import (
    HealthReportCreate, HealthReportResponse,
    EnvironmentalReportCreate, EnvironmentalReportResponse
)
from app.services.db_sync import (
    get_health_reports_sync,
    create_health_report_sync,
    verify_health_report_sync,
    get_env_reports_sync,
    create_env_report_sync,
    verify_env_report_sync,
)

router = APIRouter(prefix="/api/reports", tags=["Reports"])


@router.get("/health")
async def get_health_reports(camp_id: str = None):
    """Get health reports from Supabase database."""
    return get_health_reports_sync(camp_id=camp_id)


@router.get("/environmental")
async def get_environmental_reports(camp_id: str = None):
    """Get environmental reports from Supabase database."""
    return get_env_reports_sync(camp_id=camp_id)


@router.post("/health")
async def create_health_report(report: HealthReportCreate):
    """Submit a new health report synced directly to Supabase."""
    report_data = {
        "camp_id": report.camp_id,
        "symptoms": report.symptoms.model_dump(),
        "case_count": report.case_count,
        "affected_people": report.affected_people,
        "severity": report.severity.value,
        "notes": report.notes,
    }

    return create_health_report_sync(report_data)


@router.post("/environmental")
async def create_environmental_report(report: EnvironmentalReportCreate):
    """Submit a new environmental report synced directly to Supabase."""
    report_data = {
        "camp_id": report.camp_id,
        "issue_type": report.issue_type,
        "severity": report.severity.value,
        "description": report.description,
        "location": report.location,
    }

    return create_env_report_sync(report_data)


@router.patch("/health/{report_id}/verify")
async def verify_health_report(report_id: str, status: str = "verified"):
    """Verify or reject a health report in Supabase."""
    if status not in ("verified", "rejected"):
        raise HTTPException(status_code=400, detail="Status must be 'verified' or 'rejected'")

    result = verify_health_report_sync(report_id, status)
    if not result:
        raise HTTPException(status_code=404, detail="Report not found")
    return result


@router.patch("/environmental/{report_id}/verify")
async def verify_environmental_report(report_id: str, status: str = "verified"):
    """Verify or reject an environmental report in Supabase."""
    if status not in ("verified", "rejected"):
        raise HTTPException(status_code=400, detail="Status must be 'verified' or 'rejected'")

    result = verify_env_report_sync(report_id, status)
    if not result:
        raise HTTPException(status_code=404, detail="Report not found")
    return result
