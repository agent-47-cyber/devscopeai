'use client';
import React from 'react';
import { motion } from 'framer-motion';
import { ExternalLink, Terminal, BrainCircuit, Github, Linkedin, FileText, CheckCircle } from 'lucide-react';

export const GithubPanel = ({ github, fullWidth }) => {
  if (!github) return null;
  
  return (
    <motion.section 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.3 }}
      className={`col-span-12 ${fullWidth ? '' : 'lg:col-span-4'} bg-surface-container border border-outline-variant p-8 rim-light-amber`}
    >
      <div className="flex items-center gap-2 mb-6">
        <Github className="text-on-surface-variant" size={16} />
        <h3 className="font-label-caps text-label-caps text-on-surface-variant uppercase">GitHub Intelligence</h3>
      </div>
      
      <div className="space-y-4">
        <div className="flex justify-between items-end border-b border-outline-variant pb-2">
          <span className="font-label-caps text-[10px] text-on-surface-variant">PUBLIC REPOSITORIES</span>
          <span className="font-title-sm text-on-surface">{github?.publicRepos || 0}</span>
        </div>
        <div className="flex justify-between items-end border-b border-outline-variant pb-2">
          <span className="font-label-caps text-[10px] text-on-surface-variant">TOTAL STARS</span>
          <span className="font-title-sm text-on-surface">{github?.totalStars || 0}</span>
        </div>
        <div className="flex justify-between items-end border-b border-outline-variant pb-2">
          <span className="font-label-caps text-[10px] text-on-surface-variant">PRIMARY LANGUAGE</span>
          <span className="font-title-sm text-primary">{github?.primaryLanguage || 'Unknown'}</span>
        </div>
        <div className="flex justify-between items-end border-b border-outline-variant pb-2">
          <span className="font-label-caps text-[10px] text-on-surface-variant">DOCUMENTATION SCORE</span>
          <span className="font-title-sm text-on-surface">{github?.docScore || 0}/100</span>
        </div>
      </div>
      
      <div className="mt-6">
        <span className="font-label-caps text-[10px] text-on-surface-variant uppercase block mb-2">Detected Tech Stack</span>
        <div className="flex flex-wrap gap-2">
          {(github?.techDetected ?? []).map((tech, i) => (
            <span key={i} className="bg-primary/5 border border-primary/20 px-2 py-1 font-label-caps text-[9px] text-primary">
              {tech}
            </span>
          ))}
        </div>
      </div>
    </motion.section>
  );
};

export const RoadmapPanel = ({ roadmap, fullWidth }) => {
  if (!roadmap) return null;
  
  return (
    <motion.section 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.4 }}
      className={`col-span-12 ${fullWidth ? '' : 'lg:col-span-8'} bg-surface-container border border-outline-variant p-8 rim-light-amber`}
    >
      <div className="flex items-center gap-2 mb-6">
        <BrainCircuit className="text-primary" size={16} />
        <h3 className="font-label-caps text-label-caps text-on-surface-variant uppercase">Learning Roadmap</h3>
      </div>
      
      <div className="space-y-6">
        {(roadmap?.gap ?? []).map((skill, index) => {
          const url = roadmap?.resources?.[skill] || 'https://developer.mozilla.org';
          return (
            <div key={index} className="flex gap-4 items-start relative">
              <div className="mt-1 w-2 h-2 rounded-full bg-primary ring-4 ring-primary/20 z-10 shrink-0"></div>
              {index !== roadmap.gap.length - 1 && (
                <div className="absolute top-3 left-1 w-px h-[calc(100%+12px)] bg-outline-variant"></div>
              )}
              <div>
                <h4 className="font-title-sm text-on-surface mb-1 uppercase tracking-wide">PENDING: {skill}</h4>
                <p className="font-body-md text-sm text-on-surface-variant mb-2">Recommended skill addition for target role alignment.</p>
                <a 
                  href={url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-[11px] font-label-caps text-primary hover:text-primary-hover transition-colors"
                >
                  <ExternalLink size={12} />
                  VIEW LEARNING PATH
                </a>
              </div>
            </div>
          );
        })}
      </div>
    </motion.section>
  );
};

export const AIRecommendationsPanel = ({ roadmap, fullWidth }) => {
  if (!roadmap || !roadmap.projects || roadmap.projects.length === 0) return null;
  
  return (
    <motion.section 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.5 }}
      className={`col-span-12 bg-surface-container border border-outline-variant p-8 rim-light-amber ${!fullWidth && 'mt-card-gap'}`}
    >
      <div className="flex items-center gap-2 mb-6">
        <Terminal className="text-on-surface-variant" size={16} />
        <h3 className="font-label-caps text-label-caps text-on-surface-variant uppercase">AI Recommendations: Proof of Work Projects</h3>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {(roadmap?.projects ?? []).map((project, idx) => (
          <div key={idx} className="bg-[#050505] border border-outline-variant p-5 hover:border-primary/50 transition-colors group">
            <div className="flex justify-between items-start mb-4">
              <span className="bg-primary/10 text-primary px-2 py-1 font-label-caps text-[9px] uppercase border border-primary/20">
                {project?.role || 'Project'}
              </span>
              <span className={`px-2 py-1 font-label-caps text-[9px] uppercase border ${
                project?.difficulty === 'Advanced' ? 'bg-error/10 text-error border-error/20' : 'bg-warning/10 text-warning border-warning/20'
              }`}>
                {project?.difficulty || 'Intermediate'}
              </span>
            </div>
            <h4 className="font-title-sm text-on-surface mb-2 line-clamp-2">{project?.name || project?.title || 'Recommended Project'}</h4>
            
            <div className="mb-4">
              <span className="font-label-caps text-[9px] text-on-surface-variant uppercase block mb-1">Tech Stack</span>
              <div className="flex flex-wrap gap-1">
                {(project?.stack ?? []).map((tech, i) => (
                  <span key={i} className="text-[10px] text-on-surface-variant bg-surface px-1.5 py-0.5 border border-outline-variant rounded-sm">{tech}</span>
                ))}
              </div>
            </div>
            
            <div className="bg-surface border border-outline-variant p-3 mt-4">
              <span className="font-label-caps text-[9px] text-primary uppercase block mb-1">Learning Objective</span>
              <p className="text-[11px] text-on-surface-variant leading-relaxed">{project?.learning}</p>
            </div>
          </div>
        ))}
      </div>
    </motion.section>
  );
};

