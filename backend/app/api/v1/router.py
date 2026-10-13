from fastapi import APIRouter
from backend.app.api.v1 import intake, jobs, customers, vehicles, inspections, invoices, trigger

api_router = APIRouter()

api_router.include_router(intake.router)
api_router.include_router(jobs.router)
api_router.include_router(customers.router)
api_router.include_router(vehicles.router)
api_router.include_router(inspections.router)
api_router.include_router(invoices.router)
api_router.include_router(trigger.router)

@api_router.get("/health", tags=["Health"])
async def health_check():
    return {
        "status": "healthy",
        "service": "MechanicMate Core FastAPI Backend",
        "version": "1.0.0",
        "tier": "Tier 2 (Core Business Logic & Telemetry)"
    }
