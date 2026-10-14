from typing import AsyncGenerator
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from app.config import settings

# Normalize database URL scheme for asyncpg and handle Neon SSL
_raw_url = settings.DATABASE_URL
if _raw_url.startswith("postgres://"):
    _db_url = _raw_url.replace("postgres://", "postgresql+asyncpg://", 1)
elif _raw_url.startswith("postgresql://") and not _raw_url.startswith("postgresql+asyncpg://"):
    _db_url = _raw_url.replace("postgresql://", "postgresql+asyncpg://", 1)
else:
    _db_url = _raw_url

# asyncpg does not accept ?sslmode= in the connection string; it uses connect_args['ssl']
if "?" in _db_url:
    _base, _query = _db_url.split("?", 1)
    _params = [p for p in _query.split("&") if not p.lower().startswith("sslmode=")]
    _db_url = _base + ("?" + "&".join(_params) if _params else "")

connect_args = {}
if "neon.tech" in _raw_url or "ssl" in _raw_url.lower():
    connect_args["ssl"] = "require"

engine = create_async_engine(
    _db_url,
    echo=(settings.ENVIRONMENT == "development"),
    future=True,
    pool_pre_ping=True,
    pool_size=10,
    max_overflow=20,
    connect_args=connect_args
)

AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autoflush=False
)

async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
