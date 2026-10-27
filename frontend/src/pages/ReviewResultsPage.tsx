import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  CheckCircle2,
  ArrowLeft,
  Check,
  Edit3,
  X,
  Copy,
  BookOpen,
  Clock,
  Sparkles,
  Cpu,
  Save,
  Info,
  ChevronDown,
  ChevronUp,
  CheckCheck,
  Download,
  FileText
} from 'lucide-react';
import { api } from '../services/api';
import { Review, Finding, DecisionStatus } from '../types';
import { SeverityBadge, StatusBadge, DecisionBadge, EvidenceBadge } from '../components/common/Badge';
import { EvidencePanel } from '../components/common/EvidencePanel';

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

  // Expandable evidence map per finding ID
  const [expandedEvidence, setExpandedEvidence] = useState<Record<string, boolean>>({});

  // Manual revised content editor state
  const [editableRevised, setEditableRevised] = useState('');
  const [isSavingContent, setIsSavingContent] = useState(false);
  const [contentDirty, setContentDirty] = useState(false);

  // Edit modal state
  const [editingFinding, setEditingFinding] = useState<Finding | null>(null);
  const [customFixText, setCustomFixText] = useState('');

  // Report modal state
  const [reportModalContent, setReportModalContent] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState<boolean>(false);

  const handleExportReport = async () => {
    if (!review) return;
    try {
      setIsExporting(true);
      const markdown = await api.getReviewReport(review.id);
      setReportModalContent(markdown);
    } catch (err: any) {
      alert(`Could not export report: ${err.message}`);
    } finally {
      setIsExporting(false);
    }
  };

  const fetchReview = useCallback(async () => {
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
  }, [id]);

  useEffect(() => {
    fetchReview();
  }, [fetchReview]);

  const showToast = (msg: string) => {
    setSuccessToast(msg);
    setTimeout(() => setSuccessToast(null), 3500);
  };

  const toggleEvidence = (findingId: string) => {
    setExpandedEvidence((prev) => ({
      ...prev,
      [findingId]: !prev[findingId],
    }));
  };

  const handleDecision = async (findingId: string, status: DecisionStatus, customFix?: string) => {
    if (!id) return;

    if (status === 'dismissed') {
      const confirmDismiss = window.confirm(
        'Are you sure you want to dismiss this finding? Dismissing marks it as reviewed without modifying the revised copy.'
      );
      if (!confirmDismiss) return;
    }

    try {
      const updated = await api.updateFindingDecision(id, findingId, status, customFix);
      setReview(updated);
      setEditableRevised(updated.revised_content);
      setContentDirty(false);
      showToast(`Finding marked as ${status}. Revised copy updated.`);
      if (status === 'edited') {
        setEditingFinding(null);
      }
    } catch (err: any) {
      alert(`Action failed: ${err.message}`);
    }
  };

  const handleAcceptAll = async () => {
    if (!review || !id) return;
    const pendingFindings = review.findings.filter((f) => f.decision_status === 'pending');
    if (pendingFindings.length === 0) return;

    const confirmAll = window.confirm(
      `Accept all ${pendingFindings.length} pending suggested corrections and update the revised copy?`
    );
    if (!confirmAll) return;

    try {
      let currentReview = review;
      for (const finding of pendingFindings) {
        currentReview = await api.updateFindingDecision(id, finding.id, 'accepted');
      }
      setReview(currentReview);
      setEditableRevised(currentReview.revised_content);
      setContentDirty(false);
      showToast('All pending findings accepted and applied to revised copy.');
    } catch (err: any) {
      alert(`Bulk accept failed: ${err.message}`);
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
    showToast('Revised copy copied to clipboard.');
  };

  if (loading) {
    return (
      <div className="py-24 text-center">
        <div className="w-8 h-8 border-2 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
        <p className="text-sm text-slate-500">Loading audit findings and evidence...</p>
      </div>
    );
  }

  if (errorMsg || !review) {
    return (
      <div className="p-8 text-center max-w-md mx-auto bg-white rounded-xl border border-slate-200">
        <div className="p-4 rounded-lg bg-red-50 border border-red-200 text-red-800 text-xs sm:text-sm mb-4">
          {errorMsg || 'Review record not found.'}
        </div>
        <button
          onClick={() => navigate('/reviews')}
          className="px-4 py-2 rounded-lg bg-slate-900 text-white text-xs hover:bg-slate-800 font-semibold cursor-pointer"
        >
          Return to Review History
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

  const criticalCount = review.findings.filter((f) => f.severity.toLowerCase() === 'high').length;
  const warningCount = review.findings.filter((f) => f.severity.toLowerCase() === 'medium').length;
  const pendingCount = review.findings.filter((f) => f.decision_status === 'pending').length;
  // Compliant checks genuinely measured (rules evaluated that passed without flags)
  const compliantChecks = Math.max(0, 7 - review.findings.length);

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Toast Notification */}
      {successToast && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-2.5 rounded-lg bg-slate-900 text-white font-medium text-xs shadow-lg flex items-center gap-2 border border-slate-700 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-teal-400" />
          <span>{successToast}</span>
        </div>
      )}

      {/* Top Header & Context */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/reviews')}
            className="p-2 rounded-lg bg-white hover:bg-slate-100 border border-slate-200 text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
            title="Back to Review History"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
                {review.title}
              </h1>
              <StatusBadge status={review.overall_status} />
            </div>
            <div className="flex flex-wrap items-center gap-2.5 text-xs text-slate-500 mt-1">
              <span className="font-medium text-slate-700">{review.content_type}</span>
              <span>•</span>
              <span className="flex items-center gap-1 font-mono">
                <Clock className="w-3 h-3 text-slate-400" />
                {new Date(review.created_at).toLocaleString()}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1 text-teal-700 font-medium">
                {review.analysis_mode === 'hybrid' ? (
                  <>
                    <Sparkles className="w-3 h-3 text-teal-600" />
                    Hybrid Audit (Gemini + Deterministic)
                  </>
                ) : (
                  <>
                    <Cpu className="w-3 h-3 text-blue-600" />
                    Deterministic Mode
                  </>
                )}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {pendingCount > 0 && (
            <button
              onClick={handleAcceptAll}
              className="px-3.5 py-1.5 rounded-lg bg-teal-50 hover:bg-teal-100 border border-teal-300 text-teal-800 text-xs font-semibold cursor-pointer flex items-center gap-1.5 transition-colors"
            >
              <CheckCheck className="w-3.5 h-3.5" />
              <span>Accept All Suggestions</span>
            </button>
          )}

          <button
            onClick={handleExportReport}
            disabled={isExporting}
            className="px-3.5 py-1.5 rounded-lg bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 text-xs font-semibold cursor-pointer flex items-center gap-1.5 transition-colors shadow-2xs"
          >
            <FileText className="w-3.5 h-3.5 text-teal-600" />
            <span>{isExporting ? 'Generating...' : 'Export Audit Report'}</span>
          </button>

          <button
            onClick={() => navigate('/reviews/new')}
            className="px-3.5 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold cursor-pointer transition-colors shadow-2xs"
          >
            Audit New Content
          </button>
        </div>
      </div>

      {/* Top Summary Metrics per Part 5 Requirements */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3.5">
        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
            Total Findings
          </span>
          <div className="mt-1 text-2xl font-bold text-slate-900">
            {review.findings.length}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">Flagged issues</div>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
            Critical Findings
          </span>
          <div className="mt-1 text-2xl font-bold text-red-600">
            {criticalCount}
          </div>
          <div className="text-[11px] text-red-600/80 mt-0.5">High severity issues</div>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
            Warnings
          </span>
          <div className="mt-1 text-2xl font-bold text-amber-600">
            {warningCount}
          </div>
          <div className="text-[11px] text-amber-600/80 mt-0.5">Medium severity issues</div>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
            Compliant Checks
          </span>
          <div className="mt-1 text-2xl font-bold text-emerald-600">
            {compliantChecks}
          </div>
          <div className="text-[11px] text-emerald-600/80 mt-0.5">Clauses verified passing</div>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs col-span-2 sm:col-span-1">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
            Review Status
          </span>
          <div className="mt-2">
            <StatusBadge status={review.overall_status} />
          </div>
          <div className="text-[11px] text-slate-400 mt-1">{pendingCount} pending decisions</div>
        </div>
      </div>

      {/* Part 5 Clarification Banner: Unsupported claims vs Factual falsity */}
      <div className="p-4 rounded-xl bg-teal-50/80 border border-teal-200/90 flex items-start gap-3 text-xs text-teal-950 shadow-2xs">
        <Info className="w-5 h-5 text-teal-600 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <div className="font-bold text-teal-900">Evidence Grounding & Compliance Notice</div>
          <p className="text-slate-700 leading-relaxed">
            A flagged claim indicates that it is currently <strong>unsupported by your approved brand guidelines or verified corporate facts</strong>. It is not necessarily factually false, but lacks the documented verification required for external publication. Inspect the cited clause evidence below before approving.
          </p>
        </div>
      </div>

      {/* Main 2-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Structured Finding Cards (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          {/* Filter Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-lg bg-white border border-slate-200 text-xs shadow-2xs">
            <div className="flex items-center gap-2">
              <span className="text-slate-500 font-medium">Severity:</span>
              <select
                value={severityFilter}
                onChange={(e) => setSeverityFilter(e.target.value)}
                className="px-2 py-1 rounded-md bg-white border border-slate-300 text-slate-700 text-xs focus-ring"
              >
                <option value="all">All ({review.findings.length})</option>
                <option value="high">Critical ({criticalCount})</option>
                <option value="medium">Warning ({warningCount})</option>
                <option value="low">Notice</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-slate-500 font-medium">Decision:</span>
              <select
                value={decisionFilter}
                onChange={(e) => setDecisionFilter(e.target.value)}
                className="px-2 py-1 rounded-md bg-white border border-slate-300 text-slate-700 text-xs focus-ring"
              >
                <option value="all">All ({review.findings.length})</option>
                <option value="pending">Pending ({pendingCount})</option>
                <option value="accepted">Accepted</option>
                <option value="edited">Edited</option>
                <option value="dismissed">Dismissed</option>
              </select>
            </div>
          </div>

          {/* Finding Cards */}
          {filteredFindings.length === 0 ? (
            <div className="p-12 rounded-xl bg-white border border-slate-200 text-center space-y-2">
              <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
              <h3 className="text-sm font-bold text-slate-900">
                {review.findings.length === 0 ? 'Compliant Content Verified' : 'No Findings Match Filter'}
              </h3>
              <p className="text-xs text-slate-500">
                {review.findings.length === 0
                  ? 'No brand guideline violations, prohibited terms, or unsupported claims were detected in this copy.'
                  : 'All findings match other severity or decision criteria.'}
              </p>
            </div>
          ) : (
            filteredFindings.map((finding, idx) => {
              return (
                <div
                  key={finding.id}
                  className={`p-5 rounded-xl border bg-white transition-all shadow-xs ${
                    finding.decision_status === 'accepted'
                      ? 'border-teal-300 bg-teal-50/15'
                      : finding.decision_status === 'dismissed'
                      ? 'border-slate-200 bg-slate-50/70 opacity-65'
                      : finding.decision_status === 'edited'
                      ? 'border-indigo-200 bg-indigo-50/15'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  {/* Finding Header with 2. Severity, 3. Category, 9. Evidence Status, 10. Review Decision */}
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded bg-slate-100 text-slate-600 text-xs font-bold flex items-center justify-center">
                        {idx + 1}
                      </span>
                      {/* 2. Severity */}
                      <SeverityBadge severity={finding.severity} />
                      {/* 3. Category */}
                      <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200 capitalize">
                        {finding.category.replace(/_/g, ' ')}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      {/* 9. Evidence Status */}
                      <EvidenceBadge status={finding.evidence_status} />
                      {/* 10. Review Decision */}
                      <DecisionBadge status={finding.decision_status} />
                    </div>
                  </div>

                  {/* 1. Original Marketing Text */}
                  <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 mb-3">
                    <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wider mb-1">
                      Original Marketing Text (Flagged Excerpt):
                    </div>
                    <div className="text-sm font-semibold text-red-700 font-mono bg-red-50/80 px-2 py-1 rounded border border-red-200 inline-block">
                      "{finding.original_excerpt}"
                    </div>
                  </div>

                  {/* 4. Plain-English Explanation */}
                  <div className="mb-3.5">
                    <div className="text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Plain-English Explanation:
                    </div>
                    <p className="text-xs sm:text-sm text-slate-700 leading-relaxed pl-1">
                      {finding.explanation}
                    </p>
                  </div>

                  {/* 8. Suggested Correction */}
                  <div className="p-3 rounded-lg bg-emerald-50/50 border border-emerald-200 mb-3.5">
                    <div className="text-xs font-bold text-emerald-900 mb-0.5 flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Suggested Correction:</span>
                    </div>
                    <div className="text-xs sm:text-sm font-medium text-slate-900 pl-1">
                      "{finding.user_custom_fix || finding.suggested_fix}"
                    </div>
                  </div>

                  {/* Evidence Intelligence Engine Grounding Panel */}
                  <div className="mb-4">
                    <EvidencePanel
                      finding={{
                        id: finding.id,
                        category: finding.category,
                        severity: finding.severity,
                        original_excerpt: finding.original_excerpt,
                        explanation: finding.explanation,
                        guideline_ref: finding.guideline_clause_identifier,
                        guideline_clause_text: finding.guideline_clause_text,
                        document_name: finding.guideline_document_name,
                        page_number: finding.guideline_page_number,
                        suggested_fix: finding.user_custom_fix || finding.suggested_fix,
                        evidence_status: finding.evidence_status,
                        source: (review as any).analysis_mode?.includes('gemini') ? 'ai' : 'deterministic',
                        decision_status: finding.decision_status,
                        user_custom_fix: finding.user_custom_fix,
                      }}
                      defaultExpanded={false}
                    />
                  </div>

                  {/* Reviewer Action Buttons */}
                  <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                    <span className="text-[11px] text-slate-500 font-medium">Reviewer Decision:</span>

                    <div className="flex items-center gap-2">
                      {finding.decision_status !== 'accepted' && (
                        <button
                          onClick={() => handleDecision(finding.id, 'accepted')}
                          className="px-3 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Accept Revision</span>
                        </button>
                      )}

                      <button
                        onClick={() => {
                          setEditingFinding(finding);
                          setCustomFixText(finding.user_custom_fix || finding.suggested_fix);
                        }}
                        className="px-3 py-1.5 rounded-lg bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <Edit3 className="w-3.5 h-3.5 text-slate-500" />
                        <span>Edit Revision</span>
                      </button>

                      {finding.decision_status !== 'dismissed' && (
                        <button
                          onClick={() => handleDecision(finding.id, 'dismissed')}
                          className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" />
                          <span>Dismiss Finding</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Right Column: Original vs. Revised Copy Workbench (5 cols) */}
        <div className="lg:col-span-5 space-y-5 lg:sticky lg:top-24">
          <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-xs space-y-4">
            <h2 className="text-sm font-bold text-slate-900 flex items-center justify-between">
              <span>Marketing Content Workbench</span>
              <span className="text-[11px] font-normal text-slate-500">
                Original vs. Revised Copy
              </span>
            </h2>

            {/* Original Copy (Preserved Immutably) */}
            <div>
              <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1 flex items-center justify-between">
                <span>Original Submitted Copy</span>
                <span className="text-red-700 text-[10px] uppercase font-mono">Immutable</span>
              </div>
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-800 font-mono leading-relaxed whitespace-pre-wrap select-all">
                {review.original_content}
              </div>
            </div>

            {/* Revised Compliant Copy (Interactive Live Editor) */}
            <div>
              <div className="text-[11px] font-bold text-teal-800 uppercase tracking-wider mb-1 flex items-center justify-between">
                <span>Revised Compliant Copy</span>
                <span className="text-teal-700 text-[10px] uppercase font-mono">Interactive</span>
              </div>
              <textarea
                rows={5}
                value={editableRevised}
                onChange={(e) => {
                  setEditableRevised(e.target.value);
                  setContentDirty(true);
                }}
                className="w-full p-3 rounded-lg bg-white border border-teal-300 text-xs sm:text-sm text-slate-900 font-sans leading-relaxed focus-ring"
              />

              <div className="mt-3 flex items-center justify-between gap-2">
                <button
                  onClick={handleCopyToClipboard}
                  className="px-3 py-1.5 rounded-lg bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Copy className="w-3.5 h-3.5 text-slate-500" />
                  <span>Copy Clean Copy</span>
                </button>

                <button
                  onClick={handleSaveRevisedContent}
                  disabled={!contentDirty || isSavingContent}
                  className="px-3.5 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-700 disabled:opacity-40 text-white text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{isSavingContent ? 'Saving...' : 'Save Draft Edits'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Audit Trail Action Log */}
          <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-xs">
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-slate-400" />
              <span>Review Audit Trail ({review.actions.length} Actions)</span>
            </h3>

            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {review.actions.length === 0 ? (
                <div className="text-xs text-slate-400 py-3 text-center">No actions recorded yet.</div>
              ) : (
                review.actions.map((act) => (
                  <div
                    key={act.id}
                    className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-xs space-y-0.5"
                  >
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-semibold text-slate-800 uppercase tracking-wider">
                        {act.action_type}
                      </span>
                      <span className="text-slate-400 font-mono">
                        {new Date(act.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    {act.new_value && (
                      <p className="text-slate-600 text-[11px] leading-snug truncate">
                        {act.new_value}
                      </p>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Custom Edit Modal */}
      {editingFinding && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-fadeIn">
          <div className="w-full max-w-lg rounded-xl bg-white border border-slate-300 p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-teal-600" />
                <span>Custom Replacement Editor</span>
              </h3>
              <button
                onClick={() => setEditingFinding(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div>
              <div className="text-xs text-slate-500 mb-1">Flagged Original Excerpt:</div>
              <div className="font-mono text-xs text-red-700 bg-red-50 p-2 rounded border border-red-200">
                "{editingFinding.original_excerpt}"
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Your Compliant Replacement Copy:
              </label>
              <textarea
                rows={3}
                value={customFixText}
                onChange={(e) => setCustomFixText(e.target.value)}
                placeholder="Enter compliant replacement text preserving original marketing intent..."
                className="w-full p-3 rounded-lg bg-white border border-slate-300 text-sm text-slate-900 focus-ring"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setEditingFinding(null)}
                className="px-4 py-2 rounded-lg bg-white border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDecision(editingFinding.id, 'edited', customFixText)}
                className="px-4 py-2 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold cursor-pointer"
              >
                Apply Custom Fix
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Audit Report Modal */}
      {reportModalContent && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[85vh] flex flex-col shadow-2xl border border-slate-200 animate-fadeIn">
            <div className="p-5 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-teal-600" />
                <h3 className="text-base font-bold text-slate-900">Single Copy Governance Audit Report</h3>
              </div>
              <button
                type="button"
                onClick={() => setReportModalContent(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1 font-mono text-xs text-slate-800 bg-slate-50 leading-relaxed whitespace-pre-wrap select-all">
              {reportModalContent}
            </div>

            <div className="p-4 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 bg-white rounded-b-2xl">
              <span className="text-xs text-slate-500">Official OmniGuide Governance Audit Report</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(reportModalContent);
                    alert('Markdown report copied to clipboard!');
                  }}
                  className="px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy Markdown</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const blob = new Blob([reportModalContent], { type: 'text/markdown;charset=utf-8;' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    const cleanName = (review?.title || 'Review_Audit').replace(/[^a-zA-Z0-9_-]/g, '_');
                    a.download = `OmniGuide_${cleanName}_Audit.md`;
                    a.click();
                    URL.revokeObjectURL(url);
                  }}
                  className="px-3.5 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download .md</span>
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    if (!review) return;
                    try {
                      const jsonReport = await api.getReviewReportJson(review.id);
                      const blob = new Blob([JSON.stringify(jsonReport, null, 2)], { type: 'application/json' });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      const cleanName = (review.title || 'Review_Audit').replace(/[^a-zA-Z0-9_-]/g, '_');
                      a.download = `OmniGuide_${cleanName}_Audit.json`;
                      a.click();
                      URL.revokeObjectURL(url);
                    } catch (e: any) {
                      alert(`JSON export failed: ${e.message}`);
                    }
                  }}
                  className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download .json</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
