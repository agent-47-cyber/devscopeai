import React from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';

export default function Sidebar({ onSignOut, userName }) {
  const navigate = useNavigate();
  const location = useLocation();

  const getTabFromPath = () => {
    const path = location.pathname;
    if (path.includes('/github')) return 'github';
    if (path.includes('/resume')) return 'resume';
    if (path.includes('/linkedin')) return 'linkedin';
    if (path.includes('/job-match')) return 'recruiter';
    if (path.includes('/project-gap')) return 'projects';
    if (path.includes('/report')) return 'analytics';
    if (path.includes('/settings')) return 'settings';
    return 'overview';
  };

  const activeTab = getTabFromPath();

  const navItems = [
    { id: 'overview', path: '/dashboard', icon: 'dashboard', label: 'Overview' },
    { id: 'resume', path: '/resume', icon: 'description', label: 'Resume Analyzer' },
    { id: 'github', path: '/github', icon: 'code', label: 'GitHub Analyzer' },
    { id: 'linkedin', path: '/linkedin', icon: 'account_circle', label: 'LinkedIn Analyzer' },
    { id: 'recruiter', path: '/job-match', icon: 'work', label: 'Role Match' },
    { id: 'projects', path: '/project-gap', icon: 'map', label: 'Project Gap Analysis' },
    { id: 'analytics', path: '/report', icon: 'assessment', label: 'Candidate Report' }
  ];

  return (
    <aside className="fixed h-full left-0 top-0 w-sidebar-width border-r border-outline-variant bg-background z-50 flex flex-col">
      <div className="p-6 cursor-pointer" onClick={() => navigate('/dashboard')}>
        <h1 className="font-headline-md text-headline-md font-bold tracking-tighter text-primary">DEVSCOPE AI</h1>
        <p className="font-label-caps text-label-caps text-on-surface-variant mt-1">Intelligence Terminal</p>
      </div>
      <nav className="flex-1 mt-4 flex flex-col overflow-y-auto">
        {navItems.map(item => {
          const isActive = activeTab === item.id;
          return (
            <Link
              key={item.id}
              to={item.path}
              className={`flex items-center gap-3 px-4 py-3 rounded-md mx-2 transition-all duration-300 ease-in-out ${isActive
                  ? 'bg-[#151515] text-white border border-[#252525] shadow-[0_2px_8px_rgba(0,0,0,0.5)]'
                  : 'text-[#9A9A9A] border border-transparent hover:bg-[#111111] hover:text-[#D0D0D0]'
                }`}
            >
              <span className="material-symbols-outlined">{item.icon}</span>
              <span className="font-label-caps text-label-caps">{item.label}</span>
            </Link>
          );
        })}

        <div className="mt-auto flex flex-col">
          <Link
            to="/settings"
            className={`flex items-center gap-3 px-4 py-3 rounded-md mx-2 transition-all duration-300 ease-in-out ${activeTab === 'settings'
                ? 'bg-[#151515] text-white border border-[#252525] shadow-[0_2px_8px_rgba(0,0,0,0.5)]'
                : 'text-[#9A9A9A] border border-transparent hover:bg-[#111111] hover:text-[#D0D0D0]'
              }`}
          >
            <span className="material-symbols-outlined">settings</span>
            <span className="font-label-caps text-label-caps">Settings</span>
          </Link>
          <button
            onClick={onSignOut}
            className="flex items-center gap-3 px-4 py-3 rounded-md mx-2 text-[#ef4444] border border-transparent hover:bg-[#ef4444]/5 hover:border-[#ef4444]/20 transition-all duration-300 ease-in-out text-left"
          >
            <span className="material-symbols-outlined">logout</span>
            <span className="font-label-caps text-label-caps">Sign Out</span>
          </button>
        </div>
      </nav>
    </aside>
  );
}
