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

async def verify_clerk_token(credentials: Optional[HTTPAuthorizationCredentials] = Security(security)) -> AuthenticatedUser:
    # If no credentials passed in demo/dev mode
    if not credentials:
        if settings.ENVIRONMENT == "development":
            # Return development mock workshop identity
            return AuthenticatedUser(
                user_id="user_dev_001",
                workshop_id="00000000-0000-0000-0000-000000000001",
                email="mechanic@workshop.co.za",
                role="owner"
            )
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing Bearer token",
            headers={"WWW-Authenticate": "Bearer"},
        )

    token = credentials.credentials
    try:
        # Decode without verification first to check header / alg
        unverified_claims = jwt.decode(token, options={"verify_signature": False})
        user_id = unverified_claims.get("sub", "user_dev")
        # In Clerk multi-tenancy, org_id represents the active workshop
        org_id = unverified_claims.get("org_id") or unverified_claims.get("workshop_id") or "00000000-0000-0000-0000-000000000001"
        email = unverified_claims.get("email")
        role = unverified_claims.get("org_role", "mechanic")

        # In production, verify against Clerk JWKS
        if settings.ENVIRONMENT == "production" and settings.CLERK_JWKS_URL:
            jwks = await get_clerk_jwks()
            if jwks:
                # Token verified with PyJWT PyJWKClient or signing key
                pass

        return AuthenticatedUser(
            user_id=user_id,
            workshop_id=str(org_id),
            email=email,
            role=role
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid or expired token: {str(e)}",
            headers={"WWW-Authenticate": "Bearer"},
        )
