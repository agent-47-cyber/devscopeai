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
  if (key.includes('your_')) return false;
  return true;
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
      console.log(`[geminiService] Gemini Request Started [Attempt ${attempt + 1}/${maxRetries}]`);
      const startTime = Date.now();
      const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (response.status === 429 || response.status === 503) {
        const errBody = await response.json().catch(() => ({}));
        const exactMsg = errBody.error?.message || 'temporary issue';
        lastError = new Error(response.status === 429 ? `Quota Exceeded: ${exactMsg}` : `Service Unavailable: ${exactMsg}`);
        console.warn(`[geminiService] Gemini Error ${response.status}, will retry:`, lastError.message);
        continue;
      }

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`[geminiService] Gemini Error ${response.status}:`, errorText.substring(0, 300));
        if (response.status === 401 || response.status === 403) {
          throw new Error('Invalid API Key or unauthorized access.');
        }
        throw new Error(`Gemini API Error ${response.status}: ${errorText.substring(0, 200)}`);
      }

      const duration = Date.now() - startTime;
      console.log(`[geminiService] Gemini Response Received in ${duration}ms`);

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
      console.error('[geminiService] Gemini Error during fetch:', err.message);
      lastError = err;
    }
  }

  console.error('[geminiService] Gemini Request Failed after all retries:', lastError?.message);
  throw lastError || new Error('Gemini generation failed.');
}

export default { generateWithGemini };
