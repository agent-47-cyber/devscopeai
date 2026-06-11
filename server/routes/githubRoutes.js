import express from 'express';
import crypto from 'crypto';
import { analyzeGithub } from '../services/githubService.js';

export default function (pool, authenticateToken, checkDbConnected, readLocalDb, writeLocalDb) {
  const router = express.Router();

  router.post('/', authenticateToken, async (req, res) => {
    try {
      // Accept both 'username' and 'githubUsername' for flexibility
      const username = (req.body.username || req.body.githubUsername || '').trim();
      const userId = req.user.id;
      const targetRole = req.body.targetRole || 'frontend';

      if (!username) {
        return res.status(400).json({ success: false, error: 'GitHub username is required.' });
      }

      // Clean username: strip github.com URLs
      const cleanUsername = username.replace(/^(https?:\/\/)?(www\.)?github\.com\//i, '').split('/')[0];

      // 2. Hash the input and check DB cache
      const inputHash = crypto.createHash('md5').update(cleanUsername + targetRole).digest('hex');
      const forceRefresh = req.body.forceRefresh === true || req.body.forceRefresh === 'true';

      let cachedGithub = null;
      let resumeData = null;

      if (checkDbConnected()) {
        try {
          const profileData = await pool.query(
            `SELECT github_data, resume_data FROM analyses WHERE user_id = $1 LIMIT 1`,
            [userId]
          );
          if (profileData.rows.length > 0) {
            cachedGithub = profileData.rows[0].github_data;
            resumeData = profileData.rows[0].resume_data;
          }
        } catch (e) {
          console.warn('[githubRoutes] Could not fetch cross-analysis data:', e.message);
        }
      } else {
        const db = readLocalDb();
        const existing = db.analyses.find(a => a.userId === userId);
        if (existing) {
          cachedGithub = existing.githubData;
          resumeData = existing.resumeData;
        }
      }

      // Return cache if hash matches
      if (!forceRefresh && cachedGithub && cachedGithub._hash === inputHash) {
        console.log('[githubRoutes] Cache HIT for hash:', inputHash);
        cachedGithub._meta = { source: 'Cache ⚡', timestamp: cachedGithub._timestamp || new Date().toISOString() };
        return res.json({ success: true, data: cachedGithub });
      }

      console.log('[githubRoutes] Cache MISS or force refresh. Calling Gemini...');

      // Generate new analysis with role-awareness and cross-reference
      const { source_data, analysis_result } = await analyzeGithub(cleanUsername, targetRole, resumeData, checkDbConnected() ? pool : null);

      if (analysis_result._aiSource === 'FALLBACK' && cachedGithub) {
        console.log('[githubRoutes] Quota hit but cache exists. Serving stale cache.');
        cachedGithub._meta = { source: 'Cache (Stale) ⚡', timestamp: cachedGithub._timestamp || new Date().toISOString() };
        return res.json({ success: true, data: cachedGithub });
      }

      // Normalize: map Gemini fields to frontend-expected fields
      const normalized = {
        ...analysis_result,
        // Frontend-expected aliases
        score: analysis_result.codePortfolioStrength ?? 0,
        username: cleanUsername,
        publicRepos: source_data.publicRepos,
        repoCount: source_data.publicRepos,
        followers: source_data.followers,
        totalStars: source_data.totalStarsOnTopRepos,
        languages: source_data.topLanguages?.map(l => ({ name: l })) || [],
        topRepositories: source_data.topRepositories || [],
        topRepos: source_data.topRepositories || [],
        bestRepoName: analysis_result.bestRepositoryDeepAnalysis?.repositoryName || source_data.bestRepository?.name || '',
        bestRepositoryDeepAnalysis: analysis_result.bestRepositoryDeepAnalysis || null,
        techStackExtraction: analysis_result.techStackExtraction || null,
        missingCategories: analysis_result.missingProjectCategories || [],
        missingTech: analysis_result.missingTechnologies || [],
        portfolioRisks: analysis_result.portfolioRisks || [],
        recommendations: analysis_result.projectRecommendations || [],
        careerRecommendations: analysis_result.careerRecommendations || [],
        docScore: Math.round((analysis_result.codePortfolioStrength || 50) * 0.9),
        _hash: inputHash,
        _timestamp: new Date().toISOString(),
        _meta: { source: 'Gemini ✅', timestamp: new Date().toISOString() }
      };

      // Store in DB
      if (checkDbConnected()) {
        try {
          await pool.query(
            `INSERT INTO github_analyses (user_id, github_username, source_data, analysis_data) 
             VALUES ($1, $2, $3::jsonb, $4::jsonb)`,
            [userId, cleanUsername, JSON.stringify(source_data), JSON.stringify(normalized)]
          );
          await pool.query(
            `INSERT INTO analyses (user_id, github_username, github_data, scores) VALUES ($1, $2, $3::jsonb, $4::jsonb)
             ON CONFLICT (user_id) DO UPDATE SET 
               github_username = EXCLUDED.github_username,
               github_data = EXCLUDED.github_data,
               scores = COALESCE(analyses.scores, '{}'::jsonb) || jsonb_build_object('github', $5::int),
               updated_at = NOW()`,
            [userId, cleanUsername, JSON.stringify(normalized), JSON.stringify({ github: normalized.score }), normalized.score]
          );
        } catch (dbErr) {
          console.error('[githubRoutes] DB Insert Error (ignoring):', dbErr.message);
        }
      } else {
        const db = readLocalDb();
        let existing = db.analyses.find(a => a.userId === userId);
        if (existing) {
          existing.githubUsername = cleanUsername;
          existing.githubData = normalized;
          existing.scores = { ...(existing.scores || {}), github: normalized.score };
          existing.updatedAt = new Date().toISOString();
        } else {
          db.analyses.push({ userId, githubUsername: cleanUsername, githubData: normalized, scores: { github: normalized.score }, createdAt: new Date().toISOString() });
        }
        writeLocalDb(db);
      }

      return res.json({ success: true, data: normalized });
    } catch (err) {
      console.error('[githubRoutes] Error:', err);
      return res.status(500).json({ success: false, error: err.message || 'GitHub analysis failed.' });
    }
  });

  return router;
}
