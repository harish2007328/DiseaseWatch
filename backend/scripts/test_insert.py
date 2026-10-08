import os
import uuid
from dotenv import load_dotenv
from supabase import create_client

load_dotenv()
SUPABASE_URL = os.environ.get("SUPABASE_URL", "")
SUPABASE_KEY = os.environ.get("SUPABASE_KEY", "")

client = create_client(SUPABASE_URL, SUPABASE_KEY)

# Let's see what happens if we insert a camp with a real UUID
test_id = str(uuid.uuid4())
try:
    res = client.table("camps").insert({
        "name": "Test Camp",
        "location_lat": 8.7139,
        "location_lng": 77.7567,
        "population": 100,
        "district": "Tirunelveli",
        "ward": "Ward 1",
        "risk_level": "low"
    }).execute()
    print("Insert success with auto-gen UUID:", res.data)
    # clean up test camp
    if res.data:
        client.table("camps").delete().eq("id", res.data[0]["id"]).execute()
        print("Deleted test camp successfully")
except Exception as e:
    print("Insert error:", e)
