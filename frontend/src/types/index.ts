export interface GuidelineClause {
  id: string;
  document_id: string;
  clause_identifier: string;
  clause_text: string;
  section_heading?: string | null;
  page_number?: number | null;
}

export interface GuidelineDocument {
  id: string;
  title: string;
  filename: string;
  is_demo: boolean;
  created_at: string;
  clause_count?: number;
  clauses?: GuidelineClause[];
}

export interface ApprovedFact {
  id: string;
  fact_text: string;
  category?: string | null;
  source_reference?: string | null;
  created_at: string;
}

export type FindingCategory =
  | 'unsupported_superlative'
  | 'banned_term'
  | 'required_terminology'
  | 'unverified_claim'
  | 'tone_and_voice'
  | 'brand_consistency'
  | 'missing_approved_source';

export type SeverityLevel = 'High' | 'Medium' | 'Low';
export type EvidenceStatus = 'verified' | 'insufficient_evidence' | 'missing_approved_source' | 'deterministic_rule';
export type DecisionStatus = 'pending' | 'accepted' | 'edited' | 'dismissed';
export type ReviewOverallStatus = 'compliant' | 'needs_review' | 'resolved' | 'flagged';

export interface Finding {
  id: string;
  review_id: string;
  category: FindingCategory | string;
  severity: SeverityLevel;
  original_excerpt: string;
  explanation: string;
  guideline_clause_id?: string | null;
  guideline_clause_identifier?: string | null;
  guideline_clause_text?: string | null;
  guideline_document_name?: string | null;
  guideline_page_number?: number | null;
  evidence_status: EvidenceStatus;
  suggested_fix: string;
  decision_status: DecisionStatus;
  user_custom_fix?: string | null;
}

export interface ReviewAction {
  id: string;
  review_id: string;
  finding_id?: string | null;
  action_type: string;
  previous_value?: string | null;
  new_value?: string | null;
  created_at: string;
}

export interface Review {
  id: string;
  title: string;
  content_type: string;
  original_content: string;
  revised_content: string;
  analysis_mode: string;
  overall_status: ReviewOverallStatus;
  created_at: string;
  updated_at: string;
  findings: Finding[];
  actions: ReviewAction[];
}

export interface ReviewListItem {
  id: string;
  title: string;
  content_type: string;
  overall_status: ReviewOverallStatus;
  analysis_mode: string;
  created_at: string;
  findings_count: number;
  high_severity_count: number;
  resolved_count: number;
}

export interface SystemStatus {
  status: string;
  version: string;
  database_connected: boolean;
  database_dialect: string;
  ai_provider: string;
  gemini_configured: boolean;
  groq_configured: boolean;
  guidelines_count: number;
  clauses_count: number;
  approved_facts_count: number;
  reviews_count: number;
}

export interface DemoScenario {
  id: string;
  title: string;
  content_type: string;
  content: string;
  campaign_context: string;
  description: string;
  expected_findings: string[];
}
