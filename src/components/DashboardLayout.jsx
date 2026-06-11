import React from 'react';
import Sidebar from './Sidebar.jsx';
import TopNavBar from './TopNavBar.jsx';
import AmbientBackground from './AmbientBackground.jsx';

export default function DashboardLayout({ children, onSignOut, userName, user, onExport, exportState }) {
  return (
    <div className="bg-background text-on-surface min-h-screen" style={{ position: 'relative' }}>
      {/* Enterprise ambient motion layer — fixed, behind all content */}
      <AmbientBackground />

      {/* All UI sits above the canvas */}
      <div style={{ position: 'relative', zIndex: 1 }}>
        <Sidebar onSignOut={onSignOut} userName={userName} />
        <TopNavBar user={user} onExport={onExport} exportState={exportState} />
        <main className="ml-sidebar-width pt-16 min-h-screen">
          <div className="p-gutter max-w-7xl mx-auto">
            {children}

            {/* Atmospheric Footer Branding */}
            <div className="mt-section-margin pb-12 flex justify-between items-center opacity-30 border-t border-outline-variant pt-8">
              <div className="font-label-caps text-[10px] tracking-widest uppercase">Proprietary Recruitment Intelligence Layer</div>
              <div className="font-label-caps text-[10px] tracking-widest uppercase">© 2024 DEVSCOPE GLOBAL TERMINAL</div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
