'use client';
import React from 'react';
import { motion } from 'framer-motion';
import { ExecutiveKPI } from './ExecutiveKPI';
import { GithubPanel, RoadmapPanel, AIRecommendationsPanel } from './IntelligencePanels';
import { ResumePanel, LinkedinPanel } from './ProfilePanels';

export const DashboardContent = ({ 
  activeTab, 
  scores, 
  github, 
  resume, 
  linkedin, 
  roadmap, 
  selectedRole, 
  profileData 
}) => {
  const renderContent = () => {
    switch (activeTab) {
      case 'resume':
        return (
          <div className="space-y-card-gap">
            <h2 className="font-display-lg text-[40px] md:text-display-lg text-primary tracking-tight">RESUME ANALYZER</h2>
            <div className="grid grid-cols-12 gap-card-gap">
              <ResumePanel resume={resume} fullWidth />
            </div>
          </div>
        );
      case 'github':
        return (
          <div className="space-y-card-gap">
            <h2 className="font-display-lg text-[40px] md:text-display-lg text-primary tracking-tight">GITHUB ANALYZER</h2>
            <div className="grid grid-cols-12 gap-card-gap">
              <GithubPanel github={github} fullWidth />
            </div>
          </div>
        );
      case 'linkedin':
        return (
          <div className="space-y-card-gap">
            <h2 className="font-display-lg text-[40px] md:text-display-lg text-primary tracking-tight">LINKEDIN ANALYZER</h2>
            <div className="grid grid-cols-12 gap-card-gap">
              <LinkedinPanel linkedin={linkedin} fullWidth />
            </div>
          </div>
        );
      case 'ideas':
        return (
          <div className="space-y-card-gap">
            <h2 className="font-display-lg text-[40px] md:text-display-lg text-primary tracking-tight">PROJECT IDEAS</h2>
            <div className="grid grid-cols-12 gap-card-gap">
              <AIRecommendationsPanel roadmap={roadmap} fullWidth />
            </div>
          </div>
        );
      case 'overview':
      default:
        return (
          <div className="space-y-card-gap">
            <div className="mb-10 flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
              <div>
                <h2 className="font-display-lg text-[40px] md:text-display-lg text-primary tracking-tight">Intelligence Dashboard</h2>
                <div className="flex flex-wrap items-center gap-3 mt-2">
                  <span className="font-label-caps text-[10px] md:text-label-caps text-on-surface-variant uppercase">TARGET ROLE:</span>
                  <span className="font-title-sm text-title-sm text-on-surface uppercase">{selectedRole || 'ENGINEER'}</span>
                  <span className="text-on-surface-variant px-2 hidden md:inline">|</span>
                  <span className="font-label-caps text-[10px] md:text-label-caps text-on-surface-variant uppercase mt-2 md:mt-0">CANDIDATE:</span>
                  <span className="font-title-sm text-title-sm text-on-surface uppercase">{profileData?.full_name || 'Anonymous'}</span>
                </div>
              </div>
              <div className="text-left md:text-right">
                <div className="font-label-caps text-[10px] text-on-surface-variant uppercase">REPORT ID:</div>
                <div className="font-title-sm text-title-sm text-primary uppercase">
                  DS-{new Date().getFullYear()}-{profileData?.id?.substring(0, 4).toUpperCase() || 'X992'}
                </div>
              </div>
            </div>

            <ExecutiveKPI scores={scores} />
            
            <div className="grid grid-cols-12 gap-card-gap">
              <GithubPanel github={github} />
              <ResumePanel resume={resume} />
              <LinkedinPanel linkedin={linkedin} />
            </div>
            
            <AIRecommendationsPanel roadmap={roadmap} />
          </div>
        );
    }
  };

  return (
    <motion.div
      key={activeTab}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      {renderContent()}
    </motion.div>
  );
};

