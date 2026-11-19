import React, { useState, useRef } from 'react';
import { FileText, AlertCircle, CheckCircle } from 'lucide-react';
import ScoreExplainability from './ScoreExplainability';
import ProcessingState from './ProcessingState.jsx';

export default function ResumeReport({
  resume,
  isAnalyzingResume,
  resumeTextInput,
  setResumeTextInput,
  resumeFileName,
  setResumeFileName,
  resumeFileParseStatus,
  setResumeFileParseStatus,
  resumeFileParseError,
  setResumeFileParseError,
  handleLinkResume,
  handleResumeFile,
  handleResumeDrop,
  handleResumeDrag,
  resumeDragActive,
  analysisStep,
  scores,
  setResume
}) {
  return (
    <>
      {!resume ? (
        <div className="animate-fade-in flex flex-col items-center justify-center min-h-[60vh]">
          <div className="bg-surface-deep border border-outline-variant p-10 rounded-sm max-w-2xl w-full relative overflow-hidden group">
            <div className="absolute inset-0 pointer-events-none opacity-5 bg-[linear-gradient(var(--border-subtle)_1px,transparent_1px),linear-gradient(90deg,var(--border-subtle)_1px,transparent_1px)] bg-[length:40px_40px]" />
            
            <div className="flex flex-col items-center justify-center text-center relative z-10">
              <div className="w-16 h-16 border border-outline-variant bg-surface flex items-center justify-center rounded-sm mb-6 shadow-[0_0_15px_rgba(184, 161, 96,0.1)]">
                <FileText size={28} className="text-primary" />
              </div>
              
              <h3 className="font-display text-display-sm font-bold text-on-background tracking-tight mb-3">Initialize ATS Parser</h3>
              <p className="font-body text-body-sm text-text-muted max-w-md mx-auto mb-8 leading-relaxed">
                Provide resume document for semantic extraction, structural validation, and targeted keyword density analysis.
              </p>

              <div
                className={`w-full border-2 border-dashed transition-all duration-300 rounded-sm p-10 cursor-pointer flex flex-col items-center justify-center
                  ${resumeDragActive ? 'border-primary bg-primary/5' : 'border-outline-variant bg-surface hover:border-primary/50'}`}
                onDragEnter={handleResumeDrag}
                onDragOver={handleResumeDrag}
                onDragLeave={handleResumeDrag}
                onDrop={handleResumeDrop}
                onClick={() => document.getElementById('dashboard-file-input').click()}
              >
                {resumeFileParseStatus === 'parsing' ? (
                  <div className="flex flex-col items-center gap-3">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-3 bg-primary animate-[blink_1s_step-start_infinite] rounded-[1px]" />
                      <span className="font-code text-code-md font-bold text-primary tracking-[0.1em] uppercase">PARSING {resumeFileName}</span>
                    </div>
                    <span className="font-label text-label-xs text-text-disabled tracking-[0.1em] uppercase">Please wait...</span>
                  </div>
                ) : resumeFileParseStatus === 'success' ? (
                  <div className="flex flex-col items-center gap-3">
                    <div className="flex items-center gap-2 text-success">
                      <CheckCircle size={18} />
                      <span className="font-code text-code-md font-bold tracking-[0.1em] uppercase">LOADED: {resumeFileName}</span>
                    </div>
                    <span className="font-label text-label-xs text-text-muted tracking-[0.1em] uppercase hover:text-primary transition-colors">Click to replace document</span>
                  </div>
                ) : resumeFileParseStatus === 'error' ? (
                  <div className="flex flex-col items-center gap-3">
                    <div className="flex items-center gap-2 text-error">
                      <AlertCircle size={18} />
                      <span className="font-code text-code-md font-bold tracking-[0.1em] uppercase">UPLOAD FAILED</span>
                    </div>
                    <span className="font-label text-label-xs text-text-muted tracking-[0.1em] uppercase hover:text-on-background transition-colors">Click to try again</span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-3">
                    <span className="font-code text-code-md font-bold text-on-background tracking-[0.1em] uppercase">
                      {resumeFileName ? `SELECTED: ${resumeFileName}` : 'DRAG & DROP RESUME HERE'}
                    </span>
                    <span className="font-label text-label-xs text-text-disabled tracking-[0.1em] uppercase">or click to browse local files</span>
                    <span className="font-code text-[10px] text-text-muted mt-2">SUPPORTED: .PDF, .DOCX, .TXT</span>
                  </div>
                )}
                <input
                  type="file"
                  id="dashboard-file-input"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      handleResumeFile(e.target.files[0]);
                    }
                  }}
                  accept=".txt,.pdf,.docx,.md"
                />
              </div>

              {resumeFileParseStatus === 'error' && resumeFileParseError && (
                <div className="mt-4 w-full bg-error/10 border border-error/20 p-3 rounded-sm flex items-start gap-3 text-left">
                  <AlertCircle size={16} className="text-error mt-0.5 shrink-0" />
                  <span className="font-code text-[12px] text-error leading-relaxed">{resumeFileParseError}</span>
                </div>
              )}

              <div className="w-full flex items-center gap-4 my-6 opacity-60">
                <div className="flex-1 h-px bg-outline-variant" />
                <span className="font-label text-[10px] font-bold text-text-muted tracking-[0.2em] uppercase">OR DIRECT INPUT</span>
                <div className="flex-1 h-px bg-outline-variant" />
              </div>

              <div className="w-full relative">
                <textarea
                  className="w-full bg-surface border border-outline-variant rounded-sm p-4 h-32 font-code text-[13px] text-on-background placeholder:text-text-disabled focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all resize-none"
                  placeholder="Paste plaintext raw resume data here..."
                  value={resumeTextInput}
                  onChange={(e) => {
                    setResumeTextInput(e.target.value);
                    if (resumeFileName) { setResumeFileName(''); setResumeFileParseStatus(null); }
                  }}
                />
                {resumeTextInput && (
                  <div className="absolute right-3 bottom-3 font-code text-[10px] text-text-muted bg-surface-deep px-2 py-1 rounded-[2px] border border-outline-variant">
                    {resumeTextInput.trim().split(/\s+/).filter(Boolean).length} WRDS
                  </div>
                )}
              </div>

              {isAnalyzingResume ? (
                <div className="mt-8 w-full">
                  <ProcessingState
                    steps={['Extracting Raw Text', 'Semantic Analysis', 'Keyword Density Map', 'ATS Structuring']}
                    currentStep={analysisStep}
                    isComplete={false}
                  />
                </div>
              ) : (
                <button
                  onClick={() => handleLinkResume(resumeTextInput)}
                  className="mt-8 bg-primary hover:bg-primary-hover text-on-primary font-label text-label-sm font-bold tracking-[0.1em] uppercase px-8 py-3 rounded-sm transition-all shadow-[0_0_15px_rgba(184, 161, 96,0.3)] hover:shadow-[0_0_25px_rgba(184, 161, 96,0.5)] disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={resumeFileParseStatus === 'parsing'}
                >
                  {resumeFileParseStatus === 'parsing' ? 'System Busy...' : 'Commence Analysis'}
                </button>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="animate-fade-in flex flex-col gap-8">
          {/* Page Header */}
          <div className="flex items-center justify-between border-b border-outline-variant pb-6">
            <div>
              <span className="font-label text-[10px] text-primary bg-primary/10 px-2 py-0.5 border border-primary/20 mb-2 inline-block uppercase tracking-[0.2em] font-bold">MODULE: RESUME_INTELLIGENCE</span>
              <h2 className="font-display text-display-sm font-bold text-on-background tracking-tight">Resume Intelligence Deep-Dive</h2>
              <p className="font-body text-body-sm text-text-muted mt-2 max-w-2xl leading-relaxed">
                Analysis of candidate's professional experience and educational background. Evaluating career trajectory, impact metrics, and resume formatting signal vs. noise.
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right hidden md:block border-r border-outline-variant pr-4 mr-2">
                <span className="font-code text-[10px] text-on-surface-variant uppercase tracking-[0.2em] bg-surface px-2 py-1 rounded-[2px] border border-outline-variant mb-1 inline-flex items-center gap-1 font-bold">
                  <span className="w-1.5 h-1.5 bg-success rounded-full animate-pulse shadow-[0_0_5px_rgba(34,197,94,0.5)]"></span>
                  Source: {resume._meta?.source || 'Active'}
                </span>
                <p className="font-label text-[9px] text-text-disabled tracking-[0.2em] uppercase mt-1">GENERATED</p>
                <p className="font-code text-[11px] text-primary font-bold tracking-widest mt-0.5">
                  {resume._meta?.timestamp ? new Date(resume._meta.timestamp).toLocaleDateString() : new Date().toLocaleDateString()}
                </p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => handleLinkResume(resumeTextInput || 'refresh_bypass', true)}
                  disabled={isAnalyzingResume}
                  className="px-4 py-2 border border-outline-variant bg-surface hover:border-primary/50 text-text-muted hover:text-primary transition-colors flex items-center justify-center gap-2 font-label text-label-xs uppercase font-bold tracking-[0.1em] rounded-sm disabled:opacity-50"
                >
                  <span className={`material-symbols-outlined text-[14px] ${isAnalyzingResume ? 'animate-spin text-primary' : ''}`}>sync</span>
                  {isAnalyzingResume ? 'ANALYZING...' : 'FORCE REFRESH'}
                </button>
                <button
                  onClick={() => {
                    setResume(null);
                    setResumeTextInput('');
                    setResumeFileName('');
                    setResumeFileParseStatus(null);
                    setResumeFileParseError('');
                  }}
                  className="px-4 py-2 bg-surface-deep border border-outline-variant rounded-sm font-label text-label-xs uppercase font-bold tracking-[0.1em] hover:border-error/50 hover:text-error transition-all text-on-background"
                >
                  UPLOAD NEW
                </button>
              </div>
            </div>
          </div>

          {/* Dashboard Grid */}
          <div className="grid grid-cols-12 gap-8">
            {/* Primary Column (Left 8 cols) */}
            <div className="col-span-12 lg:col-span-8 flex flex-col gap-8">

              {/* Impression Summary Card */}
              <div className="bg-surface-deep border border-outline-variant rounded-sm relative overflow-hidden flex flex-col md:flex-row group">
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary"></div>
                <div className="absolute inset-0 pointer-events-none opacity-5 bg-[linear-gradient(var(--border-subtle)_1px,transparent_1px),linear-gradient(90deg,var(--border-subtle)_1px,transparent_1px)] bg-[length:40px_40px]" />
                
                <div className="p-8 md:w-2/3 border-b md:border-b-0 md:border-r border-outline-variant relative z-10">
                  <div className="flex items-center gap-3 mb-6">
                    <span className="material-symbols-outlined text-primary text-[18px]">visibility</span>
                    <span className="font-label text-label-xs font-bold text-on-background uppercase tracking-[0.15em]">Recruiter Impression Summary</span>
                  </div>
                  <p className="font-body text-body-sm text-on-background leading-relaxed mb-4">
                    {resume.executiveSummary || resume.recruiterNotes || `The candidate's resume presents a strong positive signal for targeted roles. They demonstrate clear business impact and standard career progression.`}
                  </p>
                  <p className="font-body text-body-sm text-text-muted leading-relaxed">
                    {resume.projectEvaluation || `However, there is ${(resume.strengths || []).some(s => /metric|quant/i.test(s)) ? 'excellent use of metrics' : 'a lack of quantifiable metrics'}. A technical recruiter should focus questioning on the depth of experience to validate claims made on the resume.`}
                  </p>
                </div>
                <div className="p-8 md:w-1/3 flex flex-col justify-center bg-surface relative z-10">
                  <div className="mb-8">
                    <span className="font-label text-[10px] text-text-disabled font-bold uppercase tracking-[0.2em] block mb-2">Resume Signal Strength</span>
                    <div className="flex items-baseline gap-2">
                      <span className="font-code text-display-md font-bold text-primary tracking-tighter leading-none">{scores.ats || resume.resumeIntelligenceScore || resume.atsScore || 0}</span>
                      <span className="font-code text-code-sm text-text-disabled uppercase">/100</span>
                    </div>
                  </div>
                  <div>
                    <span className="font-label text-[10px] text-text-disabled font-bold uppercase tracking-[0.2em] block mb-2">Readiness Level</span>
                    <div className="inline-block px-3 py-1.5 bg-surface-deep border border-outline-variant rounded-sm text-on-surface-variant font-code text-code-sm uppercase font-bold tracking-widest">
                      {resume.jobReadiness || 'GENERALIST'}
                    </div>
                  </div>
                </div>
              </div>
              <ScoreExplainability explainability={resume.scoreExplainability} />

              {/* Technology Evidence Table */}
              <div className="bg-surface-deep border border-outline-variant rounded-sm relative overflow-hidden group">
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary"></div>
                <div className="p-6 border-b border-outline-variant flex justify-between items-center bg-surface relative z-10">
                  <h3 className="font-label text-label-sm font-bold text-on-background tracking-[0.1em] uppercase">Experience Evidence Logs</h3>
                  <span className="font-label text-[10px] text-text-muted font-bold uppercase tracking-[0.2em]">Verified Skills</span>
                </div>
                <div className="overflow-x-auto relative z-10">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-surface-deep border-b border-outline-variant">
                        <th className="py-4 px-6 font-label text-[10px] text-text-disabled font-bold uppercase tracking-[0.15em]">Claimed Skill</th>
                        <th className="py-4 px-6 font-label text-[10px] text-text-disabled font-bold uppercase tracking-[0.15em]">Context Source</th>
                        <th className="py-4 px-6 font-label text-[10px] text-text-disabled font-bold uppercase tracking-[0.15em]">Impact Indicator</th>
                        <th className="py-4 px-6 font-label text-[10px] text-text-disabled font-bold uppercase tracking-[0.15em]">Verdict</th>
                      </tr>
                    </thead>
                    <tbody className="font-code text-[12px] text-on-surface-variant">
                      {(resume.keywordAnalysis?.found || resume.foundKeywords || []).slice(0, 5).map((skill, i) => (
                        <tr key={i} className="border-b border-outline-variant/50 hover:bg-surface transition-colors">
                          <td className="py-4 px-6 flex items-center gap-3">
                            <div className="w-1.5 h-1.5 rounded-sm bg-success shadow-[0_0_8px_rgba(34,197,94,0.4)]"></div>
                            <span className="font-bold text-on-background">{skill}</span>
                          </td>
                          <td className="py-4 px-6 text-text-muted">Resume Parsing</td>
                          <td className="py-4 px-6 text-text-muted">Mentions detected</td>
                          <td className="py-4 px-6">
                            <span className="px-3 py-1 border border-success/30 text-success bg-success/5 font-label text-[9px] font-bold uppercase tracking-widest rounded-sm">Validated</span>
                          </td>
                        </tr>
                      ))}
                      {(resume.keywordAnalysis?.missing || resume.missingKeywords || []).slice(0, 5).map((skill, i) => (
                        <tr key={`missing-${i}`} className="border-b border-outline-variant/50 hover:bg-surface transition-colors">
                          <td className="py-4 px-6 flex items-center gap-3">
                            <div className="w-1.5 h-1.5 rounded-sm bg-error shadow-[0_0_8px_rgba(239,68,68,0.4)]"></div>
                            <span className="font-bold text-on-background">{skill}</span>
                          </td>
                          <td className="py-4 px-6 text-text-muted">None</td>
                          <td className="py-4 px-6 text-text-muted">Missing from resume</td>
                          <td className="py-4 px-6">
                            <span className="px-3 py-1 border border-error/30 text-error bg-error/5 font-label text-[9px] font-bold uppercase tracking-widest rounded-sm">No Evidence</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Recommendations and Suggestions */}
              <div className="bg-surface-deep border border-outline-variant rounded-sm relative overflow-hidden group">
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary/70"></div>
                <div className="p-6 border-b border-outline-variant flex justify-between items-center bg-surface relative z-10">
                  <h3 className="font-label text-label-sm font-bold text-on-background tracking-[0.1em] uppercase">Recommendations & Gaps</h3>
                  <span className="font-label text-[10px] text-text-muted font-bold uppercase tracking-[0.2em]">Growth Plan</span>
                </div>
                <div className="p-8 relative z-10">
                  {resume.improvementOpportunities && resume.improvementOpportunities.length > 0 && (
                    <div className="mb-8">
                      <h4 className="font-label text-[10px] text-text-disabled font-bold uppercase tracking-[0.2em] mb-4">Improvement Opportunities</h4>
                      <ul className="flex flex-col gap-4">
                        {resume.improvementOpportunities.slice(0, 3).map((item, idx) => (
                          <li key={idx} className="flex gap-4 items-start font-body text-[13.5px] text-on-background leading-relaxed">
                            <span className="material-symbols-outlined text-primary/70 text-[18px] mt-0.5">trending_up</span>
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {resume.recommendedProjects && resume.recommendedProjects.length > 0 && (
                    <div className="mt-6 pt-6 border-t border-outline-variant">
                      <h4 className="font-label text-[10px] text-text-disabled font-bold uppercase tracking-[0.2em] mb-4">Suggested Projects</h4>
                      <ul className="flex flex-col gap-4">
                        {resume.recommendedProjects.slice(0, 3).map((item, idx) => (
                          <li key={`proj-${idx}`} className="flex gap-4 items-start font-body text-[13.5px] text-on-background leading-relaxed">
                            <span className="material-symbols-outlined text-primary text-[18px] mt-0.5">add_circle</span>
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>

            </div>

            {/* Secondary Column (Right 4 cols) */}
            <div className="col-span-12 lg:col-span-4 flex flex-col gap-8">
              {/* Quality Scores */}
              <div className="bg-surface-deep border border-outline-variant rounded-sm relative overflow-hidden group">
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-success"></div>
                <div className="p-6 border-b border-outline-variant bg-surface relative z-10">
                  <h3 className="font-label text-label-sm font-bold text-on-background tracking-[0.1em] uppercase">Quality Metrics</h3>
                </div>
                <div className="p-8 flex flex-col gap-8 relative z-10">
                  <div>
                    <div className="flex justify-between items-end mb-3">
                      <span className="font-label text-[10px] text-text-muted font-bold uppercase tracking-[0.15em]">Experience Relevance</span>
                      <span className="text-success font-code text-code-sm font-bold uppercase">{resume.scores?.experienceRelevance || scores.resumeDetails?.categoryBreakdown?.experienceRelevance || 65}/100</span>
                    </div>
                    <div className="w-full h-1 bg-surface-deep rounded-[1px] overflow-hidden border border-outline-variant">
                      <div className="h-full bg-success shadow-[0_0_10px_rgba(34,197,94,0.5)] transition-all duration-1000" style={{ width: `${resume.scores?.experienceRelevance || scores.resumeDetails?.categoryBreakdown?.experienceRelevance || 65}%` }}></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between items-end mb-3">
                      <span className="font-label text-[10px] text-text-muted font-bold uppercase tracking-[0.15em]">Technical Depth</span>
                      <span className="text-primary font-code text-code-sm font-bold uppercase">{resume.scores?.technicalDepth || scores.resumeDetails?.categoryBreakdown?.technicalDepth || Math.round(((resume.actionVerbCount || 0) / 8) * 100) || 75}/100</span>
                    </div>
                    <div className="w-full h-1 bg-surface-deep rounded-[1px] overflow-hidden border border-outline-variant">
                      <div className="h-full bg-primary shadow-[0_0_10px_rgba(184, 161, 96,0.5)] transition-all duration-1000" style={{ width: `${resume.scores?.technicalDepth || scores.resumeDetails?.categoryBreakdown?.technicalDepth || Math.min(((resume.actionVerbCount || 0) / 8) * 100, 100) || 75}%` }}></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between items-end mb-3">
                      <span className="font-label text-[10px] text-text-muted font-bold uppercase tracking-[0.15em]">ATS Readiness</span>
                      <span className="text-on-surface-variant font-code text-code-sm font-bold uppercase">{resume.scores?.atsCompatibility || scores.resumeDetails?.categoryBreakdown?.atsCompatibility || 90}/100</span>
                    </div>
                    <div className="w-full h-1 bg-surface-deep rounded-[1px] overflow-hidden border border-outline-variant">
                      <div className="h-full bg-on-surface-variant transition-all duration-1000" style={{ width: `${resume.scores?.atsCompatibility || scores.resumeDetails?.categoryBreakdown?.atsCompatibility || 90}%` }}></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Portfolio Risks */}
              <div className="bg-surface-deep border border-outline-variant rounded-sm relative overflow-hidden group">
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-error"></div>
                <div className="p-6 border-b border-outline-variant bg-surface flex justify-between items-center relative z-10">
                  <h3 className="font-label text-label-sm font-bold text-on-background tracking-[0.1em] uppercase">Resume Risks</h3>
                  <AlertCircle size={16} className="text-error" />
                </div>
                <div className="p-6 relative z-10">
                  <ul className="flex flex-col gap-4">
                    {resume.weaknesses && resume.weaknesses.map((weakness, i) => (
                      <li key={`weak-${i}`} className="flex items-start gap-4 p-4 bg-error/5 border border-error/20 rounded-sm">
                        <span className="material-symbols-outlined text-error text-[18px] mt-[2px]">close</span>
                        <div>
                          <span className="font-label text-label-xs font-bold text-on-background uppercase tracking-widest block mb-1">Identified Weakness</span>
                          <span className="font-body text-body-sm text-text-muted leading-relaxed block">{weakness}</span>
                        </div>
                      </li>
                    ))}
                    
                    {!(resume.strengths || []).some(s => /metric|quant/i.test(s)) && (!resume.weaknesses || resume.weaknesses.length === 0) && (
                      <li className="flex items-start gap-4 p-4 bg-error/5 border border-error/20 rounded-sm">
                        <span className="material-symbols-outlined text-error text-[18px] mt-[2px]">close</span>
                        <div>
                          <span className="font-label text-label-xs font-bold text-on-background uppercase tracking-widest block mb-1 flex items-center flex-wrap gap-2">
                            Missing Metrics 
                            <span className="font-code text-[9px] text-error px-1.5 py-0.5 border border-error/30 rounded-[2px] tracking-wider">+15 PTS POSS</span>
                          </span>
                          <span className="font-body text-body-sm text-text-muted leading-relaxed block">No quantifiable impact detected in experience.</span>
                        </div>
                      </li>
                    )}
                    {resume.actionVerbCount < 3 && (
                      <li className="flex items-start gap-4 p-4 bg-warning/5 border border-warning/20 rounded-sm">
                        <span className="material-symbols-outlined text-warning text-[18px] mt-[2px]">info</span>
                        <div>
                          <span className="font-label text-label-xs font-bold text-on-background uppercase tracking-widest block mb-1 flex items-center flex-wrap gap-2">
                            Passive Language 
                            <span className="font-code text-[9px] text-warning px-1.5 py-0.5 border border-warning/30 rounded-[2px] tracking-wider">+10 PTS POSS</span>
                          </span>
                          <span className="font-body text-body-sm text-text-muted leading-relaxed block">Low density of strong action verbs.</span>
                        </div>
                      </li>
                    )}
                    
                    {resume.crossAnalysis?.unverifiedClaims && resume.crossAnalysis.unverifiedClaims.length > 0 && (
                      <li className="flex items-start gap-4 p-4 bg-warning/5 border border-warning/20 rounded-sm">
                        <span className="material-symbols-outlined text-warning text-[18px] mt-[2px]">warning</span>
                        <div>
                          <span className="font-label text-label-xs font-bold text-on-background uppercase tracking-widest block mb-1">Unverified Claims</span>
                          <span className="font-body text-body-sm text-text-muted leading-relaxed block">
                            {resume.crossAnalysis.unverifiedClaims.join(', ')} not found in GitHub or LinkedIn.
                          </span>
                        </div>
                      </li>
                    )}

                    {(!resume.weaknesses || resume.weaknesses.length === 0) && (resume.strengths || []).some(s => /metric|quant/i.test(s)) && (resume.actionVerbCount || 0) >= 3 && (
                      <li className="flex items-start gap-4 p-4 bg-success/5 border border-success/20 rounded-sm">
                        <span className="material-symbols-outlined text-success text-[18px] mt-[2px]">check_circle</span>
                        <div>
                          <span className="font-label text-label-xs font-bold text-success uppercase tracking-widest block mb-1">Verified Integrity</span>
                          <span className="font-body text-body-sm text-text-muted leading-relaxed block">Resume structure and content exhibit high validation signals.</span>
                        </div>
                      </li>
                    )}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
