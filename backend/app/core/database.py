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

from urllib.parse import urlsplit, urlunsplit, parse_qsl, urlencode

# asyncpg does not accept libpq query parameters like ?sslmode=, ?channel_binding=, ?target_session_attrs=
# which causes "TypeError: connect() got an unexpected keyword argument 'channel_binding'".
# Strip all libpq-specific parameters before initializing asyncpg dialect.
parsed = urlsplit(_db_url)
DISALLOWED_ASYNCPG_QUERY_PARAMS = {
    "sslmode",
    "channel_binding",
    "target_session_attrs",
    "gssencmode",
    "endpoint",
    "options",
}
query_params = parse_qsl(parsed.query)
filtered_params = [
    (k, v) for k, v in query_params if k.lower() not in DISALLOWED_ASYNCPG_QUERY_PARAMS
]
new_query = urlencode(filtered_params)
_db_url = urlunsplit((parsed.scheme, parsed.netloc, parsed.path, new_query, parsed.fragment))

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
