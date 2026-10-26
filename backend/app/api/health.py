from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.core.config import settings
from app.core.database import get_db
from app.models.guideline import GuidelineDocument, GuidelineClause, ApprovedFact
from app.models.review import Review
from app.schemas.settings import HealthCheckResponse, SystemStatusResponse
from app.services.gemini_service import gemini_service

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

    guidelines_count = db.query(GuidelineDocument).count() if db_connected else 0
    clauses_count = db.query(GuidelineClause).count() if db_connected else 0
    approved_facts_count = db.query(ApprovedFact).count() if db_connected else 0
    reviews_count = db.query(Review).count() if db_connected else 0

    return SystemStatusResponse(
        status="operational" if db_connected else "degraded",
        version=settings.VERSION,
        database_connected=db_connected,
        database_dialect=dialect,
        ai_provider=settings.AI_PROVIDER,
        gemini_configured=gemini_service.is_configured(),
        groq_configured=bool(settings.GROQ_API_KEY),
        guidelines_count=guidelines_count,
        clauses_count=clauses_count,
        approved_facts_count=approved_facts_count,
        reviews_count=reviews_count
    )
