import React, { useState } from 'react';
import ProcessingState from './ProcessingState.jsx';
import { Github, Search, Filter, ArrowUpDown } from 'lucide-react';
import ScoreExplainability from './ScoreExplainability';

export default function GithubReport({
  github,
  isAnalyzingGithub,
  ghInput,
  setGhInput,
  handleLinkGithub,
  analysisStep,
  scores
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState('heuristicScore');
  const [sortOrder, setSortOrder] = useState('desc'); // 'asc' or 'desc'

  if (!github) {
    return (
      <div className="animate-fade-in flex flex-col items-center justify-center min-h-[60vh]">
        <div className="bg-surface-deep border border-outline-variant p-10 rounded-sm max-w-2xl w-full relative overflow-hidden group">
          <div className="absolute inset-0 pointer-events-none opacity-5 bg-[linear-gradient(var(--border-subtle)_1px,transparent_1px),linear-gradient(90deg,var(--border-subtle)_1px,transparent_1px)] bg-[length:40px_40px]" />
          
          <div className="flex flex-col items-center justify-center text-center relative z-10">
            <div className="w-16 h-16 border border-outline-variant bg-surface flex items-center justify-center rounded-sm mb-6 shadow-[0_0_15px_rgba(184, 161, 96,0.1)]">
              <Github size={28} className="text-primary" />
            </div>
            
            <h3 className="font-display text-display-sm font-bold text-on-background tracking-tight mb-3">Initialize GitHub Analyzer</h3>
            <p className="font-body text-body-sm text-text-muted max-w-md mx-auto mb-8 leading-relaxed">
              Audits repository directories, measures README markdown depth, matches code complexity signatures, and calculates documentation completeness rates.
            </p>

            <div className="w-full relative mb-6">
              <input
                type="text"
                placeholder="Enter GitHub username (e.g. torvalds)"
                value={ghInput}
                onChange={(e) => setGhInput(e.target.value)}
                className="w-full bg-surface border border-outline-variant rounded-sm px-4 py-3 font-code text-[13px] text-on-background placeholder:text-text-disabled focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all text-center uppercase tracking-[0.05em]"
              />
            </div>

            {isAnalyzingGithub ? (
              <div className="mt-4 w-full">
                <ProcessingState
                  steps={['Cloning Public Repositories', 'Analyzing Documentation Coverage', 'Parsing Technology Stack', 'Evaluating Structural Complexity']}
                  currentStep={analysisStep}
                  isComplete={false}
                />
              </div>
            ) : (
              <button
                onClick={() => handleLinkGithub(ghInput)}
                className="mt-4 bg-primary hover:bg-primary-hover text-on-primary font-label text-label-sm font-bold tracking-[0.1em] uppercase px-8 py-3 rounded-sm transition-all shadow-[0_0_15px_rgba(184, 161, 96,0.3)] hover:shadow-[0_0_25px_rgba(184, 161, 96,0.5)] disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={!ghInput.trim()}
              >
                Commence Analysis
              </button>
            )}

            <div className="w-full flex items-center gap-4 my-8 opacity-60">
              <div className="flex-1 h-px bg-outline-variant" />
              <span className="font-label text-[10px] font-bold text-text-muted tracking-[0.2em] uppercase">System Capabilities</span>
              <div className="flex-1 h-px bg-outline-variant" />
            </div>

            <div className="grid grid-cols-2 gap-4 w-full">
              <div className="flex items-center gap-3 font-label text-[10px] font-bold text-text-muted uppercase tracking-[0.1em] bg-surface p-3 border border-outline-variant rounded-sm">
                <span className="w-1.5 h-1.5 rounded-sm bg-success"></span> Audit documentation depth
              </div>
              <div className="flex items-center gap-3 font-label text-[10px] font-bold text-text-muted uppercase tracking-[0.1em] bg-surface p-3 border border-outline-variant rounded-sm">
                <span className="w-1.5 h-1.5 rounded-sm bg-primary"></span> Core tech stack extraction
              </div>
              <div className="flex items-center gap-3 font-label text-[10px] font-bold text-text-muted uppercase tracking-[0.1em] bg-surface p-3 border border-outline-variant rounded-sm">
                <span className="w-1.5 h-1.5 rounded-sm bg-warning"></span> Flags missing READMEs
              </div>
              <div className="flex items-center gap-3 font-label text-[10px] font-bold text-text-muted uppercase tracking-[0.1em] bg-surface p-3 border border-outline-variant rounded-sm">
                <span className="w-1.5 h-1.5 rounded-sm bg-info"></span> Code complexity matching
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Repository Explorer filtering & sorting
  const topRepos = github.topRepositories || github.topRepos || [];
  
  const filteredRepos = topRepos.filter(repo => 
    repo.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (repo.language && repo.language.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const sortedRepos = [...filteredRepos].sort((a, b) => {
    let valA = a[sortField];
    let valB = b[sortField];
    
    // Default handles strings vs numbers
    if (typeof valA === 'string') valA = valA.toLowerCase();
    if (typeof valB === 'string') valB = valB.toLowerCase();
    
    if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
    if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
    return 0;
  });

  const handleSort = (field) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  const bestRepoAnalysis = github.bestRepositoryDeepAnalysis;
  const techStack = github.techStackExtraction || {};

  return (
    <div className="github-layout-wrapper animate-fade-in p-2 lg:p-4 space-y-8">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row justify-between items-end gap-6 pb-6 border-b border-outline-variant">
        <div className="space-y-2">
          <span className="font-label-caps text-[10px] text-primary bg-primary/10 px-2 py-0.5 border border-primary/20 mb-2 inline-block uppercase tracking-widest">MODULE: GITHUB_INTELLIGENCE</span>
          <h2 className="font-display-lg text-[24px] text-white tracking-tight">GitHub Portfolio Analysis</h2>
          <p className="font-body-md text-[13px] text-on-surface-variant mt-2 max-w-2xl">
            Deep analysis of candidate's public repositories. Features repository explorer, heuristic scoring, and tech stack extraction.
          </p>
        </div>
        <div className="flex flex-col items-end gap-1">
          <div className="flex items-center gap-4 mb-2">
            <span className="font-label-caps text-[10px] text-on-surface-variant uppercase tracking-widest bg-surface-container px-2 py-1 rounded border border-outline-variant">
              <span className="material-symbols-outlined text-[12px] inline-block align-text-bottom mr-1">analytics</span>
              Source: {github._meta?.source || 'Active ✅'}
            </span>
            <span className="font-label-caps text-label-caps text-on-surface-variant">GENERATED</span>
            <span className="font-body-md text-[14px] font-mono text-primary">
              {github._meta?.timestamp ? new Date(github._meta.timestamp).toLocaleDateString() : new Date().toLocaleDateString()}
            </span>
          </div>
          <button
            onClick={() => handleLinkGithub(github?.username || ghInput, true)}
            disabled={isAnalyzingGithub}
            className="px-4 py-2 border border-primary/30 text-primary hover:bg-primary/10 transition-colors flex items-center gap-2 font-label-caps text-[12px] uppercase disabled:opacity-50"
          >
            <span className={`material-symbols-outlined text-[16px] ${isAnalyzingGithub ? 'animate-spin' : ''}`}>sync</span>
            {isAnalyzingGithub ? 'Analyzing...' : 'Force Refresh'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* Left Column - Main Content */}
        <div className="col-span-12 lg:col-span-8 flex flex-col gap-6">
          
          {/* Best Repository Deep Analysis */}
          {bestRepoAnalysis ? (
            <div className="bg-surface-container-low border border-outline-variant rounded-xl overflow-hidden rim-light-amber relative">
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-tertiary-container"></div>
              <div className="p-6 border-b border-outline-variant/50 flex justify-between items-center bg-[#0a0a0a]">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-tertiary-container">workspace_premium</span>
                  <h3 className="font-label-caps text-label-caps text-white uppercase tracking-widest">Best Repository Analysis</h3>
                </div>
                <span className="text-primary font-mono text-[12px]">{bestRepoAnalysis.repositoryName}</span>
              </div>
              <div className="p-6 space-y-6">
                <div>
                  <h4 className="text-[12px] font-label-caps text-on-surface-variant mb-2">Project Summary</h4>
                  <p className="text-[13px] text-on-surface">{bestRepoAnalysis.projectSummary}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-[12px] font-label-caps text-on-surface-variant mb-2">Architecture</h4>
                    <p className="text-[13px] text-on-surface">{bestRepoAnalysis.architectureReview}</p>
                  </div>
                  <div>
                    <h4 className="text-[12px] font-label-caps text-on-surface-variant mb-2">Scalability</h4>
                    <p className="text-[13px] text-on-surface">{bestRepoAnalysis.scalabilityAssessment}</p>
                  </div>
                </div>
                <div>
                  <h4 className="text-[12px] font-label-caps text-on-surface-variant mb-2">Code Quality</h4>
                  <p className="text-[13px] text-on-surface">{bestRepoAnalysis.codeQualityReview}</p>
                </div>
                <div className="pt-4 border-t border-outline-variant/50 flex justify-between items-center">
                  <div className="text-[12px] text-on-surface-variant uppercase tracking-widest font-label-caps">Recruiter Verdict</div>
                  <div className={`px-3 py-1 rounded font-bold text-[12px] ${bestRepoAnalysis.recruiterVerdict?.toLowerCase().includes('yes') ? 'bg-primary/20 text-primary' : 'bg-error/20 text-error'}`}>
                    WOULD INTERVIEW: {bestRepoAnalysis.recruiterVerdict?.toUpperCase() || 'YES'}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-surface-container-low border border-outline-variant rounded-xl p-6 text-on-surface-variant text-[13px]">
              Deep analysis not available for this portfolio. (No repositories found or AI fallback used).
            </div>
          )}

          {/* Repository Explorer */}
          <div className="bg-surface-container-low border border-outline-variant rounded-xl overflow-hidden rim-light-amber">
            <div className="p-6 border-b border-outline-variant/50 flex flex-col md:flex-row justify-between items-center bg-[#0a0a0a] gap-4">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">source</span>
                <h3 className="font-label-caps text-label-caps text-white uppercase tracking-widest">Repository Explorer ({topRepos.length})</h3>
              </div>
              <div className="flex bg-[#0f0f0f] border border-outline-variant rounded-md overflow-hidden w-full md:w-64">
                <span className="material-symbols-outlined text-on-surface-variant text-[16px] p-2">search</span>
                <input 
                  type="text" 
                  placeholder="Filter repos..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="bg-transparent border-none text-[13px] focus:ring-0 w-full p-2 text-white"
                />
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#0f0f0f] border-b border-outline-variant/50 text-[10px] font-label-caps text-on-surface-variant uppercase tracking-widest">
                    <th className="p-4 cursor-pointer hover:text-primary transition-colors" onClick={() => handleSort('name')}>
                      <div className="flex items-center gap-1">Repository <ArrowUpDown size={12}/></div>
                    </th>
                    <th className="p-4 cursor-pointer hover:text-primary transition-colors" onClick={() => handleSort('language')}>
                      <div className="flex items-center gap-1">Language <ArrowUpDown size={12}/></div>
                    </th>
                    <th className="p-4 cursor-pointer hover:text-primary transition-colors" onClick={() => handleSort('stars')}>
                      <div className="flex items-center gap-1">Stars <ArrowUpDown size={12}/></div>
                    </th>
                    <th className="p-4 cursor-pointer hover:text-primary transition-colors" onClick={() => handleSort('heuristicScore')}>
                      <div className="flex items-center gap-1">Score <ArrowUpDown size={12}/></div>
                    </th>
                    <th className="p-4">Updated</th>
                  </tr>
                </thead>
                <tbody className="text-[13px]">
                  {sortedRepos.map(repo => (
                    <tr key={repo.name} className={`border-b border-outline-variant/30 hover:bg-[#151515] transition-colors ${repo.isBest ? 'bg-tertiary-container/5 border-l-2 border-l-tertiary-container' : ''}`}>
                      <td className="p-4">
                        <a href={repo.url} target="_blank" rel="noreferrer" className="text-white hover:text-primary transition-colors font-mono block">
                          {repo.name}
                        </a>
                        {repo.isBest && <span className="text-[10px] bg-tertiary-container/20 text-tertiary-container px-1 py-0.5 rounded ml-2 font-bold uppercase tracking-widest">BEST</span>}
                      </td>
                      <td className="p-4 text-on-surface-variant">{repo.language || '-'}</td>
                      <td className="p-4 text-on-surface-variant">{repo.stars}</td>
                      <td className="p-4 text-primary font-mono">{repo.heuristicScore || '-'}</td>
                      <td className="p-4 text-on-surface-variant opacity-70">{new Date(repo.updated_at).toLocaleDateString()}</td>
                    </tr>
                  ))}
                  {sortedRepos.length === 0 && (
                    <tr>
                      <td colSpan="5" className="p-8 text-center text-on-surface-variant">No repositories match your search.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Column - Stats & Tech Stack */}
        <div className="col-span-12 lg:col-span-4 flex flex-col gap-6">
          <div className="bg-surface-container-low border border-outline-variant rounded-xl p-8 rim-light-amber flex flex-col items-center justify-center relative overflow-hidden">
             <div className="absolute top-0 left-0 right-0 h-1 bg-primary"></div>
             <span className="font-label-caps text-[10px] text-on-surface-variant uppercase tracking-widest block mb-4">GitHub Intelligence Score</span>
             <div className="relative">
                <svg className="transform -rotate-90 w-32 h-32">
                  <circle cx="64" cy="64" r="56" stroke="var(--color-surface-container-highest)" strokeWidth="8" fill="none" />
                  <circle cx="64" cy="64" r="56" stroke="var(--color-primary)" strokeWidth="8" fill="none" strokeDasharray="351.8" strokeDashoffset={351.8 - (351.8 * (scores.github || github.score || 0)) / 100} className="transition-all duration-1000 ease-out" />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center flex-col">
                  <span className="font-display-lg text-[32px] text-primary">{scores.github || github.score || 0}</span>
                </div>
             </div>
          </div>

          {github.scoreExplainability && (
            <ScoreExplainability explainability={github.scoreExplainability} />
          )}

          <div className="bg-surface-container-low border border-outline-variant rounded-xl overflow-hidden rim-light-amber">
            <div className="p-6 border-b border-outline-variant/50 flex items-center gap-2 bg-[#0a0a0a]">
              <span className="material-symbols-outlined text-primary text-[18px]">dns</span>
              <h3 className="font-label-caps text-label-caps text-white uppercase tracking-widest">Tech Stack Extraction</h3>
            </div>
            <div className="p-6 space-y-4">
              {Object.keys(techStack).length > 0 ? (
                Object.entries(techStack).map(([category, items]) => {
                  if (!items || items.length === 0) return null;
                  return (
                    <div key={category} className="mb-4">
                      <h4 className="text-[10px] font-label-caps text-on-surface-variant uppercase tracking-widest mb-2 border-b border-outline-variant/50 pb-1">{category}</h4>
                      <div className="flex flex-wrap gap-2">
                        {items.map((item, idx) => (
                          <div key={idx} className="bg-[#151515] border border-outline-variant px-2 py-1 flex items-center gap-2 rounded-sm text-[12px] text-on-surface">
                            <span>{item.technology}</span>
                            {item.evidenceCount > 0 && <span className="bg-[#252525] text-primary px-1.5 py-0.5 text-[9px] font-mono rounded">{item.evidenceCount}x</span>}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-[13px] text-on-surface-variant">Tech stack extraction data not available. Re-analyze to generate.</div>
              )}
            </div>
          </div>

          <div className="bg-surface-container-low border border-outline-variant rounded-xl p-6 rim-light-amber">
            <h4 className="text-[10px] font-label-caps text-on-surface-variant uppercase tracking-widest mb-4">Portfolio Risks</h4>
            {github.portfolioRisks && github.portfolioRisks.length > 0 ? (
              <ul className="space-y-3">
                {github.portfolioRisks.map((risk, idx) => (
                  <li key={idx} className="flex gap-2 text-[13px] text-on-surface">
                    <span className="material-symbols-outlined text-error text-[16px]">warning</span>
                    <span>{risk}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="text-[13px] text-on-surface">No major risks identified.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
