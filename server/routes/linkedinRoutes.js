import express from 'express';
import crypto from 'crypto';
import { analyzeLinkedin } from '../services/linkedinService.js';

export default function (pool, authenticateToken, checkDbConnected, readLocalDb, writeLocalDb) {
  const router = express.Router();

  router.post('/', authenticateToken, async (req, res) => {
    try {
      const userId = req.user.id;
      const targetRole = req.body.targetRole || 'frontend';

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

      // 2. Hash the input and check DB cache
      const inputHash = crypto.createHash('md5').update(slug + targetRole).digest('hex');
      const forceRefresh = req.body.forceRefresh === true || req.body.forceRefresh === 'true';

      let cachedLinkedin = null;
      let resumeData = null;
      let githubData = null;

      if (checkDbConnected()) {
        try {
          const profileData = await pool.query(
            `SELECT linkedin_data, resume_data, github_data FROM analyses WHERE user_id = $1 LIMIT 1`,
            [userId]
          );
          if (profileData.rows.length > 0) {
            cachedLinkedin = profileData.rows[0].linkedin_data;
            resumeData = profileData.rows[0].resume_data;
            githubData = profileData.rows[0].github_data;
          }
        } catch (e) {
          console.warn('[linkedinRoutes] Could not fetch cross-analysis data:', e.message);
        }
      } else {
        const db = readLocalDb();
        const existing = db.analyses.find(a => a.userId === userId);
        if (existing) {
          cachedLinkedin = existing.linkedinData;
          resumeData = existing.resumeData;
          githubData = existing.githubData;
        }
      }

      // Return cache if hash matches
      if (!forceRefresh && cachedLinkedin && cachedLinkedin._hash === inputHash) {
        console.log('[linkedinRoutes] Cache HIT for hash:', inputHash);
        cachedLinkedin._meta = { source: 'Cache ⚡', timestamp: cachedLinkedin._timestamp || new Date().toISOString() };
        return res.json({ success: true, data: cachedLinkedin });
      }

      console.log('[linkedinRoutes] Cache MISS or force refresh. Calling Gemini...');

      const rapidApiKey = process.env.RAPIDAPI_KEY;
      const rapidApiHost = process.env.RAPIDAPI_HOST;
      const rapidApiUrl = process.env.RAPIDAPI_URL;
      
      let rawProfileData = null;

      if (rapidApiKey && rapidApiHost && !rapidApiKey.includes('your_')) {
        try {
          if (!forceRefresh) {
            if (checkDbConnected()) {
              const rapidApiCache = await pool.query(
                `SELECT raw_data FROM linkedin_rapidapi_cache WHERE username = $1 AND created_at > NOW() - INTERVAL '24 hours'`,
                [slug]
              );
              if (rapidApiCache.rows.length > 0) {
                rawProfileData = rapidApiCache.rows[0].raw_data;
                console.log('[linkedinRoutes] Using 24h cached RapidAPI response for (DB):', slug);
              }
            } else {
              const db = readLocalDb();
              const cached = db.rapidApiCache && db.rapidApiCache[slug];
              if (cached && (Date.now() - cached.timestamp < 24 * 60 * 60 * 1000)) {
                rawProfileData = cached.data;
                console.log('[linkedinRoutes] Using 24h cached RapidAPI response for (Local):', slug);
              }
            }
          }

          if (!rawProfileData) {
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
              if (checkDbConnected()) {
                await pool.query(
                  `INSERT INTO linkedin_rapidapi_cache (username, raw_data) VALUES ($1, $2::jsonb)
                   ON CONFLICT (username) DO UPDATE SET raw_data = EXCLUDED.raw_data, created_at = NOW()`,
                  [slug, JSON.stringify(rawProfileData)]
                ).catch(e => console.error('[linkedinRoutes] Failed to cache RapidAPI response:', e.message));
              } else {
                const db = readLocalDb();
                if (!db.rapidApiCache) db.rapidApiCache = {};
                db.rapidApiCache[slug] = {
                  timestamp: Date.now(),
                  data: rawProfileData
                };
                writeLocalDb(db);
              }
            } else {
              console.warn('[linkedinRoutes] RapidAPI failed with status:', apiRes.status);
            }
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

      if (analysis_result._aiSource === 'FALLBACK' && cachedLinkedin) {
        console.log('[linkedinRoutes] Quota hit but cache exists. Serving stale cache.');
        cachedLinkedin._meta = { source: 'Cache (Stale) ⚡', timestamp: cachedLinkedin._timestamp || new Date().toISOString() };
        return res.json({ success: true, data: cachedLinkedin });
      }

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
        },
        _hash: inputHash,
        _timestamp: new Date().toISOString(),
        _meta: { source: 'Gemini ✅', timestamp: new Date().toISOString() }
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
