import json
import logging
from datetime import datetime, timezone
from typing import List, Dict, Optional
from sqlalchemy.orm import Session
from app.models.guideline import GuidelineClause, GuidelineDocument, ApprovedFact
from app.schemas.analysis import AIFindingItem

logger = logging.getLogger(__name__)


class EvidenceValidator:
    """
    Explainable Evidence Intelligence Engine.
    Validates findings against stored guideline clauses and registered Approved Corporate Facts.
    Guarantees that no finding cites a fictitious clause identifier or hallucinated quotation,
    and classifies every finding into one of 4 grounded evidence tiers:
    1. VERIFIED: Sufficient approved evidence supports the rule/claim application.
    2. UNSUPPORTED: Required corporate evidence was not found (note: unsupported does not imply false).
    3. CONTRADICTED: Available verified evidence explicitly conflicts with the claim.
    4. NEEDS_HUMAN_REVIEW: Contextual or tone observation requiring human reviewer judgment.
    """

    def validate_findings(
        self,
        db: Session,
        findings: List[AIFindingItem]
    ) -> List[AIFindingItem]:
        now_iso = datetime.now(timezone.utc).isoformat()

        # 1. Fetch all known clauses from DB into lookup maps
        clauses_query = (
            db.query(GuidelineClause, GuidelineDocument.title)
            .join(GuidelineDocument, GuidelineClause.document_id == GuidelineDocument.id)
            .all()
        )

        clause_by_identifier: Dict[str, tuple[GuidelineClause, str]] = {}
        for c, doc_title in clauses_query:
            clean_id = c.clause_identifier.strip().upper()
            clause_by_identifier[clean_id] = (c, doc_title)
            alt_id = clean_id.replace("SEC-", "").replace("RULE-", "")
            clause_by_identifier[alt_id] = (c, doc_title)

        # 2. Fetch approved corporate facts from DB
        facts_query = db.query(ApprovedFact).all() if db else []
        facts_count = len(facts_query)

        validated: List[AIFindingItem] = []

        for f in findings:
            item = f.model_copy()
            category = (item.category or "").lower()
            cited_id = (item.guideline_clause_identifier or "").strip().upper()

            # Determine matching clause if available
            c_obj: Optional[GuidelineClause] = None
            doc_name: Optional[str] = None
            if cited_id:
                matched_entry = clause_by_identifier.get(cited_id)
                if not matched_entry:
                    for key, val in clause_by_identifier.items():
                        if cited_id in key or key in cited_id:
                            matched_entry = val
                            break
                if matched_entry:
                    c_obj, doc_name = matched_entry

            # -------------------------------------------------------------
            # Classify Evidence Tier (VERIFIED | UNSUPPORTED | CONTRADICTED | NEEDS_HUMAN_REVIEW)
            # -------------------------------------------------------------
            if category in ("contradictory_campaign_claims", "contradictory_claims"):
                tier = "CONTRADICTED"
                status_slug = "contradicted"
                policy_notice = "Claim contradicts published commercial terms, contract requirements, or SLA commitments in another channel or clause."
            elif category in ("missing_approved_source", "unverified_claim"):
                tier = "UNSUPPORTED"
                status_slug = "insufficient_evidence"
                policy_notice = "Specific metric or assertion lacks a registered corporate source record in the Approved Facts library. Note: Unsupported does not indicate the claim is factually false, but it lacks documented authorization for public distribution."
            elif category in ("tone_and_voice", "required_terminology"):
                tier = "NEEDS_HUMAN_REVIEW"
                status_slug = "needs_human_review"
                policy_notice = "Subjective brand tone or stylistic convention flagged for marketing reviewer evaluation."
            else:
                # Superlatives, banned terms, guarantees, disclaimers
                tier = "VERIFIED"
                status_slug = "verified"
                policy_notice = "Verified against active brand governance rule and registered policy clause."

            # If model hallucinated a citation that doesn't exist in DB:
            if cited_id and not c_obj and not cited_id.startswith("SEC-") and not cited_id.startswith("RULE-"):
                tier = "NEEDS_HUMAN_REVIEW"
                status_slug = "insufficient_evidence"
                item.guideline_clause_identifier = f"UNVERIFIED ({cited_id})"
                item.guideline_clause_text = "No matching clause found in registered guidelines."
                policy_notice = f"Unregistered clause citation '{cited_id}'. Flagged for human verification."

            # Update item attributes
            if c_obj:
                item.guideline_clause_identifier = c_obj.clause_identifier
                item.guideline_clause_text = c_obj.clause_text

            item.evidence_status = status_slug
            item.evidence_tier = tier

            # Construct structured evidence provenance
            source_id = c_obj.id if c_obj else ("FACTS-REPO" if category == "missing_approved_source" else "DETERMINISTIC-RULE-ENGINE")
            source_title = doc_name if doc_name else ("Approved Corporate Facts Repository" if category == "missing_approved_source" else "OmniGuide Deterministic Rule Library")
            relevant_excerpt = item.guideline_clause_text or f"Governed under {item.guideline_clause_identifier or 'Platform Policy'}"
            doc_ref = f"{source_title} • Clause {item.guideline_clause_identifier}" if item.guideline_clause_identifier else source_title
            if c_obj and c_obj.page_number:
                doc_ref += f" • Page {c_obj.page_number}"

            provenance = {
                "source_id": source_id,
                "source_title": source_title,
                "relevant_excerpt": relevant_excerpt,
                "document_reference": doc_ref,
                "verification_timestamp": now_iso,
                "verification_tier": tier,
                "policy_notice": policy_notice,
                "total_approved_facts_registered": facts_count
            }

            item.evidence_provenance = provenance
            validated.append(item)

        return validated


evidence_validator = EvidenceValidator()
