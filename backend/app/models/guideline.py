import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Text, Integer, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.core.database import Base


def generate_uuid() -> str:
    return str(uuid.uuid4())


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


class GuidelineDocument(Base):
    __tablename__ = "guideline_documents"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    title = Column(String(255), nullable=False)
    filename = Column(String(255), nullable=False)
    extracted_text = Column(Text, nullable=False)
    is_demo = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime, default=utc_now, nullable=False)

    clauses = relationship(
        "GuidelineClause",
        back_populates="document",
        cascade="all, delete-orphan",
        order_by="GuidelineClause.page_number, GuidelineClause.clause_identifier"
    )


class GuidelineClause(Base):
    __tablename__ = "guideline_clauses"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    document_id = Column(String(36), ForeignKey("guideline_documents.id", ondelete="CASCADE"), nullable=False)
    clause_identifier = Column(String(100), nullable=False, index=True)
    clause_text = Column(Text, nullable=False)
    section_heading = Column(String(255), nullable=True)
    page_number = Column(Integer, nullable=True)

    document = relationship("GuidelineDocument", back_populates="clauses")


class ApprovedFact(Base):
    __tablename__ = "approved_facts"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    fact_text = Column(Text, nullable=False)
    category = Column(String(100), nullable=True)  # e.g., "metric", "certification", "product_feature"
    source_reference = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=utc_now, nullable=False)
