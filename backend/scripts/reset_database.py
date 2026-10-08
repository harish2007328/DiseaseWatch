"""
Clean and Reset Supabase database for DiseaseWatch.
Removes all test/unwanted pre-data across tables, and re-seeds with a clean single set of 6 Tirunelveli relief camps.
"""
import os
import sys
from dotenv import load_dotenv

# Ensure backend root is on sys.path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.services.supabase_client import get_supabase

CLEAN_CAMPS = [
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


def reset_and_reseed():
    sb = get_supabase()
    if not sb:
        print("Cannot connect to Supabase. Check SUPABASE_URL and SUPABASE_KEY.")
        return

    print("Step 1: Deleting records from dependent tables...")
    for table_name in ["actions", "alerts", "health_reports", "environmental_reports", "risk_assessments"]:
        try:
            # Delete all rows where id is not null (neq a dummy uuid)
            res = sb.table(table_name).delete().neq("id", "00000000-0000-0000-0000-000000000000").execute()
            print(f"Cleared table '{table_name}': {len(res.data or [])} rows deleted.")
        except Exception as e:
            print(f"Note on clearing '{table_name}': {e}")

    print("\nStep 2: Clearing old and duplicate camps...")
    try:
        res = sb.table("camps").delete().neq("id", "00000000-0000-0000-0000-000000000000").execute()
        print(f"Cleared table 'camps': {len(res.data or [])} rows deleted.")
    except Exception as e:
        print(f"Note on clearing 'camps': {e}")

    print("\nStep 3: Seeding single clean set of 6 Tirunelveli relief camps...")
    try:
        res = sb.table("camps").insert(CLEAN_CAMPS).execute()
        new_camps = res.data or []
        print(f"Successfully inserted {len(new_camps)} clean relief camps:")
        for c in new_camps:
            print(f"  - [{c['id']}] {c['name']} (Ward: {c.get('ward')})")
    except Exception as e:
        print(f"Error inserting clean camps: {e}")

    print("\nStep 4: Ensuring essential demo users exist...")
    try:
        demo_users = [
            {"email": "admin@districthealth.gov.in", "role": "admin", "name": "Dr. Priya Sharma (District Health Officer)"},
            {"email": "admin@diseasewatch.demo", "role": "admin", "name": "District Health Administrator"},
            {"email": "camp@reliefcamp.org", "role": "camp", "name": "Camp Coordinator 01"},
            {"email": "camp@diseasewatch.demo", "role": "camp", "name": "Camp Coordinator 02"},
        ]
        for u in demo_users:
            exists = sb.table("users").select("id").eq("email", u["email"]).execute().data
            if not exists:
                sb.table("users").insert(u).execute()
                print(f"Created user: {u['email']}")
        print("Demo users verified.")
    except Exception as e:
        print(f"Note on users: {e}")

    print("\nDatabase reset and clean re-seed complete!")


if __name__ == "__main__":
    reset_and_reseed()
