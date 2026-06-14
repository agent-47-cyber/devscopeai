import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import pg from 'pg';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import fs from 'fs';
import path from 'path';
import { randomUUID } from 'crypto';
import multer from 'multer';
import { createRequire } from 'module';
import projectGapRoutes from './server/routes/projectGapRoutes.js';
import jobMatchRoutes from './server/routes/jobMatchRoutes.js';
import reportRoutes from './server/routes/reportRoutes.js';
import resumeRoutes from './server/routes/resumeRoutes.js';
import githubRoutes from './server/routes/githubRoutes.js';
import linkedinRoutes from './server/routes/linkedinRoutes.js';
import intelligenceRoutes from './server/routes/intelligenceRoutes.js';
import { testGeminiConnection } from './server/services/geminiService.js';

const require = createRequire(import.meta.url);
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');

const { Pool } = pg;

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'devscope_secret_key_12345';
const DATABASE_URL = process.env.DATABASE_URL;
const FRONTEND_URL = process.env.FRONTEND_URL || process.env.CLIENT_URL || '';

const allowedOrigins = [
  FRONTEND_URL,
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:5175',
  'http://localhost:5176',
  'http://127.0.0.1:5173',
  'http://localhost:3000',
  'http://127.0.0.1:3000'
].filter(Boolean);

app.use(cors({
  origin(origin, callback) {
    if (!origin) return callback(null, true);
    if (origin.endsWith('.vercel.app')) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    // Allow any localhost/127.0.0.1 port in development
    if (/^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) return callback(null, true);
    return callback(new Error(`CORS blocked for origin: ${origin}`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.options('*', cors());
app.use(express.json({ limit: '10mb' }));

// Multer: memory storage for file uploads (no disk writes)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB
});

app.get('/', (req, res) => {
  res.json({ message: 'DevScope AI API Server is running.', status: 'healthy' });
});

const RESUME_REJECTION_MESSAGE = 'This file is not a resume. Please upload a resume file or paste your resume text.';
const LINKEDIN_REJECTION_MESSAGE = 'This is not a LinkedIn URL or username.';

function getResumeSignals(text = '') {
  const normalized = text.replace(/\s+/g, ' ').trim();
  const lower = normalized.toLowerCase();
  const wordCount = normalized ? normalized.split(/\s+/).filter(Boolean).length : 0;

  const sectionPatterns = {
    experience: /\b(experience|work history|employment|professional experience|work experience|career history)\b/i,
    projects: /\b(projects?|personal projects?|academic projects?)\b/i,
    skills: /\b(skills?|technical skills|core competencies|technical proficiency|tech stack)\b/i,
    education: /\b(education|academic background|qualifications|bachelor|master|phd|university|college|b\.?tech|b\.?e|b\.?sc|mca|bca)\b/i
  };

  const sectionCount = Object.values(sectionPatterns).filter((pattern) => pattern.test(normalized)).length;
  const hasContact = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/.test(normalized) ||
    /(\+?\d[\s.-]?)?(\(?\d{3}\)?[\s.-]?)?\d{3}[\s.-]?\d{4}/.test(normalized) ||
    /linkedin\.com\/in\/|github\.com\//i.test(normalized);
  const hasResumeHeading = /\b(resume|curriculum vitae|cv)\b/i.test(normalized);
  const hasDates = /\b(20\d{2}|19\d{2}|jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec|present)\b/i.test(normalized);
  const hasTechnicalTerms = /\b(javascript|typescript|react|node\.?js|python|java|sql|mongodb|postgres|aws|docker|kubernetes|html|css|git|api|machine learning)\b/i.test(lower);
  const hasRoleTerms = /\b(engineer|developer|designer|analyst|manager|intern|student|architect|consultant)\b/i.test(lower);
  const hasActionVerbs = /\b(developed|built|created|implemented|designed|managed|led|optimized|deployed|analyzed|collaborated|improved)\b/i.test(lower);

  return {
    wordCount,
    sectionCount,
    indicatorCount: [hasContact, hasResumeHeading, hasDates, hasTechnicalTerms, hasRoleTerms, hasActionVerbs].filter(Boolean).length
  };
}

function looksLikeResume(text = '') {
  const signals = getResumeSignals(text);
  if (signals.wordCount < 30) return false;
  return signals.sectionCount >= 2 || (signals.sectionCount >= 1 && signals.indicatorCount >= 2);
}

function parseLinkedInProfileInput(value = '') {
  const raw = String(value || '').trim();
  if (!raw) return null;

  const lower = raw.toLowerCase();
  const isUrlLike = /^https?:\/\//i.test(raw) || /^www\./i.test(raw) || /\.[a-z]{2,}(\/|$)/i.test(raw);
  const slugPattern = /^[a-z0-9](?:[a-z0-9-]{1,98}[a-z0-9])?$/i;

  if (isUrlLike) {
    let parsed;
    try {
      parsed = new URL(/^https?:\/\//i.test(raw) ? raw : `https://${raw}`);
    } catch (err) {
      return null;
    }

    const host = parsed.hostname.toLowerCase().replace(/^www\./, '');
    const parts = parsed.pathname.split('/').filter(Boolean);
    if (host !== 'linkedin.com' || parts[0]?.toLowerCase() !== 'in' || !parts[1] || !slugPattern.test(parts[1])) {
      return null;
    }

    return parts[1];
  }

  if (lower.includes('/') || lower.includes('@') || lower.includes('.') || !slugPattern.test(raw)) {
    return null;
  }

  return raw;
}

// ==========================================
// DATABASE SETUP & FALLBACK MECHANISM
// ==========================================
let isDbConnected = false;
let pool = null;
const LOCAL_DB_PATH = path.resolve('devscope_db.json');

let inMemoryDb = { users: [], analyses: [], chatHistories: [] };
let useInMemoryFallback = false;

try {
  if (!fs.existsSync(LOCAL_DB_PATH)) {
    fs.writeFileSync(LOCAL_DB_PATH, JSON.stringify({ users: [], analyses: [], chatHistories: [] }, null, 2));
  }
} catch (err) {
  console.warn('Filesystem is read-only, using in-memory fallback DB:', err.message);
  useInMemoryFallback = true;
}

const usePostgresSsl = DATABASE_URL && !DATABASE_URL.includes('localhost') && !DATABASE_URL.includes('127.0.0.1');

if (DATABASE_URL) {
  pool = new Pool({
    connectionString: DATABASE_URL,
    ssl: usePostgresSsl ? { rejectUnauthorized: false } : false
  });
}

const mapAnalysisRow = (row) => row ? ({
  userId: row.userId,
  githubUsername: row.githubUsername,
  scores: row.scores,
  githubData: row.githubData,
  resumeData: row.resumeData,
  linkedinData: row.linkedinData,
  linkedinUsername: row.linkedinUsername || row.linkedinUrl || row.linkedin_url,
  targetRole: row.targetRole,
  createdAt: row.createdAt,
  updatedAt: row.updatedAt
}) : null;

const initializeDatabase = async () => {
  if (!pool) {
    console.warn('DATABASE_URL is not set. Running in JSON File Fallback Mode.');
    return;
  }
  try {
    const connected = await pool.query('SELECT NOW()');
    console.log('PostgreSQL connected:', connected.rows[0]);
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        username TEXT NOT NULL UNIQUE,
        email TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      CREATE TABLE IF NOT EXISTS analyses (
        user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
        github_username TEXT,
        scores JSONB,
        github_data JSONB,
        resume_data JSONB,
        linkedin_data JSONB,
        linkedin_url TEXT,
        target_role TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      CREATE TABLE IF NOT EXISTS chat_histories (
        user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
        messages JSONB NOT NULL DEFAULT '[]'::jsonb,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      CREATE TABLE IF NOT EXISTS resume_analyses (
        id SERIAL PRIMARY KEY,
        user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
        source_data JSONB,
        analysis_data JSONB,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      CREATE TABLE IF NOT EXISTS github_analyses (
        id SERIAL PRIMARY KEY,
        user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
        github_username TEXT,
        source_data JSONB,
        analysis_data JSONB,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      CREATE TABLE IF NOT EXISTS linkedin_analyses (
        id SERIAL PRIMARY KEY,
        user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
        linkedin_url TEXT,
        source_data JSONB,
        analysis_data JSONB,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      CREATE TABLE IF NOT EXISTS job_matches (
        id SERIAL PRIMARY KEY,
        user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
        job_description TEXT,
        analysis_data JSONB,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      CREATE TABLE IF NOT EXISTS candidate_reports (
        id SERIAL PRIMARY KEY,
        user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
        report_data JSONB,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      CREATE TABLE IF NOT EXISTS project_gap_analyses (
        id SERIAL PRIMARY KEY,
        user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
        analysis_data JSONB,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      CREATE TABLE IF NOT EXISTS repository_analyses (
        repo_hash TEXT PRIMARY KEY,
        analysis_data JSONB NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      CREATE TABLE IF NOT EXISTS linkedin_rapidapi_cache (
        username TEXT PRIMARY KEY,
        raw_data JSONB NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      CREATE TABLE IF NOT EXISTS ai_usage (
        id SERIAL PRIMARY KEY,
        date DATE NOT NULL UNIQUE,
        requests_today INTEGER NOT NULL DEFAULT 0,
        cache_hits INTEGER NOT NULL DEFAULT 0,
        total_response_time_ms BIGINT NOT NULL DEFAULT 0,
        last_error TEXT,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);
    isDbConnected = true;
  } catch (err) {
    console.warn(`PostgreSQL connection failed: ${err.message}. Running in JSON File Fallback Mode.`);
    isDbConnected = false;
  }
};

initializeDatabase();

// Global AI Usage Logger (Decoupled from GeminiService)
global.logAiUsage = async (isCacheHit, durationMs, errorMsg) => {
  if (!isDbConnected) return;
  try {
    await pool.query(`
      INSERT INTO ai_usage (date, requests_today, cache_hits, total_response_time_ms, last_error)
      VALUES (CURRENT_DATE, 1, $1, $2, $3)
      ON CONFLICT (date) DO UPDATE SET
        requests_today = ai_usage.requests_today + 1,
        cache_hits = ai_usage.cache_hits + EXCLUDED.cache_hits,
        total_response_time_ms = ai_usage.total_response_time_ms + EXCLUDED.total_response_time_ms,
        last_error = COALESCE(EXCLUDED.last_error, ai_usage.last_error),
        updated_at = NOW()
    `, [isCacheHit ? 1 : 0, durationMs || 0, errorMsg || null]);
  } catch (e) {
    console.error('Failed to log AI usage:', e.message);
  }
};
// ==========================================
// AUTHENTICATION MIDDLEWARE
// ==========================================
const authenticateToken = (req, res, next) => {
  // Accept token from: Authorization header, request body, or query param
  const authHeader = req.headers['authorization'];
  const token =
    (authHeader && authHeader.split(' ')[1]) ||
    req.body?.token ||
    req.query?.token;

  if (!token) return res.status(401).json({ error: 'Access denied. No token provided.' });

  try {
    const verified = jwt.verify(token, JWT_SECRET);
    req.user = verified;
    next();
  } catch (err) {
    res.status(403).json({ error: 'Invalid token.' });
  }
};
// [authenticateToken moved above usage route]

// AI Usage Analytics Endpoint
app.get('/api/ai/usage', authenticateToken, async (req, res) => {
  if (isDbConnected) {
    try {
      const result = await pool.query(`SELECT * FROM ai_usage WHERE date = CURRENT_DATE`);
      if (result.rows.length > 0) {
        return res.json({ success: true, data: result.rows[0] });
      }
    } catch (e) {
      console.warn('Failed to fetch AI usage:', e.message);
    }
  }
  return res.json({ 
    success: true, 
    data: { requests_today: 0, cache_hits: 0, total_response_time_ms: 0, last_error: null } 
  });
});

const readLocalDb = () => {
  if (useInMemoryFallback) return inMemoryDb;
  try {
    return JSON.parse(fs.readFileSync(LOCAL_DB_PATH, 'utf-8'));
  } catch (err) {
    return { users: [], analyses: [], chatHistories: [] };
  }
};

const writeLocalDb = (data) => {
  if (useInMemoryFallback) { inMemoryDb = data; return; }
  try {
    fs.writeFileSync(LOCAL_DB_PATH, JSON.stringify(data, null, 2));
  } catch (err) {
    console.warn('Could not write to local DB file:', err.message);
    useInMemoryFallback = true;
    inMemoryDb = data;
  }
};

// [authenticateToken moved above usage route]

// ==========================================
// AUTHENTICATION CONTROLLERS
// ==========================================
app.post('/api/auth/register', async (req, res) => {
  const { username, email, password } = req.body;
  if (!username || !email || !password) {
    return res.status(400).json({ error: 'All fields are required.' });
  }
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    if (isDbConnected) {
      const existingUser = await pool.query('SELECT id FROM users WHERE username = $1 OR email = $2 LIMIT 1', [username, email]);
      if (existingUser.rows.length > 0) return res.status(400).json({ error: 'Username or Email already exists.' });
      const newId = randomUUID();
      const created = await pool.query(`INSERT INTO users (id, username, email, password) VALUES ($1, $2, $3, $4) RETURNING id, username, email`, [newId, username, email, hashedPassword]);
      const newUser = created.rows[0];
      const token = jwt.sign({ id: newUser.id, username: newUser.username }, JWT_SECRET, { expiresIn: '7d' });
      return res.status(201).json({ token, user: { id: newUser.id, username: newUser.username, email: newUser.email } });
    } else {
      const db = readLocalDb();
      const existing = db.users.find(u => u.username === username || u.email === email);
      if (existing) return res.status(400).json({ error: 'Username or Email already exists.' });
      const newId = randomUUID();
      const newUser = { id: newId, username, email, password: hashedPassword };
      db.users.push(newUser);
      writeLocalDb(db);
      const token = jwt.sign({ id: newId, username }, JWT_SECRET, { expiresIn: '7d' });
      return res.status(201).json({ token, user: { id: newId, username, email } });
    }
  } catch (error) {
    console.error('[register] Error:', error.message);
    res.status(500).json({ error: 'Server error during registration.', detail: error.message });
  }
});

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password are required.' });
  try {
    if (isDbConnected) {
      const userResult = await pool.query('SELECT id, username, email, password FROM users WHERE email = $1 LIMIT 1', [email]);
      const user = userResult.rows[0];
      if (!user) return res.status(400).json({ error: 'Invalid email or password.' });
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) return res.status(400).json({ error: 'Invalid email or password.' });
      const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '7d' });
      return res.json({ token, user: { id: user.id, username: user.username, email: user.email } });
    } else {
      const db = readLocalDb();
      const user = db.users.find(u => u.email === email);
      if (!user) return res.status(400).json({ error: 'Invalid email or password.' });
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) return res.status(400).json({ error: 'Invalid email or password.' });
      const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '7d' });
      return res.json({ token, user: { id: user.id, username: user.username, email: user.email } });
    }
  } catch (error) {
    res.status(500).json({ error: 'Server error during login.' });
  }
});

app.get('/api/auth/me', authenticateToken, async (req, res) => {
  try {
    if (isDbConnected) {
      const userResult = await pool.query(`SELECT id, username, email, created_at AS "createdAt" FROM users WHERE id = $1 LIMIT 1`, [req.user.id]);
      const user = userResult.rows[0];
      if (!user) return res.status(404).json({ error: 'User not found.' });
      return res.json(user);
    } else {
      const db = readLocalDb();
      const user = db.users.find(u => u.id === req.user.id);
      if (!user) return res.status(404).json({ error: 'User not found.' });
      const { password, ...userWithoutPassword } = user;
      return res.json(userWithoutPassword);
    }
  } catch (error) {
    res.status(500).json({ error: 'Server error fetching user.' });
  }
});

// 4. Retrieve scans
app.get('/api/history', authenticateToken, async (req, res) => {
  try {
    if (isDbConnected) {
      const analysisResult = await pool.query(
        `SELECT user_id AS "userId", github_username AS "githubUsername", scores, github_data AS "githubData", resume_data AS "resumeData", linkedin_data AS "linkedinData", linkedin_url AS "linkedinUsername", target_role AS "targetRole", created_at AS "createdAt", updated_at AS "updatedAt" FROM analyses WHERE user_id = $1 LIMIT 1`,
        [req.user.id]
      );
      return res.json(mapAnalysisRow(analysisResult.rows[0]));
    } else {
      const db = readLocalDb();
      const analysis = db.analyses.find(a => a.userId === req.user.id);
      return res.json(analysis || null);
    }
  } catch (error) {
    res.status(500).json({ error: 'Server error retrieving history.' });
  }
});



const JOB_PROFILES = {
  'frontend': {
    title: 'Frontend Engineer',
    requiredSkills: ['React', 'TypeScript', 'CSS/SCSS', 'Vite/Webpack', 'State Management (Redux/Zustand)', 'Jest/Cypress', 'Responsive Design', 'Next.js', 'CI/CD'],
    resources: {
      'React': 'https://react.dev/learn',
      'TypeScript': 'https://www.typescriptlang.org/docs/',
      'Next.js': 'https://nextjs.org/docs',
      'Jest/Cypress': 'https://testing-library.com/docs/react-testing-library/intro/'
    }
  },
  'backend': {
    title: 'Backend Engineer',
    requiredSkills: ['Node.js', 'Express', 'SQL (PostgreSQL/MySQL)', 'NoSQL (MongoDB)', 'Redis', 'Docker', 'API Design (REST/GraphQL)', 'Microservices', 'System Design'],
    resources: {
      'Node.js': 'https://nodejs.org/en/docs/',
      'SQL (PostgreSQL)': 'https://www.postgresql.org/docs/',
      'Docker': 'https://docs.docker.com/get-started/',
      'System Design': 'https://github.com/donnemartin/system-design-primer'
    }
  },
  'fullstack': {
    title: 'Full-Stack Developer',
    requiredSkills: ['React', 'Node.js', 'TypeScript', 'SQL/NoSQL Databases', 'Docker', 'REST/GraphQL APIs', 'AWS/GCP basics', 'Git & CI/CD', 'State Management'],
    resources: {
      'React & Node': 'https://fullstackopen.com/en/',
      'AWS': 'https://aws.amazon.com/developer/learning-paths/',
      'Git & CI/CD': 'https://git-scm.com/doc'
    }
  },
  'ml-engineer': {
    title: 'Machine Learning Engineer',
    requiredSkills: ['Python', 'PyTorch/TensorFlow', 'Scikit-Learn', 'Linear Algebra & Calculus', 'Pandas & NumPy', 'MLOps (MLflow/DVC)', 'SQL', 'Data Engineering (Spark)', 'Model Deployment'],
    resources: {
      'PyTorch': 'https://pytorch.org/tutorials/',
      'Scikit-Learn': 'https://scikit-learn.org/stable/user_guide.html',
      'MLOps': 'https://www.coursera.org/specializations/machine-learning-engineering-for-production-mlops'
    }
  }
};

// 5. Get dynamic roadmaps
app.get('/api/roadmap', async (req, res) => {
  const roleKey = req.query.role || 'frontend';
  const profile = JOB_PROFILES[roleKey] || JOB_PROFILES['frontend'];
  const token = req.query.token;

  let userId = null;
  if (token) {
    try { const decoded = jwt.verify(token, JWT_SECRET); userId = decoded.id; } catch (e) { }
  }

  let activeGithub = null;
  let activeResume = null;
  let activeLinkedin = null;

  if (userId) {
    if (isDbConnected) {
      const analysisResult = await pool.query(
        `SELECT github_data AS "githubData", resume_data AS "resumeData", linkedin_data AS "linkedinData" FROM analyses WHERE user_id = $1 LIMIT 1`,
        [userId]
      );
      const analysis = analysisResult.rows[0];
      if (analysis) { activeGithub = analysis.githubData; activeResume = analysis.resumeData; activeLinkedin = analysis.linkedinData; }
    } else {
      const db = readLocalDb();
      const analysis = db.analyses.find(a => a.userId === userId);
      if (analysis) { activeGithub = analysis.githubData; activeResume = analysis.resumeData; activeLinkedin = analysis.linkedinData; }
    }
  }

  const userSkills = new Set();
  if (activeGithub?.languages) activeGithub.languages.forEach(l => l && l.name && userSkills.add(l.name));
  if (activeGithub?.topLanguages) activeGithub.topLanguages.forEach(l => l && userSkills.add(typeof l === 'string' ? l : l.name));
  if (activeResume?.foundKeywords) activeResume.foundKeywords.forEach(kw => kw && userSkills.add(kw));
  if (activeLinkedin?.foundKws) activeLinkedin.foundKws.forEach(kw => kw && userSkills.add(kw));
  if (activeLinkedin?.metrics?.skillMatch >= 70) userSkills.add('LinkedIn Profile Optimization');
  if (userSkills.size === 0) ['React', 'JavaScript', 'HTML', 'CSS', 'Git'].forEach(s => userSkills.add(s));

  const completed = [], gap = [];
  profile.requiredSkills.forEach(skill => {
    let hasSkill = false;
    userSkills.forEach(us => {
      const usL = us.toLowerCase().replace(/[^a-z0-9]/g, '');
      const skL = skill.toLowerCase().split('/')[0].split('(')[0].replace(/[^a-z0-9]/g, '');
      const skL2 = skill.toLowerCase().includes('/') ? skill.toLowerCase().split('/')[1].split('(')[0].replace(/[^a-z0-9]/g, '') : null;

      if (usL === skL || usL.includes(skL) || skL.includes(usL)) {
        hasSkill = true;
      }
      if (skL2 && (usL === skL2 || usL.includes(skL2) || skL2.includes(usL))) {
        hasSkill = true;
      }
    });
    if (hasSkill) completed.push(skill);
    else gap.push(skill);
  });

  res.json({
    roleTitle: profile.title,
    completed,
    gap,
    completionPercent: Math.round((completed.length / profile.requiredSkills.length) * 100),
    resources: profile.resources
  });
});

// 6. AI Chatbot — IMPROVED WITH PERSONALIZED RESPONSES
const normalizeSkillText = (value = '') => value.toString().toLowerCase().replace(/[^a-z0-9+#.]+/g, ' ').trim();

const getProfileSignals = (github, resume, linkedin, roleKey = 'frontend') => {
  const profile = JOB_PROFILES[roleKey] || JOB_PROFILES.frontend;
  const foundSkills = new Set();
  const weakChannels = [];

  if (github?.languages) github.languages.forEach(lang => foundSkills.add(lang.name));
  if (resume?.foundKeywords) resume.foundKeywords.forEach(skill => foundSkills.add(skill));
  if (linkedin?.foundKws) linkedin.foundKws.forEach(skill => foundSkills.add(skill));

  const foundNormalized = [...foundSkills].map(normalizeSkillText);
  const missingRoleSkills = profile.requiredSkills.filter(skill => {
    const normalized = normalizeSkillText(skill);
    return !foundNormalized.some(found => normalized.includes(found) || found.includes(normalized.split(' ')[0]));
  });

  if (!github) weakChannels.push('GitHub proof-of-work');
  else if ((github.docScore || 0) < 70) weakChannels.push('GitHub documentation');
  if (!resume) weakChannels.push('ATS resume evidence');
  else if ((resume.atsScore || 0) < 75) weakChannels.push('resume keyword alignment');
  if (!linkedin) weakChannels.push('LinkedIn recruiter visibility');
  else if ((linkedin.score || 0) < 75) weakChannels.push('LinkedIn recruiter visibility');

  const missingFromResume = resume?.roleKeywordsMissing || resume?.missingKeywords || [];
  return {
    roleTitle: profile.title,
    foundSkills: [...foundSkills],
    missingSkills: [...new Set([...missingRoleSkills, ...missingFromResume])].slice(0, 8),
    weakChannels
  };
};

const getDynamicProjectIdeas = (signals, roleKey = 'frontend') => {
  const missing = signals.missingSkills;
  const primaryGap = missing[0] || 'production deployment';
  const secondaryGap = missing[1] || 'testing';

  const templates = {
    frontend: [
      `Build a role-focused React dashboard that proves ${primaryGap}, with real filters, charts, responsive states, and tests.`,
      `Create a component library with Storybook, accessibility checks, and examples that highlight ${secondaryGap}.`,
      `Ship a GitHub-powered portfolio case study that documents tradeoffs, screenshots, and measurable UI improvements.`
    ],
    backend: [
      `Build a production API for job applications using ${primaryGap}, auth, validation, pagination, and audit logs.`,
      `Create a queue-backed notification service that demonstrates ${secondaryGap}, retries, rate limits, and monitoring.`,
      `Ship a documented system-design case study with Docker setup, database migrations, and API benchmarks.`
    ],
    fullstack: [
      `Build a full-stack placement tracker using ${primaryGap}, auth, analytics, file upload, and role-based dashboards.`,
      `Create a SaaS-style project with ${secondaryGap}, subscriptions/mock billing, background jobs, and deployment docs.`,
      `Ship a public portfolio app that combines GitHub stats, resume insights, and recruiter-ready project writeups.`
    ],
    'ml-engineer': [
      `Build an ML resume ranker using ${primaryGap}, model evaluation, experiment tracking, and a small inference API.`,
      `Create a data pipeline project that demonstrates ${secondaryGap}, feature engineering, monitoring, and notebooks.`,
      `Ship a deployed model demo with API endpoints, drift checks, explainability notes, and measurable metrics.`
    ]
  };

  return (templates[roleKey] || templates.frontend).map((idea, index) => `${index + 1}. ${idea}`).join('\n');
};

app.post('/api/chat', async (req, res) => {
  const { messages, token } = req.body;
  let userId = null;
  if (token) {
    try { const decoded = jwt.verify(token, JWT_SECRET); userId = decoded.id; } catch (e) { }
  }

  if (userId) {
    if (isDbConnected) {
      const userCheck = await pool.query('SELECT id FROM users WHERE id = $1 LIMIT 1', [userId]);
      if (userCheck.rows.length === 0) userId = null;
    } else {
      const db = readLocalDb();
      if (!db.users.some(u => u.id === userId)) userId = null;
    }
  }

  // Load user's actual analysis data for personalized responses
  let userAnalysis = null;
  if (userId) {
    if (isDbConnected) {
      const result = await pool.query(`SELECT github_data AS "githubData", resume_data AS "resumeData", linkedin_data AS "linkedinData", scores, target_role AS "targetRole" FROM analyses WHERE user_id = $1 LIMIT 1`, [userId]);
      userAnalysis = result.rows[0] || null;
    } else {
      const db = readLocalDb();
      userAnalysis = db.analyses.find(a => a.userId === userId) || null;
    }
  }

  const github = userAnalysis?.githubData || null;
  const resume = userAnalysis?.resumeData || null;
  const linkedin = userAnalysis?.linkedinData || null;
  const scores = userAnalysis?.scores || {};
  const roleKey = userAnalysis?.targetRole || 'frontend';
  const signals = getProfileSignals(github, resume, linkedin, roleKey);

  const userMessage = messages[messages.length - 1].content.toLowerCase();
  let responseText = '';

  if (userMessage.includes('hello') || userMessage.includes('hi') || userMessage.includes('hey') || userMessage.includes('start')) {
    responseText = `👋 Hi there! I'm your AI Career Coach. Here's what I can see about your profile:\n\n` +
      `• **GitHub Score:** ${scores.github !== null && scores.github !== undefined ? `${scores.github}/100` : 'Not connected yet'}\n` +
      `• **Resume ATS Score:** ${scores.ats !== null && scores.ats !== undefined ? `${scores.ats}/100` : 'Not analyzed yet'}\n` +
      `• **LinkedIn Score:** ${scores.careerReady !== null && scores.careerReady !== undefined ? `${scores.careerReady}/100` : 'Not connected yet'}\n\n` +
      `What would you like to improve? You can ask me about:\n- "How do I improve my GitHub?"\n- "What keywords should I add to my resume?"\n- "Help me prepare for an interview"\n- "What skills should I learn next?"`;
  } else if (userMessage.includes('github') || userMessage.includes('repo') || userMessage.includes('repository') || userMessage.includes('portfolio')) {
    if (github) {
      const topIssue = github.flaggedRepos?.length > 0 ? `Your repos **${github.flaggedRepos.slice(0, 2).join(', ')}** are missing descriptions.` : 'Your repo descriptions look good!';
      responseText = `📊 **Your GitHub Analysis (Score: ${github.score}/100)**\n\n` +
        `You have **${github.publicRepos} public repos** with ${github.followers} followers.\n\n` +
        `**Top issues to fix:**\n` +
        `1. ${topIssue}\n` +
        `2. **README quality (${github.docScore}%):** ${github.docScore < 70 ? 'Add proper README files with project description, setup instructions, and screenshots.' : 'Good README coverage — consider adding demo GIFs for visual impact.'}\n` +
        `3. **Stars & forks:** ${github.totalStars || 0} total stars. Share your best projects on Twitter/LinkedIn to attract more stars.\n\n` +
        `**Quick wins:**\n- Add descriptions to ALL repos\n- Pin your 6 best projects on your profile\n- Add a README to every project`;
    } else {
      responseText = `📊 **GitHub isn't connected yet!**\n\nGo to the **GitHub Analyzer** tab and enter your username to get a full repo audit. Once connected, I can give you personalized tips based on your actual repositories.`;
    }
  } else if (userMessage.includes('resume') || userMessage.includes('ats') || userMessage.includes('cv') || userMessage.includes('keyword')) {
    if (resume) {
      const missingTop = resume.missingKeywords?.slice(0, 4).join(', ') || 'none';
      responseText = `📄 **Your Resume Analysis (ATS Score: ${resume.atsScore}/100)**\n\n` +
        `**Word count:** ${resume.wordCount || 'unknown'} words. ${(resume.wordCount || 0) < 300 ? '⚠️ Aim for 400–700 words.' : '✅ Good length.'}\n\n` +
        `**${resume.foundKeywords?.length || 0} keywords found** in your resume.\n\n` +
        `**Top missing keywords to add:**\n${missingTop}\n\n` +
        `**Your action verb count:** ${resume.actionVerbCount}/8. ${resume.actionVerbCount < 5 ? 'Add more: Engineered, Deployed, Optimized, Reduced, Built.' : '✅ Good action verb usage.'}\n\n` +
        `**Specific suggestions:**\n${resume.suggestions?.slice(0, 2).map(s => `- ${s}`).join('\n') || '- Resume looks good overall!'}`;
    } else {
      responseText = `📄 **Resume isn't analyzed yet!**\n\nGo to the **Resume Analyzer** tab and upload your resume or paste the text. I'll then be able to give you personalized ATS improvement tips, keyword gaps, and section-specific advice.`;
    }
  } else if (userMessage.includes('linkedin') || userMessage.includes('profile visibility') || userMessage.includes('recruiter')) {
    if (linkedin) {
      responseText = `💼 **Your LinkedIn Analysis (Score: ${linkedin.score}/100)**\n\n` +
        `**URL:** ${linkedin.hasCustomSlug ? '✅ Custom URL — great for professionalism!' : '⚠️ Default URL detected. Customize it at linkedin.com/public-profile/settings.'}\n\n` +
        `**Suggested headline:**\n"${linkedin.suggestedHeadline}"\n\n` +
        `**Top optimization tips:**\n${linkedin.tips?.slice(0, 3).map(t => `- ${t}`).join('\n') || '- Fill in the self-assessment checklist in the LinkedIn tab.'}\n\n` +
        `💡 Note: LinkedIn doesn't allow third-party access to your profile data. Use the LinkedIn tab's self-assessment checklist to get a more accurate score.`;
    } else {
      responseText = `💼 **LinkedIn isn't connected yet!**\n\nGo to the **LinkedIn Analyzer** tab and enter your LinkedIn URL. Also fill in the self-assessment checklist to get an accurate profile score based on your actual profile status.`;
    }
  } else if (userMessage.includes('interview') || userMessage.includes('mock') || userMessage.includes('question')) {
    const questions = [
      '"Explain the difference between client-side rendering (CSR) and server-side rendering (SSR). When would you choose Next.js over plain React?"',
      '"What is the difference between SQL JOIN types? Give a real example of when you\'d use LEFT JOIN vs INNER JOIN."',
      '"Describe how you\'d design a URL shortener like bit.ly. What database, caching, and API structure would you use?"',
      '"What is a closure in JavaScript? Can you give a practical example from a real project?"',
      '"How does React\'s reconciliation algorithm work? What are the rules for using Keys effectively?"'
    ];
    const q = questions[Math.floor(Math.random() * questions.length)];
    responseText = `🎯 **Mock Interview Question:**\n\n${q}\n\n**Tips for answering:**\n1. Think out loud — interviewers want to see your thought process\n2. Give a concrete example from your own experience\n3. Mention trade-offs and alternatives you considered\n\nWant another question? Just say "Give me another question" or specify a topic like "ask me about system design" or "ask me about JavaScript".`;
  } else if (userMessage.includes('learn') || userMessage.includes('skill') || userMessage.includes('next') || userMessage.includes('roadmap')) {
    const missingSkills = resume?.missingKeywords?.slice(0, 3) || ['TypeScript', 'Docker', 'CI/CD'];
    responseText = `🗺️ **Skill Recommendations Based on Your Profile:**\n\n` +
      `Based on your analysis, the highest-impact skills to learn next are:\n\n` +
      `1. **${missingSkills[0] || 'TypeScript'}** — Strongly typed JavaScript. Huge demand in enterprise jobs. Start: [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/intro.html)\n` +
      `2. **${missingSkills[1] || 'Docker'}** — Containerization is expected at mid-level+. Start: [Docker Getting Started](https://docs.docker.com/get-started/)\n` +
      `3. **${missingSkills[2] || 'CI/CD'}** — GitHub Actions is the easiest entry point. Set up auto-deploy for one of your projects.\n\n` +
      `Check the **Skill Gap** tab for your full personalized roadmap based on your target role.`;
    const personalizedMissingSkills = signals.missingSkills.slice(0, 3);
    responseText = `Skill Recommendations Based on Your Profile:\n\n` +
      `For a **${signals.roleTitle}** target, your highest-impact next skills are:\n\n` +
      `1. **${personalizedMissingSkills[0] || 'TypeScript'}** - add this to one visible project and your resume skills section.\n` +
      `2. **${personalizedMissingSkills[1] || 'Docker'}** - prove it with setup docs and a deployable repo.\n` +
      `3. **${personalizedMissingSkills[2] || 'CI/CD'}** - show automation with GitHub Actions or a similar pipeline.\n\n` +
      `Detected strengths: ${signals.foundSkills.slice(0, 6).join(', ') || 'not enough data yet'}.\n` +
      `Weakest channel: ${signals.weakChannels[0] || 'profile depth looks balanced'}.\n\n` +
      `Check the **Skill Gap** tab for the full roadmap.`;
  } else if (userMessage.includes('salary') || userMessage.includes('pay') || userMessage.includes('package') || userMessage.includes('ctc')) {
    const ghScore = scores.github || 0;
    const atsScore = scores.ats || 0;
    const avgScore = Math.round((ghScore + atsScore) / (ghScore && atsScore ? 2 : 1)) || 60;
    responseText = `💰 **Salary Benchmark (India Market, 2025):**\n\n` +
      `Based on a combined profile score of ~${avgScore}/100:\n\n` +
      `• **Fresher (0–1 yr):** ₹3–8 LPA | After upskilling: ₹8–15 LPA\n` +
      `• **Mid-Level (2–4 yrs):** ₹12–25 LPA | FAANG/Startup: ₹25–60 LPA\n` +
      `• **Senior (5+ yrs):** ₹25–60 LPA | FAANG: ₹60–120 LPA+\n\n` +
      `**To maximize your package:**\n- A GitHub score of 75+ signals strong practical skills\n- ATS score 80+ gets you past automated filters\n- 500+ LinkedIn connections makes you discoverable to recruiters\n\nRemember: Skills + Projects + Network = Salary. No shortcut.`;
  } else if (userMessage.includes('project') || userMessage.includes('idea') || userMessage.includes('build')) {
    responseText = `💡 **Project Ideas Based on Your Current Gaps:**\n\n` +
      `Target role: **${signals.roleTitle}**\n` +
      `Detected skills: ${signals.foundSkills.slice(0, 8).join(', ') || 'not enough data yet'}\n` +
      `Gaps to prove: ${signals.missingSkills.slice(0, 5).join(', ') || 'production polish and measurable impact'}\n\n` +
      `${getDynamicProjectIdeas(signals, roleKey)}\n\n` +
      `Open the **Project Ideas** tab for scoped builds with stacks and learning goals.`;
  } else if (userMessage.includes('skill gap') || userMessage.includes('weakness')) {
    const missingList = signals.missingSkills.map(s => `- ${s}`).join('\n');
    responseText = `🔍 **Your Detected Skill Gaps for ${signals.roleTitle}:**\n\n` +
      `${missingList ? missingList : '- You have great coverage!'}\n\n` +
      `Your weakest channel is **${signals.weakChannels[0] || 'none'}**. I recommend focusing your efforts there next.`;
  } else {
    responseText = `🤖 I'm your AI Career Coach! Here are things I can help you with:\n\n` +
      `- 📊 **GitHub review** — "How do I improve my GitHub score?"\n` +
      `- 📄 **Resume tips** — "What keywords am I missing in my resume?"\n` +
      `- 💼 **LinkedIn optimization** — "How do I improve my LinkedIn profile?"\n` +
      `- 🎯 **Mock interview** — "Give me a technical interview question"\n` +
      `- 🗺️ **Skills to learn** — "What should I learn next?"\n` +
      `- 💰 **Salary info** — "What salary can I expect?"\n` +
      `- 💡 **Project ideas** — "What projects should I build?"\n\n` +
      `What would you like help with?`;
  }

  const assistantMsg = { role: 'assistant', content: responseText, timestamp: new Date() };

  if (userId) {
    const userMsg = { role: 'user', content: messages[messages.length - 1].content, timestamp: new Date() };
    if (isDbConnected) {
      await pool.query(
        `INSERT INTO chat_histories (user_id, messages) VALUES ($1, $2::jsonb)
         ON CONFLICT (user_id) DO UPDATE SET messages = chat_histories.messages || EXCLUDED.messages, updated_at = NOW()`,
        [userId, JSON.stringify([userMsg, assistantMsg])]
      );
    } else {
      const db = readLocalDb();
      let ch = db.chatHistories.find(c => c.userId === userId);
      if (!ch) { ch = { userId, messages: [] }; db.chatHistories.push(ch); }
      ch.messages.push(userMsg, assistantMsg);
      writeLocalDb(db);
    }
  }

  setTimeout(() => res.json(assistantMsg), 400);
});

app.get('/api/chat/history', authenticateToken, async (req, res) => {
  try {
    if (isDbConnected) {
      const historyResult = await pool.query('SELECT messages FROM chat_histories WHERE user_id = $1 LIMIT 1', [req.user.id]);
      return res.json(historyResult.rows[0] ? historyResult.rows[0].messages : []);
    } else {
      const db = readLocalDb();
      const history = db.chatHistories.find(c => c.userId === req.user.id);
      return res.json(history ? history.messages : []);
    }
  } catch (error) {
    res.status(500).json({ error: 'Server error retrieving chat history.' });
  }
});

const checkDbConnected = () => isDbConnected;

app.use('/api/analyze/resume', resumeRoutes(pool, authenticateToken, checkDbConnected, readLocalDb, writeLocalDb));
app.use('/api/analyze/github', githubRoutes(pool, authenticateToken, checkDbConnected, readLocalDb, writeLocalDb));
app.use('/api/analyze/linkedin', linkedinRoutes(pool, authenticateToken, checkDbConnected, readLocalDb, writeLocalDb));
app.use('/api/analyze/project-gap', projectGapRoutes(pool, authenticateToken, checkDbConnected, readLocalDb, writeLocalDb));
app.use('/api/analyze/job-match', jobMatchRoutes(pool, authenticateToken, checkDbConnected, readLocalDb, writeLocalDb));
app.use('/api/analyze/report', reportRoutes(pool, authenticateToken, checkDbConnected, readLocalDb, writeLocalDb));
app.use('/api/analyze/candidate-report', reportRoutes(pool, authenticateToken, checkDbConnected, readLocalDb, writeLocalDb));
app.use('/api/intelligence/report', intelligenceRoutes(pool, authenticateToken, checkDbConnected, readLocalDb, writeLocalDb));

// LinkedIn PDF upload — accepts JSON body { linkedinText } OR multipart file upload
app.post('/api/analyze/linkedin-pdf', authenticateToken, upload.single('file'), async (req, res) => {
  try {
    let extractedText = '';

    // Priority 1: JSON body with pre-extracted text (how the frontend sends it after /api/parse/resume)
    if (req.body.linkedinText && req.body.linkedinText.trim().length > 20) {
      extractedText = req.body.linkedinText.trim();
    } else if (req.file) {
      // Priority 2: Actual file upload
      const { buffer, mimetype, originalname } = req.file;
      const ext = (originalname || '').split('.').pop().toLowerCase();

      if (ext === 'pdf' || mimetype === 'application/pdf') {
        try {
          const pdfData = await pdfParse(buffer);
          extractedText = pdfData.text || '';
        } catch (e) {
          return res.status(422).json({ success: false, error: 'Could not extract text from the LinkedIn PDF.' });
        }
      } else if (ext === 'txt' || (mimetype && mimetype.startsWith('text/'))) {
        extractedText = buffer.toString('utf-8');
      } else {
        return res.status(400).json({ success: false, error: 'Please upload a PDF or text file.' });
      }
    } else {
      return res.status(400).json({ success: false, error: 'No LinkedIn text or PDF file provided.' });
    }

    if (!extractedText.trim()) {
      return res.status(422).json({ success: false, error: 'The file appears to be empty or image-based.' });
    }


    // Treat the PDF text as a mock LinkedIn profile for analysis
    const userId = req.user.id;
    let resumeData = null;
    let githubData = null;

    if (isDbConnected) {
      const profileResult = await pool.query(
        `SELECT resume_data, github_data FROM analyses WHERE user_id = $1 LIMIT 1`, [userId]
      );
      if (profileResult.rows.length > 0) {
        resumeData = profileResult.rows[0].resume_data;
        githubData = profileResult.rows[0].github_data;
      }
    }

    const { analyzeLinkedin } = await import('./server/services/linkedinService.js');
    const rawProfileData = {
      pdfText: extractedText.substring(0, 3000),
      source: 'linkedin_pdf',
      _resumeKeywords: resumeData?.foundKeywords || [],
      _githubLanguages: githubData?.languages?.map(l => l.name || l) || [],
    };

    const { source_data, analysis_result } = await analyzeLinkedin(rawProfileData, resumeData, githubData);

    const normalized = {
      ...analysis_result,
      score: Math.max(45, Math.min(100, Number(analysis_result.profileCompleteness ?? 60) || 60)),
      source: 'linkedin_pdf',
      strengths: analysis_result.linkedinStrengths || [],
      weaknesses: analysis_result.linkedinWeaknesses || [],
      recommendations: analysis_result.profileOptimizationSuggestions || [],
      crossAnalysis: {
        resumeConsistency: analysis_result.resumeConsistency || '',
        githubConsistency: analysis_result.githubConsistency || '',
      },
      tips: analysis_result.profileOptimizationSuggestions || [],
      foundKws: resumeData?.foundKeywords || [],
    };

    if (isDbConnected) {
      await pool.query(
        `INSERT INTO linkedin_analyses (user_id, linkedin_url, source_data, analysis_data)
         VALUES ($1, $2, $3::jsonb, $4::jsonb)`,
        [userId, 'linkedin_pdf_upload', JSON.stringify(source_data), JSON.stringify(normalized)]
      );
      await pool.query(
        `INSERT INTO analyses (user_id, linkedin_data, scores) VALUES ($1, $2::jsonb, $3::jsonb)
         ON CONFLICT (user_id) DO UPDATE SET
           linkedin_data = EXCLUDED.linkedin_data,
           scores = COALESCE(analyses.scores, '{}'::jsonb) || jsonb_build_object('careerReady', $4::int),
           updated_at = NOW()`,
        [userId, JSON.stringify(normalized), JSON.stringify({ careerReady: normalized.score }), normalized.score]
      );
    }

    return res.json({ success: true, data: normalized });
  } catch (err) {
    console.error('[linkedin-pdf] Error:', err);
    return res.status(500).json({ success: false, error: err.message || 'LinkedIn PDF analysis failed.' });
  }
});



// ── FILE PARSING ENDPOINT ─────────────────────────────────────────────────────
// Accepts multipart/form-data with a 'file' field (PDF, DOCX, TXT, MD)
// Returns { text: string } on success or { error: string } on failure
app.post('/api/parse/resume', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded. Please attach a file with field name "file".' });
    }

    const { originalname, buffer, mimetype } = req.file;
    const ext = (originalname || '').split('.').pop().toLowerCase();
    let text = '';

    if (ext === 'txt' || ext === 'md' || mimetype === 'text/plain' || mimetype === 'text/markdown') {
      text = buffer.toString('utf-8');
    } else if (ext === 'pdf' || mimetype === 'application/pdf') {
      try {
        const pdfData = await pdfParse(buffer);
        text = pdfData.text || '';
      } catch (pdfErr) {
        console.error('[parse/resume] PDF parse error:', pdfErr.message);
        return res.status(422).json({ error: 'Could not extract text from this PDF. It may be a scanned image. Please paste your resume text instead.' });
      }
    } else if (ext === 'docx' || mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      try {
        const result = await mammoth.extractRawText({ buffer });
        text = result.value || '';
      } catch (docxErr) {
        console.error('[parse/resume] DOCX parse error:', docxErr.message);
        return res.status(422).json({ error: 'Could not extract text from this DOCX file. Please paste your resume text instead.' });
      }
    } else {
      return res.status(400).json({ error: `Unsupported file type ".${ext}". Please upload a PDF, DOCX, TXT, or MD file.` });
    }

    text = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').trim();

    if (!text || text.length < 30) {
      return res.status(422).json({ error: 'Could not extract meaningful text from this file. Please paste your resume text instead.' });
    }

    res.json({ text, wordCount: text.split(/\s+/).filter(Boolean).length, filename: originalname });
  } catch (err) {
    console.error('[parse/resume] Unexpected error:', err);
    res.status(500).json({ error: 'Server error while parsing file. Please paste your resume text instead.' });
  }
});

app.get('/api/health', async (req, res) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  
  const geminiConfigured = !!process.env.GEMINI_API_KEY && !process.env.GEMINI_API_KEY.includes('your_');
  const rapidApiConfigured = !!process.env.RAPIDAPI_KEY && !process.env.RAPIDAPI_KEY.includes('your_');
  let geminiReachable = false;
  
  if (geminiConfigured) {
    try {
      const testRes = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${process.env.GEMINI_API_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ role: 'user', parts: [{ text: 'Reply with just: OK' }] }],
            generationConfig: { maxOutputTokens: 5 }
          })
        }
      );
      geminiReachable = testRes.status === 200;
    } catch (e) {
      geminiReachable = false;
    }
  }

  res.json({
    geminiConfigured,
    geminiReachable,
    rapidApiConfigured,
    databaseConnected: isDbConnected,
    debug: {
      hasGeminiEnv: !!process.env.GEMINI_API_KEY,
      keyPrefix: process.env.GEMINI_API_KEY ? process.env.GEMINI_API_KEY.substring(0, 5) : 'none',
      nodeEnv: process.env.NODE_ENV
    }
  });
});
// AI Engine Status endpoint
app.get('/api/ai-status', async (req, res) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');

  try {
    const result = await testGeminiConnection();
    
    if (!result.geminiInitialized || !result.testCallSucceeded) {
      return res.json({ 
        status: 'not_configured', 
        message: result.error || 'Gemini API key not configured or invalid',
        usingFallback: true
      });
    }

    return res.json({ status: 'online', message: 'Gemini AI is active', usingFallback: false });
  } catch (e) {
    return res.json({ 
      status: 'error', 
      message: 'Error checking Gemini status',
      usingFallback: true
    });
  }
});

  // NEW AI Status Endpoint with detailed telemetry
  app.get('/api/ai/status', async (req, res) => {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');

    try {
      const result = await testGeminiConnection();
      
      return res.json({
        configured: result.envDetected,
        connected: result.testCallSucceeded,
        model: result.model,
        quotaAvailable: result.testCallSucceeded, // If it succeeded, we have quota
        lastError: result.error,
        rawResponse: result.rawResponse
      });
    } catch (e) {
      return res.json({
        configured: !!process.env.GEMINI_API_KEY,
        connected: false,
        model: "gemini-2.0-flash",
        quotaAvailable: false,
        lastError: e.message,
        rawResponse: null
      });
    }
  });

// /api/debug/gemini — Full Gemini telemetry for production debugging
app.get('/api/debug/gemini', async (req, res) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  try {
    console.log('[/api/debug/gemini] Running Gemini connection test...');
    const result = await testGeminiConnection();
    console.log('[/api/debug/gemini] Result:', JSON.stringify(result));
    res.json(result);
  } catch (e) {
    console.error('[/api/debug/gemini] Unexpected error:', e.message);
    res.json({
      envDetected: !!process.env.GEMINI_API_KEY,
      geminiInitialized: false,
      testCallSucceeded: false,
      model: 'gemini-2.0-flash',
      error: e.message,
      fallbackReason: 'Unexpected server error',
      rawResponse: null
    });
  }
});

export default app;

