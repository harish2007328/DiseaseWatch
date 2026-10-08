"""ML Analysis API routes — risk assessment, anomaly detection, cluster detection."""
from fastapi import APIRouter
from app.models.schemas import (
    RiskAnalysisRequest, RiskAnalysisResponse,
    AnomalyRequest, AnomalyResponse,
    ClusterRequest, ClusterResponse,
    RecommendationRequest, RecommendationResponse,
)
from app.ml.risk_model import get_model
from app.services.recommendations import generate_recommendation
from app.services.demo_data import demo_store

router = APIRouter(prefix="/api/analyze", tags=["Analysis"])


@router.post("/risk", response_model=RiskAnalysisResponse)
async def analyze_risk(request: RiskAnalysisRequest):
    """
    Perform ML-based health risk assessment.

    Returns a preliminary risk level and suspected syndrome.
    This is a surveillance aid — NOT a medical diagnosis.
    """
    model = get_model()

    # Get environmental data for this camp
    env_reports = demo_store.get_camp_env_reports(request.camp_id)
    has_water_contamination = request.water_contamination or any(
        r["issue_type"] == "water_contamination" for r in env_reports
    )
    has_sanitation = request.sanitation_problems or any(
        r["issue_type"] == "poor_sanitation" for r in env_reports
    )
    has_stagnant = request.stagnant_water or any(
        r["issue_type"] == "stagnant_water" for r in env_reports
    )
    has_mosquito = request.mosquito_breeding or any(
        r["issue_type"] == "mosquito_breeding" for r in env_reports
    )

    features = {
        "fever": request.symptoms.fever,
        "diarrhea": request.symptoms.diarrhea,
        "vomiting": request.symptoms.vomiting,
        "cough": request.symptoms.cough,
        "headache": request.symptoms.headache,
        "body_pain": request.symptoms.body_pain,
        "rash": request.symptoms.rash,
        "breathing_difficulty": request.symptoms.breathing_difficulty,
        "case_count": request.case_count,
        "case_growth_rate": request.case_growth_rate,
        "water_contamination": has_water_contamination,
        "sanitation_problems": has_sanitation,
        "stagnant_water": has_stagnant,
        "mosquito_breeding": has_mosquito,
        "population_density": request.population_density,
        "severity": request.severity.value,
    }

    result = model.predict_risk(features)

    # Save risk assessment
    assessment_data = {
        "camp_id": request.camp_id,
        "health_report_id": request.health_report_id,
        "risk_level": result["risk_level"],
        "suspected_syndrome": result["suspected_syndrome"],
        "confidence": result["confidence"],
        "reasons": result["reasons"],
        "features": features,
    }
    demo_store.add_risk_assessment(assessment_data)

    # Auto-generate alert if risk is high or critical
    if result["risk_level"] in ("high", "critical"):
        camp = demo_store.get_camp(request.camp_id)
        camp_name = camp["name"] if camp else "Unknown"

        alert_data = {
            "camp_id": request.camp_id,
            "alert_type": "high_risk",
            "severity": result["risk_level"],
            "reason": f"{result['suspected_syndrome']} detected with {result['confidence']*100:.0f}% confidence",
            "description": f"ML risk assessment identified {result['risk_level']} risk at {camp_name}. "
                          f"Suspected syndrome: {result['suspected_syndrome']}. "
                          f"Primary factors: {', '.join(result['reasons'][:3])}",
            "trigger_data": {
                "syndrome": result["suspected_syndrome"],
                "confidence": result["confidence"],
                "case_count": request.case_count,
                "reasons": result["reasons"],
            },
        }
        demo_store.add_alert(alert_data)

        # Update camp risk level
        if camp:
            camp["risk_level"] = result["risk_level"]
            camp["risk_score"] = result["confidence"]

    return RiskAnalysisResponse(**result)


@router.post("/anomaly", response_model=AnomalyResponse)
async def detect_anomaly(request: AnomalyRequest):
    """
    Detect unusual increases in case counts using statistical methods
    and Isolation Forest anomaly detection.
    """
    model = get_model()

    # Get camp data for environmental context
    camp = demo_store.get_camp(request.camp_id)
    env_reports = demo_store.get_camp_env_reports(request.camp_id)

    features = {
        "current_cases": request.current_cases,
        "historical_average": request.historical_average if request.historical_average > 0 else 5,
        "historical_std": request.historical_std if request.historical_std > 0 else 2,
        "case_growth_rate": (request.current_cases - request.historical_average) / max(request.historical_average, 1),
        "fever": 1,
        "diarrhea": 1,
        "vomiting": 0,
        "cough": 0,
        "headache": 1,
        "body_pain": 0,
        "rash": 0,
        "breathing_difficulty": 0,
        "water_contamination": any(r["issue_type"] == "water_contamination" for r in env_reports),
        "sanitation_problems": any(r["issue_type"] == "poor_sanitation" for r in env_reports),
        "stagnant_water": any(r["issue_type"] == "stagnant_water" for r in env_reports),
        "mosquito_breeding": any(r["issue_type"] == "mosquito_breeding" for r in env_reports),
        "population_density": (camp["population"] / 500) if camp else 1.0,
        "severity_score": 2,
    }

    result = model.detect_anomaly(features)

    # Auto-generate alert if anomaly detected
    if result["is_anomaly"] and camp:
        alert_data = {
            "camp_id": request.camp_id,
            "alert_type": "anomaly",
            "severity": "high" if result["details"]["percent_increase"] > 200 else "medium",
            "reason": result["message"],
            "description": f"Anomaly detected: {result['details']['percent_increase']:.0f}% increase from historical average of {result['details']['historical_average']} cases/day.",
            "trigger_data": result["details"],
        }
        demo_store.add_alert(alert_data)

    return AnomalyResponse(**result)


@router.post("/cluster", response_model=ClusterResponse)
async def detect_clusters():
    """
    Detect geographic clusters of similar health conditions
    across nearby camps.
    """
    model = get_model()
    camps_data = demo_store.get_all_camps_enriched()
    clusters = model.detect_clusters(camps_data)

    return ClusterResponse(
        clusters=clusters,
        total_clusters=len(clusters),
    )


@router.post("/recommend", response_model=RecommendationResponse)
async def get_recommendation(request: RecommendationRequest):
    """
    Generate AI public-health response recommendations.

    Does NOT recommend medicines or prescriptions.
    Focuses on public-health prevention and response actions.
    """
    result = generate_recommendation(
        suspected_syndrome=request.suspected_syndrome,
        risk_level=request.risk_level,
        symptoms=request.symptoms,
        environmental_conditions=request.environmental_conditions,
        case_count=request.case_count,
        growth_trend=request.growth_trend,
        camp_name=request.camp_name,
        nearby_affected_camps=request.nearby_affected_camps,
    )

    return RecommendationResponse(**result)
