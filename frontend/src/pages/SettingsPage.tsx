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
  Info
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
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="pb-4 border-b border-navy-800">
        <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
          <Settings className="w-6 h-6 text-teal-400" />
          Settings & Engine Status
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Verify AI providers, database connection, active governance rules, and system configuration.
        </p>
      </div>

      {message && (
        <div className="p-4 rounded-xl bg-teal-500/15 border border-teal-500/40 text-teal-300 text-sm flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0" />
          <span>{message}</span>
        </div>
      )}

      {/* System Status Diagnostics Card */}
      <div className="p-6 rounded-2xl bg-navy-900 border border-navy-800 space-y-4">
        <h2 className="text-base font-bold text-white flex items-center gap-2">
          <Server className="w-4 h-4 text-teal-400" />
          System Diagnostics & Connectivity
        </h2>

        {loading ? (
          <div className="text-sm text-slate-400">Pinging server...</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Database Card */}
            <div className="p-4 rounded-xl bg-navy-950 border border-navy-800 flex items-start justify-between">
              <div>
                <div className="text-xs font-semibold text-slate-400">Database Engine</div>
                <div className="text-sm font-bold text-white mt-1 capitalize">
                  {status?.database_dialect || 'PostgreSQL'}
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5">
                  Tables: Guidelines, Clauses, Facts, Reviews, Findings, Actions
                </div>
              </div>
              <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border flex items-center gap-1 ${
                status?.database_connected
                  ? 'bg-teal-500/15 text-teal-300 border-teal-500/30'
                  : 'bg-rose-500/15 text-rose-300 border-rose-500/30'
              }`}>
                <CheckCircle2 className="w-3 h-3" />
                {status?.database_connected ? 'Connected' : 'Disconnected'}
              </span>
            </div>

            {/* AI Provider Card */}
            <div className="p-4 rounded-xl bg-navy-950 border border-navy-800 flex items-start justify-between">
              <div>
                <div className="text-xs font-semibold text-slate-400">Primary AI Provider</div>
                <div className="text-sm font-bold text-white mt-1 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-teal-400" />
                  Google Gemini Flash
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5 font-mono">
                  Model: gemini-2.5-flash
                </div>
              </div>
              <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border flex items-center gap-1 ${
                status?.gemini_configured
                  ? 'bg-teal-500/15 text-teal-300 border-teal-500/30'
                  : 'bg-amber-500/15 text-amber-300 border-amber-500/30'
              }`}>
                {status?.gemini_configured ? (
                  <>
                    <CheckCircle2 className="w-3 h-3" />
                    Key Active
                  </>
                ) : (
                  <>
                    <AlertTriangle className="w-3 h-3" />
                    Deterministic Fallback
                  </>
                )}
              </span>
            </div>
          </div>
        )}

        <div className="p-3.5 rounded-xl bg-navy-850/60 border border-navy-700/60 text-xs text-slate-400 flex items-start gap-2.5">
          <Info className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />
          <div className="leading-relaxed">
            <span className="font-semibold text-slate-300">Resilient Fallback Guarantee:</span> If no Gemini API key is configured or the external network encounters an interruption, OmniGuide seamlessly uses its built-in deterministic validation engine. The app never fabricates AI outputs or blocks the user.
          </div>
        </div>
      </div>

      {/* Deterministic Governance Rules Overview */}
      <div className="p-6 rounded-2xl bg-navy-900 border border-navy-800 space-y-4">
        <h2 className="text-base font-bold text-white flex items-center gap-2">
          <Shield className="w-4 h-4 text-teal-400" />
          Active Deterministic Governance Rules
        </h2>
        <p className="text-xs text-slate-400">
          The baseline rules enforced deterministically alongside LLM guideline analysis:
        </p>

        <div className="space-y-3">
          <div className="p-3.5 rounded-xl bg-navy-950 border border-navy-800 text-xs space-y-1">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-200">1. Unsupported Comparative Superlatives</span>
              <span className="text-rose-400 font-mono text-[11px] font-semibold">High Severity</span>
            </div>
            <p className="text-slate-400 text-[11px]">
              Patterns: <code className="text-teal-300 font-mono">#1, No. 1, fastest, quickest, cheapest, world's best, unrivaled</code>. Requires audited comparative proof.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-navy-950 border border-navy-800 text-xs space-y-1">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-200">2. Prohibited Commoditizing Buzzwords</span>
              <span className="text-rose-400 font-mono text-[11px] font-semibold">High Severity</span>
            </div>
            <p className="text-slate-400 text-[11px]">
              Patterns: <code className="text-teal-300 font-mono">cheap, dirt cheap, hacky, secret sauce, silver bullet</code>. Diminishes enterprise positioning.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-navy-950 border border-navy-800 text-xs space-y-1">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-200">3. Absolute Warranties & SLA Guarantees</span>
              <span className="text-rose-400 font-mono text-[11px] font-semibold">High Severity</span>
            </div>
            <p className="text-slate-400 text-[11px]">
              Patterns: <code className="text-teal-300 font-mono">100% guaranteed, risk-free, zero failure</code>. Creates legal liability.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-navy-950 border border-navy-800 text-xs space-y-1">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-200">4. Quantitative Metric Approved-Fact Grounding</span>
              <span className="text-amber-400 font-mono text-[11px] font-semibold">Medium Severity</span>
            </div>
            <p className="text-slate-400 text-[11px]">
              Specific numerical metrics (e.g. <code className="text-teal-300 font-mono">42ms, 99.9%</code>) are cross-checked against registered corporate facts. Unmatched metrics are flagged for verification.
            </p>
          </div>
        </div>
      </div>

      {/* Demo Seed Reset Action */}
      <div className="p-6 rounded-2xl bg-navy-900 border border-navy-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h3 className="text-sm font-bold text-white">Reset Official Demo Dataset</h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Restores the canonical NovaForge Brand Standard guideline document, 7 clauses, and 3 approved facts.
          </p>
        </div>

        <button
          onClick={handleResetDemoData}
          disabled={resetting}
          className="px-4 py-2.5 rounded-xl bg-navy-800 hover:bg-navy-750 border border-teal-500/40 text-teal-300 font-bold text-xs flex items-center gap-2 cursor-pointer self-start sm:self-auto"
        >
          <RotateCcw className={`w-4 h-4 ${resetting ? 'animate-spin' : ''}`} />
          <span>{resetting ? 'Resetting...' : 'Reset Demo Data'}</span>
        </button>
      </div>
    </div>
  );
};
