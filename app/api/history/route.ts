import { withAuth } from '@/lib/auth';
import { responseBuilder } from '@/lib/response';
import { checkRateLimit } from '@/lib/rate-limit';

export const GET = withAuth(async (req, { user, supabase }) => {
  // Rate limit check
  await checkRateLimit(supabase, user.id, 'history', 120, 60);

  const { data: analysis, error } = await supabase
    .from('analyses')
    .select('github_username, scores, github_data, resume_data, linkedin_data, linkedin_url, target_role, job_description, intelligence_data, provider, execution_time_ms, created_at, updated_at')
    .eq('user_id', user.id)
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!analysis) {
    return responseBuilder.success(null);
  }

  // Map rows to exactly match the frontend's expected properties
  const mappedAnalysis = {
    userId: user.id,
    githubUsername: analysis.github_username,
    scores: analysis.scores,
    githubData: analysis.github_data,
    resumeData: analysis.resume_data,
    linkedinData: analysis.linkedin_data,
    intelligenceData: analysis.intelligence_data,
    provider: analysis.provider,
    executionTimeMs: analysis.execution_time_ms,
    linkedinUsername: analysis.linkedin_url,
    targetRole: analysis.target_role,
    jobDescription: analysis.job_description || '',
    createdAt: analysis.created_at,
    updatedAt: analysis.updated_at
  };

  return responseBuilder.success(mappedAnalysis);
});
