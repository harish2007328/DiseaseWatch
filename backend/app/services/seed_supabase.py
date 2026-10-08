"""
Seed initial Tirunelveli camps, users, and reports into Supabase tables.
"""
import os
import uuid
from typing import Dict, Any, List
from dotenv import load_dotenv

load_dotenv()

from app.services.supabase_client import get_supabase

INITIAL_CAMPS = [
    {
        "name": "Camp 01 - Govt Higher Secondary School (Palayamkottai)",
        "location_lat": 8.7180,
        "location_lng": 77.7420,
        "population": 1250,
        "district": "Tirunelveli",
        "ward": "Palayamkottai",
        "risk_level": "medium",
        "risk_score": 0.42,
    },
    {
        "name": "Camp 02 - Municipal Community Hall (Tirunelveli Town)",
        "location_lat": 8.7300,
        "location_lng": 77.7010,
        "population": 840,
        "district": "Tirunelveli",
        "ward": "Tirunelveli Town",
        "risk_level": "low",
        "risk_score": 0.18,
    },
    {
        "name": "Camp 03 - VOC Indoor Sports Complex (Melapalayam)",
        "location_lat": 8.6950,
        "location_lng": 77.7280,
        "population": 1600,
        "district": "Tirunelveli",
        "ward": "Melapalayam",
        "risk_level": "high",
        "risk_score": 0.78,
    },
    {
        "name": "Camp 04 - Panchayat Union Primary School (Pettai)",
        "location_lat": 8.7420,
        "location_lng": 77.6750,
        "population": 620,
        "district": "Tirunelveli",
        "ward": "Pettai",
        "risk_level": "low",
        "risk_score": 0.12,
    },
    {
        "name": "Camp 05 - Cyclone Evacuee Shelter B (Thatchanallur)",
        "location_lat": 8.7510,
        "location_lng": 77.7290,
        "population": 910,
        "district": "Tirunelveli",
        "ward": "Thatchanallur",
        "risk_level": "medium",
        "risk_score": 0.48,
    },
    {
        "name": "Camp 06 - Red Cross Disaster Relief Center (Murugankurichi)",
        "location_lat": 8.7110,
        "location_lng": 77.7350,
        "population": 1100,
        "district": "Tirunelveli",
        "ward": "Murugankurichi",
        "risk_level": "critical",
        "risk_score": 0.88,
    },
]

def seed_supabase_data() -> Dict[str, Any]:
    client = get_supabase()
    if not client:
        return {"status": "error", "message": "Supabase client not connected. Check SUPABASE_URL and SUPABASE_KEY."}

    results = {
        "camps_inserted": 0,
        "users_inserted": 0,
        "errors": []
    }

    # 1. Seed Camps ONLY if camps table is empty
    try:
        existing = client.table("camps").select("id, name").execute()
        if not existing.data or len(existing.data) == 0:
            res = client.table("camps").insert(INITIAL_CAMPS).execute()
            results["camps_inserted"] = len(res.data or [])
    except Exception as e:
        results["errors"].append(f"Camps seed error: {str(e)}")

    # 2. Seed Demo Users
    try:
        existing_users = client.table("users").select("email").execute()
        existing_emails = {row["email"] for row in (existing_users.data or [])}

        users_to_insert = []
        demo_users = [
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
                "name": "Camp Coordinator 01",
            },
            {
                "email": "camp@diseasewatch.demo",
                "role": "camp",
                "name": "Camp Coordinator 02",
            }
        ]

        for u in demo_users:
            if u["email"] not in existing_emails:
                users_to_insert.append(u)

        if users_to_insert:
            res = client.table("users").insert(users_to_insert).execute()
            results["users_inserted"] = len(res.data or [])
    except Exception as e:
        results["errors"].append(f"Users seed error: {str(e)}")

    return results

if __name__ == "__main__":
    out = seed_supabase_data()
    print("Seed result:", out)
