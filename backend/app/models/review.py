import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Text, Integer, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.core.database import Base


def generate_uuid() -> str:
    return str(uuid.uuid4())


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


class Review(Base):
    __tablename__ = "reviews"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    title = Column(String(255), nullable=False)
    content_type = Column(String(100), nullable=False, default="Marketing Copy")
    original_content = Column(Text, nullable=False)
    revised_content = Column(Text, nullable=False)
    analysis_mode = Column(String(50), nullable=False, default="hybrid")
    overall_status = Column(String(50), nullable=False, default="needs_review")
    # "compliant", "needs_review", "resolved", "flagged"
    created_at = Column(DateTime, default=utc_now, nullable=False)
    updated_at = Column(DateTime, default=utc_now, onupdate=utc_now, nullable=False)

    findings = relationship(
        "Finding",
        back_populates="review",
        cascade="all, delete-orphan",
        order_by="Finding.severity"
    )

    actions = relationship(
        "ReviewAction",
        back_populates="review",
        cascade="all, delete-orphan",
        order_by="ReviewAction.created_at.desc()"
    )


class Finding(Base):
    __tablename__ = "findings"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    review_id = Column(String(36), ForeignKey("reviews.id", ondelete="CASCADE"), nullable=False)
    category = Column(String(100), nullable=False)
    # Categories: "unsupported_superlative", "banned_term", "required_terminology",
    # "unverified_claim", "tone_and_voice", "brand_consistency", "missing_approved_source"
    severity = Column(String(20), nullable=False)  # "High", "Medium", "Low"
    original_excerpt = Column(Text, nullable=False)
    explanation = Column(Text, nullable=False)

    # Citation details
    guideline_clause_id = Column(String(36), nullable=True)
    guideline_clause_identifier = Column(String(100), nullable=True)
    guideline_clause_text = Column(Text, nullable=True)
    guideline_document_name = Column(String(255), nullable=True)
    guideline_page_number = Column(Integer, nullable=True)

    evidence_status = Column(String(50), nullable=False, default="verified")
    # "verified", "insufficient_evidence", "missing_approved_source", "deterministic_rule"

    evidence_tier = Column(String(50), nullable=False, default="VERIFIED")
    # "VERIFIED", "UNSUPPORTED", "CONTRADICTED", "NEEDS_HUMAN_REVIEW"
    evidence_provenance = Column(Text, nullable=True)  # JSON-encoded provenance dictionary

    suggested_fix = Column(Text, nullable=False)
    decision_status = Column(String(50), nullable=False, default="pending")
    # "pending", "accepted", "edited", "dismissed"
    user_custom_fix = Column(Text, nullable=True)

    review = relationship("Review", back_populates="findings")


class ReviewAction(Base):
    __tablename__ = "review_actions"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    review_id = Column(String(36), ForeignKey("reviews.id", ondelete="CASCADE"), nullable=False)
    finding_id = Column(String(36), nullable=True)
    action_type = Column(String(50), nullable=False)  # "accept", "edit", "dismiss", "update_content", "create_review"
    previous_value = Column(Text, nullable=True)
    new_value = Column(Text, nullable=True)
    created_at = Column(DateTime, default=utc_now, nullable=False)

    review = relationship("Review", back_populates="actions")
