"""Authentication routes — Demo & Role Selection."""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from app.models.schemas import LoginRequest, LoginResponse
from app.services.demo_data import demo_store, USER_IDS, CAMP_IDS

router = APIRouter(prefix="/api/auth", tags=["Authentication"])

# Demo credentials
DEMO_USERS = {
    "admin@districthealth.gov.in": {
        "password": "admin123",
        "role": "admin",
        "user_id": USER_IDS["admin"],
        "name": "Dr. Priya Sharma (District Health Officer)",
        "camp_id": None,
    },
    "admin@diseasewatch.demo": {
        "password": "admin123",
        "role": "admin",
        "user_id": USER_IDS["admin"],
        "name": "District Health Officer",
        "camp_id": None,
    },
    "camp@reliefcamp.org": {
        "password": "camp123",
        "role": "camp",
        "user_id": USER_IDS["camp"],
        "name": "Camp Coordinator (Field Station)",
        "camp_id": "camp-1",
    },
    "camp@diseasewatch.demo": {
        "password": "camp123",
        "role": "camp",
        "user_id": USER_IDS["camp"],
        "name": "Camp 07 Field Officer",
        "camp_id": CAMP_IDS[6],
    },
}


class RoleSelectRequest(BaseModel):
    role: str  # 'admin' | 'camp'
    camp_id: Optional[str] = None
    name: Optional[str] = None


@router.post("/demo-login", response_model=LoginResponse)
async def demo_login(request: LoginRequest):
    """
    Demo authentication endpoint.
    Validates against hardcoded demo credentials.
    """
    user = DEMO_USERS.get(request.email.strip().lower())
    if not user or user["password"] != request.password:
        raise HTTPException(status_code=401, detail="Invalid email or password")

    return LoginResponse(
        token=f"demo-token-{user['role']}-{user['user_id']}",
        user={
            "id": user["user_id"],
            "email": request.email,
            "name": user["name"],
            "role": user["role"],
            "camp_id": user["camp_id"],
        },
        role=user["role"],
        camp_id=user["camp_id"],
    )


@router.post("/role-select", response_model=LoginResponse)
async def role_select(request: RoleSelectRequest):
    """Instant role authentication for hackathon evaluation."""
    if request.role == "admin":
        return LoginResponse(
            token="demo-token-admin-session",
            user={
                "id": USER_IDS["admin"],
                "email": "admin@districthealth.gov.in",
                "name": request.name or "Dr. Priya Sharma (District Health Officer)",
                "role": "admin",
                "camp_id": None,
            },
            role="admin",
            camp_id=None,
        )
    else:
        camp_id = request.camp_id or "camp-1"
        camp = demo_store.get_camp(camp_id)
        camp_name = camp["name"] if camp else camp_id
        return LoginResponse(
            token=f"demo-token-camp-{camp_id}",
            user={
                "id": f"u-{camp_id}",
                "email": f"coordinator@{camp_id}.org",
                "name": request.name or f"Coordinator ({camp_name})",
                "role": "camp",
                "camp_id": camp_id,
            },
            role="camp",
            camp_id=camp_id,
        )
