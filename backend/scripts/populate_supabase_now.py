"""
Full Seeding Script for DiseaseWatch on Supabase.
Populates all tables: camps, users, health_reports, environmental_reports, alerts, actions.
"""
import os
import uuid
from datetime import datetime, timezone
from dotenv import load_dotenv
from supabase import create_client

load_dotenv()
SUPABASE_URL = os.environ.get("SUPABASE_URL", "")
SUPABASE_KEY = os.environ.get("SUPABASE_KEY", "")

client = create_client(SUPABASE_URL, SUPABASE_KEY)

print("Starting full database population on Supabase...")

# 1. Clear test/duplicate camps and seed all 6 official Tirunelveli relief camps
CAMPS_DATA = [
    {
        "name": "Camp 01 - Govt Higher Secondary School",
        "location_lat": 8.7180,
        "location_lng": 77.7490,
        "population": 1250,
        "district": "Tirunelveli",
        "ward": "Palayamkottai Ward 04",
        "risk_level": "high",
        "risk_score": 0.84,
    },
    {
        "name": "Camp 02 - Municipal Community Hall",
        "location_lat": 8.7310,
        "location_lng": 77.7020,
        "population": 840,
        "district": "Tirunelveli",
        "ward": "Tirunelveli Town Ward 01",
        "risk_level": "medium",
        "risk_score": 0.52,
    },
    {
        "name": "Camp 03 - VOC Indoor Sports Complex",
        "location_lat": 8.6890,
        "location_lng": 77.7340,
        "population": 1600,
        "district": "Tirunelveli",
        "ward": "Melapalayam Ward 07",
        "risk_level": "high",
        "risk_score": 0.78,
    },
    {
        "name": "Camp 04 - Panchayat Union Primary School",
        "location_lat": 8.6720,
        "location_lng": 77.7610,
        "population": 520,
        "district": "Tirunelveli",
        "ward": "Cheranmahadevi Sector",
        "risk_level": "low",
        "risk_score": 0.22,
    },
    {
        "name": "Camp 05 - Cyclone Evacuee Shelter B",
        "location_lat": 8.7520,
        "location_lng": 77.7380,
        "population": 910,
        "district": "Tirunelveli",
        "ward": "Palayamkottai North",
        "risk_level": "medium",
        "risk_score": 0.47,
    },
    {
        "name": "Camp 06 - Red Cross Disaster Relief Center",
        "location_lat": 8.7420,
        "location_lng": 77.6890,
        "population": 680,
        "district": "Tirunelveli",
        "ward": "Tirunelveli Junction",
        "risk_level": "low",
        "risk_score": 0.18,
    },
]

# Wipe existing camps to prevent duplicates and re-seed cleanly
try:
    client.table("camps").delete().neq("name", "___none___").execute()
except Exception as e:
    print("Clean existing camps notice:", e)

res_camps = client.table("camps").insert(CAMPS_DATA).execute()
camps_rows = res_camps.data
print(f"Inserted {len(camps_rows)} camps into 'camps' table.")

# Map camp name -> id
camp_id_map = {c["name"]: c["id"] for c in camps_rows}
c1_id = camps_rows[0]["id"]
c2_id = camps_rows[1]["id"]
c3_id = camps_rows[2]["id"]

# 2. Seed Users
USERS_DATA = [
    {
        "email": "admin@districthealth.gov.in",
        "role": "admin",
        "name": "Dr. Priya Sharma (District Health Officer)",
    },
    {
        "email": "admin@diseasewatch.demo",
        "role": "admin",
        "name": "District Health Administrator",
    },
    {
        "email": "camp@reliefcamp.org",
        "role": "camp",
        "name": "Camp Coordinator (Camp 01)",
        "camp_id": c1_id,
    },
    {
        "email": "camp@diseasewatch.demo",
        "role": "camp",
        "name": "Field Unit Coordinator",
        "camp_id": c2_id,
    },
]

try:
    client.table("users").delete().neq("email", "___none___").execute()
except Exception as e:
    pass

res_users = client.table("users").insert(USERS_DATA).execute()
print(f"Inserted {len(res_users.data)} users into 'users' table.")

# 3. Seed Health Reports
HEALTH_REPORTS_DATA = [
    {
        "camp_id": c1_id,
        "symptoms": {"diarrhea": True, "vomiting": True, "fever": False},
        "case_count": 23,
        "affected_people": 23,
        "severity": "severe",
        "notes": "Rapid onset watery diarrhea cases reported following drinking water pipeline leakage.",
        "verification_status": "verified",
    },
    {
        "camp_id": c1_id,
        "symptoms": {"fever": True, "headache": True, "body_pain": True},
        "case_count": 8,
        "affected_people": 8,
        "severity": "moderate",
        "notes": "Febrile illness with chills in Block B tents.",
        "verification_status": "verified",
    },
    {
        "camp_id": c2_id,
        "symptoms": {"cough": True, "fever": True, "breathing_difficulty": False},
        "case_count": 14,
        "affected_people": 14,
        "severity": "moderate",
        "notes": "Acute respiratory symptoms in community hall dormitories.",
        "verification_status": "pending",
    },
    {
        "camp_id": c3_id,
        "symptoms": {"diarrhea": True, "vomiting": True, "fever": True},
        "case_count": 19,
        "affected_people": 19,
        "severity": "severe",
        "notes": "Gastrointestinal cluster among evacuee children near drainage ditch.",
        "verification_status": "verified",
    },
]

try:
    client.table("health_reports").delete().neq("severity", "___none___").execute()
except Exception:
    pass

res_hr = client.table("health_reports").insert(HEALTH_REPORTS_DATA).execute()
print(f"Inserted {len(res_hr.data)} reports into 'health_reports' table.")

# 4. Seed Environmental Reports
ENV_REPORTS_DATA = [
    {
        "camp_id": c1_id,
        "issue_type": "water_contamination",
        "severity": "severe",
        "description": "Flood water backflow infiltrated overhead drinking water sump.",
        "location": "Main Water Storage Reservoir, Block A",
        "verification_status": "verified",
    },
    {
        "camp_id": c2_id,
        "issue_type": "stagnant_water",
        "severity": "moderate",
        "description": "Stagnant puddle accumulating near community kitchen with high mosquito larvae count.",
        "location": "Kitchen perimeter, East Courtyard",
        "verification_status": "pending",
    },
    {
        "camp_id": c3_id,
        "issue_type": "overflowing_toilets",
        "severity": "severe",
        "description": "Latrine septic pit submerged by runoff. Sewage contamination risk.",
        "location": "Southern Sanitation Block",
        "verification_status": "verified",
    },
]

try:
    client.table("environmental_reports").delete().neq("severity", "___none___").execute()
except Exception:
    pass

res_er = client.table("environmental_reports").insert(ENV_REPORTS_DATA).execute()
print(f"Inserted {len(res_er.data)} environmental hazards into 'environmental_reports' table.")

# 5. Seed Alerts
ALERTS_DATA = [
    {
        "camp_id": c1_id,
        "alert_type": "syndrome_spike",
        "severity": "high",
        "reason": "Rapid spike in acute diarrheal cases (+180% above 3-day baseline)",
        "description": "Cluster of 23 gastrointestinal cases correlated with reported drinking water contamination.",
        "trigger_data": {"cases_count": 23, "anomaly_score": 0.88, "syndrome": "Waterborne illness"},
        "status": "pending",
    },
    {
        "camp_id": c3_id,
        "alert_type": "environmental_hazard",
        "severity": "high",
        "reason": "Sewage and latrine pit overflow in VOC Indoor Sports Complex",
        "description": "Flood runoff caused blackwater ingress near sleeping quarters.",
        "trigger_data": {"cases_count": 19, "anomaly_score": 0.81, "syndrome": "Waterborne & Sanitation"},
        "status": "action_assigned",
    },
    {
        "camp_id": c2_id,
        "alert_type": "respiratory_cluster",
        "severity": "medium",
        "reason": "Increase in acute febrile respiratory illness in indoor halls",
        "description": "14 evacuees reporting fever and persistent cough under damp conditions.",
        "trigger_data": {"cases_count": 14, "anomaly_score": 0.54, "syndrome": "Respiratory illness"},
        "status": "pending",
    },
]

try:
    client.table("alerts").delete().neq("alert_type", "___none___").execute()
except Exception:
    pass

res_alerts = client.table("alerts").insert(ALERTS_DATA).execute()
print(f"Inserted {len(res_alerts.data)} alerts into 'alerts' table.")

# 6. Seed Actions
ACTIONS_DATA = [
    {
        "camp_id": c1_id,
        "title": "Immediate Chlorination & Water Tank Super-Dosing",
        "description": "Superchlorinate overhead tank at 5 mg/L residual chlorine. Distribute 500 chlorine tablets to tents.",
        "priority": "critical",
        "instructions": "1. Isolate contaminated storage tank\n2. Dispatch water tanker with certified potable supply\n3. Set up ORS hydration kiosk at Medical Post",
        "status": "in_progress",
    },
    {
        "camp_id": c3_id,
        "title": "Septic Pump-Out and Sanitation Disinfection",
        "description": "Deploy vacuum gully sucker truck to drain overflowed latrine pit. Disinfect soil with bleaching powder.",
        "priority": "high",
        "instructions": "1. Cordone off southern sanitation block\n2. Apply lime powder across contaminated perimeter\n3. Erect 6 temporary chemical toilets",
        "status": "pending",
    },
    {
        "camp_id": c2_id,
        "title": "Ventilation Improvement & Fever Screening",
        "description": "Distribute masks to symptomatic residents, open high-level cross ventilation, and separate febrile patients.",
        "priority": "medium",
        "instructions": "1. Screen all residents for fever >100 F\n2. Establish separate isolation tent for acute cough\n3. Provide warm hydration and hygiene kits",
        "status": "completed",
    },
]

try:
    client.table("actions").delete().neq("priority", "___none___").execute()
except Exception:
    pass

res_actions = client.table("actions").insert(ACTIONS_DATA).execute()
print(f"Inserted {len(res_actions.data)} action directives into 'actions' table.")

print("\n--- DATABASE POPULATION COMPLETE ---")
print("All Supabase tables are now populated with live data!")
