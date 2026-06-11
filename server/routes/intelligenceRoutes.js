import express from 'express';
import crypto from 'crypto';
import { generateIntelligenceReport } from '../services/intelligenceEngine.js';

export default function (pool, authenticateToken, checkDbConnected, readLocalDb, writeLocalDb) {
  const router = express.Router();

  router.post('/', authenticateToken, async (req, res) => {
    try {
      const userId = req.user.id;
      const { jobDescription = '', targetRole = 'frontend', forceRefresh = false } = req.body;

      // 1. Fetch the cached foundational data
      let resumeData = null;
      let githubData = null;
      let linkedinData = null;
      let cachedIntelligence = null;

      if (checkDbConnected()) {
        try {
          const profileData = await pool.query(
            `SELECT resume_data, github_data, linkedin_data, intelligence_data 
             FROM analyses WHERE user_id = $1 LIMIT 1`,
            [userId]
          );
          if (profileData.rows.length > 0) {
            resumeData = profileData.rows[0].resume_data;
            githubData = profileData.rows[0].github_data;
            linkedinData = profileData.rows[0].linkedin_data;
            cachedIntelligence = profileData.rows[0].intelligence_data;
          }
        } catch (e) {
          console.warn('[intelligenceRoutes] DB read error:', e.message);
        }
      } else {
        const db = readLocalDb();
        const existing = db.analyses.find(a => a.userId === userId);
        if (existing) {
          resumeData = existing.resumeData;
          githubData = existing.githubData;
          linkedinData = existing.linkedinData;
          cachedIntelligence = existing.intelligenceData;
        }
      }

      // If missing core data, cannot run intelligence engine
      if (!resumeData && !githubData && !linkedinData) {
        return res.status(400).json({ 
          success: false, 
          error: 'Missing required profile data. Please complete Resume, GitHub, or LinkedIn analysis first.' 
        });
      }

      // 2. Hash the combined inputs
      const combinedPayload = JSON.stringify({
        resumeHash: resumeData?._hash || '',
        githubHash: githubData?._hash || '',
        linkedinHash: linkedinData?._hash || '',
        jobDescription,
        targetRole
      });
      const inputHash = crypto.createHash('md5').update(combinedPayload).digest('hex');

      // 3. Check cache
      const isForceRefresh = forceRefresh === true || forceRefresh === 'true';
      if (!isForceRefresh && cachedIntelligence && cachedIntelligence._hash === inputHash) {
        console.log('[intelligenceRoutes] Cache HIT for hash:', inputHash);
        cachedIntelligence._meta = { source: 'Cache ⚡', timestamp: cachedIntelligence._timestamp || new Date().toISOString() };
        return res.json({ success: true, data: cachedIntelligence });
      }

      console.log('[intelligenceRoutes] Cache MISS or force refresh. Calling Gemini Intelligence Engine...');

      // 4. Generate Unified Intelligence
      const intelligenceResult = await generateIntelligenceReport(
        resumeData,
        githubData,
        linkedinData,
        jobDescription,
        targetRole
      );

      // Add meta
      intelligenceResult._hash = inputHash;
      intelligenceResult._timestamp = new Date().toISOString();
      intelligenceResult._meta = { source: 'Gemini ✅', timestamp: new Date().toISOString() };

      // 5. Store in DB
      if (checkDbConnected()) {
        try {
          await pool.query(
            `UPDATE analyses SET 
              intelligence_data = $1::jsonb,
              updated_at = NOW()
             WHERE user_id = $2`,
            [JSON.stringify(intelligenceResult), userId]
          );
        } catch (dbErr) {
          // If intelligence_data column doesn't exist, we will just rely on the localDb fallback
          // or we can swallow the error. Since we don't want to break the app if the schema is strict:
          console.error('[intelligenceRoutes] DB Update Error (schema might be missing intelligence_data column):', dbErr.message);
        }
      } 
      
      // Always update local DB fallback as well to be safe
      const db = readLocalDb();
      let existing = db.analyses.find(a => a.userId === userId);
      if (existing) {
        existing.intelligenceData = intelligenceResult;
        existing.updatedAt = new Date().toISOString();
      } else {
        db.analyses.push({ 
          userId, 
          intelligenceData: intelligenceResult,
          createdAt: new Date().toISOString() 
        });
      }
      writeLocalDb(db);
      
      return res.json({ success: true, data: intelligenceResult });
    } catch (err) {
      console.error('[intelligenceRoutes] Error:', err);
      return res.status(500).json({ success: false, error: err.message || 'Intelligence analysis failed.' });
    }
  });

  return router;
}
