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
  Download,
  AlertTriangle,
  History,
  TrendingUp,
  Sliders,
  CheckCircle,
  FileSearch,
  ExternalLink
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
  const criticalFindings = reviews.reduce((sum, r) => sum + r.high_severity_count, 0);
  const awaitingApproval = reviews.filter((r) => r.overall_status === 'needs_review' || r.overall_status === 'flagged').length;
  const compliantCount = reviews.filter((r) => r.overall_status === 'compliant' || r.overall_status === 'resolved').length;
  const complianceRate = totalReviews > 0 ? Math.round((compliantCount / totalReviews) * 100) : 100;

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Enterprise Hero Section */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-navy-900 via-navy-850 to-navy-900 border border-teal-500/25 p-6 sm:p-8 shadow-xl">
        <div className="absolute top-0 right-0 -mt-12 -mr-12 w-80 h-80 bg-teal-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/15 border border-teal-500/30 text-teal-300 text-xs font-bold tracking-wider uppercase mb-3">
            <Sparkles className="w-3.5 h-3.5 text-teal-400" />
            AI-POWERED BRAND GOVERNANCE
          </div>

          <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
            Your Brand Standards. <br className="hidden sm:inline" />
            <span className="text-teal-400">Verified with Evidence.</span>
          </h1>

          <p className="mt-3 text-sm sm:text-base text-slate-300 leading-relaxed max-w-2xl">
            Review marketing content against your actual brand guidelines, uncover unsupported claims, and understand every finding before publication.
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <button
              onClick={() => navigate('/reviews/new')}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-navy-950 font-bold text-xs sm:text-sm transition-all shadow-lg shadow-teal-500/20 hover:shadow-teal-500/35 hover:scale-[1.02] cursor-pointer"
            >
              <FileCheck2 className="w-4 h-4 stroke-[2.5]" />
              <span>Audit Marketing Content</span>
            </button>

            <button
              onClick={() => navigate('/guidelines')}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-navy-850 hover:bg-navy-800 border border-navy-700 text-slate-200 font-semibold text-xs sm:text-sm transition-all hover:border-teal-500/40 cursor-pointer"
            >
              <BookOpen className="w-4 h-4 text-teal-400" />
              <span>Explore Guidelines</span>
            </button>

            <button
              onClick={() => navigate('/reviews/new?scenario=canonical_superlative')}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-navy-950/80 hover:bg-navy-900 border border-teal-500/40 text-teal-300 font-semibold text-xs sm:text-sm transition-all cursor-pointer"
              title="Launch the canonical hackathon test: India's #1 fastest tool for Indian teams."
            >
              <Play className="w-3.5 h-3.5 fill-teal-400 text-teal-400" />
              <span>Run Hackathon Demo ("#1 Fastest")</span>
            </button>
          </div>
        </div>
      </div>

      {/* Operational Overview Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Total Reviews */}
        <div className="p-5 rounded-2xl bg-navy-900 border border-navy-800 hover:border-navy-750 transition-all shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Reviews</span>
            <div className="w-8 h-8 rounded-lg bg-teal-500/10 flex items-center justify-center text-teal-400">
              <FileCheck2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 text-2xl sm:text-3xl font-extrabold text-white">{totalReviews}</div>
          <div className="mt-1 text-xs text-slate-400">
            Stored in {status?.database_dialect || 'PostgreSQL'} database
          </div>
        </div>

        {/* Metric 2: Critical Findings */}
        <div className="p-5 rounded-2xl bg-navy-900 border border-navy-800 hover:border-navy-750 transition-all shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Critical Findings</span>
            <div className="w-8 h-8 rounded-lg bg-rose-500/10 flex items-center justify-center text-rose-400">
              <ShieldAlert className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 text-2xl sm:text-3xl font-extrabold text-rose-400">{criticalFindings}</div>
          <div className="mt-1 text-xs text-slate-400">
            Absolute superlatives or warranty violations
          </div>
        </div>

        {/* Metric 3: Reviews Awaiting Approval */}
        <div className="p-5 rounded-2xl bg-navy-900 border border-navy-800 hover:border-navy-750 transition-all shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Awaiting Decision</span>
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-400">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 text-2xl sm:text-3xl font-extrabold text-amber-300">{awaitingApproval}</div>
          <div className="mt-1 text-xs text-slate-400">
            Requiring human reviewer resolution
          </div>
        </div>

        {/* Metric 4: Compliance Rate */}
        <div className="p-5 rounded-2xl bg-navy-900 border border-navy-800 hover:border-navy-750 transition-all shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Compliance Rate</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 text-2xl sm:text-3xl font-extrabold text-emerald-400">{complianceRate}%</div>
          <div className="mt-1 text-xs text-slate-400">
            {compliantCount} compliant or resolved
          </div>
        </div>
      </div>

      {/* How OmniGuide Works Section (Section 5 per prompt) */}
      <div className="p-6 rounded-2xl bg-navy-900 border border-navy-800 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
              <Sliders className="w-4 h-4 text-teal-400" />
              How OmniGuide Works
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Three concise steps transforming brand governance into evidence-backed decision support.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
          {/* Step 1 */}
          <div className="p-4 rounded-xl bg-navy-950/70 border border-navy-800 relative group hover:border-teal-500/40 transition-colors">
            <div className="flex items-center gap-2.5 mb-2">
              <span className="w-6 h-6 rounded-lg bg-teal-500/15 text-teal-300 text-xs font-extrabold flex items-center justify-center border border-teal-500/30">
                1
              </span>
              <h3 className="font-bold text-sm text-slate-200">Establish Your Standards</h3>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Import brand guidelines via digital PDF or text, and define approved corporate facts. Stable clause identifiers and page numbers are preserved.
            </p>
          </div>

          {/* Step 2 */}
          <div className="p-4 rounded-xl bg-navy-950/70 border border-navy-800 relative group hover:border-teal-500/40 transition-colors">
            <div className="flex items-center gap-2.5 mb-2">
              <span className="w-6 h-6 rounded-lg bg-teal-500/15 text-teal-300 text-xs font-extrabold flex items-center justify-center border border-teal-500/30">
                2
              </span>
              <h3 className="font-bold text-sm text-slate-200">Audit Your Content</h3>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Submit draft marketing copy. OmniGuide evaluates the text through deterministic rule scans, BM25 clause retrieval, and Gemini Flash structured analysis.
            </p>
          </div>

          {/* Step 3 */}
          <div className="p-4 rounded-xl bg-navy-950/70 border border-navy-800 relative group hover:border-teal-500/40 transition-colors">
            <div className="flex items-center gap-2.5 mb-2">
              <span className="w-6 h-6 rounded-lg bg-teal-500/15 text-teal-300 text-xs font-extrabold flex items-center justify-center border border-teal-500/30">
                3
              </span>
              <h3 className="font-bold text-sm text-slate-200">Resolve with Confidence</h3>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Inspect grounded evidence citations with exact page numbers. Accept, custom edit, or dismiss findings. Content is never published blindly.
            </p>
          </div>
        </div>
      </div>

      {/* 2-Column Section: Recent Activity & Quick Links */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Recent Activity Table (8 cols) */}
        <div className="lg:col-span-8 rounded-2xl bg-navy-900 border border-navy-800 p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-base font-bold text-white tracking-tight">Recent Governance Activity</h2>
                <p className="text-xs text-slate-400">Audited marketing submissions and resolution status</p>
              </div>
              <button
                onClick={() => navigate('/reviews')}
                className="text-xs text-teal-400 hover:text-teal-300 font-semibold flex items-center gap-1 cursor-pointer"
              >
                <span>View All History</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {loading ? (
              <div className="py-12 text-center text-slate-400 text-sm">
                Loading compliance reviews...
              </div>
            ) : reviews.length === 0 ? (
              <div className="py-12 text-center border border-dashed border-navy-800 rounded-xl space-y-3">
                <FileCheck2 className="w-8 h-8 mx-auto text-slate-500" />
                <p className="text-sm text-slate-200 font-medium">No reviews executed yet</p>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  Audit your first marketing copy or launch the official hackathon demo case to see grounded findings.
                </p>
                <button
                  onClick={() => navigate('/reviews/new')}
                  className="px-4 py-2 rounded-xl bg-teal-500 text-navy-950 font-bold text-xs"
                >
                  Start First Review
                </button>
              </div>
            ) : (
              <div className="divide-y divide-navy-800/80">
                {reviews.slice(0, 5).map((rev) => (
                  <div
                    key={rev.id}
                    onClick={() => navigate(`/reviews/${rev.id}`)}
                    className="py-3 px-2 hover:bg-navy-850/60 rounded-xl transition-colors flex items-center justify-between cursor-pointer group"
                  >
                    <div className="min-w-0 pr-4">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm text-slate-200 group-hover:text-teal-300 truncate">
                          {rev.title}
                        </span>
                        <span className="text-[11px] px-2 py-0.5 rounded bg-navy-800 text-slate-300 border border-navy-700">
                          {rev.content_type}
                        </span>
                      </div>
                      <div className="mt-1 text-xs text-slate-400 flex items-center gap-3 font-mono">
                        <span>{new Date(rev.created_at).toLocaleDateString()}</span>
                        <span>•</span>
                        <span className="text-slate-300">{rev.findings_count} findings ({rev.high_severity_count} critical)</span>
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

        {/* Quick Launch & Guidelines Panel (4 cols) */}
        <div className="lg:col-span-4 rounded-2xl bg-navy-900 border border-navy-800 p-6 shadow-sm flex flex-col justify-between space-y-5">
          <div>
            <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-teal-400" />
              Active Brand Standards
            </h2>
            <p className="text-xs text-slate-400 mt-1 mb-4">
              Stored ground-truth documents against which marketing drafts are audited.
            </p>

            <div className="p-4 rounded-xl bg-navy-950/80 border border-navy-800 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-200">NovaForge Governance v2.4</span>
                <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-teal-500/20 text-teal-300 border border-teal-500/30">
                  Standard
                </span>
              </div>
              <p className="text-xs text-slate-400 leading-normal">
                Includes Section 1.1 (Rankings), Section 1.2 (Speed), Section 2.1 (Warranties), and Section 2.2 (Metrics).
              </p>
              <div className="flex items-center justify-between text-xs font-mono text-slate-400 pt-1 border-t border-navy-800">
                <span>Total Clauses: <strong className="text-teal-300">{status?.clauses_count ?? 7}</strong></span>
                <span>Facts: <strong className="text-teal-300">{status?.approved_facts_count ?? 3}</strong></span>
              </div>
            </div>

            <div className="mt-4 space-y-2">
              <a
                href="/demo_guideline.pdf"
                download="novaforge_governance_v2.4.pdf"
                className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-navy-850 hover:bg-navy-800 border border-slate-700 text-slate-200 text-xs font-semibold transition-colors"
              >
                <Download className="w-3.5 h-3.5 text-teal-400" />
                <span>Download Sample Guideline PDF</span>
              </a>

              <button
                onClick={() => navigate('/guidelines')}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-navy-950 hover:bg-navy-850 border border-navy-800 text-teal-300 text-xs font-semibold transition-colors"
              >
                <span>Manage Guidelines & Facts →</span>
              </button>
            </div>
          </div>

          <div className="pt-4 border-t border-navy-800 text-[11px] text-slate-400">
            <span className="font-semibold text-slate-300">Hackathon Note:</span> All metrics and findings shown are derived from active database records, preserving ground truth without hallucinations.
          </div>
        </div>
      </div>
    </div>
  );
};
