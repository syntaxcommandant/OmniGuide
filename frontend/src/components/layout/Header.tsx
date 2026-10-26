import React from 'react';
import { Menu, Sparkles, Play, ShieldAlert, Cpu } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { SystemStatus } from '../../types';

interface HeaderProps {
  status?: SystemStatus | null;
  onOpenMobile?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ status, onOpenMobile }) => {
  const navigate = useNavigate();

  return (
    <header className="h-16 border-b border-navy-800 bg-navy-900/80 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-20">
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenMobile}
          className="md:hidden p-2 text-slate-400 hover:text-white rounded-lg hover:bg-navy-800"
          aria-label="Open menu"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-sm font-semibold text-white tracking-wide">
              Enterprise Governance Console
            </h1>
            <span className="hidden sm:inline-block px-2 py-0.5 text-[11px] rounded bg-navy-800 text-slate-300 border border-navy-700">
              NovaForge v1.0
            </span>
          </div>
          <p className="text-[11px] text-slate-400 hidden sm:block">
            Ground-truth guideline verification & human-in-the-loop review
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Quick Launch Demo Button */}
        <button
          onClick={() => navigate('/reviews/new?scenario=canonical_superlative')}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-teal-500/15 hover:bg-teal-500/25 border border-teal-500/40 text-teal-300 text-xs font-semibold transition-all hover:scale-102 cursor-pointer shadow-sm shadow-teal-500/10"
          title="Launch the official hackathon demo case: 'India\'s #1 fastest tool for Indian teams.'"
        >
          <Play className="w-3.5 h-3.5 fill-teal-400 text-teal-400" />
          <span className="hidden md:inline">Run Demo:</span>
          <span>"#1 Fastest" Case</span>
        </button>

        {/* AI Engine Status Pill */}
        <div className="hidden lg:flex items-center gap-2 px-2.5 py-1 rounded-lg bg-navy-800 border border-navy-700 text-xs text-slate-300">
          {status?.gemini_configured ? (
            <>
              <Sparkles className="w-3.5 h-3.5 text-teal-400" />
              <span>Gemini Flash</span>
            </>
          ) : (
            <>
              <Cpu className="w-3.5 h-3.5 text-blue-400" />
              <span>Deterministic Engine</span>
            </>
          )}
        </div>
      </div>
    </header>
  );
};
