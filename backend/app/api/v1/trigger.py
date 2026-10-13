from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, Field
from typing import Dict, Any, Optional

from backend.app.dependencies import CurrentUserDep
from backend.app.core.auth import AuthenticatedUser
from backend.app.services.trigger import trigger_service

router = APIRouter(prefix="/trigger", tags=["Trigger.dev Orchestration"])


class TestTriggerRequest(BaseModel):
    message: Optional[str] = Field("Hello from MechanicMate FastAPI Backend!", description="Message payload for test task")


class WhatsAppDispatchRequest(BaseModel):
    to: str = Field(..., description="E.164 phone number, e.g. +27821234567")
    template_name: str = Field(..., description="WhatsApp Cloud API template identifier")
    variables: Dict[str, str] = Field(default_factory=dict, description="Template variables dictionary")


class TriggerResponse(BaseModel):
    id: str
    status: Optional[str] = None
    task_id: Optional[str] = None
    data: Optional[Dict[str, Any]] = None


@router.get("/status")
async def trigger_status():
    """
    Returns whether Tier 3 Trigger.dev orchestration is configured on the backend.
    """
    return {
        "configured": trigger_service.is_configured,
        "api_url": trigger_service.api_url,
    }


@router.post("/test", status_code=status.HTTP_202_ACCEPTED)
async def trigger_test_job(
    payload: TestTriggerRequest,
    current_user: AuthenticatedUser = CurrentUserDep,
):
    """
    Dispatches a test 'hello-world' job to Trigger.dev.
    """
    try:
        run = await trigger_service.trigger_hello_world(message=payload.message)
        return {
            "success": True,
            "task_id": "hello-world",
            "run": run,
        }
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Failed to dispatch Trigger.dev task: {str(exc)}",
        )


@router.post("/whatsapp", status_code=status.HTTP_202_ACCEPTED)
async def trigger_whatsapp_notification(
    payload: WhatsAppDispatchRequest,
    current_user: AuthenticatedUser = CurrentUserDep,
):
    """
    Enqueues a durable 'dispatch-whatsapp-message' job to Trigger.dev.
    """
    try:
        run = await trigger_service.dispatch_whatsapp(
            to=payload.to,
            template_name=payload.template_name,
            variables=payload.variables,
        )
        return {
            "success": True,
            "task_id": "dispatch-whatsapp-message",
            "run": run,
        }
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Failed to dispatch WhatsApp task to Trigger.dev: {str(exc)}",
        )
