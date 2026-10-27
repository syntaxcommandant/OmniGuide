import pytest
from fastapi.testclient import TestClient


def test_campaign_templates_endpoint(client: TestClient):
    """Verifies that benchmark campaign templates are available for evaluation."""
    response = client.get("/api/campaigns/templates")
    assert response.status_code == 200
    templates = response.json()
    assert len(templates) >= 2
    assert any(t["id"] == "enterprise_omnicloud_q1" for t in templates)


def test_campaign_simulation_blocking_gate(client: TestClient):
    """
    Verifies that a campaign containing High severity violations (#1, 100% guaranteed)
    is strictly blocked by the standard launch gate and cannot be published.
    """
    payload = {
        "name": "Q1 Launch Gate Test",
        "brand_name": "NovaForge",
        "target_audience": "Enterprise IT Leaders",
        "channels": ["instagram", "website"],
        "channel_contents": {
            "instagram": "NovaForge is India's #1 fastest tool! 100% guaranteed.",
            "website": "NovaForge maintains 99.95% verified uptime under enterprise SLA terms."
        },
        "launch_gate_policy": "standard",
        "analysis_mode": "deterministic"
    }

    response = client.post("/api/campaigns/simulate", json=payload)
    assert response.status_code == 201
    data = response.json()

    assert data["status"] == "blocked"
    assert data["blocking_violations_count"] >= 2
    assert data["launch_readiness_score"] < 70
    assert "scoring_breakdown" in data
    assert data["scoring_breakdown"]["baseline_score"] == 100
    assert data["scoring_breakdown"]["high_severity_deductions"] >= 50


def test_campaign_cross_channel_contradiction_detection(client: TestClient):
    """
    Verifies that conflicting metrics across channels (99.9% vs 99.95% vs 100%)
    are detected as cross-channel contradiction issues with -15 score penalty.
    """
    payload = {
        "name": "Cross Channel Inconsistency Test",
        "brand_name": "NovaForge",
        "channels": ["paid_ads", "website"],
        "channel_contents": {
            "paid_ads": "Experience 100% guaranteed performance for your team.",
            "website": "Backed by standard SLA terms for enterprise operations."
        },
        "launch_gate_policy": "standard",
        "analysis_mode": "deterministic"
    }

    response = client.post("/api/campaigns/simulate", json=payload)
    assert response.status_code == 201
    data = response.json()

    assert len(data["cross_channel_issues"]) >= 1
    issue = data["cross_channel_issues"][0]
    assert issue["issue_type"] in ("contradictory_claim", "contradictory_metric")
    assert "paid_ads" in issue["channels_involved"]
    assert "website" in issue["channels_involved"]


def test_campaign_finding_remediation_and_score_recovery(client: TestClient):
    """
    Verifies that remediating a finding restores its penalty points and updates the Launch Gate.
    """
    # 1. Simulate initial campaign
    payload = {
        "name": "Remediation Workflow Test",
        "brand_name": "NovaForge",
        "channels": ["website"],
        "channel_contents": {
            "website": "NovaForge is the fastest tool for your enterprise."
        },
        "launch_gate_policy": "standard",
        "analysis_mode": "deterministic"
    }

    sim_res = client.post("/api/campaigns/simulate", json=payload)
    assert sim_res.status_code == 201
    campaign = sim_res.json()
    campaign_id = campaign["id"]
    initial_score = campaign["launch_readiness_score"]
    finding_id = campaign["findings"][0]["id"]

    # 2. Remediate finding
    rem_payload = {
        "status": "remediated",
        "custom_fix": "high-performance",
        "remediation_notes": "Replaced absolute fastest with high-performance"
    }
    rem_res = client.patch(f"/api/campaigns/{campaign_id}/remediate/{finding_id}", json=rem_payload)
    assert rem_res.status_code == 200
    updated = rem_res.json()

    assert updated["remediated_count"] == 1
    assert updated["launch_readiness_score"] > initial_score
    assert updated["scoring_breakdown"]["remediation_restored"] >= 25


def test_campaign_report_export(client: TestClient):
    """Verifies markdown report generation for external stakeholders."""
    payload = {
        "name": "Report Export Test",
        "brand_name": "NovaForge",
        "channels": ["email"],
        "channel_contents": {
            "email": "Review our AI-assisted brand governance benchmark data."
        },
        "launch_gate_policy": "standard",
        "analysis_mode": "deterministic"
    }
    sim_res = client.post("/api/campaigns/simulate", json=payload)
    campaign_id = sim_res.json()["id"]

    report_res = client.get(f"/api/campaigns/{campaign_id}/report")
    assert report_res.status_code == 200
    report_text = report_res.text
    assert "OmniGuide Campaign Launch Audit Report" in report_text
    assert "Deterministic Scoring Methodology" in report_text
    assert "Report Export Test" in report_text
