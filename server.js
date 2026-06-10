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

const require = createRequire(import.meta.url);
const PDFParse = require('pdf-parse');
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
    `);
    isDbConnected = true;
  } catch (err) {
    console.warn(`PostgreSQL connection failed: ${err.message}. Running in JSON File Fallback Mode.`);
    isDbConnected = false;
  }
};

initializeDatabase();

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

// ==========================================
// AUTHENTICATION MIDDLEWARE
// ==========================================
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Access token required.' });
  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) return res.status(403).json({ error: 'Invalid or expired token.' });
    req.user = decoded;
    next();
  });
};

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

// ==========================================
// FILE PARSING ENDPOINT — REAL TEXT EXTRACTION
// ==========================================
app.post('/api/parse/resume', upload.single('file'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded.' });
  }

  const { originalname, mimetype, buffer } = req.file;
  const ext = path.extname(originalname).toLowerCase();

  try {
    let extractedText = '';

    if (ext === '.pdf' || mimetype === 'application/pdf') {
      let text = '';
      try {
        const PDFParseClass = PDFParse.PDFParse || PDFParse;
        const parser = new PDFParseClass({ data: buffer });
        const result = await parser.getText();
        text = result.text || '';
      } catch (err) {
        console.error('[pdf-parse] Error:', err);
      }
      extractedText = text;
      if (!extractedText.trim()) {
        return res.status(422).json({
          error: 'Could not extract text from this PDF. It may be a scanned/image-based PDF. Please copy-paste your resume text instead.'
        });
      }
    } else if (
      ext === '.docx' ||
      mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ) {
      const result = await mammoth.extractRawText({ buffer });
      extractedText = result.value || '';
      if (!extractedText.trim()) {
        return res.status(422).json({
          error: 'Could not extract text from this DOCX file. Please copy-paste your resume text instead.'
        });
      }
    } else if (ext === '.txt' || ext === '.md' || mimetype.startsWith('text/')) {
      extractedText = buffer.toString('utf-8');
    } else {
      return res.status(415).json({
        error: `Unsupported file type: ${ext}. Please upload a PDF, DOCX, TXT, or MD file.`
      });
    }

    // Sanitize: remove excessive whitespace, null bytes
    extractedText = extractedText
      .replace(/\0/g, '')
      .replace(/\r\n/g, '\n')
      .replace(/\r/g, '\n')
      .replace(/\n{4,}/g, '\n\n')
      .trim();

    if (!looksLikeResume(extractedText)) {
      return res.status(422).json({ error: RESUME_REJECTION_MESSAGE });
    }

    console.log('[parse/resume] Extracted', extractedText.split(/\s+/).filter(Boolean).length, 'words from', originalname, '| First 200 chars:', extractedText.substring(0, 200).replace(/\n/g, ' '));

    return res.json({
      text: extractedText,
      charCount: extractedText.length,
      wordCount: extractedText.split(/\s+/).filter(Boolean).length,
      fileName: originalname
    });
  } catch (err) {
    console.error('[parse/resume] Error:', err.message);
    return res.status(500).json({
      error: 'Failed to parse file. Please try copy-pasting your resume text instead.',
      detail: err.message
    });
  }
});

// ==========================================
// JOB PROFILES AND TEMPLATES
// ==========================================
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

// Guest Cache
let guestAnalysis = {
  githubUsername: '',
  linkedinUsername: '',
  githubData: null,
  resumeData: null,
  linkedinData: null,
  scores: { portfolio: null, ats: null, github: null, careerReady: null }
};

// ==========================================
// PROFILE ANALYSIS APIS
// ==========================================

// 1. Analyze GitHub
app.post('/api/analyze/github', async (req, res) => {
  const { username, targetRole, token } = req.body;
  let cleanUsername = (username || '').trim();
  if (cleanUsername) {
    cleanUsername = cleanUsername.replace(/^(https?:\/\/)?(www\.)?github\.com\//i, '');
    cleanUsername = cleanUsername.replace(/^git@github\.com:/i, '');
    cleanUsername = cleanUsername.split('/')[0].split('?')[0].split('#')[0];
  }
  let userId = null;
  if (token) {
    try { const decoded = jwt.verify(token, JWT_SECRET); userId = decoded.id; } catch (e) { }
  }

  try {
    const headers = { 'User-Agent': 'DevScope-AI-App' };
    const userResponse = await fetch(`https://api.github.com/users/${cleanUsername}`, { headers });
    let userData = null;
    let repos = [];

    if (userResponse.ok) {
      userData = await userResponse.json();
      if (userData.message === 'Not Found') throw new Error('GitHub user not found');
      const reposResponse = await fetch(`https://api.github.com/users/${cleanUsername}/repos?per_page=100&sort=updated`, { headers });
      if (reposResponse.ok) repos = await reposResponse.json();
    } else {
      const errorText = await userResponse.text();
      console.error(`[github] API Error ${userResponse.status}:`, errorText);
      if (userResponse.status === 403 && errorText.includes('rate limit')) {
         throw new Error('GitHub API rate limit exceeded. Please try again later.');
      }
      throw new Error(`GitHub API unreachable (Status: ${userResponse.status})`);
    }

    // === SEPARATE FORKED VS ORIGINAL REPOS ===
    const originalRepos = repos.filter(r => !r.fork);
    const forkedRepos = repos.filter(r => r.fork);
    const totalRepos = repos.length;
    const originalCount = originalRepos.length;

    // Documentation: only count original repos (forked repos come with descriptions)
    const reposWithDescription = originalRepos.filter(r => r.description && r.description.trim().length > 10).length;
    const docScore = originalCount > 0 ? Math.round((reposWithDescription / originalCount) * 100) : 0;
    const flaggedRepos = originalRepos.filter(r => !r.description || r.description.trim().length <= 10).slice(0, 5).map(r => r.name);

    // Stars/forks only from original repos
    const totalStars = originalRepos.reduce((acc, r) => acc + r.stargazers_count, 0);
    const totalForks = originalRepos.reduce((acc, r) => acc + r.forks_count, 0);

    // Language analysis from original repos only
    const languages = {};
    originalRepos.forEach(repo => {
      if (repo.language) languages[repo.language] = (languages[repo.language] || 0) + 1;
    });
    const languageTotal = Object.values(languages).reduce((a, b) => a + b, 0);
    const languageBreakdown = Object.entries(languages)
      .map(([name, count]) => ({ name, percentage: Math.round((count / (languageTotal || 1)) * 100) }))
      .sort((a, b) => b.percentage - a.percentage);

    // === RECALIBRATED SCORING (100 total) ===

    // 1. Documentation Quality (0–20 pts)
    //    README presence and description quality on ORIGINAL repos
    const docPoints = Math.round((docScore / 100) * 20);

    // 2. Original Work Volume (0–25 pts)
    //    Only original repos count. Logarithmic scale — diminishing returns past 10.
    //    0 repos = 0, 1 = 4, 3 = 10, 5 = 14, 10 = 20, 20+ = 25
    let originalWorkPoints = 0;
    if (originalCount === 0) originalWorkPoints = 0;
    else if (originalCount <= 2) originalWorkPoints = originalCount * 3;
    else if (originalCount <= 5) originalWorkPoints = 6 + (originalCount - 2) * 2.5;
    else if (originalCount <= 10) originalWorkPoints = 13.5 + (originalCount - 5) * 1.3;
    else if (originalCount <= 20) originalWorkPoints = 20 + (originalCount - 10) * 0.5;
    else originalWorkPoints = 25;
    originalWorkPoints = Math.round(Math.min(originalWorkPoints, 25));

    // Fork penalty: if more than half your repos are forks, deduct
    const forkRatio = totalRepos > 0 ? forkedRepos.length / totalRepos : 0;
    if (forkRatio > 0.7) originalWorkPoints = Math.max(0, originalWorkPoints - 5);
    else if (forkRatio > 0.5) originalWorkPoints = Math.max(0, originalWorkPoints - 3);

    // 3. Activity Recency (0–15 pts)
    //    How recently were original repos updated?
    const now = new Date();
    const recentRepos = originalRepos.filter(r => {
      const updated = new Date(r.updated_at || r.pushed_at);
      const daysSinceUpdate = (now - updated) / (1000 * 60 * 60 * 24);
      return daysSinceUpdate <= 90; // updated in last 3 months
    }).length;
    const activeInLastYear = originalRepos.filter(r => {
      const updated = new Date(r.updated_at || r.pushed_at);
      return (now - updated) / (1000 * 60 * 60 * 24) <= 365;
    }).length;
    let recencyPoints = 0;
    if (recentRepos >= 3) recencyPoints = 15;
    else if (recentRepos >= 1) recencyPoints = 8 + recentRepos * 2;
    else if (activeInLastYear >= 3) recencyPoints = 6;
    else if (activeInLastYear >= 1) recencyPoints = 3;
    else recencyPoints = 0;
    recencyPoints = Math.min(recencyPoints, 15);

    // 4. Community Engagement (0–20 pts)
    //    Stars, forks received, followers — with realistic thresholds
    //    Followers: 0=0, 5=3, 10=5, 50=8, 100+=10
    let followerPoints = 0;
    if (userData.followers >= 100) followerPoints = 10;
    else if (userData.followers >= 50) followerPoints = 8;
    else if (userData.followers >= 20) followerPoints = 6;
    else if (userData.followers >= 10) followerPoints = 4;
    else if (userData.followers >= 5) followerPoints = 2;
    else if (userData.followers >= 1) followerPoints = 1;

    //    Stars: 0=0, 5=2, 10=4, 50=6, 100+=8
    let starPoints = 0;
    if (totalStars >= 100) starPoints = 8;
    else if (totalStars >= 50) starPoints = 6;
    else if (totalStars >= 20) starPoints = 4;
    else if (totalStars >= 10) starPoints = 3;
    else if (totalStars >= 5) starPoints = 2;
    else if (totalStars >= 1) starPoints = 1;

    //    Forks received: 0=0, 5=1, 10+=2
    let forkReceivedPoints = totalForks >= 10 ? 2 : (totalForks >= 5 ? 1 : 0);

    const communityPoints = Math.min(followerPoints + starPoints + forkReceivedPoints, 20);

    // 5. Language Diversity (0–10 pts)
    //    Meaningful spread: 1 lang=1, 2=3, 3=5, 4=7, 5+=10
    const langCount = Object.keys(languages).length;
    let diversityPoints = 0;
    if (langCount >= 5) diversityPoints = 10;
    else if (langCount >= 4) diversityPoints = 7;
    else if (langCount >= 3) diversityPoints = 5;
    else if (langCount >= 2) diversityPoints = 3;
    else if (langCount >= 1) diversityPoints = 1;

    // 6. Role Relevance (0–10 pts)
    const roleLanguages = {
      'frontend': ['JavaScript', 'TypeScript', 'HTML', 'CSS', 'Vue', 'Svelte'],
      'backend': ['Java', 'Python', 'Go', 'Ruby', 'C#', 'PHP', 'Rust', 'C++', 'Kotlin'],
      'fullstack': ['JavaScript', 'TypeScript', 'Java', 'Python', 'Go', 'C#', 'Ruby'],
      'ml-engineer': ['Python', 'Jupyter Notebook', 'R', 'C++', 'Julia']
    };

    let roleRelevancePoints = 0;
    if (targetRole && roleLanguages[targetRole]) {
      const relevantLangs = roleLanguages[targetRole];
      let totalRelevantCount = 0;
      Object.entries(languages).forEach(([lang, count]) => {
        if (relevantLangs.includes(lang)) totalRelevantCount += count;
      });
      const matchPercent = languageTotal > 0 ? (totalRelevantCount / languageTotal) : 0;
      // 0% match = 0 pts, 50% = 5, 80%+ = 10
      roleRelevancePoints = Math.round(matchPercent * 10);
    } else {
      roleRelevancePoints = 3; // neutral if no role specified
    }

    let finalGithubScore = docPoints + originalWorkPoints + recencyPoints + communityPoints + diversityPoints + roleRelevancePoints;
    finalGithubScore = Math.max(5, Math.min(finalGithubScore, 97)); // clamp 5–97

    const result = {
      username: userData.login,
      name: userData.name || userData.login,
      avatarUrl: userData.avatar_url,
      bio: userData.bio || null,
      publicRepos: userData.public_repos,
      followers: userData.followers,
      following: userData.following,
      totalStars,
      totalForks,
      originalRepoCount: originalCount,
      forkedRepoCount: forkedRepos.length,
      languages: languageBreakdown.length > 0 ? languageBreakdown : [],
      score: finalGithubScore,
      docScore,
      flaggedRepos,
      recentlyActiveRepos: recentRepos,
      scoreBreakdown: {
        docPoints,
        originalWorkPoints,
        recencyPoints,
        communityPoints,
        diversityPoints,
        roleRelevancePoints
      },
      topRepos: originalRepos
        .sort((a, b) => (b.stargazers_count + b.forks_count) - (a.stargazers_count + a.forks_count))
        .slice(0, 5)
        .map(r => ({
          name: r.name,
          description: r.description || '',
          stars: r.stargazers_count,
          forks: r.forks_count,
          language: r.language || 'Unknown',
          url: r.html_url,
          hasDescription: !!(r.description && r.description.trim().length > 10)
        })),
      isMockData: false
    };

    await saveOrUpdateAnalysis(userId, { githubUsername: cleanUsername, githubData: result, targetRole });
    return res.json(result);
  } catch (error) {
    console.error('[github] Error:', error.message);
    
    let userMsg = `Could not fetch GitHub data for "${cleanUsername}". Please check the username and try again.`;
    if (error.message.includes('not found')) {
      userMsg = `The GitHub user "${cleanUsername}" does not exist.`;
    } else if (error.message.includes('rate limit')) {
      userMsg = 'GitHub API rate limit exceeded (60 requests/hour for unauthenticated users). Please try again in an hour.';
    }

    return res.status(502).json({ error: userMsg });
  }
});

// Helper to save analysis
async function saveOrUpdateAnalysis(userId, data) {
  let activeGithubScore = null, activeAtsScore = null, activeLinkedInScore = null;

  if (userId) {
    if (isDbConnected) {
      const userCheck = await pool.query('SELECT id FROM users WHERE id = $1 LIMIT 1', [userId]);
      if (userCheck.rows.length === 0) {
        userId = null;
      }
    } else {
      const db = readLocalDb();
      const userExists = db.users.some(u => u.id === userId);
      if (!userExists) {
        userId = null;
      }
    }
  }

  if (userId) {
    let existing = null;
    if (isDbConnected) {
      const existingResult = await pool.query(
        `SELECT user_id AS "userId", github_username AS "githubUsername", scores, github_data AS "githubData", resume_data AS "resumeData", linkedin_data AS "linkedinData", linkedin_url AS "linkedinUsername", target_role AS "targetRole", created_at AS "createdAt", updated_at AS "updatedAt" FROM analyses WHERE user_id = $1 LIMIT 1`,
        [userId]
      );
      existing = mapAnalysisRow(existingResult.rows[0]);
    } else {
      const db = readLocalDb();
      existing = db.analyses.find(a => a.userId === userId);
    }

    if (existing) {
      activeGithubScore = (data.githubData?.score !== undefined) ? data.githubData.score : (existing.githubData?.score ?? existing.scores?.github ?? null);
      activeAtsScore = (data.resumeData?.atsScore !== undefined) ? data.resumeData.atsScore : (existing.resumeData?.atsScore ?? existing.scores?.ats ?? null);
      activeLinkedInScore = (data.linkedinData?.score !== undefined) ? data.linkedinData.score : (existing.linkedinData?.score ?? existing.scores?.careerReady ?? null);
    } else {
      activeGithubScore = data.githubData?.score ?? null;
      activeAtsScore = data.resumeData?.atsScore ?? null;
      activeLinkedInScore = data.linkedinData?.score ?? null;
    }
  } else {
    activeGithubScore = data.githubData?.score ?? guestAnalysis.scores.github;
    activeAtsScore = data.resumeData?.atsScore ?? guestAnalysis.scores.ats;
    activeLinkedInScore = data.linkedinData?.score ?? guestAnalysis.scores.careerReady;
  }

  const activeScores = [activeGithubScore, activeAtsScore, activeLinkedInScore].filter(s => s !== null && s !== undefined);
  const portfolioScore = activeScores.length > 0 ? Math.round(activeScores.reduce((a, b) => a + b, 0) / activeScores.length) : null;

  const scoresObj = { github: activeGithubScore, ats: activeAtsScore, careerReady: activeLinkedInScore, portfolio: portfolioScore };

  if (!userId) {
    guestAnalysis = { ...guestAnalysis, ...data, scores: scoresObj };
    return;
  }

  if (isDbConnected) {
    await pool.query(
      `INSERT INTO analyses (user_id, github_username, scores, github_data, resume_data, linkedin_data, linkedin_url, target_role)
       VALUES ($1, $2, $3::jsonb, $4::jsonb, $5::jsonb, $6::jsonb, $7, $8)
       ON CONFLICT (user_id) DO UPDATE SET
         github_username = COALESCE(EXCLUDED.github_username, analyses.github_username),
         scores = EXCLUDED.scores,
         github_data = COALESCE(EXCLUDED.github_data, analyses.github_data),
         resume_data = COALESCE(EXCLUDED.resume_data, analyses.resume_data),
         linkedin_data = COALESCE(EXCLUDED.linkedin_data, analyses.linkedin_data),
         linkedin_url = COALESCE(EXCLUDED.linkedin_url, analyses.linkedin_url),
         target_role = COALESCE(EXCLUDED.target_role, analyses.target_role),
         updated_at = NOW()`,
      [userId, data.githubUsername || null, JSON.stringify(scoresObj),
        data.githubData ? JSON.stringify(data.githubData) : null,
        data.resumeData ? JSON.stringify(data.resumeData) : null,
        data.linkedinData ? JSON.stringify(data.linkedinData) : null,
        data.linkedinUsername || null, data.targetRole || null]
    );
  } else {
    const db = readLocalDb();
    const index = db.analyses.findIndex(a => a.userId === userId);
    const existingObj = index >= 0 ? db.analyses[index] : {};
    const updated = { ...existingObj, ...data, scores: scoresObj, userId, updatedAt: new Date().toISOString() };
    if (!updated.createdAt) updated.createdAt = new Date().toISOString();
    if (index >= 0) db.analyses[index] = updated;
    else db.analyses.push(updated);
    writeLocalDb(db);
  }
}

// 2. Analyze Resume — STRICT ACCURATE ATS SCORING
app.post('/api/analyze/resume', async (req, res) => {
  const { resumeText, targetRole, token } = req.body;
  let userId = null;
  if (token) {
    try { const decoded = jwt.verify(token, JWT_SECRET); userId = decoded.id; } catch (e) { }
  }

  if (!resumeText || !resumeText.trim()) {
    return res.status(400).json({ error: 'Resume text is required.' });
  }

  const text = resumeText.trim();
  const lowerText = text.toLowerCase();
  const wordCount = text.split(/\s+/).filter(Boolean).length;
  const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);

  if (!looksLikeResume(text)) {
    return res.status(400).json({ error: RESUME_REJECTION_MESSAGE });
  }

  // --- Expanded Keyword List (60+ keywords across tech domains) ---
  const KEYWORDS = {
    // Frontend
    'React': ['react', 'react.js', 'reactjs'],
    'Vue': ['vue', 'vue.js', 'vuejs'],
    'Angular': ['angular', 'angularjs'],
    'Next.js': ['next.js', 'nextjs', 'next js'],
    'TypeScript': ['typescript'],
    'JavaScript': ['javascript', 'js', 'es6', 'es2015'],
    'HTML/CSS': ['html', 'css', 'scss', 'sass', 'html5', 'css3'],
    'Tailwind': ['tailwind', 'tailwindcss'],
    'Redux': ['redux', 'zustand', 'mobx', 'recoil'],
    'Webpack': ['webpack', 'vite', 'rollup', 'parcel'],
    // Backend
    'Node.js': ['node.js', 'nodejs', 'node js'],
    'Express': ['express', 'express.js', 'expressjs'],
    'Django': ['django'],
    'FastAPI': ['fastapi', 'fast api'],
    'Flask': ['flask'],
    'Spring Boot': ['spring boot', 'spring'],
    // Databases
    'PostgreSQL': ['postgresql', 'postgres'],
    'MySQL': ['mysql'],
    'MongoDB': ['mongodb', 'mongo'],
    'Redis': ['redis'],
    'GraphQL': ['graphql', 'graph ql'],
    'REST API': ['rest api', 'restful api'],
    'SQL': ['sql', 'relational database'],
    // Cloud & DevOps
    'AWS': ['aws', 'amazon web services', 'ec2', 's3', 'lambda', 'cloudfront'],
    'GCP': ['gcp', 'google cloud', 'google cloud platform'],
    'Azure': ['azure', 'microsoft azure'],
    'Docker': ['docker', 'dockerfile', 'containerization'],
    'Kubernetes': ['kubernetes', 'k8s'],
    'CI/CD': ['ci/cd', 'ci cd', 'continuous integration', 'continuous deployment', 'pipeline', 'github actions'],
    'Linux': ['linux', 'unix', 'bash', 'shell scripting'],
    'Nginx': ['nginx', 'apache'],
    // Languages
    'Python': ['python'],
    'Java': ['\\bjava\\b'],
    'Go': ['golang', 'go language'],
    'Rust': ['rust'],
    'C++': ['c++', 'cpp', 'c plus plus'],
    'C#': ['c#', 'csharp', '.net'],
    'PHP': ['php'],
    'Ruby': ['ruby', 'ruby on rails', 'rails'],
    // Testing
    'Jest': ['jest', 'jasmine', 'mocha', 'chai'],
    'Cypress': ['cypress', 'selenium', 'playwright', 'puppeteer'],
    'TDD': ['tdd', 'test-driven', 'unit test'],
    // Tools
    'Git': ['git', 'github', 'gitlab', 'bitbucket', 'version control'],
    'Agile/Scrum': ['agile', 'scrum', 'kanban', 'sprint', 'jira'],
    'Figma': ['figma', 'sketch', 'adobe xd'],
    // ML/AI
    'PyTorch': ['pytorch', 'torch'],
    'TensorFlow': ['tensorflow', 'keras'],
    'Scikit-Learn': ['scikit-learn', 'scikit learn', 'sklearn'],
    'Pandas': ['pandas', 'numpy', 'matplotlib', 'seaborn'],
    'Machine Learning': ['machine learning', 'deep learning', 'neural network', 'nlp', 'computer vision'],
    'Data Engineering': ['spark', 'hadoop', 'kafka', 'airflow', 'dbt', 'data pipeline'],
  };

  // Java needs special regex matching to avoid matching "JavaScript"
  const foundKeywords = [];
  const missingKeywords = [];

  Object.entries(KEYWORDS).forEach(([displayName, variants]) => {
    let found = false;
    for (const v of variants) {
      if (v.startsWith('\\b')) {
        // Regex-based match (e.g., Java)
        if (new RegExp(v, 'i').test(lowerText)) { found = true; break; }
      } else {
        if (lowerText.includes(v)) { found = true; break; }
      }
    }
    if (found) foundKeywords.push(displayName);
    else missingKeywords.push(displayName);
  });

  // --- STRICT Section Detection ---
  // Sections must look like headings: at start of line, possibly uppercase, short line
  const detectSection = (patterns) => {
    for (const line of lines) {
      const trimmed = line.toLowerCase().replace(/[:\-–—|•*#]/g, '').trim();
      // Line must be short (heading-like) — under 60 chars OR all caps
      const isHeadingLike = trimmed.length < 60 || line === line.toUpperCase();
      if (isHeadingLike) {
        for (const pattern of patterns) {
          if (new RegExp(`\\b${pattern}\\b`, 'i').test(trimmed)) return true;
        }
      }
    }
    return false;
  };

  const sectionsChecklist = {
    experience: detectSection(['experience', 'work history', 'employment', 'professional experience', 'work experience', 'career history']),
    projects: detectSection(['projects?', 'personal projects?', 'portfolio', 'academic projects?', 'side projects?']),
    skills: detectSection(['skills?', 'technical skills', 'technologies', 'core competencies', 'technical proficiency', 'tech stack']),
    education: detectSection(['education', 'academic', 'qualifications', 'academic background'])
  };

  // --- Experience Content Depth ---
  // Check if experience section has actual content (bullet points, descriptions)
  const hasBulletPoints = /^[\s]*[•\-\*▸▹►➤→]|^\s*\d+[\.\)]/m.test(text);
  const bulletCount = (text.match(/^[\s]*[•\-\*▸▹►➤→]|^\s*\d+[\.\)]/gm) || []).length;

  // --- Action Verbs (stricter: must start a line/bullet or follow a bullet marker) ---
  const ACTION_VERBS = [
    'engineered', 'developed', 'led', 'managed', 'spearheaded', 'optimized', 'designed',
    'implemented', 'built', 'created', 'solved', 'improved', 'increased', 'reduced', 'saved',
    'architected', 'automated', 'deployed', 'migrated', 'refactored', 'collaborated', 'delivered',
    'launched', 'maintained', 'monitored', 'integrated', 'analyzed', 'configured', 'established',
    'streamlined', 'mentored', 'reviewed', 'published', 'contributed', 'researched', 'scaled'
  ];

  // Count action verbs that actually START a bullet or line (not just appear anywhere)
  let strongActionVerbCount = 0;
  let weakActionVerbCount = 0;
  ACTION_VERBS.forEach(verb => {
    // Strong: verb at line/bullet start
    const strongMatch = text.match(new RegExp(`(?:^|[•\\-\\*▸▹►]|\\d+[\\.)]) *${verb}`, 'gmi'));
    if (strongMatch) strongActionVerbCount += strongMatch.length;
    // Weak: verb appears anywhere
    const weakMatch = lowerText.match(new RegExp(`\\b${verb}(d|ed|s|ing)?\\b`, 'g'));
    if (weakMatch) weakActionVerbCount += weakMatch.length;
  });
  const actionVerbCount = Math.max(strongActionVerbCount, Math.floor(weakActionVerbCount * 0.5));

  // --- Contact Info Detection ---
  const hasEmail = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/.test(text);
  const hasPhone = /(\+?\d[\s.-]?)?(\(?\d{3}\)?[\s.-]?)?\d{3}[\s.-]?\d{4}/.test(text);
  const hasLinkedIn = /linkedin\.com\/in\//i.test(text);
  const hasGitHub = /github\.com\//i.test(text);

  // --- Quantification Detection (GRADUATED) ---
  // Count actual quantified achievements, not just "any number exists"
  const quantPatterns = [
    /\d+\s*%/g,                                    // "40%", "increased by 30%"
    /\d+x\b/gi,                                   // "3x faster"
    /\$[\d,]+|\₹[\d,]+/g,                         // "$50,000", "₹2L"
    /\b\d+[kKmM]\+?\s*(users?|customers?|requests?|downloads?|views?)/gi, // "10K users"
    /\b\d{2,}\s*(users?|customers?|clients?|requests?|transactions?|records?)/gi, // "500 users"
    /reduced\s+.*?\b\d/gi,                         // "reduced latency by..."
    /improved\s+.*?\b\d/gi,                        // "improved throughput by..."
    /increased\s+.*?\b\d/gi,                       // "increased revenue by..."
    /saved\s+.*?\b\d/gi,                           // "saved 200 hours"
  ];
  let quantificationCount = 0;
  quantPatterns.forEach(pattern => {
    const matches = text.match(pattern);
    if (matches) quantificationCount += matches.length;
  });

  // === STRICT SCORING (100 total) ===

  // Role relevance setup
  const ROLE_RELEVANCE = {
    'frontend': ['React', 'Vue', 'Angular', 'Next.js', 'TypeScript', 'JavaScript', 'HTML/CSS', 'Tailwind', 'Redux', 'Webpack', 'Jest', 'Cypress', 'Figma'],
    'backend': ['Node.js', 'Express', 'Django', 'FastAPI', 'Flask', 'Spring Boot', 'PostgreSQL', 'MySQL', 'MongoDB', 'Redis', 'GraphQL', 'REST API', 'SQL', 'Docker', 'Kubernetes', 'Linux', 'Python', 'Java', 'Go', 'Rust', 'C++', 'C#', 'PHP', 'Ruby', 'TDD'],
    'fullstack': ['React', 'Vue', 'Next.js', 'TypeScript', 'JavaScript', 'Node.js', 'Express', 'PostgreSQL', 'MongoDB', 'REST API', 'GraphQL', 'Docker', 'CI/CD', 'AWS', 'GCP'],
    'ml-engineer': ['Python', 'PyTorch', 'TensorFlow', 'Scikit-Learn', 'Pandas', 'Machine Learning', 'Data Engineering', 'AWS', 'GCP', 'SQL', 'Docker', 'Kubernetes']
  };

  const selectedRoleKey = targetRole || 'frontend';
  const roleKeywords = ROLE_RELEVANCE[selectedRoleKey] || ROLE_RELEVANCE['frontend'];
  const roleKeywordsFound = foundKeywords.filter(kw => roleKeywords.includes(kw));

  // 1. ROLE-SPECIFIC KEYWORDS (0–30 pts)
  //    Primary driver: how many role-relevant keywords are present
  //    0 of N = 0, 1 = 4, 2 = 8, 3 = 12, 4 = 16, 5 = 19, 6 = 22, 7 = 25, 8+ = 28-30
  const roleKwRatio = roleKeywordsFound.length / Math.max(roleKeywords.length, 1);
  let keywordScore = 0;
  if (roleKwRatio >= 0.6) keywordScore = 25 + Math.round(roleKwRatio * 5);
  else if (roleKwRatio >= 0.4) keywordScore = 16 + Math.round((roleKwRatio - 0.4) * 45);
  else if (roleKwRatio >= 0.2) keywordScore = 8 + Math.round((roleKwRatio - 0.2) * 40);
  else keywordScore = Math.round(roleKwRatio * 40);
  keywordScore = Math.min(keywordScore, 30);

  // Small bonus for breadth beyond role (max +3)
  const nonRoleKeywords = foundKeywords.filter(kw => !roleKeywords.includes(kw));
  const breadthBonus = Math.min(Math.floor(nonRoleKeywords.length / 4), 3);

  const roleRelevanceScore = Math.round(roleKwRatio * 100);

  // 2. SECTION STRUCTURE (0–20 pts)
  //    Each section is worth points, but NOT equally
  //    experience = 7, skills = 5, projects = 4, education = 4
  let sectionScore = 0;
  if (sectionsChecklist.experience) sectionScore += 7;
  if (sectionsChecklist.skills) sectionScore += 5;
  if (sectionsChecklist.projects) sectionScore += 4;
  if (sectionsChecklist.education) sectionScore += 4;
  // Section score max = 20

  // 3. ACTION VERBS + IMPACT (0–15 pts)
  //    Need verbs in context, not just the word existing
  //    0 verbs = 0, 1-2 = 3, 3-4 = 6, 5-6 = 9, 7-8 = 12, 9+ = 15
  let verbScore = 0;
  if (actionVerbCount >= 9) verbScore = 15;
  else if (actionVerbCount >= 7) verbScore = 12;
  else if (actionVerbCount >= 5) verbScore = 9;
  else if (actionVerbCount >= 3) verbScore = 6;
  else if (actionVerbCount >= 1) verbScore = 3;

  // 4. QUANTIFIED ACHIEVEMENTS (0–15 pts)
  //    Graduated: 0=0, 1=4, 2=7, 3=10, 4=12, 5+=15
  let quantScore = 0;
  if (quantificationCount >= 5) quantScore = 15;
  else if (quantificationCount >= 4) quantScore = 12;
  else if (quantificationCount >= 3) quantScore = 10;
  else if (quantificationCount >= 2) quantScore = 7;
  else if (quantificationCount >= 1) quantScore = 4;

  // 5. LENGTH + COMPLETENESS (0–10 pts)
  //    Too short = penalized, sweet spot = 400-700 words
  let lengthScore = 0;
  if (wordCount >= 400 && wordCount <= 900) lengthScore = 10;
  else if (wordCount >= 300) lengthScore = 7;
  else if (wordCount >= 200) lengthScore = 4;
  else if (wordCount >= 100) lengthScore = 2;
  else lengthScore = 0;
  // Penalty for excessively long resumes (> 1200 words)
  if (wordCount > 1200) lengthScore = Math.max(0, lengthScore - 3);

  // 6. CONTACT INFO (0–5 pts)
  const contactScore = (hasEmail ? 2 : 0) + (hasPhone ? 1 : 0) + (hasLinkedIn ? 1 : 0) + (hasGitHub ? 1 : 0);

  // 7. FORMATTING QUALITY (0–5 pts)
  //    Bullet points, structure, consistency
  let formatScore = 0;
  if (hasBulletPoints && bulletCount >= 5) formatScore += 3;
  else if (hasBulletPoints) formatScore += 1;
  // Has multiple lines (not a wall of text)
  if (lines.length >= 15) formatScore += 1;
  // Has some structure (short lines mixed with longer ones — indicates headings + content)
  const shortLines = lines.filter(l => l.length > 0 && l.length < 40).length;
  const longLines = lines.filter(l => l.length >= 40).length;
  if (shortLines >= 3 && longLines >= 3) formatScore += 1;
  formatScore = Math.min(formatScore, 5);

  // === CALCULATE TOTAL ===
  let atsScore = keywordScore + breadthBonus + sectionScore + verbScore + quantScore + lengthScore + contactScore + formatScore;
  atsScore = Math.max(5, Math.min(atsScore, 97)); // clamp 5–97

  // --- Fake Resume / Non-Resume Additional Check ---
  const sectionCount = Object.values(sectionsChecklist).filter(Boolean).length;
  if (sectionCount === 0 && foundKeywords.length < 3 && actionVerbCount < 2) {
    return res.status(400).json({ 
      error: RESUME_REJECTION_MESSAGE
    });
  }

  // --- Actionable Suggestions ---
  const suggestions = [];

  if (wordCount < 200) {
    suggestions.push(`📝 Resume Length (${wordCount} words): Your resume is very short. Aim for 400–700 words for a strong ATS profile. Add details about your responsibilities and achievements.`);
  } else if (wordCount < 350) {
    suggestions.push(`📝 Resume Length (${wordCount} words): Your resume could be longer. Aim for 400–700 words. Flesh out your experience descriptions with specific accomplishments.`);
  }
  if (!sectionsChecklist.experience) {
    suggestions.push('🏢 Missing "Experience" Section: Add a clear "Work Experience" or "Professional Experience" heading on its own line. ATS systems look for this explicitly.');
  }
  if (!sectionsChecklist.projects) {
    suggestions.push('💻 Missing "Projects" Section: A dedicated Projects section showcases practical skills. Include 2–4 projects with tech stack and measurable impact.');
  }
  if (!sectionsChecklist.skills) {
    suggestions.push('🛠️ Missing "Skills" Section: Add a clear "Technical Skills" or "Skills" heading with a list of languages, frameworks, and tools. ATS systems scan this heavily.');
  }
  if (!sectionsChecklist.education) {
    suggestions.push('🎓 Missing "Education" Section: Include your degree, institution, and graduation year under a clear "Education" heading.');
  }
  if (actionVerbCount < 5) {
    suggestions.push(`⚡ Action Verbs (${actionVerbCount} effective uses): Start bullet points with strong action verbs — e.g., "Engineered", "Deployed", "Reduced", "Optimized". Aim for 8+ across your resume.`);
  }
  if (quantificationCount === 0) {
    suggestions.push('📊 No Quantified Achievements: Recruiters want numbers. Add metrics like "Reduced load time by 40%", "Served 10,000+ users", "Saved ₹2L in costs". Aim for 3-5 quantified results.');
  } else if (quantificationCount < 3) {
    suggestions.push(`📊 Low Quantification (${quantificationCount} found): Add more measurable impact statements. Each project or job should have at least one metric.`);
  }
  if (!hasEmail) {
    suggestions.push('📧 No Email Detected: Make sure your email address is clearly visible at the top of your resume.');
  }
  if (roleKeywordsFound.length < Math.ceil(roleKeywords.length * 0.3)) {
    const missingRoleKws = roleKeywords.filter(kw => !foundKeywords.includes(kw)).slice(0, 5);
    suggestions.push(`🔍 Low Role Keyword Match (${roleKeywordsFound.length} of ${roleKeywords.length}): For ${selectedRoleKey} roles, add: ${missingRoleKws.join(', ')}. These are what ATS filters scan for.`);
  }
  if (!hasBulletPoints) {
    suggestions.push('📋 No Bullet Points Detected: Structure your experience and projects with bullet points (•, -, *). ATS systems and recruiters both prefer bulleted content over paragraphs.');
  }
  if (missingKeywords.includes('Git')) {
    suggestions.push('🔗 Git Missing: Almost every tech role expects Git proficiency. Add "Git, GitHub" to your skills section if you use it.');
  }

  if (suggestions.length === 0) {
    suggestions.push('✅ Excellent! Your resume has strong keyword coverage, clear sections, quantified impact, and good action verb density.');
  }

  const result = {
    atsScore,
    roleRelevanceScore,
    foundKeywords: foundKeywords.slice(0, 20),
    missingKeywords: missingKeywords.slice(0, 15),
    roleKeywordsMissing: roleKeywords.filter(kw => !foundKeywords.includes(kw)).slice(0, 10),
    suggestions,
    sectionsChecklist,
    actionVerbCount,
    wordCount,
    contactInfo: { hasEmail, hasPhone, hasLinkedIn, hasGitHub },
    hasQuantification: quantificationCount > 0,
    quantificationCount,
    hasBulletPoints,
    bulletCount,
    scoreBreakdown: { keywordScore: keywordScore + breadthBonus, sectionScore, verbScore, quantScore, lengthScore, contactScore, formatScore }
  };

  console.log('[resume] Score:', result.atsScore, '| Words:', wordCount, '| Sections:', JSON.stringify(sectionsChecklist), '| Keywords:', foundKeywords.length, '| Verbs:', actionVerbCount, '| Quant:', quantificationCount, '| Breakdown:', JSON.stringify(result.scoreBreakdown));

  await saveOrUpdateAnalysis(userId, { resumeData: result, targetRole });
  res.json(result);
});

// 3. Analyze LinkedIn — STRICT SCORING, URL-ONLY IS LOW
app.post('/api/analyze/linkedin', async (req, res) => {
  const { username, targetRole, token, selfReport } = req.body;
  let userId = null;
  if (token) {
    try { const decoded = jwt.verify(token, JWT_SECRET); userId = decoded.id; } catch (e) { }
  }

  const cleanUsername = parseLinkedInProfileInput(username);
  if (!cleanUsername) {
    return res.status(400).json({ error: LINKEDIN_REJECTION_MESSAGE });
  }

  const slug = cleanUsername;
  const cleanUrl = `https://linkedin.com/in/${slug}`;

  // URL Quality Analysis
  const defaultUrlRegex = /-\w*\d{3,}$|^\w{10,}[\d]{4,}$/;
  const isDefaultUrl = defaultUrlRegex.test(slug);
  const hasCustomSlug = !isDefaultUrl && slug.length >= 3 && slug.length <= 50;
  const slugQuality = (() => {
    if (!slug || slug.length < 3) return 'invalid';
    if (hasCustomSlug && !/\d{3,}/.test(slug)) return 'excellent';
    if (hasCustomSlug) return 'good';
    return 'default';
  })();

  // Headline Templates
  const headlineTemplates = {
    frontend: 'Frontend Engineer | React | TypeScript | Next.js | Building Scalable Web UIs',
    backend: 'Backend Engineer | Node.js | Python | PostgreSQL | REST API Design',
    fullstack: 'Full-Stack Developer | React | Node.js | AWS | Docker | Scaling SaaS Applications',
    'ml-engineer': 'Machine Learning Engineer | Python | PyTorch | TensorFlow | MLOps'
  };
  const suggestedHeadline = headlineTemplates[targetRole] || headlineTemplates['frontend'];

  // Self-reported data is optional. A URL-only scan should produce a LOW score.
  const sr = selfReport && typeof selfReport === 'object' ? selfReport : {};
  const hasSelfReport = Object.keys(sr).length > 0;
  const hasProfilePhoto = sr.hasProfilePhoto === true;
  const has500Connections = sr.has500Connections === true;
  const hasHeadlineKeywords = sr.hasHeadlineKeywords === true;
  const hasSummary = sr.hasSummary === true;
  const hasSkillsSection = sr.hasSkillsSection === true;
  const hasRecommendations = sr.hasRecommendations === true;
  const suppliedHeadline = typeof sr.headline === 'string' ? sr.headline.trim() : '';

  // Checklist
  const checklist = {
    customUrl: hasCustomSlug,
    profilePhoto: hasProfilePhoto,
    headlineKeywords: hasHeadlineKeywords,
    connectionsStrength: has500Connections,
    aboutSection: hasSummary,
    skillsEndorsed: hasSkillsSection,
    recommendations: hasRecommendations,
    urlVerifiable: true,
    photoVerifiable: false,
    connectionsVerifiable: false,
    headlineVerifiable: false,
  };

  // === RECALIBRATED SCORING (100 total) ===
  // Base: 25 pts (you have a LinkedIn account)
  // URL quality: 0-20 pts
  // Self-report items: 0-50 pts total
  // Role clue: 0-10 pts

  let score = 25; // base: a LinkedIn handle was supplied

  // 1. URL Quality (0-20 pts)
  const slugTokens = slug
    .toLowerCase()
    .split(/[^a-z0-9+#.]+/)
    .filter(Boolean);
  const slugText = slugTokens.join(' ');
  const digitCount = (slug.match(/\d/g) || []).length;
  const hasLongRandomToken = slugTokens.some(token => token.length >= 14 && !/[aeiou]/i.test(token));
  const hasReadableNameShape = slugTokens.length >= 2 || /^[a-z]+-[a-z]+$/i.test(slug);

  let urlScore = 0;
  if (slugQuality === 'excellent') urlScore += 12;
  else if (slugQuality === 'good') urlScore += 8;
  else urlScore += 4;

  if (hasReadableNameShape) urlScore += 4;
  if (slug.length >= 8 && slug.length <= 28) urlScore += 4;
  if (digitCount > 0) urlScore -= Math.min(6, digitCount * 2);
  if (hasLongRandomToken) urlScore -= 4;
  urlScore = Math.max(0, Math.min(urlScore, 20));
  score += urlScore;

  // 2. Role Matching (0-10 pts)
  const roleKeywords = {
    'frontend': ['frontend', 'react', 'ui', 'web', 'javascript', 'front-end'],
    'backend': ['backend', 'api', 'server', 'node', 'java', 'python', 'back-end'],
    'fullstack': ['fullstack', 'full-stack', 'software engineer', 'developer', 'software developer'],
    'ml-engineer': ['ml', 'machine learning', 'ai', 'data', 'python', 'scientist']
  };

  let roleClueScore = 0;
  if (targetRole) {
    const targetKeywords = roleKeywords[targetRole] || roleKeywords['frontend'];
    const roleSource = `${suppliedHeadline} ${slugText}`.toLowerCase();
    const headlineMatchesRole = targetKeywords.some(kw => roleSource.includes(kw));

    if (headlineMatchesRole) {
      roleClueScore = suppliedHeadline ? 10 : 5; // headline match is worth more than slug match
    } else if (suppliedHeadline) {
      roleClueScore = -3; // Penalty for headline that doesn't match target role
    } else {
      // If URL-only, we dynamically adjust the score slightly based on the target role
      // so the user sees the score update when changing roles.
      const roleWeights = { 'frontend': 3, 'backend': 4, 'fullstack': 5, 'ml-engineer': 6 };
      roleClueScore = roleWeights[targetRole] || 3;
    }
    score += roleClueScore;
  }

  // 3. Self-Reported Profile Quality (0-50 pts)
  if (hasSelfReport) {
    if (hasProfilePhoto) score += 8;       
    if (has500Connections) score += 10;     
    if (hasHeadlineKeywords) score += 10;   
    if (hasSummary) score += 8;            
    if (hasSkillsSection) score += 8;      
    if (hasRecommendations) score += 6;     
    // Sub-total: 8+10+10+8+8+6 = 50 pts
  }

  score = Math.max(10, Math.min(score, 97));

  // Actionable tips — ordered by impact
  const tips = [];
  if (!hasSelfReport) {
    tips.push('⚠️ URL-only analysis: Your score is limited because LinkedIn profiles are not publicly accessible. Fill the profile checklist below or upload a LinkedIn PDF export for an accurate score.');
  }
  if (!hasCustomSlug) tips.push('🔗 Customize your LinkedIn URL: Go to LinkedIn → Edit Profile → Edit public profile & URL. A clean URL like linkedin.com/in/firstname-lastname is more professional and easier to share.');
  if (!has500Connections) tips.push('🤝 Build connections to 500+: Connect with classmates, colleagues, and people in your industry. 500+ shows activity and makes your profile appear in more recruiter searches.');
  if (!hasHeadlineKeywords) tips.push(`💡 Optimize your headline: Your headline is the most-searched field. Instead of just your job title, use: "${suggestedHeadline}"`);
  if (!hasProfilePhoto) tips.push('📸 Add a professional profile photo: Profiles with photos get 21x more profile views. Use a clear headshot with a plain background.');
  if (!hasSummary) tips.push('📝 Write an About/Summary section: Use 3–5 sentences describing who you are, what you do, and what you\'re looking for. Include your top 3 skills.');
  if (!hasSkillsSection) tips.push('🛠️ Add Skills and get Endorsements: Add 10+ relevant skills. Ask colleagues to endorse you. Skills appear in recruiter keyword searches.');
  if (!hasRecommendations) tips.push('⭐ Request Recommendations: 3+ recommendations from colleagues or managers dramatically boost credibility. Send a personalized request.');

  if (tips.length === 0) {
    tips.push('✅ Excellent LinkedIn profile setup! Focus on posting content regularly and engaging with your network to maintain visibility.');
  }

  const result = {
    score,
    checklist,
    slugQuality,
    isDefaultUrl,
    hasCustomSlug,
    suggestedHeadline,
    profileHandle: slug,
    profileUrl: cleanUrl,
    tips,
    scoreBreakdown: {
      baseScore: 10,
      urlScore,
      roleClueScore,
      photoScore: hasProfilePhoto ? 8 : 0,
      connectionsScore: has500Connections ? 12 : 0,
      headlineScore: hasHeadlineKeywords ? 12 : 0,
      summaryScore: hasSummary ? 10 : 0,
      skillsScore: hasSkillsSection ? 10 : 0,
      recommendationsScore: hasRecommendations ? 8 : 0,
    },
    analysisNote: hasSelfReport
      ? 'LinkedIn does not provide a public API. URL structure is verified automatically. Other profile quality items are self-reported and not independently verified.'
      : 'LinkedIn does not provide a public API. This is a URL-only estimate and is intentionally low. Fill the profile checklist or upload a LinkedIn PDF export for a real score.',
    selfReport: sr
  };

  await saveOrUpdateAnalysis(userId, { linkedinUsername: slug, linkedinData: result });
  res.json(result);
});

// 3.5 Analyze LinkedIn PDF — STRICT CONTENT-BASED SCORING
app.post('/api/analyze/linkedin-pdf', async (req, res) => {
  const { linkedinText, targetRole, token } = req.body;
  let userId = null;
  if (token) {
    try { const decoded = jwt.verify(token, JWT_SECRET); userId = decoded.id; } catch (e) { }
  }

  if (!linkedinText) return res.status(400).json({ error: 'No text provided.' });

  const txt = linkedinText.toLowerCase();
  const lines = linkedinText.split('\n').map(l => l.trim()).filter(l => l.length > 0);
  const wordCount = linkedinText.split(/\s+/).filter(Boolean).length;

  // === Section Detection (strict heading check) ===
  const detectSectionHeader = (keywords) => {
    for (const line of lines) {
      const clean = line.toLowerCase().replace(/[:\-–—|•*#]/g, '').trim();
      if (clean.length < 50) {
        for (const kw of keywords) {
          if (new RegExp(`\\b${kw}\\b`, 'i').test(clean)) return true;
        }
      }
    }
    return false;
  };

  const hasExperience = detectSectionHeader(['experience', 'work history', 'employment']);
  const hasEducation = detectSectionHeader(['education', 'academic']);
  const hasSkills = detectSectionHeader(['skills', 'competencies', 'technologies']);
  const hasCertifications = detectSectionHeader(['certifications', 'licenses', 'credentials']);
  const hasProjects = detectSectionHeader(['projects', 'portfolio']);
  const hasSummary = detectSectionHeader(['summary', 'about', 'objective', 'profile']);
  const hasVolunteering = detectSectionHeader(['volunteer', 'volunteering']);

  // === Content Depth Analysis ===
  // Count experience entries (company names, role titles with dates)
  const datePatterns = txt.match(/\b(20\d{2}|19\d{2})\b/g) || [];
  const experienceEntries = Math.min(Math.floor(datePatterns.length / 2), 10); // each role has ~2 dates

  // Bullet points / descriptions
  const bulletCount = (linkedinText.match(/^[\s]*[•\-\*▸▹►➤→]/gm) || []).length;
  const hasBullets = bulletCount > 0;

  // Action verbs in context
  const ACTION_VERBS = ['developed', 'built', 'led', 'managed', 'designed', 'implemented', 'created',
    'optimized', 'deployed', 'engineered', 'architected', 'automated', 'improved', 'reduced',
    'launched', 'collaborated', 'delivered', 'analyzed', 'integrated', 'mentored', 'scaled'];
  let actionVerbCount = 0;
  ACTION_VERBS.forEach(verb => {
    const matches = txt.match(new RegExp(`\\b${verb}\\w*\\b`, 'g'));
    if (matches) actionVerbCount += matches.length;
  });

  // Quantified achievements
  const quantMatches = (linkedinText.match(/\d+\s*%|\d+x\b|\$[\d,]+|₹[\d,]+|\b\d+[kKmM]\+?\s*(users?|customers?)/gi) || []).length;

  // === Role Keyword Matching ===
  const roleKeywords = {
    'frontend': ['frontend', 'react', 'vue', 'angular', 'ui', 'css', 'html', 'javascript', 'typescript', 'next.js', 'tailwind', 'responsive'],
    'backend': ['backend', 'api', 'server', 'node', 'java', 'python', 'go', 'sql', 'database', 'postgresql', 'mongodb', 'redis', 'express'],
    'fullstack': ['fullstack', 'full-stack', 'software engineer', 'developer', 'react', 'node', 'typescript', 'database', 'api'],
    'ml-engineer': ['ml', 'machine learning', 'ai', 'data', 'python', 'pytorch', 'tensorflow', 'model', 'deep learning', 'nlp', 'pandas']
  };
  const targetKws = roleKeywords[targetRole] || roleKeywords['frontend'];
  let foundKws = [];
  let missingKws = [];
  targetKws.forEach(kw => {
    if (txt.includes(kw)) foundKws.push(kw);
    else missingKws.push(kw);
  });

  const kwRatio = foundKws.length / targetKws.length;

  // === SCORING (100 total, all start from 0) ===

  // 1. Keyword Match (0-30 pts) — role-relevant keywords present
  let kwScore = Math.round(kwRatio * 30);

  // 2. Experience Depth (0-25 pts) — not just "has experience" but how rich it is
  let expDepth = 0;
  if (hasExperience) {
    expDepth += 5; // has section
    expDepth += Math.min(experienceEntries * 3, 9); // entries (max 3 roles = 9)
    if (hasBullets && bulletCount >= 3) expDepth += 4;
    else if (hasBullets) expDepth += 2;
    if (actionVerbCount >= 5) expDepth += 4;
    else if (actionVerbCount >= 2) expDepth += 2;
    if (quantMatches >= 2) expDepth += 3;
    else if (quantMatches >= 1) expDepth += 1;
  }
  expDepth = Math.min(expDepth, 25);

  // 3. Profile Completeness (0-25 pts) — how many sections are filled
  let completeness = 0;
  if (hasExperience) completeness += 6;
  if (hasEducation) completeness += 4;
  if (hasSkills) completeness += 5;
  if (hasCertifications) completeness += 3;
  if (hasProjects) completeness += 4;
  if (hasSummary) completeness += 3;
  completeness = Math.min(completeness, 25);

  // 4. Content Quality (0-20 pts) — length, depth, specificity
  let contentQuality = 0;
  if (wordCount >= 500) contentQuality += 6;
  else if (wordCount >= 300) contentQuality += 4;
  else if (wordCount >= 150) contentQuality += 2;

  if (actionVerbCount >= 8) contentQuality += 5;
  else if (actionVerbCount >= 4) contentQuality += 3;
  else if (actionVerbCount >= 1) contentQuality += 1;

  if (quantMatches >= 3) contentQuality += 5;
  else if (quantMatches >= 1) contentQuality += 2;

  if (lines.length >= 30) contentQuality += 4;
  else if (lines.length >= 15) contentQuality += 2;
  contentQuality = Math.min(contentQuality, 20);

  const overall = Math.max(5, Math.min(kwScore + expDepth + completeness + contentQuality, 97));

  // Quick Wins — actionable, specific
  const quickWins = [];
  if (!hasExperience) quickWins.push('🏢 Add a detailed Experience section with company names, roles, dates, and bullet points describing your responsibilities.');
  if (!hasSkills) quickWins.push('🛠️ Add a dedicated Skills section listing your technical and professional skills.');
  if (!hasProjects) quickWins.push('💻 Link or describe 1-2 major projects to show practical hands-on experience.');
  if (!hasSummary) quickWins.push('📝 Add a Summary/About section at the top describing your professional identity and goals.');
  if (actionVerbCount < 4) quickWins.push('⚡ Use more action verbs (Developed, Built, Led, Optimized) to describe your achievements.');
  if (quantMatches === 0) quickWins.push('📊 Add quantified achievements: "Improved performance by 40%", "Managed team of 5", etc.');
  if (missingKws.length > 0) quickWins.push(`🔍 Add missing role keywords: ${missingKws.slice(0, 4).join(', ')}`);
  if (quickWins.length === 0) quickWins.push('✅ Great profile! Keep engaging and posting content.');

  const result = {
    score: overall,
    metrics: {
      skillMatch: Math.round(kwRatio * 100),
      expDepth: Math.round((expDepth / 25) * 100),
      completeness: Math.round((completeness / 25) * 100),
      kwScore: Math.round(kwRatio * 100),
      overall
    },
    sections: {
      hasExperience,
      hasEducation,
      hasSkills,
      hasCertifications,
      hasProjects,
      hasSummary
    },
    contentStats: {
      wordCount,
      lineCount: lines.length,
      experienceEntries,
      bulletCount,
      actionVerbCount,
      quantifiedAchievements: quantMatches
    },
    foundKws,
    missingKws,
    quickWins,
    isPdfParsed: true
  };

  await saveOrUpdateAnalysis(userId, { linkedinData: result, targetRole });
  res.json(result);
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

// 5. Get dynamic roadmaps
app.get('/api/roadmap', async (req, res) => {
  const roleKey = req.query.role || 'frontend';
  const profile = JOB_PROFILES[roleKey] || JOB_PROFILES['frontend'];
  const token = req.query.token;

  let userId = null;
  if (token) {
    try { const decoded = jwt.verify(token, JWT_SECRET); userId = decoded.id; } catch (e) { }
  }

  let activeGithub = guestAnalysis.githubData;
  let activeResume = guestAnalysis.resumeData;
  let activeLinkedin = guestAnalysis.linkedinData;

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
  if (activeGithub) activeGithub.languages.forEach(l => userSkills.add(l.name));
  if (activeResume) activeResume.foundKeywords.forEach(kw => userSkills.add(kw));
  if (activeLinkedin?.foundKws) activeLinkedin.foundKws.forEach(kw => userSkills.add(kw));
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

app.get('/api/health', (req, res) => {
  res.json({ status: 'healthy', database: isDbConnected ? 'PostgreSQL' : 'JSON File Fallback', allowedOrigins });
});

export default app;

