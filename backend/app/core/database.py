import logging
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker
from app.core.config import settings

logger = logging.getLogger(__name__)

engine_kwargs = {}
if settings.DATABASE_URL.startswith("sqlite"):
    engine_kwargs["connect_args"] = {"check_same_thread": False}
else:
    # PostgreSQL connection pooling optimizations
    engine_kwargs["pool_pre_ping"] = True
    engine_kwargs["pool_recycle"] = 300

engine = create_engine(settings.DATABASE_URL, **engine_kwargs)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db():
    """Initializes all database tables and ensures non-breaking schema additions."""
    import app.models.guideline  # noqa: F401
    import app.models.review  # noqa: F401
    import app.models.campaign  # noqa: F401
    Base.metadata.create_all(bind=engine)

    # Safe migration for new evidence provenance columns on findings
    try:
        from sqlalchemy import text
        with engine.begin() as conn:
            cursor = conn.execute(text("PRAGMA table_info(findings)"))
            cols = [row[1] for row in cursor.fetchall()]
            if cols:
                if "evidence_tier" not in cols:
                    conn.execute(text("ALTER TABLE findings ADD COLUMN evidence_tier VARCHAR(50) DEFAULT 'VERIFIED'"))
                if "evidence_provenance" not in cols:
                    conn.execute(text("ALTER TABLE findings ADD COLUMN evidence_provenance TEXT DEFAULT NULL"))
    except Exception as e:
        logger.debug(f"Migration note: {e}")

    logger.info("Database tables initialized successfully.")
