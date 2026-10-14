from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.auth import verify_clerk_token, AuthenticatedUser

import uuid
from sqlalchemy import select

from app.models.workshop import Workshop

async def get_current_user_with_workshop(
    db: AsyncSession = Depends(get_db),
    current_user: AuthenticatedUser = Depends(verify_clerk_token),
) -> AuthenticatedUser:
    try:
        workshop_uuid = uuid.UUID(current_user.workshop_id)
        existing = await db.scalar(select(Workshop.id).where(Workshop.id == workshop_uuid))
        if not existing:
            ws = Workshop(
                id=workshop_uuid,
                name="MechanicMate Workshop",
                currency="ZAR",
                labour_rate_hourly=480.00,
                tax_rate_percent=15.00,
            )
            db.add(ws)
            await db.commit()
    except Exception:
        pass
    return current_user

# Common FastAPI dependencies
DatabaseDep = Depends(get_db)
CurrentUserDep = Depends(get_current_user_with_workshop)

