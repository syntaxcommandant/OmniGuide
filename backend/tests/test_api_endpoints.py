import io


def test_health_check(client):
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["app"] == "OmniGuide"


def test_system_status(client):
    response = client.get("/api/status")
    assert response.status_code == 200
    data = response.json()
    assert data["database_connected"] is True
    assert data["guidelines_count"] >= 1
    assert data["clauses_count"] >= 5


def test_canonical_superlative_review_workflow(client):
    # Test canonical input: "India's #1 fastest tool for Indian teams."
    payload = {
        "title": "National Benchmark Review Test",
        "content_type": "Social Ad Copy",
        "content": "India's #1 fastest tool for Indian teams.",
        "campaign_context": "National Launch Q1 2026",
        "analysis_mode": "deterministic"
    }

    response = client.post("/api/reviews", json=payload)
    assert response.status_code == 201
    review = response.json()

    assert review["title"] == payload["title"]
    assert review["original_content"] == payload["content"]
    assert len(review["findings"]) >= 2

    # Check for #1 and fastest
    findings = review["findings"]
    excerpts = [f["original_excerpt"] for f in findings]
    assert any("#1" in e for e in excerpts)
    assert any("fastest" in e for e in excerpts)

    # Check that clauses are cited
    cited_ids = [f["guideline_clause_identifier"] for f in findings if f["guideline_clause_identifier"]]
    assert len(cited_ids) > 0
    assert any("SEC-1.1" in cid or "SEC-1.2" in cid for cid in cited_ids)

    # Test Decision Action: Accept finding
    first_finding = findings[0]
    patch_response = client.patch(
        f"/api/reviews/{review['id']}/findings/{first_finding['id']}",
        json={"decision_status": "accepted"}
    )
    assert patch_response.status_code == 200
    updated_review = patch_response.json()
    updated_finding = next(f for f in updated_review["findings"] if f["id"] == first_finding["id"])
    assert updated_finding["decision_status"] == "accepted"
    assert len(updated_review["actions"]) >= 2

    # Test Decision Action: Dismiss finding
    second_finding = findings[1]
    dismiss_response = client.patch(
        f"/api/reviews/{review['id']}/findings/{second_finding['id']}",
        json={"decision_status": "dismissed"}
    )
    assert dismiss_response.status_code == 200
    d_review = dismiss_response.json()
    d_finding = next(f for f in d_review["findings"] if f["id"] == second_finding["id"])
    assert d_finding["decision_status"] == "dismissed"

    # All findings resolved: overall_status should be "resolved"
    assert d_review["overall_status"] == "resolved"


def test_manual_guideline_creation(client):
    payload = {
        "title": "Brand Voice Policy 2026",
        "content": """
        Section 1.1 Brand Tone
        Our communication must remain objective, clear, and focused on customer outcomes.
        Section 1.2 Banned Terminology
        Never refer to our software as cheap or experimental in external press releases.
        """,
        "approved_facts": ["OmniGuide latency is 42ms."]
    }
    response = client.post("/api/guidelines/manual", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["title"] == payload["title"]
    assert data["clause_count"] >= 2


def test_invalid_pdf_handling(client):
    # Upload invalid file
    fake_file = io.BytesIO(b"Not a real PDF stream")
    response = client.post(
        "/api/guidelines/upload",
        data={"title": "Invalid File Test"},
        files={"file": ("test.pdf", fake_file, "application/pdf")}
    )
    # Should be rejected with 400 or 422
    assert response.status_code in (400, 422)
