import pytest
from fastapi.testclient import TestClient


def test_launch_gate_policy_strict_blocks_on_high_or_warnings(client: TestClient):
    """
    In 'strict' policy:
    - Any High violation blocks launch (status='blocked').
    - If no High violations but Medium/Low warnings exist or score < 85, status='needs_review'.
    - Only 100% clean or >=85 score with 0 warnings gets 'launch_ready'.
    """
    # 1. High violation under strict policy -> BLOCKED
    payload_high = {
        "name": "Strict Policy High Violation Test",
        "brand_name": "NovaForge",
        "channels": ["website"],
        "channel_contents": {
            "website": "NovaForge is India's #1 brand governance platform."
        },
        "launch_gate_policy": "strict",
        "analysis_mode": "deterministic"
    }
    res_high = client.post("/api/campaigns/simulate", json=payload_high)
    assert res_high.status_code == 201
    data_high = res_high.json()
    assert data_high["status"] == "blocked"
    assert data_high["blocking_violations_count"] >= 1

    # 2. Medium warning under strict policy -> NEEDS_REVIEW
    payload_med = {
        "name": "Strict Policy Warning Test",
        "brand_name": "NovaForge",
        "channels": ["website"],
        "channel_contents": {
            "website": "NovaForge provides revolutionary automated compliance verification."
        },
        "launch_gate_policy": "strict",
        "analysis_mode": "deterministic"
    }
    res_med = client.post("/api/campaigns/simulate", json=payload_med)
    assert res_med.status_code == 201
    data_med = res_med.json()
    assert data_med["status"] == "needs_review"
    assert data_med["blocking_violations_count"] == 0
    assert data_med["warnings_count"] >= 1


def test_launch_gate_policy_permissive_behavior(client: TestClient):
    """
    In 'permissive' policy:
    - High violations do not produce a hard 'blocked' halt; they set 'needs_review'.
    - If score is >= 60 and no blocking violations, it achieves 'launch_ready'.
    """
    payload = {
        "name": "Permissive Policy Test",
        "brand_name": "NovaForge",
        "channels": ["website"],
        "channel_contents": {
            "website": "Sign up for a free trial to evaluate our enterprise governance tools."
        },
        "launch_gate_policy": "permissive",
        "analysis_mode": "deterministic"
    }
    res = client.post("/api/campaigns/simulate", json=payload)
    assert res.status_code == 201
    data = res.json()
    # Medium warning on free trial disclaimer, score is 90 (> 60), no High violations -> launch_ready
    assert data["status"] == "launch_ready"
    assert data["launch_readiness_score"] >= 60


def test_high_numerical_score_never_overrides_critical_blocking_violation(client: TestClient):
    """
    CRITICAL GOVERNANCE INVARIANT:
    A high numerical score (e.g. 75/100) must NEVER override a critical blocking violation.
    If a critical High violation exists, the campaign MUST be BLOCKED in standard mode.
    """
    payload = {
        "name": "High Score With Critical Invariant Test",
        "brand_name": "NovaForge",
        "channels": ["website"],
        "channel_contents": {
            # Single High violation: 100 - 25 = 75 score
            "website": "NovaForge is India's #1 governance tool. All operations adhere strictly to compliance standards."
        },
        "launch_gate_policy": "standard",
        "analysis_mode": "deterministic"
    }
    res = client.post("/api/campaigns/simulate", json=payload)
    assert res.status_code == 201
    data = res.json()
    assert data["launch_readiness_score"] == 75
    assert data["blocking_violations_count"] == 1
    # Even though 75 is normally a passing score, the critical violation forces status='blocked'
    assert data["status"] == "blocked"


def test_cross_channel_pricing_contradiction_detection(client: TestClient):
    """
    Tests detection of contradictory commercial terms:
    Instagram promises 'completely free' while Website asserts 'mandatory annual contract'.
    """
    payload = {
        "name": "Commercial Terms Contradiction Test",
        "brand_name": "NovaForge",
        "channels": ["instagram", "website"],
        "channel_contents": {
            "instagram": "Get our platform completely free with zero cost for all teams!",
            "website": "Deployment requires a mandatory annual contract starting at $15,000 per year."
        },
        "launch_gate_policy": "standard",
        "analysis_mode": "deterministic"
    }
    res = client.post("/api/campaigns/simulate", json=payload)
    assert res.status_code == 201
    data = res.json()
    assert len(data["cross_channel_issues"]) >= 1
    issue_types = [i["issue_type"] for i in data["cross_channel_issues"]]
    assert "contradictory_pricing_terms" in issue_types


def test_campaign_json_report_export(client: TestClient):
    """Verifies that GET /api/campaigns/{id}/report/json returns structured machine-readable JSON matching persisted records."""
    payload = {
        "name": "JSON Export Campaign Test",
        "brand_name": "NovaForge",
        "channels": ["email"],
        "channel_contents": {
            "email": "Review our certified SLA benchmark data for enterprise compliance."
        },
        "launch_gate_policy": "standard",
        "analysis_mode": "deterministic"
    }
    sim_res = client.post("/api/campaigns/simulate", json=payload)
    assert sim_res.status_code == 201
    camp_id = sim_res.json()["id"]

    json_res = client.get(f"/api/campaigns/{camp_id}/report/json")
    assert json_res.status_code == 200
    report_json = json_res.json()

    assert report_json["report_type"] == "Campaign Launch Governance Audit"
    assert report_json["campaign_id"] == camp_id
    assert report_json["governance_policy_version"] == "OmniGuide Policy Engine v1.3.0"
    assert "scoring_breakdown" in report_json
    assert "findings_by_severity" in report_json
    assert "channels_evaluated" in report_json
