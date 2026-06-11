import React, { useEffect, useRef } from 'react';
import ProcessingState from './ProcessingState.jsx';

export default function RoleMatchReport({
  jobMatch: roleMatch,
  isAnalyzing,
  jobDescription: roleDescription,
  setJobDescription: setroleDescription,
  handleRunJobMatch: handleRunroleMatch,
  analysisStep,
  scores
}) {
  const progressCircleRef = useRef(null);

  const matchScore = scores?.jobMatch || roleMatch?.matchScore || 0;
  // Calculate dash offset for gauge (440 is the circumference)
  const strokeDashoffset = 440 - (440 * matchScore) / 100;

  useEffect(() => {
    if (progressCircleRef.current) {
      // Small timeout to trigger CSS transition
      setTimeout(() => {
        progressCircleRef.current.style.strokeDashoffset = strokeDashoffset;
      }, 100);
    }
  }, [matchScore, strokeDashoffset]);

  if (!roleMatch) {
    return (
      <div>
        <div className="mb-10">
          <h2 className="font-display-lg text-display-lg text-primary tracking-tight">Role Match Intelligence</h2>
          <p className="text-on-surface-variant mt-2">Paste a Job Description to analyze your alignment.</p>
        </div>
        <div className="bg-surface-container border border-outline-variant p-8 rim-light-amber">
          <textarea
            className="w-full h-48 bg-[#050505] border border-outline-variant p-4 text-on-surface font-body-md focus:border-primary focus:ring-0 mb-4"
            placeholder="Paste Job Description here..."
            value={roleDescription}
            onChange={(e) => setroleDescription(e.target.value)}
          />
          {isAnalyzing ? (
            <div className="mt-4">
              <ProcessingState
                steps={['Parsing Job Description Requirements', 'Extracting Core Competencies', 'Matching against Profile Signals', 'Calculating Gap Probabilities']}
                currentStep={analysisStep}
                isComplete={false}
              />
            </div>
          ) : (
            <button
              onClick={handleRunroleMatch}
              disabled={!roleDescription.trim()}
              className="btn-primary mt-4"
            >
              RUN MATCH ANALYSIS
            </button>
          )}
        </div>
      </div>
    );
  }

  const {
    matchingSkills = [],
    missingSkills = [],
    missingTechnologies = [],
    keywordGaps = [],
    hiringRisks = [],
    improvementPlan = [],
    fastestImprovementPath = "",
    recruiterPerspective = ""
  } = roleMatch;

  return (
    <div>
      {/* Page Header */}
      <div className="mb-10 flex justify-between items-end">
        <div>
          <h2 className="font-display-lg text-display-lg text-primary tracking-tight">Role Match Intelligence</h2>
          <div className="flex items-center gap-3 mt-2">
            <span className="font-label-caps text-label-caps text-on-surface-variant">TARGET ROLE:</span>
            <span className="font-title-sm text-title-sm text-on-surface uppercase">{roleMatch?.targetRole || 'Software Engineer'}</span>
            <span className="text-on-surface-variant px-2">|</span>
            <span className="font-label-caps text-label-caps text-on-surface-variant">ORGANIZATION:</span>
            <span className="font-title-sm text-title-sm text-on-surface uppercase">{roleMatch?.organization || 'Unknown'}</span>
          </div>
        </div>
        <div className="text-right">
          <div className="font-label-caps text-label-caps text-on-surface-variant">REPORT ID:</div>
          <div className="font-title-sm text-title-sm text-primary">DS-2024-{Math.floor(Math.random() * 1000)}</div>
        </div>
      </div>

      {/* Dashboard Grid */}
      <div className="grid grid-cols-12 gap-card-gap">

        {/* Match Score Card (4 columns) */}
        <section className="col-span-12 lg:col-span-4 bg-surface-container-low border border-primary/20 rounded-xl p-8 flex flex-col items-center justify-center relative overflow-hidden rim-light-amber">
          <div className="absolute top-0 left-0 w-full h-1 bg-primary/20"></div>
          <h3 className="font-label-caps text-label-caps text-on-surface-variant mb-8 self-start flex items-center gap-2">
            <span className="material-symbols-outlined text-[16px]">radar</span> OVERALL MATCH INDEX
          </h3>
          <div className="gauge-container relative">
            <svg className="gauge-svg w-[160px] h-[160px]" viewBox="0 0 160 160">
              <circle className="gauge-bg" cx="80" cy="80" r="70" strokeWidth="8" stroke="#111" fill="none"></circle>
              <circle
                ref={progressCircleRef}
                className="gauge-progress transition-all duration-1000 ease-out"
                cx="80"
                cy="80"
                r="70"
                strokeWidth="8"
                stroke={matchScore >= 80 ? '#22c55e' : matchScore >= 60 ? '#f97316' : '#ef4444'}
                fill="none"
                style={{ strokeDasharray: 440, strokeDashoffset: 440, strokeLinecap: 'round', transform: 'rotate(-90deg)', transformOrigin: '50% 50%' }} // Initial state
              ></circle>
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="font-data-lg text-[48px] text-primary leading-none tracking-tighter">{matchScore}</span>
              <span className="font-label-caps text-[10px] text-on-surface-variant uppercase mt-1">/ 100</span>
            </div>
          </div>
          <div className="mt-8 text-center">
            <div className={`border px-3 py-1.5 rounded font-label-caps text-[10px] uppercase tracking-wider mb-4 inline-block ${matchScore >= 80 ? 'bg-secondary/10 border-secondary/20 text-secondary' : matchScore >= 60 ? 'bg-primary/10 border-primary/20 text-primary' : 'bg-error/10 border-error/20 text-error'}`}>
              {matchScore >= 80 ? 'HIGH PROBABILITY MATCH' : matchScore >= 60 ? 'MODERATE MATCH' : 'LOW MATCH'}
            </div>
            <p className="font-body-md text-[13px] text-on-surface-variant max-w-[240px] leading-relaxed">
              {roleMatch?.summary || "Candidate exhibits strong technical alignment for the requirements."}
            </p>
          </div>
        </section>

        {/* Skill Gap Analysis (8 columns) */}
        <section className="col-span-12 lg:col-span-8 bg-surface-container border border-outline-variant rounded-xl p-8 rim-light-amber">
          <h3 className="font-label-caps text-label-caps text-on-surface-variant mb-6 flex items-center gap-2">
            <span className="material-symbols-outlined text-[16px]">rule</span> TECHNICAL SKILL GAP ANALYSIS
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 h-full">
            {/* Matching Skills */}
            <div className="bg-secondary/5 border border-secondary/10 rounded-lg p-6">
              <div className="flex items-center gap-2 mb-4">
                <span className="material-symbols-outlined text-secondary text-sm">check_circle</span>
                <h4 className="font-label-caps text-label-caps text-secondary uppercase">Matching Skills</h4>
              </div>
              <div className="flex flex-wrap gap-2">
                {matchingSkills.length > 0 ? matchingSkills.map((skill, i) => (
                  <span key={i} className="bg-secondary/10 border border-secondary/20 rounded px-3 py-1 font-label-caps text-[10px] text-secondary uppercase">
                    {skill}
                  </span>
                )) : (
                  <span className="text-on-surface-variant text-[13px]">No matching skills found.</span>
                )}
              </div>
            </div>

            {/* Missing Skills */}
            <div className="bg-error/5 border border-error/10 rounded-lg p-6">
              <div className="flex items-center gap-2 mb-4">
                <span className="material-symbols-outlined text-error text-sm">warning</span>
                <h4 className="font-label-caps text-label-caps text-error uppercase">Gaps & Missing Skills</h4>
              </div>
              <div className="flex flex-wrap gap-2">
                {missingSkills.length > 0 ? missingSkills.map((skill, i) => (
                  <span key={i} className="bg-error/10 border border-error/20 rounded px-3 py-1 font-label-caps text-[10px] text-error uppercase">
                    {skill}
                  </span>
                )) : (
                  <span className="text-on-surface-variant text-[13px]">No significant gaps detected!</span>
                )}
              </div>

              {roleMatch.verdict && (
                <div className="mt-6 pt-5 border-t border-error/10">
                  <h5 className="font-label-caps text-[10px] text-error uppercase mb-2">Analysis Verdict</h5>
                  <p className="font-body-md text-[13px] text-on-surface-variant leading-relaxed">
                    {roleMatch.verdict}
                  </p>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Hiring Risks & Interview Readiness (6 columns) */}
        <section className="col-span-12 lg:col-span-6 bg-warning/5 border border-warning/20 rounded-xl p-8 rim-light-amber">
          <h3 className="font-label-caps text-label-caps text-warning mb-6 flex items-center gap-2">
            <span className="material-symbols-outlined text-[16px]">warning</span> INTELLIGENCE DOSSIER: HIRING RISKS
          </h3>
          <div className="space-y-4">
            {hiringRisks.length > 0 ? hiringRisks.map((risk, i) => (
              <div key={i} className="flex gap-4 p-4 bg-surface-container-lowest border border-outline-variant rounded-lg">
                <div className={`w-1 shrink-0 rounded-full ${i % 3 === 0 ? 'bg-warning' : i % 3 === 1 ? 'bg-primary' : 'bg-error'}`}></div>
                <div>
                  <div className={`font-label-caps text-[10px] mb-1 uppercase ${i % 3 === 0 ? 'text-warning' : i % 3 === 1 ? 'text-primary' : 'text-error'}`}>
                    RISK FACTOR {i + 1}
                  </div>
                  <p className="font-body-md text-[13px] leading-relaxed text-on-surface">{typeof risk === 'string' ? risk : risk.description || risk.category}</p>
                </div>
              </div>
            )) : (
              <div className="text-on-surface-variant text-[13px]">No significant risks detected in profile.</div>
            )}
          </div>
        </section>

        {/* Fastest Improvement Path (6 columns) */}
        <section className="col-span-12 lg:col-span-6 bg-primary/5 border border-primary/20 rounded-xl p-8 rim-light-amber">
          <div className="flex justify-between items-start mb-6">
            <h3 className="font-label-caps text-label-caps text-primary flex items-center gap-2">
              <span className="material-symbols-outlined text-[16px]">trending_up</span> IMPROVEMENT PLAN
            </h3>
            <span className="bg-primary/20 text-primary px-2 py-0.5 rounded font-label-caps text-[9px] uppercase">PRIORITY ALPHA</span>
          </div>
          <div className="space-y-4">
            {fastestImprovementPath && (
              <div className="p-5 bg-surface-container-lowest border border-primary/30 rounded-lg relative">
                <div className="font-title-sm text-[13px] text-on-surface mb-3 leading-relaxed">1. {fastestImprovementPath}</div>
                <div className="dashed-divider h-px w-full mb-3 opacity-50"></div>
                <div className="flex justify-between items-center">
                  <span className="font-label-caps text-[10px] text-on-surface-variant uppercase">EST. TIME: 7 DAYS</span>
                  <span className="font-label-caps text-[10px] uppercase text-primary">CRITICAL PATH <span className="ml-2 font-mono text-[10px] text-primary px-1.5 py-0.5 bg-primary/10 border border-primary/20 rounded">+15 points possible</span></span>
                </div>
              </div>
            )}
            {improvementPlan.length > 0 ? improvementPlan.map((path, i) => (
              <div key={i} className="p-5 bg-surface-container-lowest border border-outline-variant rounded-lg relative opacity-80">
                <div className="font-title-sm text-[13px] text-on-surface mb-3 leading-relaxed">{fastestImprovementPath ? i + 2 : i + 1}. {path}</div>
                <div className="dashed-divider h-px w-full mb-3 opacity-30"></div>
                <div className="flex justify-between items-center">
                  <span className="font-label-caps text-[10px] text-on-surface-variant uppercase">EST. TIME: 14 DAYS</span>
                  <span className="font-label-caps text-[10px] uppercase text-on-surface-variant">RECOMMENDED <span className="ml-2 font-mono text-[10px] text-primary px-1.5 py-0.5 bg-primary/10 border border-primary/20 rounded">+10 points possible</span></span>
                </div>
              </div>
            )) : (
              !fastestImprovementPath && <div className="text-on-surface-variant text-[13px]">Upload more data to generate improvement paths.</div>
            )}
          </div>
        </section>

        {/* Recruiter Perspective & Technology Gaps (12 columns) */}
        <section className="col-span-12 bg-surface-container border border-outline-variant rounded-xl p-8 rim-light-amber">
          <h3 className="font-label-caps text-label-caps text-on-surface-variant mb-6 uppercase tracking-widest flex items-center gap-2">
            <span className="material-symbols-outlined text-[16px]">visibility</span> Recruiter Perspective & Gaps
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-surface-container-low border border-outline-variant/50 p-6 rounded-lg">
              <h4 className="font-label-caps text-label-caps text-primary mb-4 uppercase flex items-center gap-2">
                Recruiter Assessment
              </h4>
              <p className="text-on-surface-variant leading-relaxed text-[13px]">
                {recruiterPerspective || "No explicit recruiter perspective provided."}
              </p>
            </div>
            <div className="bg-surface-container-low border border-outline-variant/50 p-6 rounded-lg">
              <h4 className="font-label-caps text-label-caps text-tertiary-container mb-4 uppercase flex items-center gap-2">
                Technology & Keyword Gaps
              </h4>
              <div className="flex flex-wrap gap-2 mb-4">
                {missingTechnologies.map((tech, i) => (
                  <span key={`tech-${i}`} className="bg-[#111] border border-outline-variant rounded px-3 py-1 font-label-caps text-[10px] text-tertiary-container uppercase">
                    {tech}
                  </span>
                ))}
              </div>
              <div className="flex flex-wrap gap-2">
                {keywordGaps.map((kw, i) => (
                  <span key={`kw-${i}`} className="bg-[#111] border border-outline-variant rounded px-3 py-1 font-label-caps text-[10px] text-on-surface-variant uppercase">
                    {kw}
                  </span>
                ))}
              </div>
              {missingTechnologies.length === 0 && keywordGaps.length === 0 && (
                <p className="text-[13px] text-on-surface-variant">No specific tech or keyword gaps identified.</p>
              )}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
