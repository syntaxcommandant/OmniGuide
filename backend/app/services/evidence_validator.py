import logging
from typing import List, Dict, Optional
from sqlalchemy.orm import Session
from app.models.guideline import GuidelineClause, GuidelineDocument
from app.schemas.analysis import AIFindingItem

logger = logging.getLogger(__name__)


class EvidenceValidator:
    """
    Validates findings against stored clauses and approved facts.
    Guarantees that no finding cites a fictitious clause identifier or hallucinated quotation.
    """

    def validate_findings(
        self,
        db: Session,
        findings: List[AIFindingItem]
    ) -> List[AIFindingItem]:
        """
        Validates all findings against real database records.
        Updates clause metadata or marks evidence status appropriately.
        """
        # Fetch all known clauses from DB into lookup map
        clauses_query = (
            db.query(GuidelineClause, GuidelineDocument.title)
            .join(GuidelineDocument, GuidelineClause.document_id == GuidelineDocument.id)
            .all()
        )

        clause_by_identifier: Dict[str, tuple[GuidelineClause, str]] = {}
        clause_by_id: Dict[str, tuple[GuidelineClause, str]] = {}

        for c, doc_title in clauses_query:
            # normalize identifier e.g. "SEC-1.1", "sec-1.1", "1.1"
            clean_id = c.clause_identifier.strip().upper()
            clause_by_identifier[clean_id] = (c, doc_title)
            # also allow without prefix
            alt_id = clean_id.replace("SEC-", "").replace("RULE-", "")
            clause_by_identifier[alt_id] = (c, doc_title)
            clause_by_id[c.id] = (c, doc_title)

        validated: List[AIFindingItem] = []

        for f in findings:
            item = f.model_copy()

            # If it's a deterministic rule finding
            if item.evidence_status == "deterministic_rule":
                # Try to map to an actual stored clause if available
                if item.guideline_clause_identifier:
                    clean_id = item.guideline_clause_identifier.strip().upper()
                    if clean_id in clause_by_identifier:
                        c_obj, doc_name = clause_by_identifier[clean_id]
                        item.guideline_clause_text = c_obj.clause_text
                        item.evidence_status = "verified"
                validated.append(item)
                continue

            # If an approved source was missing
            if item.evidence_status == "missing_approved_source":
                validated.append(item)
                continue

            # Check citation identifier
            cited_id = (item.guideline_clause_identifier or "").strip().upper()

            if not cited_id:
                # No citation was provided
                item.evidence_status = "insufficient_evidence"
                item.explanation += " (Note: No specific guideline clause was cited for this observation.)"
                validated.append(item)
                continue

            # Attempt to find the real clause
            matched_entry = clause_by_identifier.get(cited_id)
            if not matched_entry:
                # Try partial match (e.g., "1.1" inside "SEC-1.1")
                for key, val in clause_by_identifier.items():
                    if cited_id in key or key in cited_id:
                        matched_entry = val
                        break

            if matched_entry:
                c_obj, doc_name = matched_entry
                # Real clause confirmed!
                item.guideline_clause_identifier = c_obj.clause_identifier
                item.guideline_clause_text = c_obj.clause_text
                item.evidence_status = "verified"
            else:
                # The model hallucinated or referenced a non-existent clause ID!
                logger.warning(f"Unverified citation detected: {cited_id}")
                item.evidence_status = "insufficient_evidence"
                item.guideline_clause_identifier = f"UNVERIFIED ({cited_id})"
                item.guideline_clause_text = "No matching clause found in registered guidelines."
                item.explanation = f"[Guideline citation unverified: No clause matching '{cited_id}' exists in the uploaded guidelines.] {item.explanation}"

            validated.append(item)

        return validated


evidence_validator = EvidenceValidator()
