from typing import List, Optional
from pydantic import BaseModel


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
