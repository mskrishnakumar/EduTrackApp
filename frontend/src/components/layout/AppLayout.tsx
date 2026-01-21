import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';

export function AppLayout() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-bg">
      {/* Sidebar */}
      <Sidebar
        isCollapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
      />

      {/* Mobile overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Main Content */}
      <main
        className={`
          min-h-screen
          transition-all duration-300
          ${sidebarCollapsed ? 'lg:ml-16' : 'lg:ml-60'}
        `}
      >
        <Topbar onMobileMenuToggle={() => setMobileMenuOpen(!mobileMenuOpen)} />
        <div className="p-6 lg:p-10 min-h-[calc(100vh-72px)]">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
