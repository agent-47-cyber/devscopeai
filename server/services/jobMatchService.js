import { generateWithGemini } from './geminiService.js';
import { Prompts } from './geminiPrompts.js';
import { createJobMatchFallback } from './fallbackAnalysis.js';

export async function analyzeJobMatch(userId, jobDescription, resumeData, githubData, linkedinData, targetRole = 'frontend') {
  try {
    const candidateProfile = {
      resumeData,
      githubData,
      linkedinData
    };

    const prompt = Prompts.jobMatch(jobDescription, candidateProfile, targetRole);
    const systemInstruction = `You are an ATS System and Technical Hiring Manager evaluating a ${targetRole} engineer candidate.
Provide your evaluation in strict JSON format only. No markdown, no extra text.`;

    const analysisResult = await generateWithGemini(prompt, { systemInstruction, parseJson: true });
    analysisResult._aiSource = 'GEMINI';
    return analysisResult;
  } catch (err) {
    console.warn('[jobMatchService] Gemini unavailable, using local fallback:', err.message);
    const fallbackResult = createJobMatchFallback(jobDescription, { resumeData, githubData, linkedinData }, targetRole);
    fallbackResult._aiSource = 'FALLBACK';
    return fallbackResult;
  }
}
