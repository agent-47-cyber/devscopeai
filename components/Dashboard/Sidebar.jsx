'use client';
import React from 'react';
import { motion } from 'framer-motion';
import { 
  Home, 
  Github, 
  FileText, 
  Linkedin, 
  Zap, 
  MessageSquare, 
  UserCheck, 
  Lightbulb, 
  BarChart2, 
  LogOut 
} from 'lucide-react';

const TABS = [
  { id: 'overview', label: 'Overview', icon: Home },
  { id: 'resume', label: 'Resume Analyzer', icon: FileText },
  { id: 'github', label: 'GitHub Analyzer', icon: Github },
  { id: 'linkedin', label: 'LinkedIn Analyzer', icon: Linkedin },
  { id: 'ideas', label: 'Project Ideas', icon: Lightbulb }
];

export const Sidebar = ({ activeTab, setActiveTab, onSignOut }) => {
  return (
    <aside className="fixed h-full left-0 top-0 w-sidebar-width border-r border-outline-variant bg-background z-50 flex flex-col">
      <div className="p-6">
        <h1 className="font-headline-md text-headline-md font-bold tracking-tighter text-primary">DEVSCOPE AI</h1>
        <p className="font-label-caps text-label-caps text-on-surface-variant mt-1">Intelligence Terminal</p>
      </div>
      
      <nav className="flex-1 mt-4 overflow-y-auto">
        {TABS.map((tab, i) => {
          const isActive = activeTab === tab.id;
          const Icon = tab.icon;
          return (
            <motion.button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: i * 0.05 }}
              className={`w-full flex items-center gap-3 px-4 py-3 transition-all duration-150 ease-in-out text-left ${
                isActive 
                  ? 'text-primary border-l-2 border-primary bg-primary/5' 
                  : 'text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface border-l-2 border-transparent'
              }`}
            >
              <Icon size={18} className={isActive ? 'text-primary' : 'text-on-surface-variant'} />
              <span className="font-label-caps text-label-caps uppercase">{tab.label}</span>
            </motion.button>
          );
        })}
        
        <motion.button
          onClick={onSignOut}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, delay: TABS.length * 0.05 }}
          className="w-full flex items-center gap-3 px-4 py-3 text-on-surface-variant hover:bg-surface-container-high hover:text-error transition-all duration-150 ease-in-out mt-auto border-l-2 border-transparent"
        >
          <LogOut size={18} />
          <span className="font-label-caps text-label-caps uppercase">Sign Out</span>
        </motion.button>
      </nav>
    </aside>
  );
};

