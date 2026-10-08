"""
AI Public-Health Response Recommendation Engine

Generates public-health action recommendations using a deterministic
rule-based system. Architecture supports future LLM integration.

IMPORTANT: Does NOT recommend specific medicines, dosages or prescriptions.
Focuses on public-health prevention, inspection, awareness, referral,
sanitation, water safety and response actions.
"""
from typing import Dict, List, Optional


# Rule-based recommendation templates
SYNDROME_RECOMMENDATIONS = {
    "Waterborne illness risk": {
        "immediate_actions": [
            "Inspect all reported water sources immediately",
            "Arrange alternate safe drinking water supply",
            "Seal or mark contaminated water sources",
            "Notify camp medical personnel for clinical evaluation",
            "Increase sanitation monitoring frequency",
            "Distribute water purification tablets"
        ],
        "prevention_actions": [
            "Issue hygiene and safe water handling awareness guidance",
            "Promote hand-washing with soap before meals and after toilet use",
            "Monitor all camp water sources daily",
            "Track new case reports and symptom changes",
            "Inspect water storage and distribution infrastructure"
        ],
        "environmental_actions": [
            "Test water sources for contamination markers",
            "Repair or replace damaged water infrastructure",
            "Ensure proper sewage and waste water drainage",
            "Monitor for cross-contamination between sewage and water supply",
            "Install temporary water treatment units if needed"
        ],
        "awareness_message": "Boil or purify all drinking water. Avoid using untested water sources. Report any changes in water color, taste, or odor to camp authorities immediately. Wash hands thoroughly with soap before eating and after using toilet facilities.",
    },
    "Respiratory illness risk": {
        "immediate_actions": [
            "Ensure adequate ventilation in shelters",
            "Notify camp medical personnel for clinical assessment",
            "Isolate individuals with severe symptoms if possible",
            "Distribute face masks where available",
            "Monitor oxygen saturation in severe cases if equipment available"
        ],
        "prevention_actions": [
            "Promote respiratory hygiene and cough etiquette",
            "Reduce overcrowding in shelters where possible",
            "Increase cleaning of shared living spaces",
            "Track new respiratory symptom reports daily",
            "Monitor air quality in camp area"
        ],
        "environmental_actions": [
            "Improve ventilation in enclosed shelters",
            "Reduce dust and particulate exposure",
            "Clean shared surfaces regularly",
            "Ensure adequate spacing between sleeping areas",
            "Monitor for mold or damp conditions in shelters"
        ],
        "awareness_message": "Cover mouth and nose when coughing or sneezing. Maintain distance from individuals with respiratory symptoms. Seek medical evaluation if experiencing breathing difficulty, persistent cough, or high fever.",
    },
    "Vector-borne illness risk": {
        "immediate_actions": [
            "Deploy mosquito repellent and insecticide spraying",
            "Identify and eliminate stagnant water pools",
            "Notify camp medical personnel for dengue/malaria evaluation",
            "Distribute mosquito nets where available",
            "Monitor for severe symptoms (bleeding, shock)"
        ],
        "prevention_actions": [
            "Conduct regular fogging and larviciding operations",
            "Remove potential mosquito breeding containers",
            "Use window screens and bed nets consistently",
            "Educate on recognizing vector-borne disease symptoms",
            "Track rainfall and standing water accumulation"
        ],
        "environmental_actions": [
            "Drain stagnant water pools within and around camp",
            "Clear drainage channels and gutters",
            "Remove discarded containers and tires that collect water",
            "Maintain clean camp perimeter",
            "Install or repair drainage infrastructure"
        ],
        "awareness_message": "Use mosquito nets while sleeping. Apply insect repellent. Remove any standing water from containers around living areas. Seek medical attention immediately for high fever with body aches, rash, or bleeding symptoms.",
    },
    "Gastrointestinal illness risk": {
        "immediate_actions": [
            "Ensure oral rehydration supplies are available",
            "Inspect food preparation and storage areas",
            "Notify camp medical personnel for clinical evaluation",
            "Check food supply chain for contamination",
            "Increase monitoring of communal food preparation"
        ],
        "prevention_actions": [
            "Enforce food safety and hygiene standards",
            "Promote thorough hand-washing before food handling",
            "Ensure proper food storage temperatures",
            "Monitor food supply quality daily",
            "Track new gastrointestinal case reports"
        ],
        "environmental_actions": [
            "Inspect and clean food preparation areas",
            "Ensure proper waste disposal near food areas",
            "Check refrigeration and food storage facilities",
            "Monitor pest control near food storage",
            "Ensure clean water for food preparation"
        ],
        "awareness_message": "Wash hands with soap before preparing or eating food. Ensure all food is properly cooked. Do not consume expired or improperly stored food. Report any stomach illness symptoms immediately.",
    },
    "General infectious illness risk": {
        "immediate_actions": [
            "Continue routine health surveillance",
            "Notify camp medical personnel if cases increase",
            "Monitor for symptom pattern changes",
            "Ensure basic medical supplies are available",
            "Review recent health and environmental reports"
        ],
        "prevention_actions": [
            "Maintain general hygiene awareness programs",
            "Ensure clean water and sanitation facilities",
            "Promote regular hand-washing",
            "Monitor population health trends",
            "Prepare contingency plans for potential escalation"
        ],
        "environmental_actions": [
            "Conduct routine environmental inspections",
            "Ensure waste management is functioning",
            "Monitor water quality regularly",
            "Maintain clean living conditions",
            "Check sanitation facilities are operational"
        ],
        "awareness_message": "Maintain personal hygiene. Wash hands regularly. Report any new or worsening symptoms to camp health workers. Stay hydrated and rest if feeling unwell.",
    },
}


def generate_recommendation(
    suspected_syndrome: str,
    risk_level: str,
    symptoms: List[str],
    environmental_conditions: List[str],
    case_count: int,
    growth_trend: float = 0,
    camp_name: Optional[str] = None,
    nearby_affected_camps: List[str] = None,
) -> Dict:
    """
    Generate public-health response recommendations.

    This is a rule-based system that generates actionable public-health
    recommendations. It does NOT prescribe medicines or provide medical diagnoses.

    Architecture supports future LLM integration via API key configuration.
    """
    if nearby_affected_camps is None:
        nearby_affected_camps = []

    # Try high-speed Groq AI first
    try:
        from app.services.groq_service import generate_groq_recommendation
        groq_result = generate_groq_recommendation(
            syndrome=suspected_syndrome,
            alert_reason=f"{case_count} cases of {suspected_syndrome} reported with growth trend {growth_trend:.1f}x",
            severity=risk_level,
            environmental_context=environmental_conditions,
            camp_name=camp_name or "Tirunelveli Relief Camp",
        )
        if groq_result:
            return groq_result
    except Exception as e:
        pass

    # Deterministic fallback template
    template = SYNDROME_RECOMMENDATIONS.get(
        suspected_syndrome,
        SYNDROME_RECOMMENDATIONS["General infectious illness risk"]
    )

    # Build situation summary
    location_str = f" at {camp_name}" if camp_name else ""
    trend_str = ""
    if growth_trend > 1.5:
        trend_str = " Cases are increasing rapidly."
    elif growth_trend > 0.5:
        trend_str = " Cases are trending upward."
    elif growth_trend < -0.2:
        trend_str = " Cases appear to be declining."

    env_str = ""
    if environmental_conditions:
        env_str = f" Environmental factors include: {', '.join(c.replace('_', ' ') for c in environmental_conditions)}."

    cluster_str = ""
    if nearby_affected_camps:
        cluster_str = f" Nearby camps ({', '.join(nearby_affected_camps)}) show similar patterns, suggesting a potential regional cluster."

    situation_summary = (
        f"{risk_level.upper()} RISK: {suspected_syndrome.replace(' risk', '')} surveillance alert{location_str}. "
        f"{case_count} cases reported with symptoms including {', '.join(symptoms[:4])}."
        f"{trend_str}{env_str}{cluster_str}"
    )

    # Alert reason
    reasons = []
    if case_count > 15:
        reasons.append(f"High case count ({case_count} cases)")
    if growth_trend > 1.0:
        reasons.append(f"Rapid case increase ({int(growth_trend * 100)}% growth)")
    if environmental_conditions:
        reasons.append(f"Environmental risk factors: {', '.join(c.replace('_', ' ') for c in environmental_conditions[:3])}")
    if nearby_affected_camps:
        reasons.append(f"Similar patterns in nearby camps: {', '.join(nearby_affected_camps)}")
    if not reasons:
        reasons.append(f"Elevated {suspected_syndrome.lower()} based on symptom pattern analysis")

    alert_reason = ". ".join(reasons) + "."

    # Escalation recommendation
    if risk_level in ("critical",):
        escalation = (
            "IMMEDIATE ESCALATION REQUIRED: Notify district health authorities and request emergency medical team deployment. "
            "Arrange clinical evaluation facilities. Prepare for potential evacuation if conditions worsen. "
            "Coordinate with neighboring districts if cluster extends beyond current jurisdiction."
        )
    elif risk_level in ("high",):
        escalation = (
            "If cases continue increasing over the next 24–48 hours, escalate to district health authorities. "
            "Arrange for clinical evaluation team visit. Prepare isolation facilities if needed. "
            "Consider requesting additional medical supplies."
        )
    elif risk_level in ("medium",):
        escalation = (
            "Continue monitoring. If cases exceed 15 or growth rate increases significantly, "
            "notify district health authorities for assessment. "
            "Ensure communication channels with district health office are active."
        )
    else:
        escalation = (
            "Routine monitoring is sufficient. Escalate if case patterns change significantly "
            "or new environmental risk factors emerge."
        )

    # Add risk-level-specific urgency to immediate actions
    immediate_actions = list(template["immediate_actions"])
    if risk_level == "critical":
        immediate_actions.insert(0, "PRIORITY: Deploy emergency response team immediately")
    elif risk_level == "high" and nearby_affected_camps:
        immediate_actions.insert(0, "Coordinate response with affected neighboring camps")

    return {
        "situation_summary": situation_summary,
        "alert_reason": alert_reason,
        "immediate_actions": immediate_actions,
        "prevention_actions": template["prevention_actions"],
        "environmental_actions": template["environmental_actions"],
        "awareness_message": template["awareness_message"],
        "escalation_recommendation": escalation,
    }
