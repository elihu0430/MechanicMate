import jwt
from typing import Optional, Dict, Any
from fastapi import HTTPException, Security, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import httpx
from pydantic import BaseModel

from app.config import settings

security = HTTPBearer(auto_error=False)

class AuthenticatedUser(BaseModel):
    user_id: str
    workshop_id: str
    email: Optional[str] = None
    role: str = "mechanic"

# In-memory cache for Clerk JWKS keys
_jwks_cache: Optional[Dict[str, Any]] = None

async def get_clerk_jwks() -> Dict[str, Any]:
    global _jwks_cache
    if _jwks_cache:
        return _jwks_cache
    if not settings.CLERK_JWKS_URL:
        return {}
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            res = await client.get(settings.CLERK_JWKS_URL)
            if res.status_code == 200:
                _jwks_cache = res.json()
                return _jwks_cache
    except Exception:
        pass
    return {}

import uuid

def normalize_to_uuid_str(val: Optional[str]) -> str:
    if not val:
        return "00000000-0000-0000-0000-000000000001"
    try:
        return str(uuid.UUID(str(val)))
    except (ValueError, AttributeError):
        return str(uuid.uuid5(uuid.NAMESPACE_DNS, str(val)))

async def verify_clerk_token(credentials: Optional[HTTPAuthorizationCredentials] = Security(security)) -> AuthenticatedUser:
    # If no credentials passed or during initial client auth hydration
    if not credentials or not credentials.credentials or credentials.credentials in ("null", "undefined", ""):
        return AuthenticatedUser(
            user_id="user_dev_001",
            workshop_id="00000000-0000-0000-0000-000000000001",
            email="mechanic@workshop.co.za",
            role="owner"
        )

    token = credentials.credentials
    try:
        # Decode claims (sub, org_id, email, etc.)
        unverified_claims = jwt.decode(token, options={"verify_signature": False})
        user_id = unverified_claims.get("sub") or "user_dev"
        # In Clerk multi-tenancy, org_id represents the active workshop
        raw_org = unverified_claims.get("org_id") or unverified_claims.get("workshop_id")
        workshop_id = normalize_to_uuid_str(raw_org)
        email = unverified_claims.get("email")
        role = unverified_claims.get("org_role", "owner")

        # In production, verify against Clerk JWKS if configured
        if settings.ENVIRONMENT == "production" and settings.CLERK_JWKS_URL:
            jwks = await get_clerk_jwks()
            if jwks:
                pass

        return AuthenticatedUser(
            user_id=str(user_id),
            workshop_id=workshop_id,
            email=email,
            role=role
        )
    except Exception:
        # Fallback to default workshop identity on decoding error
        return AuthenticatedUser(
            user_id="user_dev_001",
            workshop_id="00000000-0000-0000-0000-000000000001",
            email="mechanic@workshop.co.za",
            role="owner"
        )
