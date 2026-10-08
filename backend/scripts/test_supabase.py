import os
from dotenv import load_dotenv

load_dotenv()

SUPABASE_URL = os.environ.get("SUPABASE_URL", "")
SUPABASE_KEY = os.environ.get("SUPABASE_KEY", "")

print(f"SUPABASE_URL: {SUPABASE_URL}")
print(f"SUPABASE_KEY exists: {bool(SUPABASE_KEY)}")

try:
    from supabase import create_client
    client = create_client(SUPABASE_URL, SUPABASE_KEY)
    print("Testing 'camps' table query...")
    res = client.table("camps").select("*").execute()
    print("Result data count:", len(res.data))
    print("Data:", res.data)
except Exception as e:
    print("Error querying camps table:", e)
