from typing import List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import PlainTextResponse
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.campaign import CampaignAudit
from app.schemas.campaign import (
    CampaignSimulationRequest,
    CampaignAuditResponse,
    RemediateFindingRequest,
    ReEvaluateRequest,
)
from app.services.campaign_simulator import campaign_simulator

router = APIRouter(prefix="/campaigns", tags=["campaigns"])


BENCHMARK_CAMPAIGN_TEMPLATES = [
    {
        "id": "enterprise_omnicloud_q1",
        "name": "OmniCloud Enterprise Q1 Launch",
        "brand_name": "NovaForge",
        "target_audience": "Enterprise CTOs, VP Engineering, and Platform Architects across India",
        "launch_gate_policy": "standard",
        "channels": ["instagram", "email", "website", "paid_ads"],
        "channel_contents": {
            "instagram": "NovaForge OmniCloud is India's #1 fastest cloud platform! Get 100% guaranteed zero-downtime infrastructure for your mission-critical applications.",
            "email": "Dear Technology Leader, our revolutionary cloud architecture delivers 42ms benchmark latency certified by TechAudit Labs, backed by standard enterprise SLA terms. Act now for your exclusive team deployment.",
            "website": "NovaForge OmniCloud maintains a 99.95% verified uptime under enterprise SLA terms. Engineered for high performance with 42ms benchmark latency across enterprise workloads.",
            "paid_ads": "Switch to India's fastest cloud platform. Get free trial with zero risk for modern engineering teams!"
        }
    },
    {
        "id": "growth_b2b_saas",
        "name": "Global Compliance Engine Campaign",
        "brand_name": "NovaForge",
        "target_audience": "Compliance officers, legal counsels, and CMOs",
        "launch_gate_policy": "strict",
        "channels": ["website", "email", "paid_ads"],
        "channel_contents": {
            "website": "NovaForge serves over 1,200 organizations across India and Southeast Asia, adhering strictly to automated governance and verified corporate facts.",
            "email": "Discover our AI-assisted brand governance platform. Streamline marketing audits with verifiable clause citations and registered corporate benchmarks.",
            "paid_ads": "Ensure every marketing claim is legally defensible before publication. Try NovaForge governance."
        }
    }
]


@router.get("/templates", response_model=List[Dict[str, Any]])
def get_campaign_templates():
    """Returns curated benchmark campaign templates for evaluation and live demos."""
    return BENCHMARK_CAMPAIGN_TEMPLATES


@router.post("/simulate", response_model=CampaignAuditResponse, status_code=status.HTTP_201_CREATED)
def simulate_campaign(
    payload: CampaignSimulationRequest,
    db: Session = Depends(get_db)
):
    """Executes a multi-channel campaign launch simulation, computes score, and enforces launch gates."""
    try:
        return campaign_simulator.simulate_campaign(db=db, request=payload)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Campaign simulation failed: {str(e)}"
        )


@router.get("", response_model=List[CampaignAuditResponse])
def list_campaigns(db: Session = Depends(get_db)):
    """Lists all historical campaign simulations sorted by creation date."""
    campaigns = db.query(CampaignAudit).order_by(CampaignAudit.created_at.desc()).all()
    return [campaign_simulator._build_response(c) for c in campaigns]


@router.get("/{id}", response_model=CampaignAuditResponse)
def get_campaign(id: str, db: Session = Depends(get_db)):
    """Retrieves full campaign simulation details including risk heatmap, score math, and findings."""
    campaign = db.query(CampaignAudit).filter(CampaignAudit.id == id).first()
    if not campaign:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Campaign not found")
    return campaign_simulator._build_response(campaign)


@router.patch("/{id}/remediate/{finding_id}", response_model=CampaignAuditResponse)
def remediate_finding(
    id: str,
    finding_id: str,
    payload: RemediateFindingRequest,
    db: Session = Depends(get_db)
):
    """Remediates or waives a finding and dynamically re-evaluates the Launch Gate and score."""
    try:
        return campaign_simulator.remediate_finding(
            db=db,
            campaign_id=id,
            finding_id=finding_id,
            status=payload.status,
            custom_fix=payload.custom_fix,
            notes=payload.remediation_notes
        )
    except ValueError as ve:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


@router.post("/{id}/re-evaluate", response_model=CampaignAuditResponse)
def re_evaluate_campaign(
    id: str,
    payload: ReEvaluateRequest,
    db: Session = Depends(get_db)
):
    """Re-evaluates compliance on edited copy and updates the campaign launch readiness score."""
    try:
        return campaign_simulator.re_evaluate_campaign(
            db=db,
            campaign_id=id,
            updated_contents=payload.channel_contents,
            new_policy=payload.launch_gate_policy
        )
    except ValueError as ve:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


@router.get("/{id}/report", response_class=PlainTextResponse)
def get_campaign_report(id: str, db: Session = Depends(get_db)):
    """Exports a structured markdown audit report containing findings, evidence references, and scoring."""
    campaign = db.query(CampaignAudit).filter(CampaignAudit.id == id).first()
    if not campaign:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Campaign not found")
    return campaign_simulator.generate_audit_report(campaign)


@router.get("/{id}/report/json", response_model=Dict[str, Any])
def get_campaign_report_json(id: str, db: Session = Depends(get_db)):
    """Exports a machine-readable JSON audit report matching persisted campaign records."""
    campaign = db.query(CampaignAudit).filter(CampaignAudit.id == id).first()
    if not campaign:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Campaign not found")
    return campaign_simulator.generate_audit_json(campaign)


@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_campaign(id: str, db: Session = Depends(get_db)):
    """Deletes a campaign simulation record."""
    campaign = db.query(CampaignAudit).filter(CampaignAudit.id == id).first()
    if not campaign:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Campaign not found")
    db.delete(campaign)
    db.commit()
    return None
