from typing import Dict
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.core.config import settings
from app.core.database import get_db
from app.models.guideline import GuidelineDocument, GuidelineClause, ApprovedFact
from app.models.review import Review
from app.schemas.settings import HealthCheckResponse, SystemStatusResponse, ProviderHealthResponse
from app.services.provider_health import provider_health_service

router = APIRouter()


@router.get("/health", response_model=HealthCheckResponse)
def health_check():
    return HealthCheckResponse(
        status="healthy",
        app=settings.PROJECT_NAME,
        environment="production"
    )


@router.get("/status", response_model=SystemStatusResponse)
def get_system_status(db: Session = Depends(get_db)):
    db_connected = False
    dialect = "unknown"
    try:
        db.execute(text("SELECT 1"))
        db_connected = True
        dialect = db.bind.dialect.name if db.bind else "sqlite"
    except Exception:
        db_connected = False

    guidelines_count = 0
    clauses_count = 0
    approved_facts_count = 0
    reviews_count = 0
    if db_connected:
        try:
            guidelines_count = db.query(GuidelineDocument).count()
            clauses_count = db.query(GuidelineClause).count()
            approved_facts_count = db.query(ApprovedFact).count()
            reviews_count = db.query(Review).count()
        except Exception:
            pass

    providers_dict = provider_health_service.get_all_statuses()
    gemini_status = providers_dict.get("gemini")
    groq_status = providers_dict.get("groq")

    return SystemStatusResponse(
        status="operational" if db_connected else "degraded",
        version=settings.VERSION,
        database_connected=db_connected,
        database_dialect=dialect,
        ai_provider=settings.AI_PROVIDER,
        gemini_configured=bool(gemini_status and gemini_status.is_operational),
        groq_configured=bool(groq_status and groq_status.is_operational),
        guidelines_count=guidelines_count,
        clauses_count=clauses_count,
        approved_facts_count=approved_facts_count,
        reviews_count=reviews_count,
        providers={
            name: ProviderHealthResponse(**status.model_dump())
            for name, status in providers_dict.items()
        }
    )


@router.get("/providers/health", response_model=Dict[str, ProviderHealthResponse])
def get_providers_health():
    """
    Returns granular health states for all supported AI providers
    (NOT_CONFIGURED, CONFIGURED_NOT_TESTED, OPERATIONAL, CONNECTION_FAILED, RATE_LIMITED, PROVIDER_ERROR).
    """
    statuses = provider_health_service.get_all_statuses()
    return {
        name: ProviderHealthResponse(**status.model_dump())
        for name, status in statuses.items()
    }


@router.post("/providers/test/{provider_name}", response_model=ProviderHealthResponse)
def test_provider_connection(provider_name: str):
    """
    Executes an on-demand real connectivity test against the specified provider ('gemini' or 'groq').
    Returns verified status with latency, model access, and safe diagnostic summary.
    """
    norm = provider_name.lower().strip()
    if norm not in ("gemini", "groq"):
        raise HTTPException(status_code=400, detail=f"Unsupported provider '{provider_name}'. Supported: gemini, groq.")

    status = provider_health_service.test_provider(norm)
    return ProviderHealthResponse(**status.model_dump())
