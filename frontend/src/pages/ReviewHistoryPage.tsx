import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  History,
  Search,
  ArrowRight,
  Trash2,
  FileCheck2,
  Clock,
  Sparkles,
  Cpu,
  ArrowUpDown,
  Filter
} from 'lucide-react';
import { api } from '../services/api';
import { ReviewListItem } from '../types';
import { StatusBadge } from '../components/common/Badge';

export const ReviewHistoryPage: React.FC = () => {
  const navigate = useNavigate();
  const [reviews, setReviews] = useState<ReviewListItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');

  const loadReviews = async () => {
    try {
      const data = await api.getReviews();
      setReviews(data);
    } catch (err) {
      console.error('Error fetching review history:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReviews();
  }, []);

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!window.confirm('Delete this compliance audit review from database history?')) return;
    try {
      await api.deleteReview(id);
      setReviews((prev) => prev.filter((r) => r.id !== id));
    } catch (err: any) {
      alert(`Delete failed: ${err.message}`);
    }
  };

  const filtered = reviews
    .filter((r) => {
      if (statusFilter !== 'all' && r.overall_status !== statusFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return r.title.toLowerCase().includes(q) || r.content_type.toLowerCase().includes(q);
      }
      return true;
    })
    .sort((a, b) => {
      const dateA = new Date(a.created_at).getTime();
      const dateB = new Date(b.created_at).getTime();
      return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
    });

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-navy-800">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
            <History className="w-6 h-6 text-teal-400" />
            Compliance Review History
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Search, filter, and inspect persisted marketing compliance audits and reviewer decision records.
          </p>
        </div>

        <button
          onClick={() => navigate('/reviews/new')}
          className="px-4 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-navy-950 font-bold text-xs flex items-center gap-2 cursor-pointer self-start sm:self-auto shadow-md shadow-teal-500/20"
        >
          <FileCheck2 className="w-4 h-4 stroke-[2.5]" />
          <span>Audit Content</span>
        </button>
      </div>

      {/* Search, Filter, and Sort Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-navy-900 border border-navy-800 shadow-sm">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by review title or content type..."
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-navy-950 border border-navy-750 text-xs sm:text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-teal-500"
          />
        </div>

        <div className="flex items-center gap-3 self-start sm:self-auto">
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 font-medium">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-1.5 rounded-xl bg-navy-950 border border-navy-750 text-xs text-slate-200 focus:outline-none focus:border-teal-500"
            >
              <option value="all">All Reviews ({reviews.length})</option>
              <option value="compliant">Compliant</option>
              <option value="needs_review">Needs Review</option>
              <option value="resolved">Resolved</option>
              <option value="flagged">Flagged</option>
            </select>
          </div>

          <button
            onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}
            className="px-3 py-1.5 rounded-xl bg-navy-950 border border-navy-750 text-xs text-slate-300 hover:text-white flex items-center gap-1.5 cursor-pointer"
            title="Toggle sort order"
          >
            <ArrowUpDown className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{sortOrder === 'desc' ? 'Newest' : 'Oldest'}</span>
          </button>
        </div>
      </div>

      {/* Review Records List */}
      {loading ? (
        <div className="py-20 text-center text-slate-400 text-sm">
          Loading persisted reviews...
        </div>
      ) : filtered.length === 0 ? (
        <div className="p-16 rounded-2xl bg-navy-900 border border-navy-800 text-center space-y-3 shadow-sm">
          <FileCheck2 className="w-10 h-10 text-slate-500 mx-auto" />
          <h3 className="text-base font-bold text-white">No Review Records Found</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            {searchQuery || statusFilter !== 'all'
              ? 'No reviews match your search or status filter.'
              : 'Audit your first draft marketing copy to populate compliance history.'}
          </p>
          <button
            onClick={() => navigate('/reviews/new')}
            className="mt-2 px-4 py-2.5 rounded-xl bg-teal-500 text-navy-950 font-bold text-xs"
          >
            Audit Marketing Copy
          </button>
        </div>
      ) : (
        <div className="rounded-2xl bg-navy-900 border border-navy-800 divide-y divide-navy-800/80 overflow-hidden shadow-sm">
          {filtered.map((r) => (
            <div
              key={r.id}
              onClick={() => navigate(`/reviews/${r.id}`)}
              className="p-4 sm:p-5 hover:bg-navy-850/60 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer group"
            >
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2 mb-1.5">
                  <h3 className="font-bold text-sm sm:text-base text-slate-200 group-hover:text-teal-300 transition-colors">
                    {r.title}
                  </h3>
                  <span className="text-[11px] px-2.5 py-0.5 rounded-md bg-navy-800 text-slate-300 border border-navy-700">
                    {r.content_type}
                  </span>
                  <StatusBadge status={r.overall_status} />
                </div>

                <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 font-mono mt-2">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-slate-500" />
                    {new Date(r.created_at).toLocaleDateString()} at{' '}
                    {new Date(r.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  <span>•</span>
                  <span>{r.findings_count} total findings</span>
                  <span>•</span>
                  <span className="text-rose-400 font-semibold">{r.high_severity_count} critical</span>
                  <span>•</span>
                  <span className="text-teal-300">{r.resolved_count} resolved</span>
                </div>
              </div>

              <div className="flex items-center gap-3 self-end sm:self-auto shrink-0">
                <button
                  onClick={(e) => handleDelete(e, r.id)}
                  className="p-2 text-slate-500 hover:text-rose-400 transition-colors rounded-lg hover:bg-navy-800 cursor-pointer"
                  title="Delete Review"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                <div className="flex items-center gap-1 text-xs font-bold text-teal-400 group-hover:translate-x-1 transition-transform">
                  <span>Inspect</span>
                  <ArrowRight className="w-4 h-4" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
