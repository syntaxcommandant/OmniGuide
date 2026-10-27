import pytest
from unittest.mock import patch, MagicMock
from app.services.provider_health import provider_health_service


def test_system_status_includes_provider_diagnostics(client):
    response = client.get("/api/status")
    assert response.status_code == 200
    data = response.json()
    assert "providers" in data
    providers = data["providers"]
    assert "gemini" in providers
    assert "groq" in providers

    gemini = providers["gemini"]
    assert gemini["provider_name"] == "gemini"
    assert "state" in gemini
    assert gemini["state"] in [
        "NOT_CONFIGURED",
        "CONFIGURED_NOT_TESTED",
        "OPERATIONAL",
        "CONNECTION_FAILED",
        "RATE_LIMITED",
        "PROVIDER_ERROR"
    ]
    # Invariant: No secret keys leaked
    assert "api_key" not in gemini
    assert "key" not in gemini


def test_providers_health_endpoint(client):
    response = client.get("/api/providers/health")
    assert response.status_code == 200
    data = response.json()
    assert "gemini" in data
    assert "groq" in data
    assert data["gemini"]["display_name"] == "Google Gemini Flash"
    assert data["groq"]["display_name"] == "Groq Cloud Llama"


def test_test_provider_connection_unconfigured(client):
    # Test unconfigured Gemini
    with patch("app.core.config.settings.GEMINI_API_KEY", ""):
        provider_health_service._init_initial_statuses()
        response = client.post("/api/providers/test/gemini")
        assert response.status_code == 200
        res = response.json()
        assert res["provider_name"] == "gemini"
        assert res["state"] == "NOT_CONFIGURED"
        assert res["is_operational"] is False
        assert "not set" in res["safe_message"].lower() or "not configured" in res["safe_message"].lower()

    # Test unconfigured Groq
    with patch("app.core.config.settings.GROQ_API_KEY", ""):
        provider_health_service._init_initial_statuses()
        response = client.post("/api/providers/test/groq")
        assert response.status_code == 200
        res = response.json()
        assert res["provider_name"] == "groq"
        assert res["state"] == "NOT_CONFIGURED"
        assert res["is_operational"] is False


def test_test_provider_connection_invalid_provider(client):
    response = client.post("/api/providers/test/unsupported_ai")
    assert response.status_code == 400
    assert "Unsupported provider" in response.json()["detail"]


def test_test_provider_gemini_operational_mock(client):
    with patch("app.core.config.settings.GEMINI_API_KEY", "mock-gemini-key-12345"):
        with patch("google.genai.Client") as mock_client_cls:
            mock_client = MagicMock()
            mock_client.models.get.return_value = MagicMock(name="gemini-2.5-flash")
            mock_client_cls.return_value = mock_client

            response = client.post("/api/providers/test/gemini")
            assert response.status_code == 200
            res = response.json()
            assert res["state"] == "OPERATIONAL"
            assert res["is_operational"] is True
            assert res["latency_ms"] is not None
            assert "mock-gemini-key" not in res["safe_message"]


def test_test_provider_gemini_rate_limited_mock(client):
    with patch("app.core.config.settings.GEMINI_API_KEY", "mock-gemini-key-12345"):
        with patch("google.genai.Client") as mock_client_cls:
            mock_client = MagicMock()
            mock_client.models.get.side_effect = Exception("429 ResourceExhausted: Quota exceeded")
            mock_client_cls.return_value = mock_client

            response = client.post("/api/providers/test/gemini")
            assert response.status_code == 200
            res = response.json()
            assert res["state"] == "RATE_LIMITED"
            assert res["is_operational"] is False
            assert "rate limit" in res["safe_message"].lower()


def test_test_provider_groq_operational_mock(client):
    with patch("app.core.config.settings.GROQ_API_KEY", "gsk_mock_key_test_12345"):
        with patch("httpx.Client.get") as mock_get:
            mock_resp = MagicMock()
            mock_resp.status_code = 200
            mock_get.return_value = mock_resp

            response = client.post("/api/providers/test/groq")
            assert response.status_code == 200
            res = response.json()
            assert res["state"] == "OPERATIONAL"
            assert res["is_operational"] is True
            assert res["latency_ms"] is not None
            assert "gsk_mock_key" not in res["safe_message"]
