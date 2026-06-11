
import React from 'react';

export default function LandingPage({ onGetStarted, scores, onLoginClick, user, onLogout }) {
  // Let's wire up the buttons
  return (
    <div className="dark text-on-surface bg-surface min-h-screen">
      
{/**/}
{/**/}
<header className="bg-[#050505] text-vivid-amber font-label-caps text-label-caps docked full-width top-0 sticky z-40 border-b border-subtle flex justify-between items-center h-14 px-gutter relative z-50">
<div className="flex items-center gap-4">
<span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>analytics</span>
<div className="font-headline-md text-headline-md font-bold text-vivid-amber tracking-tight">
                DevScope AI
            </div>
</div>
<div className="flex items-center gap-6">
<nav className="hidden md:flex gap-6 text-muted uppercase font-label-caps text-label-caps">
<a className="hover:text-vivid-amber transition-colors" href="#" onClick={(e) => { e.preventDefault(); onGetStarted(); }}>Product</a>
<a className="hover:text-vivid-amber transition-colors" href="#" onClick={(e) => { e.preventDefault(); onGetStarted(); }}>Methodology</a>
<a className="hover:text-vivid-amber transition-colors" href="#" onClick={(e) => { e.preventDefault(); onGetStarted(); }}>Pricing</a>
</nav>

          {user ? (
            <div className="flex items-center gap-4">
              <span className="text-sm">Welcome, {user.username}</span>
              <button onClick={onLogout} className="btn-secondary px-4 py-2 rounded text-label-caps font-label-caps uppercase">Log Out</button>
            </div>
          ) : (
            <button onClick={onLoginClick} className="btn-secondary px-4 py-2 rounded text-label-caps font-label-caps uppercase">
                Log In
            </button>
          )}

</div>
</header>
{/**/}
<main className="relative z-10 container mx-auto px-gutter pt-24 pb-32 max-w-container-max flex flex-col items-center justify-center min-h-[921px]">
{/**/}
<div className="text-center max-w-3xl mb-16 flex flex-col items-center">
<div className="inline-flex items-center gap-2 px-3 py-1 bg-surface-elevated border border-subtle rounded-full text-label-caps font-label-caps text-vivid-amber mb-8 uppercase">
<span className="w-1.5 h-1.5 bg-vivid-amber rounded-full"></span>
                v2.0 Intelligence Engine Live
            </div>
<h1 className="font-display text-display text-white mb-6 leading-tight">
                Your Resume Says One Thing.<br/>
<span className="text-secondary">Your GitHub Says Another.</span>
</h1>
<p className="font-body-md text-body-md md:text-body-lg text-muted max-w-2xl mb-10">
                Understand how recruiters evaluate your skills, projects, and professional presence across Resume, GitHub, LinkedIn, and target job descriptions.
            </p>
<div className="flex flex-col sm:flex-row gap-4">
<button onClick={onGetStarted} className="btn-primary px-6 py-3 rounded-lg text-label-caps font-label-caps uppercase tracking-wider">
                    Analyze My Profile
                </button>
<button onClick={onGetStarted} className="btn-secondary px-6 py-3 rounded-lg text-label-caps font-label-caps uppercase tracking-wider flex items-center gap-2 justify-center">
<span className="material-symbols-outlined text-[16px]">visibility</span>
                    View Sample Report
                </button>
</div>
</div>
{/**/}
<div className="w-full max-w-5xl bg-surface-deep border border-subtle rounded-xl shadow-2xl overflow-hidden flex flex-col mt-8">
{/**/}
<div className="h-10 border-b border-subtle bg-surface-dim flex items-center px-4 justify-between">
<div className="flex gap-2">
<div className="w-2.5 h-2.5 rounded-full bg-[#1A1A1A]"></div>
<div className="w-2.5 h-2.5 rounded-full bg-[#1A1A1A]"></div>
<div className="w-2.5 h-2.5 rounded-full bg-[#1A1A1A]"></div>
</div>
<div className="font-label-caps text-label-caps text-muted flex items-center gap-2 uppercase">
<span className="material-symbols-outlined text-[14px]">lock</span>
                    report_id: cnd_8x9f2a_v2
                </div>
<div className="w-12"></div> {/**/}
</div>
{/**/}
<div className="flex h-[500px]">
{/**/}
<div className="w-48 border-r border-subtle bg-surface-deep p-4 flex flex-col gap-4 hidden md:flex">
<div className="text-label-caps font-label-caps text-muted mb-2 uppercase tracking-wider">Modules</div>
<div className="flex items-center gap-3 text-vivid-amber font-label-caps text-label-caps bg-surface-dim py-1.5 px-2 rounded lg border border-subtle uppercase tracking-widest">
<span className="material-symbols-outlined text-[16px]">dashboard</span>
                        Overview
                    </div>
<div className="flex items-center gap-3 text-muted font-label-caps text-label-caps hover:text-white py-1.5 px-2 cursor-pointer uppercase tracking-widest">
<span className="material-symbols-outlined text-[16px]">description</span>
                        Resume
                    </div>
<div className="flex items-center gap-3 text-muted font-label-caps text-label-caps hover:text-white py-1.5 px-2 cursor-pointer uppercase tracking-widest">
<span className="material-symbols-outlined text-[16px]">terminal</span>
                        GitHub
                    </div>
<div className="flex items-center gap-3 text-muted font-label-caps text-label-caps hover:text-white py-1.5 px-2 cursor-pointer uppercase tracking-widest">
<span className="material-symbols-outlined text-[16px]">person_search</span>
                        LinkedIn
                    </div>
<div className="mt-auto border-t border-subtle pt-4">
<div className="flex items-center gap-3 text-muted font-label-caps text-label-caps uppercase tracking-widest">
<span className="material-symbols-outlined text-[16px]">rule</span>
                            Job Match: 84%
                        </div>
</div>
</div>
{/**/}
<div className="flex-1 p-6 bg-[#050505] overflow-hidden flex flex-col gap-6">
{/**/}
<div className="flex justify-between items-start">
<div>
<h2 className="font-headline-lg text-headline-lg text-white mb-1 font-bold">Alex Chen</h2>
<div className="font-label-caps text-label-caps text-muted uppercase tracking-widest">Senior Full Stack Engineer</div>
</div>
<div className="text-right">
<div className="inline-block bg-surface-dim border border-subtle px-3 py-1 rounded-lg text-label-caps font-label-caps text-vivid-amber uppercase tracking-widest">
                                Overall Score: 92/100
                            </div>
</div>
</div>
{/**/}
<div className="grid grid-cols-1 md:grid-cols-3 gap-4 flex-1">
{/**/}
<div className="col-span-1 md:col-span-2 bg-surface-deep border border-subtle rounded-xl p-4 flex flex-col">
<div className="font-label-caps text-label-caps text-muted mb-4 uppercase tracking-widest flex justify-between">
<span>Skill Verification Gap</span>
<span className="material-symbols-outlined text-[14px]">analytics</span>
</div>
<div className="flex-1 flex flex-col justify-center gap-4">
{/**/}
<div>
<div className="flex justify-between text-label-caps font-label-caps mb-1 uppercase tracking-widest">
<span className="text-white">React / Next.js</span>
<span className="text-muted">High Confidence</span>
</div>
<div className="w-full h-1.5 bg-surface-container rounded-full overflow-hidden flex">
<div className="w-3/4 bg-vivid-amber h-full"></div>
<div className="w-1/4 bg-surface-dim h-full border-l border-subtle"></div>
</div>
<div className="flex text-[10px] text-muted mt-1 font-label-caps uppercase justify-between">
<span>Resume Claim</span>
<span>GitHub Evidence</span>
</div>
</div>
<div>
<div className="flex justify-between text-label-caps font-label-caps mb-1 uppercase tracking-widest">
<span className="text-white">Python / Django</span>
<span className="text-muted">Moderate Gap</span>
</div>
<div className="w-full h-1.5 bg-surface-container rounded-full overflow-hidden flex">
<div className="w-[85%] bg-surface-bright h-full"></div>
<div className="w-[15%] bg-surface-dim h-full border-l border-subtle"></div>
</div>
<div className="flex text-[10px] text-muted mt-1 font-label-caps uppercase justify-between">
<span>Resume Claim</span>
<span>GitHub Evidence (Lacking)</span>
</div>
</div>
<div>
<div className="flex justify-between text-label-caps font-label-caps mb-1 uppercase tracking-widest">
<span className="text-white">AWS / Infrastructure</span>
<span className="text-muted">Verified</span>
</div>
<div className="w-full h-1.5 bg-surface-container rounded-full overflow-hidden flex">
<div className="w-[60%] bg-surface-bright h-full"></div>
</div>
</div>
</div>
</div>
{/**/}
<div className="bg-surface-deep border border-subtle rounded-xl p-4 flex flex-col">
<div className="font-label-caps text-label-caps text-muted mb-4 uppercase tracking-widest">
                                Code Consistency
                            </div>
<div className="flex-1 flex items-center justify-center">
{/**/}
<div className="relative w-32 h-32 rounded-full border border-subtle flex items-center justify-center">
<div className="absolute inset-2 rounded-full border border-[#252525] opacity-50"></div>
<div className="absolute inset-6 rounded-full border border-[#252525] opacity-20"></div>
<div className="text-center">
<div className="text-2xl font-headline-md text-white">1.2k</div>
<div className="text-[10px] font-label-caps text-muted uppercase">Commits YTD</div>
</div>
</div>
</div>
</div>
{/**/}
<div className="col-span-1 md:col-span-3 bg-surface-dim border border-subtle rounded-xl p-3 flex items-start gap-3">
<span className="material-symbols-outlined text-vivid-amber text-[20px] mt-0.5">warning</span>
<div>
<div className="font-label-caps text-label-caps text-white font-semibold uppercase tracking-widest mb-1">Missing Keywords for Target Role</div>
<div className="font-body-md text-body-md text-muted">The target job description emphasizes "CI/CD pipelines" and "Docker", which are absent from your LinkedIn summary despite appearing in your GitHub repositories.</div>
</div>
</div>
</div>
</div>
</div>
</div>
</main>

    </div>
  );
}
