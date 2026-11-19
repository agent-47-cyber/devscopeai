import { generateWithGemini } from './gemini';
import { generateWithGrok } from './grok';
import { logger } from '@/lib/logger';

export interface AIResponse {
  _aiSource: 'GEMINI' | 'GROQ' | 'FALLBACK';
  [key: string]: any;
}

export async function generateAIContent(
  prompt: string,
  options: { systemInstruction?: string; parseJson?: boolean; requestId?: string } = {}
): Promise<AIResponse> {
  const { requestId = 'ai-orchestrator', parseJson = true } = options;

  let result: any = null;
  let usedFallback = false;

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
    logger.warn({
      requestId,
      action: 'aiProvider.gemini.failure',
      message: `Primary AI provider (Gemini) failed: ${err.message}. Switching to fallback.`
    });
    usedFallback = true;
  }

  // 2. Try Grok (Fallback)
  try {
    const startTime = Date.now();
    result = await generateWithGrok(prompt, options);
    
    if (typeof result === 'object' && result !== null) {
      result._aiSource = 'GROQ';
    } else {
      result = { _rawText: result, _aiSource: 'GROQ' };
    }

    logger.info({
      requestId,
      action: 'aiProvider.groq.success',
      duration: Date.now() - startTime,
      message: 'Successfully generated content with fallback provider (Groq).'
    });

    return result;
  } catch (err: any) {
    logger.error({
      requestId,
      action: 'aiProvider.groq.failure',
      message: `Fallback AI provider (Groq) failed: ${err.message}. No providers left.`
    });
    throw new Error('Both Gemini and Groq providers failed to generate content.');
  }
}
