import React, { useState, useEffect } from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { api } from '../../services/api';
import { SystemStatus } from '../../types';

export const Layout: React.FC = () => {
  const [status, setStatus] = useState<SystemStatus | null>(null);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  useEffect(() => {
    api.getStatus()
      .then(setStatus)
      .catch((err) => console.warn('Could not fetch initial status:', err));
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex font-sans selection:bg-teal-100 selection:text-teal-900">
      {/* Desktop Persistent Left Sidebar */}
      <div className="hidden lg:block shrink-0 sticky top-0 h-screen z-30">
        <Sidebar status={status} />
      </div>

      {/* Mobile Drawer Backdrop & Sidebar */}
      {mobileSidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity"
            onClick={() => setMobileSidebarOpen(false)}
          />
          <div className="relative z-10 animate-fadeIn">
            <Sidebar status={status} onCloseMobile={() => setMobileSidebarOpen(false)} />
          </div>
        </div>
      )}

      {/* Main Column */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        {/* Compact Top Header */}
        <Header status={status} onOpenMobile={() => setMobileSidebarOpen(true)} />

        {/* Main Content Area */}
        <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          <Outlet context={{ systemStatus: status, refreshStatus: () => api.getStatus().then(setStatus) }} />
        </main>

        {/* Enterprise Footer */}
        <footer className="mt-auto border-t border-slate-200/90 bg-white py-4 px-4 sm:px-6 lg:px-8">
          <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2.5 text-xs text-slate-500">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-800">OmniGuide</span>
              <span>—</span>
              <span className="italic text-slate-600">"Governance, Guided by Intelligence."</span>
            </div>

            <div className="flex items-center gap-3 text-[11px] text-slate-500">
              <span>Every claim checked. Every decision explained.</span>
              <span>•</span>
              <NavLink to="/settings" className="hover:text-teal-700 transition-colors underline-offset-2 hover:underline">
                System Status
              </NavLink>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
};
