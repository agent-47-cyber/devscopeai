import { generateWithGemini } from './geminiService.js';
import { Prompts } from './geminiPrompts.js';
import { createProjectGapFallback } from './fallbackAnalysis.js';

export async function analyzeProjectGap(resumeData, githubData, linkedinData, targetRole = 'frontend') {
  try {
    const candidateProfile = {
      resumeData,
      githubData,
      linkedinData
    };

    const prompt = Prompts.projectGapAnalysis(candidateProfile, targetRole);
    const systemInstruction = `You are a Senior Engineering Manager and Career Coach advising a ${targetRole} engineer candidate on portfolio gaps.
Provide your evaluation in strict JSON format only. No markdown, no extra text.`;

    const analysisResult = await generateWithGemini(prompt, { systemInstruction, parseJson: true });
    analysisResult._aiSource = 'GEMINI';
    return analysisResult;
  } catch (err) {
    console.warn('[projectGapService] Gemini unavailable, using local fallback:', err.message);
    const fallbackResult = createProjectGapFallback({ resumeData, githubData, linkedinData }, targetRole);
    fallbackResult._aiSource = 'FALLBACK';
    return fallbackResult;
  }
}
