import { responseBuilder } from '@/lib/response';

export async function GET() {
  const validKey = (key?: string) => Boolean(key && key.length > 20 && !key.includes('your_'));
  const hasGeminiKey = validKey(process.env.GEMINI_API_KEY);
  const hasGroqKey = validKey(process.env.GROQ_API_KEY);
  const hasXaiKey = validKey(process.env.XAI_API_KEY);
  const fallbackUsesGroq = hasGroqKey || Boolean(process.env.XAI_API_KEY?.startsWith('gsk_'));

  return responseBuilder.successEnvelope({
    status: hasGeminiKey || hasGroqKey || hasXaiKey ? 'configured' : 'missing-credentials',
    routing: 'Gemini primary; fallback only runs when Gemini fails.',
    primary: {
      provider: 'Gemini',
      models: ['gemini-3.5-flash-lite', 'gemini-3.1-flash-lite'],
      configured: hasGeminiKey
    },
    fallback: {
      provider: fallbackUsesGroq ? 'Groq' : hasXaiKey ? 'xAI' : 'Groq or xAI',
      model: fallbackUsesGroq
        ? process.env.GROQ_MODEL || 'openai/gpt-oss-20b'
        : process.env.XAI_MODEL || 'latest',
      configured: hasGroqKey || hasXaiKey
    },
    note: 'Credential presence is reported here. The provider shown on each dashboard analysis is the provider that actually returned that result.'
  });
}
