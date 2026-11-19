import { withAuth } from '@/lib/auth';
import { responseBuilder } from '@/lib/response';
import { UnifiedAnalyzeSchema } from '@/lib/validation';
import { runAnalysisOrchestration } from '@/services/analysisOrchestrator';
import { checkRateLimit } from '@/lib/rate-limit';

export const POST = withAuth(async (req, { user, supabase, requestId }) => {
  const body = await req.json().catch(() => ({}));
  
  // 1. Zod input validation
  const input = UnifiedAnalyzeSchema.parse(body);

  if (input.linkedinUsername) {
    return responseBuilder.error(
      400,
      'LINKEDIN_URL_LOOKUP_RETIRED',
      'LinkedIn URL lookup is no longer available. Upload a LinkedIn profile PDF export to analyze actual profile content.'
    );
  }

  if (!input.resumeText && !input.githubUsername && !input.linkedinText) {
    return responseBuilder.error(
      400,
      'MISSING_ANALYSIS_INPUT',
      'Provide a resume, GitHub username, or LinkedIn PDF text before starting analysis.'
    );
  }

  // 2. Rate limiting check (10 requests per hour per user)
  await checkRateLimit(supabase, user.id, 'analyze', 10, 60);

  // 3. Run Orchestrator
  const result = await runAnalysisOrchestration(
    {
      userId: user.id,
      resumeText: input.resumeText,
      githubUsername: input.githubUsername,
      linkedinUsername: input.linkedinUsername,
      linkedinText: input.linkedinText,
      jobDescription: input.jobDescription,
      targetRole: input.targetRole,
      forceRefresh: input.forceRefresh,
      resumeFilePath: body.resumeFilePath // optional path to delete temporary resume from storage
    },
    supabase,
    requestId
  );

  return responseBuilder.success(result);
});
