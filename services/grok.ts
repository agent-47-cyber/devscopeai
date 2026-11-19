import { logger } from '@/lib/logger';
import { ExternalAPIError } from '@/lib/errors';

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

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
  const GROQ_API_KEY = process.env.GROQ_API_KEY || process.env.XAI_API_KEY;
  const GROQ_MODEL = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';

  if (!GROQ_API_KEY || !isValidGrokKey(GROQ_API_KEY)) {
    throw new ExternalAPIError('GROQ_KEY_ERROR', 'Groq API key is not configured or is invalid.');
  }

  const messages = [];
  if (systemInstruction) {
    messages.push({ role: 'system', content: systemInstruction });
  }
  messages.push({ role: 'user', content: prompt });

  const payload = {
    model: GROQ_MODEL,
    messages,
    temperature: 0.4,
    response_format: parseJson ? { type: 'json_object' } : undefined,
  };

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 12000); // 12-second timeout

  try {
    const startTime = Date.now();
    const response = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${GROQ_API_KEY}`
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
      message: 'Groq request succeeded',
      meta: { model: GROQ_MODEL }
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
      message: `Groq call failed or timed out: ${err.message}`
    });
    throw new ExternalAPIError('GROQ_ERROR', `Groq failed: ${err.message}`);
  }
}
