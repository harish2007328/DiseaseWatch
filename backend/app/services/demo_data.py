"""Demo/seed data for DiseaseWatch - provides fallback when Supabase is unavailable."""
import uuid
from datetime import datetime, timedelta
import random
import math

# Tirunelveli District coordinates (real geographic area)
TIRUNELVELI_CENTER = (8.7139, 77.7567)

# Real areas/wards in Tirunelveli district
WARDS = [
    "Palayamkottai", "Melapalayam", "Tirunelveli Town", "Vannikonendal",
    "Krishnapuram", "Pettai", "Maharajanagar", "Thatchanallur",
    "Murugankurichi", "Sankarankovil", "Tenkasi", "Ambasamudram",
    "Cheranmahadevi", "Kalakkad", "Nanguneri", "Radhapuram",
    "Thisayanvilai", "Valliyoor", "Kadayam", "Alangulam"
]

def _id():
    return str(uuid.uuid4())

def _time(days_ago=0, hours_ago=0, minutes_ago=0):
    return (datetime.utcnow() - timedelta(days=days_ago, hours=hours_ago, minutes=minutes_ago)).isoformat() + "Z"

# Generate camp coordinates spread across Tirunelveli district
def _camp_coords(index):
    """Generate realistic coordinates within Tirunelveli district."""
    base_lat, base_lng = TIRUNELVELI_CENTER
    # Spread camps across the district (roughly 50km radius)
    offsets = [
        (0.02, 0.03), (-0.05, 0.02), (0.08, -0.04), (-0.03, -0.06),
        (0.12, 0.08), (-0.10, 0.05), (0.06, -0.09), (-0.08, -0.02),
        (0.15, 0.01), (-0.01, 0.12), (0.04, -0.11), (-0.12, -0.08),
        (0.09, 0.06), (-0.06, 0.10), (0.01, -0.05), (-0.04, 0.07),
        (0.11, -0.03), (-0.09, -0.10), (0.07, 0.11), (-0.02, -0.07)
    ]
    offset = offsets[index % len(offsets)]
    return (base_lat + offset[0], base_lng + offset[1])

# Camp IDs (fixed for consistency)
CAMP_IDS = [_id() for _ in range(20)]
USER_IDS = {
    "admin": "a0000000-0000-0000-0000-000000000001",
    "camp": "c0000000-0000-0000-0000-000000000001",
}

def generate_camps():
    """Generate 20 relief camps with varied risk levels."""
    camps = []
    risk_configs = [
        # (risk_level, risk_score, population_range)
        ("low", 0.15, (150, 300)),
        ("low", 0.10, (100, 250)),
        ("low", 0.20, (200, 350)),
        ("medium", 0.45, (250, 400)),
        ("medium", 0.40, (200, 350)),
        ("low", 0.12, (100, 200)),
        ("high", 0.78, (350, 500)),      # Camp 07 - main demo camp
        ("low", 0.18, (150, 280)),
        ("medium", 0.50, (300, 450)),
        ("high", 0.72, (280, 420)),       # Camp 10 - part of cluster
        ("low", 0.08, (120, 220)),
        ("medium", 0.42, (250, 380)),
        ("critical", 0.92, (400, 600)),   # Camp 13 - critical
        ("low", 0.14, (130, 240)),
        ("high", 0.75, (320, 480)),       # Camp 15 - part of cluster
        ("medium", 0.48, (220, 350)),
        ("low", 0.16, (170, 290)),
        ("low", 0.11, (110, 210)),
        ("medium", 0.38, (200, 330)),
        ("low", 0.09, (100, 200)),
    ]

    for i, (risk, score, pop_range) in enumerate(risk_configs):
        lat, lng = _camp_coords(i)
        camps.append({
            "id": CAMP_IDS[i],
            "name": f"Camp {str(i + 1).zfill(2)}",
            "location_lat": lat,
            "location_lng": lng,
            "population": random.randint(*pop_range),
            "district": "Tirunelveli",
            "ward": WARDS[i],
            "risk_level": risk,
            "risk_score": score,
            "created_at": _time(days_ago=30),
            "updated_at": _time(hours_ago=random.randint(1, 48)),
        })
    return camps


def generate_health_reports():
    """Generate realistic health reports across camps."""
    reports = []

    # Symptom templates for different conditions
    waterborne = {"fever": True, "diarrhea": True, "vomiting": True, "headache": True}
    respiratory = {"fever": True, "cough": True, "breathing_difficulty": True, "headache": True}
    vector_borne = {"fever": True, "headache": True, "body_pain": True, "rash": True}
    gastro = {"diarrhea": True, "vomiting": True, "fever": True, "body_pain": True}
    general = {"fever": True, "headache": True, "body_pain": True}

    # Camp 07 (index 6) - HIGH risk, waterborne cluster
    for d in range(7):
        case_count = 3 + d * 3 + random.randint(0, 4)
        reports.append({
            "id": _id(),
            "camp_id": CAMP_IDS[6],
            "symptoms": {**waterborne, "other": None},
            "case_count": case_count,
            "affected_people": case_count + random.randint(0, 5),
            "severity": "severe" if d > 4 else "moderate",
            "notes": "Increasing diarrhea and vomiting cases. Water source suspected." if d > 3 else "Multiple cases reported.",
            "reported_at": _time(days_ago=7 - d),
            "verification_status": "verified" if d < 5 else "pending",
        })

    # Camp 10 (index 9) - HIGH risk, part of cluster
    for d in range(5):
        case_count = 4 + d * 2 + random.randint(0, 3)
        reports.append({
            "id": _id(),
            "camp_id": CAMP_IDS[9],
            "symptoms": {**gastro, "other": None},
            "case_count": case_count,
            "affected_people": case_count + random.randint(0, 3),
            "severity": "moderate" if d < 3 else "severe",
            "notes": "GI symptoms increasing.",
            "reported_at": _time(days_ago=5 - d),
            "verification_status": "verified" if d < 3 else "pending",
        })

    # Camp 13 (index 12) - CRITICAL
    for d in range(10):
        case_count = 5 + d * 4 + random.randint(0, 6)
        reports.append({
            "id": _id(),
            "camp_id": CAMP_IDS[12],
            "symptoms": {**waterborne, "rash": d > 5, "other": None},
            "case_count": case_count,
            "affected_people": case_count + random.randint(2, 8),
            "severity": "severe",
            "notes": "Critical situation. Severe waterborne illness outbreak. Multiple water sources contaminated.",
            "reported_at": _time(days_ago=10 - d),
            "verification_status": "verified",
        })

    # Camp 15 (index 14) - HIGH, part of cluster
    for d in range(4):
        case_count = 6 + d * 3 + random.randint(0, 3)
        reports.append({
            "id": _id(),
            "camp_id": CAMP_IDS[14],
            "symptoms": {**waterborne, "other": None},
            "case_count": case_count,
            "affected_people": case_count + random.randint(1, 4),
            "severity": "moderate",
            "notes": "Cases similar to nearby camps.",
            "reported_at": _time(days_ago=4 - d),
            "verification_status": "verified" if d < 2 else "pending",
        })

    # Medium risk camps with various conditions
    medium_camps = [3, 4, 8, 11, 15, 18]
    for ci in medium_camps:
        symptom_set = random.choice([respiratory, vector_borne, general])
        for d in range(3):
            case_count = 2 + random.randint(0, 4)
            reports.append({
                "id": _id(),
                "camp_id": CAMP_IDS[ci],
                "symptoms": {**symptom_set, "other": None},
                "case_count": case_count,
                "affected_people": case_count + random.randint(0, 2),
                "severity": "mild" if d == 0 else "moderate",
                "notes": "Monitoring cases.",
                "reported_at": _time(days_ago=3 - d),
                "verification_status": "verified" if d == 0 else "pending",
            })

    # Low risk camps with minimal reports
    low_camps = [0, 1, 2, 5, 7, 10, 13, 16, 17, 19]
    for ci in low_camps:
        reports.append({
            "id": _id(),
            "camp_id": CAMP_IDS[ci],
            "symptoms": {"fever": True, "headache": True, "other": None,
                         "diarrhea": False, "vomiting": False, "cough": False,
                         "body_pain": False, "rash": False, "breathing_difficulty": False},
            "case_count": random.randint(1, 3),
            "affected_people": random.randint(1, 4),
            "severity": "mild",
            "notes": "Routine monitoring.",
            "reported_at": _time(days_ago=random.randint(1, 5)),
            "verification_status": "verified",
        })

    return reports


def generate_environmental_reports():
    """Generate environmental reports."""
    reports = []

    env_types = [
        "water_contamination", "stagnant_water", "poor_sanitation",
        "toilet_overflow", "waste_accumulation", "mosquito_breeding",
        "food_contamination"
    ]

    # Camp 07 - water contamination
    reports.extend([
        {
            "id": _id(), "camp_id": CAMP_IDS[6],
            "issue_type": "water_contamination",
            "severity": "severe",
            "description": "Main water source shows signs of contamination. Discolored water with unusual odor.",
            "location": "Primary water tank, north sector",
            "reported_at": _time(days_ago=3),
            "verification_status": "verified"
        },
        {
            "id": _id(), "camp_id": CAMP_IDS[6],
            "issue_type": "poor_sanitation",
            "severity": "moderate",
            "description": "Sanitation facilities in Block B overloaded.",
            "location": "Block B, south area",
            "reported_at": _time(days_ago=2),
            "verification_status": "verified"
        },
    ])

    # Camp 13 - multiple issues (critical)
    reports.extend([
        {
            "id": _id(), "camp_id": CAMP_IDS[12],
            "issue_type": "water_contamination",
            "severity": "severe",
            "description": "Multiple water sources contaminated. Urgent attention needed.",
            "location": "Central and East water sources",
            "reported_at": _time(days_ago=5),
            "verification_status": "verified"
        },
        {
            "id": _id(), "camp_id": CAMP_IDS[12],
            "issue_type": "toilet_overflow",
            "severity": "severe",
            "description": "Toilet facilities in 3 blocks overflowing.",
            "location": "Blocks A, C, D",
            "reported_at": _time(days_ago=4),
            "verification_status": "verified"
        },
        {
            "id": _id(), "camp_id": CAMP_IDS[12],
            "issue_type": "waste_accumulation",
            "severity": "severe",
            "description": "Waste collection halted for 5 days.",
            "location": "Camp perimeter",
            "reported_at": _time(days_ago=3),
            "verification_status": "verified"
        },
    ])

    # Camp 10 and 15 - part of cluster
    for ci in [9, 14]:
        reports.append({
            "id": _id(), "camp_id": CAMP_IDS[ci],
            "issue_type": "stagnant_water",
            "severity": "moderate",
            "description": "Stagnant water pools near living quarters.",
            "location": "Eastern perimeter",
            "reported_at": _time(days_ago=2),
            "verification_status": "verified"
        })

    # Scattered environmental issues
    for ci in [3, 8, 11, 15]:
        issue = random.choice(env_types)
        reports.append({
            "id": _id(), "camp_id": CAMP_IDS[ci],
            "issue_type": issue,
            "severity": random.choice(["mild", "moderate"]),
            "description": f"Reported {issue.replace('_', ' ')} in camp area.",
            "location": "General camp area",
            "reported_at": _time(days_ago=random.randint(1, 4)),
            "verification_status": random.choice(["verified", "pending"]),
        })

    return reports


def generate_risk_assessments(health_reports):
    """Generate risk assessments linked to health reports."""
    assessments = []
    syndrome_map = {
        "waterborne": "Waterborne illness risk",
        "respiratory": "Respiratory illness risk",
        "vector_borne": "Vector-borne illness risk",
        "gastro": "Gastrointestinal illness risk",
        "general": "General infectious illness risk",
    }

    for report in health_reports:
        symptoms = report["symptoms"]
        if symptoms.get("diarrhea") and symptoms.get("vomiting"):
            syndrome = "Waterborne illness risk"
            conf = 0.85 + random.uniform(0, 0.10)
            reasons = [
                "Gastrointestinal symptoms detected",
                "Diarrhea and vomiting co-occurring",
                "Possible waterborne pathogen"
            ]
        elif symptoms.get("cough") and symptoms.get("breathing_difficulty"):
            syndrome = "Respiratory illness risk"
            conf = 0.75 + random.uniform(0, 0.15)
            reasons = [
                "Respiratory symptoms detected",
                "Cough with breathing difficulty",
                "Monitor for acute respiratory infection"
            ]
        elif symptoms.get("rash") and symptoms.get("body_pain"):
            syndrome = "Vector-borne illness risk"
            conf = 0.70 + random.uniform(0, 0.15)
            reasons = [
                "Rash with body pain suggests vector-borne illness",
                "Check for mosquito breeding sites",
                "Monitor for dengue-like symptoms"
            ]
        elif symptoms.get("diarrhea") or symptoms.get("vomiting"):
            syndrome = "Gastrointestinal illness risk"
            conf = 0.65 + random.uniform(0, 0.15)
            reasons = [
                "Gastrointestinal symptoms present",
                "Monitor food and water safety"
            ]
        else:
            syndrome = "General infectious illness risk"
            conf = 0.50 + random.uniform(0, 0.20)
            reasons = [
                "General fever symptoms detected",
                "Continue surveillance"
            ]

        case_count = report.get("case_count", 1)
        if case_count > 15:
            risk = "critical"
        elif case_count > 10:
            risk = "high"
        elif case_count > 5:
            risk = "medium"
        else:
            risk = "low"

        assessments.append({
            "id": _id(),
            "camp_id": report["camp_id"],
            "health_report_id": report["id"],
            "risk_level": risk,
            "suspected_syndrome": syndrome,
            "confidence": round(conf, 2),
            "reasons": reasons,
            "features": {},
            "created_at": report["reported_at"],
        })

    return assessments


def generate_alerts(camps, health_reports, env_reports):
    """Generate alerts from risk conditions."""
    alerts = []

    # High risk alert for Camp 07
    alerts.append({
        "id": _id(),
        "camp_id": CAMP_IDS[6],
        "alert_type": "high_risk",
        "severity": "high",
        "reason": "Rapid increase in gastrointestinal cases with suspected water contamination",
        "description": "Camp 07 has shown a 180% increase in diarrhea and vomiting cases over the past 3 days. Water contamination has been confirmed at the primary water source.",
        "trigger_data": {
            "case_count": 23,
            "growth_rate": 1.8,
            "syndrome": "Waterborne illness risk",
            "environmental_factors": ["water_contamination", "poor_sanitation"]
        },
        "status": "pending",
        "created_at": _time(hours_ago=2),
    })

    # Critical alert for Camp 13
    alerts.append({
        "id": _id(),
        "camp_id": CAMP_IDS[12],
        "alert_type": "critical_outbreak",
        "severity": "critical",
        "reason": "Critical waterborne illness outbreak with multiple contaminated water sources",
        "description": "Camp 13 has reached critical levels with 45+ active cases. Multiple water sources contaminated. Sanitation infrastructure failing. Immediate intervention required.",
        "trigger_data": {
            "case_count": 47,
            "growth_rate": 2.5,
            "syndrome": "Waterborne illness risk",
            "environmental_factors": ["water_contamination", "toilet_overflow", "waste_accumulation"]
        },
        "status": "verified",
        "created_at": _time(hours_ago=6),
    })

    # Cluster alert
    alerts.append({
        "id": _id(),
        "camp_id": CAMP_IDS[6],
        "alert_type": "cluster",
        "severity": "high",
        "reason": "Potential waterborne illness cluster detected across 3 camps",
        "description": "Camps 07, 10, and 15 show similar gastrointestinal symptoms with elevated case counts. Geographic proximity suggests a common contamination source.",
        "trigger_data": {
            "affected_camps": ["Camp 07", "Camp 10", "Camp 15"],
            "total_cases": 51,
            "common_syndrome": "Waterborne illness risk",
            "environmental_factors": ["water_contamination", "stagnant_water"]
        },
        "status": "pending",
        "created_at": _time(hours_ago=1),
    })

    # Anomaly alert for Camp 10
    alerts.append({
        "id": _id(),
        "camp_id": CAMP_IDS[9],
        "alert_type": "anomaly",
        "severity": "high",
        "reason": "Unusual increase in gastrointestinal cases detected",
        "description": "Historical average was 3 cases/day. Current rate is 14 cases/day — a 367% increase.",
        "trigger_data": {
            "historical_avg": 3,
            "current_rate": 14,
            "increase_pct": 367,
        },
        "status": "pending",
        "created_at": _time(hours_ago=3),
    })

    # Environmental alert
    alerts.append({
        "id": _id(),
        "camp_id": CAMP_IDS[12],
        "alert_type": "environmental",
        "severity": "critical",
        "reason": "Multiple critical environmental hazards reported",
        "description": "Toilet overflow, waste accumulation, and water contamination creating compounding health risks.",
        "trigger_data": {
            "issues": ["toilet_overflow", "waste_accumulation", "water_contamination"],
            "affected_blocks": ["A", "C", "D"],
        },
        "status": "action_assigned",
        "created_at": _time(hours_ago=8),
    })

    # Medium alerts for medium-risk camps
    for ci in [3, 8]:
        alerts.append({
            "id": _id(),
            "camp_id": CAMP_IDS[ci],
            "alert_type": "elevated_risk",
            "severity": "medium",
            "reason": "Elevated risk level detected",
            "description": f"Camp {str(ci + 1).zfill(2)} showing moderate increase in reported cases.",
            "trigger_data": {"case_count": random.randint(5, 10)},
            "status": random.choice(["pending", "verified"]),
            "created_at": _time(days_ago=1),
        })

    # Resolved alert
    alerts.append({
        "id": _id(),
        "camp_id": CAMP_IDS[4],
        "alert_type": "elevated_risk",
        "severity": "medium",
        "reason": "Previously elevated respiratory cases",
        "description": "Case count has returned to baseline levels.",
        "trigger_data": {},
        "status": "resolved",
        "created_at": _time(days_ago=5),
    })

    return alerts


def generate_actions(alerts):
    """Generate actions assigned to camps."""
    actions = []

    # Action for Camp 13 (critical, in progress)
    actions.append({
        "id": _id(),
        "camp_id": CAMP_IDS[12],
        "alert_id": alerts[1]["id"] if len(alerts) > 1 else None,
        "title": "Emergency water supply deployment",
        "description": "Deploy emergency water tankers and purification systems",
        "priority": "critical",
        "instructions": "1. Arrange 3 water tankers for immediate delivery.\n2. Set up water purification units at central distribution point.\n3. Seal contaminated water sources.\n4. Distribute water purification tablets.\n5. Post water safety notices.",
        "status": "in_progress",
        "assigned_at": _time(hours_ago=5),
        "deadline": _time(hours_ago=-2),  # 2 hours from now
    })

    # Action for Camp 13 (sanitation)
    actions.append({
        "id": _id(),
        "camp_id": CAMP_IDS[12],
        "alert_id": alerts[4]["id"] if len(alerts) > 4 else None,
        "title": "Sanitation infrastructure repair",
        "description": "Repair overflowing toilet facilities in blocks A, C, D",
        "priority": "high",
        "instructions": "1. Deploy sanitation repair team.\n2. Pump out overflowing facilities.\n3. Repair damaged infrastructure.\n4. Set up temporary portable sanitation units.",
        "status": "in_progress",
        "assigned_at": _time(hours_ago=7),
        "deadline": _time(hours_ago=-12),
    })

    # Action for Camp 07 (pending)
    actions.append({
        "id": _id(),
        "camp_id": CAMP_IDS[6],
        "alert_id": alerts[0]["id"] if len(alerts) > 0 else None,
        "title": "Inspect drinking water source",
        "description": "Test the reported water source and arrange an alternate safe source",
        "priority": "high",
        "instructions": "1. Test primary water tank in north sector.\n2. Collect water samples for laboratory analysis.\n3. If contamination confirmed, seal the source.\n4. Arrange alternate safe drinking water.\n5. Notify camp medical personnel.",
        "status": "pending",
        "assigned_at": _time(minutes_ago=30),
        "deadline": _time(hours_ago=-4),
    })

    # Completed action
    actions.append({
        "id": _id(),
        "camp_id": CAMP_IDS[4],
        "alert_id": alerts[7]["id"] if len(alerts) > 7 else None,
        "title": "Respiratory case investigation",
        "description": "Investigate elevated respiratory symptoms",
        "priority": "medium",
        "instructions": "Monitor and report any new respiratory cases.",
        "status": "completed",
        "assigned_at": _time(days_ago=4),
        "completed_at": _time(days_ago=2),
    })

    return actions


def generate_notifications(alerts, actions):
    """Generate notifications for camp and admin users."""
    notifications = []

    # Camp 07 notifications
    notifications.extend([
        {
            "id": _id(),
            "user_id": None,
            "camp_id": CAMP_IDS[6],
            "title": "URGENT: Water contamination risk detected",
            "message": "High risk of waterborne illness identified at your camp. Immediate water source inspection required. Use alternate safe drinking water until source is verified.",
            "type": "alert",
            "read": False,
            "metadata": {"alert_type": "high_risk", "severity": "high"},
            "created_at": _time(hours_ago=2),
        },
        {
            "id": _id(),
            "user_id": None,
            "camp_id": CAMP_IDS[6],
            "title": "New Action Assigned: Inspect drinking water source",
            "message": "Priority: High\n\nTest the reported water source and arrange an alternate safe source until verification is complete.",
            "type": "action",
            "read": False,
            "metadata": {"action_id": actions[2]["id"] if len(actions) > 2 else None, "priority": "high"},
            "created_at": _time(minutes_ago=30),
        },
        {
            "id": _id(),
            "user_id": None,
            "camp_id": CAMP_IDS[6],
            "title": "Potential health cluster detected",
            "message": "Your camp is part of a potential waterborne illness cluster with Camp 10 and Camp 15. Increased surveillance is recommended.",
            "type": "cluster",
            "read": False,
            "metadata": {"cluster_camps": ["Camp 07", "Camp 10", "Camp 15"]},
            "created_at": _time(hours_ago=1),
        },
    ])

    # Admin notifications
    notifications.extend([
        {
            "id": _id(),
            "user_id": USER_IDS["admin"],
            "camp_id": None,
            "title": "CRITICAL: Camp 13 outbreak escalation",
            "message": "Camp 13 has reached critical levels with 47 active cases. Multiple water sources contaminated. Immediate district-level intervention required.",
            "type": "escalation",
            "read": False,
            "metadata": {"severity": "critical"},
            "created_at": _time(hours_ago=6),
        },
        {
            "id": _id(),
            "user_id": USER_IDS["admin"],
            "camp_id": None,
            "title": "New health cluster detected",
            "message": "Potential waterborne illness cluster across Camps 07, 10, and 15. 51 total cases. Common gastrointestinal symptoms.",
            "type": "cluster",
            "read": False,
            "metadata": {"total_cases": 51},
            "created_at": _time(hours_ago=1),
        },
        {
            "id": _id(),
            "user_id": USER_IDS["admin"],
            "camp_id": None,
            "title": "Action completed: Camp 05 respiratory investigation",
            "message": "Respiratory case investigation at Camp 05 has been marked as completed. Case count returned to baseline.",
            "type": "completion",
            "read": True,
            "metadata": {},
            "created_at": _time(days_ago=2),
        },
        {
            "id": _id(),
            "user_id": USER_IDS["admin"],
            "camp_id": None,
            "title": "3 reports pending verification",
            "message": "New health reports from Camp 07, Camp 10, and Camp 15 require admin verification.",
            "type": "verification",
            "read": False,
            "metadata": {"pending_count": 3},
            "created_at": _time(hours_ago=1),
        },
    ])

    return notifications


def generate_users():
    """Generate demo users."""
    return [
        {
            "id": USER_IDS["admin"],
            "email": "admin@diseasewatch.demo",
            "role": "admin",
            "name": "District Health Officer",
            "camp_id": None,
        },
        {
            "id": USER_IDS["camp"],
            "email": "camp@diseasewatch.demo",
            "role": "camp",
            "name": "Camp 07 Field Officer",
            "camp_id": CAMP_IDS[6],  # Camp 07
        },
    ]


class DemoDataStore:
    """In-memory data store for demo mode."""

    def __init__(self):
        random.seed(42)  # Reproducible data
        self.users = generate_users()
        self.camps = generate_camps()
        self.health_reports = generate_health_reports()
        self.environmental_reports = generate_environmental_reports()
        self.risk_assessments = generate_risk_assessments(self.health_reports)
        self.alerts = generate_alerts(self.camps, self.health_reports, self.environmental_reports)
        self.actions = generate_actions(self.alerts)
        self.notifications = generate_notifications(self.alerts, self.actions)

    def resolve_camp_id(self, camp_id: str) -> str:
        if not camp_id:
            return camp_id
        # Check direct match
        for c in self.camps:
            if c["id"] == camp_id:
                return c["id"]
        clean_id = str(camp_id).lower().strip()
        for i, c in enumerate(self.camps):
            c_name = c["name"].lower()  # e.g. "camp 01"
            c_slug = c_name.replace(" ", "-")  # "camp-01"
            c_short_slug = f"camp-{i + 1}"  # "camp-1"
            if clean_id in (c_name, c_slug, c_short_slug):
                return c["id"]
        if clean_id.startswith("camp-"):
            try:
                num = int(clean_id.split("-")[1])
                if 1 <= num <= len(self.camps):
                    return self.camps[num - 1]["id"]
            except ValueError:
                pass
        return camp_id

    def get_camp(self, camp_id: str):
        real_id = self.resolve_camp_id(camp_id)
        return next((c for c in self.camps if c["id"] == real_id), None)

    def get_camp_health_reports(self, camp_id: str):
        real_id = self.resolve_camp_id(camp_id)
        return [r for r in self.health_reports if r["camp_id"] == real_id]

    def get_camp_env_reports(self, camp_id: str):
        real_id = self.resolve_camp_id(camp_id)
        return [r for r in self.environmental_reports if r["camp_id"] == real_id]

    def get_camp_alerts(self, camp_id: str):
        real_id = self.resolve_camp_id(camp_id)
        return [a for a in self.alerts if a["camp_id"] == real_id]

    def get_camp_actions(self, camp_id: str):
        real_id = self.resolve_camp_id(camp_id)
        return [a for a in self.actions if a["camp_id"] == real_id]

    def get_camp_notifications(self, camp_id: str):
        real_id = self.resolve_camp_id(camp_id)
        return sorted(
            [n for n in self.notifications if n["camp_id"] == real_id],
            key=lambda x: x["created_at"], reverse=True
        )

    def get_admin_notifications(self):
        return sorted(
            [n for n in self.notifications if n.get("user_id") == USER_IDS["admin"] or n.get("camp_id") is None],
            key=lambda x: x["created_at"], reverse=True
        )

    def get_camp_detail(self, camp_id: str):
        real_id = self.resolve_camp_id(camp_id)
        camp = self.get_camp(real_id)
        if not camp:
            return None

        h_reports = self.get_camp_health_reports(real_id)
        e_reports = self.get_camp_env_reports(real_id)
        assessments = [a for a in self.risk_assessments if a["camp_id"] == real_id]
        alerts = self.get_camp_alerts(real_id)
        actions = self.get_camp_actions(real_id)

        # Calculate stats
        total_cases = sum(r["case_count"] for r in h_reports)
        active_cases = sum(r["case_count"] for r in h_reports[-3:]) if h_reports else 0

        # Symptom distribution
        symptoms_dist = {}
        for r in h_reports:
            for sym, val in r["symptoms"].items():
                if val and sym != "other":
                    symptoms_dist[sym] = symptoms_dist.get(sym, 0) + r["case_count"]

        # Top syndrome
        top_syndrome = None
        if assessments:
            syndrome_counts = {}
            for a in assessments:
                s = a["suspected_syndrome"]
                syndrome_counts[s] = syndrome_counts.get(s, 0) + 1
            top_syndrome = max(syndrome_counts, key=syndrome_counts.get)

        # Environmental issues
        env_issues = list(set(r["issue_type"] for r in e_reports))

        # Cases trend (daily)
        cases_trend = []
        for d in range(7):
            day_reports = [r for r in h_reports
                           if _time(days_ago=7 - d)[:10] <= r["reported_at"][:10] <= _time(days_ago=6 - d)[:10]]
            day_cases = sum(r["case_count"] for r in day_reports)
            cases_trend.append({
                "date": _time(days_ago=7 - d)[:10],
                "cases": day_cases if day_cases > 0 else random.randint(0, 3),
            })

        # Risk trend
        risk_map = {"low": 1, "medium": 2, "high": 3, "critical": 4}
        risk_trend = []
        for d in range(7):
            day_assessments = [a for a in assessments
                               if a["created_at"][:10] <= _time(days_ago=6 - d)[:10]]
            if day_assessments:
                avg_risk = sum(risk_map.get(a["risk_level"], 1) for a in day_assessments) / len(day_assessments)
            else:
                avg_risk = risk_map.get(camp["risk_level"], 1) * 0.7
            risk_trend.append({
                "date": _time(days_ago=7 - d)[:10],
                "risk_score": round(avg_risk, 2),
            })

        return {
            **camp,
            "health_report_count": len(h_reports),
            "environmental_report_count": len(e_reports),
            "active_cases": active_cases,
            "total_cases": total_cases,
            "top_syndrome": top_syndrome,
            "environmental_issues": env_issues,
            "last_report_time": h_reports[-1]["reported_at"] if h_reports else None,
            "health_reports": h_reports,
            "environmental_reports": e_reports,
            "risk_assessments": assessments,
            "alerts": alerts,
            "actions": actions,
            "symptoms_distribution": symptoms_dist,
            "cases_trend": cases_trend,
            "risk_trend": risk_trend,
        }

    def get_dashboard_summary(self):
        total_affected = sum(
            sum(r["affected_people"] for r in self.get_camp_health_reports(c["id"]))
            for c in self.camps
        )
        active_alerts = [a for a in self.alerts if a["status"] not in ("resolved",)]
        pending_actions = [a for a in self.actions if a["status"] == "pending"]
        high_risk = [c for c in self.camps if c["risk_level"] in ("high", "critical")]
        pending_reports = [r for r in self.health_reports if r["verification_status"] == "pending"]
        verified_reports = [r for r in self.health_reports if r["verification_status"] == "verified"]

        # Disease trends
        disease_trends = []
        for d in range(14):
            day = _time(days_ago=14 - d)[:10]
            day_cases = sum(
                r["case_count"] for r in self.health_reports
                if r["reported_at"][:10] == day
            )
            disease_trends.append({"date": day, "cases": max(day_cases, random.randint(2, 8))})

        risk_distribution = {"low": 0, "medium": 0, "high": 0, "critical": 0}
        for c in self.camps:
            risk_distribution[c["risk_level"]] += 1

        # Recent alerts with camp names
        recent_alerts = []
        for a in sorted(active_alerts, key=lambda x: x["created_at"], reverse=True)[:5]:
            camp = self.get_camp(a["camp_id"])
            recent_alerts.append({**a, "camp_name": camp["name"] if camp else "Unknown"})

        # Recent reports with camp names
        recent_reports = []
        for r in sorted(self.health_reports, key=lambda x: x["reported_at"], reverse=True)[:5]:
            camp = self.get_camp(r["camp_id"])
            recent_reports.append({**r, "camp_name": camp["name"] if camp else "Unknown"})

        return {
            "total_camps": len(self.camps),
            "total_reports": len(self.health_reports),
            "active_alerts": len(active_alerts),
            "high_risk_camps": len(high_risk),
            "total_affected": total_affected,
            "pending_actions": len(pending_actions),
            "critical_camps": len([c for c in self.camps if c["risk_level"] == "critical"]),
            "verified_reports": len(verified_reports),
            "pending_reports": len(pending_reports),
            "recent_alerts": recent_alerts,
            "recent_reports": recent_reports,
            "disease_trends": disease_trends,
            "risk_distribution": risk_distribution,
        }

    def add_health_report(self, report_data: dict):
        report = {
            "id": _id(),
            **report_data,
            "reported_at": datetime.utcnow().isoformat() + "Z",
            "verification_status": "pending",
        }
        self.health_reports.append(report)
        return report

    def add_environmental_report(self, report_data: dict):
        report = {
            "id": _id(),
            **report_data,
            "reported_at": datetime.utcnow().isoformat() + "Z",
            "verification_status": "pending",
        }
        self.environmental_reports.append(report)
        return report

    def add_alert(self, alert_data: dict):
        alert = {
            "id": _id(),
            **alert_data,
            "status": "pending",
            "created_at": datetime.utcnow().isoformat() + "Z",
        }
        self.alerts.append(alert)
        return alert

    def add_action(self, action_data: dict):
        action = {
            "id": _id(),
            **action_data,
            "status": "pending",
            "assigned_at": datetime.utcnow().isoformat() + "Z",
        }
        self.actions.append(action)

        # Create notification for the camp
        camp = self.get_camp(action_data["camp_id"])
        notification = {
            "id": _id(),
            "user_id": None,
            "camp_id": action_data["camp_id"],
            "title": f"New Action Assigned: {action_data['title']}",
            "message": f"Priority: {action_data.get('priority', 'medium').upper()}\n\n{action_data.get('instructions', action_data.get('description', ''))}",
            "type": "action",
            "read": False,
            "metadata": {"action_id": action["id"], "priority": action_data.get("priority", "medium")},
            "created_at": datetime.utcnow().isoformat() + "Z",
        }
        self.notifications.append(notification)

        return action

    def update_action(self, action_id: str, status: str):
        for action in self.actions:
            if action["id"] == action_id:
                action["status"] = status
                action["updated_at"] = datetime.utcnow().isoformat() + "Z"
                if status == "completed":
                    action["completed_at"] = datetime.utcnow().isoformat() + "Z"

                # Notify admin
                camp = self.get_camp(action["camp_id"])
                camp_name = camp["name"] if camp else "Unknown"
                notification = {
                    "id": _id(),
                    "user_id": USER_IDS["admin"],
                    "camp_id": None,
                    "title": f"Action update: {action['title']}",
                    "message": f"{camp_name} has updated action status to: {status.replace('_', ' ').title()}",
                    "type": "completion" if status == "completed" else "info",
                    "read": False,
                    "metadata": {"action_id": action_id, "status": status},
                    "created_at": datetime.utcnow().isoformat() + "Z",
                }
                self.notifications.append(notification)
                return action
        return None

    def verify_alert(self, alert_id: str, action: str):
        for alert in self.alerts:
            if alert["id"] == alert_id:
                if action == "verify":
                    alert["status"] = "verified"
                elif action == "reject":
                    alert["status"] = "resolved"
                alert["updated_at"] = datetime.utcnow().isoformat() + "Z"
                return alert
        return None

    def verify_report(self, report_id: str, status: str, report_type: str = "health"):
        reports = self.health_reports if report_type == "health" else self.environmental_reports
        for report in reports:
            if report["id"] == report_id:
                report["verification_status"] = status
                return report
        return None

    def add_risk_assessment(self, assessment_data: dict):
        assessment = {
            "id": _id(),
            **assessment_data,
            "created_at": datetime.utcnow().isoformat() + "Z",
        }
        self.risk_assessments.append(assessment)
        return assessment

    def mark_notification_read(self, notification_id: str):
        for n in self.notifications:
            if n["id"] == notification_id:
                n["read"] = True
                return n
        return None

    def get_all_camps_enriched(self):
        """Get all camps with computed stats."""
        result = []
        for camp in self.camps:
            h_reports = self.get_camp_health_reports(camp["id"])
            e_reports = self.get_camp_env_reports(camp["id"])
            active_cases = sum(r["case_count"] for r in h_reports[-3:]) if h_reports else 0

            assessments = [a for a in self.risk_assessments if a["camp_id"] == camp["id"]]
            top_syndrome = None
            if assessments:
                syndrome_counts = {}
                for a in assessments:
                    s = a["suspected_syndrome"]
                    syndrome_counts[s] = syndrome_counts.get(s, 0) + 1
                top_syndrome = max(syndrome_counts, key=syndrome_counts.get)

            env_issues = list(set(r["issue_type"] for r in e_reports))

            result.append({
                **camp,
                "health_report_count": len(h_reports),
                "environmental_report_count": len(e_reports),
                "active_cases": active_cases,
                "top_syndrome": top_syndrome,
                "environmental_issues": env_issues,
                "last_report_time": h_reports[-1]["reported_at"] if h_reports else None,
            })
        return result


# Global demo store instance
demo_store = DemoDataStore()
