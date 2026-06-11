const ROLE_SKILLS = {
  frontend: ['React', 'TypeScript', 'JavaScript', 'HTML', 'CSS', 'Next.js', 'Testing', 'Responsive Design', 'State Management', 'CI/CD'],
  backend: ['Node.js', 'Express', 'PostgreSQL', 'MongoDB', 'REST API', 'Docker', 'Redis', 'System Design', 'Authentication', 'CI/CD'],
  fullstack: ['React', 'Node.js', 'TypeScript', 'PostgreSQL', 'REST API', 'Docker', 'Authentication', 'Testing', 'Deployment', 'CI/CD'],
  'ml-engineer': ['Python', 'Machine Learning', 'TensorFlow', 'PyTorch', 'Pandas', 'NumPy', 'MLOps', 'SQL', 'Model Deployment', 'Data Pipelines']
};

const SKILL_PATTERNS = [
  ['JavaScript', /\bjavascript|js\b/i],
  ['TypeScript', /\btypescript|ts\b/i],
  ['React', /\breact\b/i],
  ['Next.js', /\bnext\.?js\b/i],
  ['Node.js', /\bnode\.?js\b/i],
  ['Express', /\bexpress\b/i],
  ['Python', /\bpython\b/i],
  ['Java', /\bjava\b/i],
  ['SQL', /\bsql\b/i],
  ['PostgreSQL', /\bpostgres|postgresql\b/i],
  ['MongoDB', /\bmongodb|mongo\b/i],
  ['AWS', /\baws|amazon web services\b/i],
  ['Docker', /\bdocker\b/i],
  ['Kubernetes', /\bkubernetes|k8s\b/i],
  ['Git', /\bgit|github\b/i],
  ['CI/CD', /\bci\/cd|github actions|jenkins\b/i],
  ['Testing', /\bjest|cypress|testing library|unit test|e2e\b/i],
  ['Machine Learning', /\bmachine learning|ml\b/i],
  ['TensorFlow', /\btensorflow\b/i],
  ['PyTorch', /\bpytorch\b/i],
  ['Pandas', /\bpandas\b/i],
  ['NumPy', /\bnumpy\b/i]
];

const ACTION_VERBS = ['built', 'created', 'developed', 'implemented', 'designed', 'led', 'optimized', 'deployed', 'improved', 'managed', 'analyzed', 'collaborated'];

export const clampScore = (value, min = 0, max = 100) =>
  Math.max(min, Math.min(max, Math.round(Number(value) || 0)));

export const uniq = (items = []) =>
  [...new Set(items.filter(Boolean).map(item => String(item).trim()).filter(Boolean))];

export function extractSkillsFromText(text = '') {
  return SKILL_PATTERNS
    .filter(([, pattern]) => pattern.test(text))
    .map(([skill]) => skill);
}

function roleSkills(role = 'frontend') {
  return ROLE_SKILLS[role] || ROLE_SKILLS.frontend;
}

function collectCandidateSkills(resumeData, githubData, linkedinData) {
  return uniq([
    ...(resumeData?.foundKeywords || []),
    ...(resumeData?.keywordAnalysis?.found || []),
    ...(githubData?.languages || []).map(lang => lang?.name || lang),
    ...(githubData?.topLanguages || []).map(lang => lang?.name || lang),
    ...(linkedinData?.foundKws || []),
    ...(linkedinData?.skills || [])
  ]);
}

function missingForRole(foundSkills, role = 'frontend') {
  const foundNorm = foundSkills.map(skill => skill.toLowerCase().replace(/[^a-z0-9]/g, ''));
  return roleSkills(role).filter(skill => {
    const normalized = skill.toLowerCase().replace(/[^a-z0-9]/g, '');
    return !foundNorm.some(found => found && (normalized.includes(found) || found.includes(normalized)));
  });
}

export function createResumeFallback(resumeText = '', targetRole = 'frontend') {
  const text = String(resumeText || '');
  const lower = text.toLowerCase();
  const words = text.trim().split(/\s+/).filter(Boolean);
  const found = extractSkillsFromText(text);
  const missing = missingForRole(found, targetRole).slice(0, 8);
  const sectionsChecklist = {
    contact: /@|linkedin\.com|github\.com|\+?\d[\d\s().-]{7,}/i.test(text),
    experience: /\bexperience|employment|work history|internship\b/i.test(text),
    projects: /\bprojects?|portfolio|open source\b/i.test(text),
    education: /\beducation|degree|university|college|b\.?tech|bachelor|master\b/i.test(text)
  };
  const actionVerbCount = ACTION_VERBS.filter(verb => lower.includes(verb)).length;
  const quantificationCount = (text.match(/\b\d+(\.\d+)?%|\b\d+\+|\b\d+x\b/gi) || []).length;
  const sectionScore = Object.values(sectionsChecklist).filter(Boolean).length * 10;
  const score = clampScore(40 + sectionScore + Math.min(found.length * 4, 24) + Math.min(actionVerbCount * 2, 12) + Math.min(quantificationCount * 3, 12));

  return {
    executiveSummary: `Resume text was parsed successfully and shows ${found.length ? `evidence of ${found.slice(0, 5).join(', ')}` : 'limited explicit technical keywords'}. The profile needs stronger measurable outcomes and role-specific proof points to improve recruiter confidence.`,
    atsScore: score,
    keywordAnalysis: { found, missing },
    strengths: [
      sectionsChecklist.projects ? 'Includes project evidence that can be mapped to hiring requirements.' : 'Provides enough text for a structured ATS review.',
      found.length ? `Mentions relevant technologies including ${found.slice(0, 4).join(', ')}.` : 'Has room to add explicit technical keywords.'
    ],
    weaknesses: [
      quantificationCount < 3 ? 'Needs more quantified achievements, impact metrics, and scale indicators.' : 'Impact metrics are present but should be tied more clearly to business outcomes.',
      missing.length ? `Missing target-role keywords such as ${missing.slice(0, 4).join(', ')}.` : 'Could still improve seniority framing and project depth.'
    ],
    projectEvaluation: sectionsChecklist.projects
      ? 'Projects are present; strengthen each with stack, scope, deployment link, and measurable outcome.'
      : 'Project section is weak or missing; add two to three recruiter-readable technical projects.',
    recruiterNotes: 'Fallback analysis generated locally because Gemini was unavailable. Results are deterministic and based on parsed resume signals.',
    improvementOpportunities: [
      'Add metrics to at least three bullets using result, scale, or performance numbers.',
      'Mirror the target role title and its top skills in summary, skills, and project bullets.',
      'Make each project include problem, stack, ownership, deployment, and outcome.'
    ],
    recommendedTechnologies: missing.slice(0, 5),
    recommendedProjects: [
      'Build a production-style project with authentication, persistence, tests, and deployment notes.',
      'Create a case-study README for the strongest project with screenshots and tradeoffs.'
    ],
    jobReadiness: score >= 80 ? 'Interview Ready' : score >= 65 ? 'Needs Targeted Polish' : 'Needs Portfolio Work',
    actionVerbCount,
    quantificationCount,
    sectionsChecklist,
    matchRate: clampScore((found.length / Math.max(roleSkills(targetRole).length, 1)) * 100),
    roleKeywordsMissing: missing,
    suggestions: [
      'Rewrite bullets using action verb + technical action + measurable result.',
      'Add missing role keywords naturally inside recent project and experience bullets.'
    ],
    softSkillsFound: ['communication', 'leadership', 'collaboration'].filter(skill => lower.includes(skill))
  };
}

export function createGithubFallback(source = {}) {
  const repos = Array.isArray(source.topRepositories) ? source.topRepositories : [];
  const languages = source.topLanguages || uniq(repos.map(repo => repo.language));
  const hasDescriptions = repos.filter(repo => repo.description).length;
  const totalStars = source.totalStarsOnTopRepos || repos.reduce((sum, repo) => sum + (repo.stars || repo.stargazers_count || 0), 0);
  const score = clampScore(45 + Math.min(repos.length * 4, 24) + Math.min(languages.length * 5, 20) + Math.min(totalStars, 15) + (hasDescriptions >= Math.min(repos.length, 5) ? 8 : 0));
  const bestRepo = repos[0]?.name || `${source.username || 'candidate'}-portfolio`;

  return {
    repositoryQuality: repos.length ? 'Repository metadata shows usable portfolio evidence, with strongest signal coming from named, described projects.' : 'No repository list was available, so portfolio confidence is limited.',
    projectDiversity: languages.length > 2 ? 'Multiple languages suggest reasonable project diversity.' : 'Portfolio appears concentrated in a small set of technologies.',
    technologyCoverage: languages.length ? `Detected ${languages.slice(0, 5).join(', ')}.` : 'Technology coverage could not be confirmed from public metadata.',
    codePortfolioStrength: score,
    architectureMaturity: 'Local fallback can inspect metadata only; add architecture notes and READMEs to make maturity visible.',
    recruiterImpression: score >= 75 ? 'Positive portfolio signal with room for presentation polish.' : 'Moderate portfolio signal; recruiters may need clearer proof of production-grade work.',
    portfolioRisks: [
      ...(hasDescriptions < repos.length ? ['Some repositories lack clear descriptions.'] : []),
      ...(languages.length < 3 ? ['Technology breadth appears narrow from public metadata.'] : []),
      ...(totalStars === 0 ? ['Limited external validation through stars or forks.'] : [])
    ],
    bestRepository: bestRepo,
    weakestRepository: repos.find(repo => !repo.description)?.name || '',
    missingProjectCategories: ['Cloud/DevOps deployment', 'Testing-heavy production app', 'Team or open-source contribution'],
    missingTechnologies: ['Docker', 'CI/CD', 'Testing'],
    openSourcePresence: totalStars > 10 ? 'Some public traction is visible.' : 'Open-source traction is limited.',
    projectRecommendations: [
      'Pin the strongest six repositories and add recruiter-readable READMEs.',
      'Add deployment, tests, screenshots, and architecture diagrams to the top project.',
      'Ship one cloud-backed full-stack project with CI/CD.'
    ],
    careerRecommendations: [
      'Convert repository metadata into portfolio case studies.',
      'Remove or archive weak repositories that dilute the signal.'
    ]
  };
}

export function createLinkedinFallback(profile = {}, resumeData = null, githubData = null) {
  const skills = uniq([...(profile.skills || []), ...(profile._resumeKeywords || []), ...(profile._githubLanguages || [])]);
  const completeness = clampScore(45 + (profile.headline ? 15 : 0) + (profile.about ? 12 : 0) + Math.min((profile.experience || []).length * 8, 16) + Math.min(skills.length * 2, 12));

  return {
    headlineAnalysis: profile.headline ? 'Headline exists; make it keyword-rich and outcome-oriented.' : 'Headline is missing or unavailable; add target role, stack, and proof point.',
    profileCompleteness: completeness,
    keywordCoverage: skills.length ? `Visible keywords include ${skills.slice(0, 6).join(', ')}.` : 'Keyword evidence is thin; add target role skills.',
    skillVisibility: skills.length ? 'Skills are partially visible through cross-channel evidence.' : 'Skills section should be expanded.',
    recruiterVisibility: completeness >= 75 ? 'Likely discoverable for aligned searches.' : 'Recruiter visibility is limited until headline, about, skills, and experience are completed.',
    experienceReview: (profile.experience || []).length ? 'Experience entries are present; strengthen them with outcomes and technologies.' : 'Experience data is missing or unavailable from provider.',
    linkedinStrengths: [
      profile.headline ? 'Profile has a headline foundation.' : 'Profile can be quickly improved with a focused headline.',
      resumeData ? 'Resume data is available for consistency checks.' : 'LinkedIn can become the main professional context source.'
    ],
    linkedinWeaknesses: [
      completeness < 75 ? 'Profile completeness and keyword density need improvement.' : 'Profile should still add stronger proof artifacts.',
      githubData ? 'Ensure GitHub projects are featured or linked.' : 'No GitHub evidence is connected for cross-platform proof.'
    ],
    profileOptimizationSuggestions: [
      'Use a headline like "Frontend Engineer | React, TypeScript, Node.js | Building production dashboards".',
      'Add a Featured section with portfolio, resume, and top GitHub project.',
      'Rewrite experience bullets with stack, ownership, and measured impact.'
    ],
    resumeConsistency: resumeData ? 'Resume and LinkedIn can be cross-referenced; keep titles, dates, and skills aligned.' : 'Resume data is missing, so consistency confidence is limited.',
    githubConsistency: githubData ? 'GitHub language evidence should be surfaced in LinkedIn Featured and About sections.' : 'GitHub data is missing, so technical proof is incomplete.',
    improvementOpportunities: ['Improve headline SEO', 'Add Featured projects', 'Expand Skills and About sections']
  };
}

export function createJobMatchFallback(jobDescription = '', candidateProfile = {}, targetRole = 'frontend') {
  const jdSkills = extractSkillsFromText(jobDescription);
  const candidateSkills = collectCandidateSkills(candidateProfile.resumeData, candidateProfile.githubData, candidateProfile.linkedinData);
  const matchingSkills = uniq(jdSkills.filter(skill => candidateSkills.some(candidate => candidate.toLowerCase() === skill.toLowerCase())));
  const missingSkills = uniq([...jdSkills.filter(skill => !matchingSkills.includes(skill)), ...missingForRole(candidateSkills, targetRole)]).slice(0, 8);
  const score = clampScore(45 + Math.min(matchingSkills.length * 10, 40) - Math.min(missingSkills.length * 3, 18) + (candidateProfile.resumeData ? 5 : 0) + (candidateProfile.githubData ? 5 : 0) + (candidateProfile.linkedinData ? 3 : 0));

  return {
    matchScore: score,
    matchingSkills,
    missingSkills,
    missingTechnologies: missingSkills.filter(skill => !['Responsive Design', 'State Management'].includes(skill)).slice(0, 6),
    keywordGaps: missingSkills.slice(0, 6),
    hiringRisks: [
      missingSkills.length ? `Missing visible evidence for ${missingSkills.slice(0, 3).join(', ')}.` : 'No major keyword gaps detected.',
      !candidateProfile.githubData ? 'GitHub proof is not connected for technical validation.' : 'Repository evidence should be tied directly to this job.'
    ],
    improvementPlan: [
      'Add the top missing keywords to resume bullets where they are truthful.',
      'Update the strongest project README to mirror this job description.',
      'Prepare interview stories for each matched skill.'
    ],
    fastestImprovementPath: missingSkills[0]
      ? `Within 7 days, ship or document a small proof point for ${missingSkills[0]}.`
      : 'Within 7 days, tailor resume summary and top project to this role.',
    recruiterPerspective: score >= 75
      ? 'Candidate is plausibly interview-ready if project evidence holds up.'
      : 'Candidate needs tighter role alignment before a recruiter would treat this as a strong match.',
    scores: {
      technicalMatch: score,
      experienceMatch: candidateProfile.resumeData ? 70 : 55,
      projectMatch: candidateProfile.githubData ? 70 : 50,
      keywordMatch: clampScore((matchingSkills.length / Math.max(jdSkills.length, 1)) * 100),
      skillMatch: score,
      readinessScore: score
    }
  };
}

export function createProjectGapFallback(candidateProfile = {}, targetRole = 'frontend') {
  const skills = collectCandidateSkills(candidateProfile.resumeData, candidateProfile.githubData, candidateProfile.linkedinData);
  const missing = missingForRole(skills, targetRole);

  return {
    missingAiProjects: skills.some(skill => /ai|ml|machine learning|python/i.test(skill)) ? 'AI evidence exists, but a deployed AI workflow would strengthen it.' : 'No clear AI project evidence found; add a practical AI integration project.',
    missingCloudProjects: skills.some(skill => /aws|docker|kubernetes|cloud/i.test(skill)) ? 'Some cloud or deployment evidence exists; document it better.' : 'Cloud deployment proof is missing.',
    missingSaasProjects: 'A SaaS-style project with auth, persistence, analytics, and billing/mock billing would raise production credibility.',
    missingTeamProjects: 'Team collaboration evidence is limited; add contribution notes, issues, PRs, or open-source work.',
    missingOpenSourceContributions: 'Open-source contribution evidence is limited or absent.',
    missingDevopsExperience: skills.some(skill => /ci\/cd|docker|kubernetes/i.test(skill)) ? 'DevOps keywords exist; make pipeline proof visible.' : 'CI/CD, containerization, and deployment proof are missing.',
    missingArchitectureExperience: 'Architecture evidence needs clearer diagrams, tradeoffs, and system design notes.',
    recommendedProjects: [
      {
        name: `${targetRole === 'backend' ? 'Production API Platform' : 'Role-Focused SaaS Dashboard'}`,
        description: `Build a production-style app targeting ${targetRole}, covering ${missing.slice(0, 3).join(', ') || 'testing, deployment, and documentation'}.`,
        difficulty: 'High',
        hiringImpact: 'Critical',
        estimatedLearningValue: 'Proves architecture, implementation, deployment, and product thinking in one artifact.',
        priorityOrder: 1
      },
      {
        name: 'CI/CD Portfolio Hardening Sprint',
        description: 'Add tests, Docker, GitHub Actions, screenshots, and architecture notes to the best existing project.',
        difficulty: 'Medium',
        hiringImpact: 'High',
        estimatedLearningValue: 'Turns existing work into recruiter-readable proof.',
        priorityOrder: 2
      },
      {
        name: 'Open Source Contribution Case Study',
        description: 'Make one meaningful PR, document the issue, approach, and review process, then feature it on LinkedIn.',
        difficulty: 'Medium',
        hiringImpact: 'High',
        estimatedLearningValue: 'Shows collaboration, code review, and real-world engineering context.',
        priorityOrder: 3
      }
    ],
    scores: {
      aiReadiness: skills.some(skill => /ai|ml|python/i.test(skill)) ? 70 : 45,
      cloudReadiness: skills.some(skill => /aws|docker|kubernetes/i.test(skill)) ? 70 : 45,
      saasReadiness: 58,
      architectureReadiness: 62,
      leadershipReadiness: 60,
      openSourceReadiness: 45
    }
  };
}

export function createCandidateReportFallback(resumeData, githubData, linkedinData, jobMatchData, projectGapData) {
  const scores = [
    resumeData?.atsScore,
    githubData?.score,
    linkedinData?.score,
    jobMatchData?.matchScore
  ].filter(score => score !== null && score !== undefined);
  const overall = scores.length ? clampScore(scores.reduce((sum, score) => sum + Number(score), 0) / scores.length) : 55;
  const missingTechnologies = uniq([
    ...(resumeData?.missingKeywords || []),
    ...(githubData?.missingTech || githubData?.missingTechnologies || []),
    ...(jobMatchData?.missingTechnologies || [])
  ]).slice(0, 8);

  return {
    executiveSummary: `The candidate has ${[resumeData && 'resume', githubData && 'GitHub', linkedinData && 'LinkedIn'].filter(Boolean).join(', ') || 'limited'} evidence connected. Overall readiness is ${overall}/100, with the next leap coming from tighter cross-channel proof and production-grade project presentation.`,
    overallCandidateRating: overall,
    hireProbability: Math.min(overall + 10, 95),
    recruiterConfidence: overall >= 80 ? 'High' : overall >= 65 ? 'Moderate' : 'Low',
    topStrengths: uniq([
      resumeData ? `Resume signal: ${resumeData.jobReadiness || 'parsed technical profile'}.` : '',
      githubData ? `GitHub signal: ${githubData.bestRepo || githubData.bestRepository || 'public repositories available'}.` : '',
      linkedinData ? 'LinkedIn profile can support recruiter visibility.' : ''
    ]).filter(Boolean).slice(0, 3),
    hiringRisks: uniq([...(jobMatchData?.hiringRisks || []), ...(resumeData?.weaknesses || []).slice(0, 2)]).filter(Boolean).slice(0, 3),
    portfolioGaps: uniq([...(projectGapData?.recommendedProjects || []).map(project => typeof project === 'string' ? project : project.name), ...(githubData?.missingCategories || [])]).filter(Boolean).slice(0, 3),
    recruiterNotes: 'Fallback report synthesized locally from all available module outputs because Gemini was unavailable.',
    skillsVerificationMatrix: [
      {
        skill: 'React / Frontend',
        resumeEvidence: resumeData ? 'Mentioned in resume' : 'No resume',
        githubEvidence: githubData ? 'Visible in repositories' : 'No GitHub',
        linkedinEvidence: linkedinData ? 'Listed in skills' : 'No LinkedIn',
        confidenceScore: overall,
        verificationStatus: overall > 75 ? 'Verified' : 'Partially Verified'
      },
      {
        skill: 'Backend / APIs',
        resumeEvidence: resumeData ? 'Mentioned in resume' : 'No resume',
        githubEvidence: githubData ? 'Visible in repositories' : 'No GitHub',
        linkedinEvidence: linkedinData ? 'Listed in skills' : 'No LinkedIn',
        confidenceScore: overall - 10,
        verificationStatus: overall > 85 ? 'Verified' : 'Partially Verified'
      }
    ],
    technicalCompetency: {
      frontend: overall,
      backend: Math.max(0, overall - 10),
      systemDesign: Math.max(0, overall - 15),
      cloudAndDevops: Math.max(0, overall - 20),
      aiAndMl: 40,
      databases: Math.max(0, overall - 10),
      testingAndQuality: Math.max(0, overall - 25)
    },
    hiringReadinessDetails: {
      hiringReadiness: overall >= 80 ? 'Interview Ready' : overall >= 65 ? 'Needs Portfolio Polish' : 'Needs Foundational Work',
      immediateStrengths: ['Base technical foundation', 'Profile setup complete'],
      interviewRisks: ['Missing production-grade cloud evidence', 'System design gaps'],
      missingTechnologies,
      missingExperienceAreas: ['Large-scale CI/CD', 'Production architectural planning']
    },
    recommendedProjectsDetailed: [
      {
        name: 'Full-Stack Production App',
        whyItMatters: 'Proves end-to-end knowledge',
        hiringImpact: 'High',
        scoreIncrease: 15,
        difficulty: 'Hard',
        timeRequired: '1 Month'
      },
      {
        name: 'CI/CD Pipeline Setup',
        whyItMatters: 'Shows DevOps readiness',
        hiringImpact: 'Medium',
        scoreIncrease: 10,
        difficulty: 'Medium',
        timeRequired: '1 Week'
      }
    ],
    actionPlanTimeline: {
      plan30Days: [
        { task: 'Refine Resume and LinkedIn', impact: 'High Impact' },
        { task: 'Pin best projects on GitHub', impact: 'Medium Impact' }
      ],
      plan60Days: [
        { task: 'Ship Recommended Project 1', impact: 'High Impact' },
        { task: 'Add tests to all repos', impact: 'Medium Impact' }
      ],
      plan90Days: [
        { task: 'Open Source Contributions', impact: 'Medium Impact' },
        { task: 'Mock Interviews', impact: 'High Impact' }
      ]
    }
  };
}
