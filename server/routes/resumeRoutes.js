import express from 'express';
import multer from 'multer';
import path from 'path';
import { createRequire } from 'module';
import { analyzeResume } from '../services/resumeService.js';

const require = createRequire(import.meta.url);
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }
});

export default function (pool, authenticateToken, checkDbConnected, readLocalDb, writeLocalDb) {
  const router = express.Router();

  // POST /api/analyze/resume
  // Accepts: { resumeText } JSON body OR multipart file upload
  router.post('/', authenticateToken, upload.single('file'), async (req, res) => {
    try {
      const userId = req.user.id;
      let extractedText = '';

      // 1. Check if raw text was provided in JSON body
      if (req.body.resumeText || req.body.text) {
        extractedText = req.body.resumeText || req.body.text;
      } else if (req.file) {
        // 2. Parse uploaded file
        const { originalname, mimetype, buffer } = req.file;
        const ext = path.extname(originalname || '').toLowerCase();

        if (ext === '.pdf' || mimetype === 'application/pdf') {
          try {
            const pdfData = await pdfParse(buffer);
            extractedText = pdfData.text || '';
          } catch (pdfErr) {
            console.error('[resumeRoutes] PDF parse error:', pdfErr.message);
            return res.status(422).json({
              success: false,
              error: 'Could not extract text from PDF. Please paste your resume text instead.'
            });
          }
        } else if (ext === '.docx' || mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
          const result = await mammoth.extractRawText({ buffer });
          extractedText = result.value || '';
        } else if (ext === '.txt' || ext === '.md' || (mimetype && mimetype.startsWith('text/'))) {
          extractedText = buffer.toString('utf-8');
        } else {
          return res.status(415).json({ success: false, error: 'Unsupported file type. Use PDF, DOCX, TXT, or MD.' });
        }
      } else {
        return res.status(400).json({ success: false, error: 'No resume text or file provided.' });
      }

      // Sanitize text
      extractedText = extractedText
        .replace(/\0/g, '')
        .replace(/\r\n/g, '\n')
        .replace(/\r/g, '\n')
        .replace(/\n{4,}/g, '\n\n')
        .trim();

      if (!extractedText || extractedText.length < 50) {
        return res.status(422).json({
          success: false,
          error: 'Could not extract meaningful text from the provided resume.'
        });
      }

      // 2. Send to Gemini with cross-channel data for richer analysis
      // Load existing GitHub/LinkedIn analyses for cross-referencing
      let githubData = null;
      let linkedinData = null;

      if (checkDbConnected()) {
        try {
          const profileData = await pool.query(
            `SELECT github_data, linkedin_data FROM analyses WHERE user_id = $1 LIMIT 1`,
            [userId]
          );
          if (profileData.rows.length > 0) {
            githubData = profileData.rows[0].github_data;
            linkedinData = profileData.rows[0].linkedin_data;
          }
        } catch (e) {
          console.warn('[resumeRoutes] Could not fetch cross-analysis data:', e.message);
        }
      } else {
        const db = readLocalDb();
        const existing = db.analyses.find(a => a.userId === userId);
        if (existing) {
          githubData = existing.githubData;
          linkedinData = existing.linkedinData;
        }
      }

      const analysisResult = await analyzeResume(
        extractedText,
        req.body.targetRole || 'frontend',
        githubData,
        linkedinData
      );

      // Normalize: map Gemini fields to what the frontend expects
      const normalized = {
        // Gemini fields (raw)
        ...analysisResult,
        // Frontend-expected aliases
        atsScore: analysisResult.atsScore ?? 0,
        score: analysisResult.atsScore ?? 0,
        strengths: analysisResult.strengths || [],
        weaknesses: analysisResult.weaknesses || [],
        foundKeywords: analysisResult.keywordAnalysis?.found || [],
        missingKeywords: analysisResult.keywordAnalysis?.missing || [],
        recommendations: analysisResult.improvementOpportunities || [],
        jobReadiness: analysisResult.jobReadiness || 'Junior',
        recruitingNotes: analysisResult.recruiterNotes || '',
        actionVerbCount: analysisResult.actionVerbCount ?? 0,
        quantificationCount: analysisResult.quantificationCount ?? 0,
        sectionsChecklist: analysisResult.sectionsChecklist || {},
        matchRate: analysisResult.matchRate ?? 0,
        roleKeywordsMissing: analysisResult.roleKeywordsMissing || analysisResult.keywordAnalysis?.missing || [],
        suggestions: analysisResult.suggestions || analysisResult.improvementOpportunities || [],
        softSkillsFound: analysisResult.softSkillsFound || [],
        wordCount: extractedText.trim().split(/\s+/).filter(Boolean).length,
      };

      // 3. Store in DB
      if (checkDbConnected()) {
        try {
          await pool.query(
            `INSERT INTO resume_analyses (user_id, source_data, analysis_data) VALUES ($1, $2::jsonb, $3::jsonb)`,
            [userId, JSON.stringify({ text: extractedText.substring(0, 5000) }), JSON.stringify(normalized)]
          );
          await pool.query(
            `INSERT INTO analyses (user_id, resume_data, scores) VALUES ($1, $2::jsonb, $3::jsonb)
             ON CONFLICT (user_id) DO UPDATE SET 
               resume_data = EXCLUDED.resume_data, 
               scores = COALESCE(analyses.scores, '{}'::jsonb) || jsonb_build_object('ats', $4::int),
               updated_at = NOW()`,
            [userId, JSON.stringify(normalized), JSON.stringify({ ats: normalized.atsScore }), normalized.atsScore]
          );
        } catch (dbErr) {
          console.error('[resumeRoutes] DB Insert Error (ignoring):', dbErr.message);
        }
      } else {
        const db = readLocalDb();
        let existing = db.analyses.find(a => a.userId === userId);
        if (existing) {
          existing.resumeData = normalized;
          existing.scores = { ...(existing.scores || {}), ats: normalized.atsScore };
          existing.updatedAt = new Date().toISOString();
        } else {
          db.analyses.push({ userId, resumeData: normalized, scores: { ats: normalized.atsScore }, createdAt: new Date().toISOString() });
        }
        writeLocalDb(db);
      }

      return res.json({ success: true, data: normalized });
    } catch (err) {
      console.error('[resumeRoutes] Error:', err);
      return res.status(500).json({ success: false, error: err.message || 'Resume analysis failed.' });
    }
  });

  return router;
}
