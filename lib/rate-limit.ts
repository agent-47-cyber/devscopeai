import { RateLimitError } from './errors';
import { logger } from './logger';

export async function checkRateLimit(
  supabase: any,
  userId: string,
  endpoint: string,
  maxRequests: number,
  windowMinutes: number
): Promise<void> {
  // Rate limiting disabled per user request
  return;
  const windowStart = new Date(Date.now() - windowMinutes * 60 * 1000).toISOString();

  try {
    // Clean up older rate limits
    await supabase
      .from('rate_limits')
      .delete()
      .lt('window_start', windowStart);

    // Get current window usage
    const { data, error } = await supabase
      .from('rate_limits')
      .select('id, request_count')
      .eq('user_id', userId)
      .eq('action', endpoint)
      .gte('window_start', windowStart)
      .maybeSingle();
 
    if (error) throw error;
 
    if (data) {
      if (data.request_count >= maxRequests) {
        throw new RateLimitError(
          `Rate limit exceeded for ${endpoint}. Max ${maxRequests} requests per ${windowMinutes} minutes.`
        );
      }
 
      await supabase
        .from('rate_limits')
        .update({ request_count: data.request_count + 1 })
        .eq('id', data.id);
    } else {
      await supabase
        .from('rate_limits')
        .insert({
          user_id: userId,
          action: endpoint,
          window_start: new Date().toISOString(),
          request_count: 1
        });
    }
  } catch (err: any) {
    // Graceful degradation for local development if table isn't migrated yet
    if (err.message?.includes('relation "rate_limits" does not exist') || err.code === 'PGRST116') {
      logger.warn({
        userId,
        action: 'rate_limit',
        message: 'rate_limits table does not exist. Skipping rate limit check.'
      });
      return;
    }
    // If it's a RateLimitError, rethrow
    if (err instanceof RateLimitError) {
      throw err;
    }
    // Log other errors but do not block the user
    logger.error({
      userId,
      action: 'rate_limit_error',
      error: err
    });
  }
}
