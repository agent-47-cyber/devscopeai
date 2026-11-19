import { logger } from '@/lib/logger';
import { ExternalAPIError } from '@/lib/errors';

const GEMINI_API_URL_PRIMARY = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent';
const GEMINI_API_URL_FALLBACK = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite:generateContent';

function isValidGeminiKey(key: string | undefined): boolean {
  if (!key || typeof key !== 'string') return false;
  if (key.includes('your_') || key.trim() === '') return false;
  return key.length > 20;
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

  throw new Error('Could not extract valid JSON from Gemini response.');
}

export function generateSummary(data: any): any {
  if (!data) return null;
  if (typeof data === 'string') return data.substring(0, 3000);

  const summary: any = {};
  if (data.skills) summary.skills = data.skills;
  if (data.foundKeywords) summary.foundKeywords = data.foundKeywords;
  
  if (data.experience) {
    summary.experience = Array.isArray(data.experience) 
      ? data.experience.map((e: any) => ({
          title: e.title,
          company: e.company,
          duration: e.duration,
          highlights: e.highlights?.slice(0, 2)
        })).slice(0, 3)
      : data.experience;
  }

  if (data.topRepositories) {
    summary.repositories = data.topRepositories
      .sort((a: any, b: any) => (b.stars || 0) - (a.stars || 0))
      .slice(0, 5)
      .map((r: any) => ({
        name: r.name,
        description: r.description,
        language: r.language,
        stars: r.stars
      }));
  }
  if (data.topLanguages) summary.topLanguages = data.topLanguages;

  if (data.headline) summary.headline = data.headline;
  if (data.about) summary.about = typeof data.about === 'string' ? data.about.substring(0, 500) : data.about;

  return summary;
}

export async function generateWithGemini(
  prompt: string,
  options: { systemInstruction?: string; parseJson?: boolean; requestId?: string } = {}
): Promise<any> {
  const { systemInstruction = '', parseJson = true, requestId = 'gemini-call' } = options;
  const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

  if (!GEMINI_API_KEY || !isValidGeminiKey(GEMINI_API_KEY)) {
    throw new ExternalAPIError('GEMINI_KEY_ERROR', 'Gemini API key is not configured or is invalid.');
  }

  const payload: any = {
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    generationConfig: {
      temperature: 0.4,
      topK: 40,
      topP: 0.95,
      maxOutputTokens: 4096,
      ...(parseJson ? { responseMimeType: 'application/json' } : {})
    },
    safetySettings: [
      { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
      { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
      { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
      { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' }
    ]
  };

  if (systemInstruction) {
    payload.systemInstruction = { parts: [{ text: systemInstruction }] };
  }

  const urls = [GEMINI_API_URL_PRIMARY, GEMINI_API_URL_PRIMARY];
  let lastError: any = null;

  for (const url of urls) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30-second request timeout

    try {
      const startTime = Date.now();
      const response = await fetch(`${url}?key=${GEMINI_API_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      const duration = Date.now() - startTime;

      if (response.status === 429) {
        lastError = new Error('Quota Exceeded (429)');
        logger.warn({ requestId, action: 'gemini.call', message: 'Gemini rate limited (429)' });
        continue; // try next model URL
      }

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errText.substring(0, 200)}`);
      }

      const responseBody = await response.json();
      const text = responseBody.candidates?.[0]?.content?.parts?.[0]?.text || '';

      if (!text) {
        throw new Error('Gemini returned an empty response.');
      }

      logger.info({
        requestId,
        action: 'gemini.call',
        duration,
        message: 'Gemini request succeeded',
        meta: { url: url.split('/models/')[1]?.split(':')[0] }
      });

      if (parseJson) {
        try {
          return extractJson(text);
        } catch (jsonErr: any) {
          logger.error({
            requestId,
            action: 'gemini.json_parse_failed',
            rawText: text.substring(0, 1000),
            error: jsonErr.message
          });
          throw jsonErr;
        }
      }
      return text;

    } catch (err: any) {
      clearTimeout(timeoutId);
      lastError = err;
      logger.warn({
        requestId,
        action: 'gemini.call',
        message: `Gemini call failed or timed out: ${err.message}`
      });
    }
  }

  throw new ExternalAPIError('GEMINI_ERROR', `All Gemini endpoints failed: ${lastError?.message || 'Unknown error'}`);
}

export async function testGeminiConnection(): Promise<any> {
  const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
  const envDetected = !!GEMINI_API_KEY;
  const geminiInitialized = envDetected && isValidGeminiKey(GEMINI_API_KEY);

  if (!geminiInitialized) {
    return {
      envDetected,
      geminiInitialized: false,
      testCallSucceeded: false,
      error: 'GEMINI_API_KEY is missing or invalid.'
    };
  }

  try {
    const res = await generateWithGemini('Reply only with: DEVSCOPE_GEMINI_OK', { parseJson: false });
    return {
      envDetected: true,
      geminiInitialized: true,
      testCallSucceeded: res.trim() === 'DEVSCOPE_GEMINI_OK',
      rawResponse: res
    };
  } catch (e: any) {
    return {
      envDetected: true,
      geminiInitialized: true,
      testCallSucceeded: false,
      error: e.message
    };
  }
}
