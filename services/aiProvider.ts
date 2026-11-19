import { generateWithGemini } from './gemini';
import { generateWithGrok } from './grok';
import { logger } from '@/lib/logger';

export interface AIResponse {
  _aiSource: 'GEMINI' | 'GROQ' | 'XAI' | 'FALLBACK';
  [key: string]: any;
}

export async function generateAIContent(
  prompt: string,
  options: { systemInstruction?: string; parseJson?: boolean; requestId?: string } = {}
): Promise<AIResponse> {
  const { requestId = 'ai-orchestrator', parseJson = true } = options;

  let result: any = null;
  let primaryError: any = null;

  // 1. Try Gemini
  try {
    const startTime = Date.now();
    result = await generateWithGemini(prompt, options);
    
    if (typeof result === 'object' && result !== null) {
      result._aiSource = 'GEMINI';
    } else {
      result = { _rawText: result, _aiSource: 'GEMINI' };
    }

    logger.info({
      requestId,
      action: 'aiProvider.gemini.success',
      duration: Date.now() - startTime,
      message: 'Successfully generated content with primary provider (Gemini).'
    });

    return result;
  } catch (err: any) {
    primaryError = err;
    logger.warn({
      requestId,
      action: 'aiProvider.gemini.failure',
      message: `Primary AI provider (Gemini) failed: ${err.message}. Switching to fallback.`
    });
  }

  // 2. Try the configured Groq or xAI fallback
  try {
    const startTime = Date.now();
    result = await generateWithGrok(prompt, options);
    const fallbackProvider = process.env.GROQ_API_KEY || process.env.XAI_API_KEY?.startsWith('gsk_')
      ? 'GROQ'
      : 'XAI';
    
    if (typeof result === 'object' && result !== null) {
      result._aiSource = fallbackProvider;
    } else {
      result = { _rawText: result, _aiSource: fallbackProvider };
    }

    logger.info({
      requestId,
      action: `aiProvider.${fallbackProvider.toLowerCase()}.success`,
      duration: Date.now() - startTime,
      message: `Successfully generated content with fallback provider (${fallbackProvider}).`
    });

    return result;
  } catch (err: any) {
    logger.error({
      requestId,
      action: 'aiProvider.fallback.failure',
      message: `Fallback AI provider failed: ${err.message}. No providers left.`
    });
    throw new Error(
      `Both AI providers failed. Gemini: ${primaryError?.message || 'unknown error'}. Fallback: ${err.message || 'unknown error'}.`
    );
  }
}
