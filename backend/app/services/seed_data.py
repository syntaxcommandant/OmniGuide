import logging
from datetime import datetime, timezone
from sqlalchemy.orm import Session
from app.models.guideline import GuidelineDocument, GuidelineClause, ApprovedFact
from app.models.review import Review, Finding, ReviewAction

logger = logging.getLogger(__name__)


DEMO_GUIDELINE_TITLE = "NovaForge Brand & Marketing Governance Standard v2.4"
DEMO_FILENAME = "novaforge_governance_v2.4.pdf"

DEMO_CLAUSES = [
    {
        "clause_identifier": "SEC-1.1",
        "clause_text": "Unsupported Rankings & Superlatives: Marketing materials must never claim '#1', 'Number One', or 'First' status unless backed by an accredited, publicly accessible, third-party benchmark or national registry published within the preceding 12 months. All comparative ranking claims require legal compliance sign-off prior to publication.",
        "section_heading": "Section 1: Comparative Claims & Superlatives",
        "page_number": 1
    },
    {
        "clause_identifier": "SEC-1.2",
        "clause_text": "Comparative Speed & Performance Claims: Absolute speed claims such as 'fastest', 'quickest', or 'unmatched speed' are prohibited without citing audited technical benchmarks. Permitted alternatives include qualified performance descriptions such as 'high-throughput' or referencing verified latency figures.",
        "section_heading": "Section 1: Comparative Claims & Superlatives",
        "page_number": 1
    },
    {
        "clause_identifier": "SEC-1.3",
        "clause_text": "Subjective Quality Assertions: Vague superlatives such as 'world's best', 'ultimate tool', or 'revolutionary' dilute enterprise credibility. Teams must describe concrete observable capabilities rather than hyperbolic praise.",
        "section_heading": "Section 1: Comparative Claims & Superlatives",
        "page_number": 2
    },
    {
        "clause_identifier": "SEC-2.1",
        "clause_text": "Guarantees and Liability Commitments: Absolute promises including '100% guaranteed', 'risk-free', or 'zero failure' create uninsurable commercial warranties. Statements must be qualified by reference to published Service Level Agreements (SLAs).",
        "section_heading": "Section 2: Legal Warranties & Claims",
        "page_number": 2
    },
    {
        "clause_identifier": "SEC-2.2",
        "clause_text": "Quantitative Metric Verification: Every specific numerical performance metric, uptime statistic, or commercial percentage cited in external copy must match a validated entry in the corporate Approved Facts library.",
        "section_heading": "Section 2: Legal Warranties & Claims",
        "page_number": 3
    },
    {
        "clause_identifier": "SEC-3.1",
        "clause_text": "Banned Commoditizing Terminology: Terminology that devalues enterprise positioning—including 'cheap', 'dirt cheap', 'hacky', or 'silver bullet'—is strictly prohibited across all external campaigns.",
        "section_heading": "Section 3: Tone of Voice & Prohibited Terms",
        "page_number": 3
    },
    {
        "clause_identifier": "SEC-4.1",
        "clause_text": "Approved Brand Terminology: Reference our intelligence suite as 'AI-assisted' or 'AI-native governance' rather than 'fully autonomous' or 'AI-powered autopilot' to highlight human accountability.",
        "section_heading": "Section 4: Technical Nomenclature & AI Positioning",
        "page_number": 4
    }
]

DEMO_APPROVED_FACTS = [
    {
        "fact_text": "NovaForge benchmark latency is 42ms for enterprise workloads, certified by TechAudit Labs Jan 2026.",
        "category": "performance",
        "source_reference": "TechAudit Labs Benchmark Report #TA-2026-01"
    },
    {
        "fact_text": "OmniGuide maintains a 99.95% verified uptime under enterprise SLA terms.",
        "category": "reliability",
        "source_reference": "NovaForge Enterprise SLA Agreement v3.2"
    },
    {
        "fact_text": "NovaForge serves over 1,200 organizations across India and Southeast Asia.",
        "category": "scale",
        "source_reference": "Q4 2025 Shareholder Filing"
    }
]


def seed_demo_data(db: Session, force_reset: bool = False):
    """
    Seeds the database with NovaForge's standard governance guideline and approved facts.
    """
    existing_doc = db.query(GuidelineDocument).filter(GuidelineDocument.title == DEMO_GUIDELINE_TITLE).first()

    if existing_doc and not force_reset:
        logger.info("Demo guidelines already present. Skipping re-seed.")
        return

    if existing_doc and force_reset:
        db.delete(existing_doc)
        db.commit()

    # Create Demo Document
    full_text = "\n\n".join([f"[{c['clause_identifier']}] {c['clause_text']}" for c in DEMO_CLAUSES])
    doc = GuidelineDocument(
        title=DEMO_GUIDELINE_TITLE,
        filename=DEMO_FILENAME,
        extracted_text=full_text,
        is_demo=True,
        created_at=datetime.now(timezone.utc)
    )
    db.add(doc)
    db.flush()

    # Add Clauses
    for item in DEMO_CLAUSES:
        clause = GuidelineClause(
            document_id=doc.id,
            clause_identifier=item["clause_identifier"],
            clause_text=item["clause_text"],
            section_heading=item["section_heading"],
            page_number=item["page_number"]
        )
        db.add(clause)

    # Add Approved Facts
    for fact_data in DEMO_APPROVED_FACTS:
        exists = db.query(ApprovedFact).filter(ApprovedFact.fact_text == fact_data["fact_text"]).first()
        if not exists:
            db.add(ApprovedFact(
                fact_text=fact_data["fact_text"],
                category=fact_data["category"],
                source_reference=fact_data["source_reference"]
            ))

    db.commit()
    logger.info("Demo governance guidelines and approved facts seeded successfully.")
