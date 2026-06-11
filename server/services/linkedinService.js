import { generateWithGemini } from './geminiService.js';
import { Prompts } from './geminiPrompts.js';
import { normalizeLinkedInProfile } from './linkedinProvider.js';
import { createLinkedinFallback } from './fallbackAnalysis.js';

export async function analyzeLinkedin(rawProfileData, resumeData, githubData, targetRole = 'frontend') {
  if (!rawProfileData) {
    throw new Error('LinkedIn profile data is required');
  }

  try {
    // 1. Normalize provider data via abstraction layer
    const normalizedProfile = normalizeLinkedInProfile(rawProfileData);

    // 2. Send to Gemini for Cross-Analysis
    const prompt = Prompts.linkedinAnalysis(normalizedProfile, resumeData, githubData, targetRole);
    const systemInstruction = `You are an Executive Tech Recruiter auditing a candidate's LinkedIn for a ${targetRole} engineering role.
Provide your evaluation in strict JSON format only. No markdown, no extra text.`;

    let analysisResult;
    try {
      analysisResult = await generateWithGemini(prompt, { systemInstruction, parseJson: true });
      analysisResult._aiSource = 'GEMINI';
    } catch (err) {
      console.warn('[linkedinService] Gemini unavailable, using local fallback:', err.message);
      analysisResult = createLinkedinFallback(normalizedProfile, resumeData, githubData);
      analysisResult._aiSource = 'FALLBACK';
    }

    return {
      source_data: normalizedProfile,
      analysis_result: analysisResult
    };

  } catch (err) {
    console.error('[linkedinService] Error analyzing LinkedIn:', err);
    throw err;
  }
}
