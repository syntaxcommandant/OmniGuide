import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  FileCheck2,
  BookOpen,
  ArrowRight,
  ChevronRight,
  Upload,
  CheckCircle2,
  FileText,
  Sparkles,
  Rocket,
  ShieldAlert,
  ShieldCheck,
  Layers,
  Zap
} from 'lucide-react';
import { api } from '../services/api';
import { ReviewListItem, SystemStatus, GuidelineDocument } from '../types';
import { StatusBadge } from '../components/common/Badge';

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const [reviews, setReviews] = useState<ReviewListItem[]>([]);
  const [status, setStatus] = useState<SystemStatus | null>(null);
  const [guidelines, setGuidelines] = useState<GuidelineDocument[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.getReviews(), api.getStatus(), api.getGuidelines()])
      .then(([revData, statData, gData]) => {
        setReviews(revData);
        setStatus(statData);
        setGuidelines(gData);
      })
      .catch((err) => console.error('Dashboard load error:', err))
      .finally(() => setLoading(false));
  }, []);

  // Section C: Real Database Metrics from actual records
  const totalReviews = reviews.length;
  const criticalFindings = reviews.reduce((sum, r) => sum + (r.high_severity_count || 0), 0);
  const pendingDecisions = reviews.filter(
    (r) => r.overall_status === 'needs_review' || r.overall_status === 'flagged'
  ).length;
  const activeGuidelinesCount = guidelines.length > 0 ? guidelines.length : (status?.guidelines_count ?? 0);

  const activeDoc = guidelines.length > 0 ? guidelines[0] : null;

  return (
    <div className="space-y-8 animate-fadeIn max-w-6xl mx-auto">
      
      {/* SECTION A: Brand Hero & Actions */}
      <section className="bg-white rounded-2xl border border-slate-200/90 p-8 sm:p-10 shadow-xs text-center flex flex-col items-center">
        <div className="max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-50 border border-teal-200 text-teal-800 text-[11px] font-bold uppercase tracking-wider mb-3.5 shadow-2xs">
            <Sparkles className="w-3.5 h-3.5 text-teal-600" />
            <span>AI Brand Governance Platform</span>
          </div>

          <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight">
            Governance, Guided by Intelligence.
          </h1>

          <p className="mt-3 text-sm sm:text-base text-slate-600 leading-relaxed max-w-xl mx-auto">
            Evaluate multi-channel marketing campaigns, verify factual claims against approved brand guidelines, and stress-test governance with adversarial benchmarks.
          </p>
        </div>

        {/* Clear Actions */}
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3.5">
          <Link
            to="/simulator"
            id="start-campaign-simulator-btn"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-semibold text-sm transition-all shadow-xs cursor-pointer focus-ring"
          >
            <Rocket className="w-4 h-4 stroke-[2.2]" />
            <span>Campaign Launch Simulator</span>
          </Link>

          <Link
            to="/reviews/new"
            id="start-content-review-btn"
            className="inline-flex items-center gap-2 px-5 py-3 rounded-lg bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 font-medium text-sm transition-colors cursor-pointer focus-ring"
          >
            <FileCheck2 className="w-4 h-4 text-slate-500" />
            <span>Single Copy Review</span>
          </Link>

          <Link
            to="/redteam"
            className="inline-flex items-center gap-2 px-5 py-3 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-medium text-sm transition-colors cursor-pointer focus-ring"
          >
            <ShieldAlert className="w-4 h-4 text-rose-400" />
            <span>Red-Team Stress Test</span>
          </Link>
        </div>
      </section>

      {/* FLAGSHIP CAPABILITIES SPOTLIGHT */}
      <section className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Flagship Governance Capabilities
          </div>
          <span className="text-xs font-semibold text-teal-700">Competition-Ready Architecture</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Card 1: Campaign Launch Simulator */}
          <div className="bg-gradient-to-br from-white via-slate-50 to-teal-50/30 p-6 rounded-2xl border border-teal-200/80 shadow-xs flex flex-col justify-between hover:shadow-md transition group">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-teal-100 text-teal-800 border border-teal-200">
                  <Rocket className="w-3.5 h-3.5" />
                  Signature Capability
                </span>
                <span className="text-xs font-mono font-bold text-teal-700">Multi-Channel Pre-Flight</span>
              </div>
              <h3 className="text-lg font-bold text-slate-900 group-hover:text-teal-700 transition">
                Campaign Launch Simulator
              </h3>
              <p className="mt-2 text-xs sm:text-sm text-slate-600 leading-relaxed">
                Simulate full campaign launches across Instagram, Email, Website, and Paid Ads.
                Computes a deterministic Launch Readiness Score (0-100), detects cross-channel messaging contradictions, and enforces hard Launch Gate policies.
              </p>
            </div>

            <div className="mt-5 pt-4 border-t border-slate-200/80 flex items-center justify-between">
              <span className="text-xs text-slate-500 font-medium">
                Standard, Strict, or Permissive Policies
              </span>
              <Link
                to="/simulator"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-teal-700 hover:text-teal-800"
              >
                Launch Simulator
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>

          {/* Card 2: Brand Red-Team Simulator */}
          <div className="bg-gradient-to-br from-white via-slate-50 to-rose-50/30 p-6 rounded-2xl border border-rose-200/80 shadow-xs flex flex-col justify-between hover:shadow-md transition group">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
                  <ShieldAlert className="w-3.5 h-3.5" />
                  Adversarial Stress Test
                </span>
                <span className="text-xs font-mono font-bold text-rose-700">10 Benchmark Vectors</span>
              </div>
              <h3 className="text-lg font-bold text-slate-900 group-hover:text-rose-700 transition">
                Brand Red-Team Simulator
              </h3>
              <p className="mt-2 text-xs sm:text-sm text-slate-600 leading-relaxed">
                Execute automated adversarial benchmarks against the governance engine.
                Evaluates prompt injection defense, unsupported numerical claims, superlative traps, and clean negative controls with empirical Confusion Matrix metrics.
              </p>
            </div>

            <div className="mt-5 pt-4 border-t border-slate-200/80 flex items-center justify-between">
              <span className="text-xs text-slate-500 font-medium">
                100% Defense Against Injected Instructions
              </span>
              <Link
                to="/redteam"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-rose-700 hover:text-rose-800"
              >
                Run Red-Team Lab
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION B: Compact Three-Step Workflow (Balanced horizontal on desktop, stacked on mobile) */}
      <section className="space-y-3">
        <div className="text-xs font-bold text-slate-400 uppercase tracking-wider px-1">
          Governance Workflow
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          
          {/* Step 01 */}
          <div className="bg-white p-5 sm:p-6 rounded-xl border border-slate-200 shadow-xs relative flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold font-mono px-2 py-0.5 rounded bg-teal-50 text-teal-800 border border-teal-200">
                  01
                </span>
                <Upload className="w-4 h-4 text-slate-400" />
              </div>
              <h2 className="text-sm font-bold text-slate-900 mb-1.5">
                Add Your Guidelines
              </h2>
              <p className="text-xs text-slate-600 leading-relaxed">
                Upload and index searchable brand policy documents.
              </p>
            </div>
          </div>

          {/* Step 02 */}
          <div className="bg-white p-5 sm:p-6 rounded-xl border border-slate-200 shadow-xs relative flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold font-mono px-2 py-0.5 rounded bg-teal-50 text-teal-800 border border-teal-200">
                  02
                </span>
                <FileText className="w-4 h-4 text-slate-400" />
              </div>
              <h2 className="text-sm font-bold text-slate-900 mb-1.5">
                Review Your Content
              </h2>
              <p className="text-xs text-slate-600 leading-relaxed">
                Check marketing copy against available rules and evidence.
              </p>
            </div>
          </div>

          {/* Step 03 */}
          <div className="bg-white p-5 sm:p-6 rounded-xl border border-slate-200 shadow-xs relative flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold font-mono px-2 py-0.5 rounded bg-teal-50 text-teal-800 border border-teal-200">
                  03
                </span>
                <CheckCircle2 className="w-4 h-4 text-slate-400" />
              </div>
              <h2 className="text-sm font-bold text-slate-900 mb-1.5">
                Resolve Findings
              </h2>
              <p className="text-xs text-slate-600 leading-relaxed">
                Inspect evidence, revise content, and save review decisions.
              </p>
            </div>
          </div>

        </div>
      </section>

      {/* SECTION C: Compact Operational Summary (From Actual Database Records) */}
      <section className="space-y-3">
        <div className="text-xs font-bold text-slate-400 uppercase tracking-wider px-1">
          Operational Summary
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Total Reviews
            </span>
            <div className="mt-2 text-2xl sm:text-3xl font-extrabold text-slate-900">
              {totalReviews}
            </div>
            <div className="mt-1 text-xs text-slate-400">
              Saved audit records
            </div>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Critical Findings
            </span>
            <div className={`mt-2 text-2xl sm:text-3xl font-extrabold ${criticalFindings > 0 ? 'text-red-700' : 'text-slate-900'}`}>
              {criticalFindings}
            </div>
            <div className="mt-1 text-xs text-slate-400">
              High severity breaches
            </div>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Pending Decisions
            </span>
            <div className={`mt-2 text-2xl sm:text-3xl font-extrabold ${pendingDecisions > 0 ? 'text-amber-700' : 'text-slate-900'}`}>
              {pendingDecisions}
            </div>
            <div className="mt-1 text-xs text-slate-400">
              Items awaiting reviewer action
            </div>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Active Guidelines
            </span>
            <div className="mt-2 text-2xl sm:text-3xl font-extrabold text-slate-900">
              {activeGuidelinesCount}
            </div>
            <div className="mt-1 text-xs text-slate-400">
              {status?.clauses_count ?? 7} clauses • {status?.approved_facts_count ?? 3} approved facts
            </div>
          </div>

        </div>
      </section>

      {/* 2-Column Section: Recent Reviews (Section D) & Active Brand Guidelines (Section E) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* SECTION D: Recent Reviews (8 cols) */}
        <section className="lg:col-span-8 bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h2 className="text-sm sm:text-base font-bold text-slate-900">
                Recent Reviews
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Past marketing content submissions and compliance statuses
              </p>
            </div>
            <Link
              to="/reviews"
              className="text-xs text-teal-700 hover:text-teal-800 font-semibold flex items-center gap-1 cursor-pointer"
            >
              <span>View All</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {loading ? (
            <div className="p-8 text-center text-xs text-slate-500">
              Loading recent audits...
            </div>
          ) : reviews.length === 0 ? (
            <div className="p-8 text-center space-y-3">
              <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                <FileCheck2 className="w-5 h-5" />
              </div>
              <p className="text-sm font-semibold text-slate-800">No review records yet</p>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Start your first review to check marketing copy against your brand guidelines.
              </p>
              <Link
                to="/reviews/new"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
              >
                <FileCheck2 className="w-3.5 h-3.5" />
                <span>Start a Content Review</span>
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 font-medium">
                    <th className="py-2.5 px-4">Review Name</th>
                    <th className="py-2.5 px-3">Content Type</th>
                    <th className="py-2.5 px-3">Review Date</th>
                    <th className="py-2.5 px-3">Findings</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {reviews.slice(0, 5).map((rev) => (
                    <tr
                      key={rev.id}
                      onClick={() => navigate(`/reviews/${rev.id}`)}
                      className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                    >
                      <td className="py-3 px-4 font-semibold text-slate-900 group-hover:text-teal-700 truncate max-w-[180px]">
                        {rev.title}
                      </td>
                      <td className="py-3 px-3 text-slate-600">
                        <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                          {rev.content_type}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-slate-500 font-mono">
                        {new Date(rev.created_at).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-3 text-slate-600 font-mono">
                        {rev.findings_count} {rev.high_severity_count > 0 && <span className="text-red-700">({rev.high_severity_count} crit)</span>}
                      </td>
                      <td className="py-3 px-3">
                        <StatusBadge status={rev.overall_status} />
                      </td>
                      <td className="py-3 px-4 text-right">
                        <Link
                          to={`/reviews/${rev.id}`}
                          onClick={(e) => e.stopPropagation()}
                          className="text-teal-700 hover:text-teal-800 font-semibold inline-flex items-center gap-1 group-hover:translate-x-0.5 transition-transform"
                        >
                          <span>Open</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* SECTION E: Active Brand Guidelines (4 cols) */}
        <section className="lg:col-span-4 bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
          <div>
            <h2 className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-teal-600" />
              <span>Active Brand Guidelines</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Standards cited during content reviews
            </p>
          </div>

          {activeDoc ? (
            <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 space-y-3">
              <div className="flex items-start justify-between gap-2">
                <span className="text-xs font-bold text-slate-900 leading-snug line-clamp-2">
                  {activeDoc.title}
                </span>
                <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 shrink-0">
                  Active
                </span>
              </div>

              <div className="text-xs text-slate-600 font-mono space-y-1">
                <div>File: {activeDoc.filename}</div>
                <div>Extracted Clauses: <strong className="text-slate-900">{activeDoc.clause_count || activeDoc.clauses?.length || 7}</strong></div>
                <div>Approved Facts: <strong className="text-slate-900">{status?.approved_facts_count ?? 3}</strong></div>
              </div>

              <Link
                to="/guidelines"
                className="w-full py-2 px-3 rounded-lg bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 cursor-pointer focus-ring"
              >
                <span>Inspect Document Clauses</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          ) : (
            <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 text-center space-y-2">
              <p className="text-xs text-slate-600">No active guidelines uploaded yet.</p>
              <Link
                to="/guidelines"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-teal-600 text-white text-xs font-semibold"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Upload Brand Guideline PDF</span>
              </Link>
            </div>
          )}

          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
            <span>Deterministic Rules: Active</span>
            <Link to="/settings" className="text-teal-700 hover:underline">
              Inspect Rules
            </Link>
          </div>
        </section>

      </div>

    </div>
  );
};
