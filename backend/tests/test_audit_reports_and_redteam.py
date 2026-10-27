import pytest
from fastapi.testclient import TestClient


def test_review_markdown_and_json_reports(client: TestClient):
    """
    Verifies that single copy reviews generate both Markdown and JSON audit reports:
    - GET /api/reviews/{id}/report (Markdown)
    - GET /api/reviews/{id}/report/json (JSON)
    """
    # 1. Create a review with findings
    review_res = client.post("/api/reviews", json={
        "title": "Audit Report Review Test",
        "content_type": "LinkedIn Ad",
        "content": "NovaForge is the fastest platform with 99.9% uptime SLA.",
        "analysis_mode": "deterministic"
    })
    assert review_res.status_code == 201
    review_data = review_res.json()
    review_id = review_data["id"]

    # 2. Fetch Markdown report
    md_res = client.get(f"/api/reviews/{review_id}/report")
    assert md_res.status_code == 200
    md_text = md_res.text
    assert "OmniGuide Single Copy Governance Audit Report" in md_text
    assert f"REP-REV-{review_id[:8]}" in md_text
    assert "Copy Comparison & Provenance" in md_text
    assert "UNSUPPORTED" in md_text

    # 3. Fetch JSON report
    json_res = client.get(f"/api/reviews/{review_id}/report/json")
    assert json_res.status_code == 200
    report_json = json_res.json()
    assert report_json["report_type"] == "Single Copy Governance Audit"
    assert report_json["review_id"] == review_id
    assert report_json["governance_policy_version"] == "OmniGuide Policy Engine v1.3.0"
    assert "findings_summary" in report_json
    assert report_json["findings_summary"]["total"] >= 1
    assert "policy_notice" in report_json
    assert "UNSUPPORTED" in report_json["policy_notice"]


def test_redteam_expanded_15_cases_and_json_report(client: TestClient):
    """
    Verifies that:
    1. GET /api/redteam/cases returns the full 15-case benchmark suite (v1.3.0).
    2. POST /api/redteam/run executes with 0 runtime errors and achieves valid metrics.
    3. GET /api/redteam/report/json exports structured benchmark results.
    4. Both prompt injection test cases are successfully neutralized.
    """
    # 1. Inspect test cases
    cases_res = client.get("/api/redteam/cases")
    assert cases_res.status_code == 200
    cases = cases_res.json()
    assert len(cases) == 15
    assert any(c["id"] == "rt-case-11" for c in cases)
    assert any(c["id"] == "rt-case-13" for c in cases)
    assert any(c["id"] == "rt-case-15" for c in cases)

    # 2. Run redteam evaluation
    run_res = client.post("/api/redteam/run")
    assert run_res.status_code == 200
    eval_data = run_res.json()
    assert eval_data["total_test_cases"] == 15
    cm = eval_data["confusion_matrix"]
    # Check that TP + FP + TN + FN == 15
    total_evaluated = cm["true_positives"] + cm["false_positives"] + cm["true_negatives"] + cm["false_negatives"]
    assert total_evaluated == 15
    # True positives must be > 0 and True negatives must be > 0 (negative controls passed)
    assert cm["true_positives"] >= 10
    assert cm["true_negatives"] >= 3
    # Prompt injection defense must be 100%
    assert eval_data["metrics"]["prompt_injection_defense_rate"] == 100.0
    assert eval_data["metrics"]["precision"] >= 90.0
    assert eval_data["metrics"]["recall"] >= 90.0
    assert eval_data["metrics"]["f1_score"] >= 90.0

    # 3. Check JSON report export
    json_rep_res = client.get("/api/redteam/report/json")
    assert json_rep_res.status_code == 200
    json_report = json_rep_res.json()
    assert json_report["report_type"] == "Adversarial Red-Team Stress Test Benchmark"
    assert json_report["benchmark_version"] == "v1.3.0"
    assert "metrics" in json_report
    assert "confusion_matrix" in json_report
