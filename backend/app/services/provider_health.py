import time
import logging
from datetime import datetime, timezone
from typing import Dict, Optional, Literal
from pydantic import BaseModel
import httpx
from app.core.config import settings

logger = logging.getLogger(__name__)

ProviderState = Literal[
    "NOT_CONFIGURED",
    "CONFIGURED_NOT_TESTED",
    "OPERATIONAL",
    "CONNECTION_FAILED",
    "RATE_LIMITED",
    "PROVIDER_ERROR"
]


class ProviderHealthStatus(BaseModel):
    provider_name: str
    display_name: str
    state: ProviderState
    model_name: str
    is_configured: bool
    is_operational: bool
    last_tested_at: Optional[str] = None
    latency_ms: Optional[float] = None
    safe_message: str
    is_active: bool


class ProviderHealthService:
    def __init__(self):
        # In-memory status cache: provider_name -> ProviderHealthStatus
        self._statuses: Dict[str, ProviderHealthStatus] = {}
        self._init_initial_statuses()

    def _init_initial_statuses(self):
        # Gemini initial evaluation
        gemini_has_key = bool(settings.GEMINI_API_KEY and settings.GEMINI_API_KEY.strip() and settings.GEMINI_API_KEY != "YOUR_GEMINI_API_KEY_HERE")
        gemini_state: ProviderState = "CONFIGURED_NOT_TESTED" if gemini_has_key else "NOT_CONFIGURED"
        self._statuses["gemini"] = ProviderHealthStatus(
            provider_name="gemini",
            display_name="Google Gemini Flash",
            state=gemini_state,
            model_name=settings.GEMINI_MODEL,
            is_configured=gemini_has_key,
            is_operational=False,
            last_tested_at=None,
            latency_ms=None,
            safe_message="API key detected in backend environment; connection not yet tested." if gemini_has_key else "GEMINI_API_KEY is not configured in environment.",
            is_active=(settings.AI_PROVIDER == "gemini")
        )

        # Groq initial evaluation
        groq_has_key = bool(settings.GROQ_API_KEY and settings.GROQ_API_KEY.strip() and settings.GROQ_API_KEY != "YOUR_GROQ_API_KEY_HERE")
        groq_state: ProviderState = "CONFIGURED_NOT_TESTED" if groq_has_key else "NOT_CONFIGURED"
        self._statuses["groq"] = ProviderHealthStatus(
            provider_name="groq",
            display_name="Groq Cloud Llama",
            state=groq_state,
            model_name=settings.GROQ_MODEL,
            is_configured=groq_has_key,
            is_operational=False,
            last_tested_at=None,
            latency_ms=None,
            safe_message="API key detected in backend environment; connection not yet tested." if groq_has_key else "GROQ_API_KEY is not configured in environment.",
            is_active=(settings.AI_PROVIDER == "groq")
        )

    def get_status(self, provider_name: str) -> ProviderHealthStatus:
        norm = provider_name.lower().strip()
        if norm not in self._statuses:
            self._init_initial_statuses()
        status = self._statuses.get(norm)
        if not status:
            return ProviderHealthStatus(
                provider_name=norm,
                display_name=norm.capitalize(),
                state="NOT_CONFIGURED",
                model_name="unknown",
                is_configured=False,
                is_operational=False,
                safe_message=f"Provider '{norm}' is not registered.",
                is_active=False
            )
        # Update is_active in case settings changed
        status.is_active = (settings.AI_PROVIDER == norm)
        return status

    def get_all_statuses(self) -> Dict[str, ProviderHealthStatus]:
        self.get_status("gemini")
        self.get_status("groq")
        return self._statuses

    def test_provider(self, provider_name: str) -> ProviderHealthStatus:
        """
        Executes a real external connectivity check against the requested provider.
        Safe against timeouts, rate limits, invalid keys, and network breaks.
        Never reveals API keys, stack traces, or credentials in outputs.
        """
        norm = provider_name.lower().strip()
        now_iso = datetime.now(timezone.utc).isoformat()

        if norm == "gemini":
            return self._test_gemini(now_iso)
        elif norm == "groq":
            return self._test_groq(now_iso)
        else:
            return ProviderHealthStatus(
                provider_name=norm,
                display_name=norm.capitalize(),
                state="PROVIDER_ERROR",
                model_name="unknown",
                is_configured=False,
                is_operational=False,
                last_tested_at=now_iso,
                safe_message=f"Unknown provider '{norm}'. Supported: gemini, groq.",
                is_active=False
            )

    def _test_gemini(self, now_iso: str) -> ProviderHealthStatus:
        key = settings.GEMINI_API_KEY.strip() if settings.GEMINI_API_KEY else ""
        if not key or key == "YOUR_GEMINI_API_KEY_HERE":
            status = ProviderHealthStatus(
                provider_name="gemini",
                display_name="Google Gemini Flash",
                state="NOT_CONFIGURED",
                model_name=settings.GEMINI_MODEL,
                is_configured=False,
                is_operational=False,
                last_tested_at=now_iso,
                latency_ms=None,
                safe_message="GEMINI_API_KEY is not set. Deterministic governance fallback active.",
                is_active=(settings.AI_PROVIDER == "gemini")
            )
            self._statuses["gemini"] = status
            return status

        t0 = time.perf_counter()
        try:
            from google import genai
            client = genai.Client(api_key=key)
            # Lightweight verification without generating tokens
            client.models.get(model=settings.GEMINI_MODEL)
            latency = round((time.perf_counter() - t0) * 1000, 1)

            status = ProviderHealthStatus(
                provider_name="gemini",
                display_name="Google Gemini Flash",
                state="OPERATIONAL",
                model_name=settings.GEMINI_MODEL,
                is_configured=True,
                is_operational=True,
                last_tested_at=now_iso,
                latency_ms=latency,
                safe_message=f"Connected to model {settings.GEMINI_MODEL} successfully ({latency}ms).",
                is_active=(settings.AI_PROVIDER == "gemini")
            )
            self._statuses["gemini"] = status
            return status

        except Exception as exc:
            latency = round((time.perf_counter() - t0) * 1000, 1)
            err_str = str(exc).lower()

            if "429" in err_str or "resource_exhausted" in err_str or "quota" in err_str:
                state: ProviderState = "RATE_LIMITED"
                safe_msg = "Google Gemini rate limit reached or quota exhausted. Deterministic fallback active."
            elif "400" in err_str or "401" in err_str or "403" in err_str or "invalid_argument" in err_str or "api_key" in err_str:
                state = "CONNECTION_FAILED"
                safe_msg = "Authentication failed: Invalid or expired GEMINI_API_KEY."
            elif "timeout" in err_str or "timed out" in err_str or "deadline_exceeded" in err_str:
                state = "CONNECTION_FAILED"
                safe_msg = f"Network timeout connecting to Google Gemini API ({latency}ms)."
            else:
                state = "PROVIDER_ERROR"
                safe_msg = "Gemini service returned an error during handshake."

            logger.warning(f"Gemini connectivity check result: {state} - {safe_msg}")
            status = ProviderHealthStatus(
                provider_name="gemini",
                display_name="Google Gemini Flash",
                state=state,
                model_name=settings.GEMINI_MODEL,
                is_configured=True,
                is_operational=False,
                last_tested_at=now_iso,
                latency_ms=latency,
                safe_message=safe_msg,
                is_active=(settings.AI_PROVIDER == "gemini")
            )
            self._statuses["gemini"] = status
            return status

    def _test_groq(self, now_iso: str) -> ProviderHealthStatus:
        key = settings.GROQ_API_KEY.strip() if settings.GROQ_API_KEY else ""
        if not key or key == "YOUR_GROQ_API_KEY_HERE":
            status = ProviderHealthStatus(
                provider_name="groq",
                display_name="Groq Cloud Llama",
                state="NOT_CONFIGURED",
                model_name=settings.GROQ_MODEL,
                is_configured=False,
                is_operational=False,
                last_tested_at=now_iso,
                latency_ms=None,
                safe_message="GROQ_API_KEY is not set. Deterministic governance fallback active.",
                is_active=(settings.AI_PROVIDER == "groq")
            )
            self._statuses["groq"] = status
            return status

        t0 = time.perf_counter()
        try:
            # Query Groq API model endpoint with strict 5-second timeout
            with httpx.Client(timeout=5.0) as client:
                res = client.get(
                    "https://api.groq.com/openai/v1/models",
                    headers={"Authorization": f"Bearer {key}"}
                )
                latency = round((time.perf_counter() - t0) * 1000, 1)

                if res.status_code == 200:
                    state: ProviderState = "OPERATIONAL"
                    safe_msg = f"Connected to Groq endpoint successfully ({latency}ms). Model: {settings.GROQ_MODEL}."
                    is_op = True
                elif res.status_code == 429:
                    state = "RATE_LIMITED"
                    safe_msg = "Groq API rate limit or quota exceeded. Deterministic fallback active."
                    is_op = False
                elif res.status_code in (401, 403):
                    state = "CONNECTION_FAILED"
                    safe_msg = "Authentication failed: Invalid or expired GROQ_API_KEY."
                    is_op = False
                else:
                    state = "PROVIDER_ERROR"
                    safe_msg = f"Groq endpoint returned HTTP {res.status_code}."
                    is_op = False

                status = ProviderHealthStatus(
                    provider_name="groq",
                    display_name="Groq Cloud Llama",
                    state=state,
                    model_name=settings.GROQ_MODEL,
                    is_configured=True,
                    is_operational=is_op,
                    last_tested_at=now_iso,
                    latency_ms=latency,
                    safe_message=safe_msg,
                    is_active=(settings.AI_PROVIDER == "groq")
                )
                self._statuses["groq"] = status
                return status

        except httpx.TimeoutException:
            latency = round((time.perf_counter() - t0) * 1000, 1)
            status = ProviderHealthStatus(
                provider_name="groq",
                display_name="Groq Cloud Llama",
                state="CONNECTION_FAILED",
                model_name=settings.GROQ_MODEL,
                is_configured=True,
                is_operational=False,
                last_tested_at=now_iso,
                latency_ms=latency,
                safe_message=f"Network timeout connecting to Groq endpoint ({latency}ms).",
                is_active=(settings.AI_PROVIDER == "groq")
            )
            self._statuses["groq"] = status
            return status

        except Exception as exc:
            latency = round((time.perf_counter() - t0) * 1000, 1)
            logger.warning(f"Groq connectivity check failed: {exc}")
            status = ProviderHealthStatus(
                provider_name="groq",
                display_name="Groq Cloud Llama",
                state="PROVIDER_ERROR",
                model_name=settings.GROQ_MODEL,
                is_configured=True,
                is_operational=False,
                last_tested_at=now_iso,
                latency_ms=latency,
                safe_message="Error establishing connection to Groq API.",
                is_active=(settings.AI_PROVIDER == "groq")
            )
            self._statuses["groq"] = status
            return status


provider_health_service = ProviderHealthService()
