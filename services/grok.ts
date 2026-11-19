import { logger } from '@/lib/logger';
import { ExternalAPIError } from '@/lib/errors';

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const XAI_API_URL = 'https://api.x.ai/v1/chat/completions';

function isValidGrokKey(key: string | undefined): boolean {
  if (!key || typeof key !== 'string') return false;
  if (key.includes('your_') || key.trim() === '') return false;
  return key.length > 20; // xAI keys are typically long strings
}

function extractJson(text: string): any {
  let cleaned = text
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();

  try {
    return JSON.parse(cleaned);
  } catch (_) {}

  const start = cleaned.indexOf('{');
  const end = cleaned.lastIndexOf('}');
  if (start !== -1 && end !== -1 && end > start) {
    try {
      return JSON.parse(cleaned.substring(start, end + 1));
    } catch (_) {}
  }

  throw new Error('Could not extract valid JSON from Grok response.');
}

export async function generateWithGrok(
  prompt: string,
  options: { systemInstruction?: string; parseJson?: boolean; requestId?: string } = {}
): Promise<any> {
  const { systemInstruction = '', parseJson = true, requestId = 'grok-call' } = options;
  const GROQ_API_KEY = process.env.GROQ_API_KEY;
  const XAI_API_KEY = process.env.XAI_API_KEY;
  // Some local setups historically stored a Groq `gsk_` key under XAI_API_KEY.
  // Route by the key's provider when the dedicated Groq variable is absent.
  const legacyKeyIsGroq = Boolean(XAI_API_KEY?.startsWith('gsk_'));
  const useGroq = Boolean(GROQ_API_KEY) || legacyKeyIsGroq;
  const apiKey = GROQ_API_KEY || XAI_API_KEY;
  const apiUrl = useGroq ? GROQ_API_URL : XAI_API_URL;
  const model = useGroq
    ? (process.env.GROQ_MODEL || 'openai/gpt-oss-20b')
    : (process.env.XAI_MODEL || 'latest');

  if (!apiKey || !isValidGrokKey(apiKey)) {
    throw new ExternalAPIError('GROK_KEY_ERROR', 'Neither a valid GROQ_API_KEY nor XAI_API_KEY is configured.');
  }

  const messages = [];
  if (systemInstruction) {
    messages.push({ role: 'system', content: systemInstruction });
  }
  messages.push({ role: 'user', content: prompt });

  const payload = {
    model,
    messages,
    temperature: 0.4,
    response_format: parseJson ? { type: 'json_object' } : undefined,
  };

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000); // 30-second timeout

  try {
    const startTime = Date.now();
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify(payload),
      signal: controller.signal
    });

    clearTimeout(timeoutId);
    const duration = Date.now() - startTime;

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errText.substring(0, 200)}`);
    }

    const responseBody = await response.json();
    const text = responseBody.choices?.[0]?.message?.content || '';

    if (!text) {
      throw new Error('Grok returned an empty response.');
    }

    logger.info({
      requestId,
      action: 'groq.call',
      duration,
      message: `${useGroq ? 'Groq' : 'xAI'} request succeeded`,
      meta: { model }
    });

    if (parseJson) {
      return extractJson(text);
    }
    return text;

  } catch (err: any) {
    clearTimeout(timeoutId);
    logger.warn({
      requestId,
      action: 'groq.call',
      message: `${useGroq ? 'Groq' : 'xAI'} call failed or timed out: ${err.message}`
    });
    throw new ExternalAPIError(useGroq ? 'GROQ_ERROR' : 'XAI_ERROR', `${useGroq ? 'Groq' : 'xAI'} failed: ${err.message}`);
  }
}
