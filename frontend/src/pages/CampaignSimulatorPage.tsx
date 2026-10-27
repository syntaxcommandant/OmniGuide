import React, { useState, useEffect, useCallback } from 'react';
import {
  Rocket,
  Shield,
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  Sparkles,
  RefreshCw,
  Download,
  Info,
  Layers,
  ArrowRight,
  Check,
  Edit3,
  X,
  FileText,
  Copy,
  ChevronDown,
  ChevronRight,
  Sliders
} from 'lucide-react';
import { api } from '../services/api';
import {
  CampaignAudit,
  CampaignTemplate,
  LaunchGatePolicy,
  LaunchGateStatus,
  CampaignFinding
} from '../types';
import { SeverityBadge } from '../components/common/Badge';
import { EvidencePanel } from '../components/common/EvidencePanel';

const CHANNELS_CONFIG = [
  { id: 'instagram', label: 'Instagram Copy', icon: '📸', desc: 'Social promotional post, high viral reach' },
  { id: 'email', label: 'Email Campaign', icon: '✉️', desc: 'Direct enterprise nurture & outreach copy' },
  { id: 'website', label: 'Website / Landing Page', icon: '🌐', desc: 'Authoritative product positioning and SLA terms' },
  { id: 'paid_ads', label: 'Paid Advertising', icon: '🎯', desc: 'Search and social ad creative subject to strict ad regulations' },
];

export const CampaignSimulatorPage: React.FC = () => {
  // Campaign Setup State
  const [name, setName] = useState('OmniCloud Enterprise Q1 Launch');
  const [brandName, setBrandName] = useState('NovaForge');
  const [targetAudience, setTargetAudience] = useState('Enterprise IT decision-makers and CTOs in India');
  const [policy, setPolicy] = useState<LaunchGatePolicy>('standard');
  const [selectedChannels, setSelectedChannels] = useState<string[]>(['instagram', 'email', 'website', 'paid_ads']);
  const [channelContents, setChannelContents] = useState<Record<string, string>>({
    instagram: "NovaForge OmniCloud is India's #1 fastest cloud platform! Get 100% guaranteed zero-downtime infrastructure for your mission-critical applications.",
    email: "Dear Technology Leader, our revolutionary cloud architecture delivers 42ms benchmark latency certified by TechAudit Labs, backed by standard enterprise SLA terms. Act now for your exclusive team deployment.",
    website: "NovaForge OmniCloud maintains a 99.95% verified uptime under enterprise SLA terms. Engineered for high performance with 42ms benchmark latency across enterprise workloads.",
    paid_ads: "Switch to India's fastest cloud platform. Get free trial with zero risk for modern engineering teams!"
  });

  const [activeChannelTab, setActiveChannelTab] = useState<string>('instagram');
  const [templates, setTemplates] = useState<CampaignTemplate[]>([]);
  const [showTemplateDropdown, setShowTemplateDropdown] = useState(false);

  // Simulation Results State
  const [currentAudit, setCurrentAudit] = useState<CampaignAudit | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);
  const [isRemediating, setIsRemediating] = useState(false);
  const [reportModalContent, setReportModalContent] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Load Templates
  useEffect(() => {
    api.getCampaignTemplates()
      .then((data) => setTemplates(data))
      .catch((err) => console.warn('Could not load campaign templates:', err));
  }, []);

  const handleApplyTemplate = (tpl: CampaignTemplate) => {
    setName(tpl.name);
    setBrandName(tpl.brand_name);
    setTargetAudience(tpl.target_audience);
    setPolicy(tpl.launch_gate_policy);
    setSelectedChannels(tpl.channels);
    setChannelContents(tpl.channel_contents);
    if (tpl.channels.length > 0) {
      setActiveChannelTab(tpl.channels[0]);
    }
    setShowTemplateDropdown(false);
    setCurrentAudit(null);
  };

  const handleToggleChannel = (chId: string) => {
    if (selectedChannels.includes(chId)) {
      if (selectedChannels.length === 1) return; // Must keep at least one
      const updated = selectedChannels.filter((c) => c !== chId);
      setSelectedChannels(updated);
      if (activeChannelTab === chId) {
        setActiveChannelTab(updated[0]);
      }
    } else {
      setSelectedChannels([...selectedChannels, chId]);
      setActiveChannelTab(chId);
    }
  };

  const handleContentChange = (chId: string, text: string) => {
    setChannelContents((prev) => ({ ...prev, [chId]: text }));
  };

  // Run Simulation
  const handleRunSimulation = async () => {
    setIsSimulating(true);
    setErrorMsg(null);
    try {
      const audit = await api.simulateCampaign({
        name: name.trim() || 'Untitled Campaign Audit',
        brand_name: brandName.trim() || 'NovaForge',
        target_audience: targetAudience.trim() || undefined,
        channels: selectedChannels,
        channel_contents: channelContents,
        launch_gate_policy: policy,
        analysis_mode: 'deterministic'
      });
      setCurrentAudit(audit);
    } catch (err: any) {
      setErrorMsg(err.message || 'Campaign simulation failed. Please try again.');
    } finally {
      setIsSimulating(false);
    }
  };

  // Remediate Finding
  const handleRemediate = async (findingId: string, status: 'remediated' | 'waived') => {
    if (!currentAudit) return;
    setIsRemediating(true);
    try {
      const updated = await api.remediateCampaignFinding(currentAudit.id, findingId, {
        status,
        remediation_notes: status === 'remediated' ? 'Approved compliant revision' : 'Waived with governance exception'
      });
      setCurrentAudit(updated);
    } catch (err: any) {
      alert(`Remediation failed: ${err.message}`);
    } finally {
      setIsRemediating(false);
    }
  };

  // Export Audit Report
  const handleExportReport = async () => {
    if (!currentAudit) return;
    try {
      const reportMd = await api.getCampaignReport(currentAudit.id);
      setReportModalContent(reportMd);
    } catch (err: any) {
      alert(`Could not generate report: ${err.message}`);
    }
  };

  // Gate presentation helpers
  const getGateBadge = (status: LaunchGateStatus) => {
    switch (status) {
      case 'launch_ready':
        return {
          label: 'LAUNCH APPROVED',
          color: 'bg-emerald-50 text-emerald-800 border-emerald-300',
          icon: ShieldCheck,
          headline: 'All Launch Gates Passed — Ready for Distribution',
          desc: 'Zero critical governance violations remain unresolved. All promotional claims adhere to active brand standards and registered corporate facts.'
        };
      case 'blocked':
        return {
          label: 'LAUNCH BLOCKED',
          color: 'bg-red-50 text-red-900 border-red-300',
          icon: ShieldAlert,
          headline: 'Launch Prohibited by Active Governance Gate',
          desc: `Publication is strictly blocked under the '${policy}' policy because ${currentAudit?.blocking_violations_count} critical/high violations remain unresolved. Bypassing is prohibited.`
        };
      case 'needs_review':
      default:
        return {
          label: 'REQUIRES SIGN-OFF',
          color: 'bg-amber-50 text-amber-900 border-amber-300',
          icon: AlertTriangle,
          headline: 'Launch Requires Compliance Officer Review',
          desc: 'Advisory warnings or sub-threshold readiness score detected. Content requires reviewer sign-off prior to publication.'
        };
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 75) return 'text-emerald-600 stroke-emerald-600';
    if (score >= 60) return 'text-amber-500 stroke-amber-500';
    return 'text-red-600 stroke-red-600';
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto animate-fadeIn pb-16">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-5 border-b border-slate-200">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-teal-50 text-teal-800 border border-teal-200 text-xs font-bold uppercase tracking-wider mb-2">
            <Rocket className="w-3.5 h-3.5 text-teal-600" />
            <span>Flagship Feature • Pre-Publication Governance</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-3">
            <span>Campaign Launch Simulator</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-2xl leading-relaxed">
            Evaluate cross-channel marketing campaigns before launch. Enforce non-bypassable Launch Gates, measure empirical readiness scores, and harmonize contradictory claims across Instagram, Email, Website, and Paid Ads.
          </p>
        </div>

        {/* Benchmark Template Loader */}
        <div className="relative self-start md:self-auto">
          <button
            type="button"
            onClick={() => setShowTemplateDropdown(!showTemplateDropdown)}
            className="px-4 py-2 rounded-xl bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 text-xs sm:text-sm font-semibold flex items-center gap-2 transition-all shadow-xs cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-teal-600" />
            <span>Load Benchmark Campaign</span>
            <ChevronDown className="w-4 h-4 text-slate-400" />
          </button>

          {showTemplateDropdown && (
            <div className="absolute right-0 mt-2 w-80 rounded-xl bg-white border border-slate-200 shadow-xl z-30 p-2 space-y-1 animate-fadeIn">
              <div className="px-3 py-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 mb-1">
                Curated Multi-Channel Scenarios
              </div>
              {templates.map((tpl) => (
                <button
                  key={tpl.id}
                  type="button"
                  onClick={() => handleApplyTemplate(tpl)}
                  className="w-full text-left p-3 rounded-lg hover:bg-teal-50/60 transition-colors cursor-pointer group"
                >
                  <div className="font-semibold text-xs sm:text-sm text-slate-900 group-hover:text-teal-800">
                    {tpl.name}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">
                    {tpl.channels.length} channels ({tpl.channels.join(', ')}) • Gate: {tpl.launch_gate_policy}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Error Alert */}
      {errorMsg && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs sm:text-sm flex items-start gap-3">
          <ShieldAlert className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <span className="font-bold">Simulation Error: </span>
            {errorMsg}
          </div>
        </div>
      )}

      {/* STAGE 1: Campaign Configuration & Multi-Channel Copy Input */}
      <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-6">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <span className="w-6 h-6 rounded-full bg-teal-50 text-teal-700 text-xs font-bold flex items-center justify-center border border-teal-200">
              1
            </span>
            <h2 className="text-sm font-bold text-slate-900">Campaign Specifications & Policy Gate</h2>
          </div>
          <span className="text-xs text-slate-500 font-medium">Step 1 of 2</span>
        </div>

        {/* Metadata Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Campaign Title</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3.5 py-2 rounded-lg bg-white border border-slate-300 text-sm text-slate-900 focus-ring"
              placeholder="e.g. Q1 Global Launch"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Brand Name</label>
            <input
              type="text"
              value={brandName}
              onChange={(e) => setBrandName(e.target.value)}
              className="w-full px-3.5 py-2 rounded-lg bg-white border border-slate-300 text-sm text-slate-900 focus-ring"
              placeholder="e.g. NovaForge"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Launch Gate Policy <span className="text-teal-600 font-normal">(Enforces Blocking)</span>
            </label>
            <select
              value={policy}
              onChange={(e) => setPolicy(e.target.value as LaunchGatePolicy)}
              className="w-full px-3.5 py-2 rounded-lg bg-white border border-slate-300 text-sm text-slate-900 font-medium focus-ring"
            >
              <option value="standard">Standard Policy (Blocks on High Violations, Score &ge; 75)</option>
              <option value="strict">Strict Zero-Tolerance (Blocks on Any High/Med, Score &ge; 85)</option>
              <option value="permissive">Permissive Advisory (Flagged Warning Sign-Off, Score &ge; 60)</option>
            </select>
          </div>
        </div>

        {/* Channel Selection Multi-Toggle */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-2">
            Target Publication Channels
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {CHANNELS_CONFIG.map((ch) => {
              const isSelected = selectedChannels.includes(ch.id);
              return (
                <button
                  key={ch.id}
                  type="button"
                  onClick={() => handleToggleChannel(ch.id)}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-teal-50/60 border-teal-500 shadow-2xs ring-1 ring-teal-500'
                      : 'bg-slate-50 border-slate-200 text-slate-400 opacity-60 hover:opacity-100'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-lg">{ch.icon}</span>
                    <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] ${
                      isSelected ? 'bg-teal-600 text-white' : 'bg-slate-200 text-slate-600'
                    }`}>
                      {isSelected ? '✓' : ''}
                    </span>
                  </div>
                  <div className="text-xs font-bold text-slate-900 mt-2">{ch.label}</div>
                  <div className="text-[10px] text-slate-500 line-clamp-1 mt-0.5">{ch.desc}</div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Multi-Channel Content Tabs & Editor */}
        <div className="pt-2 border-t border-slate-100">
          <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-slate-200 mb-4">
            {selectedChannels.map((chId) => {
              const cfg = CHANNELS_CONFIG.find((c) => c.id === chId);
              const isActive = activeChannelTab === chId;
              const contentLen = (channelContents[chId] || '').length;
              return (
                <button
                  key={chId}
                  type="button"
                  onClick={() => setActiveChannelTab(chId)}
                  className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                    isActive
                      ? 'bg-teal-700 text-white shadow-2xs'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  <span>{cfg?.icon}</span>
                  <span>{cfg?.label}</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                    isActive ? 'bg-teal-800 text-teal-100' : 'bg-slate-200 text-slate-600'
                  }`}>
                    {contentLen}c
                  </span>
                </button>
              );
            })}
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-semibold text-slate-700">
                Marketing Copy for {CHANNELS_CONFIG.find((c) => c.id === activeChannelTab)?.label}
              </span>
              <span className="text-[11px] text-slate-400 font-mono">
                {(channelContents[activeChannelTab] || '').length} characters
              </span>
            </div>
            <textarea
              rows={4}
              value={channelContents[activeChannelTab] || ''}
              onChange={(e) => handleContentChange(activeChannelTab, e.target.value)}
              placeholder="Paste or compose marketing text for this channel..."
              className="w-full p-3.5 rounded-xl bg-white border border-slate-300 text-sm text-slate-900 leading-relaxed font-mono focus-ring"
            />
          </div>
        </div>

        {/* Action Button */}
        <div className="pt-2 flex justify-end">
          <button
            type="button"
            onClick={handleRunSimulation}
            disabled={isSimulating}
            className="px-6 py-3 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-sm font-bold flex items-center gap-2.5 transition-all shadow-sm hover:shadow cursor-pointer disabled:opacity-50"
          >
            {isSimulating ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Simulating Campaign Across Channels...</span>
              </>
            ) : (
              <>
                <Rocket className="w-4 h-4" />
                <span>Evaluate & Run Launch Simulation</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* STAGE 2: Simulation Results Workspace */}
      {currentAudit && (
        <div className="space-y-8 animate-fadeIn">
          {/* 1. Launch Gate Status Banner */}
          {(() => {
            const gate = getGateBadge(currentAudit.status);
            const GateIcon = gate.icon;
            return (
              <div className={`p-6 rounded-2xl border-2 ${gate.color} shadow-xs space-y-3`}>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-white/80 shadow-2xs">
                      <GateIcon className="w-7 h-7" />
                    </div>
                    <div>
                      <div className="text-[11px] font-bold uppercase tracking-wider opacity-80">
                        Launch Gate Decision ({policy.toUpperCase()} Policy)
                      </div>
                      <div className="text-xl font-bold">{gate.headline}</div>
                    </div>
                  </div>

                  <span className="px-3 py-1 rounded-full text-xs font-black tracking-wider uppercase border border-current self-start sm:self-auto">
                    {gate.label}
                  </span>
                </div>

                <p className="text-xs sm:text-sm leading-relaxed opacity-90">
                  {gate.desc}
                </p>
              </div>
            );
          })()}

          {/* 2. Readiness Score & Transparent Scoring Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Score Card */}
            <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col items-center justify-center text-center space-y-4">
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Empirical Launch Readiness Score
              </div>

              {/* Score Gauge */}
              <div className="relative w-36 h-36 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    stroke="#E2E8F0"
                    strokeWidth="10"
                    fill="transparent"
                  />
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    className={getScoreColor(currentAudit.launch_readiness_score)}
                    strokeWidth="10"
                    strokeDasharray={251.2}
                    strokeDashoffset={251.2 - (251.2 * currentAudit.launch_readiness_score) / 100}
                    strokeLinecap="round"
                    fill="transparent"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-3xl font-black text-slate-900 tracking-tight">
                    {currentAudit.launch_readiness_score}
                  </span>
                  <span className="text-[11px] text-slate-400 font-bold uppercase tracking-widest">
                    out of 100
                  </span>
                </div>
              </div>

              {/* Status Pill */}
              <div className="text-xs text-slate-600 font-medium">
                {currentAudit.blocking_violations_count} Blocking Violations • {currentAudit.warnings_count} Warnings
              </div>

              {/* Export Report Action */}
              <button
                type="button"
                onClick={handleExportReport}
                className="w-full py-2 px-3 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-slate-500" />
                <span>Export Stakeholder Audit Report</span>
              </button>
            </div>

            {/* Transparent Scoring Methodology Card (2 Cols) */}
            <div className="lg:col-span-2 p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-teal-600" />
                  <h3 className="text-sm font-bold text-slate-900">Deterministic Scoring Methodology</h3>
                </div>
                <span className="text-[11px] text-slate-400 font-mono">100% Mathematically Transparent</span>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed">
                OmniGuide does not generate arbitrary confidence numbers. The score begins at a clean baseline of 100 and applies transparent deductions for compliance breaches:
              </p>

              {/* Deductions Breakdown Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 rounded-xl bg-red-50 border border-red-100 text-center">
                  <div className="text-[10px] font-bold text-red-700 uppercase">Critical / High</div>
                  <div className="text-base font-black text-red-900 mt-0.5">
                    -{currentAudit.scoring_breakdown.high_severity_deductions}
                  </div>
                  <div className="text-[10px] text-red-600">-25 pts per item</div>
                </div>

                <div className="p-3 rounded-xl bg-amber-50 border border-amber-100 text-center">
                  <div className="text-[10px] font-bold text-amber-700 uppercase">Warnings / Med</div>
                  <div className="text-base font-black text-amber-900 mt-0.5">
                    -{currentAudit.scoring_breakdown.medium_severity_deductions}
                  </div>
                  <div className="text-[10px] text-amber-600">-10 pts per item</div>
                </div>

                <div className="p-3 rounded-xl bg-purple-50 border border-purple-100 text-center">
                  <div className="text-[10px] font-bold text-purple-700 uppercase">Cross-Channel</div>
                  <div className="text-base font-black text-purple-900 mt-0.5">
                    -{currentAudit.scoring_breakdown.cross_channel_deductions}
                  </div>
                  <div className="text-[10px] text-purple-600">-15 pts per clash</div>
                </div>

                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-100 text-center">
                  <div className="text-[10px] font-bold text-emerald-700 uppercase">Remediated</div>
                  <div className="text-base font-black text-emerald-900 mt-0.5">
                    +{currentAudit.scoring_breakdown.remediation_restored}
                  </div>
                  <div className="text-[10px] text-emerald-600">Points Restored</div>
                </div>
              </div>

              {/* Formula String Box */}
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs font-mono text-slate-700 leading-relaxed">
                {currentAudit.scoring_breakdown.scoring_formula_explanation}
              </div>
            </div>
          </div>

          {/* 3. Visual Risk Heatmap across Channels */}
          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-teal-600" />
                <h3 className="text-sm font-bold text-slate-900">Multi-Channel Compliance Risk Heatmap</h3>
              </div>
              <span className="text-xs text-slate-500 font-medium">{currentAudit.channels.length} Channels Analyzed</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 border-y border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="py-2.5 px-3">Channel</th>
                    <th className="py-2.5 px-3 text-center">Superlatives</th>
                    <th className="py-2.5 px-3 text-center">Banned Words</th>
                    <th className="py-2.5 px-3 text-center">Metric Facts</th>
                    <th className="py-2.5 px-3 text-center">Disclaimers</th>
                    <th className="py-2.5 px-3 text-center">Readiness Score</th>
                    <th className="py-2.5 px-3 text-right">Channel Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {currentAudit.channel_contents.map((ch) => {
                    const chFindings = currentAudit.findings.filter((f) => f.channel === ch.channel);
                    const hasSup = chFindings.some((f) => f.category.includes('superlative'));
                    const hasBan = chFindings.some((f) => f.category.includes('banned'));
                    const hasFact = chFindings.some((f) => f.category.includes('source') || f.category.includes('claim'));
                    const hasDisc = chFindings.some((f) => f.category.includes('disclaimer') || f.category.includes('guarantee'));

                    return (
                      <tr key={ch.channel} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3 px-3 font-semibold text-slate-900 capitalize flex items-center gap-2">
                          <span>{CHANNELS_CONFIG.find((c) => c.id === ch.channel)?.icon}</span>
                          <span>{ch.channel}</span>
                        </td>
                        <td className="py-3 px-3 text-center">
                          {hasSup ? (
                            <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-800 font-bold text-[10px]">Flagged</span>
                          ) : (
                            <span className="text-emerald-600 font-bold">✓</span>
                          )}
                        </td>
                        <td className="py-3 px-3 text-center">
                          {hasBan ? (
                            <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-800 font-bold text-[10px]">Flagged</span>
                          ) : (
                            <span className="text-emerald-600 font-bold">✓</span>
                          )}
                        </td>
                        <td className="py-3 px-3 text-center">
                          {hasFact ? (
                            <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-bold text-[10px]">Unverified</span>
                          ) : (
                            <span className="text-emerald-600 font-bold">✓</span>
                          )}
                        </td>
                        <td className="py-3 px-3 text-center">
                          {hasDisc ? (
                            <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-bold text-[10px]">Required</span>
                          ) : (
                            <span className="text-emerald-600 font-bold">✓</span>
                          )}
                        </td>
                        <td className="py-3 px-3 text-center font-bold">
                          <span className={ch.channel_readiness_score >= 80 ? 'text-emerald-600' : (ch.channel_readiness_score >= 60 ? 'text-amber-600' : 'text-red-600')}>
                            {ch.channel_readiness_score}/100
                          </span>
                        </td>
                        <td className="py-3 px-3 text-right">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            ch.channel_status === 'compliant'
                              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                              : (ch.channel_status === 'needs_review' ? 'bg-amber-50 text-amber-800 border border-amber-200' : 'bg-red-50 text-red-800 border border-red-200')
                          }`}>
                            {ch.channel_status}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* 4. Cross-Channel Contradictions Section */}
          {currentAudit.cross_channel_issues.length > 0 && (
            <div className="p-6 rounded-2xl bg-purple-50/70 border border-purple-200 shadow-xs space-y-4">
              <div className="flex items-center gap-2 text-purple-900 font-bold text-sm">
                <AlertTriangle className="w-5 h-5 text-purple-700" />
                <span>Cross-Channel Messaging Contradictions Detected ({currentAudit.cross_channel_issues.length})</span>
              </div>
              <p className="text-xs text-purple-800">
                Inconsistent claims published across touchpoints dilute consumer trust and increase regulatory scrutiny. Harmonize conflicting statements:
              </p>

              <div className="space-y-3">
                {currentAudit.cross_channel_issues.map((issue, idx) => (
                  <div key={idx} className="p-4 rounded-xl bg-white border border-purple-200 text-xs space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900 capitalize">
                        Conflict Across: {issue.channels_involved.join(' & ')}
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 font-semibold text-[10px]">
                        -15 pts deduction
                      </span>
                    </div>
                    <div className="text-slate-700">{issue.description}</div>
                    <div className="p-2.5 rounded-lg bg-teal-50 border border-teal-100 text-teal-900 font-medium">
                      <strong>Harmonization:</strong> {issue.suggested_harmonization}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 5. Prioritized Remediation Checklist */}
          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Prioritized Remediation Checklist</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Accept suggested compliant revisions or record authorized waivers to restore launch score and unlock the Launch Gate.
                </p>
              </div>
              <span className="text-xs font-semibold text-slate-600">
                {currentAudit.remediated_count} of {currentAudit.findings.length} Remediated
              </span>
            </div>

            {currentAudit.findings.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-xs">
                <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
                Zero compliance findings detected. Campaign is launch-ready!
              </div>
            ) : (
              <div className="space-y-4">
                {currentAudit.findings.map((f) => (
                  <div
                    key={f.id}
                    className={`p-4 rounded-xl border transition-all ${
                      f.remediation_status === 'remediated'
                        ? 'bg-emerald-50/30 border-emerald-200'
                        : (f.remediation_status === 'waived' ? 'bg-slate-50 border-slate-200 opacity-70' : 'bg-white border-slate-200 shadow-2xs')
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-3">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
                          {f.channel}
                        </span>
                        <SeverityBadge severity={f.severity} />
                        <span className="text-xs font-semibold text-slate-800">
                          {f.category.replace(/_/g, ' ')}
                        </span>
                      </div>

                      {/* Remediation Action Buttons */}
                      <div className="flex items-center gap-2 self-end sm:self-auto">
                        {f.remediation_status !== 'remediated' && (
                          <button
                            type="button"
                            onClick={() => handleRemediate(f.id, 'remediated')}
                            disabled={isRemediating}
                            className="px-3 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>Accept Revision (+pts)</span>
                          </button>
                        )}

                        {f.remediation_status !== 'waived' && (
                          <button
                            type="button"
                            onClick={() => handleRemediate(f.id, 'waived')}
                            disabled={isRemediating}
                            className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
                          >
                            <X className="w-3.5 h-3.5" />
                            <span>Waive Violation</span>
                          </button>
                        )}

                        {f.remediation_status === 'remediated' && (
                          <span className="px-2.5 py-1 rounded-md bg-emerald-100 text-emerald-800 font-bold text-xs flex items-center gap-1">
                            ✓ Remediated
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Integrated Evidence Intelligence Panel */}
                    <EvidencePanel
                      finding={{
                        id: f.id,
                        category: f.category,
                        severity: f.severity,
                        original_excerpt: f.original_excerpt,
                        explanation: f.explanation,
                        guideline_ref: f.guideline_ref,
                        guideline_clause_text: f.evidence_quote,
                        suggested_fix: f.suggested_fix,
                        evidence_status: f.evidence_status,
                        source: f.source,
                        decision_status: f.remediation_status,
                      }}
                      defaultExpanded={false}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Export Report Modal */}
      {reportModalContent && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[85vh] flex flex-col shadow-2xl border border-slate-200 animate-fadeIn">
            <div className="p-5 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-teal-600" />
                <h3 className="text-base font-bold text-slate-900">Campaign Audit Stakeholder Report</h3>
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
              <span className="text-xs text-slate-500">Official OmniGuide Campaign Launch Audit Report</span>
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
                    const cleanName = (currentAudit?.name || 'Campaign_Audit').replace(/[^a-zA-Z0-9_-]/g, '_');
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
                    if (!currentAudit) return;
                    try {
                      const jsonReport = await api.getCampaignReportJson(currentAudit.id);
                      const blob = new Blob([JSON.stringify(jsonReport, null, 2)], { type: 'application/json' });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      const cleanName = (currentAudit.name || 'Campaign_Audit').replace(/[^a-zA-Z0-9_-]/g, '_');
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
