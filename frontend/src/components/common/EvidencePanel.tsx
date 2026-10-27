import React, { useState } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  FileText,
  Database,
  Cpu,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Info,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  BookOpen
} from 'lucide-react';
import { SeverityBadge } from './Badge';

export type EvidenceTier = 'VERIFIED' | 'UNSUPPORTED' | 'CONTRADICTED' | 'NEEDS_HUMAN_REVIEW';

export interface EvidenceFindingData {
  id: string;
  category: string;
  severity: 'High' | 'Medium' | 'Low';
  original_excerpt: string;
  explanation: string;
  guideline_ref?: string | null;
  guideline_clause_text?: string | null;
  document_name?: string | null;
  page_number?: number | null;
  suggested_fix: string;
  evidence_status: string;
  evidence_tier?: string;
  evidence_provenance?: any;
  source?: 'deterministic' | 'ai' | string;
  decision_status?: string;
  user_custom_fix?: string | null;
}

interface EvidencePanelProps {
  finding: EvidenceFindingData;
  defaultExpanded?: boolean;
}

export const EvidencePanel: React.FC<EvidencePanelProps> = ({
  finding,
  defaultExpanded = false
}) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  // Normalize evidence classification tier into 4 standard tiers
  const tier: EvidenceTier = (() => {
    const raw = (finding.evidence_tier || finding.evidence_status || '').toUpperCase();
    if (raw.includes('CONTRADICT')) return 'CONTRADICTED';
    if (raw.includes('UNSUPPORTED') || raw.includes('MISSING_APPROVED_SOURCE')) return 'UNSUPPORTED';
    if (raw.includes('REVIEW') || raw.includes('POTENTIAL') || raw.includes('TONE_AND_VOICE')) return 'NEEDS_HUMAN_REVIEW';
    return 'VERIFIED';
  })();

  const tierMeta = {
    VERIFIED: {
      label: 'VERIFIED VIOLATION',
      color: 'bg-red-50 text-red-800 border-red-200',
      icon: ShieldAlert,
      badge: 'Grounded against Brand Policy',
      desc: 'This claim directly breaches an authorized clause in your indexed brand guidelines.'
    },
    UNSUPPORTED: {
      label: 'UNSUPPORTED CLAIM',
      color: 'bg-amber-50 text-amber-800 border-amber-200',
      icon: AlertTriangle,
      badge: 'Missing Corporate Fact Citation',
      desc: 'Not necessarily factually false, but currently lacks the audited corporate record required for publication.'
    },
    CONTRADICTED: {
      label: 'CONTRADICTED CLAIM',
      color: 'bg-purple-50 text-purple-800 border-purple-200',
      icon: ShieldAlert,
      badge: 'Contradicts Published Terms / SLA',
      desc: 'This assertion directly conflicts with published terms, contractual SLAs, or claims in another channel.'
    },
    NEEDS_HUMAN_REVIEW: {
      label: 'NEEDS HUMAN REVIEW',
      color: 'bg-blue-50 text-blue-800 border-blue-200',
      icon: Info,
      badge: 'Editorial Discretion Required',
      desc: 'Subjective tone, voice, or contextual claim requiring human reviewer evaluation.'
    }
  }[tier];

  const TierIcon = tierMeta.icon;
  const isAI = finding.source === 'ai';

  return (
    <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-2xs transition-all">
      {/* Top Header Strip */}
      <div className="p-4 bg-slate-50/60 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          <SeverityBadge severity={finding.severity} />

          {/* Evidence Tier Badge */}
          <span className={`px-2.5 py-0.5 rounded-md text-[11px] font-semibold border flex items-center gap-1.5 ${tierMeta.color}`}>
            <TierIcon className="w-3 h-3 shrink-0" />
            <span>{tierMeta.label}</span>
          </span>

          {/* Engine Source Attribution Badge */}
          <span className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-slate-100 text-slate-700 border border-slate-200 flex items-center gap-1">
            {isAI ? (
              <>
                <Sparkles className="w-3 h-3 text-teal-600" />
                <span>Google Gemini Flash</span>
              </>
            ) : (
              <>
                <Cpu className="w-3 h-3 text-slate-600" />
                <span>Deterministic Rule Engine</span>
              </>
            )}
          </span>
        </div>

        {/* Clause Citation Pill */}
        {finding.guideline_ref && (
          <span className="text-[11px] font-mono font-bold text-teal-800 bg-teal-50 px-2.5 py-1 rounded-md border border-teal-200">
            {finding.guideline_ref}
          </span>
        )}
      </div>

      {/* Flagged Excerpt & Plain-English Explanation */}
      <div className="p-4 space-y-3">
        <div>
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
            Flagged Marketing Text
          </div>
          <div className="p-2.5 rounded-lg bg-red-50/60 border border-red-100 text-xs text-red-950 font-mono font-medium">
            "{finding.original_excerpt}"
          </div>
        </div>

        <div>
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
            Governance Analysis
          </div>
          <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
            {finding.explanation}
          </p>
        </div>

        {/* Suggested Fix */}
        <div className="p-3 rounded-lg bg-teal-50/70 border border-teal-100">
          <div className="text-[11px] font-bold text-teal-800 uppercase tracking-wider mb-1 flex items-center justify-between">
            <span>Recommended Compliant Revision</span>
            <span className="text-[10px] text-teal-700 font-normal">Intent-Preserving</span>
          </div>
          <div className="text-xs sm:text-sm font-semibold text-teal-950">
            "{finding.user_custom_fix || finding.suggested_fix}"
          </div>
        </div>
      </div>

      {/* Expandable Ground-Truth Evidence Drawer */}
      <div className="border-t border-slate-100 bg-slate-50/40">
        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full px-4 py-2.5 text-xs font-semibold text-slate-600 hover:text-slate-900 flex items-center justify-between transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-1.5">
            <BookOpen className="w-3.5 h-3.5 text-teal-600" />
            <span>Traceable Policy Grounding & Evidence Details</span>
          </div>
          {isExpanded ? (
            <ChevronUp className="w-4 h-4 text-slate-400" />
          ) : (
            <ChevronDown className="w-4 h-4 text-slate-400" />
          )}
        </button>

        {isExpanded && (
          <div className="p-4 pt-2 space-y-3 border-t border-slate-100 text-xs text-slate-700 animate-fadeIn">
            {/* Tier context note */}
            <div className="p-2.5 rounded-md bg-white border border-slate-200 flex items-start gap-2">
              <Info className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-slate-900">{tierMeta.badge}: </span>
                <span className="text-slate-600">{tierMeta.desc}</span>
              </div>
            </div>

            {/* Quoted Clause Evidence */}
            {finding.guideline_clause_text && (
              <div className="space-y-1">
                <div className="text-[11px] font-semibold text-slate-500 flex items-center justify-between">
                  <span>Cited Policy Text:</span>
                  <span>{finding.document_name ? `${finding.document_name} (p. ${finding.page_number || '1'})` : 'Brand Governance Standard'}</span>
                </div>
                <blockquote className="p-2.5 rounded-md bg-white border border-slate-200 text-slate-800 italic leading-relaxed">
                  "{finding.guideline_clause_text}"
                </blockquote>
              </div>
            )}

            {/* Evidence Missing Clarification for Unsupported Claims */}
            {tier === 'UNSUPPORTED' && (
              <div className="p-2.5 rounded-md bg-amber-50/80 border border-amber-200 text-amber-900 text-xs">
                <strong>Why this claim is flagged:</strong> OmniGuide queried your active Approved Corporate Facts library for verifiable evidence of this metric and found no matching audit certification. <em>Unsupported does not mean the claim is factually false</em>, but external publication requires documented substantiation.
              </div>
            )}

            {/* Contradicted Claim Clarification */}
            {tier === 'CONTRADICTED' && (
              <div className="p-2.5 rounded-md bg-purple-50/80 border border-purple-200 text-purple-900 text-xs">
                <strong>Contradiction Warning:</strong> This assertion conflicts with explicit terms, SLAs, or contractual requirements specified in your brand guidelines or across campaign channels.
              </div>
            )}

            {/* Immutability & Audit Trail Status */}
            <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-500">
              <span>Original Copy State: <strong className="text-slate-700">Immutable (Audit Trail Preserved)</strong></span>
              <span>Reviewer Decision: <strong className="text-slate-700 capitalize">{finding.decision_status || 'Pending'}</strong></span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
