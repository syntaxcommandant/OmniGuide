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
      <span className={`inline-flex items-center gap-1.5 rounded-md border border-red-200 bg-red-50 text-red-800 font-medium ${sizeClasses}`}>
        <AlertCircle className="w-3.5 h-3.5 text-red-600 shrink-0" />
        Critical
      </span>
    );
  }
  if (isMed) {
    return (
      <span className={`inline-flex items-center gap-1.5 rounded-md border border-amber-200 bg-amber-50 text-amber-800 font-medium ${sizeClasses}`}>
        <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
        Warning
      </span>
    );
  }
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-slate-50 text-slate-700 font-medium ${sizeClasses}`}>
      <CheckCircle2 className="w-3.5 h-3.5 text-slate-500 shrink-0" />
      Notice
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
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-emerald-200 bg-emerald-50 text-emerald-800 text-xs font-semibold">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
          Compliant
        </span>
      );
    case 'resolved':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-teal-200 bg-teal-50 text-teal-800 text-xs font-semibold">
          <Check className="w-3.5 h-3.5 text-teal-600 shrink-0" />
          Resolved
        </span>
      );
    case 'needs_review':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-amber-200 bg-amber-50 text-amber-800 text-xs font-semibold">
          <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
          Needs Review
        </span>
      );
    case 'flagged':
    default:
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-red-200 bg-red-50 text-red-800 text-xs font-semibold">
          <AlertCircle className="w-3.5 h-3.5 text-red-600 shrink-0" />
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
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md border border-teal-200 bg-teal-50 text-teal-800 text-xs font-medium">
          <Check className="w-3 h-3 text-teal-600 shrink-0" />
          Accepted Fix
        </span>
      );
    case 'edited':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md border border-indigo-200 bg-indigo-50 text-indigo-800 text-xs font-medium">
          <Edit3 className="w-3 h-3 text-indigo-600 shrink-0" />
          Custom Edited
        </span>
      );
    case 'dismissed':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md border border-slate-200 bg-slate-100 text-slate-600 text-xs font-medium">
          <X className="w-3 h-3 text-slate-500 shrink-0" />
          Dismissed
        </span>
      );
    case 'pending':
    default:
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md border border-amber-200 bg-amber-50 text-amber-700 text-xs font-medium">
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
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded border border-teal-200 bg-teal-50 text-teal-800 text-xs font-medium font-sans">
          <CheckCircle2 className="w-3 h-3 text-teal-600 shrink-0" />
          Clause Grounded
        </span>
      );
    case 'missing_approved_source':
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded border border-amber-200 bg-amber-50 text-amber-800 text-xs font-medium font-sans">
          <AlertTriangle className="w-3 h-3 text-amber-600 shrink-0" />
          Requires Evidence
        </span>
      );
    case 'deterministic_rule':
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded border border-blue-200 bg-blue-50 text-blue-800 text-xs font-medium font-sans">
          <Cpu className="w-3 h-3 text-blue-600 shrink-0" />
          Deterministic Rule
        </span>
      );
    case 'insufficient_evidence':
    default:
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded border border-slate-200 bg-slate-50 text-slate-600 text-xs font-medium font-sans">
          <FileQuestion className="w-3 h-3 text-slate-500 shrink-0" />
          Unverified Claim
        </span>
      );
  }
};
