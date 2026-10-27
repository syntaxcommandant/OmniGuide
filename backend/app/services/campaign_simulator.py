import re
import logging
from typing import List, Dict, Tuple, Optional, Any
from sqlalchemy.orm import Session
from app.models.campaign import CampaignAudit, CampaignChannelContent, CampaignFinding, generate_uuid
from app.models.guideline import ApprovedFact
from app.schemas.campaign import (
    CampaignSimulationRequest,
    CampaignAuditResponse,
    CampaignFindingSchema,
    ChannelContentResult,
    CrossChannelIssue,
    ScoringBreakdown,
)
from app.schemas.analysis import AIFindingItem
from app.services.rule_engine import rule_engine
from app.services.evidence_validator import evidence_validator
from app.services.retrieval import guideline_retriever
from app.services.gemini_service import gemini_service

logger = logging.getLogger(__name__)


class CampaignSimulatorService:
    """
    Evaluates multi-channel marketing campaigns against brand policies,
    detects cross-channel contradictions, enforces Launch Gates,
    and calculates transparent deterministic Launch Readiness Scores.
    """

    CHANNEL_SPECIFIC_RULES = {
        "paid_ads": [
            {
                "pattern": re.compile(r'\b(free\s+trial|no\s+credit\s+card\s+required)\b', re.IGNORECASE),
                "required_disclaimer": "Terms apply",
                "category": "missing_required_disclaimer",
                "severity": "Medium",
                "explanation": "Paid advertising claims regarding free trials require clear terms qualification under Section 2.3.",
                "guideline_ref": "SEC-2.3",
                "suggested_fix": "Add '(Terms & eligibility apply)' to the ad copy."
            }
        ],
        "email": [
            {
                "pattern": re.compile(r'\b(click\s+here|act\s+now|urgent|limited\s+time)\b', re.IGNORECASE),
                "category": "tone_and_voice",
                "severity": "Low",
                "explanation": "High-pressure urgency clickbait phrases diminish enterprise brand authority under Section 3.3.",
                "guideline_ref": "SEC-3.3",
                "suggested_fix": "Use direct, professional calls-to-action (e.g. 'Explore Enterprise Deployment' or 'Review Benchmark Data')."
            }
        ]
    }

    def simulate_campaign(
        self,
        db: Session,
        request: CampaignSimulationRequest
    ) -> CampaignAuditResponse:
        """Runs complete multi-channel audit, evaluates consistency, computes score and gate status."""
        approved_facts = [f.fact_text for f in db.query(ApprovedFact).all()]

        all_findings: List[CampaignFinding] = []
        channel_results: List[ChannelContentResult] = []
        raw_channel_findings: Dict[str, List[AIFindingItem]] = {}

        # 1. Evaluate each channel's content
        for channel in request.channels:
            content = request.channel_contents.get(channel, "").strip()
            if not content:
                continue

            # A. Run core deterministic rules
            channel_deterministic_findings = rule_engine.run_checks(
                text=content,
                approved_facts=approved_facts
            )

            # B. Apply channel-specific compliance checks
            channel_rules = self.CHANNEL_SPECIFIC_RULES.get(channel, [])
            for r in channel_rules:
                if r["pattern"].search(content):
                    channel_deterministic_findings.append(AIFindingItem(
                        category=r["category"],
                        severity=r["severity"],
                        original_excerpt=r["pattern"].search(content).group(0),
                        explanation=r["explanation"],
                        guideline_clause_identifier=r["guideline_ref"],
                        guideline_clause_text=f"Section {r['guideline_ref']}: Channel compliance standard for {channel}.",
                        suggested_fix=r["suggested_fix"],
                        evidence_status="verified"
                    ))

            # C. AI analysis if Gemini configured and requested
            ai_findings: List[AIFindingItem] = []
            revised_content = content
            if request.analysis_mode == "hybrid" and gemini_service.is_configured():
                try:
                    retrieved_clauses = guideline_retriever.retrieve_relevant_clauses(
                        db=db,
                        query_text=content,
                        top_k=4
                    )
                    ai_result = gemini_service.analyze_marketing_content(
                        content=content,
                        content_type=f"{request.brand_name} {channel.capitalize()} Copy",
                        retrieved_clauses=retrieved_clauses,
                        approved_facts=approved_facts,
                        campaign_context=request.target_audience
                    )
                    ai_findings = ai_result.findings
                    revised_content = ai_result.revised_draft
                except Exception as e:
                    logger.warning(f"AI channel analysis skipped for {channel}: {e}")

            # Merge findings with attribution
            merged_items: List[Tuple[AIFindingItem, str]] = []
            seen_excerpts = set()

            for f in ai_findings:
                clean_exc = f.original_excerpt.lower().strip()
                if clean_exc not in seen_excerpts:
                    merged_items.append((f, "ai"))
                    seen_excerpts.add(clean_exc)

            for f in channel_deterministic_findings:
                clean_exc = f.original_excerpt.lower().strip()
                if clean_exc not in seen_excerpts:
                    merged_items.append((f, "deterministic"))
                    seen_excerpts.add(clean_exc)

            # Validate evidence against database
            validated_items = evidence_validator.validate_findings(
                db=db,
                findings=[item[0] for item in merged_items]
            )

            # Create campaign finding models
            channel_finding_schemas: List[CampaignFindingSchema] = []
            for idx, val_finding in enumerate(validated_items):
                source = merged_items[idx][1] if idx < len(merged_items) else "deterministic"
                evidence_status = self._classify_evidence_tier(val_finding)
                f_id = generate_uuid()

                finding_model = CampaignFinding(
                    id=f_id,
                    channel=channel,
                    category=val_finding.category,
                    severity=val_finding.severity,
                    original_excerpt=val_finding.original_excerpt,
                    explanation=val_finding.explanation,
                    guideline_ref=val_finding.guideline_clause_identifier,
                    suggested_fix=val_finding.suggested_fix,
                    evidence_status=evidence_status,
                    evidence_quote=val_finding.guideline_clause_text,
                    source=source,
                    remediation_status="unresolved"
                )
                all_findings.append(finding_model)

                channel_finding_schemas.append(CampaignFindingSchema(
                    id=f_id,
                    channel=channel,
                    category=val_finding.category,
                    severity=val_finding.severity,
                    original_excerpt=val_finding.original_excerpt,
                    explanation=val_finding.explanation,
                    guideline_ref=val_finding.guideline_clause_identifier,
                    suggested_fix=val_finding.suggested_fix,
                    evidence_status=evidence_status,
                    evidence_quote=val_finding.guideline_clause_text,
                    source=source,
                    remediation_status="unresolved"
                ))

            # Channel score
            channel_score = self._compute_channel_score(channel_finding_schemas)
            ch_status = "compliant" if channel_score >= 85 else ("needs_review" if channel_score >= 60 else "flagged")

            channel_results.append(ChannelContentResult(
                channel=channel,
                original_content=content,
                revised_content=revised_content,
                channel_readiness_score=channel_score,
                channel_status=ch_status,
                findings=channel_finding_schemas
            ))

        # 2. Cross-Channel Contradiction & Consistency Analysis
        cross_channel_issues = self._detect_cross_channel_contradictions(request.channel_contents)

        for issue in cross_channel_issues:
            finding_model = CampaignFinding(
                id=generate_uuid(),
                channel="cross_channel",
                category="contradictory_campaign_claims",
                severity=issue.severity,
                original_excerpt=f"Conflict across: {', '.join(issue.channels_involved)}",
                explanation=issue.description,
                guideline_ref="SEC-2.4",
                suggested_fix=issue.suggested_harmonization,
                evidence_status="verified_violation",
                evidence_quote="Section 2.4: Cross-channel promotional consistency requires unified claim metrics across all touchpoints.",
                source="deterministic",
                remediation_status="unresolved"
            )
            all_findings.append(finding_model)

        # 3. Calculate Deterministic Launch Readiness Score
        scoring_breakdown = self._calculate_launch_readiness_score(all_findings, cross_channel_issues)

        # 4. Enforce Launch Gate Policy
        launch_status, blocking_count, warning_count = self._evaluate_launch_gate(
            policy=request.launch_gate_policy,
            score=scoring_breakdown.final_score,
            findings=all_findings
        )

        # 5. Persist to SQLite Database
        audit_record = CampaignAudit(
            name=request.name,
            brand_name=request.brand_name,
            target_audience=request.target_audience,
            channels=request.channels,
            launch_gate_policy=request.launch_gate_policy,
            status=launch_status,
            launch_readiness_score=scoring_breakdown.final_score,
            blocking_violations_count=blocking_count,
            warnings_count=warning_count,
            remediated_count=0,
            scoring_breakdown=scoring_breakdown.model_dump(),
            cross_channel_issues=[i.model_dump() for i in cross_channel_issues],
            findings=all_findings
        )
        db.add(audit_record)
        db.flush()

        # Add channel content records
        for cr in channel_results:
            cc = CampaignChannelContent(
                campaign_id=audit_record.id,
                channel=cr.channel,
                original_content=cr.original_content,
                revised_content=cr.revised_content,
                channel_readiness_score=cr.channel_readiness_score,
                channel_status=cr.channel_status
            )
            db.add(cc)

        db.commit()
        db.refresh(audit_record)

        return self._build_response(audit_record)

    def remediate_finding(
        self,
        db: Session,
        campaign_id: str,
        finding_id: str,
        status: str,
        custom_fix: Optional[str] = None,
        notes: Optional[str] = None
    ) -> CampaignAuditResponse:
        """Updates finding remediation status and dynamically recalculates the launch score."""
        audit = db.query(CampaignAudit).filter(CampaignAudit.id == campaign_id).first()
        if not audit:
            raise ValueError("Campaign audit record not found.")

        finding = db.query(CampaignFinding).filter(
            CampaignFinding.id == finding_id,
            CampaignFinding.campaign_id == campaign_id
        ).first()
        if not finding:
            raise ValueError("Finding not found in campaign.")

        finding.remediation_status = status
        finding.remediation_notes = notes or custom_fix
        if custom_fix:
            finding.suggested_fix = custom_fix

        # Recalculate score and gate
        all_findings = db.query(CampaignFinding).filter(CampaignFinding.campaign_id == campaign_id).all()
        raw_issues = audit.cross_channel_issues or []
        cross_channel_issues = [CrossChannelIssue(**i) for i in raw_issues]

        new_breakdown = self._calculate_launch_readiness_score(all_findings, cross_channel_issues)
        new_status, blocking_count, warning_count = self._evaluate_launch_gate(
            policy=audit.launch_gate_policy,
            score=new_breakdown.final_score,
            findings=all_findings
        )

        audit.launch_readiness_score = new_breakdown.final_score
        audit.status = new_status
        audit.blocking_violations_count = blocking_count
        audit.warnings_count = warning_count
        audit.remediated_count = sum(1 for f in all_findings if f.remediation_status in ("remediated", "waived"))
        audit.scoring_breakdown = new_breakdown.model_dump()

        db.commit()
        db.refresh(audit)
        return self._build_response(audit)

    def re_evaluate_campaign(
        self,
        db: Session,
        campaign_id: str,
        updated_contents: Optional[Dict[str, str]] = None,
        new_policy: Optional[str] = None
    ) -> CampaignAuditResponse:
        """Re-runs compliance audit on edited copy and updates the historical record."""
        audit = db.query(CampaignAudit).filter(CampaignAudit.id == campaign_id).first()
        if not audit:
            raise ValueError("Campaign audit record not found.")

        contents = updated_contents or {}
        if not contents:
            # use existing channel contents
            contents = {cc.channel: cc.revised_content for cc in audit.channel_contents}

        req = CampaignSimulationRequest(
            name=audit.name,
            brand_name=audit.brand_name,
            target_audience=audit.target_audience,
            channels=audit.channels,
            channel_contents=contents,
            launch_gate_policy=new_policy or audit.launch_gate_policy,
            analysis_mode="deterministic"  # deterministic for rapid re-evaluation
        )

        # Delete previous channel records & findings
        db.query(CampaignFinding).filter(CampaignFinding.campaign_id == campaign_id).delete()
        db.query(CampaignChannelContent).filter(CampaignChannelContent.campaign_id == campaign_id).delete()

        # Re-run simulation
        approved_facts = [f.fact_text for f in db.query(ApprovedFact).all()]
        new_findings: List[CampaignFinding] = []
        new_channel_results: List[ChannelContentResult] = []

        for channel in req.channels:
            content = req.channel_contents.get(channel, "").strip()
            if not content:
                continue

            findings = rule_engine.run_checks(text=content, approved_facts=approved_facts)
            val_findings = evidence_validator.validate_findings(db=db, findings=findings)

            channel_schemas: List[CampaignFindingSchema] = []
            for vf in val_findings:
                ev_status = self._classify_evidence_tier(vf)
                f_id = generate_uuid()
                cf = CampaignFinding(
                    id=f_id,
                    campaign_id=campaign_id,
                    channel=channel,
                    category=vf.category,
                    severity=vf.severity,
                    original_excerpt=vf.original_excerpt,
                    explanation=vf.explanation,
                    guideline_ref=vf.guideline_clause_identifier,
                    suggested_fix=vf.suggested_fix,
                    evidence_status=ev_status,
                    evidence_quote=vf.guideline_clause_text,
                    source="deterministic",
                    remediation_status="unresolved"
                )
                new_findings.append(cf)
                channel_schemas.append(CampaignFindingSchema(
                    id=f_id,
                    channel=channel,
                    category=vf.category,
                    severity=vf.severity,
                    original_excerpt=vf.original_excerpt,
                    explanation=vf.explanation,
                    guideline_ref=vf.guideline_clause_identifier,
                    suggested_fix=vf.suggested_fix,
                    evidence_status=ev_status,
                    evidence_quote=vf.guideline_clause_text,
                    source="deterministic",
                    remediation_status="unresolved"
                ))

            ch_score = self._compute_channel_score(channel_schemas)
            new_channel_results.append(ChannelContentResult(
                channel=channel,
                original_content=content,
                revised_content=content,
                channel_readiness_score=ch_score,
                channel_status="compliant" if ch_score >= 85 else "needs_review",
                findings=channel_schemas
            ))

        cross_issues = self._detect_cross_channel_contradictions(req.channel_contents)
        for issue in cross_issues:
            cf = CampaignFinding(
                campaign_id=campaign_id,
                channel="cross_channel",
                category="contradictory_campaign_claims",
                severity=issue.severity,
                original_excerpt=f"Conflict: {', '.join(issue.channels_involved)}",
                explanation=issue.description,
                guideline_ref="SEC-2.4",
                suggested_fix=issue.suggested_harmonization,
                evidence_status="verified_violation",
                evidence_quote="Section 2.4: Promotional consistency.",
                source="deterministic",
                remediation_status="unresolved"
            )
            new_findings.append(cf)

        breakdown = self._calculate_launch_readiness_score(new_findings, cross_issues)
        gate_status, b_count, w_count = self._evaluate_launch_gate(
            policy=req.launch_gate_policy,
            score=breakdown.final_score,
            findings=new_findings
        )

        audit.launch_readiness_score = breakdown.final_score
        audit.status = gate_status
        audit.blocking_violations_count = b_count
        audit.warnings_count = w_count
        audit.remediated_count = 0
        audit.scoring_breakdown = breakdown.model_dump()
        audit.cross_channel_issues = [i.model_dump() for i in cross_issues]
        audit.findings = new_findings

        for cr in new_channel_results:
            cc = CampaignChannelContent(
                campaign_id=campaign_id,
                channel=cr.channel,
                original_content=cr.original_content,
                revised_content=cr.revised_content,
                channel_readiness_score=cr.channel_readiness_score,
                channel_status=cr.channel_status
            )
            db.add(cc)

        db.commit()
        db.refresh(audit)
        return self._build_response(audit)

    def generate_audit_report(self, audit: Any) -> str:
        """Generates a structured, exportable markdown audit report for external stakeholders."""
        raw_bd = getattr(audit, "scoring_breakdown", {})
        if hasattr(raw_bd, "model_dump"):
            breakdown = raw_bd.model_dump()
        elif isinstance(raw_bd, dict):
            breakdown = raw_bd
        else:
            breakdown = {}

        created_dt = getattr(audit, "created_at", None)
        if hasattr(created_dt, "strftime"):
            date_str = created_dt.strftime('%Y-%m-%d %H:%M UTC')
        else:
            date_str = str(created_dt) if created_dt else "Recent"

        report_lines = [
            f"# OmniGuide Campaign Launch Audit Report",
            f"**Campaign Name:** {audit.name} | **Brand:** {audit.brand_name}",
            f"**Evaluation Date:** {date_str}",
            f"**Launch Gate Status:** `{audit.status.upper()}` | **Launch Readiness Score:** `{audit.launch_readiness_score}/100`",
            f"**Active Launch Gate Policy:** `{audit.launch_gate_policy.upper()}`",
            "",
            "## 1. Executive Summary & Launch Gate Decision",
        ]

        if audit.status == "launch_ready":
            report_lines.append(
                f"> **STATUS: LAUNCH APPROVED.** All critical governance gates have passed. "
                f"The campaign complies with enterprise brand standards and registered corporate facts."
            )
        elif audit.status == "blocked":
            report_lines.append(
                f"> **STATUS: LAUNCH BLOCKED.** {audit.blocking_violations_count} critical/high violation(s) detected. "
                f"Publication is blocked under the active '{audit.launch_gate_policy}' launch gate policy until remediated."
            )
        else:
            report_lines.append(
                f"> **STATUS: NEEDS REVIEW.** The campaign has warnings or score below launch threshold. "
                f"Requires compliance officer sign-off before distribution."
            )

        report_lines.extend([
            "",
            "## 2. Deterministic Scoring Methodology",
            f"- **Baseline Score:** 100",
            f"- **High Severity Deductions (-25/ea):** -{breakdown.get('high_severity_deductions', 0)}",
            f"- **Medium Severity Deductions (-10/ea):** -{breakdown.get('medium_severity_deductions', 0)}",
            f"- **Low Severity Warnings (-4/ea):** -{breakdown.get('low_severity_deductions', 0)}",
            f"- **Cross-Channel Contradiction Deductions (-15/ea):** -{breakdown.get('cross_channel_deductions', 0)}",
            f"- **Remediation Points Restored:** +{breakdown.get('remediation_restored', 0)}",
            f"- **Final Computed Score:** **{audit.launch_readiness_score} / 100**",
            "",
            "## 3. Channel Breakdown & Risk Heatmap",
            "| Channel | Readiness Score | Status | Findings Count |",
            "| :--- | :---: | :---: | :---: |",
        ])

        for ch in audit.channel_contents:
            ch_findings = [f for f in audit.findings if f.channel == ch.channel]
            report_lines.append(f"| {ch.channel.capitalize()} | {ch.channel_readiness_score}/100 | `{ch.channel_status.upper()}` | {len(ch_findings)} |")

        if audit.cross_channel_issues:
            report_lines.extend([
                "",
                "## 4. Cross-Channel Contradictions & Discrepancies",
            ])
            for idx, raw_issue in enumerate(audit.cross_channel_issues):
                iss = raw_issue.model_dump() if hasattr(raw_issue, "model_dump") else raw_issue
                report_lines.extend([
                    f"### Issue 4.{idx+1}: {iss.get('issue_type', 'Conflict').replace('_', ' ').title()}",
                    f"- **Channels Affected:** {', '.join(iss.get('channels_involved', []))}",
                    f"- **Explanation:** {iss.get('description', '')}",
                    f"- **Recommended Harmonization:** {iss.get('suggested_harmonization', '')}",
                    ""
                ])

        report_lines.extend([
            "",
            "## 5. Prioritized Remediation Checklist & Findings",
            "| Severity | Channel | Category | Flagged Copy | Guideline Ref | Remediation Status |",
            "| :--- | :--- | :--- | :--- | :--- | :--- |",
        ])

        for f in audit.findings:
            report_lines.append(
                f"| `{f.severity}` | {f.channel.capitalize()} | {f.category} | \"{f.original_excerpt}\" | {f.guideline_ref or 'General'} | `{f.remediation_status.upper()}` |"
            )

        report_lines.extend([
            "",
            "---",
            "*Report generated by OmniGuide Brand Governance Platform. Evidence verified against stored corporate guidelines.*"
        ])

        return "\n".join(report_lines)

    def generate_audit_json(self, audit: Any) -> Dict[str, Any]:
        """Generates a structured, machine-readable JSON audit report matching persisted records."""
        raw_bd = getattr(audit, "scoring_breakdown", {})
        breakdown = raw_bd.model_dump() if hasattr(raw_bd, "model_dump") else (raw_bd if isinstance(raw_bd, dict) else {})
        created_dt = getattr(audit, "created_at", None)
        date_str = created_dt.isoformat() if hasattr(created_dt, "isoformat") else str(created_dt)

        high_findings = []
        medium_findings = []
        low_findings = []
        for f in getattr(audit, "findings", []):
            f_dict = {
                "id": f.id,
                "channel": f.channel,
                "category": f.category,
                "severity": f.severity,
                "original_excerpt": f.original_excerpt,
                "explanation": f.explanation,
                "guideline_ref": f.guideline_ref,
                "suggested_fix": f.suggested_fix,
                "evidence_status": f.evidence_status,
                "evidence_quote": f.evidence_quote,
                "source": getattr(f, "source", "deterministic"),
                "remediation_status": getattr(f, "remediation_status", "unresolved"),
                "remediation_notes": getattr(f, "remediation_notes", None)
            }
            if f.severity == "High":
                high_findings.append(f_dict)
            elif f.severity == "Medium":
                medium_findings.append(f_dict)
            else:
                low_findings.append(f_dict)

        channel_summaries = []
        for cc in getattr(audit, "channel_contents", []):
            channel_summaries.append({
                "channel": cc.channel,
                "readiness_score": cc.channel_readiness_score,
                "status": cc.channel_status,
                "findings_count": sum(1 for f in getattr(audit, "findings", []) if f.channel == cc.channel)
            })

        raw_issues = getattr(audit, "cross_channel_issues", []) or []
        cross_issues = [i.model_dump() if hasattr(i, "model_dump") else i for i in raw_issues]

        return {
            "report_id": f"REP-CAMP-{str(audit.id)[:8]}",
            "report_type": "Campaign Launch Governance Audit",
            "governance_policy_version": "OmniGuide Policy Engine v1.3.0",
            "campaign_id": audit.id,
            "campaign_name": audit.name,
            "brand_name": audit.brand_name,
            "target_audience": audit.target_audience,
            "evaluation_timestamp": date_str,
            "launch_gate_policy": audit.launch_gate_policy,
            "launch_gate_status": audit.status,
            "launch_readiness_score": audit.launch_readiness_score,
            "scoring_breakdown": breakdown,
            "blocking_violations_count": audit.blocking_violations_count,
            "warnings_count": audit.warnings_count,
            "remediated_count": audit.remediated_count,
            "channels_evaluated": audit.channels,
            "channel_summaries": channel_summaries,
            "cross_channel_issues": cross_issues,
            "findings_summary": {
                "total": len(getattr(audit, "findings", [])),
                "high": len(high_findings),
                "medium": len(medium_findings),
                "low": len(low_findings)
            },
            "findings_by_severity": {
                "high": high_findings,
                "medium": medium_findings,
                "low": low_findings
            }
        }

    # ---------------------------------------------------------
    # Internal Helpers
    # ---------------------------------------------------------

    def _classify_evidence_tier(self, finding: AIFindingItem) -> str:
        """Categorizes finding into transparent evidence tier."""
        if finding.category == "missing_approved_source":
            return "unsupported_claim"
        if finding.guideline_clause_identifier:
            return "verified_violation"
        if finding.category in ("tone_and_voice", "brand_consistency"):
            return "potential_violation"
        return "verified_violation"

    def _compute_channel_score(self, findings: List[CampaignFindingSchema]) -> int:
        score = 100
        for f in findings:
            if f.remediation_status in ("remediated", "waived"):
                continue
            if f.severity == "High":
                score -= 25
            elif f.severity == "Medium":
                score -= 10
            elif f.severity == "Low":
                score -= 4
        return max(0, min(100, score))

    def _calculate_launch_readiness_score(
        self,
        findings: List[CampaignFinding],
        cross_issues: List[CrossChannelIssue]
    ) -> ScoringBreakdown:
        baseline = 100
        high_ded = 0
        med_ded = 0
        low_ded = 0
        cross_ded = len(cross_issues) * 15
        restored = 0

        for f in findings:
            if f.channel == "cross_channel":
                continue
            deduction = 25 if f.severity == "High" else (10 if f.severity == "Medium" else 4)
            if f.remediation_status in ("remediated", "waived"):
                restored += deduction
            else:
                if f.severity == "High":
                    high_ded += 25
                elif f.severity == "Medium":
                    med_ded += 10
                elif f.severity == "Low":
                    low_ded += 4

        total_deductions = high_ded + med_ded + low_ded + cross_ded
        final_score = max(0, min(100, baseline - total_deductions + restored))

        formula_text = (
            f"Launch Readiness Score = Baseline (100) - High Violations (-{high_ded}) "
            f"- Medium Warnings (-{med_ded}) - Low Style Notes (-{low_ded}) "
            f"- Cross-Channel Contradictions (-{cross_ded}) + Remediated Points (+{restored}) = {final_score}/100"
        )

        return ScoringBreakdown(
            baseline_score=baseline,
            total_deductions=total_deductions,
            high_severity_deductions=high_ded,
            medium_severity_deductions=med_ded,
            low_severity_deductions=low_ded,
            cross_channel_deductions=cross_ded,
            remediation_restored=restored,
            final_score=final_score,
            scoring_formula_explanation=formula_text
        )

    def _evaluate_launch_gate(
        self,
        policy: str,
        score: int,
        findings: List[CampaignFinding]
    ) -> Tuple[str, int, int]:
        unresolved_high = [
            f for f in findings
            if f.severity == "High" and f.remediation_status not in ("remediated", "waived")
        ]
        unresolved_warnings = [
            f for f in findings
            if f.severity in ("Medium", "Low") and f.remediation_status not in ("remediated", "waived")
        ]

        blocking_count = len(unresolved_high)
        warnings_count = len(unresolved_warnings)

        if policy == "strict":
            if blocking_count > 0:
                return "blocked", blocking_count, warnings_count
            if warnings_count > 0 or score < 85:
                return "needs_review", blocking_count, warnings_count
            return "launch_ready", blocking_count, warnings_count

        elif policy == "standard":
            # Any critical violation blocks launch
            if blocking_count > 0:
                return "blocked", blocking_count, warnings_count
            if score < 75 or warnings_count >= 3:
                return "needs_review", blocking_count, warnings_count
            return "launch_ready", blocking_count, warnings_count

        else:  # permissive
            if blocking_count > 0 or score < 60:
                return "needs_review", blocking_count, warnings_count
            return "launch_ready", blocking_count, warnings_count

    def _detect_cross_channel_contradictions(
        self,
        channel_contents: Dict[str, str]
    ) -> List[CrossChannelIssue]:
        issues: List[CrossChannelIssue] = []
        metrics_by_channel: Dict[str, List[str]] = {}

        # Extract numerical metrics per channel
        num_pattern = re.compile(r'(\d+(?:\.\d+)?(?:%|ms|x|\$|\s*days|\s*hours|\s*minutes))', re.IGNORECASE)
        for ch, text in channel_contents.items():
            if not text:
                continue
            metrics_by_channel[ch] = num_pattern.findall(text)

        # 1. Check for contradictory uptime / performance metrics
        # e.g., one channel claims 99.9% while another claims 100% or 99.95%
        for ch1, metrics1 in metrics_by_channel.items():
            for ch2, metrics2 in metrics_by_channel.items():
                if ch1 >= ch2:
                    continue
                # compare percentage metrics
                pct1 = [m for m in metrics1 if "%" in m]
                pct2 = [m for m in metrics2 if "%" in m]
                if pct1 and pct2 and set(pct1) != set(pct2):
                    issues.append(CrossChannelIssue(
                        issue_type="contradictory_metric",
                        channels_involved=[ch1, ch2],
                        description=f"Conflicting percentage metrics asserted: '{', '.join(pct1)}' in {ch1} vs '{', '.join(pct2)}' in {ch2}.",
                        suggested_harmonization="Unify performance percentages across all channels to match your certified SLA in Approved Facts.",
                        severity="High"
                    ))

        # 2. Check for absolute guarantee contradiction vs SLA qualified
        guarantee_pattern = re.compile(r'\b(100%\s+guaranteed|guarantee(?:d)?|risk-free)\b', re.IGNORECASE)
        qualified_pattern = re.compile(r'\b(sla\s+terms|standard\s+sla|enterprise\s+agreement)\b', re.IGNORECASE)

        channels_with_guarantee = [ch for ch, text in channel_contents.items() if guarantee_pattern.search(text)]
        channels_with_qualified = [ch for ch, text in channel_contents.items() if qualified_pattern.search(text)]

        if channels_with_guarantee and channels_with_qualified:
            issues.append(CrossChannelIssue(
                issue_type="contradictory_claim",
                channels_involved=list(set(channels_with_guarantee + channels_with_qualified)),
                description=(
                    f"Messaging contradiction: Absolute outcome guarantee advertised on {', '.join(channels_with_guarantee)}, "
                    f"while {', '.join(channels_with_qualified)} specifies qualified contractual SLA terms."
                ),
                suggested_harmonization="Remove absolute 'guarantee' from consumer touchpoints and harmonize copy with SLA commitment phrasing.",
                severity="High"
            ))

        # 3. Check for promotional free claims vs mandatory paid / contract commitments
        free_pattern = re.compile(r'\b(completely\s+free|100%\s+free|free\s+forever|zero\s+cost|no\s+credit\s+card(?:\s+required)?)\b', re.IGNORECASE)
        contract_pattern = re.compile(r'\b(annual\s+contract|mandatory\s+annual|billed\s+annually|mandatory\s+contract|\$\d+[\d,]*\s*(?:per|\/)\s*year)\b', re.IGNORECASE)

        channels_with_free = [ch for ch, text in channel_contents.items() if free_pattern.search(text)]
        channels_with_contract = [ch for ch, text in channel_contents.items() if contract_pattern.search(text)]

        if channels_with_free and channels_with_contract:
            issues.append(CrossChannelIssue(
                issue_type="contradictory_pricing_terms",
                channels_involved=list(set(channels_with_free + channels_with_contract)),
                description=(
                    f"Commercial terms contradiction: Free or zero-cost tier advertised on {', '.join(channels_with_free)}, "
                    f"while {', '.join(channels_with_contract)} specifies mandatory paid annual commitment."
                ),
                suggested_harmonization="Harmonize pricing copy across channels. Clarify trial limits or freemium boundaries to prevent consumer protection violations.",
                severity="High"
            ))

        return issues

    def _build_response(self, audit: CampaignAudit) -> CampaignAuditResponse:
        findings_schemas: List[CampaignFindingSchema] = []
        for f in audit.findings:
            findings_schemas.append(CampaignFindingSchema(
                id=f.id,
                channel=f.channel,
                category=f.category,
                severity=f.severity,
                original_excerpt=f.original_excerpt,
                explanation=f.explanation,
                guideline_ref=f.guideline_ref,
                suggested_fix=f.suggested_fix,
                evidence_status=f.evidence_status,
                evidence_quote=f.evidence_quote,
                source=f.source,
                remediation_status=f.remediation_status,
                remediation_notes=f.remediation_notes
            ))

        channel_results: List[ChannelContentResult] = []
        for cc in audit.channel_contents:
            ch_findings = [fs for fs in findings_schemas if fs.channel == cc.channel]
            channel_results.append(ChannelContentResult(
                id=cc.id,
                channel=cc.channel,
                original_content=cc.original_content,
                revised_content=cc.revised_content,
                channel_readiness_score=cc.channel_readiness_score,
                channel_status=cc.channel_status,
                findings=ch_findings
            ))

        raw_issues = audit.cross_channel_issues or []
        cross_channel_issues = [CrossChannelIssue(**i) for i in raw_issues]
        scoring_data = audit.scoring_breakdown or {}

        return CampaignAuditResponse(
            id=audit.id,
            name=audit.name,
            brand_name=audit.brand_name,
            target_audience=audit.target_audience,
            channels=audit.channels,
            launch_gate_policy=audit.launch_gate_policy,
            status=audit.status,
            launch_readiness_score=audit.launch_readiness_score,
            blocking_violations_count=audit.blocking_violations_count,
            warnings_count=audit.warnings_count,
            remediated_count=audit.remediated_count,
            scoring_breakdown=ScoringBreakdown(**scoring_data),
            cross_channel_issues=cross_channel_issues,
            channel_contents=channel_results,
            findings=findings_schemas,
            created_at=audit.created_at,
            updated_at=audit.updated_at
        )


campaign_simulator = CampaignSimulatorService()
