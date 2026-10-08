"""
Groq AI Service for DiseaseWatch Public-Health Intelligence

Uses Groq AI high-speed inference (openai/gpt-oss-120b / openai/gpt-oss-20b)
to generate context-aware public-health response recommendations,
epidemiological situation briefs, and community health advisories.
"""
import os
import json
import logging
from typing import Dict, Any, List, Optional
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger("groq_service")
logger.setLevel(logging.INFO)

GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")
GROQ_MODEL = os.getenv("GROQ_MODEL", "openai/gpt-oss-120b")

_groq_client = None


def get_groq_client():
    global _groq_client
    if _groq_client is None and GROQ_API_KEY:
        try:
            from groq import Groq
            _groq_client = Groq(api_key=GROQ_API_KEY)
            logger.info("Groq AI client initialized successfully.")
        except Exception as e:
            logger.warning(f"Could not initialize Groq client: {e}")
    return _groq_client


def generate_groq_recommendation(
    syndrome: str,
    alert_reason: str,
    severity: str = "medium",
    environmental_context: Optional[List[str]] = None,
    camp_name: str = "Tirunelveli Relief Camp",
) -> Optional[Dict[str, Any]]:
    """
    Generate public-health response recommendations using Groq AI.
    Strictly focuses on non-diagnostic, preventive, sanitation, and response actions.
    Does NOT prescribe medicines or clinical treatments.
    """
    client = get_groq_client()
    if not client:
        return None

    env_str = ", ".join(environmental_context) if environmental_context else "None reported"

    system_prompt = (
        "You are an expert Public Health Epidemiologist and Disaster Response Coordinator assisting "
        "district health officials in Tirunelveli, Tamil Nadu during a flood/disaster situation.\n"
        "Your task is to provide rapid, actionable, non-diagnostic public-health recommendations.\n\n"
        "SAFETY MANDATE:\n"
        "- Do NOT prescribe medicines, medications, or antibiotic dosages.\n"
        "- Focus strictly on water safety, sanitation, vector control, symptom isolation, hygiene awareness, "
        "inspection, and referral to medical officers.\n"
        "- Provide clear, concise, professional instructions.\n\n"
        "You must respond in valid JSON with these exact keys:\n"
        "{\n"
        '  "situation_summary": "1-2 sentence overview of the risk in this camp",\n'
        '  "alert_reason": "Summary of what triggered this public health notice",\n'
        '  "immediate_actions": ["Action 1", "Action 2", "Action 3"],\n'
        '  "prevention_actions": ["Prevention 1", "Prevention 2", "Prevention 3"],\n'
        '  "environmental_actions": ["Sanitation/Water action 1", "Sanitation/Water action 2"],\n'
        '  "awareness_message": "Clear 1-2 sentence public guidance announcement for camp residents",\n'
        '  "escalation_recommendation": "Threshold to escalate to District Chief Health Officer"\n'
        "}"
    )

    user_prompt = (
        f"Location: {camp_name}, Tirunelveli District\n"
        f"Suspected Syndrome: {syndrome}\n"
        f"Risk Severity: {severity.upper()}\n"
        f"Alert Trigger Reason: {alert_reason}\n"
        f"Environmental Factors: {env_str}\n\n"
        "Generate the response protocol JSON now."
    )

    try:
        completion = client.chat.completions.create(
            model=GROQ_MODEL,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
            temperature=0.2,
            max_tokens=800,
        )

        content = completion.choices[0].message.content.strip()
        
        # Clean potential markdown fences
        if content.startswith("```json"):
            content = content[7:]
        elif content.startswith("```"):
            content = content[3:]
        if content.endswith("```"):
            content = content[:-3]
        content = content.strip()

        data = json.loads(content)

        # Validate structure
        required_keys = [
            "situation_summary", "alert_reason", "immediate_actions",
            "prevention_actions", "environmental_actions",
            "awareness_message", "escalation_recommendation"
        ]
        if all(k in data for k in required_keys):
            logger.info("Groq AI recommendation generated successfully.")
            return data
        else:
            logger.warning("Groq response missing expected keys, falling back.")
            return None

    except Exception as e:
        logger.warning(f"Groq generation error: {e}, falling back to deterministic template.")
        return None
