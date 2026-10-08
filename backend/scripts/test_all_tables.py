import os
from dotenv import load_dotenv
from supabase import create_client

load_dotenv()
SUPABASE_URL = os.environ.get("SUPABASE_URL", "")
SUPABASE_KEY = os.environ.get("SUPABASE_KEY", "")

client = create_client(SUPABASE_URL, SUPABASE_KEY)

tables = ["camps", "users", "health_reports", "environmental_reports", "alerts", "actions", "risk_assessments"]

for t in tables:
    try:
        res = client.table(t).select("count", count="exact").execute()
        print(f"Table '{t}': exists, row count = {res.count}")
    except Exception as e:
        print(f"Table '{t}': ERROR -> {e}")
