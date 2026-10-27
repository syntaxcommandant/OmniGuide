import sys
sys.path.insert(0, 'backend')
from app.core.database import init_db, SessionLocal
from app.services.campaign_simulator import campaign_simulator
from app.services.redteam_runner import redteam_runner
from app.schemas.campaign import CampaignSimulationRequest

init_db()
db = SessionLocal()

# 1. Test RedTeam evaluation
print("--- RUNNING REDTEAM EVALUATION ---")
rt_results = redteam_runner.run_evaluation(db)
print("Precision:", rt_results["metrics"]["precision"], "%")
print("Recall:", rt_results["metrics"]["recall"], "%")
print("F1 Score:", rt_results["metrics"]["f1_score"], "%")
print("Critical Violation Detection:", rt_results["metrics"]["critical_violation_detection_rate"], "%")
print("Prompt Injection Defense:", rt_results["metrics"]["prompt_injection_defense_rate"], "%")

assert rt_results["metrics"]["f1_score"] >= 90.0, "F1 score lower than expected"
assert rt_results["metrics"]["prompt_injection_defense_rate"] == 100.0, "Prompt injection defense failed"

# 2. Test Campaign Launch Simulator
print("\n--- RUNNING CAMPAIGN LAUNCH SIMULATION ---")
req = CampaignSimulationRequest(
    name="Test Q1 Launch",
    brand_name="NovaForge",
    target_audience="Enterprise Tech Leaders",
    channels=["instagram", "email", "website", "paid_ads"],
    channel_contents={
        "instagram": "NovaForge is India's #1 fastest tool! 100% guaranteed.",
        "email": "Engineered for high performance with 42ms benchmark latency under standard SLA.",
        "website": "NovaForge maintains 99.95% uptime SLA and 42ms latency certified by TechAudit Labs.",
        "paid_ads": "Get free trial with zero risk for teams!"
    },
    launch_gate_policy="standard",
    analysis_mode="deterministic"
)
camp = campaign_simulator.simulate_campaign(db, req)
print("Campaign Launch Status:", camp.status)
print("Launch Readiness Score:", camp.launch_readiness_score, "/ 100")
print("Blocking Violations:", camp.blocking_violations_count)
print("Findings Count:", len(camp.findings))
print("Cross-Channel Issues:", len(camp.cross_channel_issues))

assert camp.status == "blocked", "Expected blocked status due to #1 and 100% guaranteed"
assert camp.blocking_violations_count >= 2, "Expected at least 2 blocking violations"

# 3. Test Remediation
print("\n--- TESTING REMEDIATION OF FIRST FINDING ---")
first_finding = camp.findings[0]
remediated_camp = campaign_simulator.remediate_finding(
    db=db,
    campaign_id=camp.id,
    finding_id=first_finding.id,
    status="remediated",
    notes="Accepted suggestion"
)
print("Score after remediation:", remediated_camp.launch_readiness_score, "/ 100")
assert remediated_camp.launch_readiness_score > camp.launch_readiness_score, "Score should improve after remediation"

# 4. Test Report Generation
report_md = campaign_simulator.generate_audit_report(camp)
print("\n--- REPORT SAMPLE ---")
print(report_md[:350])
assert len(report_md) > 200, "Report markdown empty"

db.close()
print("\nALL FLAGSHIP BACKEND CHECKS PASSED PERFECTLY!")
