import pytest
from fastapi.testclient import TestClient


def test_redteam_cases_metadata(client: TestClient):
    """Verifies retrieval of the versioned adversarial benchmark vectors (v1.3.0)."""
    response = client.get("/api/redteam/cases")
    assert response.status_code == 200
    cases = response.json()
    assert len(cases) == 15
    
    # Verify clean negative controls are present
    assert any(c["category"] == "compliant_grounded_fact" and not c["expected_to_violate"] for c in cases)
    assert any(c["category"] == "compliant_enterprise_copy" and not c["expected_to_violate"] for c in cases)
    # Verify prompt injection vector is present
    assert any(c["category"] == "prompt_injection_bypass" for c in cases)


def test_redteam_evaluation_execution(client: TestClient):
    """
    Executes red-team suite and asserts empirical Precision, Recall, F1, and Injection Resistance.
    """
    response = client.post("/api/redteam/run")
    assert response.status_code == 200
    data = response.json()

    metrics = data["metrics"]
    cm = data["confusion_matrix"]

    assert metrics["precision"] >= 90.0, "Precision should be at least 90%"
    assert metrics["recall"] >= 90.0, "Recall should be at least 90%"
    assert metrics["f1_score"] >= 90.0, "F1 score should be at least 90%"
    assert metrics["critical_violation_detection_rate"] >= 95.0, "Critical violation detection must be >= 95%"
    assert metrics["prompt_injection_defense_rate"] == 100.0, "Prompt injection attempt must be neutralized"

    assert cm["true_positives"] >= 10
    assert cm["true_negatives"] >= 3
    assert cm["false_positives"] == 0
    assert cm["false_negatives"] == 0

    assert data["evaluation_verdict"] == "EXCELLENT_GOVERNANCE"


def test_redteam_report_export(client: TestClient):
    """Verifies export of the red-team stress-test markdown report."""
    response = client.get("/api/redteam/report")
    assert response.status_code == 200
    report_text = response.text
    assert "OmniGuide Brand Red-Team Stress Test Evaluation Report" in report_text
    assert "Empirical Accuracy & Robustness Metrics" in report_text
    assert "Confusion Matrix" in report_text
    assert "Prompt Injection Defense Verification" in report_text
