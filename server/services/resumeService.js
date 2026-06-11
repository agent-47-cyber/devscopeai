import { generateWithGemini } from './geminiService.js';
import { Prompts } from './geminiPrompts.js';
import { createResumeFallback } from './fallbackAnalysis.js';

/**
 * Analyzes a resume using Gemini with role-awareness and cross-platform data.
 * Falls back to local analysis only if Gemini is unavailable.
 */
export async function analyzeResume(resumeText, targetRole = 'frontend', githubData = null, linkedinData = null) {
  if (!resumeText || resumeText.trim() === '') {
    throw new Error('Resume text cannot be empty');
  }

  const prompt = Prompts.resumeAnalysis(resumeText, targetRole, githubData, linkedinData);
  const systemInstruction = `You are a Principal Technical Recruiter and Career Strategist. 
Target role context: ${targetRole.toUpperCase()} engineer. 
Provide your evaluation in strict JSON format only. No markdown, no extra text.`;

  try {
    const analysisResult = await generateWithGemini(prompt, { systemInstruction, parseJson: true });
    analysisResult._aiSource = 'GEMINI';
    return analysisResult;
  } catch (err) {
    console.warn('[resumeService] Gemini unavailable, using local fallback:', err.message);
    const fallbackResult = createResumeFallback(resumeText, targetRole);
    fallbackResult._aiSource = 'FALLBACK';
    return fallbackResult;
  }
}
