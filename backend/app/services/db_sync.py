"""
Database Synchronization Service for DiseaseWatch.
Synchronizes all reads and writes directly with Supabase PostgreSQL tables,
with seamless fallback to demo_store when offline.
"""
import uuid
import logging
from datetime import datetime
from typing import Dict, Any, List, Optional
from app.services.supabase_client import get_supabase
from app.services.demo_data import demo_store

logger = logging.getLogger("db_sync")
logger.setLevel(logging.INFO)

# Map human-readable camp keys (like 'camp-1') to actual Supabase camp UUIDs
_camp_uuid_cache: Dict[str, str] = {}


def _is_uuid(val: str) -> bool:
    try:
        uuid.UUID(str(val))
        return True
    except (ValueError, TypeError):
        return False


def get_camp_uuid(camp_identifier: str) -> str:
    """Resolve a camp ID (whether string like 'camp-1' or UUID) to a valid Supabase UUID."""
    if not camp_identifier:
        # Default to first known camp
        return "53644ed6-4389-4584-80ed-2e6ee8d7a491"

    if _is_uuid(camp_identifier):
        return str(camp_identifier)

    # Check cache
    if camp_identifier in _camp_uuid_cache:
        return _camp_uuid_cache[camp_identifier]

    # Resolve from Supabase
    client = get_supabase()
    if client:
        try:
            res = client.table("camps").select("id, name").execute()
            camps = res.data or []
            if camps:
                # If camp_identifier is 'camp-1', index 0
                import re
                match = re.search(r'\d+', camp_identifier)
                if match:
                    idx = int(match.group()) - 1
                    if 0 <= idx < len(camps):
                        resolved = camps[idx]["id"]
                        _camp_uuid_cache[camp_identifier] = resolved
                        return resolved

                # Fallback to first camp
                resolved = camps[0]["id"]
                _camp_uuid_cache[camp_identifier] = resolved
                return resolved
        except Exception as e:
            logger.warning(f"Error resolving camp UUID: {e}")

    # Fallback default UUID
    return "53644ed6-4389-4584-80ed-2e6ee8d7a491"


# =========================================================================
# ACTIONS
# =========================================================================

def get_actions_sync(camp_id: Optional[str] = None, status: Optional[str] = None) -> List[Dict[str, Any]]:
    """Retrieve actions from Supabase with camp name enrichment."""
    client = get_supabase()
    if client:
        try:
            query = client.table("actions").select("*, camps(name)")
            if camp_id:
                real_camp_id = get_camp_uuid(camp_id)
                query = query.eq("camp_id", real_camp_id)
            if status:
                query = query.eq("status", status)

            res = query.order("assigned_at", desc=True).execute()
            data = res.data or []
            if data:
                formatted = []
                for row in data:
                    c_name = "Unknown"
                    if isinstance(row.get("camps"), dict):
                        c_name = row["camps"].get("name", "Unknown")
                    elif isinstance(row.get("camps"), list) and row["camps"]:
                        c_name = row["camps"][0].get("name", "Unknown")
                    
                    item = {**row, "camp_name": c_name}
                    item.pop("camps", None)
                    formatted.append(item)
                return formatted
        except Exception as e:
            logger.error(f"Error fetching actions from Supabase: {e}")

    # Fallback to demo_store
    if camp_id:
        actions = demo_store.get_camp_actions(camp_id)
    else:
        actions = demo_store.actions

    if status:
        actions = [a for a in actions if a["status"] == status]

    result = []
    for a in sorted(actions, key=lambda x: x.get("assigned_at", ""), reverse=True):
        camp = demo_store.get_camp(a.get("camp_id"))
        result.append({**a, "camp_name": camp["name"] if camp else "Relief Camp"})
    return result


def create_action_sync(action_data: Dict[str, Any]) -> Dict[str, Any]:
    """Insert new action into Supabase and update local demo_store."""
    # Always keep demo_store in sync
    created_in_memory = demo_store.add_action(action_data)

    client = get_supabase()
    if client:
        try:
            resolved_camp_id = get_camp_uuid(action_data.get("camp_id", ""))
            resolved_alert_id = action_data.get("alert_id")
            if resolved_alert_id and not _is_uuid(resolved_alert_id):
                resolved_alert_id = None

            db_payload = {
                "camp_id": resolved_camp_id,
                "alert_id": resolved_alert_id,
                "title": action_data["title"],
                "description": action_data.get("description", ""),
                "priority": action_data.get("priority", "medium"),
                "instructions": action_data.get("instructions"),
                "status": "pending",
                "assigned_at": datetime.utcnow().isoformat() + "Z",
            }
            if action_data.get("deadline"):
                db_payload["deadline"] = action_data["deadline"]

            res = client.table("actions").insert(db_payload).execute()
            if res.data and len(res.data) > 0:
                inserted = res.data[0]
                logger.info(f"Action synced to Supabase with ID: {inserted['id']}")
                return inserted
        except Exception as e:
            logger.error(f"Failed to sync action to Supabase: {e}")

    return created_in_memory


def update_action_sync(action_id: str, new_status: str) -> Optional[Dict[str, Any]]:
    """Update action status in Supabase and demo_store."""
    # Update local memory
    mem_result = demo_store.update_action(action_id, new_status)

    client = get_supabase()
    if client and _is_uuid(action_id):
        try:
            res = client.table("actions").update({"status": new_status}).eq("id", action_id).execute()
            if res.data and len(res.data) > 0:
                logger.info(f"Updated action {action_id} in Supabase -> {new_status}")
                return res.data[0]
        except Exception as e:
            logger.error(f"Failed to update action in Supabase: {e}")

    return mem_result


# =========================================================================
# HEALTH REPORTS
# =========================================================================

def get_health_reports_sync(camp_id: Optional[str] = None) -> List[Dict[str, Any]]:
    """Retrieve health reports from Supabase with camp name enrichment."""
    client = get_supabase()
    if client:
        try:
            query = client.table("health_reports").select("*, camps(name)")
            if camp_id:
                real_camp_id = get_camp_uuid(camp_id)
                query = query.eq("camp_id", real_camp_id)

            res = query.order("reported_at", desc=True).execute()
            data = res.data or []
            if data:
                formatted = []
                for row in data:
                    c_name = "Unknown"
                    if isinstance(row.get("camps"), dict):
                        c_name = row["camps"].get("name", "Unknown")
                    elif isinstance(row.get("camps"), list) and row["camps"]:
                        c_name = row["camps"][0].get("name", "Unknown")
                    
                    item = {**row, "camp_name": c_name}
                    item.pop("camps", None)
                    formatted.append(item)
                return formatted
        except Exception as e:
            logger.error(f"Error fetching health reports from Supabase: {e}")

    # Fallback to demo_store
    reports = demo_store.get_camp_health_reports(camp_id) if camp_id else demo_store.health_reports
    result = []
    for r in sorted(reports, key=lambda x: x.get("reported_at", ""), reverse=True):
        camp = demo_store.get_camp(r.get("camp_id"))
        result.append({**r, "camp_name": camp["name"] if camp else "Relief Camp"})
    return result


def create_health_report_sync(report_data: Dict[str, Any]) -> Dict[str, Any]:
    """Insert health report into Supabase and demo_store."""
    created_in_memory = demo_store.add_health_report(report_data)

    client = get_supabase()
    if client:
        try:
            resolved_camp_id = get_camp_uuid(report_data.get("camp_id", ""))
            db_payload = {
                "camp_id": resolved_camp_id,
                "symptoms": report_data.get("symptoms", {}),
                "case_count": int(report_data.get("case_count", 1)),
                "affected_people": int(report_data.get("affected_people", 1)),
                "severity": report_data.get("severity", "mild"),
                "notes": report_data.get("notes", ""),
                "verification_status": "pending",
                "reported_at": datetime.utcnow().isoformat() + "Z",
            }
            res = client.table("health_reports").insert(db_payload).execute()
            if res.data and len(res.data) > 0:
                inserted = res.data[0]
                logger.info(f"Health report synced to Supabase with ID: {inserted['id']}")
                return inserted
        except Exception as e:
            logger.error(f"Failed to sync health report to Supabase: {e}")

    return created_in_memory


def verify_health_report_sync(report_id: str, status: str) -> Optional[Dict[str, Any]]:
    """Update report verification status in Supabase and demo_store."""
    mem_result = demo_store.verify_report(report_id, status, "health")

    client = get_supabase()
    if client and _is_uuid(report_id):
        try:
            update_data = {
                "verification_status": status,
                "verified_at": datetime.utcnow().isoformat() + "Z"
            }
            res = client.table("health_reports").update(update_data).eq("id", report_id).execute()
            if res.data and len(res.data) > 0:
                logger.info(f"Verified health report {report_id} in Supabase -> {status}")
                return res.data[0]
        except Exception as e:
            logger.error(f"Failed to verify health report in Supabase: {e}")

    return mem_result


# =========================================================================
# ENVIRONMENTAL REPORTS
# =========================================================================

def get_env_reports_sync(camp_id: Optional[str] = None) -> List[Dict[str, Any]]:
    """Retrieve environmental reports from Supabase with camp name enrichment."""
    client = get_supabase()
    if client:
        try:
            query = client.table("environmental_reports").select("*, camps(name)")
            if camp_id:
                real_camp_id = get_camp_uuid(camp_id)
                query = query.eq("camp_id", real_camp_id)

            res = query.order("reported_at", desc=True).execute()
            data = res.data or []
            if data:
                formatted = []
                for row in data:
                    c_name = "Unknown"
                    if isinstance(row.get("camps"), dict):
                        c_name = row["camps"].get("name", "Unknown")
                    elif isinstance(row.get("camps"), list) and row["camps"]:
                        c_name = row["camps"][0].get("name", "Unknown")
                    
                    item = {**row, "camp_name": c_name}
                    item.pop("camps", None)
                    formatted.append(item)
                return formatted
        except Exception as e:
            logger.error(f"Error fetching environmental reports from Supabase: {e}")

    reports = demo_store.get_camp_env_reports(camp_id) if camp_id else demo_store.environmental_reports
    result = []
    for r in sorted(reports, key=lambda x: x.get("reported_at", ""), reverse=True):
        camp = demo_store.get_camp(r.get("camp_id"))
        result.append({**r, "camp_name": camp["name"] if camp else "Relief Camp"})
    return result


def create_env_report_sync(report_data: Dict[str, Any]) -> Dict[str, Any]:
    """Insert environmental report into Supabase and demo_store."""
    created_in_memory = demo_store.add_env_report(report_data)

    client = get_supabase()
    if client:
        try:
            resolved_camp_id = get_camp_uuid(report_data.get("camp_id", ""))
            db_payload = {
                "camp_id": resolved_camp_id,
                "issue_type": report_data.get("issue_type", "sanitation"),
                "severity": report_data.get("severity", "moderate"),
                "description": report_data.get("description", ""),
                "location": report_data.get("location", ""),
                "verification_status": "pending",
                "reported_at": datetime.utcnow().isoformat() + "Z",
            }
            res = client.table("environmental_reports").insert(db_payload).execute()
            if res.data and len(res.data) > 0:
                inserted = res.data[0]
                logger.info(f"Environmental report synced to Supabase with ID: {inserted['id']}")
                return inserted
        except Exception as e:
            logger.error(f"Failed to sync environmental report to Supabase: {e}")

    return created_in_memory


def verify_env_report_sync(report_id: str, status: str) -> Optional[Dict[str, Any]]:
    """Update environmental report verification status in Supabase and demo_store."""
    mem_result = demo_store.verify_report(report_id, status, "environmental")

    client = get_supabase()
    if client and _is_uuid(report_id):
        try:
            update_data = {
                "verification_status": status,
                "verified_at": datetime.utcnow().isoformat() + "Z"
            }
            res = client.table("environmental_reports").update(update_data).eq("id", report_id).execute()
            if res.data and len(res.data) > 0:
                logger.info(f"Verified env report {report_id} in Supabase -> {status}")
                return res.data[0]
        except Exception as e:
            logger.error(f"Failed to verify env report in Supabase: {e}")

    return mem_result


# =========================================================================
# ALERTS
# =========================================================================

def get_alerts_sync(camp_id: Optional[str] = None, status: Optional[str] = None) -> List[Dict[str, Any]]:
    """Retrieve alerts from Supabase with camp name enrichment."""
    client = get_supabase()
    if client:
        try:
            query = client.table("alerts").select("*, camps(name)")
            if camp_id:
                real_camp_id = get_camp_uuid(camp_id)
                query = query.eq("camp_id", real_camp_id)
            if status:
                query = query.eq("status", status)

            res = query.order("created_at", desc=True).execute()
            data = res.data or []
            if data:
                formatted = []
                for row in data:
                    c_name = "Unknown"
                    if isinstance(row.get("camps"), dict):
                        c_name = row["camps"].get("name", "Unknown")
                    elif isinstance(row.get("camps"), list) and row["camps"]:
                        c_name = row["camps"][0].get("name", "Unknown")
                    
                    item = {**row, "camp_name": c_name}
                    item.pop("camps", None)
                    formatted.append(item)
                return formatted
        except Exception as e:
            logger.error(f"Error fetching alerts from Supabase: {e}")

    alerts = demo_store.get_camp_alerts(camp_id) if camp_id else demo_store.alerts
    if status:
        alerts = [a for a in alerts if a["status"] == status]

    result = []
    for a in sorted(alerts, key=lambda x: x.get("created_at", ""), reverse=True):
        camp = demo_store.get_camp(a.get("camp_id"))
        result.append({**a, "camp_name": camp["name"] if camp else "Relief Camp"})
    return result


def verify_alert_sync(alert_id: str, action: str) -> Optional[Dict[str, Any]]:
    """Update alert status in Supabase and demo_store."""
    mem_result = demo_store.verify_alert(alert_id, action)

    client = get_supabase()
    if client and _is_uuid(alert_id):
        try:
            new_status = "verified" if action == "verify" else "resolved"
            update_data = {
                "status": new_status,
                "updated_at": datetime.utcnow().isoformat() + "Z"
            }
            res = client.table("alerts").update(update_data).eq("id", alert_id).execute()
            if res.data and len(res.data) > 0:
                logger.info(f"Verified alert {alert_id} in Supabase -> {new_status}")
                return res.data[0]
        except Exception as e:
            logger.error(f"Failed to update alert in Supabase: {e}")

    return mem_result


# =========================================================================
# CAMPS
# =========================================================================

def get_camps_sync() -> List[Dict[str, Any]]:
    """Retrieve all camps from Supabase enriched with live report counts."""
    client = get_supabase()
    if client:
        try:
            res = client.table("camps").select("*").order("name").execute()
            camps = res.data or []
            if camps:
                # Also fetch health report counts and active cases
                hr_res = client.table("health_reports").select("camp_id, case_count").execute()
                er_res = client.table("environmental_reports").select("camp_id, issue_type").execute()
                
                hr_data = hr_res.data or []
                er_data = er_res.data or []

                # Count maps
                h_counts: Dict[str, int] = {}
                cases_counts: Dict[str, int] = {}
                for r in hr_data:
                    cid = r["camp_id"]
                    h_counts[cid] = h_counts.get(cid, 0) + 1
                    cases_counts[cid] = cases_counts.get(cid, 0) + int(r.get("case_count", 0))

                e_counts: Dict[str, int] = {}
                e_issues: Dict[str, List[str]] = {}
                for r in er_data:
                    cid = r["camp_id"]
                    e_counts[cid] = e_counts.get(cid, 0) + 1
                    if cid not in e_issues:
                        e_issues[cid] = []
                    if r.get("issue_type"):
                        e_issues[cid].append(r["issue_type"])

                enriched = []
                for c in camps:
                    cid = c["id"]
                    enriched.append({
                        **c,
                        "health_report_count": h_counts.get(cid, 0),
                        "environmental_report_count": e_counts.get(cid, 0),
                        "active_cases": cases_counts.get(cid, 0),
                        "environmental_issues": list(set(e_issues.get(cid, []))),
                    })
                return enriched
        except Exception as e:
            logger.error(f"Error fetching camps from Supabase: {e}")

    return demo_store.get_all_camps_enriched()
