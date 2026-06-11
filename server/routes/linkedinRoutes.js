import express from 'express';
import { analyzeLinkedin } from '../services/linkedinService.js';

export default function (pool, authenticateToken, checkDbConnected, readLocalDb, writeLocalDb) {
  const router = express.Router();

  router.post('/', authenticateToken, async (req, res) => {
    try {
      const userId = req.user.id;

      // Accept username, linkedinUrl, linkedinUsername, or url
      const rawInput = req.body.username || req.body.linkedinUrl || req.body.linkedinUsername || req.body.url || '';

      if (!rawInput) {
        return res.status(400).json({ success: false, error: 'LinkedIn username or URL is required.' });
      }

      // Normalize: extract slug from URL or use directly
      let slug = rawInput.trim();
      if (slug.includes('linkedin.com/in/')) {
        try {
          const url = new URL(slug.startsWith('http') ? slug : `https://${slug}`);
          const parts = url.pathname.split('/').filter(Boolean);
          slug = parts[1] || slug;
        } catch (e) { /* keep as-is */ }
      }
      // Strip trailing slashes and query params
      slug = slug.split('?')[0].split('/').pop().trim();

      const linkedinUrl = `https://www.linkedin.com/in/${slug}`;

      const forceRefresh = req.body.forceRefresh === true;

      // Fetch cached analysis + other profile data for cross-analysis
      let existingAnalysis = null;
      let resumeData = null;
      let githubData = null;

      if (checkDbConnected()) {
        const cacheCheck = await pool.query(
          `SELECT 
            l.analysis_data as linkedin_analysis,
            a.resume_data,
            a.github_data
           FROM analyses a
           LEFT JOIN linkedin_analyses l ON l.user_id = a.user_id AND l.linkedin_url = $2
           WHERE a.user_id = $1 LIMIT 1`,
          [userId, linkedinUrl]
        );
        if (cacheCheck.rows.length > 0) {
          if (!forceRefresh) {
            existingAnalysis = cacheCheck.rows[0].linkedin_analysis;
          }
          resumeData = cacheCheck.rows[0].resume_data;
          githubData = cacheCheck.rows[0].github_data;
        }
      } else {
        const db = readLocalDb();
        const existing = db.analyses.find(a => a.userId === userId);
        if (existing) {
          if (!forceRefresh) {
            existingAnalysis = existing.linkedinData;
          }
          resumeData = existing.resumeData;
          githubData = existing.githubData;
        }
      }

      if (existingAnalysis && !forceRefresh) {
        return res.json({ success: true, data: { ...existingAnalysis, _cached: true } });
      }

      const rapidApiKey = process.env.RAPIDAPI_KEY;
      const rapidApiHost = process.env.RAPIDAPI_HOST;
      const rapidApiUrl = process.env.RAPIDAPI_URL;
      
      let rawProfileData = null;

      if (rapidApiKey && rapidApiHost && !rapidApiKey.includes('your_')) {
        try {
          // Use provided URL from env or fallback to a default generic one
          let endpoint = rapidApiUrl || `https://${rapidApiHost}/api/v1/linkedin/profile`;
          
          // Determine parameter formatting based on URL structure
          if (endpoint.includes('?')) {
            endpoint = `${endpoint}&url=${encodeURIComponent(linkedinUrl)}`;
          } else {
            // Some APIs use `username` instead of `url` as the query param, we'll try url first
            endpoint = `${endpoint}?url=${encodeURIComponent(linkedinUrl)}&username=${slug}`;
          }

          console.log(`[linkedinRoutes] Fetching from RapidAPI: ${endpoint.split('?')[0]}...`);
          
          const apiRes = await fetch(endpoint, {
            method: 'GET',
            headers: { 'X-RapidAPI-Key': rapidApiKey, 'X-RapidAPI-Host': rapidApiHost }
          });
          if (apiRes.ok) {
            rawProfileData = await apiRes.json();
          } else {
            console.warn('[linkedinRoutes] RapidAPI failed with status:', apiRes.status);
          }
        } catch (e) {
          console.warn('[linkedinRoutes] RapidAPI exception:', e.message);
        }
      }

      const selfReport = req.body.selfReport || {};

      // Fallback profile using slug + cross-reference data from resume/github
      if (!rawProfileData) {
        rawProfileData = {
          username: slug,
          url: linkedinUrl,
          headline: `Professional at LinkedIn (${slug})`,
          summary: '',
          experience: [],
          education: [],
          skills: [],
          // Include resume skills if available for cross-analysis
          _resumeKeywords: resumeData?.foundKeywords || resumeData?.keywordAnalysis?.found || [],
          _githubLanguages: githubData?.languages?.map(l => l.name || l) || githubData?.topLanguages || [],
          _selfReport: selfReport
        };
      }

      // Analyze with Gemini (includes Cross-Analysis via prompt)
      const { source_data, analysis_result } = await analyzeLinkedin(rawProfileData, resumeData, githubData, req.body.targetRole || 'frontend');

      // Normalize to frontend-expected structure
      const completenessScore = Math.max(45, Math.min(100, Number(analysis_result.profileCompleteness ?? 60) || 60));
      const normalized = {
        ...analysis_result,
        // Frontend-expected aliases
        score: completenessScore,
        slug,
        url: linkedinUrl,
        hasCustomSlug: slug.length > 0 && !/^\d+$/.test(slug),
        headlineAnalysis: analysis_result.headlineAnalysis || '',
        completeness: completenessScore,
        keywordCoverage: analysis_result.keywordCoverage || '',
        strengths: analysis_result.linkedinStrengths || [],
        weaknesses: analysis_result.linkedinWeaknesses || [],
        recommendations: analysis_result.profileOptimizationSuggestions || [],
        crossAnalysis: {
          resumeConsistency: analysis_result.resumeConsistency || '',
          githubConsistency: analysis_result.githubConsistency || '',
        },
        tips: analysis_result.profileOptimizationSuggestions || [],
        suggestedHeadline: analysis_result.suggestedHeadline || `${slug} | Software Engineer | Building production-grade products`,
        foundKws: resumeData?.foundKeywords || [],
        missingKws: analysis_result.linkedinWeaknesses || [],
        profileHandle: slug,
        selfReport: {
          hasHeadlineKeywords: (analysis_result.linkedinStrengths || []).some(s => /headline|keyword/i.test(s)),
          hasExperience: (analysis_result.linkedinStrengths || []).some(s => /experience|history/i.test(s)),
          has500Connections: true
        }
      };

      // Store in DB
      if (checkDbConnected()) {
        try {
          await pool.query(
            `INSERT INTO linkedin_analyses (user_id, linkedin_url, source_data, analysis_data) 
             VALUES ($1, $2, $3::jsonb, $4::jsonb)`,
            [userId, linkedinUrl, JSON.stringify(source_data), JSON.stringify(normalized)]
          );
          await pool.query(
            `INSERT INTO analyses (user_id, linkedin_url, linkedin_data, scores) VALUES ($1, $2, $3::jsonb, $4::jsonb)
             ON CONFLICT (user_id) DO UPDATE SET 
               linkedin_url = EXCLUDED.linkedin_url,
               linkedin_data = EXCLUDED.linkedin_data,
               scores = COALESCE(analyses.scores, '{}'::jsonb) || jsonb_build_object('careerReady', $5::int),
               updated_at = NOW()`,
            [userId, linkedinUrl, JSON.stringify(normalized), JSON.stringify({ careerReady: normalized.score }), normalized.score]
          );
        } catch (dbErr) {
          console.error('[linkedinRoutes] DB Insert Error (ignoring):', dbErr.message);
        }
      } else {
        const db = readLocalDb();
        let existing = db.analyses.find(a => a.userId === userId);
        if (existing) {
          existing.linkedinData = normalized;
          existing.linkedinUsername = slug;
          existing.scores = { ...(existing.scores || {}), careerReady: normalized.score };
          existing.updatedAt = new Date().toISOString();
        } else {
          db.analyses.push({ userId, linkedinData: normalized, linkedinUsername: slug, scores: { careerReady: normalized.score }, createdAt: new Date().toISOString() });
        }
        writeLocalDb(db);
      }

      return res.json({ success: true, data: normalized });
    } catch (err) {
      console.error('[linkedinRoutes] Error:', err);
      return res.status(500).json({ success: false, error: err.message || 'LinkedIn analysis failed.' });
    }
  });

  return router;
}
