import React, { useState, useEffect } from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { api } from '../../services/api';
import { SystemStatus } from '../../types';
import { X, Shield } from 'lucide-react';

export const Layout: React.FC = () => {
  const [status, setStatus] = useState<SystemStatus | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    api.getStatus()
      .then(setStatus)
      .catch((err) => console.warn('Could not fetch initial status:', err));
  }, []);

  return (
    <div className="flex h-screen bg-navy-950 text-slate-100 overflow-hidden font-sans">
      {/* Desktop Sidebar */}
      <div className="hidden md:flex">
        <Sidebar status={status} />
      </div>

      {/* Mobile Drawer Overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div
            className="fixed inset-0 bg-black/75 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          <div className="relative flex flex-col w-72 max-w-xs bg-navy-900 border-r border-navy-800 z-10">
            <button
              onClick={() => setMobileOpen(false)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
            <Sidebar status={status} onCloseMobile={() => setMobileOpen(false)} />
          </div>
        </div>
      )}

      {/* Main View Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header status={status} onOpenMobile={() => setMobileOpen(true)} />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-navy-950 flex flex-col justify-between">
          <div className="max-w-7xl mx-auto w-full">
            <Outlet context={{ systemStatus: status, refreshStatus: () => api.getStatus().then(setStatus) }} />
          </div>

          {/* Clean Enterprise Footer per Prompt Specification */}
          <footer className="mt-12 pt-6 pb-2 border-t border-navy-800/80 text-xs text-slate-400 flex flex-col sm:flex-row items-center justify-between gap-3 max-w-7xl mx-auto w-full">
            <div className="flex items-center gap-2.5">
              <img
                src="/logo_symbol.png"
                alt="OmniGuide Symbol"
                className="w-4 h-4 object-contain"
              />
              <span className="font-semibold text-slate-300">OmniGuide</span>
              <span>—</span>
              <span className="italic text-slate-400">"Governance, Guided by Intelligence."</span>
            </div>

            <div className="flex items-center gap-4 text-slate-400 text-[11px]">
              <span>Team NovaForge</span>
              <span>•</span>
              <span>Codex48 Round 2</span>
              <span>•</span>
              <NavLink to="/settings" className="hover:text-teal-300 transition-colors">
                System Status
              </NavLink>
            </div>
          </footer>
        </main>
      </div>
    </div>
  );
};
