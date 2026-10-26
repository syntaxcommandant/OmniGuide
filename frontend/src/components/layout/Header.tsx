import React from 'react';
import { Menu, Sparkles, Plus, Play, Cpu, CheckCircle2 } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { SystemStatus } from '../../types';

interface HeaderProps {
  status?: SystemStatus | null;
  onOpenMobile?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ status, onOpenMobile }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const getPageInfo = () => {
    switch (location.pathname) {
      case '/':
        return { title: 'Executive Overview', subtitle: 'Governance metrics & real-time activity' };
      case '/reviews/new':
        return { title: 'Audit Marketing Content', subtitle: 'Step-by-step guideline verification' };
      case '/guidelines':
        return { title: 'Brand Guidelines & Approved Facts', subtitle: 'Ground-truth policies & verified claims' };
      case '/reviews':
        return { title: 'Compliance Review History', subtitle: 'Audit trail of past submissions & resolutions' };
      case '/settings':
        return { title: 'Settings & System Diagnostics', subtitle: 'Engine connectivity & rule inspector' };
      default:
        if (location.pathname.startsWith('/reviews/')) {
          return { title: 'Review Results & Findings Inspector', subtitle: 'Explainable guideline violations & human decisions' };
        }
        return { title: 'Enterprise Governance Workspace', subtitle: 'Team NovaForge' };
    }
  };

  const info = getPageInfo();

  return (
    <header className="h-16 border-b border-navy-800 bg-navy-900/90 backdrop-blur-md px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30">
      <div className="flex items-center gap-3 min-w-0">
        <button
          onClick={onOpenMobile}
          className="md:hidden p-2 text-slate-400 hover:text-white rounded-lg hover:bg-navy-800"
          aria-label="Open navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Brand Icon for compact / mobile context */}
        <img
          src="/logo_symbol.png"
          alt="OmniGuide Symbol"
          className="w-7 h-7 object-contain hidden sm:block md:hidden"
        />

        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h1 className="text-sm sm:text-base font-bold text-white tracking-tight truncate">
              {info.title}
            </h1>
            <span className="hidden lg:inline-block px-2 py-0.5 text-[10px] font-bold uppercase rounded bg-teal-500/15 text-teal-300 border border-teal-500/30">
              Verified
            </span>
          </div>
          <p className="text-[11px] text-slate-400 hidden sm:block truncate">
            {info.subtitle}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
        {/* Quick Launch Canonical Demo Button */}
        <button
          onClick={() => navigate('/reviews/new?scenario=canonical_superlative')}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-navy-850 hover:bg-navy-800 border border-teal-500/40 text-teal-300 text-xs font-semibold transition-all shadow-sm hover:scale-[1.02] cursor-pointer"
          title="Launch canonical hackathon demo test case: 'India\'s #1 fastest tool for Indian teams.'"
        >
          <Play className="w-3.5 h-3.5 fill-teal-400 text-teal-400" />
          <span className="hidden sm:inline">Run Demo:</span>
          <span>"#1 Fastest"</span>
        </button>

        {/* New Review Primary Action */}
        <button
          onClick={() => navigate('/reviews/new')}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-teal-500 hover:bg-teal-400 text-navy-950 text-xs font-bold transition-all shadow-md shadow-teal-500/20 cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5 stroke-[3]" />
          <span className="hidden sm:inline">New Review</span>
        </button>

        {/* AI Engine Status Badge */}
        <div className="hidden xl:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-navy-850 border border-navy-750 text-xs text-slate-300 font-mono">
          {status?.gemini_configured ? (
            <>
              <Sparkles className="w-3.5 h-3.5 text-teal-400" />
              <span>Gemini Flash</span>
            </>
          ) : (
            <>
              <Cpu className="w-3.5 h-3.5 text-blue-400" />
              <span>Deterministic</span>
            </>
          )}
        </div>
      </div>
    </header>
  );
};
