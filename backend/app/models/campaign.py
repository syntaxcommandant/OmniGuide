import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Text, Integer, Float, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship
from app.core.database import Base


def generate_uuid() -> str:
    return str(uuid.uuid4())


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


class CampaignAudit(Base):
    __tablename__ = "campaign_audits"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    name = Column(String(255), nullable=False)
    brand_name = Column(String(255), nullable=False, default="Default Brand")
    target_audience = Column(String(255), nullable=True)
    channels = Column(JSON, nullable=False)  # e.g. ["instagram", "email", "website", "paid_ads"]
    launch_gate_policy = Column(String(50), nullable=False, default="standard")  # "strict", "standard", "permissive"
    status = Column(String(50), nullable=False, default="blocked")  # "blocked", "needs_review", "launch_ready"
    launch_readiness_score = Column(Integer, nullable=False, default=0)  # 0 to 100
    
    blocking_violations_count = Column(Integer, nullable=False, default=0)
    warnings_count = Column(Integer, nullable=False, default=0)
    remediated_count = Column(Integer, nullable=False, default=0)
    
    scoring_breakdown = Column(JSON, nullable=True)  # Detailed score math: deductions, recoveries, channel scores
    cross_channel_issues = Column(JSON, nullable=True)  # Contradictions / tone discrepancies between channels
    
    created_at = Column(DateTime, default=utc_now, nullable=False)
    updated_at = Column(DateTime, default=utc_now, onupdate=utc_now, nullable=False)

    channel_contents = relationship(
        "CampaignChannelContent",
        back_populates="campaign",
        cascade="all, delete-orphan",
        order_by="CampaignChannelContent.channel"
    )

    findings = relationship(
        "CampaignFinding",
        back_populates="campaign",
        cascade="all, delete-orphan",
        order_by="CampaignFinding.severity"
    )


class CampaignChannelContent(Base):
    __tablename__ = "campaign_channel_contents"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    campaign_id = Column(String(36), ForeignKey("campaign_audits.id", ondelete="CASCADE"), nullable=False)
    channel = Column(String(50), nullable=False)  # "instagram", "email", "website", "paid_ads"
    original_content = Column(Text, nullable=False)
    revised_content = Column(Text, nullable=False)
    channel_readiness_score = Column(Integer, nullable=False, default=100)
    channel_status = Column(String(50), nullable=False, default="compliant")

    campaign = relationship("CampaignAudit", back_populates="channel_contents")


class CampaignFinding(Base):
    __tablename__ = "campaign_findings"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    campaign_id = Column(String(36), ForeignKey("campaign_audits.id", ondelete="CASCADE"), nullable=False)
    channel = Column(String(50), nullable=False)  # "instagram", "email", "website", "paid_ads", "cross_channel"
    category = Column(String(100), nullable=False)
    severity = Column(String(20), nullable=False)  # "High", "Medium", "Low"
    original_excerpt = Column(Text, nullable=False)
    explanation = Column(Text, nullable=False)
    guideline_ref = Column(String(100), nullable=True)
    suggested_fix = Column(Text, nullable=False)
    
    # Evidence Intelligence Fields
    evidence_status = Column(String(50), nullable=False, default="verified_violation")
    # "verified_violation", "unsupported_claim", "potential_violation", "compliant_grounded"
    evidence_quote = Column(Text, nullable=True)
    source = Column(String(50), nullable=False, default="deterministic")  # "deterministic" or "ai"
    
    remediation_status = Column(String(50), nullable=False, default="unresolved")  # "unresolved", "remediated", "waived"
    remediation_notes = Column(Text, nullable=True)

    campaign = relationship("CampaignAudit", back_populates="findings")
