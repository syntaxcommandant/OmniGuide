import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  History,
  Search,
  Trash2,
  FileCheck2,
  ArrowUpDown,
  Filter,
  ChevronRight
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

  const loadReviews = useCallback(async () => {
    try {
      const data = await api.getReviews();
      setReviews(data);
    } catch (err) {
      console.error('Error fetching review history:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadReviews();
  }, [loadReviews]);

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
    <div className="space-y-6 animate-fadeIn">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-teal-50 text-teal-700 border border-teal-200">
              <History className="w-5 h-5" />
            </span>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              Review History
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">
            Inspect past marketing compliance reviews, findings counts, and decision histories.
          </p>
        </div>

        <Link
          to="/reviews/new"
          className="px-4 py-2.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs flex items-center gap-2 transition-colors cursor-pointer shadow-xs self-start sm:self-auto"
        >
          <FileCheck2 className="w-4 h-4" />
          <span>New Review</span>
        </Link>
      </div>

      {/* Filter / Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl bg-white border border-slate-200 shadow-xs">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by campaign title or content type..."
            className="w-full pl-9 pr-4 py-2 rounded-lg bg-slate-50 border border-slate-200 text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-teal-600 focus:bg-white transition-colors"
          />
        </div>

        <div className="flex items-center gap-3 self-start sm:self-auto">
          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-slate-500" />
            <span className="text-xs text-slate-600 font-medium">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs font-medium text-slate-800 focus:outline-none focus:border-teal-600"
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
            className="px-3 py-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 text-xs font-medium text-slate-700 flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Toggle sort order"
          >
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-500" />
            <span className="hidden sm:inline">{sortOrder === 'desc' ? 'Newest' : 'Oldest'}</span>
          </button>
        </div>
      </div>

      {/* Review Records Table per Phase 7 */}
      {loading ? (
        <div className="p-16 rounded-xl bg-white border border-slate-200 text-center text-slate-500 text-sm shadow-xs">
          Loading audit records...
        </div>
      ) : filtered.length === 0 ? (
        <div className="p-16 rounded-xl bg-white border border-slate-200 text-center space-y-3 shadow-xs">
          <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
            <FileCheck2 className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-900">No Review Records Found</h3>
          <p className="text-xs text-slate-600 max-w-sm mx-auto">
            {searchQuery || statusFilter !== 'all'
              ? 'No reviews match your current search query or filter.'
              : 'Audit your first marketing content draft to establish compliance history.'}
          </p>
          <Link
            to="/reviews/new"
            className="mt-2 inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs shadow-xs transition-colors cursor-pointer"
          >
            <FileCheck2 className="w-4 h-4" />
            <span>Audit Marketing Content</span>
          </Link>
        </div>
      ) : (
        <div className="rounded-xl bg-white border border-slate-200 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200/80 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-4">Campaign Title</th>
                  <th className="py-3 px-3">Content Type</th>
                  <th className="py-3 px-3">Review Date</th>
                  <th className="py-3 px-3">Findings</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((r) => (
                  <tr
                    key={r.id}
                    onClick={() => navigate(`/reviews/${r.id}`)}
                    className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                  >
                    <td className="py-3.5 px-4 font-semibold text-slate-900 group-hover:text-teal-700 max-w-[220px]">
                      <div className="truncate font-semibold">{r.title}</div>
                      <div className="text-[11px] text-slate-400 font-mono mt-0.5 font-normal">
                        Mode: {r.analysis_mode}
                      </div>
                    </td>
                    <td className="py-3.5 px-3">
                      <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200 font-medium">
                        {r.content_type}
                      </span>
                    </td>
                    <td className="py-3.5 px-3 text-slate-600 font-mono whitespace-nowrap">
                      <div>{new Date(r.created_at).toLocaleDateString()}</div>
                      <div className="text-[10px] text-slate-400">
                        {new Date(r.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </td>
                    <td className="py-3.5 px-3 text-slate-700 font-mono">
                      <div className="font-semibold">{r.findings_count} total</div>
                      {r.high_severity_count > 0 ? (
                        <div className="text-[11px] text-red-600 font-medium">
                          {r.high_severity_count} critical
                        </div>
                      ) : (
                        <div className="text-[11px] text-emerald-600 font-medium">
                          0 critical
                        </div>
                      )}
                    </td>
                    <td className="py-3.5 px-3">
                      <StatusBadge status={r.overall_status} />
                    </td>
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={(e) => handleDelete(e, r.id)}
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors rounded-lg cursor-pointer"
                          title="Delete Review"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                        <Link
                          to={`/reviews/${r.id}`}
                          onClick={(e) => e.stopPropagation()}
                          className="text-teal-700 hover:text-teal-800 font-semibold inline-flex items-center gap-1 group-hover:translate-x-0.5 transition-transform"
                        >
                          <span>View Details</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
