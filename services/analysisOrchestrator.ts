import crypto from 'crypto';
import { analyzeGithub } from './github';
import { fetchLinkedinRawProfile, analyzeLinkedin } from './linkedin';
import { normalizeLinkedInProfile } from './linkedinProvider';
import { buildCandidateProfile } from './candidateBuilder';
import { generateAIContent } from './aiProvider';
import { Prompts } from './prompts';
import { parseJobDescription, parseLinkedinText } from './jobParser';
import { logger } from '@/lib/logger';
import { ExternalAPIError, ValidationError } from '@/lib/errors';
import {
  calculateResumeScore,
  calculateGithubScore,
  calculateLinkedinScore,
  calculateJobMatchScore,
  calculateProjectGapScore,
  calculateDevScopeScore
} from './scoring';

export interface OrchestratorInput {
  userId: string;
  resumeText?: string | null;
  githubUsername?: string | null;
  linkedinUsername?: string | null;
  linkedinText?: string | null;
  jobDescription?: string | null;
  targetRole: string;
  forceRefresh: boolean;
  resumeFilePath?: string | null; // Pass file path to delete it afterwards
}

export async function runAnalysisOrchestration(
  input: OrchestratorInput,
  supabase: any,
  requestId = 'orchestrator'
): Promise<any> {
  const { userId, resumeText, githubUsername, linkedinUsername, linkedinText, jobDescription, targetRole, forceRefresh, resumeFilePath } = input;

  // 1. Calculate input hashes for cache checks
  const resumeHash = resumeText ? crypto.createHash('md5').update(resumeText + targetRole).digest('hex') : null;
  const githubHash = githubUsername ? crypto.createHash('md5').update(githubUsername + targetRole).digest('hex') : null;
  const linkedinHash = (linkedinUsername || linkedinText) ? crypto.createHash('md5').update((linkedinUsername || linkedinText || '') + targetRole).digest('hex') : null;
  const jobHash = jobDescription ? crypto.createHash('md5').update(jobDescription + targetRole).digest('hex') : null;

  // 2. Cache check
  if (!forceRefresh) {
    try {
      const { data: cached } = await supabase
        .from('analyses')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (cached) {
        const resumeMatch = !resumeHash || cached.resume_hash === resumeHash;
        const githubMatch = !githubHash || cached.github_hash === githubHash;
        const linkedinMatch = !linkedinHash || cached.linkedin_hash === linkedinHash;
        const jobMatch = !jobHash || cached.job_hash === jobHash;
        const roleMatch = cached.target_role === targetRole;

        if (resumeMatch && githubMatch && linkedinMatch && jobMatch && roleMatch) {
          logger.info({
            requestId,
            userId,
            action: 'orchestrator.cache',
            message: 'Cache HIT for user analyses.'
          });
          
          // Delete temporary uploaded file if any (since we are serving cache)
          if (resumeFilePath) {
            await supabase.storage.from('resumes').remove([resumeFilePath]);
            logger.info({ requestId, userId, action: 'orchestrator.cleanup', message: 'Cleaned up temporary uploaded resume on cache HIT.' });
          }

          return cached;
        }
      }
    } catch (e: any) {
      logger.warn({
        requestId,
        userId,
        action: 'orchestrator.cache',
        message: `Failed to check analyses cache: ${e.message}`
      });
    }
  }

  logger.info({
    requestId,
    userId,
    action: 'orchestrator.run',
    message: 'Cache MISS or force refresh. Running parallel fetches...'
  });

  // 3. Parallel fetch of profile data
  let githubProfile: any = null;
  let linkedinProfile: any = linkedinText ? parseLinkedinText(linkedinText, targetRole) : null;
  let linkedinFetchError: any = null;
  const jobProfile = parseJobDescription(jobDescription || '', targetRole);

  const fetchPromises: Promise<any>[] = [];

  if (githubUsername) {
    fetchPromises.push(
      analyzeGithub(githubUsername, targetRole, null, supabase, requestId, true)
        .then(data => { githubProfile = data; })
        .catch(err => {
          logger.warn({ requestId, userId, action: 'orchestrator.github', message: `GitHub fetch failed: ${err.message}` });
        })
    );
  }

  if (linkedinUsername && !linkedinText) {
    fetchPromises.push(
      fetchLinkedinRawProfile(linkedinUsername, targetRole, supabase, requestId)
        .then(raw => { linkedinProfile = normalizeLinkedInProfile(raw); })
        .catch(err => {
          linkedinFetchError = err;
          logger.warn({ requestId, userId, action: 'orchestrator.linkedin', message: `LinkedIn fetch failed: ${err.message}` });
        })
    );
  }

  await Promise.allSettled(fetchPromises);

  if (linkedinUsername && !linkedinText && !linkedinProfile) {
    throw new ExternalAPIError(
      'LINKEDIN_PROFILE_UNAVAILABLE',
      linkedinFetchError?.message || 'LinkedIn profile data could not be fetched. Upload a LinkedIn profile PDF export instead.'
    );
  }

  // 4. Build single consolidated candidate profile
  const candidate = buildCandidateProfile(resumeText || null, githubProfile, linkedinProfile, targetRole, jobProfile);

  // 5. Trigger ONE unified AI request
  const prompt = Prompts.unifiedAnalysis(candidate, targetRole, jobDescription || '');
  const systemInstruction = `You are a Staff Engineer and Principal Technical Recruiter.
Evaluate the candidate's unified profile data. Provide your evaluation in strict JSON format only. No markdown, no extra text.`;

  logger.info({
    requestId,
    userId,
    action: 'orchestrator.ai',
    message: 'Calling single unified AI analyzer...'
  });

  let geminiResult: any;
  const aiStart = Date.now();
  try {
    geminiResult = await generateAIContent(prompt, { systemInstruction, parseJson: true, requestId });
  } catch (err: any) {
    logger.error({
      requestId,
      userId,
      action: 'orchestrator.ai_failed',
      error: err
    });
    
    // GUARANTEE CLEANUP ON FAILURE
    if (resumeFilePath) {
      await supabase.storage.from('resumes').remove([resumeFilePath]).catch(() => {});
    }

    throw new ExternalAPIError('UNIFIED_AI_FAILED', `Unified analysis failed: ${err.message}`);
  }

  if (!geminiResult || typeof geminiResult !== 'object') {
    throw new ExternalAPIError('UNIFIED_AI_INVALID', 'AI provider returned invalid or empty analysis.');
  }
  const provider = geminiResult._aiSource || 'GEMINI';
  const executionTime = Date.now() - aiStart;

  // 6. Run Server-Side scoring engine deterministically
  const resumeScoreInfo = calculateResumeScore(geminiResult.resume, targetRole);
  const githubScoreInfo = calculateGithubScore(geminiResult.github, targetRole);
  const linkedinScoreInfo = calculateLinkedinScore(geminiResult.linkedin, targetRole);
  const jobMatchScoreInfo = calculateJobMatchScore(geminiResult.jobMatch, targetRole);
  const projectGapScoreInfo = calculateProjectGapScore(geminiResult.projectGap, targetRole);

  const scoresBreakdown = {
    resume: resumeScoreInfo.finalScore,
    github: githubScoreInfo.finalScore,
    linkedin: linkedinScoreInfo.finalScore,
    jobMatch: jobMatchScoreInfo.finalScore,
    projectGap: projectGapScoreInfo.finalScore
  };

  const devScopeScore = calculateDevScopeScore(scoresBreakdown);

  const finalScores = {
    overall: devScopeScore,
    ats: resumeScoreInfo.finalScore,
    github: githubScoreInfo.finalScore,
    careerReady: linkedinScoreInfo.finalScore,
    jobMatch: jobMatchScoreInfo.finalScore,
    projectGap: projectGapScoreInfo.finalScore,
    resumeDetails: resumeScoreInfo,
    githubDetails: githubScoreInfo,
    linkedinDetails: linkedinScoreInfo,
    jobMatchDetails: jobMatchScoreInfo,
    projectGapDetails: projectGapScoreInfo
  };

  // 7. Format output blocks to match frontend expectations
  const sourceResumeText = resumeText || '';
  const resumeSectionsChecklist = {
    contact: /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}|\+?\d[\d\s().-]{7,}|linkedin\.com|github\.com/i.test(sourceResumeText),
    summary: /\b(summary|profile|objective)\b/i.test(sourceResumeText),
    experience: /\b(experience|employment|work history|internship)\b/i.test(sourceResumeText),
    projects: /\b(projects?|portfolio|open source)\b/i.test(sourceResumeText),
    education: /\b(education|degree|university|college|bachelor|master|phd)\b/i.test(sourceResumeText),
    skills: /\b(skills?|technologies|tools|frameworks|technical proficiency)\b/i.test(sourceResumeText)
  };
  const resumeFoundKeywords = geminiResult.resume?.keywordAnalysis?.found || [];
  const resumeMissingKeywords = geminiResult.resume?.keywordAnalysis?.missing || [];
  const actionVerbCount = new Set(
    ['built', 'created', 'developed', 'implemented', 'designed', 'led', 'optimized', 'deployed', 'improved', 'managed', 'analyzed', 'collaborated']
      .filter((verb) => new RegExp(`\\b${verb}\\b`, 'i').test(sourceResumeText))
  ).size;
  const sectionCount = Object.values(resumeSectionsChecklist).filter(Boolean).length;
  const resumeUiBreakdown = {
    sectionScore: Math.round((sectionCount / Object.keys(resumeSectionsChecklist).length) * 25),
    keywordScore: resumeFoundKeywords.length + resumeMissingKeywords.length > 0
      ? Math.round((resumeFoundKeywords.length / (resumeFoundKeywords.length + resumeMissingKeywords.length)) * 35)
      : 0,
    verbScore: Math.min(20, Math.round((actionVerbCount / 8) * 20)),
    contactScore: resumeSectionsChecklist.contact ? 5 : 0
  };
  const formattedResumeData = geminiResult.resume ? {
    ...geminiResult.resume,
    atsScore: resumeScoreInfo.finalScore,
    score: resumeScoreInfo.finalScore,
    strengths: geminiResult.resume.strengths || [],
    weaknesses: geminiResult.resume.weaknesses || [],
    foundKeywords: resumeFoundKeywords,
    missingKeywords: resumeMissingKeywords,
    sectionsChecklist: resumeSectionsChecklist,
    scoreBreakdown: { ...geminiResult.resume.scoreBreakdown, ...resumeUiBreakdown },
    actionVerbCount,
    hasQuantification: /(?:\d+\s?%|\$\s?\d|\b\d{2,}\+?\s?(?:users|customers|clients|requests|records|employees|projects|hours|days|weeks|months)\b)/i.test(sourceResumeText),
    recommendations: geminiResult.resume.improvementOpportunities || [],
    suggestions: geminiResult.resume.improvementOpportunities || [],
    jobReadiness: geminiResult.resume.jobReadiness || 'Junior',
    recruiterNotes: geminiResult.resume.recruiterNotes || '',
    wordCount: resumeText?.trim().split(/\s+/).filter(Boolean).length || 0,
    _hash: resumeHash,
    _timestamp: new Date().toISOString(),
    _aiSource: provider,
    _meta: { source: provider, timestamp: new Date().toISOString() }
  } : null;

  const formattedGithubData = geminiResult.github ? {
    ...geminiResult.github,
    score: githubScoreInfo.finalScore,
    codePortfolioStrength: githubScoreInfo.finalScore,
    username: githubUsername || '',
    publicRepos: githubProfile?.publicRepos || 0,
    repoCount: githubProfile?.publicRepos || 0,
    followers: githubProfile?.followers || 0,
    languages: githubProfile?.topLanguages?.map((name: string) => ({ name })) || [],
    topRepositories: githubProfile?.topRepositories || [],
    topRepos: githubProfile?.topRepositories || [],
    bestRepository: geminiResult.github.bestRepositoryDeepAnalysis?.repositoryName || githubProfile?.bestRepository?.name || '',
    _hash: githubHash,
    _timestamp: new Date().toISOString(),
    _aiSource: provider,
    _meta: { source: provider, timestamp: new Date().toISOString() }
  } : null;

  const formattedLinkedinData = geminiResult.linkedin ? {
    ...geminiResult.linkedin,
    score: linkedinScoreInfo.finalScore,
    careerReadinessScore: linkedinScoreInfo.finalScore,
    username: linkedinUsername || '',
    url: linkedinUsername ? `https://www.linkedin.com/in/${linkedinUsername}` : '',
    headline: linkedinProfile?.headline || geminiResult.linkedin.suggestedHeadline || '',
    summary: linkedinProfile?.about || geminiResult.linkedin.experienceReview || '',
    about: linkedinProfile?.about || geminiResult.linkedin.headlineAnalysis || '',
    profileCompletion: 80,
    networkingScore: 75,
    skills: linkedinProfile?.skills || [],
    foundKws: geminiResult.linkedin.linkedinStrengths || [],
    missingKws: geminiResult.linkedin.linkedinWeaknesses || [],
    suggestions: geminiResult.linkedin.profileOptimizationSuggestions || [],
    _hash: linkedinHash,
    _timestamp: new Date().toISOString(),
    _aiSource: provider,
    _meta: { source: provider, timestamp: new Date().toISOString() }
  } : null;

  const formattedIntelligenceData = {
    jobMatch: {
      ...geminiResult.jobMatch,
      matchScore: jobMatchScoreInfo.finalScore,
      scores: jobMatchScoreInfo.categoryBreakdown
    },
    projectGap: {
      ...geminiResult.projectGap,
      projectGapScore: projectGapScoreInfo.finalScore,
      scores: projectGapScoreInfo.categoryBreakdown
    },
    candidateReport: {
      ...geminiResult.candidateReport,
      overallCandidateRating: devScopeScore,
      hireProbability: `${Math.min(95, (devScopeScore || 60) + 10)}%`,
      technicalCompetency: geminiResult.candidateReport?.technicalCompetency || {
        frontend: devScopeScore || 60,
        backend: devScopeScore || 60,
        systemDesign: devScopeScore || 60,
        cloudAndDevops: devScopeScore || 60,
        aiAndMl: devScopeScore || 60,
        databases: devScopeScore || 60,
        testingAndQuality: devScopeScore || 60
      }
    },
    _hash: crypto.createHash('md5').update((resumeHash || '') + (githubHash || '') + (linkedinHash || '') + (jobHash || '') + targetRole).digest('hex'),
    _timestamp: new Date().toISOString(),
    _aiSource: provider,
    _meta: { source: provider, timestamp: new Date().toISOString() }
  };

  const finalRecord = {
    user_id: userId,
    target_role: targetRole,
    resume_hash: resumeHash,
    github_hash: githubHash,
    linkedin_hash: linkedinHash,
    job_hash: jobHash,
    job_description: jobDescription || '',
    github_username: githubUsername || '',
    linkedin_url: linkedinUsername ? `https://www.linkedin.com/in/${linkedinUsername}` : '',
    resume_data: formattedResumeData,
    github_data: formattedGithubData,
    linkedin_data: formattedLinkedinData,
    intelligence_data: formattedIntelligenceData,
    candidate_data: candidate,
    gemini_analysis: geminiResult,
    provider,
    execution_time_ms: executionTime,
    status: 'completed',
    scores: finalScores,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  // 8. Store results in Database
  await supabase
    .from('analyses')
    .upsert(finalRecord, { onConflict: 'user_id' });

  logger.info({
    requestId,
    userId,
    action: 'orchestrator.save',
    message: 'Consolidated analyses record saved successfully.'
  });

  // 9. Delete temporary uploaded PDF resume
  if (resumeFilePath) {
    try {
      const { error: removeError } = await supabase.storage
        .from('resumes')
        .remove([resumeFilePath]);
      
      if (removeError) throw removeError;

      logger.info({
        requestId,
        userId,
        action: 'orchestrator.cleanup',
        message: `Successfully deleted temporary resume file: ${resumeFilePath}`
      });
    } catch (err: any) {
      logger.warn({
        requestId,
        userId,
        action: 'orchestrator.cleanup',
        message: `Failed to delete temporary resume file: ${err.message}`
      });
    }
  }

  return finalRecord;
}
