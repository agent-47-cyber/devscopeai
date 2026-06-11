import React, { useState } from 'react';
import ProcessingState from './ProcessingState.jsx';
import ScoreExplainability from './ScoreExplainability.jsx';

export default function ProjectGapReport({
  projectGap,
  isAnalyzing,
  handleRunProjectGap,
  resume,
  github,
  linkedin,
  analysisStep,
  scores
}) {
  const canAnalyze = resume || github || linkedin;

  if (!projectGap) {
    return (
      <div>
        <div className="mb-10">
          <span className="font-label-caps text-label-caps text-primary bg-primary/10 px-2 py-0.5 border border-primary/20 mb-2 inline-block">MODULE: PRJ_GAP_V2</span>
          <h2 className="font-display-lg text-display-lg text-primary tracking-tight">Project Gap & Career Roadmap</h2>
          <p className="text-on-surface-variant mt-2">Analyze your profile to find missing project experience and generate a strategic roadmap.</p>
        </div>
        <div className="bg-surface-container-low border border-outline-variant rounded-xl p-8 rim-light-amber max-w-2xl">
          {!canAnalyze ? (
            <div className="text-error mb-4 font-body-md text-[13px]">Please connect at least one profile source (Resume, GitHub, or LinkedIn) to run the analysis.</div>
          ) : (
            <div className="text-secondary mb-4 font-body-md text-[13px]">Profile data detected. Ready for analysis.</div>
          )}
          {isAnalyzing ? (
            <div className="mt-4">
              <ProcessingState
                steps={['Auditing Existing Projects', 'Mapping Industry Taxonomy', 'Calculating Missing Competencies', 'Synthesizing Strategic Roadmap']}
                currentStep={analysisStep}
                isComplete={false}
              />
            </div>
          ) : (
            <button
              onClick={handleRunProjectGap}
              disabled={!canAnalyze}
              className="btn-primary mt-4"
            >
              RUN GAP ANALYSIS
            </button>
          )}
        </div>
      </div>
    );
  }

  const {
    missingAiProjects = '',
    missingCloudProjects = '',
    missingSaasProjects = '',
    missingTeamProjects = '',
    missingOpenSourceContributions = '',
    missingDevopsExperience = '',
    missingArchitectureExperience = '',
    recommendedProjects = []
  } = projectGap;

  const getStatus = (text) => {
    const t = text.toLowerCase();
    if (t.includes('missing') || t.includes('none') || t.includes('lacks') || t.includes('no evidence')) {
      return t.includes('critical') || t.includes('essential') ? 'CRITICAL GAP' : 'GAP DETECTED';
    }
    return 'VALIDATED';
  };

  const missingCategories = [
    { name: 'AI Integration', status: getStatus(missingAiProjects), desc: missingAiProjects },
    { name: 'Cloud Native', status: getStatus(missingCloudProjects), desc: missingCloudProjects },
    { name: 'SaaS Architecture', status: getStatus(missingSaasProjects), desc: missingSaasProjects },
    { name: 'Team Collaboration', status: getStatus(missingTeamProjects), desc: missingTeamProjects },
    { name: 'Open Source', status: getStatus(missingOpenSourceContributions), desc: missingOpenSourceContributions },
    { name: 'DevOps & CI/CD', status: getStatus(missingDevopsExperience), desc: missingDevopsExperience },
    { name: 'System Design', status: getStatus(missingArchitectureExperience), desc: missingArchitectureExperience }
  ];

  const topProjects = recommendedProjects.map(p => ({
    title: p.name || 'Recommended Project',
    difficulty: p.difficulty || 'Medium',
    effort: p.estimatedTime || p.difficulty || 'Medium',
    description: p.description || '',
    impact: (p.hiringImpact || '').toLowerCase().includes('high') || (p.hiringImpact || '').toLowerCase().includes('critical') ? 90 : 60,
    learningValue: p.estimatedLearningValue || ''
  }));

  const roadmap = recommendedProjects.map((p, i) => ({
    timeline: `Month ${i + 1}`,
    focus: p.hiringImpact || 'Skill Building',
    title: `Ship ${p.name}`,
    description: p.estimatedLearningValue || p.description
  }));

  const matchIndex = scores?.projectGap || 74;
  const matrixInsight = 'The top project is your "Quick Win" priority to establish credibility.';
  const portfolioAssessment = {
    strengthTitle: 'Targeted Assessment',
    description: 'Review the grid below to identify your most critical missing proof points. Building the recommended projects will directly address these gaps.',
    tags: ['Architecture', 'Implementation']
  };

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <section className="flex flex-col md:flex-row md:items-end justify-between border-b border-outline-variant pb-6 gap-4">
        <div>
          <h2 className="font-display-lg text-display-lg text-on-surface">Project Gap & Career Roadmap</h2>
          <div className="flex items-center gap-4 mt-2">
            <span className="font-label-caps text-label-caps text-primary bg-primary/10 px-2 py-1">DOSSIER ID: DS-{Math.floor(Math.random() * 10000)}-A</span>
            <span className="font-label-caps text-label-caps text-on-surface-variant">LAST UPDATED: {new Date().toISOString().slice(0, 16).replace('T', ' ')} UTC</span>
          </div>
        </div>
        <div className="flex gap-4">
          <div className="text-right">
            <p className="font-label-caps text-label-caps text-on-surface-variant">PROJECT READINESS SCORE</p>
            <p className="font-data-lg text-data-lg text-primary">{matchIndex}/100</p>
          </div>
        </div>
      </section>

      {projectGap.scoreExplainability && (
        <ScoreExplainability explainability={projectGap.scoreExplainability} />
      )}

      {/* Portfolio Assessment & Missing Grid */}
      <div className="grid grid-cols-12 gap-card-gap">
        {/* Portfolio Assessment */}
        <div className="col-span-12 lg:col-span-5 bg-surface-container-low border border-outline-variant rounded-xl p-6 space-y-6 rim-light-amber">
          <h3 className="font-label-caps text-label-caps text-on-surface flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-[16px]">analytics</span>
            Portfolio Assessment
          </h3>
          <div className="space-y-4">
            <div className="flex justify-between items-end border-b border-outline-variant/30 pb-2">
              <div>
                <p className="font-label-caps text-[10px] text-on-surface-variant">CURRENT STRENGTHS</p>
                <p className="font-title-sm text-title-sm mt-1">{portfolioAssessment.strengthTitle || 'Technical Implementation'}</p>
              </div>
              <span className="font-label-caps text-[10px] text-secondary tracking-widest uppercase">VALIDATED</span>
            </div>
            <p className="font-body-md text-on-surface-variant text-[13px] leading-relaxed">
              {portfolioAssessment.description || "Strong foundational skills detected in frontend and core backend technologies."}
            </p>
            <div className="flex flex-wrap gap-2">
              {portfolioAssessment.tags?.map((tag, i) => (
                <span key={i} className="px-3 py-1 bg-secondary/5 text-secondary border border-secondary/20 rounded font-label-caps text-[10px] uppercase">
                  {tag}
                </span>
              ))}
            </div>
          </div>
          <div className="relative pt-4">
            <div className="absolute inset-0 flex items-center pointer-events-none">
              <div className="w-full border-t border-dashed border-primary/20"></div>
            </div>
            <div className="relative bg-surface-container border border-outline-variant rounded-lg p-4">
              <p className="font-label-caps text-[10px] text-primary flex items-center gap-2 mb-2">
                <span className="material-symbols-outlined text-[14px]">visibility</span> CRITICAL OBSERVATION
              </p>
              <p className="font-body-md text-[13px] leading-relaxed text-on-surface">{portfolioAssessment.criticalObservation || "Lack of distributed systems evidence is suppressing senior-level offers."}</p>
            </div>
          </div>
        </div>

        {/* Missing Categories Grid */}
        <div className="col-span-12 lg:col-span-7 bg-surface-container-low border border-outline-variant rounded-xl p-6 rim-light-amber">
          <h3 className="font-label-caps text-label-caps text-on-surface flex items-center gap-2 mb-6">
            <span className="material-symbols-outlined text-error text-[16px]">grid_view</span>
            Missing Categories Grid
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {missingCategories.length > 0 ? missingCategories.map((cat, i) => {
              const statusClass =
                cat.status === 'VALIDATED' ? 'border-secondary/20 bg-secondary/5' :
                  cat.status === 'NO EVIDENCE' ? 'border-outline-variant/30 bg-surface-container opacity-80' :
                    cat.status === 'GAP DETECTED' || cat.status === 'CRITICAL GAP' ? 'border-error/20 bg-error/5' :
                      'border-outline-variant/30 opacity-50';

              const iconClass =
                cat.status === 'VALIDATED' ? 'text-secondary' :
                  cat.status === 'NO EVIDENCE' ? 'text-error' :
                    cat.status === 'GAP DETECTED' || cat.status === 'CRITICAL GAP' ? 'text-error' :
                      'text-on-surface-variant';

              const textClass =
                cat.status === 'VALIDATED' ? 'text-secondary' :
                  cat.status === 'NO EVIDENCE' ? 'text-error' :
                    cat.status === 'GAP DETECTED' || cat.status === 'CRITICAL GAP' ? 'text-error' :
                      'text-on-surface-variant';

              const icon =
                cat.status === 'VALIDATED' ? 'check_circle' :
                  cat.status === 'NO EVIDENCE' ? 'cancel' :
                    cat.status === 'GAP DETECTED' || cat.status === 'CRITICAL GAP' ? 'error' :
                      'radio_button_unchecked';

              return (
                <div key={i} className={`border rounded-lg p-4 space-y-3 flex flex-col justify-between ${statusClass}`}>
                  <p className="font-label-caps text-[10px] text-on-surface-variant uppercase">{cat.name}</p>
                  <div className="flex flex-col gap-1">
                    <span className={`material-symbols-outlined text-[20px] ${iconClass}`}>{icon}</span>
                    <p className={`font-label-caps text-[9px] uppercase tracking-wider ${textClass}`}>{cat.status}</p>
                  </div>
                </div>
              );
            }) : (
              <div className="col-span-4 text-on-surface-variant font-body-md text-[13px]">No category data available.</div>
            )}
          </div>
        </div>
      </div>

      {/* Top Recommended Projects */}
      <section className="space-y-6">
        <h3 className="font-label-caps text-label-caps text-on-surface flex items-center gap-2">
          <span className="material-symbols-outlined text-primary text-[16px]">rocket_launch</span>
          Top Recommended Projects
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {topProjects.length > 0 ? topProjects.map((proj, i) => (
            <div key={i} className="bg-surface-container-low border border-outline-variant rounded-xl overflow-hidden group hover:border-primary/50 transition-all flex flex-col">
              <div className="h-40 relative flex-shrink-0">
                <div className="w-full h-full bg-surface-container opacity-60 group-hover:opacity-80 transition-opacity flex items-center justify-center">
                  <span className="material-symbols-outlined text-4xl text-on-surface-variant/50">code_blocks</span>
                </div>
                {i === 0 && (
                  <div className="absolute top-4 left-4">
                    <span className="bg-primary/10 border border-primary/20 text-primary rounded font-label-caps text-[10px] px-3 py-1 uppercase tracking-widest">MOST IMPACTFUL</span>
                  </div>
                )}
              </div>
              <div className="p-6 space-y-4 flex flex-col flex-1">
                <h4 className="font-title-sm text-[15px]">{proj.title}</h4>
                <div className="flex justify-between font-label-caps text-[10px]">
                  <span className="text-on-surface-variant flex gap-1 items-center">DIFFICULTY <span className="text-on-surface uppercase border border-outline-variant rounded px-2 py-0.5">{proj.difficulty}</span></span>
                  <span className="text-on-surface-variant flex gap-1 items-center">EFFORT <span className="text-on-surface uppercase border border-outline-variant rounded px-2 py-0.5">{proj.effort}</span></span>
                </div>
                <p className="font-body-md text-[13px] text-on-surface-variant line-clamp-3 leading-relaxed flex-1">{proj.description}</p>
                <div className="pt-4 border-t border-outline-variant/50 mt-auto">
                  <div className="flex justify-between items-center mb-2">
                    <p className="font-label-caps text-[10px] text-primary">HIRING IMPACT</p>
                    <p className="font-label-caps text-[10px] text-primary flex items-center gap-2">
                      <span className="font-mono text-[9px] px-1.5 py-0.5 bg-primary/10 border border-primary/20 rounded">+{(3 - i) * 5 + 5} points possible</span>
                      {proj.impact || 80}%
                    </p>
                  </div>
                  <div className="w-full bg-surface-container-highest rounded-full h-1 overflow-hidden">
                    <div className="bg-primary h-full rounded-full" style={{ width: `${proj.impact || 80}%` }}></div>
                  </div>
                </div>
              </div>
            </div>
          )) : (
            <div className="col-span-3 text-on-surface-variant font-body-md text-[13px] bg-surface-container-low border border-outline-variant rounded-xl p-6">No project recommendations available.</div>
          )}
        </div>
      </section>

      {/* Roadmap & Matrix Grid */}
      <div className="grid grid-cols-12 gap-6">
        {/* 90-Day Roadmap */}
        <div className="col-span-12 lg:col-span-8 bg-surface-container-low border border-outline-variant rounded-xl p-8 rim-light-amber">
          <h3 className="font-label-caps text-label-caps text-on-surface flex items-center gap-2 mb-8">
            <span className="material-symbols-outlined text-primary text-[16px]">timeline</span>
            90-Day Strategic Roadmap
          </h3>
          <div className="relative">
            <div className="absolute left-[11px] top-4 bottom-4 w-px border-l border-dashed border-primary/20"></div>
            <div className="space-y-12">
              {roadmap.length > 0 ? roadmap.map((phase, i) => (
                <div key={i} className="relative pl-12">
                  <div className={`absolute left-[7px] top-1 w-2.5 h-2.5 rounded-full ring-4 ${i === 0 ? 'bg-primary ring-primary/20' : 'bg-surface-container-highest border border-outline-variant ring-transparent'}`}></div>
                  <div className="space-y-2">
                    <p className={`font-label-caps text-[10px] tracking-widest uppercase ${i === 0 ? 'text-primary' : 'text-on-surface-variant'}`}>
                      PHASE {i + 1}: {phase.timeline} — {phase.focus}
                    </p>
                    <h4 className="font-title-sm text-title-sm">{phase.title}</h4>
                    <p className="font-body-md text-[13px] text-on-surface-variant max-w-2xl leading-relaxed">{phase.description}</p>
                  </div>
                </div>
              )) : (
                <div className="text-on-surface-variant pl-12 font-body-md text-[13px]">No roadmap data available.</div>
              )}
            </div>
          </div>
        </div>

        {/* Impact vs Effort Matrix */}
        <div className="col-span-12 lg:col-span-4 bg-surface-container-low border border-outline-variant rounded-xl p-8 flex flex-col rim-light-amber">
          <h3 className="font-label-caps text-label-caps text-on-surface flex items-center gap-2 mb-8">
            <span className="material-symbols-outlined text-primary text-[16px]">leaderboard</span>
            Impact vs Effort Matrix
          </h3>
          <div className="flex-1 relative flex flex-col border-l border-b border-outline-variant mb-6 ml-6 min-h-[200px]">
            {/* Y-Axis Label */}
            <div className="absolute -left-8 top-1/2 -translate-y-1/2 -rotate-90 font-label-caps text-[10px] text-on-surface-variant uppercase tracking-widest">Impact</div>
            {/* X-Axis Label */}
            <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 font-label-caps text-[10px] text-on-surface-variant uppercase tracking-widest">Effort</div>

            {/* Quadrant Labels */}
            <div className="grid grid-cols-2 grid-rows-2 h-full w-full">
              <div className="border-r border-b border-outline-variant/30 p-2 flex items-start justify-end opacity-40">
                <span className="font-label-caps text-[8px] tracking-widest uppercase text-on-surface-variant">HIGH IMPACT / LOW EFFORT</span>
              </div>
              <div className="border-b border-outline-variant/30 p-2 flex items-start justify-start opacity-40">
                <span className="font-label-caps text-[8px] tracking-widest uppercase text-on-surface-variant">HIGH IMPACT / HIGH EFFORT</span>
              </div>
              <div className="border-r border-outline-variant/30 p-2 flex items-end justify-end opacity-40">
                <span className="font-label-caps text-[8px] tracking-widest uppercase text-on-surface-variant">LOW IMPACT / LOW EFFORT</span>
              </div>
              <div className="p-2 flex items-end justify-start opacity-40">
                <span className="font-label-caps text-[8px] tracking-widest uppercase text-on-surface-variant">LOW IMPACT / HIGH EFFORT</span>
              </div>
            </div>

            {/* Simulated Data Points since we don't have exact coordinates in API response */}
            {topProjects.map((proj, i) => (
              <div key={i} className="absolute group" style={{
                bottom: proj.impact ? `${proj.impact}%` : `${80 - i * 10}%`,
                left: `${(i + 1) * 25}%`
              }}>
                <div className="w-3 h-3 bg-primary rounded-full cursor-help hover:scale-150 transition-all shadow-[0_0_12px_rgba(249,115,22,0.8)]"></div>
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block bg-surface-container border border-outline-variant rounded p-2 w-32 z-10 shadow-xl">
                  <p className="font-label-caps text-[10px] text-primary">{proj.title}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="space-y-4 mt-4">
            <p className="font-body-md text-[13px] text-on-surface-variant leading-relaxed">
              {matrixInsight || `The ${topProjects[0]?.title || 'top project'} is your "Quick Win" priority to establish credibility.`}
            </p>
            <button className="w-full border border-primary/50 text-primary rounded font-label-caps text-[11px] tracking-widest py-3 hover:bg-primary/5 hover:border-primary active:scale-[0.98] transition-all uppercase">
              GENERATE DETECTED TASK LIST
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
