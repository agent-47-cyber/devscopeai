import express from 'express';
import { analyzeProjectGap } from '../services/projectGapService.js';

export default function (pool, authenticateToken, checkDbConnected, readLocalDb, writeLocalDb) {
  const router = express.Router();

  // POST /api/analyze/project-gap — Generate new analysis
  router.post('/', authenticateToken, async (req, res) => {
    try {
      const userId = req.user.id;
      const forceRefresh = req.body.forceRefresh || false;
      const targetRole = req.body.targetRole || req.body.role || 'frontend';

      let resumeData = req.body.resumeData || null;
      let githubData = req.body.githubData || null;
      let linkedinData = req.body.linkedinData || null;
      let cachedFallback = null;

      if (checkDbConnected() && (!resumeData || !githubData || !linkedinData)) {
        const profileData = await pool.query(
          `SELECT resume_data, github_data, linkedin_data FROM analyses WHERE user_id = $1 LIMIT 1`,
          [userId]
        );
        if (profileData.rows.length > 0) {
          resumeData = resumeData || profileData.rows[0].resume_data;
          githubData = githubData || profileData.rows[0].github_data;
          linkedinData = linkedinData || profileData.rows[0].linkedin_data;
        }

        try {
          const cached = await pool.query(
            `SELECT analysis_data FROM project_gap_analyses WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1`,
            [userId]
          );
          if (cached.rows.length > 0 && cached.rows[0].analysis_data) {
            cachedFallback = cached.rows[0].analysis_data;
            if (!forceRefresh && !req.body.resumeData && !req.body.githubData && !req.body.linkedinData) {
              return res.json({ success: true, data: { ...cachedFallback, _cached: true } });
            }
          }
        } catch (e) {}
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
          error: 'Please analyze at least one channel (Resume, GitHub, or LinkedIn) before running Project Gap Analysis.'
        });
      }

      const analysis_result = await analyzeProjectGap(resumeData, githubData, linkedinData, targetRole);

      if (analysis_result._aiSource === 'FALLBACK' && cachedFallback) {
        console.log('[projectGapRoutes] Quota hit but cache exists. Serving stale cache.');
        cachedFallback._meta = { source: 'Cache (Stale) ⚡', timestamp: new Date().toISOString() };
        return res.json({ success: true, data: cachedFallback });
      }

      // Store in DB
      if (checkDbConnected()) {
        try {
          await pool.query(
            `INSERT INTO project_gap_analyses (user_id, analysis_data) 
             VALUES ($1, $2::jsonb)`,
            [userId, JSON.stringify(analysis_result)]
          );
        } catch (dbErr) {
          console.error('[projectGapRoutes] DB Insert Error (ignoring):', dbErr.message);
        }
      } else {
        const db = readLocalDb();
        let existing = db.analyses.find(a => a.userId === userId);
        if (!existing) {
          existing = { userId, scores: {}, createdAt: new Date().toISOString() };
          db.analyses.push(existing);
        }
        if (existing) {
          existing.projectGapData = analysis_result;
          existing.updatedAt = new Date().toISOString();
        }
        writeLocalDb(db);
      }

      return res.json({ success: true, data: analysis_result });
    } catch (err) {
      console.error('[projectGapRoutes] Error:', err);
      return res.status(500).json({ success: false, error: err.message || 'Project gap analysis failed.' });
    }
  });

  return router;
}
