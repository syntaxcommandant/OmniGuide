import React, { useState, useEffect } from 'react';
import {
  Settings,
  Database,
  Sparkles,
  Cpu,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Shield,
  Layers,
  Server,
  Key,
  Info,
  ExternalLink,
  Code2
} from 'lucide-react';
import { api } from '../services/api';
import { SystemStatus } from '../types';

export const SettingsPage: React.FC = () => {
  const [status, setStatus] = useState<SystemStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [resetting, setResetting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const fetchStatus = async () => {
    try {
      const data = await api.getStatus();
      setStatus(data);
    } catch (err) {
      console.error('Error fetching settings status:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const handleResetDemoData = async () => {
    if (!window.confirm('Reset database to official hackathon demo state? This will re-seed the NovaForge Brand Standard and Approved Facts.')) {
      return;
    }
    setResetting(true);
    try {
      const res = await api.resetDemoData();
      setMessage(res.message);
      await fetchStatus();
    } catch (err: any) {
      alert(`Reset failed: ${err.message}`);
    } finally {
      setResetting(false);
    }
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto animate-fadeIn">
      {/* Header */}
      <div className="pb-4 border-b border-navy-800">
        <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
          <Settings className="w-6 h-6 text-teal-400" />
          Settings & Verified System Status
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Inspect verified service connectivity, active deterministic governance rules, and environment states.
        </p>
      </div>

      {message && (
        <div className="p-4 rounded-xl bg-teal-500/15 border border-teal-500/40 text-teal-300 text-sm flex items-center gap-2 shadow-sm">
          <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0" />
          <span>{message}</span>
        </div>
      )}

      {/* Verified System Diagnostics per Section 10 */}
      <div className="p-6 rounded-2xl bg-navy-900 border border-navy-800 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-navy-800">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Server className="w-4 h-4 text-teal-400" />
              Service Status & Availability Diagnostics
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Live checks performed against backend health endpoints
            </p>
          </div>
          <button
            onClick={fetchStatus}
            className="px-3 py-1.5 rounded-xl bg-navy-850 hover:bg-navy-800 border border-navy-750 text-slate-300 text-xs font-semibold cursor-pointer"
          >
            Refresh Status
          </button>
        </div>

        {loading ? (
          <div className="text-sm text-slate-400 py-6 text-center">Checking service health...</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* 1. Frontend */}
            <div className="p-4 rounded-xl bg-navy-950 border border-navy-800 flex items-start justify-between">
              <div>
                <div className="text-xs font-semibold text-slate-400">Frontend Client</div>
                <div className="text-sm font-bold text-white mt-1">React + Vite + Tailwind</div>
                <div className="text-[11px] text-slate-400 font-mono mt-0.5">SPA reverse proxy active</div>
              </div>
              <span className="px-2.5 py-1 rounded-full text-xs font-bold border flex items-center gap-1 bg-teal-500/15 text-teal-300 border-teal-500/35">
                <CheckCircle2 className="w-3.5 h-3.5 text-teal-400" />
                Connected
              </span>
            </div>

            {/* 2. Backend API */}
            <div className="p-4 rounded-xl bg-navy-950 border border-navy-800 flex items-start justify-between">
              <div>
                <div className="text-xs font-semibold text-slate-400">Backend REST API</div>
                <div className="text-sm font-bold text-white mt-1">FastAPI v{status?.version || '1.0.0'}</div>
                <div className="text-[11px] text-slate-400 font-mono mt-0.5">Uvicorn ASGI runner</div>
              </div>
              <span className={`px-2.5 py-1 rounded-full text-xs font-bold border flex items-center gap-1 ${
                status?.status === 'operational'
                  ? 'bg-teal-500/15 text-teal-300 border-teal-500/35'
                  : 'bg-rose-500/15 text-rose-300 border-rose-500/35'
              }`}>
                <CheckCircle2 className="w-3.5 h-3.5" />
                {status?.status === 'operational' ? 'Connected' : 'Unavailable'}
              </span>
            </div>

            {/* 3. Database */}
            <div className="p-4 rounded-xl bg-navy-950 border border-navy-800 flex items-start justify-between">
              <div>
                <div className="text-xs font-semibold text-slate-400">Database Engine</div>
                <div className="text-sm font-bold text-white mt-1 capitalize">
                  {status?.database_dialect || 'PostgreSQL'}
                </div>
                <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                  SQLAlchemy 2.x Session Pool
                </div>
              </div>
              <span className={`px-2.5 py-1 rounded-full text-xs font-bold border flex items-center gap-1 ${
                status?.database_connected
                  ? 'bg-teal-500/15 text-teal-300 border-teal-500/35'
                  : 'bg-rose-500/15 text-rose-300 border-rose-500/35'
              }`}>
                <CheckCircle2 className="w-3.5 h-3.5" />
                {status?.database_connected ? 'Connected' : 'Unavailable'}
              </span>
            </div>

            {/* 4. AI Provider */}
            <div className="p-4 rounded-xl bg-navy-950 border border-navy-800 flex items-start justify-between">
              <div>
                <div className="text-xs font-semibold text-slate-400">AI Intelligence Provider</div>
                <div className="text-sm font-bold text-white mt-1 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-teal-400" />
                  Google Gemini Flash
                </div>
                <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                  Model: gemini-2.5-flash
                </div>
              </div>
              <span className={`px-2.5 py-1 rounded-full text-xs font-bold border flex items-center gap-1 ${
                status?.gemini_configured
                  ? 'bg-teal-500/15 text-teal-300 border-teal-500/35'
                  : 'bg-amber-500/15 text-amber-300 border-amber-500/35'
              }`}>
                {status?.gemini_configured ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5 text-teal-400" />
                    Connected
                  </>
                ) : (
                  <>
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                    Not Configured (Fallback)
                  </>
                )}
              </span>
            </div>
          </div>
        )}

        {/* Security & Secrets Notice */}
        <div className="p-4 rounded-xl bg-navy-950 border border-navy-800 text-xs text-slate-400 flex items-start gap-3 leading-relaxed">
          <Info className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold text-slate-300">Enterprise Security Standard:</span> Sensitive API keys, database credentials, and internal connection strings are managed strictly through server-side environment variables and are never transmitted to client browsers or logged.
          </div>
        </div>
      </div>

      {/* Deterministic Rule Engine Inspector */}
      <div className="p-6 rounded-2xl bg-navy-900 border border-navy-800 shadow-sm space-y-4">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Shield className="w-4 h-4 text-teal-400" />
            Active Deterministic Governance Rules
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Deterministic baseline patterns enforced across all submissions to guarantee compliance even without external network access:
          </p>
        </div>

        <div className="space-y-3 pt-1">
          <div className="p-4 rounded-xl bg-navy-950 border border-navy-800 text-xs space-y-1">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-200">1. Unsupported Comparative Superlatives</span>
              <span className="text-rose-400 font-mono text-[11px] font-bold">Critical Violation</span>
            </div>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              Regex patterns for <code className="text-teal-300 font-mono">#1, No. 1, fastest, quickest, cheapest, greatest, world's best</code>. Flags absolute claims requiring 3rd-party audit verification under Section 1.1 & 1.2.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-navy-950 border border-navy-800 text-xs space-y-1">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-200">2. Prohibited Commoditizing Terminology</span>
              <span className="text-rose-400 font-mono text-[11px] font-bold">Critical Violation</span>
            </div>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              Regex patterns for <code className="text-teal-300 font-mono">cheap, dirt cheap, hacky, secret sauce, silver bullet</code>. Prohibited under Section 3.1 to maintain enterprise market positioning.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-navy-950 border border-navy-800 text-xs space-y-1">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-200">3. Absolute Guarantees & Warranties</span>
              <span className="text-rose-400 font-mono text-[11px] font-bold">Critical Violation</span>
            </div>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              Regex patterns for <code className="text-teal-300 font-mono">100% guaranteed, risk-free, zero failure</code>. Prevents uninsurable commercial liability under Section 2.1.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-navy-950 border border-navy-800 text-xs space-y-1">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-200">4. Quantitative Metric Approved-Fact Grounding</span>
              <span className="text-amber-400 font-mono text-[11px] font-bold">Warning / Verification</span>
            </div>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              Quantitative percentages and metrics (<code className="text-teal-300 font-mono">42ms, 99.9%</code>) are cross-checked against registered corporate facts. Unmatched metrics are flagged as <code className="text-amber-300 font-mono">missing_approved_source</code> under Section 2.2.
            </p>
          </div>
        </div>
      </div>

      {/* Demo Seed Reset Action */}
      <div className="p-6 rounded-2xl bg-navy-900 border border-navy-800 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h3 className="text-sm font-bold text-white">Reset Official Hackathon Dataset</h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Re-seeds the canonical NovaForge Brand Standard document (7 clauses) and verified corporate facts.
          </p>
        </div>

        <button
          onClick={handleResetDemoData}
          disabled={resetting}
          className="px-4 py-2.5 rounded-xl bg-navy-850 hover:bg-navy-800 border border-teal-500/40 text-teal-300 font-bold text-xs flex items-center gap-2 cursor-pointer self-start sm:self-auto shadow-sm"
        >
          <RotateCcw className={`w-4 h-4 ${resetting ? 'animate-spin' : ''}`} />
          <span>{resetting ? 'Resetting...' : 'Reset Demo Dataset'}</span>
        </button>
      </div>
    </div>
  );
};
