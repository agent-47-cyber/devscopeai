import { generateWithGemini, generateSummary } from './geminiService.js';
import { fallbackIntelligence } from './fallbackAnalysis.js';

export async function generateIntelligenceReport(resumeData, githubData, linkedinData, jobDescription, targetRole) {
  // Compress data heavily
  const compressedResume = generateSummary(resumeData);
  const compressedGithub = generateSummary(githubData);
  const compressedLinkedin = generateSummary(linkedinData);

  const systemInstruction = `You are DevScope AI, an elite Candidate Intelligence Engine.
You receive structured data about a candidate's Resume, GitHub, and LinkedIn, along with a Job Description and Target Role.
Your job is to generate a comprehensive, singular JSON output that covers Role Match, Project Gaps, and a final Candidate Report.

EXPECTED JSON SCHEMA:
{
  "jobMatch": {
    "matchScore": 85,
    "matchAnalysis": "Strong match for frontend, lacking some system design.",
    "roleFit": "High",
    "missingKeywords": ["AWS", "GraphQL"],
    "coreCompetencyGaps": ["Cloud Deployment"]
  },
  "projectGap": {
    "projectGapScore": 70,
    "missingProjectCategories": ["Authentication", "Microservices"],
    "recommendedProjects": [
      {
        "title": "Fullstack E-Commerce",
        "description": "Build an app using Stripe and AWS to prove cloud skills.",
        "technologies": ["React", "Node", "AWS", "Stripe"]
      }
    ],
    "portfolioRisks": ["No backend code visible"]
  },
  "candidateReport": {
    "executiveSummary": "Candidate demonstrates strong frontend foundations but lacks testing and CI/CD.",
    "overallCandidateRating": 82,
    "hireProbability": "75%",
    "recruiterConfidence": "High",
    "topStrengths": ["React Native", "UI Design"],
    "hiringRisks": ["Short tenures", "No testing experience"],
    "portfolioGaps": ["Backend architecture", "Testing"],
    "recruiterNotes": "Strong candidate for junior-mid, needs mentoring on testing.",
    "skillsVerificationMatrix": [
      {
        "skill": "React",
        "resumeEvidence": "Mentioned 3x",
        "githubEvidence": "Used in 4 repos",
        "linkedinEvidence": "Endorsed",
        "confidenceScore": 90,
        "verificationStatus": "Verified"
      }
    ],
    "technicalCompetency": {
      "frontend": 85,
      "backend": 40,
      "systemDesign": 50,
      "cloudAndDevops": 30,
      "aiAndMl": 20,
      "databases": 45,
      "testingAndQuality": 30
    },
    "hiringReadinessDetails": {
      "hiringReadiness": "Needs Portfolio Polish",
      "immediateStrengths": ["UI Design", "React"],
      "interviewRisks": ["System Design", "Testing"],
      "missingTechnologies": ["Jest", "AWS"],
      "missingExperienceAreas": ["CI/CD"]
    },
    "recommendedProjectsDetailed": [
      {
        "name": "Fullstack CRUD App",
        "whyItMatters": "Proves backend basics",
        "hiringImpact": "High",
        "scoreIncrease": 15,
        "difficulty": "Medium",
        "timeRequired": "2 Weeks"
      }
    ],
    "actionPlanTimeline": {
      "plan30Days": [{"task": "Learn Jest", "impact": "High Impact"}],
      "plan60Days": [{"task": "Build Fullstack CRUD", "impact": "High Impact"}],
      "plan90Days": [{"task": "Deploy to AWS", "impact": "High Impact"}]
    }
  }
}
Return ONLY valid JSON matching this exact structure. Do not wrap in markdown or add explanations.`;

  const prompt = `
TARGET ROLE: ${targetRole || 'Not provided'}
JOB DESCRIPTION: ${jobDescription || 'Not provided'}

--- CANDIDATE DATA ---
RESUME: ${JSON.stringify(compressedResume)}
GITHUB: ${JSON.stringify(compressedGithub)}
LINKEDIN: ${JSON.stringify(compressedLinkedin)}

Analyze this candidate holistically and generate the final Intelligence Report JSON.`;

  try {
    const result = await generateWithGemini(prompt, {
      systemInstruction,
      parseJson: true,
      useCache: false // Handled by our route layer
    });

    result._aiSource = 'GEMINI';
    return result;
  } catch (error) {
    console.error('[intelligenceEngine] Failed to generate report:', error.message);
    
    // Return a structured fallback if it completely fails
    const fallback = { ...fallbackIntelligence };
    fallback._aiSource = 'FALLBACK';
    return fallback;
  }
}
