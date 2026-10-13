import pytest
from unittest.mock import patch, AsyncMock, MagicMock
from backend.app.services.trigger import TriggerService


@pytest.mark.asyncio
async def test_trigger_service_is_configured():
    service = TriggerService()
    assert service.is_configured is True
    assert service.api_url == "https://api.trigger.dev"


@pytest.mark.asyncio
async def test_dispatch_whatsapp_calls_task():
    service = TriggerService()
    mock_response = MagicMock()
    mock_response.json.return_value = {"id": "run_test_123", "status": "PENDING"}
    mock_response.raise_for_status = MagicMock()

    with patch("httpx.AsyncClient.post", new_callable=AsyncMock) as mock_post:
        mock_post.return_value = mock_response

        res = await service.dispatch_whatsapp(
            to="+27821234567",
            template_name="test_template",
            variables={"name": "John Doe"},
        )

        assert res["id"] == "run_test_123"
        mock_post.assert_called_once()
        call_kwargs = mock_post.call_args.kwargs
        assert call_kwargs["json"]["payload"]["to"] == "+27821234567"
        assert call_kwargs["json"]["payload"]["templateName"] == "test_template"
