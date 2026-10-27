import json
import logging
from typing import List, Optional
from google import genai
from google.genai import types
from app.core.config import settings
from app.schemas.analysis import AIAnalysisResult, AIFindingItem
from app.services.retrieval import RetrievedClause

logger = logging.getLogger(__name__)


class GeminiServiceError(Exception):
    """Raised when Gemini API encounters a failure."""
    pass


class GeminiAnalysisService:
    def __init__(self):
        self._connectivity_cache: Optional[tuple] = None

    @property
    def api_key(self) -> str:
        return settings.GEMINI_API_KEY

    @property
    def model_name(self) -> str:
        return settings.GEMINI_MODEL

    def is_configured(self) -> bool:
        return bool(self.api_key and self.api_key.strip() and self.api_key != "YOUR_GEMINI_API_KEY_HERE")

    def check_connectivity(self, force: bool = False) -> tuple[bool, str]:
        """
        Performs a real backend connectivity check to Google Gemini API.
        Does not generate tokens or perform inference; verifies model access.
        Caches result for 60 seconds unless force=True.
        """
        import time
        now = time.time()
        if not force and self._connectivity_cache:
            cache_time, cached_ok, cached_msg = self._connectivity_cache
            if now - cache_time < 60:
                return cached_ok, cached_msg

        if not self.is_configured():
            res = (False, "GEMINI_API_KEY is not configured in backend environment.")
            self._connectivity_cache = (now, res[0], res[1])
            return res

        try:
            client = genai.Client(api_key=self.api_key)
            # Lightweight verification without generating tokens
            client.models.get(model=self.model_name)
            res = (True, f"Connected to {self.model_name} successfully.")
            self._connectivity_cache = (now, res[0], res[1])
            return res
        except Exception as e:
            err_msg = str(e)
            logger.warning(f"Gemini connectivity check failed: {err_msg}")
            res = (False, f"Gemini connection failed: {err_msg}")
            self._connectivity_cache = (now, res[0], res[1])
            return res

    def analyze_marketing_content(
        self,
        content: str,
        content_type: str,
        retrieved_clauses: List[RetrievedClause],
        approved_facts: List[str],
        campaign_context: Optional[str] = None
    ) -> AIAnalysisResult:
        """
        Executes brand governance analysis using Gemini Flash with structured JSON output.
        """
        if not self.is_configured():
            raise GeminiServiceError(
                "Gemini API key is not configured. Please set GEMINI_API_KEY in your environment variables "
                "or switch to Deterministic Review Mode in Settings."
            )

        client = genai.Client(api_key=self.api_key)

        # Build clear grounding prompt with retrieved clauses and approved facts
        clauses_context = "\n".join([
            f"[{c.clause_identifier}] (Doc: {c.document_name}, Page: {c.page_number or 'N/A'})\nText: {c.clause_text}"
            for c in retrieved_clauses
        ]) if retrieved_clauses else "No specific guideline clauses retrieved."

        approved_facts_context = "\n".join([
            f"- {fact}" for fact in approved_facts
        ]) if approved_facts else "No approved facts recorded in corporate library."

        prompt = f"""You are OmniGuide, an expert AI Brand Governance & Marketing Compliance Auditor.
Your core principle is: "AI brand governance that explains, not just rejects."

You assist human marketers by identifying non-compliant or risky claims in submitted copy, citing EXACT guideline clauses, explaining the reasoning, and proposing defensible, high-converting alternative wording that PRESERVES the original marketing intent.

### SUBMITTED CONTENT FOR AUDIT:
- Content Type: {content_type}
- Campaign Context: {campaign_context or 'General marketing release'}
- Text to Review:
\"\"\"
{content}
\"\"\"

### AUTHORIZED GUIDELINE CLAUSES (GROUND TRUTH):
Only cite clause identifiers that appear in this list. DO NOT hallucinate or invent clause numbers or guideline text!
{clauses_context}

### REGISTERED APPROVED CORPORATE FACTS:
Any specific performance metric or quantitative claim not supported by this list must be flagged as 'missing_approved_source' or 'unverified_claim'.
{approved_facts_context}

### AUDIT INSTRUCTIONS:
1. Examine the submitted copy thoroughly.
2. Identify any unsupported superlatives (e.g. '#1', 'fastest', 'cheapest', 'best in class'), banned buzzwords, absolute guarantees, unverified claims, or tone deviations.
3. For each finding:
   - 'category': choose from 'unsupported_superlative', 'banned_term', 'required_terminology', 'unverified_claim', 'tone_and_voice', 'missing_approved_source'.
   - 'severity': 'High' (regulatory/legal liability or blatant guideline violation), 'Medium' (unsubstantiated claims/buzzwords), 'Low' (minor terminology or style suggestion).
   - 'original_excerpt': copy the exact substring from the submitted text.
   - 'explanation': explain in 2-3 clear sentences why this matters and how it violates the standard.
   - 'guideline_clause_identifier': the exact clause identifier from the list above (e.g., 'SEC-1.1') or null if not applicable.
   - 'guideline_clause_text': quote the relevant portion from the clause.
   - 'suggested_fix': propose an actionable, intent-preserving rewrite that resolves the issue while keeping marketing appeal.
   - 'evidence_status': 'verified' (if backed by a real retrieved clause), 'missing_approved_source' (if metric lacks registered corporate fact), or 'insufficient_evidence'.
4. Formulate 'revised_draft': A complete rewritten version of the submitted text incorporating all suggested fixes seamlessly.
5. Provide 'overall_assessment': A concise executive summary of the review.
6. Set 'is_compliant': true if no High or Medium issues are present, false otherwise.
"""

        try:
            response = client.models.generate_content(
                model=self.model_name,
                contents=prompt,
                config=types.GenerateContentConfig(
                    response_mime_type="application/json",
                    response_schema=AIAnalysisResult,
                    temperature=0.1,  # Low temperature for deterministic governance accuracy
                ),
            )

            # Parse and validate response
            if not response.text:
                raise GeminiServiceError("Empty response returned from Gemini API.")

            data = json.loads(response.text)
            result = AIAnalysisResult.model_validate(data)
            return result

        except Exception as e:
            logger.error(f"Gemini analysis invocation failed: {str(e)}")
            raise GeminiServiceError(f"Gemini AI processing error: {str(e)}")


gemini_service = GeminiAnalysisService()
