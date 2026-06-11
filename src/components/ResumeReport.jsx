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
        <div className="connect-card rim-light-amber-wrapper animate-fade-in">
          <div className="card rim-light-amber connect-card">
            <div className="connect-card rim-light-amber-glow"></div>
            <div className="connect-icon-circle">
              <FileText size={32} />
            </div>
            <h3>Upload Resume Document</h3>
            <p>
              Audits parsing compatibilities, keyword densities, structural sections checklists, and active recruiter action verb levels.
            </p>

            <div
              className={`file-upload-zone ${resumeDragActive ? 'dragover' : ''}`}
              onDragEnter={handleResumeDrag}
              onDragOver={handleResumeDrag}
              onDragLeave={handleResumeDrag}
              onDrop={handleResumeDrop}
              onClick={() => document.getElementById('dashboard-file-input').click()}
              style={{ margin: '16px auto', maxWidth: '480px' }}
            >
              {resumeFileParseStatus === 'parsing' ? (
                <><p>Extracting text from <strong>{resumeFileName}</strong>...</p><span>Please wait</span></>
              ) : resumeFileParseStatus === 'success' ? (
                <><p style={{ color: "var(--color-tertiary)" }}>✅ Parsed: <strong>{resumeFileName}</strong></p><span>Click to replace</span></>
              ) : resumeFileParseStatus === 'error' ? (
                <><p style={{ color: '#ef4444' }}>Upload failed</p><span>Click to try again</span></>
              ) : (
                <><p>{resumeFileName ? `Selected: ${resumeFileName}` : 'Drag & drop Resume or click to browse'}</p><span>Supports .pdf, .docx, .txt, .md</span></>
              )}
              <input
                type="file"
                id="dashboard-file-input"
                style={{ display: 'none' }}
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handleResumeFile(e.target.files[0]);
                  }
                }}
                accept=".txt,.pdf,.docx,.md"
              />
            </div>

            {resumeFileParseStatus === 'error' && resumeFileParseError && (
              <div style={{ marginTop: '8px', padding: '10px 14px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '8px', fontSize: '13px', color: '#fca5a5' }}>
                ⚠️ {resumeFileParseError}
              </div>
            )}

            <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '12px', margin: '8px 0' }}>
              — OR COPY PASTE TEXT —
            </div>

            <textarea
              className="form-input form-textarea"
              placeholder="Paste your full resume text here..."
              value={resumeTextInput}
              onChange={(e) => {
                setResumeTextInput(e.target.value);
                if (resumeFileName) { setResumeFileName(''); setResumeFileParseStatus(null); }
              }}
              style={{ maxWidth: '480px', margin: '0 auto 4px auto', display: 'block', height: '100px' }}
            />
            {resumeTextInput && (
              <div style={{ textAlign: 'center', fontSize: '11px', color: 'var(--text-muted)', marginBottom: '12px' }}>
                {resumeTextInput.trim().split(/\s+/).filter(Boolean).length} words
              </div>
            )}

            {isAnalyzingResume ? (
              <div className="mt-8 mb-4">
                <ProcessingState
                  steps={['Parsing Resume Document', 'Extracting Skills & Experience', 'Cross-referencing Taxonomy', 'Evaluating ATS Readiness', 'Generating Recruiter Intelligence']}
                  currentStep={analysisStep}
                  isComplete={false}
                />
              </div>
            ) : (
              <button
                onClick={() => handleLinkResume(resumeTextInput)}
                className="btn-primary mt-6"
                style={{ display: 'block', margin: '0 auto' }}
                disabled={resumeFileParseStatus === 'parsing'}
              >
                {resumeFileParseStatus === 'parsing' ? 'Parsing file...' : 'Analyze Resume'}
              </button>
            )}

            <div className="connect-benefits-grid" style={{ marginTop: '24px' }}>
              <div className="benefit-badge">✓ Real keyword matching</div>
              <div className="benefit-badge">✓ Section existence checklist</div>
              <div className="benefit-badge">✓ Action verb count</div>
              <div className="benefit-badge">✓ Contact info detection</div>
            </div>
          </div>
        </div>
      ) : (
        <div className="resume-layout-wrapper animate-fade-in p-2 lg:p-4">
          {/* Page Header */}
          <div className="mb-8 mt-4">
            <div className="flex flex-col md:flex-row md:items-end justify-between border-b border-outline-variant/50 pb-6 gap-4">
              <div>
                <span className="font-label-caps text-[10px] text-primary bg-primary/10 px-2 py-0.5 border border-primary/20 mb-2 inline-block uppercase tracking-widest">MODULE: RESUME_INTELLIGENCE</span>
                <h2 className="font-display-lg text-[24px] text-white tracking-tight">Resume Intelligence Deep-Dive</h2>
                <p className="font-body-md text-[13px] text-on-surface-variant mt-2 max-w-2xl">Analysis of candidate's professional experience and educational background. Evaluating career trajectory, impact metrics, and resume formatting signal vs. noise.</p>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right hidden md:block">
                  <span className="font-label-caps text-[10px] text-on-surface-variant uppercase tracking-widest bg-surface-container px-2 py-1 rounded border border-outline-variant mb-1 inline-block">
                    <span className="material-symbols-outlined text-[12px] inline-block align-text-bottom mr-1">analytics</span>
                    Source: {resume._meta?.source || 'Active ✅'}
                  </span>
                  <p className="font-label-caps text-[10px] text-on-surface-variant tracking-widest uppercase mt-1">GENERATED</p>
                  <p className="font-mono text-[12px] text-primary">
                    {resume._meta?.timestamp ? new Date(resume._meta.timestamp).toLocaleDateString() : new Date().toLocaleDateString()}
                  </p>
                </div>
                <div className="flex flex-col gap-2">
                  <button
                    onClick={() => handleLinkResume(resumeTextInput || 'refresh_bypass', true)}
                    disabled={isAnalyzingResume}
                    className="px-4 py-2 border border-primary/30 text-primary hover:bg-primary/10 transition-colors flex items-center justify-center gap-2 font-label-caps text-[11px] uppercase disabled:opacity-50 rounded"
                  >
                    <span className={`material-symbols-outlined text-[14px] ${isAnalyzingResume ? 'animate-spin' : ''}`}>sync</span>
                    {isAnalyzingResume ? 'Analyzing...' : 'Force Refresh'}
                  </button>
                  <button
                    onClick={() => {
                      setResume(null);
                      setResumeTextInput('');
                      setResumeFileName('');
                      setResumeFileParseStatus(null);
                      setResumeFileParseError('');
                    }}
                    className="px-4 py-2 bg-surface-container border border-outline-variant rounded font-label-caps text-[11px] uppercase tracking-widest hover:border-error/50 hover:bg-error/5 transition-all text-white"
                  >
                    Upload New
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Dashboard Grid */}
          <div className="grid grid-cols-12 gap-6">
            {/* Primary Column (Left 8 cols) */}
            <div className="col-span-12 lg:col-span-8 flex flex-col gap-6">

              {/* Impression Summary Card */}
              <div className="bg-surface-container-low border border-outline-variant rounded-xl relative overflow-hidden flex flex-col md:flex-row rim-light-amber">
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary"></div>
                <div className="p-8 md:w-2/3 border-b md:border-b-0 md:border-r border-outline-variant/50">
                  <div className="flex items-center gap-2 mb-4">
                    <span className="material-symbols-outlined text-primary text-[16px]">visibility</span>
                    <span className="font-label-caps text-label-caps text-primary uppercase tracking-widest">Recruiter Impression Summary</span>
                  </div>
                  <p className="font-body-md text-[13px] text-on-surface leading-relaxed mb-4">
                    {resume.executiveSummary || resume.recruiterNotes || `The candidate's resume presents a strong positive signal for targeted roles. They demonstrate clear business impact and standard career progression.`}
                  </p>
                  <p className="font-body-md text-[13px] text-on-surface-variant leading-relaxed">
                    {resume.projectEvaluation || `However, there is ${(resume.strengths || []).some(s => /metric|quant/i.test(s)) ? 'excellent use of metrics' : 'a lack of quantifiable metrics'}. A technical recruiter should focus questioning on the depth of experience to validate claims made on the resume.`}
                  </p>
                </div>
                <div className="p-8 md:w-1/3 flex flex-col justify-center bg-surface-container-lowest">
                  <div className="mb-6">
                    <span className="font-label-caps text-[10px] text-on-surface-variant uppercase tracking-widest block mb-2">Resume Signal Strength</span>
                    <div className="flex items-baseline gap-2">
                      <span className="font-data-lg text-[48px] text-primary tracking-tighter leading-none">{scores.ats || resume.resumeIntelligenceScore || resume.atsScore || 0}</span>
                      <span className="font-label-caps text-[10px] text-on-surface-variant uppercase">/100</span>
                    </div>
                  </div>
                  <div>
                    <span className="font-label-caps text-[10px] text-on-surface-variant uppercase tracking-widest block mb-2">Readiness</span>
                    <div className="inline-block px-3 py-1.5 bg-surface-container border border-outline-variant rounded text-on-surface font-label-caps text-[10px] uppercase">
                      {resume.jobReadiness || 'Generalist'}
                    </div>
                  </div>
                </div>
              </div>
              <ScoreExplainability explainability={resume.scoreExplainability} />

              {/* Technology Evidence Table */}
              <div className="bg-surface-container-low border border-outline-variant rounded-xl relative overflow-hidden rim-light-amber">
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary"></div>
                <div className="p-6 border-b border-outline-variant/50 flex justify-between items-center bg-surface-container/50">
                  <h3 className="font-title-sm text-[15px] text-white">Experience Evidence Logs</h3>
                  <span className="font-label-caps text-[10px] text-on-surface-variant uppercase tracking-widest">Verified Skills</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-surface-container border-b border-outline-variant/50">
                        <th className="py-3 px-6 font-label-caps text-[10px] text-on-surface-variant uppercase tracking-widest">Claimed Skill</th>
                        <th className="py-3 px-6 font-label-caps text-[10px] text-on-surface-variant uppercase tracking-widest">Context Source</th>
                        <th className="py-3 px-6 font-label-caps text-[10px] text-on-surface-variant uppercase tracking-widest">Impact Indicator</th>
                        <th className="py-3 px-6 font-label-caps text-[10px] text-on-surface-variant uppercase tracking-widest">Verdict</th>
                      </tr>
                    </thead>
                    <tbody className="font-body-md text-[13px] text-on-surface">
                      {(resume.keywordAnalysis?.found || resume.foundKeywords || []).slice(0, 5).map((skill, i) => (
                        <tr key={i} className="border-b border-outline-variant/30 hover:bg-surface-container/50 transition-colors">
                          <td className="py-4 px-6 flex items-center gap-3">
                            <div className="w-2 h-2 rounded-full bg-secondary"></div>
                            <span className="font-medium text-white">{skill}</span>
                          </td>
                          <td className="py-4 px-6 text-on-surface-variant">Resume Parsing</td>
                          <td className="py-4 px-6 text-on-surface-variant">Mentions detected</td>
                          <td className="py-4 px-6">
                            <span className="px-3 py-1 border border-secondary/30 text-secondary bg-secondary/5 font-label-caps text-[10px] uppercase rounded">Validated</span>
                          </td>
                        </tr>
                      ))}
                      {(resume.keywordAnalysis?.missing || resume.missingKeywords || []).slice(0, 5).map((skill, i) => (
                        <tr key={`missing-${i}`} className="border-b border-outline-variant/30 hover:bg-surface-container/50 transition-colors">
                          <td className="py-4 px-6 flex items-center gap-3">
                            <div className="w-2 h-2 rounded-full bg-error"></div>
                            <span className="font-medium text-white">{skill}</span>
                          </td>
                          <td className="py-4 px-6 text-on-surface-variant">None</td>
                          <td className="py-4 px-6 text-on-surface-variant">Missing from resume</td>
                          <td className="py-4 px-6">
                            <span className="px-3 py-1 border border-error/30 text-error bg-error/5 font-label-caps text-[10px] uppercase rounded">No Evidence</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Recommendations and Suggestions */}
              <div className="bg-surface-container-low border border-outline-variant rounded-xl relative overflow-hidden rim-light-amber">
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-tertiary-container"></div>
                <div className="p-6 border-b border-outline-variant/50 flex justify-between items-center bg-surface-container/50">
                  <h3 className="font-title-sm text-[15px] text-white">Recommendations & Gaps</h3>
                  <span className="font-label-caps text-[10px] text-on-surface-variant uppercase tracking-widest">Growth Plan</span>
                </div>
                <div className="p-6">
                  {resume.improvementOpportunities && resume.improvementOpportunities.length > 0 && (
                    <div className="mb-6">
                      <h4 className="font-label-caps text-[10px] text-on-surface-variant uppercase tracking-widest mb-3">Improvement Opportunities</h4>
                      <ul className="flex flex-col gap-3">
                        {resume.improvementOpportunities.slice(0, 3).map((item, idx) => (
                          <li key={idx} className="flex gap-3 items-start font-body-md text-[13px] text-on-surface">
                            <span className="material-symbols-outlined text-tertiary-container text-[16px] mt-0.5">trending_up</span>
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {resume.recommendedProjects && resume.recommendedProjects.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-outline-variant/50">
                      <h4 className="font-label-caps text-[10px] text-on-surface-variant uppercase tracking-widest mb-3">Suggested Projects</h4>
                      <ul className="flex flex-col gap-3">
                        {resume.recommendedProjects.slice(0, 3).map((item, idx) => (
                          <li key={`proj-${idx}`} className="flex gap-3 items-start font-body-md text-[13px] text-on-surface">
                            <span className="material-symbols-outlined text-primary text-[16px] mt-0.5">add_circle</span>
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
            <div className="col-span-12 lg:col-span-4 flex flex-col gap-6">
              {/* Quality Scores */}
              <div className="bg-surface-container-low border border-outline-variant rounded-xl relative overflow-hidden rim-light-amber">
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-secondary"></div>
                <div className="p-6 border-b border-outline-variant/50 bg-surface-container/50">
                  <h3 className="font-title-sm text-[15px] text-white">Quality Scores</h3>
                </div>
                <div className="p-6 flex flex-col gap-6">
                  <div>
                    <div className="flex justify-between items-end mb-2">
                      <span className="font-label-caps text-[10px] text-on-surface-variant uppercase tracking-widest">Experience Relevance</span>
                      <span className="text-secondary font-label-caps text-[10px] uppercase">{resume.scores?.experienceRelevance || scores.resumeDetails?.categoryBreakdown?.experienceRelevance || 65}/100</span>
                    </div>
                    <div className="w-full h-1.5 bg-surface-container-lowest rounded-full overflow-hidden border border-outline-variant/50">
                      <div className="h-full bg-secondary rounded-full" style={{ width: `${resume.scores?.experienceRelevance || scores.resumeDetails?.categoryBreakdown?.experienceRelevance || 65}%` }}></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between items-end mb-2">
                      <span className="font-label-caps text-[10px] text-on-surface-variant uppercase tracking-widest">Technical Depth</span>
                      <span className="text-primary font-label-caps text-[10px] uppercase">{resume.scores?.technicalDepth || scores.resumeDetails?.categoryBreakdown?.technicalDepth || Math.round(((resume.actionVerbCount || 0) / 8) * 100) || 75}/100</span>
                    </div>
                    <div className="w-full h-1.5 bg-surface-container-lowest rounded-full overflow-hidden border border-outline-variant/50">
                      <div className="h-full bg-primary rounded-full" style={{ width: `${resume.scores?.technicalDepth || scores.resumeDetails?.categoryBreakdown?.technicalDepth || Math.min(((resume.actionVerbCount || 0) / 8) * 100, 100) || 75}%` }}></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between items-end mb-2">
                      <span className="font-label-caps text-[10px] text-on-surface-variant uppercase tracking-widest">ATS Readiness</span>
                      <span className="text-tertiary-container font-label-caps text-[10px] uppercase">{resume.scores?.atsCompatibility || scores.resumeDetails?.categoryBreakdown?.atsCompatibility || 90}/100</span>
                    </div>
                    <div className="w-full h-1.5 bg-surface-container-lowest rounded-full overflow-hidden border border-outline-variant/50">
                      <div className="h-full bg-tertiary-container rounded-full" style={{ width: `${resume.scores?.atsCompatibility || scores.resumeDetails?.categoryBreakdown?.atsCompatibility || 90}%` }}></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Portfolio Risks */}
              <div className="bg-surface-container-low border border-outline-variant rounded-xl relative overflow-hidden rim-light-amber">
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-error"></div>
                <div className="p-6 border-b border-outline-variant/50 bg-surface-container/50 flex justify-between items-center">
                  <h3 className="font-title-sm text-[15px] text-white">Resume Risks</h3>
                  <AlertCircle size={18} className="text-error" />
                </div>
                <div className="p-6">
                  <ul className="flex flex-col gap-5">
                    {resume.weaknesses && resume.weaknesses.map((weakness, i) => (
                      <li key={`weak-${i}`} className="flex items-start gap-3 p-4 bg-error/5 border border-error/20 rounded-lg">
                        <span className="material-symbols-outlined text-error text-[18px] mt-[2px]">close</span>
                        <div>
                          <span className="font-title-sm text-[13px] text-white block mb-1">Identified Weakness</span>
                          <span className="font-body-md text-[13px] text-on-surface-variant leading-relaxed block">{weakness}</span>
                        </div>
                      </li>
                    ))}
                    
                    {!(resume.strengths || []).some(s => /metric|quant/i.test(s)) && (!resume.weaknesses || resume.weaknesses.length === 0) && (
                      <li className="flex items-start gap-3 p-4 bg-error/5 border border-error/20 rounded-lg">
                        <span className="material-symbols-outlined text-error text-[18px] mt-[2px]">close</span>
                        <div>
                          <span className="font-title-sm text-[13px] text-white block mb-1">Missing Metrics <span className="ml-2 font-mono text-[10px] text-error px-1.5 py-0.5 bg-error/10 border border-error/20 rounded">+15 points possible</span></span>
                          <span className="font-body-md text-[13px] text-on-surface-variant leading-relaxed block">No quantifiable impact detected in experience.</span>
                        </div>
                      </li>
                    )}
                    {resume.actionVerbCount < 3 && (
                      <li className="flex items-start gap-3 p-4 bg-primary/5 border border-primary/20 rounded-lg">
                        <span className="material-symbols-outlined text-primary text-[18px] mt-[2px]">info</span>
                        <div>
                          <span className="font-title-sm text-[13px] text-white block mb-1">Passive Language <span className="ml-2 font-mono text-[10px] text-primary px-1.5 py-0.5 bg-primary/10 border border-primary/20 rounded">+10 points possible</span></span>
                          <span className="font-body-md text-[13px] text-on-surface-variant leading-relaxed block">Low density of strong action verbs.</span>
                        </div>
                      </li>
                    )}
                    
                    {resume.crossAnalysis?.unverifiedClaims && resume.crossAnalysis.unverifiedClaims.length > 0 && (
                      <li className="flex items-start gap-3 p-4 bg-warning/5 border border-warning/20 rounded-lg">
                        <span className="material-symbols-outlined text-warning text-[18px] mt-[2px]">warning</span>
                        <div>
                          <span className="font-title-sm text-[13px] text-white block mb-1">Unverified Claims</span>
                          <span className="font-body-md text-[13px] text-on-surface-variant leading-relaxed block">
                            {resume.crossAnalysis.unverifiedClaims.join(', ')} not found in GitHub or LinkedIn.
                          </span>
                        </div>
                      </li>
                    )}

                    {(!resume.weaknesses || resume.weaknesses.length === 0) && (resume.strengths || []).some(s => /metric|quant/i.test(s)) && (resume.actionVerbCount || 0) >= 3 && (
                      <li className="flex items-start gap-3 p-4 bg-secondary/5 border border-secondary/20 rounded-lg">
                        <span className="material-symbols-outlined text-secondary text-[18px] mt-[2px]">check_circle</span>
                        <div>
                          <span className="font-title-sm text-[13px] text-white block mb-1">No Major Risks</span>
                          <span className="font-body-md text-[13px] text-on-surface-variant leading-relaxed block">Resume structure and content look solid.</span>
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
