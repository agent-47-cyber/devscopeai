'use client';
import React from 'react';
import { motion } from 'framer-motion';
import { Search, Bell, Download } from 'lucide-react';

export const Header = ({ profileData }) => {
  return (
    <motion.header 
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="fixed top-0 right-0 left-0 ml-[240px] h-16 px-gutter flex justify-between items-center bg-background border-b border-outline-variant z-40"
    >
      <div className="flex items-center gap-4 flex-1">
        <div className="relative w-full max-w-md">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" />
          <input 
            className="w-full bg-[#050505] border border-outline-variant py-1.5 pl-10 pr-4 font-label-caps text-[10px] text-on-surface focus:ring-0 focus:border-primary transition-colors" 
            placeholder="QUERY INTELLIGENCE..." 
            type="text" 
          />
        </div>
      </div>
      <div className="flex items-center gap-6">
        <button className="flex items-center gap-2 bg-primary/10 text-primary px-4 py-1.5 font-label-caps text-[10px] uppercase hover:bg-primary/20 transition-all border border-primary/20 rounded-sm">
          <Download size={14} />
          Export Report
        </button>
        <div className="flex items-center gap-4">
          <button className="text-on-surface-variant hover:text-primary transition-colors">
            <Bell size={18} />
          </button>
          <div className="flex items-center gap-3 border-l border-outline-variant pl-4">
            <div className="w-8 h-8 rounded-full border border-outline-variant bg-surface-container flex items-center justify-center overflow-hidden">
              {profileData?.avatar_url ? (
                <img src={profileData.avatar_url} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-primary/20 text-primary flex items-center justify-center font-title-sm">
                  {profileData?.full_name?.charAt(0) || 'U'}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </motion.header>
  );
};

