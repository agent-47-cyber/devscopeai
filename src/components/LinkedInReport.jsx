import React, { useEffect, useRef } from 'react';
import ProcessingState from './ProcessingState.jsx';

export default function LinkedInReport({
  linkedin,
  isAnalyzing,
  liInput,
  setLiInput,
  handleLinkLinkedinUrl,
  user,
  analysisStep,
  scores
}) {
  const completenessCircleRef = useRef(null);

  const score = scores?.linkedin || linkedin?.score || 0;
  // Calculate dash offset for gauge (283 is the circumference for r=45)
  const strokeDashoffset = 283 - (283 * score) / 100;

  useEffect(() => {
    if (completenessCircleRef.current) {
      setTimeout(() => {
        completenessCircleRef.current.style.strokeDashoffset = strokeDashoffset;
      }, 100);
    }
  }, [score, strokeDashoffset]);

  if (!linkedin) {
    return (
      <div>
        <div className="mb-10">
          <span className="font-label-caps text-label-caps text-primary bg-primary/10 px-2 py-0.5 border border-primary/20 mb-2 inline-block">MODULE: LI_ANALYZE_V4</span>
          <h2 className="font-display-lg text-display-lg text-primary tracking-tight">LinkedIn Profile Intelligence</h2>
          <p className="text-on-surface-variant mt-2">Enter your LinkedIn URL or Username to analyze your profile.</p>
        </div>
        <div className="bg-surface-container-low border border-outline-variant p-8 rim-light-amber max-w-2xl">
          <input
            className="w-full bg-[#050505] border border-outline-variant p-4 text-on-surface font-body-md focus:border-primary focus:ring-0 mb-4"
            placeholder="e.g. https://linkedin.com/in/username or username"
            value={liInput}
            onChange={(e) => setLiInput(e.target.value)}
          />
          {isAnalyzing ? (
            <div className="mt-4">
              <ProcessingState
                steps={['Cross-referencing GitHub Evidence', 'Cross-referencing Resume Skills', 'Synthesizing Profile Topology', 'Evaluating Market Readiness']}
                currentStep={analysisStep}
                isComplete={false}
              />
            </div>
          ) : (
            <button
              onClick={() => handleLinkLinkedinUrl(liInput)}
              disabled={!liInput.trim()}
              className="btn-primary mt-2"
            >
              RUN LINKEDIN AUDIT
            </button>
          )}
        </div>
      </div>
    );
  }

  const {
    profileHandle = 'Unknown',
    tips = [],
    foundKws = [],
    missingKws = [],
    selfReport = {}
  } = linkedin;

  const displayName = user?.username || profileHandle || 'Candidate';

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <section className="flex flex-col md:flex-row justify-between items-end gap-6 pb-6 border-b border-outline-variant">
        <div className="space-y-2">
          <span className="font-label-caps text-label-caps text-primary bg-primary/10 px-2 py-0.5 border border-primary/20">MODULE: LI_ANALYZE_V4</span>
          <h2 className="font-display-lg text-display-lg tracking-tight">LinkedIn Profile Intelligence</h2>
          <div className="flex items-center gap-4 text-on-surface-variant">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-sm">person</span>
              <span className="font-title-sm text-title-sm">{displayName}</span>
            </div>
            <div className="w-1 h-1 bg-outline-variant rounded-full"></div>
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-sm">link</span>
              <span className="font-label-caps text-[12px] opacity-70">linkedin.com/in/{profileHandle}</span>
            </div>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1">
          <div className="flex items-center gap-4 mb-2">
            <span className="font-label-caps text-label-caps text-on-surface-variant">TIMESTAMP</span>
            <span className="font-body-md text-[14px] font-mono text-primary">{new Date().toISOString().split('T')[0]}</span>
          </div>
          <button
            onClick={() => handleLinkLinkedinUrl(profileHandle || url, linkedin.selfReport, true)}
            disabled={isAnalyzing}
            className="px-4 py-2 border border-primary/30 text-primary hover:bg-primary/10 transition-colors flex items-center gap-2 font-label-caps text-[12px] uppercase disabled:opacity-50"
          >
            <span className="material-symbols-outlined text-[16px]">{isAnalyzing ? 'sync' : 'refresh'}</span>
            {isAnalyzing ? 'Refreshing...' : 'Refresh Analysis'}
          </button>
        </div>
      </section>

      {/* Grid Layout */}
      <div className="grid grid-cols-12 gap-6">

        {/* Executive Summary */}
        <div className="col-span-12 lg:col-span-8 bg-surface-container-low border border-outline-variant p-6 relative overflow-hidden group rim-light-amber">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <span className="material-symbols-outlined text-[120px]">summarize</span>
          </div>
          <h3 className="font-label-caps text-label-caps text-primary mb-4 flex items-center gap-2">
            <span className="w-2 h-2 bg-primary"></span> EXECUTIVE SUMMARY
          </h3>
          <p className="text-on-surface leading-relaxed max-w-2xl">
            {linkedin.summary || "Candidate profile demonstrates professional experience. " +
              (score >= 80 ? "The profile is highly optimized and ready for recruiter visibility." :
                score >= 60 ? "The profile has good foundations but requires optimization to maximize reach." :
                  "Significant gaps detected in profile completeness and keyword optimization.")}
          </p>
          <div className="mt-8 grid grid-cols-3 gap-6">
            <div className="border-l-2 border-primary/20 pl-4">
              <p className="font-label-caps text-[10px] text-on-surface-variant mb-1 uppercase">Brand Authority</p>
              <p className="font-title-sm text-title-sm text-primary">{score >= 80 ? 'TIER 1' : score >= 60 ? 'TIER 2' : 'DEVELOPING'}</p>
            </div>
            <div className="border-l-2 border-primary/20 pl-4">
              <p className="font-label-caps text-[10px] text-on-surface-variant mb-1 uppercase">Recruiter Pull</p>
              <p className="font-title-sm text-title-sm text-primary">{score >= 80 ? 'AGGRESSIVE' : score >= 60 ? 'MODERATE' : 'LOW'}</p>
            </div>
            <div className="border-l-2 border-primary/20 pl-4">
              <p className="font-label-caps text-[10px] text-on-surface-variant mb-1 uppercase">Clarity Score</p>
              <p className="font-title-sm text-title-sm text-primary">{score}/100</p>
            </div>
          </div>
        </div>

        {/* Profile Completeness Gauge */}
        <div className="col-span-12 lg:col-span-4 bg-surface-container-low border border-outline-variant p-6 flex flex-col items-center justify-center text-center rim-light-amber">
          <h3 className="font-label-caps text-label-caps text-on-surface-variant mb-8 w-full text-left uppercase">Profile Completeness</h3>
          <div className="relative w-48 h-48">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
              <circle cx="50" cy="50" fill="none" r="45" stroke="#262626" strokeWidth="4"></circle>
              <circle
                ref={completenessCircleRef}
                className="transition-all duration-1000 ease-out"
                cx="50" cy="50" fill="none" r="45" stroke="#f59e0b"
                strokeDasharray="283"
                strokeDashoffset="283"
                strokeWidth="4"
              ></circle>
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="font-data-lg text-data-lg text-primary">{score}%</span>
              <span className="font-label-caps text-[10px] text-on-surface-variant uppercase">
                {score >= 80 ? 'All-Star' : score >= 60 ? 'Intermediate' : 'Beginner'}
              </span>
            </div>
          </div>
          <p className="mt-6 font-label-sm text-label-sm text-on-surface-variant px-4">
            {missingKws.length > 0 ? (
              <>Missing Keywords: <span className="text-primary">{missingKws.slice(0, 2).join(', ')}</span></>
            ) : "Profile looks complete!"}
          </p>
        </div>

        {/* LinkedIn Audit Grid */}
        <div className="col-span-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Audit Card 1 */}
          <div className="bg-surface-container-low border border-outline-variant p-5 rim-light-amber">
            <div className="flex justify-between items-start mb-4">
              <span className="material-symbols-outlined text-primary">text_fields</span>
              {selfReport.hasHeadlineKeywords ? (
                <span className="bg-secondary/10 text-secondary font-label-caps text-[9px] px-2 py-0.5 rounded-sm">VALIDATED</span>
              ) : (
                <span className="bg-error/10 text-error font-label-caps text-[9px] px-2 py-0.5 rounded-sm uppercase">MISSING</span>
              )}
            </div>
            <h4 className="font-label-caps text-label-caps text-on-surface-variant mb-2">HEADLINE QUALITY</h4>
            <p className="text-on-surface font-title-sm text-title-sm">
              {selfReport.hasHeadlineKeywords ? 'Optimized for Conversion' : 'Needs Optimization'}
            </p>
          </div>

          {/* Audit Card 2 */}
          <div className="bg-surface-container-low border border-outline-variant p-5 rim-light-amber">
            <div className="flex justify-between items-start mb-4">
              <span className="material-symbols-outlined text-primary">visibility</span>
              {foundKws.length > 5 ? (
                <span className="bg-secondary/10 text-secondary font-label-caps text-[9px] px-2 py-0.5 rounded-sm">STRONG</span>
              ) : (
                <span className="bg-primary/10 text-primary font-label-caps text-[9px] px-2 py-0.5 rounded-sm uppercase">SURFACE LEVEL</span>
              )}
            </div>
            <h4 className="font-label-caps text-label-caps text-on-surface-variant mb-2">KEYWORD VISIBILITY</h4>
            <p className="text-on-surface font-title-sm text-title-sm">
              {foundKws.length > 5 ? 'High Density' : 'Low Density'}
            </p>
          </div>

          {/* Audit Card 3 */}
          <div className="bg-surface-container-low border border-outline-variant p-5 rim-light-amber">
            <div className="flex justify-between items-start mb-4">
              <span className="material-symbols-outlined text-primary">history_edu</span>
              {selfReport.hasExperience ? (
                <span className="bg-secondary/10 text-secondary font-label-caps text-[9px] px-2 py-0.5 rounded-sm">VALIDATED</span>
              ) : (
                <span className="bg-error/10 text-error font-label-caps text-[9px] px-2 py-0.5 rounded-sm uppercase">MISSING</span>
              )}
            </div>
            <h4 className="font-label-caps text-label-caps text-on-surface-variant mb-2">EXPERIENCE LOGS</h4>
            <p className="text-on-surface font-title-sm text-title-sm">
              {selfReport.hasExperience ? 'Quantifiable Impacts' : 'Action Required'}
            </p>
          </div>

          {/* Audit Card 4 */}
          <div className="bg-surface-container-low border border-outline-variant p-5 rim-light-amber">
            <div className="flex justify-between items-start mb-4">
              <span className="material-symbols-outlined text-primary">person_search</span>
              {selfReport.has500Connections ? (
                <span className="bg-secondary/10 text-secondary font-label-caps text-[9px] px-2 py-0.5 rounded-sm">VALIDATED</span>
              ) : (
                <span className="bg-error/10 text-error font-label-caps text-[9px] px-2 py-0.5 rounded-sm uppercase">NO EVIDENCE</span>
              )}
            </div>
            <h4 className="font-label-caps text-label-caps text-on-surface-variant mb-2">RECRUITER PING</h4>
            <p className="text-on-surface font-title-sm text-title-sm">
              {selfReport.has500Connections ? 'High Engagement' : 'Hidden Engagement'}
            </p>
          </div>
        </div>

        {/* Cross-Platform Consistency */}
        <div className="col-span-12 lg:col-span-6 bg-surface-container-low border border-outline-variant p-6 rim-light-amber">
          <h3 className="font-label-caps text-label-caps text-primary mb-6 flex items-center gap-2">
            <span className="w-2 h-2 bg-primary"></span> CROSS-PLATFORM CONSISTENCY
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-background border border-outline-variant/30">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 flex items-center justify-center bg-surface-container-low border border-outline-variant">
                  <span className="material-symbols-outlined text-primary text-xl">description</span>
                </div>
                <div>
                  <p className="font-title-sm text-title-sm">LinkedIn vs Resume</p>
                  <p className="text-[11px] text-on-surface-variant uppercase font-label-caps">Work History Sync</p>
                </div>
              </div>
              <span className="bg-secondary/10 text-secondary border border-secondary/20 font-label-caps text-[10px] px-3 py-1 rounded-sm">EVALUATING</span>
            </div>
            <div className="flex items-center justify-between p-4 bg-background border border-outline-variant/30">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 flex items-center justify-center bg-surface-container-low border border-outline-variant">
                  <span className="material-symbols-outlined text-primary text-xl">code</span>
                </div>
                <div>
                  <p className="font-title-sm text-title-sm">LinkedIn vs GitHub</p>
                  <p className="text-[11px] text-on-surface-variant uppercase font-label-caps">Skill Attribution</p>
                </div>
              </div>
              <span className="bg-secondary/10 text-secondary border border-secondary/20 font-label-caps text-[10px] px-3 py-1 rounded-sm">EVALUATING</span>
            </div>
          </div>
        </div>

        {/* Optimization Roadmap */}
        <div className="col-span-12 lg:col-span-6 bg-surface-container-low border border-outline-variant p-6 relative rim-light-amber">
          <h3 className="font-label-caps text-label-caps text-primary mb-6 flex items-center gap-2">
            <span className="w-2 h-2 bg-primary"></span> OPTIMIZATION ROADMAP
          </h3>
          <div className="space-y-6 relative pl-6">
            <div className="absolute left-[7px] top-2 bottom-4 w-[1px] dashed-divider opacity-30 transform -rotate-90 origin-top"></div>

            {tips.length > 0 ? tips.slice(0, 3).map((tip, idx) => (
              <div key={idx} className="relative">
                <div className={`absolute -left-[23px] top-1 w-2.5 h-2.5 rounded-full ring-4 ring-background ${idx === 0 ? 'bg-primary' : 'bg-outline-variant'}`}></div>
                <h4 className={`font-label-caps text-[12px] uppercase mb-1 flex items-center gap-2 ${idx === 0 ? 'text-primary' : 'text-on-surface-variant'}`}>
                  Phase {idx + 1}
                  <span className="font-mono text-[10px] text-primary px-1.5 py-0.5 bg-primary/10 border border-primary/20 rounded">+{(3 - idx) * 5} points possible</span>
                </h4>
                <p className="text-sm text-on-surface">{tip}</p>
              </div>
            )) : (
              <div className="relative">
                <div className="absolute -left-[23px] top-1 w-2.5 h-2.5 bg-outline-variant rounded-full ring-4 ring-background"></div>
                <h4 className="font-label-caps text-[12px] text-on-surface-variant uppercase mb-1">No major issues found</h4>
                <p className="text-sm text-on-surface">Your profile is well optimized.</p>
              </div>
            )}

          </div>
          <button className="w-full mt-8 border border-primary text-primary font-label-caps text-label-caps py-3 hover:bg-primary/10 transition-colors rounded">
            GENERATE ACTION PLAN (PDF)
          </button>
        </div>
      </div>

    </div>
  );
}
