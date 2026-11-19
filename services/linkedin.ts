import { generateAIContent } from './aiProvider';
import { Prompts } from './prompts';
import { normalizeLinkedInProfile } from './linkedinProvider';
import { logger } from '@/lib/logger';
import fs from 'fs';
import path from 'path';

export async function fetchLinkedinRawProfile(
  slug: string,
  targetRole: string,
  supabase: any,
  requestId: string
): Promise<any> {
  const rapidApiKey = process.env.RAPIDAPI_KEY;
  const rapidApiHost = process.env.RAPIDAPI_HOST;
  const rapidApiUrl = process.env.RAPIDAPI_URL;
  const linkedinUrl = `https://www.linkedin.com/in/${slug}`;

  let rawProfileData = null;
  let providerFailure = '';

  // Check for force live request flag (could be passed in params, defaulting to false for safety)
  const forceLive = process.env.RAPIDAPI_FORCE_LIVE === 'true';

  if (!forceLive) {
    try {
      const fixturePath = path.join(process.cwd(), 'linkedin-fixture.json');
      if (fs.existsSync(fixturePath)) {
        const fixtureData = JSON.parse(fs.readFileSync(fixturePath, 'utf8'));
        logger.info({ requestId, action: 'linkedin.fetchRaw', message: `Using LOCAL FIXTURE for RapidAPI response: ${slug}` });
        return fixtureData;
      }
    } catch (e: any) {
      logger.warn({ requestId, action: 'linkedin.fixture', message: `Failed to load fixture: ${e.message}` });
    }
  }

  if (rapidApiKey && rapidApiHost && !rapidApiKey.includes('your_')) {
    try {
      const { data: rapidApiCache } = await supabase
        .from('linkedin_rapidapi_cache')
        .select('raw_data')
        .eq('username', slug)
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
        .single();

      if (rapidApiCache) {
        rawProfileData = rapidApiCache.raw_data;
        logger.info({ requestId, action: 'linkedin.fetchRaw', message: `Using cached RapidAPI response for: ${slug}` });
      }

      if (!rawProfileData) {
        let endpoint = rapidApiUrl || `https://${rapidApiHost}/get-profile-data-by-url`;
        if (endpoint.includes('?')) {
          endpoint = `${endpoint}&url=${encodeURIComponent(linkedinUrl)}`;
        } else {
          endpoint = `${endpoint}?url=${encodeURIComponent(linkedinUrl)}&username=${slug}`;
        }

        const apiRes = await fetch(endpoint, {
          method: 'GET',
          headers: { 'X-RapidAPI-Key': rapidApiKey, 'X-RapidAPI-Host': rapidApiHost }
        });

        if (apiRes.ok) {
          const apiData = await apiRes.json();
          if (apiData && apiData.success === false) {
            providerFailure = apiData.message || 'The LinkedIn profile provider rejected the request.';
            logger.warn({ requestId, action: 'linkedin.fetchRaw', message: `RapidAPI returned unsuccessful payload: ${providerFailure}` });
          } else {
            rawProfileData = apiData;
          }
          
          if (rawProfileData) {
            // Save the successful response as a fixture for future development
            try {
              const fixturePath = path.join(process.cwd(), 'linkedin-fixture.json');
              fs.writeFileSync(fixturePath, JSON.stringify(rawProfileData, null, 2));
              logger.info({ requestId, action: 'linkedin.fixture', message: `Saved RapidAPI response to fixture at ${fixturePath}` });
            } catch (e: any) {
              logger.warn({ requestId, action: 'linkedin.fixture', message: `Failed to save fixture: ${e.message}` });
            }

            await supabase.from('linkedin_rapidapi_cache').upsert({
              username: slug,
              raw_data: rawProfileData,
              created_at: new Date().toISOString()
            }, { onConflict: 'username' });
          }
        } else {
          providerFailure = `LinkedIn profile provider returned HTTP ${apiRes.status}.`;
          logger.warn({ requestId, action: 'linkedin.fetchRaw', message: `RapidAPI failed with status: ${apiRes.status}` });
        }
      }
    } catch (e: any) {
      providerFailure = e.message || 'The LinkedIn profile provider request failed.';
      logger.warn({ requestId, action: 'linkedin.fetchRaw', message: `RapidAPI exception: ${e.message}` });
    }
  }

  if (!rawProfileData) {
    const detail = providerFailure || (!rapidApiKey || !rapidApiHost
      ? 'LinkedIn profile lookup is not configured on the server.'
      : 'No LinkedIn profile data was returned.');
    throw new Error(`${detail} Upload a LinkedIn profile PDF export to analyze its actual contents.`);
  }

  return rawProfileData;
}

export async function analyzeLinkedin(
  rawProfileData: any,
  targetRole = 'frontend',
  resumeData: any = null,
  githubData: any = null,
  requestId = 'linkedin-analysis',
  fetchOnly = false
): Promise<any> {
  if (!rawProfileData) {
    throw new Error('LinkedIn profile data is required');
  }

  try {
    // 1. Normalize provider data via abstraction layer
    const normalizedProfile = normalizeLinkedInProfile(rawProfileData);

    if (fetchOnly) {
      return normalizedProfile;
    }

    // 2. Send to Gemini for Cross-Analysis
    const prompt = Prompts.linkedinAnalysis(normalizedProfile, resumeData, githubData, targetRole);
    const systemInstruction = `You are an Executive Tech Recruiter auditing a candidate's LinkedIn for a ${targetRole} engineering role.
Provide your evaluation in strict JSON format only. No markdown, no extra text.`;

    let analysisResult: any;
    try {
      analysisResult = await generateAIContent(prompt, { systemInstruction, parseJson: true, requestId });
    } catch (err: any) {
      throw new Error(`AI generation failed: ${err.message}`);
    }

    return {
      source_data: normalizedProfile,
      analysis_result: analysisResult
    };

  } catch (err: any) {
    logger.error({
      requestId,
      action: 'linkedin.analysis',
      error: err
    });
    throw err;
  }
}
