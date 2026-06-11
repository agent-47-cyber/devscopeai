import React from 'react';

export default function CandidateReport({
  candidateReport,
  isGeneratingReport,
  handleGenerateReport,
  resume,
  github,
  linkedin,
  scores
}) {
  const canAnalyze = resume || github || linkedin;

  if (!candidateReport) {
    return (
      <div>
        <div className="mb-10">
          <span className="font-label-caps text-label-caps text-primary bg-primary/10 px-2 py-0.5 border border-primary/20 mb-2 inline-block">MODULE: CND_REPORT_V2</span>
          <h2 className="font-display-lg text-display-lg text-primary tracking-tight">Candidate Intelligence Dossier</h2>
          <p className="text-on-surface-variant mt-2">Generate a recruiter-grade intelligence report aggregating cross-channel evidence.</p>
        </div>
        <div className="bg-surface-container-low border border-outline-variant p-8 rim-light-amber max-w-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <span className="material-symbols-outlined text-[120px]">psychology</span>
          </div>
          {!canAnalyze ? (
            <div className="text-error mb-4 font-body-md">Please connect at least one profile source (Resume, GitHub, or LinkedIn) to synthesize a report.</div>
          ) : (
            <div className="text-secondary mb-4 font-body-md">Candidate data verified across channels. Ready to compile intelligence dossier.</div>
          )}
          <div className="flex gap-4">
            <button
              onClick={handleGenerateReport}
              disabled={isGeneratingReport || !canAnalyze}
              className="bg-primary text-on-primary px-6 py-3 font-label-caps text-label-caps hover:brightness-110 active:opacity-80 transition-all border border-primary/20 disabled:opacity-50 flex items-center gap-2"
            >
              {isGeneratingReport ? (
                <>
                  <span className="material-symbols-outlined animate-spin text-sm">sync</span>
                  COMPILING INTELLIGENCE...
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-sm">auto_awesome</span>
                  GENERATE INTELLIGENCE DOSSIER
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    );
  }

  const handlePrint = () => {
    window.print();
  };

  const {
    executiveSummary = '',
    overallCandidateRating = 0,
    hireProbability = 0,
    recruiterConfidence = 'Moderate',
    topStrengths = [],
    hiringRisks = [],
    portfolioGaps = [],
    recruiterNotes = '',
    skillsVerificationMatrix = [],
    technicalCompetency = {},
    hiringReadinessDetails = {},
    recommendedProjectsDetailed = [],
    actionPlanTimeline = {}
  } = candidateReport;

  // Render a competency meter
  const renderMeter = (label, value) => {
    const safeValue = Math.min(Math.max(value || 0, 0), 100);
    return (
      <div className="mb-4">
        <div className="flex justify-between items-end mb-1">
          <span className="font-label-caps text-[10px] text-on-surface-variant">{label}</span>
          <span className="font-data-sm text-primary">{safeValue}/100</span>
        </div>
        <div className="h-1.5 w-full bg-surface-container-high overflow-hidden rounded-full">
          <div 
            className="h-full bg-primary relative overflow-hidden" 
            style={{ width: `${safeValue}%`, transition: 'width 1s cubic-bezier(0.4, 0, 0.2, 1)' }}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent to-white/30 animate-[shimmer_2s_infinite]"></div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-12 animate-fade-in pb-20">
      
      {/* ── HERO DOSSIER HEADER ── */}
      <section className="bg-surface-container-low border border-outline-variant p-8 relative overflow-hidden rim-light-amber">
        <div className="absolute top-0 right-0 p-8 opacity-5">
          <span className="material-symbols-outlined text-[200px]">admin_panel_settings</span>
        </div>
        
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8 relative z-10">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <span className="font-label-caps text-[10px] px-2 py-1 bg-error/10 text-error border border-error/20 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-error animate-pulse"></span>
                CONFIDENTIAL DOSSIER
              </span>
              <span className="font-label-caps text-[10px] text-on-surface-variant">ID: DS-INT-{Math.floor(Math.random() * 90000) + 10000}</span>
            </div>
            <h2 className="font-display-lg text-display-lg text-on-surface mb-2">Executive Intelligence Report</h2>
            <p className="font-body-md text-on-surface-variant max-w-2xl leading-relaxed">{executiveSummary}</p>
          </div>
          
          <div className="flex gap-6 items-center shrink-0">
            <div className="text-right">
              <p className="font-label-caps text-[10px] text-on-surface-variant mb-1">CANDIDATE INTELLIGENCE SCORE</p>
              <div className="flex items-baseline gap-1 justify-end">
                <span className="font-data-lg text-[48px] text-primary tabular-nums">{scores?.overall || overallCandidateRating}</span>
                <span className="text-on-surface-variant">/100</span>
              </div>
            </div>
            
            <div className="w-px h-16 bg-outline-variant hidden md:block"></div>
            
            <div className="grid grid-cols-2 gap-x-6 gap-y-4">
              <div>
                <p className="font-label-caps text-[9px] text-on-surface-variant mb-0.5">HIRE PROBABILITY</p>
                <p className="font-data-sm text-secondary">{hireProbability}%</p>
              </div>
              <div>
                <p className="font-label-caps text-[9px] text-on-surface-variant mb-0.5">CONFIDENCE</p>
                <p className="font-data-sm text-primary">{recruiterConfidence}</p>
              </div>
              <div>
                <p className="font-label-caps text-[9px] text-on-surface-variant mb-0.5">TARGET ROLE</p>
                <p className="font-label-caps text-xs text-on-surface">{hiringReadinessDetails.targetRole || 'Software Engineer'}</p>
              </div>
              <div>
                <p className="font-label-caps text-[9px] text-on-surface-variant mb-0.5">READINESS</p>
                <p className="font-label-caps text-xs text-on-surface">{hiringReadinessDetails.hiringReadiness || 'Unknown'}</p>
              </div>
              <div className="col-span-2">
                <p className="font-label-caps text-[9px] text-on-surface-variant mb-0.5">ANALYSIS TIMESTAMP</p>
                <p className="font-label-caps text-[10px] text-on-surface-variant">{new Date().toISOString().slice(0, 16).replace('T', ' ')} UTC</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 4 INTELLIGENCE CARDS ── */}
      <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {/* Verified Strengths */}
        <div className="bg-surface-container border border-outline-variant p-5 hover:-translate-y-1 transition-transform rim-light-amber">
          <h3 className="font-label-caps text-[11px] text-secondary mb-4 flex items-center gap-2">
            <span className="material-symbols-outlined text-sm">verified</span> VERIFIED STRENGTHS
          </h3>
          <ul className="space-y-3">
            {topStrengths.length > 0 ? topStrengths.map((item, i) => (
              <li key={i} className="text-sm text-on-surface flex items-start gap-2">
                <span className="w-1 h-1 bg-secondary rounded-full mt-2 shrink-0"></span>
                <span className="leading-tight">{item}</span>
              </li>
            )) : <li className="text-sm text-on-surface-variant">No strengths verified.</li>}
          </ul>
        </div>
        
        {/* Hiring Risks */}
        <div className="bg-surface-container border border-outline-variant p-5 hover:-translate-y-1 transition-transform rim-light-amber">
          <h3 className="font-label-caps text-[11px] text-error mb-4 flex items-center gap-2">
            <span className="material-symbols-outlined text-sm">warning</span> HIRING RISKS
          </h3>
          <ul className="space-y-3">
            {hiringRisks.length > 0 ? hiringRisks.map((item, i) => (
              <li key={i} className="text-sm text-on-surface flex items-start gap-2">
                <span className="w-1 h-1 bg-error rounded-full mt-2 shrink-0"></span>
                <span className="leading-tight">{item}</span>
              </li>
            )) : <li className="text-sm text-on-surface-variant">No critical risks flagged.</li>}
          </ul>
        </div>

        {/* Portfolio Gaps */}
        <div className="bg-surface-container border border-outline-variant p-5 hover:-translate-y-1 transition-transform rim-light-amber">
          <h3 className="font-label-caps text-[11px] text-primary mb-4 flex items-center gap-2">
            <span className="material-symbols-outlined text-sm">folder_off</span> PORTFOLIO GAPS
          </h3>
          <ul className="space-y-3">
            {portfolioGaps.length > 0 ? portfolioGaps.map((item, i) => (
              <li key={i} className="text-sm text-on-surface flex items-start gap-2">
                <span className="w-1 h-1 bg-primary rounded-full mt-2 shrink-0"></span>
                <span className="leading-tight">{item}</span>
              </li>
            )) : <li className="text-sm text-on-surface-variant">No major gaps identified.</li>}
          </ul>
        </div>

        {/* Recruiter Observations */}
        <div className="bg-surface-container border border-outline-variant p-5 hover:-translate-y-1 transition-transform rim-light-amber">
          <h3 className="font-label-caps text-[11px] text-on-surface mb-4 flex items-center gap-2">
            <span className="material-symbols-outlined text-sm">visibility</span> OBSERVATIONS
          </h3>
          <p className="text-sm text-on-surface-variant italic border-l-2 border-outline-variant pl-3 leading-relaxed">
            "{recruiterNotes || "No specific recruiter notes generated for this candidate."}"
          </p>
        </div>
      </section>

      {/* ── METRICS & VERIFICATION MATRIX ── */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Technical Competency Index */}
        <div className="lg:col-span-4 bg-surface-container border border-outline-variant p-6 rim-light-amber">
          <h3 className="font-label-caps text-[12px] text-on-surface mb-6 flex items-center gap-2">
            <span className="material-symbols-outlined text-sm text-primary">donut_large</span>
            Technical Competency Index
          </h3>
          <div className="space-y-1 mt-4">
            {renderMeter('Frontend Engineering', technicalCompetency.frontend)}
            {renderMeter('Backend & APIs', technicalCompetency.backend)}
            {renderMeter('System Design', technicalCompetency.systemDesign)}
            {renderMeter('Cloud & DevOps', technicalCompetency.cloudAndDevops)}
            {renderMeter('AI / Machine Learning', technicalCompetency.aiAndMl)}
            {renderMeter('Databases', technicalCompetency.databases)}
            {renderMeter('Testing & Quality', technicalCompetency.testingAndQuality)}
          </div>
        </div>

        {/* Skills Verification Matrix */}
        <div className="lg:col-span-8 bg-surface-container border border-outline-variant p-0 rim-light-amber">
          <div className="p-5 border-b border-outline-variant">
            <h3 className="font-label-caps text-[12px] text-on-surface flex items-center gap-2">
              <span className="material-symbols-outlined text-sm text-secondary">fact_check</span>
              Cross-Channel Skills Verification Matrix
            </h3>
          </div>
          <table className="w-full text-left border-collapse table-fixed">
            <thead>
              <tr className="bg-surface-container-low border-b border-outline-variant">
                <th className="p-3 font-label-caps text-[10px] text-on-surface-variant w-[28%] align-middle">Core Skill</th>
                <th className="p-3 font-label-caps text-[10px] text-on-surface-variant w-[18%] align-middle">Resume Claim</th>
                <th className="p-3 font-label-caps text-[10px] text-on-surface-variant w-[18%] align-middle">GitHub Proof</th>
                <th className="p-3 font-label-caps text-[10px] text-on-surface-variant w-[18%] align-middle">LinkedIn Signal</th>
                <th className="p-3 font-label-caps text-[10px] text-on-surface-variant w-[18%] text-center align-middle">Status</th>
              </tr>
            </thead>
            <tbody>
              {skillsVerificationMatrix.length > 0 ? skillsVerificationMatrix.map((row, i) => {
                let badgeClass = "bg-surface-container-high text-on-surface-variant border border-outline-variant";
                if (row.verificationStatus === 'Verified') badgeClass = "bg-secondary/10 text-secondary border border-secondary/20";
                else if (row.verificationStatus === 'Partially Verified') badgeClass = "bg-primary/10 text-primary border border-primary/20";
                else if (row.verificationStatus === 'Unverified') badgeClass = "bg-error/10 text-error border border-error/20";

                return (
                  <tr key={i} className="border-b border-outline-variant/50 hover:bg-primary/5 transition-colors group">
                    <td className="p-3 font-title-sm text-on-surface align-middle border-l-2 border-transparent group-hover:border-primary transition-colors">{row.skill}</td>
                    <td className="p-3 text-xs text-on-surface-variant align-middle">{row.resumeEvidence}</td>
                    <td className="p-3 text-xs text-on-surface-variant align-middle">{row.githubEvidence}</td>
                    <td className="p-3 text-xs text-on-surface-variant align-middle">{row.linkedinEvidence}</td>
                    <td className="p-3 text-center align-middle">
                      <span className={`font-label-caps text-[9px] px-2 py-1 flex items-center justify-center text-center ${badgeClass}`}>
                        {row.verificationStatus}
                      </span>
                    </td>
                  </tr>
                );
              }) : (
                <tr>
                  <td colSpan="5" className="p-6 text-center text-sm text-on-surface-variant align-middle">No skills verification data available.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* ── RECOMMENDED PROJECTS & ACTION PLAN ── */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Recommended Projects */}
        <div className="lg:col-span-5 bg-surface-container border border-outline-variant p-6 rim-light-amber">
          <h3 className="font-label-caps text-[12px] text-on-surface mb-6 flex items-center gap-2">
            <span className="material-symbols-outlined text-sm text-primary">architecture</span>
            High-ROI Portfolio Projects
          </h3>
          <div className="space-y-4">
            {recommendedProjectsDetailed.length > 0 ? recommendedProjectsDetailed.map((proj, i) => (
              <div key={i} className="bg-surface-container-low border border-outline-variant p-4 hover:border-primary/50 transition-colors">
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-title-sm text-primary">{proj.name}</h4>
                  <span className="font-label-caps text-[9px] px-2 py-0.5 bg-surface-container-high border border-outline-variant text-on-surface-variant whitespace-nowrap">
                    +{proj.scoreIncrease} PTS
                  </span>
                </div>
                <p className="text-xs text-on-surface-variant mb-3">{proj.whyItMatters}</p>
                <div className="flex gap-3 text-[10px] font-label-caps text-on-surface-variant">
                  <span className="flex items-center gap-1"><span className="material-symbols-outlined text-[12px]">schedule</span> {proj.timeRequired}</span>
                  <span className="flex items-center gap-1"><span className="material-symbols-outlined text-[12px]">fitness_center</span> {proj.difficulty}</span>
                  <span className={`flex items-center gap-1 ${proj.hiringImpact === 'High' ? 'text-secondary' : ''}`}>
                    <span className="material-symbols-outlined text-[12px]">trending_up</span> {proj.hiringImpact} Impact
                  </span>
                </div>
              </div>
            )) : (
              <p className="text-sm text-on-surface-variant">No projects recommended.</p>
            )}
          </div>
        </div>

        {/* Action Plan Impact Matrix */}
        <div className="lg:col-span-7 bg-surface-container border border-outline-variant p-6 rim-light-amber">
          <h3 className="font-label-caps text-[12px] text-on-surface mb-6 flex items-center gap-2">
            <span className="material-symbols-outlined text-sm text-secondary">next_plan</span>
            90-Day Execution Matrix
          </h3>
          
          <div className="space-y-6">
            {/* 30 Days */}
            <div>
              <h4 className="font-label-caps text-[10px] text-on-surface-variant border-b border-outline-variant pb-2 mb-3">30-DAY PLAN (IMMEDIATE)</h4>
              <div className="space-y-2">
                {actionPlanTimeline.plan30Days?.length > 0 ? actionPlanTimeline.plan30Days.map((task, i) => (
                  <div key={i} className="flex justify-between items-center bg-surface-container-low p-3 border border-outline-variant hover:-translate-y-0.5 transition-transform">
                    <span className="text-sm text-on-surface">{task.task}</span>
                    <span className={`font-label-caps text-[9px] px-2 py-1 whitespace-nowrap ${task.impact === 'High Impact' ? 'bg-secondary/10 text-secondary border border-secondary/20' : 'bg-surface-container-highest text-on-surface-variant border border-outline-variant'}`}>
                      {task.impact}
                    </span>
                  </div>
                )) : <div className="text-xs text-on-surface-variant">No immediate tasks.</div>}
              </div>
            </div>

            {/* 60 Days */}
            <div>
              <h4 className="font-label-caps text-[10px] text-on-surface-variant border-b border-outline-variant pb-2 mb-3">60-DAY PLAN (PORTFOLIO)</h4>
              <div className="space-y-2">
                {actionPlanTimeline.plan60Days?.length > 0 ? actionPlanTimeline.plan60Days.map((task, i) => (
                  <div key={i} className="flex justify-between items-center bg-surface-container-low p-3 border border-outline-variant hover:-translate-y-0.5 transition-transform">
                    <span className="text-sm text-on-surface">{task.task}</span>
                    <span className={`font-label-caps text-[9px] px-2 py-1 whitespace-nowrap ${task.impact === 'High Impact' ? 'bg-primary/10 text-primary border border-primary/20' : 'bg-surface-container-highest text-on-surface-variant border border-outline-variant'}`}>
                      {task.impact}
                    </span>
                  </div>
                )) : <div className="text-xs text-on-surface-variant">No tasks.</div>}
              </div>
            </div>

            {/* 90 Days */}
            <div>
              <h4 className="font-label-caps text-[10px] text-on-surface-variant border-b border-outline-variant pb-2 mb-3">90-DAY PLAN (INTERVIEW)</h4>
              <div className="space-y-2">
                {actionPlanTimeline.plan90Days?.length > 0 ? actionPlanTimeline.plan90Days.map((task, i) => (
                  <div key={i} className="flex justify-between items-center bg-surface-container-low p-3 border border-outline-variant hover:-translate-y-0.5 transition-transform">
                    <span className="text-sm text-on-surface">{task.task}</span>
                    <span className={`font-label-caps text-[9px] px-2 py-1 whitespace-nowrap ${task.impact === 'High Impact' ? 'bg-secondary/10 text-secondary border border-secondary/20' : 'bg-surface-container-highest text-on-surface-variant border border-outline-variant'}`}>
                      {task.impact}
                    </span>
                  </div>
                )) : <div className="text-xs text-on-surface-variant">No tasks.</div>}
              </div>
            </div>
          </div>
        </div>

      </section>

      {/* Floating Export Button for bottom */}
      <div className="flex justify-end pt-8 print:hidden">
        <button onClick={handlePrint} className="bg-surface-container border border-outline-variant text-on-surface px-6 py-3 font-label-caps text-xs hover:bg-surface-container-highest transition-colors flex items-center gap-2 shadow-lg">
          <span className="material-symbols-outlined text-sm">download</span> EXPORT INTELLIGENCE DOSSIER
        </button>
      </div>

    </div>
  );
}
