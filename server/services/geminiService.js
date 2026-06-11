// ============================================================
// geminiService.js — DevScope AI
// DO NOT freeze GEMINI_API_KEY at module load time.
// Always read from process.env at call time so Vercel
// serverless can inject env vars before the first request.
// ============================================================

// Working model: gemini-2.5-flash-lite has confirmed working quota on the free tier.
// gemini-2.0-flash and gemini-2.5-flash are rate-limited when quota is exhausted.
const GEMINI_API_URL_PRIMARY = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent';
const GEMINI_API_URL_FALLBACK = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite:generateContent';

// In-memory cache for completed Gemini requests
const geminiCache = new Map();
// In-memory cache for pending Gemini Promises (Deduplication)
const geminiPromiseCache = new Map();

/**
 * Prunes massive payloads down to essential skills, experience, and top projects.
 */
export function generateSummary(data) {
  if (!data) return null;
  // If it's a string, return a truncated version
  if (typeof data === 'string') return data.substring(0, 3000);

  const summary = {};
  
  if (data.skills) summary.skills = data.skills;
  if (data.foundKeywords) summary.foundKeywords = data.foundKeywords;
  
  // Resume specific
  if (data.experience) {
    summary.experience = Array.isArray(data.experience) 
      ? data.experience.map(e => ({ title: e.title, company: e.company, duration: e.duration, highlights: e.highlights?.slice(0, 2) })).slice(0, 3)
      : data.experience;
  }

  // GitHub specific
  if (data.topRepositories) {
    summary.repositories = data.topRepositories
      .sort((a, b) => (b.stars || 0) - (a.stars || 0))
      .slice(0, 5)
      .map(r => ({ name: r.name, description: r.description, language: r.language, stars: r.stars }));
  }
  if (data.topLanguages) summary.topLanguages = data.topLanguages;

  // LinkedIn specific
  if (data.headline) summary.headline = data.headline;
  if (data.about) summary.about = typeof data.about === 'string' ? data.about.substring(0, 500) : data.about;

  return summary;
}

/**
 * Validate whether the API key looks like a valid Gemini API key.
 */
function isValidGeminiKey(key) {
  if (!key || typeof key !== 'string') return false;
  if (key.includes('your_') || key.trim() === '') return false;
  // Must be at least 20 chars
  return key.length > 20;
}

/**
 * Extract JSON from a Gemini response that may contain markdown fences
 */
function extractJson(text) {
  // Remove markdown code fences
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
 * KEY FIX: Reads GEMINI_API_KEY at CALL TIME, not module load time.
 * This ensures Vercel serverless env injection works correctly.
 *
 * @param {string} prompt - The prompt to send to Gemini
 * @param {object} options - Optional settings (systemInstruction, parseJson, useCache)
 * @returns {Promise<any>}
 */
export async function generateWithGemini(prompt, options = {}) {
  const { systemInstruction = null, parseJson = true, useCache = true } = options;

  // === READ KEY AT CALL TIME (not module load time) ===
  const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

  console.log('[geminiService] GEMINI ENV DETECTED:', !!GEMINI_API_KEY, 'Key prefix:', GEMINI_API_KEY ? GEMINI_API_KEY.substring(0, 8) : 'NONE');

  if (!GEMINI_API_KEY) {
    console.error('[geminiService] GEMINI_API_KEY is missing from process.env');
    throw new Error('GEMINI_API_KEY is not configured in the environment.');
  }

  if (!isValidGeminiKey(GEMINI_API_KEY)) {
    console.error('[geminiService] GEMINI_API_KEY appears invalid. Length:', GEMINI_API_KEY.length);
    throw new Error(`GEMINI_API_KEY appears invalid. Check your Vercel env vars.`);
  }

  console.log('[geminiService] GEMINI CLIENT INITIALIZED — key length:', GEMINI_API_KEY.length  const cacheKey = Buffer.from(`${prompt.substring(0, 500)}_${systemInstruction || ''}`).toString('base64');

  if (useCache && geminiCache.has(cacheKey)) {
    console.log('[geminiService] Returning cached response');
    if (global.logAiUsage) global.logAiUsage(true, 0, null);
    return geminiCache.get(cacheKey);
  }

  if (useCache && geminiPromiseCache.has(cacheKey)) {
    console.log('[geminiService] Joining existing in-flight Gemini request...');
    return geminiPromiseCache.get(cacheKey);
  }

  const executor = async () => {
    const payload = {
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.4,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 4096, // Capped to reduce response time on Vercel
      }
    };

    if (systemInstruction) {
      payload.systemInstruction = { parts: [{ text: systemInstruction }] };
    }

    // Vercel serverless has a 10s timeout — use 1 retry with 0 delay
    // Local dev can use 3 retries with backoff
    const isVercel = !!process.env.VERCEL || process.env.NODE_ENV === 'production';
    const maxRetries = isVercel ? 1 : 3;

    let lastError = null;

    // Try primary model first (gemini-2.0-flash), then fallback model
    for (const apiUrl of [GEMINI_API_URL_PRIMARY, GEMINI_API_URL_FALLBACK]) {
      for (let attempt = 0; attempt < maxRetries; attempt++) {
        if (attempt > 0 && !isVercel) {
          const waitMs = 3000 * Math.pow(2, attempt - 1);
          console.log(`[geminiService] Retry attempt ${attempt}/${maxRetries - 1} after ${waitMs}ms...`);
          await new Promise(r => setTimeout(r, waitMs));
        }

        try {
          const modelName = apiUrl.includes('gemini-2.0-flash-exp') ? 'gemini-2.0-flash-exp' : 'gemini-2.0-flash';
          console.log(`[geminiService] GEMINI REQUEST STARTED — model: ${modelName}, attempt: ${attempt + 1}/${maxRetries}`);
          const startTime = Date.now();

          const response = await fetch(`${apiUrl}?key=${GEMINI_API_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          });

          const duration = Date.now() - startTime;

          if (response.status === 429) {
            const errBody = await response.json().catch(() => ({}));
            const exactMsg = errBody.error?.message || 'Rate limit exceeded';
            lastError = new Error(`Quota Exceeded (429) on ${modelName}: ${exactMsg}`);
            console.warn(`[geminiService] GEMINI ERROR 429 on ${modelName}:`, lastError.message);
            break; // Try next model
          }

          if (response.status === 503) {
            const errBody = await response.json().catch(() => ({}));
            lastError = new Error(`Service Unavailable (503): ${errBody.error?.message || 'Try again later'}`);
            console.warn(`[geminiService] GEMINI ERROR 503:`, lastError.message);
            continue; // Retry same model
          }

          if (response.status === 401 || response.status === 403) {
            const errBody = await response.json().catch(() => ({}));
            const msg = errBody.error?.message || 'Unauthorized';
            console.error(`[geminiService] GEMINI ERROR ${response.status} — Invalid API Key or unauthorized:`, msg);
            throw new Error(`Invalid API Key or unauthorized access (${response.status}): ${msg}`);
          }

          if (!response.ok) {
            const errorText = await response.text();
            console.error(`[geminiService] GEMINI ERROR ${response.status}:`, errorText.substring(0, 300));
            throw new Error(`Gemini API Error ${response.status}: ${errorText.substring(0, 200)}`);
          }

          console.log(`[geminiService] GEMINI RESPONSE RECEIVED in ${duration}ms`);
          
          const data = await response.json();
          const responseText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

          if (!responseText) {
            const finishReason = data.candidates?.[0]?.finishReason;
            throw new Error(`Gemini returned empty response. Finish reason: ${finishReason || 'unknown'}`);
          }

          if (global.logAiUsage) global.logAiUsage(false, duration, null);

          if (parseJson) {
            const parsedData = extractJson(responseText);
            if (useCache) geminiCache.set(cacheKey, parsedData);
            return parsedData;
          }

          if (useCache) geminiCache.set(cacheKey, responseText);
          return responseText;

        } catch (err) {
          if (err.message?.includes('Quota Exceeded') || err.message?.includes('429')) {
            lastError = err;
            break; // Try next model
          }
          console.error('[geminiService] GEMINI REQUEST FAILED:', err.message);
          lastError = err;
          if (global.logAiUsage) global.logAiUsage(false, 0, err.message);
          if (!err.message?.includes('503')) {
            throw err; // Don't retry on non-transient errors
          }
        }
      }
    }

    console.error('[geminiService] FALLBACK ACTIVATED — all Gemini models exhausted. Last error:', lastError?.message);
    if (global.logAiUsage && lastError) global.logAiUsage(false, 0, lastError.message);
    throw lastError || new Error('All Gemini models returned quota errors. Analysis running on fallback engine.');
  };

  const promise = executor().finally(() => {
    if (useCache) geminiPromiseCache.delete(cacheKey);
  });

  if (useCache) geminiPromiseCache.set(cacheKey, promise);
  return promise;
}

/**
 * Dedicated test function to verify Gemini connectivity.
 * Returns structured result for the debug endpoint.
 */
export async function testGeminiConnection() {
  const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
  const envDetected = !!GEMINI_API_KEY;
  const geminiInitialized = envDetected && isValidGeminiKey(GEMINI_API_KEY);

  if (!geminiInitialized) {
    return {
      envDetected,
      geminiInitialized: false,
      testCallSucceeded: false,
      model: 'gemini-2.0-flash',
      error: envDetected ? 'API key failed validation check' : 'GEMINI_API_KEY missing from environment',
      fallbackReason: envDetected ? 'Invalid key format' : 'No API key',
      rawResponse: null
    };
  }

  for (const [model, url] of [
    ['gemini-2.5-flash-lite', GEMINI_API_URL_PRIMARY],
    ['gemini-2.0-flash-lite', GEMINI_API_URL_FALLBACK],
  ]) {
    try {
      const res = await fetch(`${url}?key=${GEMINI_API_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: 'Reply only with:\nDEVSCOPE_GEMINI_OK' }] }],
          generationConfig: { maxOutputTokens: 10 }
        })
      });

      if (res.status === 429) {
        const errBody = await res.json().catch(() => ({}));
        return {
          envDetected: true,
          geminiInitialized: true,
          testCallSucceeded: false,
          model,
          error: `Quota Exceeded (429): ${errBody.error?.message || 'Free tier rate limit hit'}`,
          fallbackReason: 'Rate limit / Quota Exceeded — upgrade to pay-as-you-go billing to remove limits',
          rawResponse: null
        };
      }

      if (!res.ok) {
        const errText = await res.text();
        return {
          envDetected: true,
          geminiInitialized: true,
          testCallSucceeded: false,
          model,
          error: `HTTP ${res.status}: ${errText.substring(0, 150)}`,
          fallbackReason: `API returned error ${res.status}`,
          rawResponse: null
        };
      }

      const data = await res.json();
      const rawResponse = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '';

      return {
        envDetected: true,
        geminiInitialized: true,
        testCallSucceeded: true,
        model,
        error: null,
        fallbackReason: null,
        rawResponse
      };

    } catch (e) {
      return {
        envDetected: true,
        geminiInitialized: true,
        testCallSucceeded: false,
        model,
        error: e.message,
        fallbackReason: 'Network error reaching Gemini API',
        rawResponse: null
      };
    }
  }
}

export default { generateWithGemini, testGeminiConnection };
