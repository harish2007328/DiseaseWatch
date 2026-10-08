"""Authentication routes — Demo mode only."""
from fastapi import APIRouter, HTTPException
from app.models.schemas import LoginRequest, LoginResponse
from app.services.demo_data import demo_store, USER_IDS, CAMP_IDS

router = APIRouter(prefix="/api/auth", tags=["Authentication"])

# Demo credentials
DEMO_USERS = {
    "admin@diseasewatch.demo": {
        "password": "admin123",
        "role": "admin",
        "user_id": USER_IDS["admin"],
        "name": "District Health Officer",
        "camp_id": None,
    },
    "camp@diseasewatch.demo": {
        "password": "camp123",
        "role": "camp",
        "user_id": USER_IDS["camp"],
        "name": "Camp 07 Field Officer",
        "camp_id": CAMP_IDS[6],
    },
}


@router.post("/demo-login", response_model=LoginResponse)
async def demo_login(request: LoginRequest):
    """
    Demo authentication endpoint.
    Validates against hardcoded demo credentials.
    """
    user = DEMO_USERS.get(request.email)
    if not user or user["password"] != request.password:
        raise HTTPException(status_code=401, detail="Invalid demo credentials")

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
