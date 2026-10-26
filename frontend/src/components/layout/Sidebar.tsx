import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  BookOpen,
  FileCheck2,
  History,
  Settings,
  Shield,
  Sparkles,
  ExternalLink
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
    <aside className="w-64 bg-navy-900 border-r border-navy-800 flex flex-col h-screen shrink-0">
      {/* Brand Header */}
      <div className="p-5 border-b border-navy-800/80">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center shadow-lg shadow-teal-500/20">
            <Shield className="w-6 h-6 text-navy-950 stroke-[2.5]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-lg tracking-tight text-white">OmniGuide</span>
              <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-teal-500/20 text-teal-300 border border-teal-500/30">
                MVP
              </span>
            </div>
            <p className="text-xs text-slate-400 font-medium">Team NovaForge</p>
          </div>
        </div>
        <p className="mt-2.5 text-[11px] leading-relaxed text-slate-400/90 italic">
          "AI brand governance that explains, not just rejects."
        </p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto">
        <div className="px-3 pb-2 text-[11px] font-semibold tracking-wider uppercase text-slate-300">
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
                `flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-teal-500/15 text-teal-300 border border-teal-500/30 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-navy-800/60'
                }`
              }
            >
              <Icon className="w-4 h-4" />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* System Health / Status Card in Sidebar */}
      <div className="p-3 border-t border-navy-800/80 bg-navy-950/40">
        <div className="p-3 rounded-lg bg-navy-850/80 border border-navy-700/60">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400 font-medium">System Engine</span>
            <span className="flex items-center gap-1.5 text-teal-400 text-[11px] font-semibold">
              <span className="w-2 h-2 rounded-full bg-teal-400 animate-pulse"></span>
              {status?.status === 'operational' ? 'Operational' : 'Ready'}
            </span>
          </div>

          <div className="mt-2 text-[11px] space-y-1 text-slate-400">
            <div className="flex justify-between">
              <span>Database:</span>
              <span className="text-slate-300 font-mono capitalize">{status?.database_dialect || 'PostgreSQL'}</span>
            </div>
            <div className="flex justify-between">
              <span>AI Provider:</span>
              <span className="text-slate-300 font-mono flex items-center gap-1">
                <Sparkles className="w-2.5 h-2.5 text-teal-400" />
                {status?.gemini_configured ? 'Gemini Flash' : 'Deterministic'}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Clauses:</span>
              <span className="text-slate-300 font-mono">{status?.clauses_count ?? 7}</span>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
};
