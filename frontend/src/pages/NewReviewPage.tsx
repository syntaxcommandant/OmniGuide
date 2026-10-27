import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import {
  FileCheck2,
  Sparkles,
  Cpu,
  AlertCircle,
  Play,
  RotateCcw,
  BookOpen,
  ArrowRight,
  Info,
  CheckCircle2,
  ChevronDown
} from 'lucide-react';
import { api } from '../services/api';
import { DemoScenario, GuidelineDocument, SystemStatus } from '../types';

export const NewReviewPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  // Form states
  const [title, setTitle] = useState('');
  const [contentType, setContentType] = useState('Social Ad Copy');
  const [content, setContent] = useState('');
  const [campaignContext, setCampaignContext] = useState('');
  const [analysisMode, setAnalysisMode] = useState<'hybrid' | 'deterministic'>('hybrid');

  // Stored guidelines, demo scenarios, and system status
  const [scenarios, setScenarios] = useState<DemoScenario[]>([]);
  const [guidelines, setGuidelines] = useState<GuidelineDocument[]>([]);
  const [systemStatus, setSystemStatus] = useState<SystemStatus | null>(null);
  const [activeScenarioId, setActiveScenarioId] = useState<string | null>(null);
  const [showExampleDropdown, setShowExampleDropdown] = useState(false);

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const loadScenario = useCallback((id: string, force = false) => {
    const sc = scenarios.find((s) => s.id === id);
    if (!sc) return;

    // Do not automatically overwrite user-entered content without confirmation
    if (!force && content.trim().length > 0 && content.trim() !== sc.content.trim()) {
      const confirmOverwrite = window.confirm(
        'Loading this example will replace the marketing copy currently in the editor. Would you like to proceed?'
      );
      if (!confirmOverwrite) return;
    }

    setTitle(sc.title);
    setContentType(sc.content_type || 'Social Ad Copy');
    setContent(sc.content);
    setCampaignContext(sc.campaign_context || '');
    setActiveScenarioId(id);
    setShowExampleDropdown(false);
    setErrorMsg(null);
  }, [scenarios, content]);

  useEffect(() => {
    Promise.all([api.getDemoScenarios(), api.getGuidelines(), api.getStatus()])
      .then(([scData, gData, statusData]) => {
        setScenarios(scData);
        setGuidelines(gData);
        setSystemStatus(statusData);
      })
      .catch((err) => console.warn('Initialization error:', err));
  }, []);

  // Pre-load scenario from query params if specified (only on initial load if content is empty)
  useEffect(() => {
    const scenarioId = searchParams.get('scenario');
    if (scenarioId && scenarios.length > 0 && !content) {
      loadScenario(scenarioId, true);
    }
  }, [searchParams, scenarios, content, loadScenario]);

  const clearContent = () => {
    if (content.trim().length > 0) {
      const confirmClear = window.confirm('Clear the current marketing copy?');
      if (!confirmClear) return;
    }
    setContent('');
    setActiveScenarioId(null);
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0;
  const charCount = content.length;
  const totalClauses = guidelines.reduce((acc, g) => acc + (g.clause_count || g.clauses?.length || 0), 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return; // Prevent duplicate submissions
    setErrorMsg(null);

    // Validate required fields (Step 2)
    if (!content.trim() || content.trim().length < 3) {
      setErrorMsg('Please enter marketing copy to review (minimum 3 characters).');
      if (textareaRef.current) {
        textareaRef.current.focus();
      }
      return;
    }

    const finalTitle = title.trim() || `Marketing Copy Audit - ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;

    setLoading(true);
    try {
      const review = await api.startReview({
        title: finalTitle,
        content_type: contentType,
        content: content.trim(),
        campaign_context: campaignContext.trim() || undefined,
        analysis_mode: analysisMode,
      });

      // Navigate to review results page
      navigate(`/reviews/${review.id}`);
    } catch (err: any) {
      setErrorMsg(err.message || 'Review execution failed. Please verify backend connectivity.');
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-fadeIn">
      {/* Page Header */}
      <div className="pb-4 border-b border-slate-200">
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
          <FileCheck2 className="w-6 h-6 text-teal-600" />
          <span>New Content Review</span>
        </h1>
        <p className="text-xs sm:text-sm text-slate-600 mt-1">
          Check your marketing copy against approved brand guidelines, identify unsupported claims, and view verified corrections.
        </p>
      </div>

      {/* Validation / Error Banner */}
      {errorMsg && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs sm:text-sm flex items-start gap-3 shadow-2xs">
          <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <div className="font-bold">Submission Requirements</div>
            <div className="text-xs text-red-700 mt-0.5">{errorMsg}</div>
          </div>
        </div>
      )}

      {/* Main Guided Workflow Form */}
      <form onSubmit={handleSubmit} className="space-y-6">

        {/* STEP 1: Campaign Details */}
        <div className="bg-white p-5 sm:p-6 rounded-xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
            <span className="w-6 h-6 rounded-full bg-teal-50 text-teal-700 text-xs font-bold flex items-center justify-center border border-teal-200">
              1
            </span>
            <div>
              <h2 className="text-sm font-bold text-slate-900">Campaign Details</h2>
              <p className="text-xs text-slate-500">Provide campaign title, publication format, and target context</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Campaign or Content Title
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Q1 National Enterprise Product Launch"
                className="w-full px-3.5 py-2 rounded-lg bg-white border border-slate-300 text-sm text-slate-900 placeholder-slate-400 focus-ring"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Content Type
              </label>
              <select
                value={contentType}
                onChange={(e) => setContentType(e.target.value)}
                className="w-full px-3.5 py-2 rounded-lg bg-white border border-slate-300 text-sm text-slate-900 focus-ring"
              >
                <option value="Social Ad Copy">Social Ad Copy</option>
                <option value="Website Copy">Website Copy / Hero</option>
                <option value="Email Campaign">Email Campaign</option>
                <option value="Press Release">Press Release</option>
                <option value="Product Launch">Product Launch Announcement</option>
                <option value="Packaging & Collateral">Packaging & Collateral</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Audience or Market Context <span className="text-slate-400 font-normal">(Optional)</span>
            </label>
            <input
              type="text"
              value={campaignContext}
              onChange={(e) => setCampaignContext(e.target.value)}
              placeholder="e.g. Enterprise IT decision-makers in India, highlighting benchmark SLA latency."
              className="w-full px-3.5 py-2 rounded-lg bg-white border border-slate-300 text-sm text-slate-900 placeholder-slate-400 focus-ring"
            />
          </div>
        </div>

        {/* STEP 2: Marketing Content */}
        <div className="bg-white p-5 sm:p-6 rounded-xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <span className="w-6 h-6 rounded-full bg-teal-50 text-teal-700 text-xs font-bold flex items-center justify-center border border-teal-200">
                2
              </span>
              <div>
                <h2 className="text-sm font-bold text-slate-900">Marketing Content</h2>
                <p className="text-xs text-slate-500">
                  Paste or draft the marketing copy to audit against your brand policies
                </p>
              </div>
            </div>

            {/* Action Bar: Load Example & Clear Copy */}
            <div className="flex items-center gap-2 self-start sm:self-auto">
              {/* Load Example Option */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowExampleDropdown(!showExampleDropdown)}
                  className="px-3 py-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-300 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5 text-teal-600" />
                  <span>Load Example</span>
                  <ChevronDown className="w-3 h-3 text-slate-400" />
                </button>

                {showExampleDropdown && (
                  <div className="absolute right-0 mt-1.5 w-72 rounded-xl bg-white border border-slate-200 shadow-lg z-20 p-2 space-y-1 animate-fadeIn">
                    <div className="px-2 py-1 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100 mb-1">
                      Select Benchmark Copy
                    </div>
                    {scenarios.map((sc) => (
                      <button
                        key={sc.id}
                        type="button"
                        onClick={() => loadScenario(sc.id)}
                        className={`w-full text-left p-2 rounded-lg text-xs transition-colors cursor-pointer ${
                          activeScenarioId === sc.id
                            ? 'bg-teal-50 text-teal-900 font-semibold'
                            : 'hover:bg-slate-50 text-slate-700'
                        }`}
                      >
                        <div className="font-semibold truncate">{sc.title}</div>
                        <div className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">{sc.content}</div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Optional Clear Button */}
              {content && (
                <button
                  type="button"
                  onClick={clearContent}
                  className="px-2.5 py-1.5 rounded-lg bg-white hover:bg-slate-50 border border-slate-200 text-slate-500 hover:text-slate-800 text-xs font-medium flex items-center gap-1 transition-colors cursor-pointer"
                  title="Clear editor content"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Clear</span>
                </button>
              )}

              {/* Character and Word Counter */}
              <span className="text-[11px] px-2.5 py-1 rounded font-mono bg-slate-100 text-slate-600 border border-slate-200">
                {charCount} chars • {wordCount} words
              </span>
            </div>
          </div>

          <div>
            <textarea
              ref={textareaRef}
              rows={6}
              value={content}
              onChange={(e) => {
                setContent(e.target.value);
                if (errorMsg) setErrorMsg(null);
              }}
              placeholder="Paste your marketing copy here... (e.g. India's #1 fastest tool for Indian teams, delivering 100% risk-free compliance...)"
              className={`w-full p-3.5 rounded-lg bg-white border text-sm text-slate-900 placeholder-slate-400 font-sans leading-relaxed focus-ring ${
                errorMsg && !content.trim() ? 'border-red-400 bg-red-50/20' : 'border-slate-300'
              }`}
            />
            <p className="text-[11px] text-slate-500 mt-1.5 flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span>OmniGuide will extract candidate claims and cross-reference each against verified brand guidelines and corporate facts.</span>
            </p>
          </div>
        </div>

        {/* STEP 3: Review Against Brand Guidelines */}
        <div className="bg-white p-5 sm:p-6 rounded-xl border border-slate-200 shadow-xs space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <span className="w-6 h-6 rounded-full bg-teal-50 text-teal-700 text-xs font-bold flex items-center justify-center border border-teal-200">
                3
              </span>
              <div>
                <h2 className="text-sm font-bold text-slate-900">Review Against Brand Guidelines</h2>
                <p className="text-xs text-slate-500">
                  Verify active governance policies, AI engine availability, and launch the audit
                </p>
              </div>
            </div>

            <Link
              to="/guidelines"
              className="text-xs text-teal-700 hover:text-teal-800 font-medium flex items-center gap-1 self-start sm:self-auto"
            >
              <span>Manage Brand Guidelines</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Active Guidelines Status Summary */}
          {guidelines.length > 0 ? (
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-900 flex items-center gap-1.5">
                  <BookOpen className="w-4 h-4 text-teal-600" />
                  <span>Active Guidelines: {guidelines.length} document{guidelines.length !== 1 ? 's' : ''} ({totalClauses} indexed clauses)</span>
                </span>
                <span className="text-emerald-700 font-semibold flex items-center gap-1 text-[11px]">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Ready for Verification</span>
                </span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Checked policies include: <strong className="text-slate-800">{guidelines.map((g) => g.title).join(', ')}</strong>. Evaluates superlative rankings, unverified numerical claims, prohibited terminology, and voice consistency.
              </p>
            </div>
          ) : (
            <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold">
                <AlertCircle className="w-4 h-4 text-amber-600" />
                <span>No Guideline Documents Uploaded Yet</span>
              </div>
              <p className="text-xs text-amber-800 leading-relaxed">
                You can upload a searchable PDF brand policy in <Link to="/guidelines" className="underline font-semibold">Brand Guidelines</Link>. However, you can still proceed: OmniGuide will evaluate your marketing copy using our deterministic governance safety rules.
              </p>
            </div>
          )}

          {/* Engine Mode & AI Provider Availability */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label
              className={`p-3.5 rounded-lg border flex items-start gap-3 cursor-pointer transition-all ${
                analysisMode === 'hybrid'
                  ? 'bg-teal-50/60 border-teal-500 shadow-2xs'
                  : 'bg-white border-slate-200 hover:border-slate-300'
              }`}
            >
              <input
                type="radio"
                name="analysisMode"
                value="hybrid"
                checked={analysisMode === 'hybrid'}
                onChange={() => setAnalysisMode('hybrid')}
                className="mt-0.5 text-teal-600 focus:ring-0"
              />
              <div className="flex-1">
                <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-teal-600" />
                  <span>Hybrid Audit (AI + Rule Engine)</span>
                </div>
                <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                  Deep contextual analysis using Google Gemini Flash, grounded in retrieved guidelines and approved facts.
                </p>
                <div className="mt-2 text-[10px] flex items-center gap-1.5 font-medium text-slate-600">
                  <span className={`w-2 h-2 rounded-full ${systemStatus?.gemini_configured ? 'bg-emerald-500' : 'bg-amber-400'}`}></span>
                  <span>AI Engine: Google Gemini Flash ({systemStatus?.gemini_configured ? 'Connected & Ready' : 'Deterministic Fallback Active'})</span>
                </div>
              </div>
            </label>

            <label
              className={`p-3.5 rounded-lg border flex items-start gap-3 cursor-pointer transition-all ${
                analysisMode === 'deterministic'
                  ? 'bg-teal-50/60 border-teal-500 shadow-2xs'
                  : 'bg-white border-slate-200 hover:border-slate-300'
              }`}
            >
              <input
                type="radio"
                name="analysisMode"
                value="deterministic"
                checked={analysisMode === 'deterministic'}
                onChange={() => setAnalysisMode('deterministic')}
                className="mt-0.5 text-teal-600 focus:ring-0"
              />
              <div>
                <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                  <Cpu className="w-3.5 h-3.5 text-blue-600" />
                  <span>Deterministic Mode Only</span>
                </div>
                <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                  Strict offline evaluation using deterministic pattern matching, regex boundaries, and approved corporate facts.
                </p>
                <div className="mt-2 text-[10px] flex items-center gap-1.5 font-medium text-slate-600">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  <span>Engine: Offline Regex Rule Engine (Always Available)</span>
                </div>
              </div>
            </label>
          </div>

          {/* Meaningful Loading Feedback */}
          {loading && (
            <div className="p-4 rounded-xl bg-teal-50 border border-teal-200 text-teal-900 flex items-center gap-3 animate-pulse">
              <div className="w-5 h-5 border-2 border-teal-600 border-t-transparent rounded-full animate-spin shrink-0"></div>
              <div className="text-xs">
                <div className="font-bold">Analyzing Content Against Governance Standards...</div>
                <div className="text-[11px] text-teal-700 mt-0.5">
                  Retrieving relevant guideline clauses, checking corporate facts, and validating evidence citations.
                </div>
              </div>
            </div>
          )}

          {/* Prominent Action Button: "Review Content" */}
          <div className="pt-2 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => {
                setTitle('');
                setContent('');
                setCampaignContext('');
                setActiveScenarioId(null);
                setErrorMsg(null);
              }}
              className="text-xs font-medium text-slate-500 hover:text-slate-800 flex items-center gap-1.5 transition-colors cursor-pointer self-start sm:self-auto"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Form</span>
            </button>

            <button
              type="submit"
              disabled={loading}
              id="review-content-btn"
              className="px-8 py-3 rounded-lg bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white font-semibold text-sm transition-all shadow-xs cursor-pointer flex items-center justify-center gap-2 focus-ring self-stretch sm:self-auto"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Reviewing Content...</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-white stroke-none" />
                  <span>Review Content</span>
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};
