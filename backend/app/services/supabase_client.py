"""Supabase client initialization for DiseaseWatch."""
import os
from dotenv import load_dotenv
from supabase import create_client, Client

load_dotenv()

SUPABASE_URL = os.environ.get("SUPABASE_URL") or "https://gnaqhrjdwfobreoudmls.supabase.co"
SUPABASE_KEY = os.environ.get("SUPABASE_KEY") or "sb_publishable_CkJMyKqcUuexacFG_3_iew_ON1DsXwV"

supabase_client: Client | None = None

if SUPABASE_URL and SUPABASE_KEY:
    try:
        supabase_client = create_client(SUPABASE_URL, SUPABASE_KEY)
        print("Connected to Supabase project successfully.")
    except Exception as e:
        print(f"Supabase connection warning: {e}")
else:
    print("No Supabase credentials configured. Running in in-memory mode.")


def get_supabase() -> Client | None:
    return supabase_client
