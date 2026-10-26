import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { api } from '../../services/api';
import { SystemStatus } from '../../types';
import { X } from 'lucide-react';

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
            className="fixed inset-0 bg-black/70 backdrop-blur-sm"
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
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-navy-950">
          <div className="max-w-7xl mx-auto">
            <Outlet context={{ systemStatus: status, refreshStatus: () => api.getStatus().then(setStatus) }} />
          </div>
        </main>
      </div>
    </div>
  );
};
