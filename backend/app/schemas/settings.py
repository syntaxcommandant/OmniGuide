from typing import List, Optional, Dict
from pydantic import BaseModel


class ProviderHealthResponse(BaseModel):
    provider_name: str
    display_name: str
    state: str  # "NOT_CONFIGURED" | "CONFIGURED_NOT_TESTED" | "OPERATIONAL" | "CONNECTION_FAILED" | "RATE_LIMITED" | "PROVIDER_ERROR"
    model_name: str
    is_configured: bool
    is_operational: bool
    last_tested_at: Optional[str] = None
    latency_ms: Optional[float] = None
    safe_message: str
    is_active: bool


class SystemStatusResponse(BaseModel):
    status: str
    version: str
    database_connected: bool
    database_dialect: str
    ai_provider: str
    gemini_configured: bool
    groq_configured: bool
    guidelines_count: int
    clauses_count: int
    approved_facts_count: int
    reviews_count: int
    providers: Optional[Dict[str, ProviderHealthResponse]] = None


class CustomRule(BaseModel):
    id: str
    type: str  # "banned_term" | "regex" | "superlative"
    pattern: str
    replacement: Optional[str] = None
    explanation: str
    severity: str = "High"


class HealthCheckResponse(BaseModel):
    status: str = "healthy"
    app: str = "OmniGuide"
    environment: str = "production"
