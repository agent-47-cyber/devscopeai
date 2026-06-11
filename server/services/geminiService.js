import 'dotenv/config';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

// Working model: gemini-2.5-flash on v1beta
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';

// In-memory cache for Gemini requests to prevent redundant calls
const geminiCache = new Map();

/**
 * Validate whether the API key looks like a valid Gemini API key.
 * Gemini API keys start with "AIza" and are typically 39 characters.
 */
function isValidGeminiKey(key) {
  if (!key || typeof key !== 'string') return false;
  // Gemini keys start with AIza and are ~39 chars, OR could be longer newer format
  // They should NOT start with AQ., which is a different credential format
  if (key.startsWith('AQ.')) return false;
  if (key.startsWith('AIza')) return true;
  // Some newer keys may have different prefixes but be valid; allow if length >= 35 and no invalid prefix
  if (key.length >= 35 && !key.startsWith('AQ.') && !key.includes('your_')) return true;
  return false;
}

/**
 * Extract JSON from a Gemini response that may contain markdown fences
 */
function extractJson(text) {
  // Remove markdown code fences (```json ... ``` or ``` ... ```)
  let cleaned = text
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();

  try {
    return JSON.parse(cleaned);
  } catch (_) { }

  // Try to extract the first {...} block
  const start = cleaned.indexOf('{');
  const end = cleaned.lastIndexOf('}');
  if (start !== -1 && end !== -1 && end > start) {
    try {
      return JSON.parse(cleaned.substring(start, end + 1));
    } catch (_) { }
  }

  throw new Error('Could not extract valid JSON from Gemini response: ' + text.substring(0, 200));
}

/**
 * Helper to interact with Google Gemini API
 * @param {string} prompt - The prompt to send to Gemini
 * @param {object} options - Optional settings (systemInstruction, parseJson, useCache)
 * @returns {Promise<any>}
 */
export async function generateWithGemini(prompt, options = {}) {
  const { systemInstruction = null, parseJson = true, useCache = true } = options;

  if (!GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY is not configured in the environment.');
  }

  if (!isValidGeminiKey(GEMINI_API_KEY)) {
    throw new Error(
      `GEMINI_API_KEY appears invalid (starts with "${GEMINI_API_KEY.substring(0, 6)}"...). ` +
      `Gemini API keys should start with "AIza". Please update your .env file with a valid key from https://aistudio.google.com/`
    );
  }

  const cacheKey = Buffer.from(`${prompt.substring(0, 500)}_${systemInstruction || ''}`).toString('base64');

  if (useCache && geminiCache.has(cacheKey)) {
    console.log('[geminiService] Returning cached response');
    return geminiCache.get(cacheKey);
  }

  const payload = {
    contents: [
      {
        role: 'user',
        parts: [{ text: prompt }]
      }
    ],
    generationConfig: {
      temperature: 0.4,
      topK: 40,
      topP: 0.95,
      maxOutputTokens: 8192,
    }
  };

  if (systemInstruction) {
    payload.systemInstruction = {
      parts: [{ text: systemInstruction }]
    };
  }

  // Retry with exponential backoff for 429/503 temporary errors
  const maxRetries = Number(process.env.GEMINI_MAX_RETRIES || 3);
  let lastError = null;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    if (attempt > 0) {
      let waitMs = 0;
      const retryMatch = lastError?.message?.match(/retry in ([\d\.]+)s/i);
      if (retryMatch) {
        waitMs = Math.ceil(parseFloat(retryMatch[1]) * 1000) + 500;
      } else {
        const baseMs = lastError?.message?.includes('503') ? 5000 : 4000;
        waitMs = baseMs * Math.pow(2, attempt - 1);
      }
      console.log(`[geminiService] Retry attempt ${attempt}/${maxRetries - 1} after ${waitMs}ms...`);
      await new Promise(r => setTimeout(r, waitMs));
    }

    try {
      const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (response.status === 429 || response.status === 503) {
        const errBody = await response.json().catch(() => ({}));
        lastError = new Error(`Gemini ${response.status} (${response.status === 429 ? 'rate limit' : 'service unavailable'}): ${errBody.error?.message || 'temporary issue'}`);
        console.warn(`[geminiService] ${response.status} error, will retry:`, lastError.message);
        continue;
      }

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[geminiService] API Error:', response.status, errorText.substring(0, 300));
        throw new Error(`Gemini API Error ${response.status}: ${errorText.substring(0, 200)}`);
      }

      const data = await response.json();
      const responseText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

      if (!responseText) {
        const finishReason = data.candidates?.[0]?.finishReason;
        throw new Error(`Gemini returned empty response. Finish reason: ${finishReason || 'unknown'}`);
      }

      if (parseJson) {
        const parsedData = extractJson(responseText);
        if (useCache) geminiCache.set(cacheKey, parsedData);
        return parsedData;
      }

      if (useCache) geminiCache.set(cacheKey, responseText);
      return responseText;

    } catch (err) {
      if (err.message?.includes('rate limit') || err.message?.includes('429') ||
        err.message?.includes('503') || err.message?.includes('service unavailable')) {
        lastError = err;
        continue;
      }
      throw err;
    }
  }

  throw lastError || new Error('Gemini request failed after all retries');
}

export default { generateWithGemini };
