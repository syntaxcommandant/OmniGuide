import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, Plus } from 'lucide-react';
import { SystemStatus } from '../../types';

interface HeaderProps {
  status?: SystemStatus | null;
  onOpenMobile?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ status, onOpenMobile }) => {
  const location = useLocation();

  // Determine current page context title
  const getPageTitle = () => {
    const path = location.pathname;
    if (path === '/') return 'Workspace Overview';
    if (path === '/simulator') return 'Campaign Launch Simulator';
    if (path === '/redteam') return 'Brand Red-Team Stress Test';
    if (path.startsWith('/reviews/new')) return 'New Content Review';
    if (path.startsWith('/reviews/')) return 'Audit Results & Evidence';
    if (path === '/reviews') return 'Review History';
    if (path === '/guidelines') return 'Brand Guidelines & Approved Facts';
    if (path === '/settings') return 'Settings & System Diagnostics';
    return 'Brand Governance Workspace';
  };

  return (
    <header className="sticky top-0 z-20 bg-white border-b border-slate-200/90 shadow-2xs">
      <div className="w-full px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        
        {/* Left Side: Mobile Menu Button + Page Context Title */}
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={onOpenMobile}
            className="lg:hidden p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg focus-ring cursor-pointer"
            aria-label="Open navigation menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="min-w-0">
            <h1 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight truncate">
              {getPageTitle()}
            </h1>
          </div>
        </div>

        {/* Right Side: Compact System Status + One Prominent New Review Action */}
        <div className="flex items-center gap-3 shrink-0">
          {/* Truthful Operational Status Pill */}
          <div className="hidden sm:inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-slate-50 border border-slate-200 text-xs text-slate-600 font-medium font-mono">
            <span className={`w-2 h-2 rounded-full ${status?.status === 'operational' ? 'bg-emerald-500' : 'bg-amber-400'}`}></span>
            <span className="truncate">
              {status?.status === 'operational'
                ? `DB: ${status.database_dialect || 'sqlite'} operational`
                : 'Connecting...'}
            </span>
          </div>

          {/* Single Prominent Primary Action Button */}
          <Link
            to="/reviews/new"
            id="header-new-review-btn"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold transition-all shadow-xs cursor-pointer focus-ring"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>New Review</span>
          </Link>
        </div>
      </div>
    </header>
  );
};
