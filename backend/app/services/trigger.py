import logging
from typing import Any, Dict, Optional
import httpx

from app.config import settings

logger = logging.getLogger("mechanicmate.trigger")


class TriggerService:
    """
    Tier 3 Trigger.dev Orchestration Client for FastAPI.
    Enqueues durable background jobs (WhatsApp dispatch, nightly retention, retries)
    to the Trigger.dev engine via its v3 HTTP API.
    """

    def __init__(self):
        self.api_url = settings.TRIGGER_API_URL.rstrip("/")
        self.secret_key = settings.TRIGGER_SECRET_KEY

    @property
    def is_configured(self) -> bool:
        return bool(self.secret_key and not self.secret_key.startswith("tr_dev_your_secret"))

    async def trigger_task(
        self,
        task_id: str,
        payload: Dict[str, Any],
        options: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        """
        Dispatches a task run to Trigger.dev v3.
        Returns the run metadata handle dict containing run id, status, etc.
        """
        if not self.is_configured:
            logger.warning(
                f"[TriggerService] Cannot trigger '{task_id}': TRIGGER_SECRET_KEY is not configured."
            )
            return {
                "id": "mock_unconfigured_run",
                "status": "skipped",
                "reason": "TRIGGER_SECRET_KEY is not configured",
            }

        endpoint = f"{self.api_url}/api/v1/tasks/{task_id}/trigger"
        headers = {
            "Authorization": f"Bearer {self.secret_key}",
            "Content-Type": "application/json",
        }
        body = {
            "payload": payload,
            "options": options or {},
        }

        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.post(endpoint, json=body, headers=headers)
                response.raise_for_status()
                data = response.json()
                logger.info(
                    f"[TriggerService] Dispatched task '{task_id}', run id: {data.get('id')}"
                )
                return data
        except httpx.HTTPStatusError as exc:
            logger.error(
                f"[TriggerService] HTTP error triggering task '{task_id}': {exc.response.status_code} - {exc.response.text}"
            )
            raise
        except Exception as exc:
            logger.error(f"[TriggerService] Unexpected error triggering task '{task_id}': {exc}")
            raise

    async def dispatch_whatsapp(
        self,
        to: str,
        template_name: str,
        variables: Optional[Dict[str, str]] = None,
    ) -> Dict[str, Any]:
        """
        Enqueues 'dispatch-whatsapp-message' task in Trigger.dev.
        """
        payload = {
            "to": to,
            "templateName": template_name,
            "variables": variables or {},
        }
        return await self.trigger_task("dispatch-whatsapp-message", payload)

    async def trigger_hello_world(self, message: str = "Hello from FastAPI") -> Dict[str, Any]:
        """
        Enqueues 'hello-world' starter task in Trigger.dev.
        """
        return await self.trigger_task("hello-world", {"message": message})


trigger_service = TriggerService()
