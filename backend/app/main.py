import sys
from pathlib import Path

# Ensure backend directory is in sys.path so 'app' imports work from both root and backend/
_backend_dir = Path(__file__).resolve().parent.parent
if str(_backend_dir) not in sys.path:
    sys.path.insert(0, str(_backend_dir))

_project_root = _backend_dir.parent
if str(_project_root) not in sys.path:
    sys.path.insert(0, str(_project_root))

# Backwards compatibility alias for 'backend.app'
import types
if "backend" not in sys.modules:
    _b = types.ModuleType("backend")
    sys.modules["backend"] = _b


from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.config import settings
from app.api.v1.router import api_router
from app.core.websockets import ws_manager

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup actions
    print(f"[STARTUP] {settings.PROJECT_NAME} starting up in {settings.ENVIRONMENT} mode...")
    try:
        from app.models import Base
        from app.core.database import engine, AsyncSessionLocal
        from sqlalchemy import text

        # 1. Ensure all 15 tables are initialized in Neon PostgreSQL
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
        print("[STARTUP] Database schema verified/initialized successfully.")

        # 2. Ensure default root workshop and dev user exist (essential for multi-tenant foreign keys)
        async with AsyncSessionLocal() as db:
            await db.execute(text("""
                INSERT INTO workshops (id, name, phone, email, address, labour_rate_hourly, tax_rate_percent, currency)
                VALUES ('00000000-0000-0000-0000-000000000001', 'MechanicMate Dev Workshop', '+27 11 555 0199', 'dev@mechanicmate.co.za', '123 Workshop Road', 480.00, 15.00, 'ZAR')
                ON CONFLICT (id) DO NOTHING;
            """))
            await db.execute(text("""
                INSERT INTO users (id, workshop_id, name, email, role)
                VALUES ('user_dev_001', '00000000-0000-0000-0000-000000000001', 'Development Mechanic', 'mechanic@workshop.co.za', 'owner')
                ON CONFLICT (id) DO NOTHING;
            """))
            await db.commit()
            print("[STARTUP] Default root workshop verified/seeded.")
    except Exception as e:
        print(f"[STARTUP WARNING] Database initialization/seeding note: {e}")
    yield
    # Shutdown actions
    print(f"[SHUTDOWN] {settings.PROJECT_NAME} shutting down...")

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="MechanicMate Tier 2 Core Business Logic, Telemetry & Real-Time Engine",
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS configuration allowing Next.js 16 frontend (both production and preview deployments)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_origin_regex=r"^https:\/\/.*\.vercel\.app$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount REST API v1
app.include_router(api_router, prefix=settings.API_V1_STR)

# Root endpoint
@app.get("/")
async def root():
    return {
        "app": settings.PROJECT_NAME,
        "docs": "/docs",
        "health": f"{settings.API_V1_STR}/health"
    }

# Native WebSockets: Workshop Board Synchronization
@app.websocket("/ws/workshop/{workshop_id}")
async def ws_workshop_endpoint(websocket: WebSocket, workshop_id: str):
    await ws_manager.connect_workshop(websocket, workshop_id)
    try:
        while True:
            data = await websocket.receive_text()
            # Echo or process client events
    except WebSocketDisconnect:
        ws_manager.disconnect_workshop(websocket, workshop_id)

# Native WebSockets: Wireless OBD-II live telemetry streaming
@app.websocket("/ws/obd/{vehicle_id}")
async def ws_obd_endpoint(websocket: WebSocket, vehicle_id: str):
    await ws_manager.connect_obd(websocket, vehicle_id)
    try:
        while True:
            # Client sends live PIDs (RPM, Coolant Temp, Voltage)
            pid_payload = await websocket.receive_json()
            # Broadcast live PIDs to all connected garage displays
            await ws_manager.broadcast_obd(vehicle_id, pid_payload)
    except WebSocketDisconnect:
        ws_manager.disconnect_obd(websocket, vehicle_id)
