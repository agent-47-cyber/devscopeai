import { withAuth } from '@/lib/auth';
import { responseBuilder } from '@/lib/response';
import { checkRateLimit } from '@/lib/rate-limit';

export const GET = withAuth(async (req, { user, supabase }) => {
  // Rate limit check
  await checkRateLimit(supabase, user.id, 'chat_history', 120, 60);

  const { data: historyResult } = await supabase
    .from('chat_histories')
    .select('messages')
    .eq('user_id', user.id)
    .maybeSingle();

  return responseBuilder.success(historyResult?.messages || []);
});
