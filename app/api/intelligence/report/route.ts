import { withAuth } from '@/lib/auth';
import { responseBuilder } from '@/lib/response';
import { IntelligenceReportRequestSchema } from '@/lib/validation';
import { checkRateLimit } from '@/lib/rate-limit';

export const POST = withAuth(async (req, { user, supabase, requestId }) => {
  const body = await req.json().catch(() => ({}));
  const input = IntelligenceReportRequestSchema.parse(body);

  await checkRateLimit(supabase, user.id, 'intelligence_report', 60, 60);

  const { data: analysis, error } = await supabase
    .from('analyses')
    .select('intelligence_data, provider, execution_time_ms, updated_at')
    .eq('user_id', user.id)
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!analysis?.intelligence_data) {
    return responseBuilder.error(
      400,
      'MISSING_PROFILE_DATA',
      'No cached unified intelligence response exists yet. Start a new analysis first.'
    );
  }

  if (input.forceRefresh) {
    return responseBuilder.error(
      409,
      'NEW_ANALYSIS_REQUIRED',
      'Use the main analysis form to start a new unified AI request. Report tabs only read the cached response.'
    );
  }

  const provider = analysis.provider || analysis.intelligence_data._aiSource || 'UNKNOWN';
  const cachedIntelligence = {
    ...analysis.intelligence_data,
    _meta: {
      source: 'Cache',
      provider,
      timestamp: analysis.updated_at || analysis.intelligence_data._timestamp
    }
  };

  return responseBuilder.successEnvelope(cachedIntelligence, 200, {
    source: 'Cache',
    provider,
    executionTime: analysis.execution_time_ms || 0,
    fallbackUsed: provider === 'GROQ',
    requestId
  });
});
