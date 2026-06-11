/**
 * DevScope Candidate Intelligence Platform Scoring Engine
 * Separates qualitative analysis (Gemini) from scoring calculations (Backend).
 * Calculates scores dynamically based on the global Target Role.
 */

// Target Role Competency Profiles
export const ROLES = {
  FRONTEND: 'frontend',
  BACKEND: 'backend',
  FULLSTACK: 'fullstack',
  SOFTWARE_ENGINEER: 'software-engineer',
  AI_ENGINEER: 'ai-engineer',
  ML_ENGINEER: 'ml-engineer',
  DATA_ENGINEER: 'data-engineer',
  CLOUD_ENGINEER: 'cloud-engineer',
  DEVOPS_ENGINEER: 'devops-engineer',
  PRODUCT_ENGINEER: 'product-engineer'
};

// Skill Keywords mapping for classifying candidate's primary competency
const CORE_KEYWORDS = {
  frontend: ['react', 'vue', 'angular', 'next.js', 'typescript', 'javascript', 'html', 'css', 'tailwind', 'redux', 'frontend', 'ui', 'ux', 'sass', 'webpack', 'vite', 'npm'],
  backend: ['node.js', 'express', 'django', 'fastapi', 'flask', 'spring boot', 'postgresql', 'mysql', 'mongodb', 'redis', 'graphql', 'rest api', 'sql', 'backend', 'java', 'python', 'go', 'ruby', 'c#', 'php'],
  ai_ml: ['python', 'pytorch', 'tensorflow', 'scikit-learn', 'machine learning', 'deep learning', 'nlp', 'ai', 'ml', 'pandas', 'numpy', 'feature engineering', 'llm', 'gemini', 'openai', 'huggingface', 'data science'],
  cloud_devops: ['aws', 'gcp', 'azure', 'docker', 'kubernetes', 'ci/cd', 'jenkins', 'terraform', 'ansible', 'linux', 'devops', 'cloud', 'nginx', 's3', 'ec2'],
  software_general: ['git', 'agile', 'scrum', 'testing', 'jest', 'cypress', 'system design', 'algorithms', 'data structures', 'oop']
};

// Role Compatibility Matrix (Primary Skill Category -> Selected Target Role -> Modifier 0.0 to 1.0)
const COMPATIBILITY_MATRIX = {
  frontend: {
    [ROLES.FRONTEND]: 1.0,
    [ROLES.BACKEND]: 0.78,
    [ROLES.FULLSTACK]: 0.90,
    [ROLES.SOFTWARE_ENGINEER]: 0.92,
    [ROLES.AI_ENGINEER]: 0.48,
    [ROLES.ML_ENGINEER]: 0.46,
    [ROLES.DATA_ENGINEER]: 0.58,
    [ROLES.CLOUD_ENGINEER]: 0.60,
    [ROLES.DEVOPS_ENGINEER]: 0.54,
    [ROLES.PRODUCT_ENGINEER]: 0.88
  },
  backend: {
    [ROLES.FRONTEND]: 0.74,
    [ROLES.BACKEND]: 1.0,
    [ROLES.FULLSTACK]: 0.92,
    [ROLES.SOFTWARE_ENGINEER]: 0.95,
    [ROLES.AI_ENGINEER]: 0.65,
    [ROLES.ML_ENGINEER]: 0.62,
    [ROLES.DATA_ENGINEER]: 0.82,
    [ROLES.CLOUD_ENGINEER]: 0.84,
    [ROLES.DEVOPS_ENGINEER]: 0.80,
    [ROLES.PRODUCT_ENGINEER]: 0.85
  },
  fullstack: {
    [ROLES.FRONTEND]: 0.95,
    [ROLES.BACKEND]: 0.95,
    [ROLES.FULLSTACK]: 1.0,
    [ROLES.SOFTWARE_ENGINEER]: 0.98,
    [ROLES.AI_ENGINEER]: 0.68,
    [ROLES.ML_ENGINEER]: 0.65,
    [ROLES.DATA_ENGINEER]: 0.78,
    [ROLES.CLOUD_ENGINEER]: 0.82,
    [ROLES.DEVOPS_ENGINEER]: 0.78,
    [ROLES.PRODUCT_ENGINEER]: 0.92
  },
  ai_ml: {
    [ROLES.FRONTEND]: 0.42,
    [ROLES.BACKEND]: 0.76,
    [ROLES.FULLSTACK]: 0.70,
    [ROLES.SOFTWARE_ENGINEER]: 0.84,
    [ROLES.AI_ENGINEER]: 0.96,
    [ROLES.ML_ENGINEER]: 1.0,
    [ROLES.DATA_ENGINEER]: 0.88,
    [ROLES.CLOUD_ENGINEER]: 0.68,
    [ROLES.DEVOPS_ENGINEER]: 0.60,
    [ROLES.PRODUCT_ENGINEER]: 0.72
  },
  cloud_devops: {
    [ROLES.FRONTEND]: 0.48,
    [ROLES.BACKEND]: 0.82,
    [ROLES.FULLSTACK]: 0.75,
    [ROLES.SOFTWARE_ENGINEER]: 0.85,
    [ROLES.AI_ENGINEER]: 0.58,
    [ROLES.ML_ENGINEER]: 0.56,
    [ROLES.DATA_ENGINEER]: 0.76,
    [ROLES.CLOUD_ENGINEER]: 0.96,
    [ROLES.DEVOPS_ENGINEER]: 1.0,
    [ROLES.PRODUCT_ENGINEER]: 0.70
  },
  software_general: {
    [ROLES.FRONTEND]: 0.88,
    [ROLES.BACKEND]: 0.90,
    [ROLES.FULLSTACK]: 0.92,
    [ROLES.SOFTWARE_ENGINEER]: 1.0,
    [ROLES.AI_ENGINEER]: 0.72,
    [ROLES.ML_ENGINEER]: 0.70,
    [ROLES.DATA_ENGINEER]: 0.80,
    [ROLES.CLOUD_ENGINEER]: 0.80,
    [ROLES.DEVOPS_ENGINEER]: 0.76,
    [ROLES.PRODUCT_ENGINEER]: 0.94
  }
};

/**
 * Classify a candidate's primary competence category based on skills/text signals
 */
export function detectPrimarySkillCategory(skills = []) {
  if (!Array.isArray(skills) || skills.length === 0) return 'software_general';
  
  const counts = { frontend: 0, backend: 0, ai_ml: 0, cloud_devops: 0, software_general: 0 };
  
  skills.forEach(skill => {
    const s = String(skill || '').toLowerCase();
    
    Object.entries(CORE_KEYWORDS).forEach(([category, keywords]) => {
      if (keywords.some(kw => s.includes(kw) || kw.includes(s))) {
        counts[category]++;
      }
    });
  });

  let maxCategory = 'software_general';
  let maxCount = 0;
  
  Object.entries(counts).forEach(([cat, count]) => {
    if (count > maxCount) {
      maxCount = count;
      maxCategory = cat;
    }
  });

  return maxCategory;
}

/**
 * Retrieve role compatibility modifier based on candidate primary category and target role
 */
export function getRoleModifier(primaryCategory, targetRole) {
  const normRole = targetRole || ROLES.FRONTEND;
  const categoryMatrix = COMPATIBILITY_MATRIX[primaryCategory] || COMPATIBILITY_MATRIX.software_general;
  return categoryMatrix[normRole] ?? 0.75;
}

/**
 * Calculates Resume Intelligence Score
 */
export function calculateResumeScore(resumeAnalysis, targetRole) {
  const defaultScores = {
    atsCompatibility: 75,
    keywordCoverage: 70,
    projectRelevance: 75,
    experienceRelevance: 75,
    technicalDepth: 75,
    leadershipSignals: 65,
    roleAlignment: 70,
    evidenceConfidence: 80
  };

  const rawScores = resumeAnalysis?.scores || defaultScores;
  
  const weights = {
    atsCompatibility: 0.15,
    keywordCoverage: 0.15,
    projectRelevance: 0.15,
    experienceRelevance: 0.15,
    technicalDepth: 0.15,
    leadershipSignals: 0.10,
    roleAlignment: 0.10,
    evidenceConfidence: 0.05
  };

  let weightedSum = 0;
  Object.entries(weights).forEach(([key, w]) => {
    const val = Number(rawScores[key] ?? defaultScores[key] ?? 70);
    weightedSum += val * w;
  });

  // Apply target role compatibility
  const skills = [
    ...(resumeAnalysis?.keywordAnalysis?.found || []),
    ...(resumeAnalysis?.recommendedTechnologies || [])
  ];
  const primary = detectPrimarySkillCategory(skills);
  const modifier = getRoleModifier(primary, targetRole);

  const finalScore = Math.max(15, Math.min(100, Math.round(weightedSum * modifier)));
  return {
    finalScore,
    categoryBreakdown: {
      atsCompatibility: Math.max(10, Math.round((rawScores.atsCompatibility ?? 75) * modifier)),
      keywordCoverage: Math.max(10, Math.round((rawScores.keywordCoverage ?? 70) * modifier)),
      projectRelevance: Math.max(10, Math.round((rawScores.projectRelevance ?? 75) * modifier)),
      experienceRelevance: Math.max(10, Math.round((rawScores.experienceRelevance ?? 75) * modifier)),
      technicalDepth: Math.max(10, Math.round((rawScores.technicalDepth ?? 75) * modifier)),
      leadershipSignals: Math.max(10, Math.round((rawScores.leadershipSignals ?? 65) * modifier)),
      roleAlignment: Math.max(10, Math.round((rawScores.roleAlignment ?? 70) * modifier)),
      evidenceConfidence: Math.max(10, Math.round((rawScores.evidenceConfidence ?? 80) * modifier))
    }
  };
}

/**
 * Calculates GitHub Intelligence Score
 */
export function calculateGithubScore(githubAnalysis, targetRole) {
  const defaultScores = {
    repositoryQuality: 70,
    technologyDepth: 70,
    architectureMaturity: 65,
    documentationQuality: 75,
    testingCoverage: 60,
    cloudExposure: 55,
    openSourceActivity: 50,
    projectDiversity: 65,
    codeConsistency: 70,
    evidenceConfidence: 75
  };

  const rawScores = githubAnalysis?.scores || defaultScores;

  const weights = {
    repositoryQuality: 0.15,
    technologyDepth: 0.15,
    architectureMaturity: 0.15,
    documentationQuality: 0.10,
    testingCoverage: 0.10,
    cloudExposure: 0.10,
    openSourceActivity: 0.05,
    projectDiversity: 0.10,
    codeConsistency: 0.05,
    evidenceConfidence: 0.05
  };

  let weightedSum = 0;
  Object.entries(weights).forEach(([key, w]) => {
    const val = Number(rawScores[key] ?? defaultScores[key] ?? 65);
    weightedSum += val * w;
  });

  const skills = githubAnalysis?.languages?.map(l => l.name || l) || [];
  const primary = detectPrimarySkillCategory(skills);
  const modifier = getRoleModifier(primary, targetRole);

  const finalScore = Math.max(10, Math.min(100, Math.round(weightedSum * modifier)));
  return {
    finalScore,
    categoryBreakdown: {
      repositoryQuality: Math.max(10, Math.round((rawScores.repositoryQuality ?? 70) * modifier)),
      technologyDepth: Math.max(10, Math.round((rawScores.technologyDepth ?? 70) * modifier)),
      architectureMaturity: Math.max(10, Math.round((rawScores.architectureMaturity ?? 65) * modifier)),
      documentationQuality: Math.max(10, Math.round((rawScores.documentationQuality ?? 75) * modifier)),
      testingCoverage: Math.max(10, Math.round((rawScores.testingCoverage ?? 60) * modifier)),
      cloudExposure: Math.max(10, Math.round((rawScores.cloudExposure ?? 55) * modifier)),
      openSourceActivity: Math.max(10, Math.round((rawScores.openSourceActivity ?? 50) * modifier)),
      projectDiversity: Math.max(10, Math.round((rawScores.projectDiversity ?? 65) * modifier)),
      codeConsistency: Math.max(10, Math.round((rawScores.codeConsistency ?? 70) * modifier)),
      evidenceConfidence: Math.max(10, Math.round((rawScores.evidenceConfidence ?? 75) * modifier))
    }
  };
}

/**
 * Calculates LinkedIn Intelligence Score
 */
export function calculateLinkedinScore(linkedinAnalysis, targetRole) {
  const defaultScores = {
    profileCompleteness: 75,
    recruiterVisibility: 70,
    keywordOptimization: 75,
    experienceCredibility: 80,
    skillConsistency: 75,
    resumeAlignment: 85,
    githubAlignment: 70,
    industryPositioning: 75,
    evidenceConfidence: 80
  };

  const rawScores = linkedinAnalysis?.scores || defaultScores;

  const weights = {
    profileCompleteness: 0.15,
    recruiterVisibility: 0.15,
    keywordOptimization: 0.15,
    experienceCredibility: 0.15,
    skillConsistency: 0.10,
    resumeAlignment: 0.10,
    githubAlignment: 0.10,
    industryPositioning: 0.05,
    evidenceConfidence: 0.05
  };

  let weightedSum = 0;
  Object.entries(weights).forEach(([key, w]) => {
    const val = Number(rawScores[key] ?? defaultScores[key] ?? 70);
    weightedSum += val * w;
  });

  const skills = linkedinAnalysis?.foundKws || [];
  const primary = detectPrimarySkillCategory(skills);
  const modifier = getRoleModifier(primary, targetRole);

  const finalScore = Math.max(15, Math.min(100, Math.round(weightedSum * modifier)));
  return {
    finalScore,
    categoryBreakdown: {
      profileCompleteness: Math.max(10, Math.round((rawScores.profileCompleteness ?? 75) * modifier)),
      recruiterVisibility: Math.max(10, Math.round((rawScores.recruiterVisibility ?? 70) * modifier)),
      keywordOptimization: Math.max(10, Math.round((rawScores.keywordOptimization ?? 75) * modifier)),
      experienceCredibility: Math.max(10, Math.round((rawScores.experienceCredibility ?? 80) * modifier)),
      skillConsistency: Math.max(10, Math.round((rawScores.skillConsistency ?? 75) * modifier)),
      resumeAlignment: Math.max(10, Math.round((rawScores.resumeAlignment ?? 85) * modifier)),
      githubAlignment: Math.max(10, Math.round((rawScores.githubAlignment ?? 70) * modifier)),
      industryPositioning: Math.max(10, Math.round((rawScores.industryPositioning ?? 75) * modifier)),
      evidenceConfidence: Math.max(10, Math.round((rawScores.evidenceConfidence ?? 80) * modifier))
    }
  };
}

/**
 * Calculates Job Match Score
 */
export function calculateJobMatchScore(jobMatchAnalysis, targetRole) {
  const defaultScores = {
    technicalMatch: 70,
    experienceMatch: 65,
    projectMatch: 65,
    keywordMatch: 70,
    skillMatch: 70,
    readinessScore: 65
  };

  const rawScores = jobMatchAnalysis?.scores || defaultScores;

  const weights = {
    technicalMatch: 0.20,
    experienceMatch: 0.20,
    projectMatch: 0.20,
    keywordMatch: 0.15,
    skillMatch: 0.15,
    readinessScore: 0.10
  };

  let weightedSum = 0;
  Object.entries(weights).forEach(([key, w]) => {
    const val = Number(rawScores[key] ?? defaultScores[key] ?? 65);
    weightedSum += val * w;
  });

  const skills = jobMatchAnalysis?.matchingSkills || [];
  const primary = detectPrimarySkillCategory(skills);
  const modifier = getRoleModifier(primary, targetRole);

  const finalScore = Math.max(10, Math.min(100, Math.round(weightedSum * modifier)));
  return {
    finalScore,
    categoryBreakdown: {
      technicalMatch: Math.max(10, Math.round((rawScores.technicalMatch ?? 70) * modifier)),
      experienceMatch: Math.max(10, Math.round((rawScores.experienceMatch ?? 65) * modifier)),
      projectMatch: Math.max(10, Math.round((rawScores.projectMatch ?? 65) * modifier)),
      keywordMatch: Math.max(10, Math.round((rawScores.keywordMatch ?? 70) * modifier)),
      skillMatch: Math.max(10, Math.round((rawScores.skillMatch ?? 70) * modifier)),
      readinessScore: Math.max(10, Math.round((rawScores.readinessScore ?? 65) * modifier))
    }
  };
}

/**
 * Calculates Project Gap Score
 */
export function calculateProjectGapScore(projectGapAnalysis, targetRole) {
  const defaultScores = {
    aiReadiness: 65,
    cloudReadiness: 60,
    saasReadiness: 60,
    architectureReadiness: 70,
    leadershipReadiness: 65,
    openSourceReadiness: 50
  };

  const rawScores = projectGapAnalysis?.scores || defaultScores;

  const weights = {
    aiReadiness: 0.15,
    cloudReadiness: 0.15,
    saasReadiness: 0.15,
    architectureReadiness: 0.20,
    leadershipReadiness: 0.15,
    openSourceReadiness: 0.20
  };

  let weightedSum = 0;
  Object.entries(weights).forEach(([key, w]) => {
    const val = Number(rawScores[key] ?? defaultScores[key] ?? 60);
    weightedSum += val * w;
  });

  const rawProjects = projectGapAnalysis?.recommendedProjects || [];
  const primary = rawProjects.length > 0 ? 'software_general' : 'fullstack';
  const modifier = getRoleModifier(primary, targetRole);

  const finalScore = Math.max(15, Math.min(100, Math.round(weightedSum * modifier)));
  return {
    finalScore,
    categoryBreakdown: {
      aiReadiness: Math.max(10, Math.round((rawScores.aiReadiness ?? 65) * modifier)),
      cloudReadiness: Math.max(10, Math.round((rawScores.cloudReadiness ?? 60) * modifier)),
      saasReadiness: Math.max(10, Math.round((rawScores.saasReadiness ?? 60) * modifier)),
      architectureReadiness: Math.max(10, Math.round((rawScores.architectureReadiness ?? 70) * modifier)),
      leadershipReadiness: Math.max(10, Math.round((rawScores.leadershipReadiness ?? 65) * modifier)),
      openSourceReadiness: Math.max(10, Math.round((rawScores.openSourceReadiness ?? 50) * modifier))
    }
  };
}

/**
 * Calculates the overall DevScope Intelligence Score
 */
export function calculateDevScopeScore(scores = {}) {
  const weights = {
    resume: 0.25,
    github: 0.25,
    linkedin: 0.15,
    jobMatch: 0.20,
    projectGap: 0.15
  };

  let weightedSum = 0;
  let activeWeightsSum = 0;

  Object.entries(weights).forEach(([key, w]) => {
    const score = scores[key];
    if (score !== null && score !== undefined) {
      weightedSum += Number(score) * w;
      activeWeightsSum += w;
    }
  });

  if (activeWeightsSum === 0) return null;
  return Math.round(weightedSum / activeWeightsSum);
}
