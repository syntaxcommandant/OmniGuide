import pytest
from app.services.evidence_validator import evidence_validator
from app.schemas.analysis import AIFindingItem
from app.models.guideline import GuidelineDocument, GuidelineClause, ApprovedFact


def test_evidence_validator_tier_classification(db_session):
    # 1. Setup a test guideline clause
    doc = GuidelineDocument(
        title="Engineering SLA Standard v1",
        filename="sla_policy.pdf",
        extracted_text="Section 2.1: Uptime must be qualified under standard SLA terms."
    )
    db_session.add(doc)
    db_session.flush()

    clause = GuidelineClause(
        document_id=doc.id,
        clause_identifier="SEC-2.1",
        clause_text="Uptime must be qualified under standard SLA terms.",
        section_heading="SLA Terms",
        page_number=3
    )
    db_session.add(clause)
    db_session.commit()

    # Create 4 test findings covering the 4 distinct tiers
    findings = [
        # Tier 1: VERIFIED
        AIFindingItem(
            category="unsupported_superlative",
            severity="High",
            original_excerpt="100% guaranteed",
            explanation="Absolute guarantees create legal liabilities.",
            guideline_clause_identifier="SEC-2.1",
            suggested_fix="backed by enterprise SLA"
        ),
        # Tier 2: UNSUPPORTED (missing approved source, not necessarily false)
        AIFindingItem(
            category="missing_approved_source",
            severity="Medium",
            original_excerpt="99.9%",
            explanation="Metric lacks approved corporate facts entry.",
            guideline_clause_identifier="SEC-2.2",
            suggested_fix="Register 99.9% in approved facts"
        ),
        # Tier 3: CONTRADICTED
        AIFindingItem(
            category="contradictory_campaign_claims",
            severity="High",
            original_excerpt="free open source with mandatory $12,000 contract",
            explanation="Contradictory commercial terms across channels.",
            guideline_clause_identifier="SEC-2.4",
            suggested_fix="Harmonize pricing terms"
        ),
        # Tier 4: NEEDS_HUMAN_REVIEW
        AIFindingItem(
            category="tone_and_voice",
            severity="Medium",
            original_excerpt="revolutionary secret sauce",
            explanation="Urgency slang conflicts with authoritative voice.",
            guideline_clause_identifier="SEC-3.2",
            suggested_fix="proven methodology"
        )
    ]

    validated = evidence_validator.validate_findings(db=db_session, findings=findings)
    assert len(validated) == 4

    # Verify Tier 1: VERIFIED
    f1 = validated[0]
    assert f1.evidence_tier == "VERIFIED"
    assert f1.evidence_provenance is not None
    assert f1.evidence_provenance["source_title"] == "Engineering SLA Standard v1"
    assert "Page 3" in f1.evidence_provenance["document_reference"]

    # Verify Tier 2: UNSUPPORTED
    f2 = validated[1]
    assert f2.evidence_tier == "UNSUPPORTED"
    assert f2.evidence_provenance is not None
    # Must contain explicit notice that unsupported does not imply factual falsity
    assert "not indicate the claim is factually false" in f2.evidence_provenance["policy_notice"]

    # Verify Tier 3: CONTRADICTED
    f3 = validated[2]
    assert f3.evidence_tier == "CONTRADICTED"
    assert f3.evidence_provenance is not None
    assert "contradicts" in f3.evidence_provenance["policy_notice"].lower()

    # Verify Tier 4: NEEDS_HUMAN_REVIEW
    f4 = validated[3]
    assert f4.evidence_tier == "NEEDS_HUMAN_REVIEW"
    assert f4.evidence_provenance is not None
    assert "reviewer" in f4.evidence_provenance["policy_notice"].lower()


def test_review_workflow_immutability_and_actions(client):
    # 1. Create a content review
    payload = {
        "title": "Evidence Provenance Integration Test",
        "content_type": "Product Copy",
        "content": "NovaForge is the #1 fastest platform with 100% guaranteed zero downtime.",
        "analysis_mode": "deterministic"
    }
    create_res = client.post("/api/reviews", json=payload)
    assert create_res.status_code == 201
    review = create_res.json()
    review_id = review["id"]

    # Verify immutability of original content
    assert review["original_content"] == payload["content"]
    assert len(review["findings"]) > 0

    first_finding = review["findings"][0]
    finding_id = first_finding["id"]
    assert first_finding["decision_status"] == "pending"

    # 2. Test Accept Revision
    accept_res = client.patch(
        f"/api/reviews/{review_id}/findings/{finding_id}",
        json={"decision_status": "accepted"}
    )
    assert accept_res.status_code == 200
    updated_review = accept_res.json()
    uf = next(f for f in updated_review["findings"] if f["id"] == finding_id)
    assert uf["decision_status"] == "accepted"
    # Original copy MUST remain unchanged
    assert updated_review["original_content"] == payload["content"]

    # 3. Test Edit Revision
    if len(review["findings"]) > 1:
        second_finding = review["findings"][1]
        edit_res = client.patch(
            f"/api/reviews/{review_id}/findings/{second_finding['id']}",
            json={"decision_status": "edited", "user_custom_fix": "enterprise-grade infrastructure"}
        )
        assert edit_res.status_code == 200
        edit_review = edit_res.json()
        ef = next(f for f in edit_review["findings"] if f["id"] == second_finding["id"])
        assert ef["decision_status"] == "edited"
        assert ef["user_custom_fix"] == "enterprise-grade infrastructure"

    # 4. Test Save Draft Content
    draft_res = client.put(
        f"/api/reviews/{review_id}/content",
        json={"revised_content": "NovaForge is a premier platform backed by standard enterprise SLA."}
    )
    assert draft_res.status_code == 200
    draft_review = draft_res.json()
    assert draft_review["revised_content"] == "NovaForge is a premier platform backed by standard enterprise SLA."
    # Original copy MUST still remain unchanged
    assert draft_review["original_content"] == payload["content"]
