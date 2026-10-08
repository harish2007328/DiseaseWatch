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

    camp_id = request.camp_id or "camp-1"

    # Get environmental data for this camp
    env_reports = demo_store.get_camp_env_reports(camp_id)
    env_factors_list = [str(f).lower() for f in (request.environmental_factors or [])]

    has_water_contamination = (
        request.water_contamination
        or any("water" in f and "contam" in f for f in env_factors_list)
        or any(r["issue_type"] == "water_contamination" for r in env_reports)
    )
    has_sanitation = (
        request.sanitation_problems
        or any("sanitat" in f or "sewage" in f or "latrine" in f for f in env_factors_list)
        or any(r["issue_type"] == "poor_sanitation" for r in env_reports)
    )
    has_stagnant = (
        request.stagnant_water
        or any("stagnant" in f or "puddle" in f for f in env_factors_list)
        or any(r["issue_type"] == "stagnant_water" for r in env_reports)
    )
    has_mosquito = (
        request.mosquito_breeding
        or any("mosquito" in f or "vector" in f for f in env_factors_list)
        or any(r["issue_type"] == "mosquito_breeding" for r in env_reports)
    )

    sym = request.symptoms
    sym_dict = sym.model_dump() if sym else {}

    features = {
        "fever": sym_dict.get("fever", False),
        "diarrhea": sym_dict.get("diarrhea", False),
        "vomiting": sym_dict.get("vomiting", False),
        "cough": sym_dict.get("cough", False),
        "headache": sym_dict.get("headache", False),
        "body_pain": sym_dict.get("body_pain", False),
        "rash": sym_dict.get("rash", False),
        "breathing_difficulty": sym_dict.get("breathing_difficulty", False),
        "case_count": request.case_count,
        "case_growth_rate": request.case_growth_rate,
        "water_contamination": has_water_contamination,
        "sanitation_problems": has_sanitation,
        "stagnant_water": has_stagnant,
        "mosquito_breeding": has_mosquito,
        "population_density": request.population_density,
        "severity": request.severity.value if hasattr(request.severity, "value") else str(request.severity),
    }

    result = model.predict_risk(features)

    # Save risk assessment if associated with camp
    if request.camp_id:
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

        # Auto-generate alert if high/critical risk
        if result["risk_level"] in ("high", "critical"):
            camp = demo_store.get_camp(request.camp_id)
            camp_name = camp["name"] if camp else request.camp_id
            alert_data = {
                "camp_id": request.camp_id,
                "alert_type": "high_risk",
                "severity": result["risk_level"],
                "reason": f"High risk of {result['suspected_syndrome']} at {camp_name}",
                "description": f"ML model detected {result['risk_level']} risk with {result['confidence']:.0%} confidence. Key drivers: {', '.join(result['reasons'][:2])}.",
                "trigger_data": {
                    "syndrome": result["suspected_syndrome"],
                    "confidence": result["confidence"],
                    "case_count": request.case_count,
                    "environmental_factors": [
                        k for k, v in [
                            ("water_contamination", has_water_contamination),
                            ("poor_sanitation", has_sanitation),
                            ("stagnant_water", has_stagnant),
                            ("mosquito_breeding", has_mosquito),
                        ] if v
                    ],
                },
            }
            demo_store.add_alert(alert_data)

        # Update camp risk level
        camp = demo_store.get_camp(request.camp_id)
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
    camp_id = request.camp_id or "camp-1"

    # Get camp data for environmental context
    camp = demo_store.get_camp(camp_id)
    env_reports = demo_store.get_camp_env_reports(camp_id)

    current_cases = request.current_cases
    if current_cases is None:
        if request.recent_cases:
            current_cases = request.recent_cases[-1]
        else:
            current_cases = 12

    hist_avg = request.historical_average
    if hist_avg <= 0:
        if request.baseline_cases:
            hist_avg = sum(request.baseline_cases) / len(request.baseline_cases)
        elif request.recent_cases and len(request.recent_cases) > 1:
            hist_avg = sum(request.recent_cases[:-1]) / len(request.recent_cases[:-1])
        else:
            hist_avg = 5.0

    hist_std = request.historical_std
    if hist_std <= 0:
        hist_std = 2.0

    growth_rate = (current_cases - hist_avg) / max(hist_avg, 1.0)

    features = {
        "current_cases": current_cases,
        "historical_average": hist_avg,
        "historical_std": hist_std,
        "case_growth_rate": growth_rate,
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
            "camp_id": camp_id,
            "alert_type": "anomaly",
            "severity": "high" if result["details"].get("percent_increase", 0) > 200 else "medium",
            "reason": result["message"],
            "description": f"Anomaly detected: {result['details'].get('percent_increase', 0):.0f}% increase from historical average of {result['details'].get('historical_average', hist_avg)} cases/day.",
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
    from app.services.db_sync import get_camps_sync
    model = get_model()
    camps_data = get_camps_sync()
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
    syndrome = request.suspected_syndrome or request.syndrome or "Waterborne illness risk"
    risk_lvl = request.risk_level or request.severity or "high"
    sym_list = request.symptoms or ["Fever", "Diarrhea", "Vomiting"]
    env_conds = request.environmental_conditions or request.environmental_context or ["water_contamination"]
    cases = request.case_count or 10

    result = generate_recommendation(
        suspected_syndrome=syndrome,
        risk_level=risk_lvl,
        symptoms=sym_list,
        environmental_conditions=env_conds,
        case_count=cases,
        growth_trend=request.growth_trend,
        camp_name=request.camp_name,
        nearby_affected_camps=request.nearby_affected_camps or [],
    )

    if request.alert_reason:
        result["alert_reason"] = request.alert_reason

    return RecommendationResponse(**result)
