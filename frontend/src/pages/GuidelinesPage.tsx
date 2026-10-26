import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  Upload,
  FileText,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  FileUp,
  Download,
  Database,
  Search,
  Layers,
  FileCheck
} from 'lucide-react';
import { api } from '../services/api';
import { GuidelineDocument, ApprovedFact } from '../types';

export const GuidelinesPage: React.FC = () => {
  const [documents, setDocuments] = useState<GuidelineDocument[]>([]);
  const [selectedDoc, setSelectedDoc] = useState<GuidelineDocument | null>(null);
  const [approvedFacts, setApprovedFacts] = useState<ApprovedFact[]>([]);
  const [activeTab, setActiveTab] = useState<'upload' | 'manual' | 'facts'>('upload');

  // Form states
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [manualTitle, setManualTitle] = useState('');
  const [manualContent, setManualContent] = useState('');
  const [factText, setFactText] = useState('');
  const [factCategory, setFactCategory] = useState('performance');
  const [factSource, setFactSource] = useState('');

  // UI feedback
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [clauseSearch, setClauseSearch] = useState('');

  const loadData = async () => {
    try {
      const [docs, facts] = await Promise.all([api.getGuidelines(), api.getApprovedFacts()]);
      setDocuments(docs);
      setApprovedFacts(facts);
      if (docs.length > 0 && !selectedDoc) {
        const fullDoc = await api.getGuideline(docs[0].id);
        setSelectedDoc(fullDoc);
      }
    } catch (err: any) {
      console.error('Error fetching guidelines:', err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSelectDoc = async (id: string) => {
    try {
      const doc = await api.getGuideline(id);
      setSelectedDoc(doc);
    } catch (err: any) {
      setErrorMsg(err.message);
    }
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!uploadTitle.trim()) {
      setErrorMsg('Please enter a guideline title.');
      return;
    }
    if (!uploadFile) {
      setErrorMsg('Please select a PDF file to upload.');
      return;
    }

    setLoading(true);
    try {
      const newDoc = await api.uploadGuidelinePDF(uploadTitle, uploadFile);
      setSuccessMsg(`Extracted ${newDoc.clause_count} clauses from '${newDoc.filename}'!`);
      setUploadTitle('');
      setUploadFile(null);
      await loadData();
      setSelectedDoc(newDoc);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to extract text from PDF.');
    } finally {
      setLoading(false);
    }
  };

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!manualTitle.trim()) {
      setErrorMsg('Please enter a guideline title.');
      return;
    }
    if (manualContent.trim().length < 20) {
      setErrorMsg('Please provide comprehensive guideline content with distinct sections or rules.');
      return;
    }

    setLoading(true);
    try {
      const newDoc = await api.createManualGuideline({
        title: manualTitle,
        content: manualContent,
      });
      setSuccessMsg(`Created guideline '${newDoc.title}' with ${newDoc.clause_count} clauses!`);
      setManualTitle('');
      setManualContent('');
      await loadData();
      setSelectedDoc(newDoc);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to save manual guideline.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddFact = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!factText.trim()) return;

    try {
      await api.createApprovedFact({
        fact_text: factText.trim(),
        category: factCategory,
        source_reference: factSource.trim() || undefined,
      });
      setFactText('');
      setFactSource('');
      setSuccessMsg('Approved corporate fact registered successfully.');
      const updatedFacts = await api.getApprovedFacts();
      setApprovedFacts(updatedFacts);
    } catch (err: any) {
      setErrorMsg(err.message);
    }
  };

  const handleDeleteFact = async (id: string) => {
    try {
      await api.deleteApprovedFact(id);
      setApprovedFacts((prev) => prev.filter((f) => f.id !== id));
      setSuccessMsg('Approved fact removed.');
    } catch (err: any) {
      setErrorMsg(err.message);
    }
  };

  const handleDeleteDoc = async (id: string) => {
    if (!window.confirm('Delete this guideline document and its indexed clauses?')) return;
    try {
      await api.deleteGuideline(id);
      setDocuments((prev) => prev.filter((d) => d.id !== id));
      if (selectedDoc?.id === id) {
        setSelectedDoc(null);
      }
      setSuccessMsg('Guideline document deleted.');
    } catch (err: any) {
      setErrorMsg(err.message);
    }
  };

  const filteredClauses = selectedDoc?.clauses?.filter((c) => {
    if (!clauseSearch.trim()) return true;
    const q = clauseSearch.toLowerCase();
    return (
      c.clause_identifier.toLowerCase().includes(q) ||
      c.clause_text.toLowerCase().includes(q) ||
      (c.section_heading && c.section_heading.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-navy-800">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
            <BookOpen className="w-6 h-6 text-teal-400" />
            Brand Standards & Approved Facts
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Manage ground-truth policy documents, indexed clause citations, and registered corporate metrics.
          </p>
        </div>

        <a
          href="/demo_guideline.pdf"
          download="novaforge_governance_v2.4.pdf"
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-navy-850 hover:bg-navy-800 border border-teal-500/40 text-teal-300 text-xs font-semibold self-start sm:self-auto transition-colors"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Download Sample PDF</span>
        </a>
      </div>

      {/* Notifications */}
      {errorMsg && (
        <div className="p-4 rounded-xl bg-rose-500/15 border border-rose-500/40 text-rose-300 text-sm flex items-start gap-3 shadow-md">
          <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
          <div>
            <div className="font-bold">Guideline Error</div>
            <div className="text-xs text-rose-200 mt-0.5 leading-relaxed">{errorMsg}</div>
          </div>
        </div>
      )}

      {successMsg && (
        <div className="p-4 rounded-xl bg-teal-500/15 border border-teal-500/40 text-teal-300 text-sm flex items-center gap-2 shadow-sm">
          <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Workspace Tabs */}
      <div className="flex border-b border-navy-800 space-x-2">
        <button
          onClick={() => { setActiveTab('upload'); setErrorMsg(null); }}
          className={`px-4 py-2.5 text-xs sm:text-sm font-semibold rounded-t-xl transition-colors flex items-center gap-2 cursor-pointer ${
            activeTab === 'upload'
              ? 'bg-navy-900 text-teal-300 border-t border-x border-navy-800'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Upload className="w-4 h-4" />
          <span>Upload PDF Guidelines</span>
        </button>

        <button
          onClick={() => { setActiveTab('manual'); setErrorMsg(null); }}
          className={`px-4 py-2.5 text-xs sm:text-sm font-semibold rounded-t-xl transition-colors flex items-center gap-2 cursor-pointer ${
            activeTab === 'manual'
              ? 'bg-navy-900 text-teal-300 border-t border-x border-navy-800'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Paste Guidelines Manually</span>
        </button>

        <button
          onClick={() => { setActiveTab('facts'); setErrorMsg(null); }}
          className={`px-4 py-2.5 text-xs sm:text-sm font-semibold rounded-t-xl transition-colors flex items-center gap-2 cursor-pointer ${
            activeTab === 'facts'
              ? 'bg-navy-900 text-teal-300 border-t border-x border-navy-800'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Database className="w-4 h-4" />
          <span>Approved Corporate Facts ({approvedFacts.length})</span>
        </button>
      </div>

      {/* Tab 1: Upload PDF */}
      {activeTab === 'upload' && (
        <div className="p-6 rounded-2xl bg-navy-900 border border-navy-800 shadow-sm">
          <h2 className="text-base font-bold text-white mb-1">Upload Digital PDF Guidelines</h2>
          <p className="text-xs text-slate-400 mb-5">
            PyMuPDF parses searchable text page-by-page, extracts identifiable clauses, and indexes them with page references.
          </p>

          <form onSubmit={handleUploadSubmit} className="space-y-4 max-w-xl">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Guideline Document Title <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                value={uploadTitle}
                onChange={(e) => setUploadTitle(e.target.value)}
                placeholder="e.g. Acme Corp Global Brand & Compliance Standard 2026"
                className="w-full px-3.5 py-2.5 rounded-xl bg-navy-950 border border-navy-750 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-teal-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                PDF Document File <span className="text-rose-400">*</span>
              </label>
              <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-navy-750 border-dashed rounded-2xl bg-navy-950/60 hover:border-teal-500/50 transition-colors">
                <div className="space-y-2 text-center">
                  <FileUp className="mx-auto h-8 w-8 text-teal-400" />
                  <div className="flex text-xs text-slate-400">
                    <label className="relative cursor-pointer rounded font-medium text-teal-400 hover:text-teal-300">
                      <span>Choose a PDF file</span>
                      <input
                        type="file"
                        accept=".pdf"
                        onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                        className="sr-only"
                      />
                    </label>
                    <p className="pl-1 text-slate-500">or drag and drop</p>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    {uploadFile ? (
                      <span className="text-teal-300 font-semibold">{uploadFile.name} ({(uploadFile.size / 1024).toFixed(1)} KB)</span>
                    ) : (
                      'Digital PDF up to 15MB. Note: Scanned/image-only PDFs require digital searchable text.'
                    )}
                  </p>
                </div>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-navy-950 border border-navy-800 text-[11px] text-slate-400 leading-relaxed">
              <span className="font-semibold text-slate-300">Scanned PDF Policy:</span> If an uploaded PDF contains no extractable digital text (e.g., scanned photographs of documents), OmniGuide returns an explicit limitation notice rather than pretending extraction succeeded.
            </div>

            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-400 disabled:opacity-50 text-navy-950 font-bold text-xs transition-all flex items-center gap-2 cursor-pointer shadow-md shadow-teal-500/20"
            >
              <Upload className="w-4 h-4 stroke-[2.5]" />
              <span>{loading ? 'Extracting Clauses with PyMuPDF...' : 'Upload & Extract Clauses'}</span>
            </button>
          </form>
        </div>
      )}

      {/* Tab 2: Manual Entry */}
      {activeTab === 'manual' && (
        <div className="p-6 rounded-2xl bg-navy-900 border border-navy-800 shadow-sm">
          <h2 className="text-base font-bold text-white mb-1">Paste Guidelines Text Directly</h2>
          <p className="text-xs text-slate-400 mb-5">
            Paste your company brand policy text. Sections (e.g. "Section 1.1", "Rule 3") will be automatically parsed into stable clauses.
          </p>

          <form onSubmit={handleManualSubmit} className="space-y-4 max-w-2xl">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Guideline Title <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                value={manualTitle}
                onChange={(e) => setManualTitle(e.target.value)}
                placeholder="e.g. Social Media Brand Governance Rules 2026"
                className="w-full px-3.5 py-2.5 rounded-xl bg-navy-950 border border-navy-750 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-teal-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Guideline Content <span className="text-rose-400">*</span>
              </label>
              <textarea
                rows={8}
                value={manualContent}
                onChange={(e) => setManualContent(e.target.value)}
                placeholder={`Section 1.1 Comparative Superlatives\nMarketing materials must never claim #1 or fastest without audited 3rd party benchmark reports.\n\nSection 2.1 Warranties\nStatements like 100% guaranteed are prohibited without published SLA contracts.`}
                className="w-full p-4 rounded-xl bg-navy-950 border border-navy-750 text-sm text-slate-100 placeholder-slate-500 font-mono text-xs focus:outline-none focus:border-teal-500"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-400 disabled:opacity-50 text-navy-950 font-bold text-xs transition-all flex items-center gap-2 cursor-pointer shadow-md shadow-teal-500/20"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>{loading ? 'Processing...' : 'Save & Extract Clauses'}</span>
            </button>
          </form>
        </div>
      )}

      {/* Tab 3: Approved Facts Library */}
      {activeTab === 'facts' && (
        <div className="space-y-6">
          <div className="p-6 rounded-2xl bg-navy-900 border border-navy-800 shadow-sm">
            <h2 className="text-base font-bold text-white mb-1">Register Approved Corporate Fact</h2>
            <p className="text-xs text-slate-400 mb-5">
              Specific quantitative metrics (e.g. "42ms latency", "99.95% uptime") in marketing copy must match a registered fact to be verified as grounded.
            </p>

            <form onSubmit={handleAddFact} className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Fact Statement <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  value={factText}
                  onChange={(e) => setFactText(e.target.value)}
                  placeholder="e.g. NovaForge benchmark latency is 42ms for enterprise workloads."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-navy-950 border border-navy-750 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-teal-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Category</label>
                <select
                  value={factCategory}
                  onChange={(e) => setFactCategory(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-navy-950 border border-navy-750 text-sm text-slate-100 focus:outline-none focus:border-teal-500"
                >
                  <option value="performance">Performance & Speed</option>
                  <option value="reliability">Reliability & SLA</option>
                  <option value="scale">Customer Scale & Revenue</option>
                  <option value="certification">Compliance & Security</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Source Reference / Audit Report
                </label>
                <input
                  type="text"
                  value={factSource}
                  onChange={(e) => setFactSource(e.target.value)}
                  placeholder="e.g. TechAudit Labs Benchmark TA-2026-01"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-navy-950 border border-navy-750 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-teal-500"
                />
              </div>

              <div className="flex items-end">
                <button
                  type="submit"
                  className="w-full px-4 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-navy-950 font-bold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-teal-500/20"
                >
                  <Plus className="w-4 h-4 stroke-[2.5]" />
                  <span>Register Fact</span>
                </button>
              </div>
            </form>
          </div>

          {/* List of Approved Facts */}
          <div className="rounded-2xl bg-navy-900 border border-navy-800 p-6 shadow-sm">
            <h3 className="text-sm font-bold text-white mb-4">
              Registered Approved Facts ({approvedFacts.length})
            </h3>
            <div className="space-y-3">
              {approvedFacts.map((fact) => (
                <div
                  key={fact.id}
                  className="p-4 rounded-xl bg-navy-950 border border-navy-800 flex items-start justify-between gap-4"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs uppercase font-bold px-2 py-0.5 rounded bg-teal-500/10 text-teal-300 border border-teal-500/20">
                        {fact.category || 'Fact'}
                      </span>
                      {fact.source_reference && (
                        <span className="text-[11px] text-slate-400 font-mono">
                          Source: {fact.source_reference}
                        </span>
                      )}
                    </div>
                    <p className="mt-2 text-sm text-slate-200 font-medium">"{fact.fact_text}"</p>
                  </div>
                  <button
                    onClick={() => handleDeleteFact(fact.id)}
                    className="p-1.5 text-slate-500 hover:text-rose-400 transition-colors cursor-pointer"
                    title="Remove Fact"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Explorer / Clauses Browser */}
      <div className="rounded-2xl bg-navy-900 border border-navy-800 p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
          <div>
            <h2 className="text-base font-bold text-white">Active Guideline Clause Repository</h2>
            <p className="text-xs text-slate-400">
              Select a document to inspect individual extracted clauses cited by the AI governance engine.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <select
              value={selectedDoc?.id || ''}
              onChange={(e) => handleSelectDoc(e.target.value)}
              className="px-3 py-2 rounded-xl bg-navy-950 border border-navy-750 text-xs text-slate-200 focus:outline-none focus:border-teal-500"
            >
              {documents.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.title} {d.is_demo ? '(Demo Standard)' : ''}
                </option>
              ))}
            </select>
          </div>
        </div>

        {selectedDoc ? (
          <div>
            <div className="p-4 rounded-xl bg-navy-950 border border-navy-800/80 mb-6 flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-white">{selectedDoc.title}</span>
                  {selectedDoc.is_demo && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-teal-500/20 text-teal-300 border border-teal-500/30 uppercase">
                      Official Demo Dataset
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  Source: <span className="font-mono text-slate-300">{selectedDoc.filename}</span> • Total Clauses:{' '}
                  <span className="text-teal-300 font-semibold">{selectedDoc.clauses?.length || selectedDoc.clause_count || 0}</span>
                </p>
              </div>

              {!selectedDoc.is_demo && (
                <button
                  onClick={() => handleDeleteDoc(selectedDoc.id)}
                  className="px-3 py-1.5 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/40 text-rose-300 text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete Document</span>
                </button>
              )}
            </div>

            {/* Clause Search Filter */}
            <div className="mb-4">
              <input
                type="text"
                value={clauseSearch}
                onChange={(e) => setClauseSearch(e.target.value)}
                placeholder="Search extracted clauses by ID, heading, or keyword..."
                className="w-full max-w-md px-3.5 py-2 rounded-xl bg-navy-950 border border-navy-750 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-teal-500"
              />
            </div>

            {/* Clauses List */}
            <div className="space-y-3">
              {filteredClauses?.map((c) => (
                <div
                  key={c.id}
                  className="p-4 rounded-xl bg-navy-950/70 border border-navy-800 hover:border-navy-750 transition-colors"
                >
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-teal-500/15 text-teal-300 border border-teal-500/30">
                        {c.clause_identifier}
                      </span>
                      {c.section_heading && (
                        <span className="text-xs font-semibold text-slate-200">
                          {c.section_heading}
                        </span>
                      )}
                    </div>
                    {c.page_number && (
                      <span className="text-[11px] text-slate-400 font-mono px-2 py-0.5 rounded bg-navy-850 border border-navy-750">
                        Page {c.page_number}
                      </span>
                    )}
                  </div>
                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed pl-1.5 border-l-2 border-teal-500/50">
                    {c.clause_text}
                  </p>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="py-12 text-center text-slate-400 text-sm">
            No guideline document selected.
          </div>
        )}
      </div>
    </div>
  );
};
