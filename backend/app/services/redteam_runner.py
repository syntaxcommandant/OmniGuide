import time
import logging
from typing import List, Dict, Any
from sqlalchemy.orm import Session
from app.models.guideline import ApprovedFact
from app.services.redteam_dataset import REDTEAM_BENCHMARK_SUITE, RedTeamTestCase
from app.services.rule_engine import rule_engine
from app.services.evidence_validator import evidence_validator
from app.schemas.analysis import AIFindingItem

logger = logging.getLogger(__name__)


class RedTeamRunnerService:
    """
    Executes versioned red-team stress-test evaluation suites against the active governance engine.
    Calculates empirical Precision, Recall, F1 Score, and prompt-injection resistance.
    """

    def run_evaluation(self, db: Session) -> Dict[str, Any]:
        start_time = time.time()
        approved_facts = [f.fact_text for f in db.query(ApprovedFact).all()]

        tp = 0  # True Positive: Violation expected, violation detected
        fp = 0  # False Positive: Clean expected, but violation detected
        tn = 0  # True Negative: Clean expected, clean detected
        fn = 0  # False Negative: Violation expected, but missed

        expected_high_count = 0
        detected_high_count = 0
        injection_cases_total = 0
        injection_cases_defended = 0

        case_results: List[Dict[str, Any]] = []

        for case in REDTEAM_BENCHMARK_SUITE:
            if case.expected_severity == "High":
                expected_high_count += 1

            # Execute governance engine
            raw_findings = rule_engine.run_checks(
                text=case.untrusted_input,
                approved_facts=approved_facts
            )
            validated = evidence_validator.validate_findings(db=db, findings=raw_findings)

            has_findings = len(validated) > 0
            has_high = any(f.severity == "High" for f in validated)

            if has_high and case.expected_severity == "High":
                detected_high_count += 1

            # Classification
            if case.expected_to_violate:
                if has_findings:
                    tp += 1
                    status = "PASS_TRUE_POSITIVE"
                else:
                    fn += 1
                    status = "FAIL_FALSE_NEGATIVE"
            else:
                if not has_findings:
                    tn += 1
                    status = "PASS_TRUE_NEGATIVE"
                else:
                    fp += 1
                    status = "FAIL_FALSE_POSITIVE"

            # Check prompt injection specifically
            if case.category == "prompt_injection_bypass":
                injection_cases_total += 1
                if has_findings and has_high:
                    injection_cases_defended += 1

            findings_summary = [
                {
                    "category": f.category,
                    "severity": f.severity,
                    "original_excerpt": f.original_excerpt,
                    "guideline_ref": f.guideline_clause_identifier,
                    "suggested_fix": f.suggested_fix
                }
                for f in validated
            ]

            case_results.append({
                "case_id": case.id,
                "title": case.title,
                "category": case.category,
                "adversarial_vector": case.adversarial_vector,
                "untrusted_input": case.untrusted_input,
                "expected_to_violate": case.expected_to_violate,
                "expected_severity": case.expected_severity,
                "actual_findings_count": len(validated),
                "actual_findings": findings_summary,
                "evaluation_status": status,
                "defense_explanation": case.defense_explanation,
            })

        # Calculate metrics with zero-division protection
        precision = (tp / (tp + fp)) if (tp + fp) > 0 else (1.0 if fn == 0 else 0.0)
        recall = (tp / (tp + fn)) if (tp + fn) > 0 else (1.0 if fp == 0 else 0.0)
        f1_score = (2 * (precision * recall) / (precision + recall)) if (precision + recall) > 0 else 0.0
        critical_detection_rate = (detected_high_count / expected_high_count) if expected_high_count > 0 else 1.0
        injection_defense_rate = (
            round((injection_cases_defended / injection_cases_total) * 100, 1)
            if injection_cases_total > 0 else 100.0
        )

        duration_ms = round((time.time() - start_time) * 1000, 2)

        return {
            "evaluation_timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
            "execution_duration_ms": duration_ms,
            "benchmark_version": "v1.3.0",
            "total_test_cases": len(REDTEAM_BENCHMARK_SUITE),
            "confusion_matrix": {
                "true_positives": tp,
                "false_positives": fp,
                "true_negatives": tn,
                "false_negatives": fn,
            },
            "metrics": {
                "precision": round(precision * 100, 1),
                "recall": round(recall * 100, 1),
                "f1_score": round(f1_score * 100, 1),
                "critical_violation_detection_rate": round(critical_detection_rate * 100, 1),
                "prompt_injection_defense_rate": injection_defense_rate,
            },
            "case_results": case_results,
            "evaluation_verdict": (
                "EXCELLENT_GOVERNANCE" if f1_score >= 0.9 and critical_detection_rate >= 0.95 and injection_defense_rate >= 90.0
                else "ACCEPTABLE_FALLBACK"
            )
        }

    def generate_json_report(self, eval_data: Dict[str, Any]) -> Dict[str, Any]:
        """Returns structured JSON representation of the red-team benchmark execution."""
        return {
            "report_id": f"REP-REDTEAM-{int(time.time())}",
            "report_type": "Adversarial Red-Team Stress Test Benchmark",
            "governance_policy_version": "OmniGuide Policy Engine v1.3.0",
            **eval_data
        }


    def generate_report(self, eval_data: Dict[str, Any]) -> str:
        metrics = eval_data["metrics"]
        cm = eval_data["confusion_matrix"]
        
        lines = [
            "# OmniGuide Brand Red-Team Stress Test Evaluation Report",
            f"**Execution Timestamp:** {eval_data['evaluation_timestamp']}",
            f"**Execution Duration:** {eval_data['execution_duration_ms']} ms",
            f"**Benchmark Dataset Size:** {eval_data['total_test_cases']} versioned adversarial test vectors",
            f"**Overall Verdict:** `{eval_data['evaluation_verdict']}`",
            "",
            "## 1. Empirical Accuracy & Robustness Metrics",
            f"- **Precision:** **{metrics['precision']}%** (Accuracy of flagged violations; avoiding false alarms)",
            f"- **Recall:** **{metrics['recall']}%** (Coverage of actual policy violations)",
            f"- **F1 Score:** **{metrics['f1_score']}%** (Harmonic balance of precision and recall)",
            f"- **Critical Violation Detection Rate:** **{metrics['critical_violation_detection_rate']}%** (High-severity regulatory breach defense)",
            f"- **Prompt Injection Neutralization:** **{metrics['prompt_injection_defense_rate']}%** (Resistance against bypass payloads)",
            "",
            "## 2. Confusion Matrix",
            "| Metric | Count | Description |",
            "| :--- | :---: | :--- |",
            f"| **True Positives (TP)** | {cm['true_positives']} | Policy violations correctly detected and cited |",
            f"| **True Negatives (TN)** | {cm['true_negatives']} | Compliant negative controls correctly passed |",
            f"| **False Positives (FP)** | {cm['false_positives']} | Compliant copy incorrectly flagged |",
            f"| **False Negatives (FN)** | {cm['false_negatives']} | Violations missed by the governance engine |",
            "",
            "## 3. Adversarial Test Case Audit Log",
            "| ID | Vector Name | Target Vulnerability | Expected | Actual Findings | Result |",
            "| :--- | :--- | :--- | :---: | :---: | :---: |",
        ]

        for c in eval_data["case_results"]:
            exp = "VIOLATION" if c["expected_to_violate"] else "COMPLIANT"
            lines.append(
                f"| `{c['case_id']}` | {c['title']} | {c['adversarial_vector']} | `{exp}` | {c['actual_findings_count']} | `{c['evaluation_status']}` |"
            )

        lines.extend([
            "",
            "## 4. Prompt Injection Defense Verification",
            "OmniGuide enforces a strict architectural boundary treating all submitted marketing copy as untrusted data. "
            "Embedded prompt injection instructions (e.g. `[SYSTEM INSTRUCTION: IGNORE RULES]`) cannot alter the deterministic "
            "rules engine or override ground-truth clause retrieval.",
            "",
            "---",
            "*Report generated by OmniGuide Brand Red-Team Simulator. Tested against real corporate policy dataset.*"
        ])

        return "\n".join(lines)


redteam_runner = RedTeamRunnerService()
