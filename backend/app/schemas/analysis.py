from typing import List, Optional
from pydantic import BaseModel, Field


class AIFindingItem(BaseModel):
    category: str = Field(
        ...,
        description="Category: 'unsupported_superlative', 'banned_term', 'required_terminology', 'unverified_claim', 'tone_and_voice', 'brand_consistency', or 'missing_approved_source'"
    )
    severity: str = Field(..., description="Must be 'High', 'Medium', or 'Low'")
    original_excerpt: str = Field(..., description="Exact substring from the submitted marketing text")
    explanation: str = Field(..., description="Clear explanation of why this matters and how it violates the guideline")
    guideline_clause_identifier: Optional[str] = Field(None, description="Actual identifier of the cited guideline clause e.g. 'SEC-1.1'")
    guideline_clause_text: Optional[str] = Field(None, description="Direct supporting quote from the guideline clause")
    suggested_fix: str = Field(..., description="Actionable replacement text preserving marketing intent and voice")
    evidence_status: str = Field(
        default="verified",
        description="'verified' if backed by stored clause, 'insufficient_evidence' if cannot be proven, 'missing_approved_source' if metric lacks approved facts record"
    )
    evidence_tier: Optional[str] = Field(
        default="VERIFIED",
        description="One of 'VERIFIED', 'UNSUPPORTED', 'CONTRADICTED', 'NEEDS_HUMAN_REVIEW'"
    )
    evidence_provenance: Optional[dict] = Field(
        default=None,
        description="Source provenance dictionary with source_id, source_title, relevant_excerpt, document_reference, and timestamp"
    )


class AIAnalysisResult(BaseModel):
    findings: List[AIFindingItem] = Field(default_factory=list, description="List of identified issues and recommendations")
    overall_assessment: str = Field(..., description="Executive summary of the review")
    revised_draft: str = Field(..., description="Complete proposed revised copy with all suggested fixes applied")
    is_compliant: bool = Field(..., description="True if no medium/high severity violations")
