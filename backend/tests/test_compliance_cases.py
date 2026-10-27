import pytest
from unittest.mock import patch
from app.models.guideline import GuidelineDocument, GuidelineClause
from app.services.gemini_service import GeminiServiceError


def test_case_1_unsupported_superlative(client):
    """
    CASE 1 — Unsupported superlative:
    'India\'s #1 fastest tool for Indian teams.'
    Expected: Flag the superlative or comparative claim if configured rules/guidelines support doing so.
    Explain the evidence gap and offer a more defensible alternative.
    """
    payload = {
        "title": "Case 1 Superlative Test",
        "content_type": "Social Ad Copy",
        "content": "India's #1 fastest tool for Indian teams.",
        "analysis_mode": "deterministic"
    }
    response = client.post("/api/reviews", json=payload)
    assert response.status_code == 201
    data = response.json()

    assert data["overall_status"] in ("flagged", "needs_review")
    findings = data["findings"]
    assert len(findings) >= 2

    # Check for #1 ranking and fastest claims
    excerpts = [f["original_excerpt"] for f in findings]
    assert any("#1" in e for e in excerpts), f"Expected #1 in excerpts: {excerpts}"
    assert any("fastest" in e for e in excerpts), f"Expected fastest in excerpts: {excerpts}"

    # Check that clauses are cited and suggested fixes are provided
    for f in findings:
        assert f["explanation"]
        assert f["suggested_fix"]
        assert f["guideline_clause_identifier"] is not None


def test_case_2_unsupported_numerical_claim(client):
    """
    CASE 2 — Unsupported numerical claim:
    'Our product improves productivity by 98%.'
    Expected: Identify the numerical claim as requiring supporting evidence.
    """
    payload = {
        "title": "Case 2 Numerical Claim Test",
        "content_type": "Website Copy",
        "content": "Our product improves productivity by 98%.",
        "analysis_mode": "deterministic"
    }
    response = client.post("/api/reviews", json=payload)
    assert response.status_code == 201
    data = response.json()

    findings = data["findings"]
    assert len(findings) >= 1
    # Check that 98% is flagged
    excerpts = [f["original_excerpt"] for f in findings]
    assert any("98%" in e for e in excerpts), f"Expected 98% in excerpts: {excerpts}"

    num_finding = next(f for f in findings if "98%" in f["original_excerpt"])
    assert num_finding["category"] in ("unverified_claim", "unsupported_metric", "missing_approved_source")
    assert "98%" in num_finding["explanation"]


def test_case_3_prohibited_terminology(client):
    """
    CASE 3 — Prohibited terminology:
    Use terms that are prohibited by the guideline (e.g. cheap, hacky, secret sauce).
    Expected: Identify the relevant phrase and retrieve the correct clause.
    """
    payload = {
        "title": "Case 3 Prohibited Terms Test",
        "content_type": "Email Campaign",
        "content": "Our cheap, hacky secret sauce eliminates compliance risk.",
        "analysis_mode": "deterministic"
    }
    response = client.post("/api/reviews", json=payload)
    assert response.status_code == 201
    data = response.json()

    findings = data["findings"]
    assert len(findings) >= 2
    excerpts = [f["original_excerpt"].lower() for f in findings]
    assert any("cheap" in e or "hacky" in e or "secret sauce" in e for e in excerpts)


def test_case_4_compliant_content(client):
    """
    CASE 4 — Compliant content:
    Use simple marketing copy that does not violate the configured guidelines.
    Expected: Do not invent violations.
    """
    payload = {
        "title": "Case 4 Compliant Copy Test",
        "content_type": "Press Release",
        "content": "A high-performance governance platform built for teams across India, delivering 42ms benchmark latency for enterprise workflows.",
        "analysis_mode": "deterministic"
    }
    response = client.post("/api/reviews", json=payload)
    assert response.status_code == 201
    data = response.json()

    # 42ms is in Approved Facts, so it should be accepted without High severity flags
    high_findings = [f for f in data["findings"] if f["severity"] == "High"]
    assert len(high_findings) == 0, f"Unexpected high severity findings in compliant copy: {high_findings}"
    assert data["overall_status"] in ("compliant", "needs_review")


def test_case_5_empty_content_validation(client):
    """
    CASE 5 — Empty content:
    Expected: Show validation and do not create a misleading successful review.
    """
    payload = {
        "title": "Empty Copy Test",
        "content_type": "Social Ad Copy",
        "content": "  ",
        "analysis_mode": "deterministic"
    }
    response = client.post("/api/reviews", json=payload)
    assert response.status_code in (400, 422)
    err = response.json()
    assert "detail" in err


def test_case_6_missing_guidelines_limitation(client, db_session):
    """
    CASE 6 — Missing guidelines:
    Expected: Clearly explain the limitation and whether deterministic checks can still run.
    """
    # Remove all guidelines to simulate a blank workspace
    db_session.query(GuidelineClause).delete()
    db_session.query(GuidelineDocument).delete()
    db_session.commit()

    payload = {
        "title": "Zero Guidelines Review",
        "content_type": "Social Ad Copy",
        "content": "India's #1 fastest tool for Indian teams.",
        "analysis_mode": "deterministic"
    }
    response = client.post("/api/reviews", json=payload)
    # Review should still succeed via deterministic engine rules
    assert response.status_code == 201
    data = response.json()
    assert len(data["findings"]) >= 1


def test_case_7_ai_unavailable_fallback(client):
    """
    CASE 7 — AI unavailable:
    Temporarily test with the AI provider unavailable or throwing GeminiServiceError.
    Expected: The application must handle failure gracefully and fall back to deterministic mode.
    """
    payload = {
        "title": "AI Fallback Review",
        "content_type": "Social Ad Copy",
        "content": "India's #1 fastest tool for Indian teams.",
        "analysis_mode": "hybrid"
    }

    with patch("app.services.gemini_service.gemini_service.is_configured", return_value=True):
        with patch("app.services.gemini_service.gemini_service.analyze_marketing_content", side_effect=GeminiServiceError("Gemini API 503 Service Unavailable")):
            response = client.post("/api/reviews", json=payload)
            assert response.status_code == 201
            data = response.json()
            assert data["analysis_mode"] == "deterministic_fallback"
            assert len(data["findings"]) >= 1


def test_case_8_irrelevant_guideline_content(client):
    """
    CASE 8 — Irrelevant guideline:
    Use content unrelated to available guideline clauses.
    Expected: Do not fabricate an evidence citation.
    """
    payload = {
        "title": "Irrelevant Content Test",
        "content_type": "Website Copy",
        "content": "The weather in Bangalore is pleasant during autumn.",
        "analysis_mode": "deterministic"
    }
    response = client.post("/api/reviews", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["overall_status"] == "compliant"
    assert len(data["findings"]) == 0
