from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.services.seed_data import seed_demo_data

router = APIRouter(prefix="/demo", tags=["demo"])

DEMO_SCENARIOS = [
    {
        "id": "canonical_superlative",
        "title": "National Hackathon Canonical Test Case",
        "content_type": "Social Ad Copy",
        "content": "India's #1 fastest tool for Indian teams.",
        "campaign_context": "National Launch Campaign for Q1 2026",
        "description": "Tests unsupported superlative '#1' and absolute speed claim 'fastest' against Section 1.1 and 1.2.",
        "expected_findings": [
            "Unsupported superlative ranking ('#1') under Section 1.1",
            "Unsupported comparative speed claim ('fastest') under Section 1.2"
        ]
    },
    {
        "id": "compliant_metric",
        "title": "Compliant Enterprise Launch Copy",
        "content_type": "Press Release",
        "content": "A high-performance governance platform built for teams across India, delivering 42ms benchmark latency for enterprise workflows.",
        "campaign_context": "TechAudit verified enterprise benchmark launch",
        "description": "Uses defensible capability claims and an approved corporate fact (42ms latency, TechAudit Labs report).",
        "expected_findings": [
            "Fully compliant: No high or medium severity violations. 42ms latency matches Approved Facts."
        ]
    },
    {
        "id": "unverifiable_claim",
        "title": "Unverifiable Metric & Guarantee",
        "content_type": "Website Hero Copy",
        "content": "Used by 98% of all Fortune 500 CEOs daily to eliminate 100% of their operational errors.",
        "campaign_context": "Homepage Headline",
        "description": "Contains an unverified metric (98%) and an absolute guarantee (eliminate 100% of errors).",
        "expected_findings": [
            "Missing approved source for '98%' metric under Section 2.2",
            "Absolute outcome guarantee ('eliminate 100%') violating Section 2.1"
        ]
    },
    {
        "id": "banned_terms",
        "title": "Prohibited Terminology & Hype",
        "content_type": "Email Campaign",
        "content": "Our cheap, revolutionary hacky secret sauce guarantees 100% risk-free compliance without human effort.",
        "campaign_context": "Outreach sequence",
        "description": "Tests prohibited commoditizing terms ('cheap', 'hacky', 'secret sauce') and liability warranties.",
        "expected_findings": [
            "Prohibited terms under Section 3.1",
            "Absolute guarantee violation under Section 2.1",
            "Autonomous takeover violation under Section 4.1"
        ]
    }
]


@router.get("/scenarios")
def get_demo_scenarios():
    """Returns curated demo scenarios for judge testing and quick evaluation."""
    return DEMO_SCENARIOS


@router.post("/reset")
def reset_demo_data_endpoint(db: Session = Depends(get_db)):
    """Resets and re-seeds the demo guidelines, clauses, and approved facts."""
    seed_demo_data(db, force_reset=True)
    return {"message": "Demo governance guidelines and approved facts successfully reset."}
