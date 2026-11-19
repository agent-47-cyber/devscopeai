'use client';
import React from 'react';
import { motion } from 'framer-motion';
import { FileText, Linkedin, CheckCircle, AlertCircle } from 'lucide-react';

export const ResumePanel = ({ resume, fullWidth }) => {
  if (!resume) return null;
  
  return (
    <motion.section 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.35 }}
      className={`col-span-12 ${fullWidth ? '' : 'lg:col-span-6'} bg-surface-container border border-outline-variant p-8 rim-light-amber`}
    >
      <div className="flex items-center gap-2 mb-6">
        <FileText className="text-on-surface-variant" size={16} />
        <h3 className="font-label-caps text-label-caps text-on-surface-variant uppercase">Resume Intelligence</h3>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <span className="font-label-caps text-[10px] text-on-surface-variant uppercase block mb-3">ATS Alignment Checklist</span>
          <div className="space-y-3">
            {[
              { label: 'Formatting Valid', passed: resume?.formattingValid !== false },
              { label: 'Keywords Matched', passed: (resume?.roleKeywordsFound?.length ?? 0) > 0 },
              { label: 'Action Verbs Used', passed: resume?.actionVerbsUsed !== false },
              { label: 'Metrics Included', passed: resume?.metricsIncluded !== false },
            ].map((check, i) => (
              <div key={i} className="flex items-center gap-2">
                {check.passed ? (
                  <CheckCircle size={14} className="text-success" />
                ) : (
                  <AlertCircle size={14} className="text-error" />
                )}
                <span className={`text-sm ${check.passed ? 'text-on-surface' : 'text-on-surface-variant'}`}>
                  {check.label}
                </span>
              </div>
            ))}
          </div>
        </div>
        
        <div>
          <span className="font-label-caps text-[10px] text-on-surface-variant uppercase block mb-3">Actionable Feedback</span>
          <div className="bg-[#050505] border border-outline-variant p-4">
            <p className="text-sm text-on-surface-variant leading-relaxed">
              {resume?.feedback || "Your resume structurally meets ATS expectations. Focus on increasing quantifiable metrics in your experience bullet points."}
            </p>
          </div>
        </div>
      </div>
    </motion.section>
  );
};

export const LinkedinPanel = ({ linkedin, fullWidth }) => {
  if (!linkedin) return null;
  
  return (
    <motion.section 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.45 }}
      className={`col-span-12 ${fullWidth ? '' : 'lg:col-span-6'} bg-surface-container border border-outline-variant p-8 rim-light-amber`}
    >
      <div className="flex items-center gap-2 mb-6">
        <Linkedin className="text-on-surface-variant" size={16} />
        <h3 className="font-label-caps text-label-caps text-on-surface-variant uppercase">Professional Presence</h3>
      </div>
      
      <div className="space-y-4">
        <div className="flex justify-between items-end border-b border-outline-variant pb-2">
          <span className="font-label-caps text-[10px] text-on-surface-variant">PROFILE COMPLETENESS</span>
          <span className="font-title-sm text-on-surface">{linkedin?.profileScore || 'N/A'}/100</span>
        </div>
        <div className="flex justify-between items-end border-b border-outline-variant pb-2">
          <span className="font-label-caps text-[10px] text-on-surface-variant">NETWORK STRENGTH</span>
          <span className="font-title-sm text-on-surface">{linkedin?.connections ? `${linkedin.connections}+` : 'Unknown'}</span>
        </div>
      </div>
      
      <div className="mt-6">
        <span className="font-label-caps text-[10px] text-on-surface-variant uppercase block mb-2">Profile Feedback</span>
        <div className="bg-[#050505] border border-outline-variant p-4">
          <p className="text-sm text-on-surface-variant leading-relaxed">
            {linkedin?.feedback || "Strengthen your headline by explicitly stating your target role. Add comprehensive details to your most recent experiences."}
          </p>
        </div>
      </div>
    </motion.section>
  );
};

