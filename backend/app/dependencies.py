from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession

from backend.app.core.database import get_db
from backend.app.core.auth import verify_clerk_token, AuthenticatedUser

# Common FastAPI dependencies
DatabaseDep = Depends(get_db)
CurrentUserDep = Depends(verify_clerk_token)
