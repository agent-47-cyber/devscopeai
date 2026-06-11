import express from 'express';
import { analyzeJobMatch } from '../services/jobMatchService.js';
import { calculateJobMatchScore } from '../services/scoringEngine.js';

export default function(pool, authenticateToken, checkDbConnected, readLocalDb, writeLocalDb) {
  const router = express.Router();

  router.post('/', authenticateToken, async (req, res) => {
    try {
      const { jobDescription } = req.body;
      const userId = req.user.id;
      const targetRole = req.body.targetRole || req.body.role || 'frontend';

      if (!jobDescription || jobDescription.trim().length < 20) {
        return res.status(400).json({ success: false, error: 'A valid job description is required (at least 20 characters).' });
      }

      // Check DB Cache for job match description to avoid calling Gemini for same description
      if (checkDbConnected()) {
        try {
          const cached = await pool.query(
            `SELECT job_description, analysis_data FROM job_matches WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1`,
            [userId]
          );
          if (cached.rows.length > 0) {
            const cachedDesc = cached.rows[0].job_description || '';
            if (cachedDesc.trim() === jobDescription.trim()) {
              const analysisResult = cached.rows[0].analysis_data;
              const scoring = calculateJobMatchScore(analysisResult, targetRole);
              const updated = {
                ...analysisResult,
                matchScore: scoring.finalScore,
                categoryBreakdown: scoring.categoryBreakdown,
                targetRole
              };
              return res.json({ success: true, data: updated });
            }
          }
        } catch (cacheErr) {
          console.warn('[jobMatchRoutes] Cache read failed:', cacheErr.message);
        }
      }

      // Fetch the user's existing profile analyses for cross-matching
      let resumeData = req.body.resumeData || null;
      let githubData = req.body.githubData || null;
      let linkedinData = req.body.linkedinData || null;

      if (checkDbConnected() && (!resumeData || !githubData || !linkedinData)) {
        const profileResult = await pool.query(
          `SELECT resume_data, github_data, linkedin_data FROM analyses WHERE user_id = $1 LIMIT 1`,
          [userId]
        );
        if (profileResult.rows.length > 0) {
          resumeData = resumeData || profileResult.rows[0].resume_data;
          githubData = githubData || profileResult.rows[0].github_data;
          linkedinData = linkedinData || profileResult.rows[0].linkedin_data;
        }
      } else if (!checkDbConnected() && (!resumeData || !githubData || !linkedinData)) {
        const db = readLocalDb();
        const existing = db.analyses.find(a => a.userId === userId);
        if (existing) {
          resumeData = resumeData || existing.resumeData;
          githubData = githubData || existing.githubData;
          linkedinData = linkedinData || existing.linkedinData;
        }
      }

      if (!resumeData && !githubData && !linkedinData) {
        return res.status(400).json({ 
          success: false, 
          error: 'Please analyze at least one channel (Resume, GitHub, or LinkedIn) before running Job Match.' 
        });
      }

      const analysis_result = await analyzeJobMatch(userId, jobDescription, resumeData, githubData, linkedinData, targetRole);

      // Recalculate match score dynamically based on backend engine
      const scoring = calculateJobMatchScore(analysis_result, targetRole);
      const normalized = {
        ...analysis_result,
        matchScore: scoring.finalScore,
        categoryBreakdown: scoring.categoryBreakdown,
        targetRole
      };

      // Store in DB
      if (checkDbConnected()) {
        try {
          await pool.query(
            `INSERT INTO job_matches (user_id, job_description, analysis_data) VALUES ($1, $2, $3::jsonb)`,
            [userId, jobDescription.substring(0, 5000), JSON.stringify(normalized)]
          );
        } catch (dbErr) {
          console.error('[jobMatchRoutes] DB Insert Error (ignoring):', dbErr.message);
        }
      } else {
        const db = readLocalDb();
        let existing = db.analyses.find(a => a.userId === userId);
        if (!existing) {
          existing = { userId, scores: {}, createdAt: new Date().toISOString() };
          db.analyses.push(existing);
        }
        if (existing) {
          existing.jobMatchData = normalized;
          existing.updatedAt = new Date().toISOString();
        }
        writeLocalDb(db);
      }

      return res.json({ success: true, data: normalized });
    } catch (err) {
      console.error('[jobMatchRoutes] Error:', err);
      const isRateLimit = err.message?.includes('429') || err.message?.includes('rate limit') || err.message?.includes('quota');
      return res.status(isRateLimit ? 429 : 500).json({ 
        success: false, 
        error: isRateLimit 
          ? 'Gemini AI is temporarily rate limited. Please wait 30 seconds and try again.' 
          : (err.message || 'Job match analysis failed.')
      });
    }
  });

  return router;
}
