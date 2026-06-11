import { generateWithGemini } from './geminiService.js';
import { Prompts } from './geminiPrompts.js';
import { createCandidateReportFallback } from './fallbackAnalysis.js';

export async function generateCandidateReport(resumeData, githubData, linkedinData, jobMatchData, projectGapData, targetRole = 'frontend') {
  try {
    const prompt = Prompts.candidateReport(resumeData, githubData, linkedinData, jobMatchData, projectGapData, targetRole);
    const systemInstruction = `You are a Principal Technical Recruiter preparing a flagship Candidate Intelligence Report.
Synthesize cross-platform evidence. DO NOT copy-paste from inputs — generate new holistic insights.
Target role: ${targetRole.toUpperCase()} engineer.
Provide your evaluation in strict JSON format only. No markdown, no extra text.`;

    const analysisResult = await generateWithGemini(prompt, { systemInstruction, parseJson: true, useCache: false });
    return analysisResult;
  } catch (err) {
    console.warn('[reportService] Gemini unavailable, using local fallback:', err.message);
    return createCandidateReportFallback(resumeData, githubData, linkedinData, jobMatchData, projectGapData);
  }
}
