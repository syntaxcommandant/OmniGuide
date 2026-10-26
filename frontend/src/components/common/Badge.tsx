import React from 'react';
import { SeverityLevel, DecisionStatus, ReviewOverallStatus, EvidenceStatus } from '../../types';
import { CheckCircle2, AlertTriangle, AlertCircle, Cpu, FileQuestion, Check, X, Edit3 } from 'lucide-react';

interface SeverityBadgeProps {
  severity: SeverityLevel | string;
  size?: 'sm' | 'md';
}

export const SeverityBadge: React.FC<SeverityBadgeProps> = ({ severity, size = 'md' }) => {
  const isHigh = severity.toLowerCase() === 'high';
  const isMed = severity.toLowerCase() === 'medium';
  
  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs font-semibold';

  if (isHigh) {
    return (
      <span className={`inline-flex items-center gap-1 rounded-full border border-rose-500/40 bg-rose-500/15 text-rose-300 ${sizeClasses}`}>
        <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
        High Severity
      </span>
    );
  }
  if (isMed) {
    return (
      <span className={`inline-flex items-center gap-1 rounded-full border border-amber-500/40 bg-amber-500/15 text-amber-300 ${sizeClasses}`}>
        <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
        Medium Severity
      </span>
    );
  }
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border border-sky-500/40 bg-sky-500/15 text-sky-300 ${sizeClasses}`}>
      <CheckCircle2 className="w-3.5 h-3.5 text-sky-400" />
      Low Severity
    </span>
  );
};

interface StatusBadgeProps {
  status: ReviewOverallStatus | string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  switch (status.toLowerCase()) {
    case 'compliant':
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-teal-500/40 bg-teal-500/15 text-teal-300 text-xs font-semibold">
          <CheckCircle2 className="w-3.5 h-3.5 text-teal-400" />
          Compliant
        </span>
      );
    case 'resolved':
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-emerald-500/40 bg-emerald-500/15 text-emerald-300 text-xs font-semibold">
          <Check className="w-3.5 h-3.5 text-emerald-400" />
          Resolved
        </span>
      );
    case 'needs_review':
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-amber-500/40 bg-amber-500/15 text-amber-300 text-xs font-semibold">
          <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
          Needs Human Review
        </span>
      );
    case 'flagged':
    default:
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-rose-500/40 bg-rose-500/15 text-rose-300 text-xs font-semibold">
          <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
          Flagged Violations
        </span>
      );
  }
};

interface DecisionBadgeProps {
  status: DecisionStatus;
}

export const DecisionBadge: React.FC<DecisionBadgeProps> = ({ status }) => {
  switch (status) {
    case 'accepted':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full border border-teal-500/40 bg-teal-500/20 text-teal-300 text-xs font-medium">
          <Check className="w-3 h-3 text-teal-400" />
          Accepted Fix
        </span>
      );
    case 'edited':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full border border-indigo-500/40 bg-indigo-500/20 text-indigo-300 text-xs font-medium">
          <Edit3 className="w-3 h-3 text-indigo-400" />
          Custom Edited
        </span>
      );
    case 'dismissed':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full border border-slate-700 bg-slate-800 text-slate-400 text-xs font-medium">
          <X className="w-3 h-3" />
          Dismissed
        </span>
      );
    case 'pending':
    default:
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full border border-amber-500/30 bg-amber-500/10 text-amber-300/80 text-xs font-medium">
          Pending Decision
        </span>
      );
  }
};

interface EvidenceBadgeProps {
  status: EvidenceStatus | string;
}

export const EvidenceBadge: React.FC<EvidenceBadgeProps> = ({ status }) => {
  switch (status) {
    case 'verified':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded border border-teal-500/30 bg-teal-500/10 text-teal-300 text-xs font-mono">
          <CheckCircle2 className="w-3 h-3 text-teal-400" />
          Ground Truth Cited
        </span>
      );
    case 'missing_approved_source':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded border border-amber-500/30 bg-amber-500/10 text-amber-300 text-xs font-mono">
          <AlertTriangle className="w-3 h-3 text-amber-400" />
          No Approved Fact Match
        </span>
      );
    case 'deterministic_rule':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded border border-blue-500/30 bg-blue-500/10 text-blue-300 text-xs font-mono">
          <Cpu className="w-3 h-3 text-blue-400" />
          Deterministic Rule
        </span>
      );
    case 'insufficient_evidence':
    default:
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded border border-slate-700 bg-slate-800/80 text-slate-400 text-xs font-mono">
          <FileQuestion className="w-3 h-3 text-slate-500" />
          Unverified Citation
        </span>
      );
  }
};
