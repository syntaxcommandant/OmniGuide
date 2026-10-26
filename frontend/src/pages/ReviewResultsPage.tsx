import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  ArrowLeft,
  Check,
  Edit3,
  X,
  Copy,
  BookOpen,
  FileCheck2,
  Clock,
  Sparkles,
  Cpu,
  Layers,
  ChevronDown,
  ChevronUp,
  Save,
  Share2
} from 'lucide-react';
import { api } from '../services/api';
import { Review, Finding, DecisionStatus } from '../types';
import { SeverityBadge, StatusBadge, DecisionBadge, EvidenceBadge } from '../components/common/Badge';

export const ReviewResultsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [review, setReview] = useState<Review | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Filter states
  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const [decisionFilter, setDecisionFilter] = useState<string>('all');

  // Manual revised content editor state
  const [editableRevised, setEditableRevised] = useState('');
  const [isSavingContent, setIsSavingContent] = useState(false);
  const [contentDirty, setContentDirty] = useState(false);

  // Edit modal state
  const [editingFinding, setEditingFinding] = useState<Finding | null>(null);
  const [customFixText, setCustomFixText] = useState('');

  const fetchReview = async () => {
    if (!id) return;
    try {
      const data = await api.getReview(id);
      setReview(data);
      setEditableRevised(data.revised_content);
      setContentDirty(false);
    } catch (err: any) {
      setErrorMsg(err.message || 'Could not load review record.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReview();
  }, [id]);

  const showToast = (msg: string) => {
    setSuccessToast(msg);
    setTimeout(() => setSuccessToast(null), 3500);
  };

  const handleDecision = async (findingId: string, status: DecisionStatus, customFix?: string) => {
    if (!id) return;
    try {
      const updated = await api.updateFindingDecision(id, findingId, status, customFix);
      setReview(updated);
      setEditableRevised(updated.revised_content);
      setContentDirty(false);
      showToast(`Finding marked as ${status}. Revised content updated.`);
      if (status === 'edited') {
        setEditingFinding(null);
      }
    } catch (err: any) {
      alert(`Action failed: ${err.message}`);
    }
  };

  const handleSaveRevisedContent = async () => {
    if (!id) return;
    setIsSavingContent(true);
    try {
      const updated = await api.updateRevisedContent(id, editableRevised);
      setReview(updated);
      setContentDirty(false);
      showToast('Revised marketing copy successfully saved.');
    } catch (err: any) {
      alert(`Failed to save content: ${err.message}`);
    } finally {
      setIsSavingContent(false);
    }
  };

  const handleCopyToClipboard = () => {
    navigator.clipboard.writeText(editableRevised);
    showToast('Revised marketing copy copied to clipboard!');
  };

  if (loading) {
    return (
      <div className="py-24 text-center">
        <div className="w-8 h-8 border-2 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
        <p className="text-sm text-slate-400">Loading compliance evaluation findings...</p>
      </div>
    );
  }

  if (errorMsg || !review) {
    return (
      <div className="p-8 text-center max-w-md mx-auto">
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm mb-4">
          {errorMsg || 'Review record not found.'}
        </div>
        <button
          onClick={() => navigate('/reviews')}
          className="px-4 py-2 rounded-lg bg-navy-800 text-slate-200 text-xs hover:bg-navy-700"
        >
          Return to History
        </button>
      </div>
    );
  }

  // Filter findings
  const filteredFindings = review.findings.filter((f) => {
    if (severityFilter !== 'all' && f.severity.toLowerCase() !== severityFilter) return false;
    if (decisionFilter !== 'all' && f.decision_status !== decisionFilter) return false;
    return true;
  });

  const highSeverityCount = review.findings.filter((f) => f.severity === 'High').length;
  const mediumSeverityCount = review.findings.filter((f) => f.severity === 'Medium').length;
  const lowSeverityCount = review.findings.filter((f) => f.severity === 'Low').length;
  const pendingCount = review.findings.filter((f) => f.decision_status === 'pending').length;

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {successToast && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-3 rounded-xl bg-teal-500 text-navy-950 font-bold text-xs shadow-2xl flex items-center gap-2 animate-bounce">
          <CheckCircle2 className="w-4 h-4" />
          <span>{successToast}</span>
        </div>
      )}

      {/* Top Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-navy-800">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/reviews')}
            className="p-2 rounded-lg bg-navy-900 hover:bg-navy-850 border border-navy-800 text-slate-400 hover:text-white transition-colors"
            title="Back to Review History"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-lg sm:text-xl font-bold text-white tracking-tight">{review.title}</h1>
              <StatusBadge status={review.overall_status} />
            </div>
            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 mt-1">
              <span className="text-slate-300 font-medium">{review.content_type}</span>
              <span>•</span>
              <span className="flex items-center gap-1 font-mono">
                <Clock className="w-3 h-3 text-slate-500" />
                {new Date(review.created_at).toLocaleString()}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1 text-teal-400 font-mono">
                {review.analysis_mode === 'hybrid' ? (
                  <>
                    <Sparkles className="w-3 h-3" />
                    Hybrid AI Review
                  </>
                ) : (
                  <>
                    <Cpu className="w-3 h-3 text-blue-400" />
                    Deterministic Rules Mode
                  </>
                )}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={() => navigate('/reviews/new')}
            className="px-3 py-1.5 rounded-lg bg-navy-800 hover:bg-navy-750 border border-navy-700 text-slate-200 text-xs font-semibold"
          >
            New Review
          </button>
        </div>
      </div>

      {/* Overview Stat Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-xl bg-navy-900 border border-navy-800">
          <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Total Findings</span>
          <div className="mt-1 text-xl font-bold text-white">{review.findings.length}</div>
        </div>
        <div className="p-3.5 rounded-xl bg-navy-900 border border-navy-800">
          <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">High Severity</span>
          <div className="mt-1 text-xl font-bold text-rose-400">{highSeverityCount}</div>
        </div>
        <div className="p-3.5 rounded-xl bg-navy-900 border border-navy-800">
          <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Medium Severity</span>
          <div className="mt-1 text-xl font-bold text-amber-400">{mediumSeverityCount}</div>
        </div>
        <div className="p-3.5 rounded-xl bg-navy-900 border border-navy-800">
          <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Pending Decisions</span>
          <div className="mt-1 text-xl font-bold text-teal-400">{pendingCount}</div>
        </div>
      </div>

      {/* Notice Banner */}
      <div className="p-3.5 rounded-xl bg-navy-900/90 border border-navy-800 flex items-start gap-3 text-xs text-slate-300">
        <Layers className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />
        <div>
          <span className="font-semibold text-white">Human-in-the-Loop Governance:</span> Automated findings and suggestions are decision-support recommendations. Content will never be silently published without explicit human review and approval.
        </div>
      </div>

      {/* Main 2-Column Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Interactive Findings List (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          {/* Filter Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl bg-navy-900 border border-navy-800 text-xs">
            <div className="flex items-center gap-2">
              <span className="text-slate-400 font-medium">Filter Severity:</span>
              <select
                value={severityFilter}
                onChange={(e) => setSeverityFilter(e.target.value)}
                className="px-2 py-1 rounded bg-navy-950 border border-navy-700 text-slate-200 text-xs focus:outline-none"
              >
                <option value="all">All ({review.findings.length})</option>
                <option value="high">High ({highSeverityCount})</option>
                <option value="medium">Medium ({mediumSeverityCount})</option>
                <option value="low">Low ({lowSeverityCount})</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-slate-400 font-medium">Decision:</span>
              <select
                value={decisionFilter}
                onChange={(e) => setDecisionFilter(e.target.value)}
                className="px-2 py-1 rounded bg-navy-950 border border-navy-700 text-slate-200 text-xs focus:outline-none"
              >
                <option value="all">All</option>
                <option value="pending">Pending ({pendingCount})</option>
                <option value="accepted">Accepted</option>
                <option value="edited">Edited</option>
                <option value="dismissed">Dismissed</option>
              </select>
            </div>
          </div>

          {/* Finding Cards */}
          {filteredFindings.length === 0 ? (
            <div className="p-12 rounded-xl bg-navy-900 border border-navy-800 text-center space-y-2">
              <CheckCircle2 className="w-10 h-10 text-teal-400 mx-auto" />
              <h3 className="text-base font-bold text-white">No Issues Found Matching Filter</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                All guideline rules, superlative patterns, and registered facts evaluated compliant for this criteria.
              </p>
            </div>
          ) : (
            filteredFindings.map((finding, idx) => (
              <div
                key={finding.id}
                className={`p-5 rounded-xl border transition-all ${
                  finding.decision_status === 'accepted'
                    ? 'bg-navy-900/90 border-teal-500/40 shadow-sm'
                    : finding.decision_status === 'dismissed'
                    ? 'bg-navy-950/60 border-navy-800/80 opacity-70'
                    : finding.decision_status === 'edited'
                    ? 'bg-navy-900/90 border-indigo-500/40'
                    : 'bg-navy-900 border-navy-800 hover:border-navy-700 shadow-md'
                }`}
              >
                {/* Header row */}
                <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-navy-800 text-slate-300 text-xs font-bold flex items-center justify-center">
                      {idx + 1}
                    </span>
                    <SeverityBadge severity={finding.severity} />
                    <span className="text-xs uppercase font-mono px-2 py-0.5 rounded bg-navy-800 text-slate-300 border border-navy-700">
                      {finding.category.replace(/_/g, ' ')}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <EvidenceBadge status={finding.evidence_status} />
                    <DecisionBadge status={finding.decision_status} />
                  </div>
                </div>

                {/* Flagged Excerpt Highlight */}
                <div className="p-2.5 rounded-lg bg-navy-950 border border-navy-800/80 mb-3">
                  <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1">
                    Flagged Excerpt in Submitted Text
                  </div>
                  <div className="text-sm font-semibold text-rose-300 bg-rose-500/10 px-2 py-1 rounded border border-rose-500/20 inline-block font-mono">
                    "{finding.original_excerpt}"
                  </div>
                </div>

                {/* Explanation */}
                <div className="mb-4">
                  <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                    Why This Matters (Governance Analysis)
                  </div>
                  <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">
                    {finding.explanation}
                  </p>
                </div>

                {/* Ground Truth Guideline Citation Box */}
                {finding.guideline_clause_identifier && (
                  <div className="p-3 rounded-lg bg-navy-950/90 border border-teal-500/30 mb-4">
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <div className="flex items-center gap-2">
                        <BookOpen className="w-3.5 h-3.5 text-teal-400" />
                        <span className="text-xs font-bold text-teal-300 font-mono">
                          Clause Citation: {finding.guideline_clause_identifier}
                        </span>
                      </div>
                      {finding.guideline_page_number && (
                        <span className="text-[11px] text-slate-400 font-mono">
                          Page {finding.guideline_page_number}
                        </span>
                      )}
                    </div>
                    {finding.guideline_clause_text && (
                      <p className="text-xs text-slate-300 italic border-l-2 border-teal-500/60 pl-2 py-0.5 font-sans">
                        "{finding.guideline_clause_text}"
                      </p>
                    )}
                  </div>
                )}

                {/* Suggested Fix */}
                <div className="p-3.5 rounded-xl bg-teal-500/10 border border-teal-500/30 mb-4">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-bold text-teal-300 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-teal-400" />
                      Suggested Actionable Replacement (Intent-Preserving)
                    </span>
                  </div>
                  <div className="text-xs sm:text-sm text-white font-medium">
                    "{finding.user_custom_fix || finding.suggested_fix}"
                  </div>
                </div>

                {/* Action Buttons: Accept / Custom Edit / Dismiss */}
                <div className="pt-2 border-t border-navy-800 flex flex-wrap items-center justify-between gap-2">
                  <div className="text-[11px] text-slate-400">
                    Human Marketer Decision:
                  </div>

                  <div className="flex items-center gap-2">
                    {finding.decision_status !== 'accepted' && (
                      <button
                        onClick={() => handleDecision(finding.id, 'accepted')}
                        className="px-3 py-1.5 rounded-lg bg-teal-500/20 hover:bg-teal-500/30 border border-teal-500/50 text-teal-300 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Accept Suggestion</span>
                      </button>
                    )}

                    <button
                      onClick={() => {
                        setEditingFinding(finding);
                        setCustomFixText(finding.user_custom_fix || finding.suggested_fix);
                      }}
                      className="px-3 py-1.5 rounded-lg bg-navy-800 hover:bg-navy-700 border border-navy-700 text-slate-200 text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Custom Edit</span>
                    </button>

                    {finding.decision_status !== 'dismissed' && (
                      <button
                        onClick={() => handleDecision(finding.id, 'dismissed')}
                        className="px-3 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-800 border border-slate-700 text-slate-400 hover:text-slate-200 text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                        <span>Dismiss</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Right Column: Live Copy Editor & Audit Trail (5 cols) */}
        <div className="lg:col-span-5 space-y-6 lg:sticky lg:top-24">
          {/* Side-by-Side Content Comparison */}
          <div className="p-5 rounded-2xl bg-navy-900 border border-navy-800 space-y-5">
            <h2 className="text-sm font-bold text-white flex items-center justify-between">
              <span>Marketing Copy Workbench</span>
              <span className="text-[11px] font-normal text-slate-400">
                Original vs Revised
              </span>
            </h2>

            {/* Original Copy (Immutable Reference) */}
            <div>
              <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1 flex items-center justify-between">
                <span>Original Submitted Copy (Read-Only)</span>
                <span className="text-rose-400 text-[10px]">Preserved Unchanged</span>
              </div>
              <div className="p-3.5 rounded-xl bg-navy-950 border border-navy-800 text-xs sm:text-sm text-slate-300 font-mono leading-relaxed whitespace-pre-wrap select-all">
                {review.original_content}
              </div>
            </div>

            {/* Revised Copy (Interactive Live Editor) */}
            <div>
              <div className="text-[11px] font-semibold text-teal-400 uppercase tracking-wider mb-1 flex items-center justify-between">
                <span>Revised Compliant Copy</span>
                <span className="text-teal-400 text-[10px]">Updates with Accepted Fixes</span>
              </div>
              <textarea
                rows={5}
                value={editableRevised}
                onChange={(e) => {
                  setEditableRevised(e.target.value);
                  setContentDirty(true);
                }}
                className="w-full p-3.5 rounded-xl bg-navy-950 border border-teal-500/40 text-xs sm:text-sm text-teal-200 font-mono leading-relaxed focus:outline-none focus:border-teal-400"
              />

              <div className="mt-2.5 flex items-center justify-between">
                <button
                  onClick={handleCopyToClipboard}
                  className="px-3 py-1.5 rounded-lg bg-navy-800 hover:bg-navy-750 border border-navy-700 text-slate-300 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy Clean Copy</span>
                </button>

                <button
                  onClick={handleSaveRevisedContent}
                  disabled={!contentDirty || isSavingContent}
                  className="px-3 py-1.5 rounded-lg bg-teal-500 hover:bg-teal-400 disabled:opacity-40 text-navy-950 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>{isSavingContent ? 'Saving...' : 'Save Draft Edits'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Audit Trail Action Log */}
          <div className="p-5 rounded-2xl bg-navy-900 border border-navy-800">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-3 flex items-center gap-2">
              <Clock className="w-4 h-4 text-teal-400" />
              <span>Review Audit Trail ({review.actions.length} Actions)</span>
            </h3>

            <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
              {review.actions.map((act) => (
                <div
                  key={act.id}
                  className="p-2.5 rounded-lg bg-navy-950 border border-navy-850 text-xs space-y-1"
                >
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-semibold text-slate-300 uppercase tracking-wider">
                      {act.action_type}
                    </span>
                    <span className="text-slate-500 font-mono">
                      {new Date(act.created_at).toLocaleTimeString()}
                    </span>
                  </div>
                  {act.new_value && (
                    <p className="text-slate-400 text-[11px] leading-snug">
                      {act.new_value}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Custom Edit Modal */}
      {editingFinding && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl bg-navy-900 border border-navy-700 p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-navy-800">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-teal-400" />
                <span>Custom Replacement Editor</span>
              </h3>
              <button
                onClick={() => setEditingFinding(null)}
                className="p-1 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div>
              <div className="text-xs text-slate-400 mb-1">Original Flagged Excerpt:</div>
              <div className="font-mono text-xs text-rose-300 bg-rose-500/10 px-2.5 py-1.5 rounded border border-rose-500/20">
                "{editingFinding.original_excerpt}"
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Your Custom Compliant Text:
              </label>
              <textarea
                rows={3}
                value={customFixText}
                onChange={(e) => setCustomFixText(e.target.value)}
                placeholder="Enter defensible replacement text preserving marketing intent..."
                className="w-full p-3 rounded-xl bg-navy-950 border border-navy-700 text-sm text-slate-100 font-medium focus:outline-none focus:border-teal-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setEditingFinding(null)}
                className="px-4 py-2 rounded-xl bg-navy-800 text-slate-300 text-xs font-medium hover:bg-navy-700"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDecision(editingFinding.id, 'edited', customFixText)}
                className="px-4 py-2 rounded-xl bg-teal-500 hover:bg-teal-400 text-navy-950 text-xs font-bold"
              >
                Apply Custom Edit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
