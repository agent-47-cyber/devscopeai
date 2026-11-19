import { JOB_PROFILES } from '@/lib/constants';

const normalizeSkillText = (value = '') => value.toString().toLowerCase().replace(/[^a-z0-9+#.]+/g, ' ').trim();

export function getProfileSignals(github: any, resume: any, linkedin: any, roleKey = 'frontend') {
  const profile = JOB_PROFILES[roleKey] || JOB_PROFILES.frontend;
  const foundSkills = new Set<string>();
  const weakChannels: string[] = [];

  if (github?.languages) github.languages.forEach((lang: any) => foundSkills.add(lang.name));
  if (github?.topLanguages) github.topLanguages.forEach((lang: string) => foundSkills.add(lang));
  if (resume?.foundKeywords) resume.foundKeywords.forEach((skill: any) => foundSkills.add(skill));
  if (linkedin?.foundKws) linkedin.foundKws.forEach((skill: any) => foundSkills.add(skill));

  const foundNormalized = [...Array.from(foundSkills)].map(normalizeSkillText);
  const missingRoleSkills = profile.requiredSkills.filter((skill: any) => {
    const normalized = normalizeSkillText(skill);
    return !foundNormalized.some(found => normalized.includes(found) || found.includes(normalized.split(' ')[0]));
  });

  if (!github) weakChannels.push('GitHub proof-of-work');
  else if ((github.docScore || 0) < 70) weakChannels.push('GitHub documentation');
  if (!resume) weakChannels.push('ATS resume evidence');
  else if ((resume.atsScore || 0) < 75) weakChannels.push('resume keyword alignment');
  if (!linkedin) weakChannels.push('LinkedIn recruiter visibility');
  else if ((linkedin.score || 0) < 75) weakChannels.push('LinkedIn recruiter visibility');

  const missingFromResume = resume?.roleKeywordsMissing || resume?.missingKeywords || [];
  return {
    roleTitle: profile.title,
    foundSkills: [...Array.from(foundSkills)],
    missingSkills: [...new Set([...missingRoleSkills, ...missingFromResume])].slice(0, 8),
    weakChannels
  };
}

export function getDynamicProjectIdeas(signals: any, roleKey = 'frontend') {
  const missing = signals.missingSkills;
  const primaryGap = missing[0] || 'production deployment';
  const secondaryGap = missing[1] || 'testing';

  const templates: Record<string, string[]> = {
    frontend: [
      `Build a role-focused React dashboard that proves ${primaryGap}, with real filters, charts, responsive states, and tests.`,
      `Create a component library with Storybook, accessibility checks, and examples that highlight ${secondaryGap}.`,
      `Ship a GitHub-powered portfolio case study that documents tradeoffs, screenshots, and measurable UI improvements.`
    ],
    backend: [
      `Build a production API for job applications using ${primaryGap}, auth, validation, pagination, and audit logs.`,
      `Create a queue-backed notification service that demonstrates ${secondaryGap}, retries, rate limits, and monitoring.`,
      `Ship a documented system-design case study with Docker setup, database migrations, and API benchmarks.`
    ],
    fullstack: [
      `Build a full-stack placement tracker using ${primaryGap}, auth, analytics, file upload, and role-based dashboards.`,
      `Create a SaaS-style project with ${secondaryGap}, subscriptions/mock billing, background jobs, and deployment docs.`,
      `Ship a public portfolio app that combines GitHub stats, resume insights, and recruiter-ready project writeups.`
    ],
    'ml-engineer': [
      `Build an ML resume ranker using ${primaryGap}, model evaluation, experiment tracking, and a small inference API.`,
      `Create a data pipeline project that demonstrates ${secondaryGap}, feature engineering, monitoring, and notebooks.`,
      `Ship a deployed model demo with API endpoints, drift checks, explainability notes, and measurable metrics.`
    ]
  };

  return (templates[roleKey] || templates.frontend).map((idea, index) => `${index + 1}. ${idea}`).join('\n');
}

export function processChatMessage(message: string, analysis: any) {
  const github = analysis?.github_data || null;
  const resume = analysis?.resume_data || null;
  const linkedin = analysis?.linkedin_data || null;
  const scores = analysis?.scores || {};
  const roleKey = analysis?.target_role || 'frontend';
  const signals = getProfileSignals(github, resume, linkedin, roleKey);

  const userMessage = message.toLowerCase();

  if (userMessage.includes('hello') || userMessage.includes('hi') || userMessage.includes('hey') || userMessage.includes('start')) {
    return `👋 Hi there! I'm your AI Career Coach. Here's what I can see about your profile:\n\n` +
      `• **GitHub Score:** ${scores.github !== null && scores.github !== undefined ? `${scores.github}/100` : 'Not connected yet'}\n` +
      `• **Resume ATS Score:** ${scores.ats !== null && scores.ats !== undefined ? `${scores.ats}/100` : 'Not analyzed yet'}\n` +
      `• **LinkedIn Score:** ${scores.careerReady !== null && scores.careerReady !== undefined ? `${scores.careerReady}/100` : 'Not connected yet'}\n\n` +
      `What would you like to improve? You can ask me about:\n- "How do I improve my GitHub?"\n- "What keywords should I add to my resume?"\n- "Help me prepare for an interview"\n- "What skills should I learn next?"`;
  } else if (userMessage.includes('github') || userMessage.includes('repo') || userMessage.includes('repository') || userMessage.includes('portfolio')) {
    if (github) {
      const topIssue = github.flaggedRepos?.length > 0 ? `Your repos **${github.flaggedRepos.slice(0, 2).join(', ')}** are missing descriptions.` : 'Your repo descriptions look good!';
      return `📊 **Your GitHub Analysis (Score: ${github.score}/100)**\n\n` +
        `You have **${github.publicRepos} public repos** with ${github.followers} followers.\n\n` +
        `**Top issues to fix:**\n` +
        `1. ${topIssue}\n` +
        `2. **README quality (${github.docScore || 70}%):** ${(github.docScore || 70) < 70 ? 'Add proper README files with project description, setup instructions, and screenshots.' : 'Good README coverage — consider adding demo GIFs for visual impact.'}\n` +
        `3. **Stars & forks:** ${github.totalStars || 0} total stars. Share your best projects on Twitter/LinkedIn to attract more stars.\n\n` +
        `**Quick wins:**\n- Add descriptions to ALL repos\n- Pin your 6 best projects on your profile\n- Add a README to every project`;
    } else {
      return `📊 **GitHub isn't connected yet!**\n\nGo to the **GitHub Analyzer** tab and enter your username to get a full repo audit. Once connected, I can give you personalized tips based on your actual repositories.`;
    }
  } else if (userMessage.includes('resume') || userMessage.includes('ats') || userMessage.includes('cv') || userMessage.includes('keyword')) {
    if (resume) {
      const missingTop = resume.missingKeywords?.slice(0, 4).join(', ') || 'none';
      return `📄 **Your Resume Analysis (ATS Score: ${resume.atsScore}/100)**\n\n` +
        `**Word count:** ${resume.wordCount || 'unknown'} words. ${(resume.wordCount || 0) < 300 ? '⚠️ Aim for 400–700 words.' : '✅ Good length.'}\n\n` +
        `**${resume.foundKeywords?.length || 0} keywords found** in your resume.\n\n` +
        `**Top missing keywords to add:**\n${missingTop}\n\n` +
        `**Your action verb count:** ${resume.actionVerbCount}/8. ${resume.actionVerbCount < 5 ? 'Add more: Engineered, Deployed, Optimized, Reduced, Built.' : '✅ Good action verb usage.'}\n\n` +
        `**Specific suggestions:**\n${resume.suggestions?.slice(0, 2).map((s: any) => `- ${s}`).join('\n') || '- Resume looks good overall!'}`;
    } else {
      return `📄 **Resume isn't analyzed yet!**\n\nGo to the **Resume Analyzer** tab and upload your resume or paste the text. I'll then be able to give you personalized ATS improvement tips, keyword gaps, and section-specific advice.`;
    }
  } else if (userMessage.includes('linkedin') || userMessage.includes('profile visibility') || userMessage.includes('recruiter')) {
    if (linkedin) {
      return `💼 **Your LinkedIn Analysis (Score: ${linkedin.score}/100)**\n\n` +
        `**URL:** ${linkedin.url ? '✅ Connected slug — great for professionalism!' : '⚠️ Default URL detected. Customize it at linkedin.com/public-profile/settings.'}\n\n` +
        `**Suggested headline:**\n"${linkedin.headline}"\n\n` +
        `**Top optimization tips:**\n${linkedin.suggestions?.slice(0, 3).map((t: any) => `- ${t}`).join('\n') || '- Fill in the self-assessment checklist in the LinkedIn tab.'}\n\n` +
        `💡 Note: LinkedIn doesn't allow third-party access to your profile data. Use the LinkedIn tab's self-assessment checklist to get a more accurate score.`;
    } else {
      return `💼 **LinkedIn isn't connected yet!**\n\nGo to the **LinkedIn Analyzer** tab and enter your LinkedIn URL. Also fill in the self-assessment checklist to get an accurate profile score based on your actual profile status.`;
    }
  } else if (userMessage.includes('interview') || userMessage.includes('mock') || userMessage.includes('question')) {
    const questions = [
      '"Explain the difference between client-side rendering (CSR) and server-side rendering (SSR). When would you choose Next.js over plain React?"',
      '"What is the difference between SQL JOIN types? Give a real example of when you\'d use LEFT JOIN vs INNER JOIN."',
      '"Describe how you\'d design a URL shortener like bit.ly. What database, caching, and API structure would you use?"',
      '"What is a closure in JavaScript? Can you give a practical example from a real project?"',
      '"How does React\'s reconciliation algorithm work? What are the rules for using Keys effectively?"'
    ];
    const q = questions[Math.floor(Math.random() * questions.length)];
    return `🎯 **Mock Interview Question:**\n\n${q}\n\n**Tips for answering:**\n1. Think out loud — interviewers want to see your thought process\n2. Give a concrete example from your own experience\n3. Mention trade-offs and alternatives you considered\n\nWant another question? Just say "Give me another question" or specify a topic like "ask me about system design" or "ask me about JavaScript".`;
  } else if (userMessage.includes('learn') || userMessage.includes('skill') || userMessage.includes('next') || userMessage.includes('roadmap')) {
    const personalizedMissingSkills = signals.missingSkills.slice(0, 3);
    return `Skill Recommendations Based on Your Profile:\n\n` +
      `For a **${signals.roleTitle}** target, your highest-impact next skills are:\n\n` +
      `1. **${personalizedMissingSkills[0] || 'TypeScript'}** - add this to one visible project and your resume skills section.\n` +
      `2. **${personalizedMissingSkills[1] || 'Docker'}** - prove it with setup docs and a deployable repo.\n` +
      `3. **${personalizedMissingSkills[2] || 'CI/CD'}** - show automation with GitHub Actions or a similar pipeline.\n\n` +
      `Detected strengths: ${signals.foundSkills.slice(0, 6).join(', ') || 'not enough data yet'}.\n` +
      `Weakest channel: ${signals.weakChannels[0] || 'profile depth looks balanced'}.\n\n` +
      `Check the **Skill Gap** tab for the full roadmap.`;
  } else if (userMessage.includes('salary') || userMessage.includes('pay') || userMessage.includes('package') || userMessage.includes('ctc')) {
    const ghScore = scores.github || 0;
    const atsScore = scores.ats || 0;
    const avgScore = Math.round((ghScore + atsScore) / (ghScore && atsScore ? 2 : 1)) || 60;
    return `💰 **Salary Benchmark (India Market, 2025):**\n\n` +
      `Based on a combined profile score of ~${avgScore}/100:\n\n` +
      `• **Fresher (0–1 yr):** ₹3–8 LPA | After upskilling: ₹8–15 LPA\n` +
      `• **Mid-Level (2–4 yrs):** ₹12–25 LPA | FAANG/Startup: ₹25–60 LPA\n` +
      `• **Senior (5+ yrs):** ₹25–60 LPA | FAANG: ₹60–120 LPA+\n\n` +
      `**To maximize your package:**\n- A GitHub score of 75+ signals strong practical skills\n- ATS score 80+ gets you past automated filters\n- 500+ LinkedIn connections makes you discoverable to recruiters\n\nRemember: Skills + Projects + Network = Salary. No shortcut.`;
  } else if (userMessage.includes('project') || userMessage.includes('idea') || userMessage.includes('build')) {
    return `💡 **Project Ideas Based on Your Current Gaps:**\n\n` +
      `Target role: **${signals.roleTitle}**\n` +
      `Detected skills: ${signals.foundSkills.slice(0, 8).join(', ') || 'not enough data yet'}\n` +
      `Gaps to prove: ${signals.missingSkills.slice(0, 5).join(', ') || 'production polish and measurable impact'}\n\n` +
      `${getDynamicProjectIdeas(signals, roleKey)}\n\n` +
      `Open the **Project Ideas** tab for scoped builds with stacks and learning goals.`;
  } else if (userMessage.includes('skill gap') || userMessage.includes('weakness')) {
    const missingList = signals.missingSkills.map((s: string) => `- ${s}`).join('\n');
    return `🔍 **Your Detected Skill Gaps for ${signals.roleTitle}:**\n\n` +
      `${missingList ? missingList : '- You have great coverage!'}\n\n` +
      `Your weakest channel is **${signals.weakChannels[0] || 'none'}**. I recommend focusing your efforts there next.`;
  } else {
    return `🤖 I'm your AI Career Coach! Here are things I can help you with:\n\n` +
      `- 📊 **GitHub review** — "How do I improve my GitHub score?"\n` +
      `- 📄 **Resume tips** — "What keywords am I missing in my resume?"\n` +
      `- 💼 **LinkedIn optimization** — "How do I improve my LinkedIn profile?"\n` +
      `- 🎯 **Mock interview** — "Give me a technical interview question"\n` +
      `- 🗺️ **Skills to learn** — "What should I learn next?"\n` +
      `- 💰 **Salary info** — "What salary can I expect?"\n` +
      `- 💡 **Project ideas** — "What projects should I build?"\n\n` +
      `What would you like help with?`;
  }
}
