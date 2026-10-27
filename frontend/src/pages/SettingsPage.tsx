import React, { useState, useEffect, useCallback } from 'react';
import {
  Settings,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Shield,
  Server,
  Info,
  RefreshCw,
  XCircle,
  Zap,
  Cpu,
  Clock,
  Lock,
  Activity
} from 'lucide-react';
import { api } from '../services/api';
import { SystemStatus, ProviderHealthStatus, ProviderState } from '../types';

export const SettingsPage: React.FC = () => {
  const [status, setStatus] = useState<SystemStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [resetting, setResetting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [testingProvider, setTestingProvider] = useState<Record<string, boolean>>({});

  const fetchStatus = useCallback(async () => {
    try {
      const data = await api.getStatus();
      setStatus(data);
    } catch (err) {
      console.error('Error fetching settings status:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  const handleTestProvider = async (providerName: string) => {
    setTestingProvider((prev) => ({ ...prev, [providerName]: true }));
    setMessage(null);
    try {
      const result = await api.testProviderConnection(providerName);
      setStatus((prev) => {
        if (!prev) return prev;
        const updatedProviders = {
          ...(prev.providers || {}),
          [providerName]: result
        };
        return {
          ...prev,
          providers: updatedProviders,
          gemini_configured: providerName === 'gemini' ? result.is_operational : prev.gemini_configured,
          groq_configured: providerName === 'groq' ? result.is_operational : prev.groq_configured
        };
      });

      if (result.state === 'OPERATIONAL') {
        setMessage(`Successfully connected to ${result.display_name} (${result.latency_ms}ms).`);
      } else {
        setMessage(`${result.display_name}: ${result.safe_message}`);
      }
    } catch (err: any) {
      setMessage(`Connectivity test failed: ${err.message}`);
    } finally {
      setTestingProvider((prev) => ({ ...prev, [providerName]: false }));
    }
  };

  const handleResetDemoData = async () => {
    if (!window.confirm('Reset database to official baseline state? This will re-seed the standard Brand Governance Policy and Approved Facts.')) {
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

  const renderStateBadge = (state: ProviderState) => {
    switch (state) {
      case 'OPERATIONAL':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-semibold border flex items-center gap-1 bg-emerald-50 text-emerald-700 border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            Operational
          </span>
        );
      case 'CONFIGURED_NOT_TESTED':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-semibold border flex items-center gap-1 bg-blue-50 text-blue-700 border-blue-200">
            <Clock className="w-3.5 h-3.5 text-blue-600" />
            Configured (Untested)
          </span>
        );
      case 'RATE_LIMITED':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-semibold border flex items-center gap-1 bg-amber-50 text-amber-700 border-amber-200">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
            Rate Limited
          </span>
        );
      case 'CONNECTION_FAILED':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-semibold border flex items-center gap-1 bg-rose-50 text-rose-700 border-rose-200">
            <XCircle className="w-3.5 h-3.5 text-rose-600" />
            Connection Failed
          </span>
        );
      case 'PROVIDER_ERROR':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-semibold border flex items-center gap-1 bg-rose-50 text-rose-700 border-rose-200">
            <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
            Provider Error
          </span>
        );
      case 'NOT_CONFIGURED':
      default:
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-semibold border flex items-center gap-1 bg-slate-100 text-slate-700 border-slate-200">
            <Info className="w-3.5 h-3.5 text-slate-500" />
            Not Configured (Fallback Active)
          </span>
        );
    }
  };

  const providers = status?.providers || {
    gemini: {
      provider_name: 'gemini',
      display_name: 'Google Gemini Flash',
      state: status?.gemini_configured ? 'OPERATIONAL' : 'NOT_CONFIGURED',
      model_name: 'gemini-2.5-flash',
      is_configured: Boolean(status?.gemini_configured),
      is_operational: Boolean(status?.gemini_configured),
      safe_message: 'Operating with deterministic governance engine fallback.',
      is_active: status?.ai_provider === 'gemini'
    },
    groq: {
      provider_name: 'groq',
      display_name: 'Groq Cloud Llama',
      state: status?.groq_configured ? 'OPERATIONAL' : 'NOT_CONFIGURED',
      model_name: 'llama-3.3-70b-versatile',
      is_configured: Boolean(status?.groq_configured),
      is_operational: Boolean(status?.groq_configured),
      safe_message: 'GROQ_API_KEY is not configured in backend environment.',
      is_active: status?.ai_provider === 'groq'
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12 animate-fade-in">
      {/* Page Header */}
      <div className="pb-4 border-b border-slate-200">
        <div className="flex items-center gap-2">
          <span className="p-1.5 rounded-lg bg-teal-50 text-teal-700 border border-teal-200">
            <Settings className="w-5 h-5" />
          </span>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Settings & System Status
          </h1>
        </div>
        <p className="text-xs sm:text-sm text-slate-600 mt-1">
          Inspect verified service connectivity, active deterministic governance rules, and environment states.
        </p>
      </div>

      {message && (
        <div className="p-4 rounded-xl bg-teal-50 border border-teal-200 text-teal-800 text-sm flex items-center gap-2.5 shadow-sm">
          <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0" />
          <span className="font-medium">{message}</span>
        </div>
      )}

      {/* Section A: Core Runtime Infrastructure */}
      <div className="p-6 rounded-xl bg-white border border-slate-200 shadow-sm space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Server className="w-4 h-4 text-teal-600" />
              <span>A. Core Runtime Infrastructure</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Live checks against backend database, ASGI host, and client bundle
            </p>
          </div>
          <button
            onClick={fetchStatus}
            className="px-3 py-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
            <span>Refresh All</span>
          </button>
        </div>

        {loading ? (
          <div className="text-sm text-slate-500 py-8 text-center">Checking service health...</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* 1. Frontend Client */}
            <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 flex flex-col justify-between">
              <div>
                <div className="text-xs font-semibold text-slate-500">Frontend Client</div>
                <div className="text-sm font-bold text-slate-900 mt-1">React 19 + Vite</div>
                <div className="text-[11px] text-slate-500 font-mono mt-0.5">SPA client active</div>
              </div>
              <div className="mt-3">
                <span className="px-2.5 py-1 rounded-full text-xs font-semibold border inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 border-emerald-200">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  Operational
                </span>
              </div>
            </div>

            {/* 2. Backend REST API */}
            <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 flex flex-col justify-between">
              <div>
                <div className="text-xs font-semibold text-slate-500">Backend REST API</div>
                <div className="text-sm font-bold text-slate-900 mt-1">FastAPI v{status?.version || '1.0.0'}</div>
                <div className="text-[11px] text-slate-500 font-mono mt-0.5">Uvicorn ASGI runner</div>
              </div>
              <div className="mt-3">
                <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border inline-flex items-center gap-1 ${
                  status?.status === 'operational'
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : 'bg-red-50 text-red-700 border-red-200'
                }`}>
                  {status?.status === 'operational' ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      Operational
                    </>
                  ) : (
                    <>
                      <XCircle className="w-3.5 h-3.5 text-red-600" />
                      Unavailable
                    </>
                  )}
                </span>
              </div>
            </div>

            {/* 3. Database Engine */}
            <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 flex flex-col justify-between">
              <div>
                <div className="text-xs font-semibold text-slate-500">Database Engine</div>
                <div className="text-sm font-bold text-slate-900 mt-1 capitalize">
                  {status?.database_dialect || 'SQLite'}
                </div>
                <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                  SQLAlchemy 2.x Pool
                </div>
              </div>
              <div className="mt-3">
                <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border inline-flex items-center gap-1 ${
                  status?.database_connected
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : 'bg-red-50 text-red-700 border-red-200'
                }`}>
                  {status?.database_connected ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      Connected ({status?.reviews_count || 0} reviews)
                    </>
                  ) : (
                    <>
                      <XCircle className="w-3.5 h-3.5 text-red-600" />
                      Disconnected
                    </>
                  )}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Section B: AI Provider Diagnostics & Connectivity */}
      <div className="p-6 rounded-xl bg-white border border-slate-200 shadow-sm space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-teal-600" />
              <span>B. AI Intelligence Provider Diagnostics</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Live provider handshakes with latency measurement and safe error summaries
            </p>
          </div>
        </div>

        {/* Reassurance Callout */}
        <div className="p-4 rounded-xl bg-teal-50/70 border border-teal-200/80 text-xs text-teal-950 flex items-start gap-3">
          <Shield className="w-4 h-4 text-teal-700 shrink-0 mt-0.5" />
          <div className="leading-relaxed">
            <span className="font-semibold text-teal-900">Deterministic Governance Fallback:</span> OmniGuide operates primarily on an audit-grade deterministic rule engine. When AI providers are not configured or reach quota limits, all single-copy reviews, campaign pre-flight simulations, and red-team tests execute without interruption.
          </div>
        </div>

        {/* Provider Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Card: Google Gemini */}
          {providers.gemini && (
            <div className="p-5 rounded-xl bg-slate-50 border border-slate-200 flex flex-col justify-between space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-teal-600" />
                    <h3 className="font-bold text-sm text-slate-900">Google Gemini Flash</h3>
                  </div>
                  {renderStateBadge(providers.gemini.state)}
                </div>

                <div className="space-y-1 text-xs text-slate-600">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Target Model:</span>
                    <span className="font-mono font-semibold text-slate-800">{providers.gemini.model_name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Provider Role:</span>
                    <span className="font-medium text-slate-800">
                      {providers.gemini.is_active ? 'Primary Active Provider' : 'Secondary Provider'}
                    </span>
                  </div>
                  {providers.gemini.latency_ms && (
                    <div className="flex justify-between">
                      <span className="text-slate-500">Handshake Latency:</span>
                      <span className="font-mono text-emerald-700 font-bold">{providers.gemini.latency_ms} ms</span>
                    </div>
                  )}
                  {providers.gemini.last_tested_at && (
                    <div className="flex justify-between text-[11px] text-slate-400">
                      <span>Last Verified:</span>
                      <span>{new Date(providers.gemini.last_tested_at).toLocaleTimeString()}</span>
                    </div>
                  )}
                </div>

                <div className="mt-3 p-2.5 rounded-lg bg-white border border-slate-200 text-xs text-slate-600">
                  <span className="font-semibold text-slate-700">Diagnostic:</span> {providers.gemini.safe_message}
                </div>
              </div>

              <div className="pt-2 border-t border-slate-200/80 flex items-center justify-between">
                <span className="text-[11px] text-slate-400 font-mono">Env: GEMINI_API_KEY</span>
                <button
                  onClick={() => handleTestProvider('gemini')}
                  disabled={testingProvider.gemini}
                  className="px-3 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
                >
                  {testingProvider.gemini ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      Testing...
                    </>
                  ) : (
                    <>
                      <Zap className="w-3.5 h-3.5" />
                      Test Connection
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Card: Groq Cloud Llama */}
          {providers.groq && (
            <div className="p-5 rounded-xl bg-slate-50 border border-slate-200 flex flex-col justify-between space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Cpu className="w-4 h-4 text-indigo-600" />
                    <h3 className="font-bold text-sm text-slate-900">Groq Cloud Llama</h3>
                  </div>
                  {renderStateBadge(providers.groq.state)}
                </div>

                <div className="space-y-1 text-xs text-slate-600">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Target Model:</span>
                    <span className="font-mono font-semibold text-slate-800">{providers.groq.model_name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Provider Role:</span>
                    <span className="font-medium text-slate-800">
                      {providers.groq.is_active ? 'Primary Active Provider' : 'Secondary Provider'}
                    </span>
                  </div>
                  {providers.groq.latency_ms && (
                    <div className="flex justify-between">
                      <span className="text-slate-500">Handshake Latency:</span>
                      <span className="font-mono text-emerald-700 font-bold">{providers.groq.latency_ms} ms</span>
                    </div>
                  )}
                  {providers.groq.last_tested_at && (
                    <div className="flex justify-between text-[11px] text-slate-400">
                      <span>Last Verified:</span>
                      <span>{new Date(providers.groq.last_tested_at).toLocaleTimeString()}</span>
                    </div>
                  )}
                </div>

                <div className="mt-3 p-2.5 rounded-lg bg-white border border-slate-200 text-xs text-slate-600">
                  <span className="font-semibold text-slate-700">Diagnostic:</span> {providers.groq.safe_message}
                </div>
              </div>

              <div className="pt-2 border-t border-slate-200/80 flex items-center justify-between">
                <span className="text-[11px] text-slate-400 font-mono">Env: GROQ_API_KEY</span>
                <button
                  onClick={() => handleTestProvider('groq')}
                  disabled={testingProvider.groq}
                  className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
                >
                  {testingProvider.groq ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      Testing...
                    </>
                  ) : (
                    <>
                      <Zap className="w-3.5 h-3.5" />
                      Test Connection
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Security & Secrets Notice */}
        <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-600 flex items-start gap-3 leading-relaxed">
          <Lock className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold text-slate-900">Zero-Secret-Leakage Guarantee:</span> Sensitive API keys, database credentials, and internal endpoints are managed strictly through server-side environment variables and are never transmitted to client browsers or logged.
          </div>
        </div>
      </div>

      {/* Section C: Deterministic Governance Rules */}
      <div className="p-6 rounded-xl bg-white border border-slate-200 shadow-sm space-y-4">
        <div>
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Shield className="w-4 h-4 text-teal-600" />
            <span>C. Active Deterministic Governance Rules</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Deterministic baseline patterns enforced across all submissions to guarantee compliance even without external network access:
          </p>
        </div>

        <div className="space-y-3 pt-1">
          <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 text-xs space-y-1">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-900">1. Unsupported Comparative Superlatives</span>
              <span className="text-red-700 font-mono text-[11px] font-semibold bg-red-50 px-2 py-0.5 rounded border border-red-200">
                Rule SEC-1.1 & SEC-1.2 [High Severity]
              </span>
            </div>
            <p className="text-slate-600 leading-relaxed">
              Detects unsubstantiated comparative absolutes (#1, fastest, cheapest, quickest). Flags claim as requiring independent third-party certification.
            </p>
          </div>

          <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 text-xs space-y-1">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-900">2. Prohibited Commoditizing Terminology</span>
              <span className="text-red-700 font-mono text-[11px] font-semibold bg-red-50 px-2 py-0.5 rounded border border-red-200">
                Rule SEC-3.1 [High Severity]
              </span>
            </div>
            <p className="text-slate-600 leading-relaxed">
              Blocks informal slang ('cheap', 'dirt cheap', 'hacky', 'secret sauce', 'magic bullet') that degrades enterprise positioning.
            </p>
          </div>

          <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 text-xs space-y-1">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-900">3. Absolute Outcome & Legal Guarantees</span>
              <span className="text-red-700 font-mono text-[11px] font-semibold bg-red-50 px-2 py-0.5 rounded border border-red-200">
                Rule SEC-2.1 [High Severity]
              </span>
            </div>
            <p className="text-slate-600 leading-relaxed">
              Catches legally hazardous warranty statements ('100% guaranteed', 'fail-safe', 'zero risk') unless qualified by contract.
            </p>
          </div>

          <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 text-xs space-y-1">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-900">4. Promotional Disclaimers & Free Trials</span>
              <span className="text-amber-700 font-mono text-[11px] font-semibold bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                Rule SEC-2.3 [Medium Severity]
              </span>
            </div>
            <p className="text-slate-600 leading-relaxed">
              Enforces statutory disclaimer qualifications ('terms apply') on all free trial and commercial discount assertions.
            </p>
          </div>

          <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 text-xs space-y-1">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-900">5. Contradictory Campaign Pricing Terms</span>
              <span className="text-red-700 font-mono text-[11px] font-semibold bg-red-50 px-2 py-0.5 rounded border border-red-200">
                Rule SEC-2.4 [High Severity]
              </span>
            </div>
            <p className="text-slate-600 leading-relaxed">
              Prevents conflicting contractual assertions within the same campaign (e.g., claiming free software while imposing mandatory annual contracts).
            </p>
          </div>
        </div>
      </div>

      {/* Section D: Administrative & Demo Controls */}
      <div className="p-6 rounded-xl bg-white border border-slate-200 shadow-sm space-y-4">
        <div>
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <RotateCcw className="w-4 h-4 text-teal-600" />
            <span>D. Administrative & Demo Reset Controls</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Reset guidelines and approved facts to pristine hackathon evaluation baseline:
          </p>
        </div>

        <div className="p-4 rounded-lg bg-amber-50/60 border border-amber-200/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="text-xs font-bold text-amber-900">Reset Demo Guidelines & Approved Facts</div>
            <p className="text-xs text-amber-800/80 leading-relaxed max-w-xl">
              Restores the default Enterprise Brand Governance Policy (7 clauses) and verified Approved Facts (3 corporate facts). Use this if custom guidelines were modified.
            </p>
          </div>

          <button
            onClick={handleResetDemoData}
            disabled={resetting}
            className="px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white text-xs font-semibold flex items-center gap-2 transition cursor-pointer shrink-0 shadow-sm"
          >
            <RotateCcw className={`w-3.5 h-3.5 ${resetting ? 'animate-spin' : ''}`} />
            <span>{resetting ? 'Resetting...' : 'Reset Demo Data'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
