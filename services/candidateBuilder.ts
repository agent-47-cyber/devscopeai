import { extractSkillsFromText, uniq } from './fallback';

export interface CandidateProfile {
  resume: {
    text: string;
    wordCount: number;
    detectedSkills: string[];
  } | null;
  github: {
    username: string;
    publicRepos: number;
    followers: number;
    topLanguages: string[];
    topRepositories: any[];
    bestRepository: any;
  } | null;
  linkedin: {
    headline: string;
    about: string;
    skills: string[];
    experience: any[];
    education: any[];
  } | null;
  job: any | null;
  targetRole: string;
  crossSignals: {
    allDetectedSkills: string[];
    skillsVerifiedAcrossCount: number;
  };
}

export function buildCandidateProfile(
  resumeText: string | null,
  githubData: any | null,
  linkedinData: any | null,
  targetRole = 'frontend',
  jobData: any | null = null
): CandidateProfile {
  const resume = resumeText ? {
    text: resumeText.substring(0, 10000), // safety truncate
    wordCount: resumeText.trim().split(/\s+/).length,
    detectedSkills: extractSkillsFromText(resumeText)
  } : null;

  const github = githubData ? {
    username: githubData.username || '',
    publicRepos: githubData.publicRepos || 0,
    followers: githubData.followers || 0,
    topLanguages: githubData.topLanguages || [],
    topRepositories: (githubData.topRepositories || [])
      .slice(0, 5)
      .map((r: any) => ({
        name: r.name,
        description: r.description,
        language: r.language,
        stars: r.stars,
        updated_at: r.updated_at
      })),
    bestRepository: githubData.bestRepository || null
  } : null;

  const linkedin = linkedinData ? {
    headline: linkedinData.headline || '',
    about: (linkedinData.about || '').substring(0, 1000), // safety truncate
    skills: linkedinData.skills || [],
    experience: (linkedinData.experience || []).slice(0, 5),
    education: (linkedinData.education || []).slice(0, 3)
  } : null;

  const allSkills = uniq([
    ...(resume?.detectedSkills || []),
    ...(github?.topLanguages || []),
    ...(linkedin?.skills || [])
  ]);

  return {
    resume,
    github,
    linkedin,
    job: jobData,
    targetRole,
    crossSignals: {
      allDetectedSkills: allSkills,
      skillsVerifiedAcrossCount: allSkills.filter(s => {
        let count = 0;
        if (resume?.detectedSkills.some((rs: string) => rs.toLowerCase() === s.toLowerCase())) count++;
        if (github?.topLanguages.some((gs: string) => gs.toLowerCase() === s.toLowerCase())) count++;
        if (linkedin?.skills.some((ls: string) => ls.toLowerCase() === s.toLowerCase())) count++;
        return count >= 2;
      }).length
    }
  };
}
export type { CandidateProfile as CandidateProfileType };
