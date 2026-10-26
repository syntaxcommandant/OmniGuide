import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  FileCheck2,
  Sparkles,
  Cpu,
  AlertCircle,
  Play,
  RotateCcw,
  Layers,
  HelpCircle,
  CheckCircle2
} from 'lucide-react';
import { api } from '../services/api';
import { DemoScenario } from '../types';

export const NewReviewPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [title, setTitle] = useState('');
  const [contentType, setContentType] = useState('Social Ad Copy');
  const [content, setContent] = useState('');
  const [campaignContext, setCampaignContext] = useState('');
  const [analysisMode, setAnalysisMode] = useState<'hybrid' | 'deterministic'>('hybrid');
  const [scenarios, setScenarios] = useState<DemoScenario[]>([]);

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    api.getDemoScenarios()
      .then(setScenarios)
      .catch((err) => console.warn('Could not load demo scenarios:', err));
  }, []);

  // Pre-load scenario from URL query param if present
  useEffect(() => {
    const scenarioId = searchParams.get('scenario');
    if (scenarioId && scenarios.length > 0) {
      loadScenario(scenarioId);
    }
  }, [searchParams, scenarios]);

  const loadScenario = (id: string) => {
    const sc = scenarios.find((s) => s.id === id);
    if (sc) {
      setTitle(sc.title);
      setContentType(sc.content_type);
      setContent(sc.content);
      setCampaignContext(sc.campaign_context);
      setErrorMsg(null);
    }
  };

  const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0;
  const charCount = content.length;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!title.trim()) {
      setErrorMsg('Please enter a review title or campaign identifier.');
      return;
    }
    if (content.trim().length < 3) {
      setErrorMsg('Please enter marketing content text of at least 3 characters.');
      return;
    }

    setLoading(true);
    try {
      const review = await api.startReview({
        title: title.trim(),
        content_type: contentType,
        content: content.trim(),
        campaign_context: campaignContext.trim() || undefined,
        analysis_mode: analysisMode,
      });

      // Jump straight to the results inspector!
      navigate(`/reviews/${review.id}`);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to analyze content. Please check server status.');
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Title */}
      <div className="pb-4 border-b border-navy-800 flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
            <FileCheck2 className="w-6 h-6 text-teal-400" />
            Audit Marketing Content
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Submit draft marketing copy to run ground-truth guideline verification and evidence-backed checks.
          </p>
        </div>
      </div>

      {/* Demo Scenario Quick-Fill Bar */}
      <div className="p-4 rounded-xl bg-navy-900 border border-teal-500/30">
        <div className="flex items-center gap-2 text-xs font-bold text-teal-300 uppercase tracking-wider mb-2.5">
          <Sparkles className="w-4 h-4 text-teal-400" />
          Pre-load Hackathon Evaluation Scenarios:
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
          {scenarios.map((sc) => (
            <button
              key={sc.id}
              type="button"
              onClick={() => loadScenario(sc.id)}
              className="p-2.5 rounded-lg bg-navy-950 hover:bg-navy-850 border border-navy-800 hover:border-teal-500/50 text-left transition-all group cursor-pointer"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-200 group-hover:text-teal-300 truncate">
                  {sc.title}
                </span>
                <Play className="w-3 h-3 text-slate-500 group-hover:text-teal-400 fill-current" />
              </div>
              <p className="mt-1 text-[11px] text-slate-400 line-clamp-1 italic font-mono">
                "{sc.content}"
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* Error alert */}
      {errorMsg && (
        <div className="p-4 rounded-xl bg-rose-500/15 border border-rose-500/40 text-rose-300 text-sm flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
          <div>
            <div className="font-semibold">Review Error</div>
            <div className="text-xs text-rose-200 mt-0.5 leading-relaxed">{errorMsg}</div>
          </div>
        </div>
      )}

      {/* Main Review Form */}
      <form onSubmit={handleSubmit} className="p-6 rounded-2xl bg-navy-900 border border-navy-800 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Review Title / Campaign Name <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Q1 National Product Launch Social Campaign"
              className="w-full px-3.5 py-2.5 rounded-xl bg-navy-950 border border-navy-700 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-teal-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Content Type</label>
            <select
              value={contentType}
              onChange={(e) => setContentType(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-navy-950 border border-navy-700 text-sm text-slate-100 focus:outline-none focus:border-teal-500"
            >
              <option value="Social Ad Copy">Social Ad Copy</option>
              <option value="Press Release">Press Release</option>
              <option value="Website Hero Headline">Website Hero Headline</option>
              <option value="Email Newsletter">Email Newsletter</option>
              <option value="Blog Article Excerpt">Blog Article Excerpt</option>
              <option value="Sales One-Pager">Sales One-Pager</option>
            </select>
          </div>
        </div>

        {/* Marketing Textarea */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-xs font-semibold text-slate-300">
              Marketing Copy Text to Review <span className="text-rose-400">*</span>
            </label>
            <span className="text-[11px] text-slate-400 font-mono">
              {wordCount} words • {charCount} chars
            </span>
          </div>
          <textarea
            rows={5}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Type or paste the marketing copy you want to evaluate against brand guidelines..."
            className="w-full px-4 py-3 rounded-xl bg-navy-950 border border-navy-700 text-sm text-slate-100 placeholder-slate-500 font-medium leading-relaxed focus:outline-none focus:border-teal-500"
          />
        </div>

        {/* Campaign / Brand Context */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1.5">
            Optional Campaign Context or Audience
          </label>
          <input
            type="text"
            value={campaignContext}
            onChange={(e) => setCampaignContext(e.target.value)}
            placeholder="e.g. Target audience is Indian enterprise IT decision makers, Q1 2026."
            className="w-full px-3.5 py-2.5 rounded-xl bg-navy-950 border border-navy-700 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-teal-500"
          />
        </div>

        {/* Analysis Mode Toggle */}
        <div className="p-4 rounded-xl bg-navy-950 border border-navy-800">
          <div className="text-xs font-semibold text-slate-300 mb-2.5 flex items-center gap-1.5">
            <Layers className="w-4 h-4 text-teal-400" />
            <span>Select Governance Analysis Mode:</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label
              className={`p-3 rounded-xl border flex items-start gap-3 cursor-pointer transition-all ${
                analysisMode === 'hybrid'
                  ? 'bg-teal-500/10 border-teal-500/50 text-white'
                  : 'bg-navy-900 border-navy-800 text-slate-400 hover:border-navy-700'
              }`}
            >
              <input
                type="radio"
                name="analysisMode"
                value="hybrid"
                checked={analysisMode === 'hybrid'}
                onChange={() => setAnalysisMode('hybrid')}
                className="mt-0.5 text-teal-500 focus:ring-0"
              />
              <div>
                <div className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-teal-400" />
                  Hybrid (Gemini Flash + Deterministic Rules)
                </div>
                <p className="text-[11px] text-slate-400 mt-1 leading-normal">
                  Recommended. Synthesizes AI contextual understanding with deterministic rules and retrieves real clauses.
                </p>
              </div>
            </label>

            <label
              className={`p-3 rounded-xl border flex items-start gap-3 cursor-pointer transition-all ${
                analysisMode === 'deterministic'
                  ? 'bg-blue-500/10 border-blue-500/50 text-white'
                  : 'bg-navy-900 border-navy-800 text-slate-400 hover:border-navy-700'
              }`}
            >
              <input
                type="radio"
                name="analysisMode"
                value="deterministic"
                checked={analysisMode === 'deterministic'}
                onChange={() => setAnalysisMode('deterministic')}
                className="mt-0.5 text-blue-500 focus:ring-0"
              />
              <div>
                <div className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                  <Cpu className="w-3.5 h-3.5 text-blue-400" />
                  Deterministic Engine Only (Offline / Fast)
                </div>
                <p className="text-[11px] text-slate-400 mt-1 leading-normal">
                  Strict regex patterns, approved facts checking, and lexical clause citations without calling external LLM APIs.
                </p>
              </div>
            </label>
          </div>
        </div>

        {/* Submit Bar */}
        <div className="flex items-center justify-between pt-2">
          <button
            type="button"
            onClick={() => {
              setTitle('');
              setContent('');
              setCampaignContext('');
              setErrorMsg(null);
            }}
            className="px-3.5 py-2 rounded-xl text-xs text-slate-400 hover:text-white flex items-center gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Fields</span>
          </button>

          <button
            type="submit"
            disabled={loading}
            className="px-6 py-3 rounded-xl bg-teal-500 hover:bg-teal-400 disabled:opacity-50 text-navy-950 font-bold text-sm transition-all shadow-lg shadow-teal-500/25 flex items-center gap-2 cursor-pointer"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-navy-950 border-t-transparent rounded-full animate-spin"></div>
                <span>Executing Governance Pipeline...</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-navy-950 stroke-none" />
                <span>Run Brand Compliance Review</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
