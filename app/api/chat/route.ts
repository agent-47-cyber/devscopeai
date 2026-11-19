import { withAuth } from '@/lib/auth';
import { responseBuilder } from '@/lib/response';
import { ChatRequestSchema } from '@/lib/validation';
import { processChatMessage } from '@/services/chat';
import { checkRateLimit } from '@/lib/rate-limit';

export const POST = withAuth(async (req, { user, supabase, requestId }) => {
  const body = await req.json().catch(() => ({}));
  const input = ChatRequestSchema.parse(body);

  // Rate limit check (60 messages per hour per user)
  await checkRateLimit(supabase, user.id, 'chat', 60, 60);

  // Fetch the analyses record to retrieve context
  const { data: analysis } = await supabase
    .from('analyses')
    .select('github_data, resume_data, linkedin_data, scores, target_role')
    .eq('user_id', user.id)
    .maybeSingle();

  const userMessageObj = input.messages[input.messages.length - 1];
  const responseText = processChatMessage(userMessageObj.content, analysis);

  const assistantMsg = {
    role: 'assistant',
    content: responseText,
    timestamp: new Date()
  };

  const userMsg = {
    role: 'user',
    content: userMessageObj.content,
    timestamp: new Date()
  };

  // Fetch and update chat history
  const { data: historyData } = await supabase
    .from('chat_histories')
    .select('messages')
    .eq('user_id', user.id)
    .maybeSingle();

  const existingMessages = historyData?.messages || [];
  const newMessages = [...existingMessages, userMsg, assistantMsg];

  await supabase
    .from('chat_histories')
    .upsert({
      user_id: user.id,
      messages: newMessages,
      updated_at: new Date().toISOString()
    }, { onConflict: 'user_id' });

  return responseBuilder.success(assistantMsg);
});
