from typing import List, Dict, Optional, Any
from datetime import datetime
from pydantic import BaseModel, Field


class ChannelContentInput(BaseModel):
    channel: str = Field(..., description="Channel identifier e.g. 'instagram', 'email', 'website', 'paid_ads'")
    content: str = Field(..., min_length=3, description="Marketing copy for this channel")


class CampaignSimulationRequest(BaseModel):
    name: str = Field(..., min_length=2, description="Campaign title or identifier")
    brand_name: str = Field(default="NovaForge", description="Brand name associated with campaign")
    target_audience: Optional[str] = Field(None, description="Target demographic, market, or ICP")
    channels: List[str] = Field(default=["instagram", "email", "website", "paid_ads"], description="Target channels")
    channel_contents: Dict[str, str] = Field(
        ...,
        description="Map of channel name to content string, e.g. {'instagram': '...', 'email': '...'}"
    )
    launch_gate_policy: str = Field(default="standard", description="'strict', 'standard', or 'permissive'")
    analysis_mode: Optional[str] = Field(default="hybrid", description="'hybrid' or 'deterministic'")


class CampaignFindingSchema(BaseModel):
    id: str
    channel: str
    category: str
    severity: str
    original_excerpt: str
    explanation: str
    guideline_ref: Optional[str] = None
    suggested_fix: str
    evidence_status: str  # "verified_violation", "unsupported_claim", "potential_violation", "compliant_grounded"
    evidence_quote: Optional[str] = None
    source: str  # "deterministic" or "ai"
    remediation_status: str  # "unresolved", "remediated", "waived"
    remediation_notes: Optional[str] = None


class ChannelContentResult(BaseModel):
    id: Optional[str] = None
    channel: str
    original_content: str
    revised_content: str
    channel_readiness_score: int
    channel_status: str
    findings: List[CampaignFindingSchema] = []


class CrossChannelIssue(BaseModel):
    issue_type: str  # "contradictory_metric", "contradictory_claim", "tone_mismatch"
    channels_involved: List[str]
    description: str
    suggested_harmonization: str
    severity: str = "High"


class ScoringBreakdown(BaseModel):
    baseline_score: int = 100
    total_deductions: int
    high_severity_deductions: int
    medium_severity_deductions: int
    low_severity_deductions: int
    cross_channel_deductions: int
    remediation_restored: int
    final_score: int
    scoring_formula_explanation: str


class CampaignAuditResponse(BaseModel):
    id: str
    name: str
    brand_name: str
    target_audience: Optional[str] = None
    channels: List[str]
    launch_gate_policy: str
    status: str  # "blocked", "needs_review", "launch_ready"
    launch_readiness_score: int
    blocking_violations_count: int
    warnings_count: int
    remediated_count: int
    scoring_breakdown: ScoringBreakdown
    cross_channel_issues: List[CrossChannelIssue] = []
    channel_contents: List[ChannelContentResult] = []
    findings: List[CampaignFindingSchema] = []
    created_at: datetime
    updated_at: datetime


class RemediateFindingRequest(BaseModel):
    status: str = Field(..., description="'remediated' or 'waived'")
    custom_fix: Optional[str] = None
    remediation_notes: Optional[str] = None


class ReEvaluateRequest(BaseModel):
    channel_contents: Optional[Dict[str, str]] = None
    launch_gate_policy: Optional[str] = None
