import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  BookOpen,
  FileCheck2,
  History,
  Settings,
  Sparkles,
  Cpu,
  ShieldCheck,
  ChevronRight
} from 'lucide-react';
import { SystemStatus } from '../../types';

interface SidebarProps {
  status?: SystemStatus | null;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ status, onCloseMobile }) => {
  const navItems = [
    { to: '/', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/reviews/new', label: 'New Review', icon: FileCheck2 },
    { to: '/guidelines', label: 'Guidelines & Facts', icon: BookOpen },
    { to: '/reviews', label: 'Review History', icon: History },
    { to: '/settings', label: 'Settings & Status', icon: Settings },
  ];

  return (
    <aside className="w-72 bg-navy-900 border-r border-navy-800 flex flex-col h-screen shrink-0 select-none">
      {/* Brand Header with Official Logo */}
      <div className="p-5 border-b border-navy-800/80 bg-navy-950/40">
        <NavLink to="/" onClick={onCloseMobile} className="block group">
          {/* Official Full Logo in crisp white card */}
          <div className="bg-white p-2.5 rounded-xl border border-slate-200/20 shadow-md flex items-center justify-center transition-transform group-hover:scale-[1.01]">
            <img
              src="/logo_full.png"
              alt="OmniGuide — Governance, Guided by Intelligence"
              className="w-full h-auto max-h-12 object-contain"
            />
          </div>
        </NavLink>
        
        <div className="mt-3 flex items-center justify-between text-[11px] px-1">
          <span className="text-slate-400 font-medium">Team NovaForge</span>
          <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-teal-500/15 text-teal-300 border border-teal-500/30">
            Codex48 Round 2
          </span>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3.5 py-5 space-y-1.5 overflow-y-auto">
        <div className="px-3 pb-2 text-[11px] font-bold tracking-wider uppercase text-slate-400">
          Governance Workspace
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              onClick={onCloseMobile}
              className={({ isActive }) =>
                `flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition-all group ${
                  isActive
                    ? 'bg-teal-500/15 text-teal-300 border border-teal-500/35 shadow-sm shadow-teal-500/10'
                    : 'text-slate-300 hover:text-white hover:bg-navy-850/80'
                }`
              }
            >
              <div className="flex items-center gap-3">
                <Icon className="w-4 h-4 transition-colors group-hover:text-teal-400" />
                <span>{item.label}</span>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity" />
            </NavLink>
          );
        })}
      </nav>

      {/* Verified System Health & Diagnostics Card */}
      <div className="p-3.5 border-t border-navy-800 bg-navy-950/60">
        <div className="p-3.5 rounded-xl bg-navy-850 border border-navy-750">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-300 font-semibold flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-teal-400" />
              Engine Status
            </span>
            <span className="flex items-center gap-1.5 text-teal-300 text-[11px] font-semibold">
              <span className="w-2 h-2 rounded-full bg-teal-400 animate-pulse"></span>
              {status?.status === 'operational' ? 'Operational' : 'Active'}
            </span>
          </div>

          <div className="mt-2.5 text-[11px] space-y-1.5 text-slate-400 border-t border-navy-750 pt-2 font-mono">
            <div className="flex justify-between items-center">
              <span>Database:</span>
              <span className="text-slate-200 capitalize font-medium">
                {status?.database_dialect || 'PostgreSQL'}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span>AI Provider:</span>
              <span className="text-slate-200 flex items-center gap-1">
                {status?.gemini_configured ? (
                  <>
                    <Sparkles className="w-2.5 h-2.5 text-teal-400" />
                    Gemini Flash
                  </>
                ) : (
                  <>
                    <Cpu className="w-2.5 h-2.5 text-blue-400" />
                    Deterministic
                  </>
                )}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span>Indexed Clauses:</span>
              <span className="text-teal-300 font-semibold">{status?.clauses_count ?? 7}</span>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
};
