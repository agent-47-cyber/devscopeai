const fs = require('fs');
const path = require('path');

const file = path.join('c:', 'Users', 'khand', 'OneDrive', 'Desktop', 'project', 'stitch', 'src', 'components', 'Dashboard.jsx');
let content = fs.readFileSync(file, 'utf8');

// Replace the Candidate Report content
const startMarker = `              {!isGeneratingReport && candidateReport && (`;
const endMarker = `              <div className="analytics-grid" style={{ display: 'grid', gridTemplateColumns: '1.5fr 1.5fr', gap: '24px' }}>`;

const startIndex = content.indexOf(startMarker);
const endIndex = content.indexOf(endMarker);

if (startIndex === -1 || endIndex === -1) {
  console.error("Markers not found");
  process.exit(1);
}

const replacement = `              {!isGeneratingReport && candidateReport && (
                <div className="candidate-report-wrapper animate-fade-in mt-6 mb-8">
                  {/* Document Header */}
                  <div className="border-b border-[#30363D] pb-6 flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-6">
                    <div>
                      <div className="font-mono text-[12px] text-[#8B949E] mb-2 tracking-widest uppercase font-bold">CONFIDENTIAL ID: CID-{Math.floor(Math.random() * 900) + 100}-XT</div>
                      <h1 className="text-4xl font-bold text-[#E9E1DA] mb-2 tracking-tight">Candidate Intelligence Report</h1>
                      <div className="text-lg text-[#E9E1DA] font-medium">{candidateReport.careerPositioning || 'Senior Software Engineer'}</div>
                    </div>
                    <div className="text-right flex flex-col items-end">
                      <div className="text-[#F97316] text-[10px] tracking-widest uppercase font-bold font-mono block mb-1">Generated: {new Date().toISOString().split('T')[0]}</div>
                      <div className="text-5xl font-bold text-[#F97316] mb-1 tracking-tighter">{candidateReport.overallCandidateRating || '88'}<span className="text-[#8B949E] text-2xl">/100</span></div>
                      <div className="text-[#8B949E] text-[10px] tracking-widest uppercase font-bold font-mono">DevScope Match Index</div>
                    </div>
                  </div>

                  {/* Top Stats Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="bg-[#161B22] border border-[#30363D] rounded-lg p-5">
                      <div className="text-[#8B949E] text-[10px] tracking-widest uppercase font-bold font-mono mb-2 flex items-center gap-2"><span className="material-symbols-outlined text-[16px]">history</span> Verified Experience</div>
                      <div className="text-2xl font-bold text-white mb-1">High</div>
                      <div className="text-[#8B949E] text-xs font-mono">Specialized in Core Infrastructure</div>
                    </div>
                    <div className="bg-[#161B22] border border-[#30363D] rounded-lg p-5">
                      <div className="text-[#8B949E] text-[10px] tracking-widest uppercase font-bold font-mono mb-2 flex items-center gap-2"><span className="material-symbols-outlined text-[16px]">campaign</span> Open Source Impact</div>
                      <div className="text-2xl font-bold text-white mb-1">Tier 1</div>
                      <div className="text-[#8B949E] text-xs font-mono">{candidateReport.bestRepository ? \`Core contributor to \${candidateReport.bestRepository.substring(0, 15)}\` : 'Active Contributor'}</div>
                    </div>
                    <div className="bg-[#161B22] border border-[#30363D] rounded-lg p-5">
                      <div className="text-[#8B949E] text-[10px] tracking-widest uppercase font-bold font-mono mb-2">Primary Domain Competency</div>
                      <div className="flex flex-wrap gap-2 mt-3">
                        {(candidateReport.recommendedTechnologies || []).slice(0, 4).map((tech, i) => (
                          <span key={i} className="px-2 py-1 bg-[#1F2630] border border-[#30363D] rounded text-[#E9E1DA] text-xs font-mono">{tech}</span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* 1. Executive Summary */}
                  <section className="bg-[#161B22] border border-[#30363D] rounded-lg p-6 mb-8 relative overflow-hidden">
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#F97316]"></div>
                    <h2 className="text-[#F97316] text-[12px] tracking-widest uppercase font-bold font-mono mb-4 flex items-center gap-2">
                      <span className="material-symbols-outlined text-[18px]">notes</span> Executive Summary
                    </h2>
                    <p className="text-sm text-[#E9E1DA] leading-relaxed">
                      {candidateReport.executiveSummary || 'The candidate presents a highly specialized profile with deep expertise in targeted domains. Behavioral analysis indicates a strong bias toward rigorous engineering practices. Strengths and weaknesses align with expectations for the current role.'}
                    </p>
                  </section>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                    {/* 2. Hiring Risks & Red Flags */}
                    <section className="bg-[#1D1616] border border-[#3D2B2B] rounded-lg p-6 relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-[#EF4444] opacity-5 rounded-full blur-3xl -mr-10 -mt-10"></div>
                      <h2 className="text-[#EF4444] text-[12px] tracking-widest uppercase font-bold font-mono mb-4 flex items-center gap-2">
                        <span className="material-symbols-outlined text-[18px]">gavel</span> Hiring Risks & Audit Flags
                      </h2>
                      <ul className="space-y-4 text-sm text-[#8B949E] relative z-10">
                        {(candidateReport.hiringRisks || []).slice(0,3).map((risk, i) => (
                          <li key={i} className="flex items-start gap-3">
                            <div className="w-1.5 h-1.5 rounded-full bg-[#EF4444] mt-2 shrink-0"></div>
                            <div>
                              <strong className="text-[#E9E1DA] block mb-1">Identified Risk #{i+1}</strong>
                              {risk}
                            </div>
                          </li>
                        ))}
                        {(candidateReport.portfolioGaps || []).slice(0,2).map((gap, i) => (
                          <li key={\`gap-\${i}\`} className="flex items-start gap-3">
                            <div className="w-1.5 h-1.5 rounded-full bg-[#F59E0B] mt-2 shrink-0"></div>
                            <div>
                              <strong className="text-[#E9E1DA] block mb-1">Portfolio Gap</strong>
                              {gap}
                            </div>
                          </li>
                        ))}
                      </ul>
                    </section>

                    {/* 3. Strategic Recommendations */}
                    <section className="bg-[#161B22] border border-[#30363D] rounded-lg p-6">
                      <h2 className="text-[#3B82F6] text-[12px] tracking-widest uppercase font-bold font-mono mb-4 flex items-center gap-2">
                        <span className="material-symbols-outlined text-[18px]">lightbulb</span> Strategic Recommendations
                      </h2>
                      <p className="text-sm text-[#8B949E] mb-4">Based on the intelligence gathered, these are the recommended focus areas for upskilling:</p>
                      <div className="space-y-3">
                        {(candidateReport.finalActionPlan || []).slice(0, 4).map((plan, i) => (
                          <div key={i} className="p-3 bg-[#1F2630] border border-[#30363D] rounded flex items-center gap-4">
                            <div className="w-6 h-6 rounded border border-[#3B82F6] text-[#3B82F6] flex items-center justify-center font-mono text-[10px] shrink-0">0{i+1}</div>
                            <div className="text-sm font-medium text-[#E9E1DA]">{plan}</div>
                          </div>
                        ))}
                      </div>
                    </section>
                  </div>

                  {/* 4. Best Project Spotlight */}
                  {candidateReport.bestRepository && (
                    <section className="border border-[#30363D] rounded-lg overflow-hidden bg-[#161B22] mb-8">
                      <div className="p-4 border-b border-[#30363D] bg-[#1F2630] flex justify-between items-center">
                        <h2 className="text-[#8B949E] text-[12px] tracking-widest uppercase font-bold font-mono">Best Project Spotlight</h2>
                        <span className="text-[#F97316] font-mono text-[10px] px-2 py-1 border border-[#F97316] rounded bg-[#F97316]/10">VERIFIED REPO</span>
                      </div>
                      <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
                        <div className="md:col-span-2 space-y-4">
                          <h3 className="text-2xl font-bold text-white">{candidateReport.bestRepository}</h3>
                          <p className="text-sm text-[#8B949E] leading-relaxed">
                            {candidateReport.recruiterNotes || 'A standout repository demonstrating exceptional understanding of core concepts, architecture, and maintainability.'}
                          </p>
                        </div>
                        <div className="h-32 w-full bg-[#0D1117] border border-[#30363D] rounded flex items-center justify-center p-4 relative overflow-hidden">
                          <div className="absolute inset-0 opacity-20 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#F97316] via-[#0D1117] to-[#0D1117]"></div>
                          <div className="relative w-full h-full flex flex-col justify-between">
                            <div className="h-1 bg-[#30363D] w-3/4 rounded"></div>
                            <div className="h-1 bg-[#30363D] w-1/2 rounded ml-4"></div>
                            <div className="h-1 bg-[#F97316] w-full rounded"></div>
                            <div className="h-1 bg-[#30363D] w-2/3 rounded"></div>
                            <div className="h-1 bg-[#30363D] w-1/4 rounded ml-8"></div>
                          </div>
                        </div>
                      </div>
                    </section>
                  )}
                </div>
              )}
\n`;

content = content.substring(0, startIndex) + replacement + content.substring(endIndex);

// I should also remove the old analytics-grid since it clutters the new Candidate Report layout and is redundant to the new Executive Summary layout.
// Let's remove everything from \`analytics-grid\` up to \`{/* end tab-panels */}\`
const gridStartMarker = \`<div className="analytics-grid"\`;
const endTabsMarker = \`{/* end tab-panels */}\`;
const gridStartIndex = content.indexOf(gridStartMarker);
const endTabsIndex = content.indexOf(endTabsMarker);

if (gridStartIndex !== -1 && endTabsIndex !== -1) {
  content = content.substring(0, gridStartIndex) + "              \n        </div>" + content.substring(endTabsIndex + endTabsMarker.length);
}

fs.writeFileSync(file, content, 'utf8');
console.log("Successfully patched Candidate Intelligence Report.");
