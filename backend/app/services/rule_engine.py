import re
from dataclasses import dataclass
from typing import List, Optional
from app.schemas.analysis import AIFindingItem


@dataclass
class DeterministicRule:
    category: str
    severity: str
    pattern: re.Pattern
    explanation_template: str
    suggested_fix_template: str
    guideline_ref: Optional[str] = None


# Core deterministic governance rules
DETERMINISTIC_RULES: List[DeterministicRule] = [
    # 1. Unsupported Superlatives
    DeterministicRule(
        category="unsupported_superlative",
        severity="High",
        pattern=re.compile(r'(?<!\w)(#1|no\.?\s*1|number\s*(?:one|1))\b', re.IGNORECASE),
        explanation_template="Claiming '#1' or 'Number One' status without an audited, published 3rd-party ranking violates consumer protection standards and brand credibility guidelines.",
        suggested_fix_template="Replace with a defensible, verified capability claim (e.g., 'A leading platform' or reference a verified metric).",
        guideline_ref="SEC-1.1"
    ),
    DeterministicRule(
        category="unsupported_superlative",
        severity="High",
        pattern=re.compile(r'\b(fastest|quickest|highest|lowest|cheapest|greatest|most powerful)\b', re.IGNORECASE),
        explanation_template="Absolute superlative '{match}' requires substantiated, independent comparative benchmark data. Unsubstantiated absolutes expose the brand to regulatory censure.",
        suggested_fix_template="Use qualified, evidence-backed phrasing (e.g., 'Engineered for high performance' or cite benchmark latency).",
        guideline_ref="SEC-1.2"
    ),
    DeterministicRule(
        category="unsupported_superlative",
        severity="Medium",
        pattern=re.compile(r'\b(world\'?s\s+best|best-in-class|best\s+in\s+class|industry-leading|unrivaled|unmatched|the\s+ultimate)\b', re.IGNORECASE),
        explanation_template="Subjective superlative '{match}' lacks objective verifiability and dilutes brand authority under Section 1.3.",
        suggested_fix_template="Replace with specific, observable value propositions.",
        guideline_ref="SEC-1.3"
    ),
    DeterministicRule(
        category="unsupported_superlative",
        severity="High",
        pattern=re.compile(r'\b(100%\s+guaranteed|guarantee(?:d)?|risk-free|fail-safe)\b', re.IGNORECASE),
        explanation_template="Absolute outcome guarantees ('{match}') create legal warranty liabilities unless backed by an explicit SLA contract.",
        suggested_fix_template="Rephrase to commitment-based language (e.g., 'Committed to enterprise reliability' or 'Protected under our standard SLA').",
        guideline_ref="SEC-2.1"
    ),

    # 2. Banned / Prohibited Terminology
    DeterministicRule(
        category="banned_term",
        severity="High",
        pattern=re.compile(r'\b(cheap|dirt\s*cheap|hacky|secret\s*sauce|magic\s*bullet|silver\s*bullet)\b', re.IGNORECASE),
        explanation_template="Informal or commoditizing term '{match}' is explicitly prohibited by brand voice guidelines as it diminishes enterprise product perception.",
        suggested_fix_template="Use professional terminology such as 'cost-effective', 'high-efficiency', or 'proprietary methodology'.",
        guideline_ref="SEC-3.1"
    ),
    DeterministicRule(
        category="banned_term",
        severity="Medium",
        pattern=re.compile(r'\b(revolutionary|disruptive|game-changing)\b', re.IGNORECASE),
        explanation_template="Overused marketing buzzword '{match}' violates our direct, evidence-based communication standard.",
        suggested_fix_template="State the concrete technological advancement instead of using hype adjectives.",
        guideline_ref="SEC-3.2"
    ),

    # 3. Missing Required Disclaimers & Promotional Claims
    DeterministicRule(
        category="missing_required_disclaimer",
        severity="Medium",
        pattern=re.compile(r'\b(free\s+trial|completely\s+free|100%\s+free)\b', re.IGNORECASE),
        explanation_template="Promotional claim '{match}' requires an explicit disclaimer qualification (e.g., 'Terms & eligibility apply') to prevent misleading advertising sanctions.",
        suggested_fix_template="Qualify with terms: '{match} (terms apply)'.",
        guideline_ref="SEC-2.3"
    ),

    # 4. Contradictory Pricing / Mandatory Fee Assertions
    DeterministicRule(
        category="contradictory_campaign_claims",
        severity="High",
        pattern=re.compile(r'\b(mandatory\s+annual|annual\s+enterprise\s+contract|mandatory\s+contract)\b', re.IGNORECASE),
        explanation_template="Asserting '{match}' in promotional contexts creates contractual ambiguity unless paired with explicit commercial terms.",
        suggested_fix_template="Specify clear enterprise tier terms.",
        guideline_ref="SEC-2.4"
    ),

    # 5. Required Brand Terminology
    DeterministicRule(
        category="required_terminology",
        severity="Low",
        pattern=re.compile(r'\b(ai-powered|ai\s+driven)\b', re.IGNORECASE),
        explanation_template="Style guideline recommends using 'AI-assisted' or 'AI-native' to accurately reflect human-in-the-loop governance rather than automated takeover.",
        suggested_fix_template="Use 'AI-assisted' or 'AI-governed'.",
        guideline_ref="SEC-4.1"
    )
]


class DeterministicRuleEngine:
    def __init__(self, custom_rules: Optional[List[DeterministicRule]] = None):
        self.rules = (custom_rules or []) + DETERMINISTIC_RULES

    def run_checks(
        self,
        text: str,
        approved_facts: Optional[List[str]] = None
    ) -> List[AIFindingItem]:
        """
        Executes all deterministic regex rules and cross-checks approved facts against the submitted copy.
        """
        findings: List[AIFindingItem] = []
        approved_facts_list = approved_facts or []

        # 1. Regex rule checks
        for rule in self.rules:
            for match in rule.pattern.finditer(text):
                matched_str = match.group(0)
                # Compute replacement
                explanation = rule.explanation_template.format(match=matched_str)
                suggested_fix = rule.suggested_fix_template.format(match=matched_str)

                # Contextual replacement attempt
                refined_fix = self._build_quick_fix(text, match.start(), match.end(), matched_str, rule.category)

                findings.append(AIFindingItem(
                    category=rule.category,
                    severity=rule.severity,
                    original_excerpt=matched_str,
                    explanation=explanation,
                    guideline_clause_identifier=rule.guideline_ref,
                    guideline_clause_text=f"Rule: Brand governance strictly regulates {rule.category.replace('_', ' ')}.",
                    suggested_fix=refined_fix if refined_fix else suggested_fix,
                    evidence_status="deterministic_rule"
                ))

        # 2. Quantitative / Metric claim verification against Approved Facts
        # Look for numbers with %, ms, x, or large figures like 99.9%, 10x, 42ms, $100M
        metric_pattern = re.compile(r'(?<!\w)(\d+(?:\.\d+)?(?:%|ms|x|\s*percent|\s*million|\s*billion|\s*times))(?!\w)', re.IGNORECASE)
        for metric_match in metric_pattern.finditer(text):
            metric_str = metric_match.group(0)
            
            # Check if this metric is grounded in approved facts
            is_grounded = any(metric_str.lower() in fact.lower() for fact in approved_facts_list)
            
            if not is_grounded:
                findings.append(AIFindingItem(
                    category="missing_approved_source",
                    severity="Medium",
                    original_excerpt=metric_str,
                    explanation=f"Specific quantitative metric '{metric_str}' was not found in the approved corporate facts repository. Public claims must cite a registered corporate source.",
                    guideline_clause_identifier="SEC-2.2",
                    guideline_clause_text="Section 2.2: All quantitative metrics and performance benchmarks must correspond to an active record in the approved facts repository.",
                    suggested_fix=f"Verify '{metric_str}' against audit reports or register it in the Approved Facts library before publishing.",
                    evidence_status="missing_approved_source"
                ))

        return findings

    def _build_quick_fix(self, full_text: str, start: int, end: int, matched: str, category: str) -> str:
        """Constructs an intelligent in-place replacement suggestion."""
        replacements = {
            "#1": "a premier",
            "no. 1": "a leading",
            "number 1": "a trusted",
            "number one": "a proven",
            "fastest": "high-performance",
            "quickest": "rapid",
            "cheapest": "cost-effective",
            "cheap": "accessible",
            "world's best": "industry-standard",
            "best in class": "enterprise-grade",
            "best-in-class": "enterprise-grade",
            "100% guaranteed": "backed by our uptime SLA",
            "guaranteed": "engineered for reliability",
            "revolutionary": "modernized",
            "silver bullet": "systematic solution",
            "magic bullet": "reliable platform",
            "ai-powered": "AI-assisted",
        }
        lower = matched.lower()
        if lower in replacements:
            return replacements[lower]
        return ""


rule_engine = DeterministicRuleEngine()
