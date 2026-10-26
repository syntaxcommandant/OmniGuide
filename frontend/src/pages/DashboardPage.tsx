import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileCheck2,
  ShieldAlert,
  BookOpen,
  ArrowRight,
  Sparkles,
  Play,
  CheckCircle2,
  Layers,
  Download,
  AlertTriangle,
  History,
  TrendingUp
} from 'lucide-react';
import { api } from '../services/api';
import { ReviewListItem, SystemStatus } from '../types';
import { StatusBadge } from '../components/common/Badge';

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const [reviews, setReviews] = useState<ReviewListItem[]>([]);
  const [status, setStatus] = useState<SystemStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.getReviews(), api.getStatus()])
      .then(([revData, statData]) => {
        setReviews(revData);
        setStatus(statData);
      })
      .catch((err) => console.error('Dashboard load error:', err))
      .finally(() => setLoading(false));
  }, []);

  const totalReviews = reviews.length;
  const compliantCount = reviews.filter((r) => r.overall_status === 'compliant' || r.overall_status === 'resolved').length;
  const complianceRate = totalReviews > 0 ? Math.round((compliantCount / totalReviews) * 100) : 100;
  const totalHighSeverity = reviews.reduce((sum, r) => sum + r.high_severity_count, 0);

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Hero / Vision Card */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-navy-900 via-navy-850 to-navy-900 border border-teal-500/30 p-6 sm:p-8 shadow-xl">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-teal-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/15 border border-teal-500/30 text-teal-300 text-xs font-semibold mb-3">
            <Sparkles className="w-3.5 h-3.5 text-teal-400" />
            Team NovaForge • National Hackathon Project
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            AI Brand Governance That <span className="text-teal-400">Explains</span>, Not Just Rejects.
          </h1>
          <p className="mt-2 text-sm sm:text-base text-slate-300 leading-relaxed">
            OmniGuide helps marketing teams audit copy before publication. Every flagged claim is grounded in verified guideline clauses with exact page references, preventing silent hallucinations and preserving marketing intent.
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <button
              onClick={() => navigate('/reviews/new')}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-navy-950 font-bold text-sm transition-all shadow-lg shadow-teal-500/25 hover:shadow-teal-500/40 cursor-pointer"
            >
              <FileCheck2 className="w-4 h-4 stroke-[2.5]" />
              Audit Marketing Content
            </button>
            <button
              onClick={() => navigate('/reviews/new?scenario=canonical_superlative')}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-navy-800 hover:bg-navy-700 border border-teal-500/40 text-teal-300 font-semibold text-sm transition-all cursor-pointer"
            >
              <Play className="w-4 h-4 fill-teal-400 text-teal-400" />
              Run Canonical Demo ("#1 Fastest")
            </button>
            <a
              href="/demo_guideline.pdf"
              download="novaforge_governance_v2.4.pdf"
              className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-navy-800/80 hover:bg-navy-800 border border-slate-700 text-slate-300 text-xs font-medium transition-all"
            >
              <Download className="w-3.5 h-3.5 text-slate-400" />
              Download Test PDF
            </a>
          </div>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1 */}
        <div className="p-5 rounded-xl bg-navy-900 border border-navy-800 hover:border-navy-700 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Total Reviews</span>
            <div className="w-8 h-8 rounded-lg bg-teal-500/10 flex items-center justify-center text-teal-400">
              <FileCheck2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-bold text-white">{totalReviews}</div>
          <div className="mt-1 flex items-center gap-1.5 text-xs text-slate-400">
            <span>Persisted in PostgreSQL database</span>
          </div>
        </div>

        {/* Metric 2 */}
        <div className="p-5 rounded-xl bg-navy-900 border border-navy-800 hover:border-navy-700 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Compliance Rate</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-bold text-emerald-400">{complianceRate}%</div>
          <div className="mt-1 text-xs text-slate-400">
            {compliantCount} compliant / resolved
          </div>
        </div>

        {/* Metric 3 */}
        <div className="p-5 rounded-xl bg-navy-900 border border-navy-800 hover:border-navy-700 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">High Severity Flags</span>
            <div className="w-8 h-8 rounded-lg bg-rose-500/10 flex items-center justify-center text-rose-400">
              <ShieldAlert className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-bold text-rose-400">{totalHighSeverity}</div>
          <div className="mt-1 text-xs text-slate-400">Legal or absolute violations</div>
        </div>

        {/* Metric 4 */}
        <div className="p-5 rounded-xl bg-navy-900 border border-navy-800 hover:border-navy-700 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Active Ground-Truth Clauses</span>
            <div className="w-8 h-8 rounded-lg bg-teal-500/10 flex items-center justify-center text-teal-400">
              <BookOpen className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-bold text-teal-300">{status?.clauses_count ?? 7}</div>
          <div className="mt-1 text-xs text-slate-400">
            {status?.approved_facts_count ?? 3} approved corporate facts
          </div>
        </div>
      </div>

      {/* 2-Column Section: Recent Reviews & Governance Architecture */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Reviews (2 cols) */}
        <div className="lg:col-span-2 rounded-xl bg-navy-900 border border-navy-800 p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-base font-bold text-white">Recent Compliance Reviews</h2>
                <p className="text-xs text-slate-400">Audited marketing submissions and human decisions</p>
              </div>
              <button
                onClick={() => navigate('/reviews')}
                className="text-xs text-teal-400 hover:text-teal-300 font-medium flex items-center gap-1 cursor-pointer"
              >
                <span>View All History</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {loading ? (
              <div className="py-12 text-center text-slate-400 text-sm">Loading reviews...</div>
            ) : reviews.length === 0 ? (
              <div className="py-12 text-center border border-dashed border-navy-800 rounded-lg">
                <FileCheck2 className="w-8 h-8 mx-auto text-slate-500 mb-2" />
                <p className="text-sm text-slate-300 font-medium">No reviews executed yet</p>
                <p className="text-xs text-slate-500 mt-1">Submit your first marketing copy or run the demo</p>
                <button
                  onClick={() => navigate('/reviews/new')}
                  className="mt-3 px-3 py-1.5 text-xs font-semibold rounded-lg bg-teal-500 text-navy-950 hover:bg-teal-400"
                >
                  Create Review
                </button>
              </div>
            ) : (
              <div className="divide-y divide-navy-800/80">
                {reviews.slice(0, 5).map((rev) => (
                  <div
                    key={rev.id}
                    onClick={() => navigate(`/reviews/${rev.id}`)}
                    className="py-3.5 px-2 hover:bg-navy-850/60 rounded-lg transition-colors flex items-center justify-between cursor-pointer group"
                  >
                    <div className="min-w-0 pr-4">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm text-slate-200 group-hover:text-teal-300 truncate">
                          {rev.title}
                        </span>
                        <span className="text-[11px] px-2 py-0.5 rounded bg-navy-800 text-slate-400 border border-navy-700">
                          {rev.content_type}
                        </span>
                      </div>
                      <div className="mt-1 text-xs text-slate-400 flex items-center gap-3">
                        <span>{new Date(rev.created_at).toLocaleDateString()}</span>
                        <span>•</span>
                        <span className="text-slate-300">{rev.findings_count} findings ({rev.high_severity_count} high)</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <StatusBadge status={rev.overall_status} />
                      <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-teal-400 transition-transform group-hover:translate-x-0.5" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Governance Pipeline Architecture (1 col) */}
        <div className="rounded-xl bg-navy-900 border border-navy-800 p-6 flex flex-col justify-between">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-teal-400" />
              Hybrid Governance Pipeline
            </h2>
            <p className="text-xs text-slate-400 mt-1 mb-5">
              How OmniGuide avoids hallucinations and proves compliance:
            </p>

            <div className="space-y-4 text-xs">
              <div className="flex items-start gap-3">
                <span className="w-5 h-5 rounded-full bg-teal-500/20 text-teal-300 font-bold flex items-center justify-center shrink-0 border border-teal-500/30">
                  1
                </span>
                <div>
                  <span className="font-semibold text-slate-200">Deterministic Rule Matching</span>
                  <p className="text-slate-400 text-[11px] mt-0.5">
                    Regex scans for absolute superlatives, banned words, and missing approved metrics.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <span className="w-5 h-5 rounded-full bg-teal-500/20 text-teal-300 font-bold flex items-center justify-center shrink-0 border border-teal-500/30">
                  2
                </span>
                <div>
                  <span className="font-semibold text-slate-200">Guideline Retrieval</span>
                  <p className="text-slate-400 text-[11px] mt-0.5">
                    Lexical BM25 retrieval pulls relevant clauses with source document and page numbers.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <span className="w-5 h-5 rounded-full bg-teal-500/20 text-teal-300 font-bold flex items-center justify-center shrink-0 border border-teal-500/30">
                  3
                </span>
                <div>
                  <span className="font-semibold text-slate-200">Gemini Flash Structured Analysis</span>
                  <p className="text-slate-400 text-[11px] mt-0.5">
                    Generates intent-preserving corrections and explains why issues matter via Pydantic JSON.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <span className="w-5 h-5 rounded-full bg-teal-500/20 text-teal-300 font-bold flex items-center justify-center shrink-0 border border-teal-500/30">
                  4
                </span>
                <div>
                  <span className="font-semibold text-slate-200">Anti-Hallucination Cross-Check</span>
                  <p className="text-slate-400 text-[11px] mt-0.5">
                    Strictly verifies every cited clause ID against real database records.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <span className="w-5 h-5 rounded-full bg-teal-500/20 text-teal-300 font-bold flex items-center justify-center shrink-0 border border-teal-500/30">
                  5
                </span>
                <div>
                  <span className="font-semibold text-slate-200">Human-in-the-Loop Decision</span>
                  <p className="text-slate-400 text-[11px] mt-0.5">
                    Marketers accept, edit, or dismiss findings. AI never silently publishes.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-navy-800 text-center">
            <button
              onClick={() => navigate('/guidelines')}
              className="text-xs text-teal-400 hover:text-teal-300 font-medium"
            >
              Inspect Stored Guidelines & Clauses →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
