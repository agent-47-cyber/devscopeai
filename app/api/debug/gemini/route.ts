import { withAuth } from '@/lib/auth';
import { responseBuilder } from '@/lib/response';
import { testGeminiConnection } from '@/services/gemini';

export const GET = withAuth(async (req, { user }) => {
  const result = await testGeminiConnection();
  return responseBuilder.success({
    message: 'Gemini connection check executed.',
    result
  });
});
