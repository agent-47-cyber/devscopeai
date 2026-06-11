import express from 'express';
import { generateCandidateReport } from '../services/reportService.js';

export default function (pool, authenticateToken, checkDbConnected, readLocalDb, writeLocalDb) {
  const router = express.Router();

  router.post('/', authenticateToken, async (req, res) => {
    try {
      const userId = req.user.id;

      // 1. Fetch all previous analyses to construct the report
      let resumeData = req.body.resumeData || null;
      let githubData = req.body.githubData || null;
      let linkedinData = req.body.linkedinData || null;
      let jobMatchData = req.body.jobMatchData || null;
      let projectGapData = req.body.projectGapData || null;
      let existingReport = null;

      if (checkDbConnected()) {
        // Fetch all profile data
        if (!resumeData || !githubData || !linkedinData) {
          const profileCheck = await pool.query(
            `SELECT resume_data, github_data, linkedin_data FROM analyses WHERE user_id = $1 LIMIT 1`,
            [userId]
          );
          if (profileCheck.rows.length > 0) {
            resumeData = resumeData || profileCheck.rows[0].resume_data;
            githubData = githubData || profileCheck.rows[0].github_data;
            linkedinData = linkedinData || profileCheck.rows[0].linkedin_data;
          }
        }

        // Fetch job match
        if (!jobMatchData) {
          const jobMatchCheck = await pool.query(
            `SELECT analysis_data FROM job_matches WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1`,
            [userId]
          );
          if (jobMatchCheck.rows.length > 0) {
            jobMatchData = jobMatchCheck.rows[0].analysis_data;
          }
        }

        // Fetch project gap
        if (!projectGapData) {
          const projectGapCheck = await pool.query(
            `SELECT analysis_data FROM project_gap_analyses WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1`,
            [userId]
          );
          if (projectGapCheck.rows.length > 0) {
            projectGapData = projectGapCheck.rows[0].analysis_data;
          }
        }

        // Check if report already generated recently (e.g., today) - For now, we will generate a new one if requested, 
        // but if we wanted to cache the report itself, we could check `candidate_reports` table.
      } else {
        const db = readLocalDb();
        const existing = db.analyses.find(a => a.userId === userId);
        if (existing) {
          resumeData = resumeData || existing.resumeData;
          githubData = githubData || existing.githubData;
          linkedinData = linkedinData || existing.linkedinData;
          jobMatchData = jobMatchData || existing.jobMatchData;
          projectGapData = projectGapData || existing.projectGapData;
        }
      }

      // We explicitly DO NOT cache the report aggressively because the user said "This should NOT simply merge previous reports. It should generate a completely new Gemini analysis."
      // However, if we wanted to avoid regenerating unless sub-components changed, we could hash them.
      // For now, we always generate a new report when this endpoint is hit.

      const targetRole = req.body.targetRole || 'frontend';
      const analysis_result = await generateCandidateReport(resumeData, githubData, linkedinData, jobMatchData, projectGapData, targetRole);

      // Store in DB
      if (checkDbConnected()) {
        try {
          await pool.query(
            `INSERT INTO candidate_reports (user_id, report_data) 
             VALUES ($1, $2::jsonb)`,
            [userId, JSON.stringify(analysis_result)]
          );
        } catch (dbErr) {
          console.error('[reportRoutes] DB Insert Error (ignoring):', dbErr.message);
        }
      } else {
        const db = readLocalDb();
        let existing = db.analyses.find(a => a.userId === userId);
        if (!existing) {
          existing = { userId, scores: {}, createdAt: new Date().toISOString() };
          db.analyses.push(existing);
        }
        if (existing) {
          existing.candidateReportData = analysis_result;
          existing.updatedAt = new Date().toISOString();
          writeLocalDb(db);
        }
      }

      return res.json({ success: true, data: analysis_result });
    } catch (err) {
      console.error('[reportRoutes] Error:', err);
      return res.status(500).json({ success: false, error: err.message });
    }
  });

  router.get('/history', authenticateToken, async (req, res) => {
    try {
      const userId = req.user.id;
      if (checkDbConnected()) {
        const history = await pool.query(
          `SELECT id, created_at, report_data FROM candidate_reports WHERE user_id = $1 ORDER BY created_at DESC LIMIT 20`,
          [userId]
        );
        return res.json({ success: true, data: history.rows });
      }
      return res.json({ success: true, data: [] });
    } catch (e) {
      return res.status(500).json({ success: false, error: e.message });
    }
  });

  return router;
}
