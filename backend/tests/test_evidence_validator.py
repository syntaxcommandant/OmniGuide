from app.services.evidence_validator import evidence_validator
from app.schemas.analysis import AIFindingItem


def test_valid_clause_citation_verified(db_session):
    finding = AIFindingItem(
        category="unsupported_superlative",
        severity="High",
        original_excerpt="#1 fastest",
        explanation="Claims #1 status without proof.",
        guideline_clause_identifier="SEC-1.1",
        guideline_clause_text=None,
        suggested_fix="leading platform",
        evidence_status="verified"
    )

    validated = evidence_validator.validate_findings(db_session, [finding])
    assert len(validated) == 1
    assert validated[0].evidence_status == "verified"
    assert validated[0].guideline_clause_text is not None
    assert "Unsupported Rankings" in validated[0].guideline_clause_text


def test_hallucinated_clause_flagged(db_session):
    finding = AIFindingItem(
        category="tone_and_voice",
        severity="Medium",
        original_excerpt="overnight success",
        explanation="Sounds overly enthusiastic.",
        guideline_clause_identifier="NON-EXISTENT-99.9",
        guideline_clause_text="Fake clause text",
        suggested_fix="gradual improvement",
        evidence_status="verified"
    )

    validated = evidence_validator.validate_findings(db_session, [finding])
    assert len(validated) == 1
    # Must be marked insufficient_evidence and identified as unverified!
    assert validated[0].evidence_status == "insufficient_evidence"
    assert "UNVERIFIED" in validated[0].guideline_clause_identifier
