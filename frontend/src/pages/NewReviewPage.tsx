import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, NavLink } from 'react-router-dom';
import {
  FileCheck2,
  Sparkles,
  Cpu,
  AlertCircle,
  Play,
  RotateCcw,
  BookOpen,
  CheckCircle2,
  Layers,
  ArrowRight,
  Info
} from 'lucide-react';
import { api } from '../services/api';
import { DemoScenario, GuidelineDocument } from '../types';

export const NewReviewPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Form states
  const [title, setTitle] = useState('');
  const [contentType, setContentType] = useState('Social Ad Copy');
  const [content, setContent] = useState('');
  const [campaignContext, setCampaignContext] = useState('');
  const [analysisMode, setAnalysisMode] = useState<'hybrid' | 'deterministic'>('hybrid');
  
  // Stored guidelines and demo scenarios
  const [scenarios, setScenarios] = useState<DemoScenario[]>([]);
  const [guidelines, setGuidelines] = useState<GuidelineDocument[]>([]);
  const [selectedGuidelineId, setSelectedGuidelineId] = useState<string>('');

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([api.getDemoScenarios(), api.getGuidelines()])
      .then(([scData, gData]) => {
        setScenarios(scData);
        setGuidelines(gData);
        if (gData.length > 0) {
          setSelectedGuidelineId(gData[0].id);
        }
      })
      .catch((err) => console.warn('Initialization error:', err));
  }, []);

  // Pre-load scenario from query params
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
  const isContentEmpty = content.trim().length === 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!title.trim()) {
      setErrorMsg('Step 1: Please enter a campaign or review title.');
      return;
    }
    if (content.trim().length < 3) {
      setErrorMsg('Step 2: Please enter marketing content text of at least 3 characters.');
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

      // Navigate directly to the results inspector
      navigate(`/reviews/${review.id}`);
    } catch (err: any) {
      setErrorMsg(err.message || 'Review execution failed. Please verify engine status.');
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto animate-fadeIn">
      {/* Header */}
      <div className="pb-4 border-b border-navy-800">
        <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
          <FileCheck2 className="w-6 h-6 text-teal-400" />
          Audit Marketing Content
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Follow the 4-step workflow to evaluate marketing copy against verified brand guidelines and approved facts.
        </p>
      </div>

      {/* Evaluation Scenarios Bar */}
      <div className="p-4 rounded-2xl bg-navy-900 border border-teal-500/30 shadow-sm">
        <div className="flex items-center justify-between mb-2.5">
          <span className="text-xs font-bold text-teal-300 uppercase tracking-wider flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-teal-400" />
            Pre-load Hackathon Evaluation Scenarios:
          </span>
          <span className="text-[11px] text-slate-400">Click to autofill form</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
          {scenarios.map((sc) => (
            <button
              key={sc.id}
              type="button"
              onClick={() => loadScenario(sc.id)}
              className="p-3 rounded-xl bg-navy-950 hover:bg-navy-850 border border-navy-800 hover:border-teal-500/50 text-left transition-all group cursor-pointer"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-200 group-hover:text-teal-300 truncate">
                  {sc.title}
                </span>
                <Play className="w-3 h-3 text-slate-500 group-hover:text-teal-400 fill-current shrink-0 ml-1" />
              </div>
              <p className="mt-1 text-[11px] text-slate-400 line-clamp-1 italic font-mono">
                "{sc.content}"
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* Validation / Error banner */}
      {errorMsg && (
        <div className="p-4 rounded-xl bg-rose-500/15 border border-rose-500/40 text-rose-300 text-sm flex items-start gap-3 shadow-md">
          <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
          <div>
            <div className="font-bold">Review Submission Error</div>
            <div className="text-xs text-rose-200 mt-0.5 leading-relaxed">{errorMsg}</div>
          </div>
        </div>
      )}

      {/* Main Step-by-Step Form per Section 6 */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* STEP 1: Campaign Information */}
        <div className="p-6 rounded-2xl bg-navy-900 border border-navy-800 shadow-sm space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-navy-800">
            <span className="w-6 h-6 rounded-lg bg-teal-500/20 text-teal-300 text-xs font-extrabold flex items-center justify-center border border-teal-500/35">
              1
            </span>
            <div>
              <h2 className="text-sm font-bold text-white">Campaign & Content Information</h2>
              <p className="text-xs text-slate-400">Specify the collateral type and campaign context</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Campaign / Content Title <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Q1 National Product Launch Social Campaign"
                className="w-full px-3.5 py-2.5 rounded-xl bg-navy-950 border border-navy-750 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-teal-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Content Type</label>
              <select
                value={contentType}
                onChange={(e) => setContentType(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-navy-950 border border-navy-750 text-sm text-slate-100 focus:outline-none focus:border-teal-500"
              >
                <option value="Social Ad Copy">Social Ad Copy</option>
                <option value="Website Copy">Website Copy / Hero</option>
                <option value="Email Campaign">Email Campaign</option>
                <option value="Press Release">Press Release</option>
                <option value="Campaign Copy">General Campaign Copy</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Audience or Market Context <span className="text-slate-500 font-normal">(Optional)</span>
            </label>
            <input
              type="text"
              value={campaignContext}
              onChange={(e) => setCampaignContext(e.target.value)}
              placeholder="e.g. Enterprise IT decision-makers in India, emphasizing latency and uptime."
              className="w-full px-3.5 py-2.5 rounded-xl bg-navy-950 border border-navy-750 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-teal-500"
            />
          </div>
        </div>

        {/* STEP 2: Content Input */}
        <div className="p-6 rounded-2xl bg-navy-900 border border-navy-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-navy-800">
            <div className="flex items-center gap-2.5">
              <span className="w-6 h-6 rounded-lg bg-teal-500/20 text-teal-300 text-xs font-extrabold flex items-center justify-center border border-teal-500/35">
                2
              </span>
              <div>
                <h2 className="text-sm font-bold text-white">Marketing Content Input</h2>
                <p className="text-xs text-slate-400">Paste or type the draft copy to be evaluated</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className={`text-[11px] px-2 py-0.5 rounded font-mono ${
                isContentEmpty ? 'bg-amber-500/10 text-amber-300 border border-amber-500/20' : 'bg-teal-500/10 text-teal-300 border border-teal-500/20'
              }`}>
                {isContentEmpty ? 'Input Empty' : `${wordCount} words • ${charCount} chars`}
              </span>
            </div>
          </div>

          <div>
            <textarea
              rows={6}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Type or paste marketing copy here... (e.g. 'India's #1 fastest tool for Indian teams.')"
              className="w-full p-4 rounded-xl bg-navy-950 border border-navy-750 text-sm text-slate-100 placeholder-slate-500 font-medium leading-relaxed focus:outline-none focus:border-teal-500"
            />
          </div>
        </div>

        {/* STEP 3: Guideline Selection */}
        <div className="p-6 rounded-2xl bg-navy-900 border border-navy-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-navy-800">
            <div className="flex items-center gap-2.5">
              <span className="w-6 h-6 rounded-lg bg-teal-500/20 text-teal-300 text-xs font-extrabold flex items-center justify-center border border-teal-500/35">
                3
              </span>
              <div>
                <h2 className="text-sm font-bold text-white">Guideline Standards & Evidence Selection</h2>
                <p className="text-xs text-slate-400">Ground truth policies against which claims are checked</p>
              </div>
            </div>

            <NavLink
              to="/guidelines"
              className="text-xs text-teal-400 hover:text-teal-300 font-medium flex items-center gap-1"
            >
              <span>Manage Standards</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </NavLink>
          </div>

          {guidelines.length === 0 ? (
            <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/25 text-amber-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>No guidelines currently stored. Upload a guideline PDF in Guidelines & Facts.</span>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {guidelines.map((doc) => (
                <label
                  key={doc.id}
                  className={`p-3.5 rounded-xl border flex items-start gap-3 cursor-pointer transition-all ${
                    selectedGuidelineId === doc.id
                      ? 'bg-teal-500/10 border-teal-500/50 shadow-sm'
                      : 'bg-navy-950 border-navy-800 text-slate-400 hover:border-navy-700'
                  }`}
                >
                  <input
                    type="radio"
                    name="guidelineDoc"
                    value={doc.id}
                    checked={selectedGuidelineId === doc.id}
                    onChange={() => setSelectedGuidelineId(doc.id)}
                    className="mt-0.5 text-teal-500 focus:ring-0"
                  />
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs text-slate-200 truncate">{doc.title}</span>
                      {doc.is_demo && (
                        <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-teal-500/20 text-teal-300 border border-teal-500/30">
                          Active
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1 font-mono">
                      File: {doc.filename} • {doc.clause_count || doc.clauses?.length || 7} Indexed Clauses
                    </p>
                  </div>
                </label>
              ))}
            </div>
          )}

          {/* Engine Mode Toggle */}
          <div className="pt-2 border-t border-navy-800">
            <div className="flex items-center justify-between text-xs mb-2">
              <span className="text-slate-300 font-semibold flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-teal-400" />
                Select Engine Analysis Mode:
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label
                className={`p-3 rounded-xl border flex items-start gap-2.5 cursor-pointer transition-all ${
                  analysisMode === 'hybrid'
                    ? 'bg-teal-500/10 border-teal-500/50 text-white'
                    : 'bg-navy-950 border-navy-800 text-slate-400'
                }`}
              >
                <input
                  type="radio"
                  name="analysisMode"
                  value="hybrid"
                  checked={analysisMode === 'hybrid'}
                  onChange={() => setAnalysisMode('hybrid')}
                  className="mt-0.5 text-teal-500"
                />
                <div>
                  <div className="text-xs font-bold text-slate-200 flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-teal-400" />
                    Hybrid Mode (Gemini Flash + Deterministic)
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Synthesizes contextual LLM audit with deterministic rules and real clause retrieval.
                  </p>
                </div>
              </label>

              <label
                className={`p-3 rounded-xl border flex items-start gap-2.5 cursor-pointer transition-all ${
                  analysisMode === 'deterministic'
                    ? 'bg-blue-500/10 border-blue-500/50 text-white'
                    : 'bg-navy-950 border-navy-800 text-slate-400'
                }`}
              >
                <input
                  type="radio"
                  name="analysisMode"
                  value="deterministic"
                  checked={analysisMode === 'deterministic'}
                  onChange={() => setAnalysisMode('deterministic')}
                  className="mt-0.5 text-blue-500"
                />
                <div>
                  <div className="text-xs font-bold text-slate-200 flex items-center gap-1">
                    <Cpu className="w-3 h-3 text-blue-400" />
                    Deterministic Mode Only
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Strict regex patterns, approved facts checking, and lexical BM25 matching.
                  </p>
                </div>
              </label>
            </div>
          </div>
        </div>

        {/* STEP 4: Start Review */}
        <div className="p-6 rounded-2xl bg-navy-900 border border-navy-800 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-teal-500/20 text-teal-300 text-xs font-extrabold flex items-center justify-center border border-teal-500/35">
                4
              </span>
              <h2 className="text-sm font-bold text-white">Execute Brand Governance Audit</h2>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Runs content analysis pipeline and produces explainable, evidence-backed findings.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => {
                setTitle('');
                setContent('');
                setCampaignContext('');
                setErrorMsg(null);
              }}
              className="px-3.5 py-2.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-white flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>

            <button
              type="submit"
              disabled={loading || isContentEmpty}
              className="px-6 py-3 rounded-xl bg-teal-500 hover:bg-teal-400 disabled:opacity-50 text-navy-950 font-bold text-sm transition-all shadow-lg shadow-teal-500/20 hover:scale-[1.02] flex items-center gap-2 cursor-pointer"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-navy-950 border-t-transparent rounded-full animate-spin"></div>
                  <span>Running Brand Audit...</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-navy-950 stroke-none" />
                  <span>Run Brand Audit</span>
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};
