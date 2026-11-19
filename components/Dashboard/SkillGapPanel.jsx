'use client';
import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, AlertTriangle } from 'lucide-react';

export const SkillGapPanel = ({ resume, roadmap }) => {
  // Try to use roadmap data first, fallback to resume data, or empty array
  const missingSkills = roadmap?.gap || resume?.roleKeywordsMissing || [];
  const matchingSkills = resume?.roleKeywordsFound || [];
  
  if (missingSkills.length === 0 && matchingSkills.length === 0) return null;

  return (
    <motion.section 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="col-span-12 lg:col-span-8 bg-surface-container border border-outline-variant p-8 rim-light-amber"
    >
      <h3 className="font-label-caps text-label-caps text-on-surface-variant mb-6 uppercase">Technical Skill Gap Analysis</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 h-full">
        {/* Matching Skills */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <CheckCircle className="text-primary" size={16} />
            <h4 className="font-label-caps text-label-caps text-on-surface uppercase">Matching Skills</h4>
          </div>
          <div className="flex flex-wrap gap-2">
            {matchingSkills.length > 0 ? (
              matchingSkills.map((skill, i) => (
                <span key={i} className="bg-[#111] border border-outline-variant px-3 py-1.5 font-label-caps text-[10px] text-on-surface uppercase">
                  {skill}
                </span>
              ))
            ) : (
              <span className="text-sm text-on-surface-variant">No explicit matches detected.</span>
            )}
          </div>
        </div>

        {/* Missing Skills */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="text-error" size={16} />
            <h4 className="font-label-caps text-label-caps text-on-surface uppercase">Gaps & Missing Skills</h4>
          </div>
          <div className="flex flex-wrap gap-2">
            {missingSkills.length > 0 ? (
              missingSkills.map((skill, i) => (
                <span key={i} className="bg-error/5 border border-error/20 px-3 py-1.5 font-label-caps text-[10px] text-error uppercase">
                  {skill}
                </span>
              ))
            ) : (
              <span className="text-sm text-success">No critical gaps identified!</span>
            )}
          </div>
          
          <div className="mt-6 pt-6 border-t border-outline-variant">
            <h5 className="font-label-caps text-[10px] text-on-surface-variant uppercase mb-2">Analysis Verdict:</h5>
            <p className="font-body-md text-sm text-on-surface-variant">
              {missingSkills.length > 3 
                ? "Candidate requires significant upskilling to meet core role requirements. Review Learning Roadmap for priority targets."
                : missingSkills.length > 0
                ? "Candidate meets most requirements. Minor upskilling required in specific frameworks."
                : "Candidate profile perfectly aligns with target role technical requirements."}
            </p>
          </div>
        </div>
      </div>
    </motion.section>
  );
};

