'use client';
import React from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';

export const DashboardShell = ({ 
  children, 
  activeTab, 
  setActiveTab, 
  onSignOut,
  profileData
}) => {
  return (
    <div className="min-h-screen bg-background text-on-surface font-body overflow-x-hidden selection:bg-primary/30 selection:text-primary">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} onSignOut={onSignOut} />
      <Header profileData={profileData} />
      
      {/* Main Content Area */}
      <main className="ml-[240px] pt-16 min-h-screen relative">
        <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))] opacity-5 pointer-events-none"></div>
        
        <div className="p-gutter max-w-7xl mx-auto relative z-10 pb-20">
          {children}
        </div>
      </main>
    </div>
  );
};

