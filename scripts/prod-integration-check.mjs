import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const baseUrl = process.env.INTEGRATION_BASE_URL || 'http://localhost:3020';
const now = Date.now();
const testEmail = `devscope.integration.${now}@example.com`;
const testPassword = `D3vscope-${now}!`;

const results = [];
let admin;
let anon;
let session;
let testUserId;

function record(name, status, details = '') {
  results.push({ name, status, details });
  const marker = status === 'pass' ? 'PASS' : status === 'warn' ? 'WARN' : 'FAIL';
  console.log(`[${marker}] ${name}${details ? ` - ${details}` : ''}`);
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function requiredEnv(name) {
  assert(process.env[name], `${name} is missing`);
}

async function jsonFetch(url, options = {}) {
  const response = await fetch(url, options);
  const text = await response.text();
  let body = null;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = { raw: text };
  }
  return { response, body };
}

async function testSupabaseAuthAndRls() {
  requiredEnv('NEXT_PUBLIC_SUPABASE_URL');
  requiredEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY');
  requiredEnv('SUPABASE_SERVICE_ROLE_KEY');

  admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false }
  });
  anon = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false }
  });

  const created = await admin.auth.admin.createUser({
    email: testEmail,
    password: testPassword,
    email_confirm: true,
    user_metadata: { username: `integration_${now}` }
  });
  if (created.error) throw created.error;
  testUserId = created.data.user.id;
  record('Supabase admin user creation', 'pass', testUserId);

  const signedIn = await anon.auth.signInWithPassword({ email: testEmail, password: testPassword });
  if (signedIn.error) throw signedIn.error;
  session = signedIn.data.session;
  assert(session?.access_token, 'No access token returned');
  record('Supabase email login', 'pass');

  const refreshed = await anon.auth.refreshSession({ refresh_token: session.refresh_token });
  if (refreshed.error) throw refreshed.error;
  session = refreshed.data.session;
  record('Supabase session refresh', 'pass');

  await admin.from('users').upsert({
    id: testUserId,
    email: testEmail,
    username: `integration_${now}`
  }, { onConflict: 'id' });

  const analysisRow = {
    user_id: testUserId,
    target_role: 'frontend',
    resume_hash: `resume-${now}`,
    github_hash: null,
    linkedin_hash: null,
    job_hash: null,
    provider: 'INTEGRATION',
    execution_time_ms: 1,
    status: 'completed',
    resume_data: { score: 1 },
    github_data: null,
    linkedin_data: null,
    intelligence_data: { candidateReport: { executiveSummary: 'integration row' } },
    scores: { overall: 1 },
    candidate_data: { metadata: { integration: true } },
    gemini_analysis: { integration: true },
    updated_at: new Date().toISOString()
  };

  const upserted = await admin.from('analyses').upsert(analysisRow, { onConflict: 'user_id' });
  if (upserted.error) throw upserted.error;
  record('Supabase analyses write and metadata update', 'pass');

  const authed = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: `Bearer ${session.access_token}` } },
    auth: { persistSession: false, autoRefreshToken: false }
  });
  const ownRead = await authed.from('analyses').select('user_id, provider, execution_time_ms, intelligence_data').eq('user_id', testUserId).single();
  if (ownRead.error) throw ownRead.error;
  assert(ownRead.data.provider === 'INTEGRATION', 'Authed RLS read did not return own row');
  record('Supabase RLS own-row read', 'pass');

  const unauthRead = await createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false }
  }).from('analyses').select('user_id').eq('user_id', testUserId);
  assert(!unauthRead.data?.length, 'Unauthenticated client could read protected analyses row');
  record('Supabase RLS unauthenticated isolation', 'pass');

  const reset = await anon.auth.resetPasswordForEmail(testEmail, { redirectTo: `${baseUrl}/dashboard` });
  if (reset.error) {
    record('Supabase forgot-password request', 'warn', reset.error.message);
  } else {
    record('Supabase forgot-password request', 'pass');
  }

  const signedOut = await anon.auth.signOut();
  if (signedOut.error) throw signedOut.error;
  record('Supabase logout', 'pass');
}

async function testProviderDirectCalls() {
  requiredEnv('GEMINI_API_KEY');
  const geminiPayload = {
    contents: [{ role: 'user', parts: [{ text: 'Return exactly this JSON object: {"ok":true}' }] }],
    generationConfig: { temperature: 0, maxOutputTokens: 64 }
  };
  const gemini = await jsonFetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${process.env.GEMINI_API_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(geminiPayload)
  });
  assert(gemini.response.ok, `Gemini failed with ${gemini.response.status}`);
  assert(gemini.body?.candidates?.[0]?.content?.parts?.[0]?.text, 'Gemini returned no text');
  record('Gemini successful generation', 'pass');

  const geminiBad = await jsonFetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=invalid-key', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(geminiPayload)
  });
  assert(!geminiBad.response.ok, 'Gemini invalid-key request unexpectedly succeeded');
  record('Gemini error handling path', 'pass', `HTTP ${geminiBad.response.status}`);

  const groqKey = process.env.GROQ_API_KEY || process.env.XAI_API_KEY;
  if (!groqKey) {
    record('Groq direct generation', 'warn', 'GROQ_API_KEY is not configured');
    return;
  }
  const groq = await jsonFetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${groqKey}` },
    body: JSON.stringify({
      model: process.env.GROQ_MODEL || 'llama-3.3-70b-versatile',
      messages: [{ role: 'user', content: 'Return exactly this JSON object: {"ok":true}' }],
      response_format: { type: 'json_object' },
      temperature: 0
    })
  });
  if (!groq.response.ok) {
    record('Groq direct generation', 'fail', `HTTP ${groq.response.status}`);
    return;
  }
  assert(groq.body?.choices?.[0]?.message?.content, 'Groq returned no content');
  record('Groq direct generation and JSON parsing', 'pass');
}

async function testExternalCollectors() {
  const githubUser = await jsonFetch('https://api.github.com/users/octocat', {
    headers: { 'User-Agent': 'DevScope-AI-Integration-Test' }
  });
  assert(githubUser.response.ok, `GitHub user fetch failed with ${githubUser.response.status}`);
  assert(githubUser.body?.login === 'octocat', 'GitHub user payload mismatch');
  record('GitHub user profile fetch', 'pass', `remaining=${githubUser.response.headers.get('x-ratelimit-remaining') ?? 'unknown'}`);

  const githubRepos = await jsonFetch('https://api.github.com/users/octocat/repos?per_page=5', {
    headers: { 'User-Agent': 'DevScope-AI-Integration-Test' }
  });
  assert(githubRepos.response.ok && Array.isArray(githubRepos.body), `GitHub repo fetch failed with ${githubRepos.response.status}`);
  record('GitHub repositories fetch and rate-limit headers', 'pass', `repos=${githubRepos.body.length}`);

  if (!process.env.RAPIDAPI_KEY || !process.env.RAPIDAPI_HOST) {
    record('RapidAPI LinkedIn live URL path', 'warn', 'RapidAPI env vars are missing');
    return;
  }

  let endpoint = process.env.RAPIDAPI_URL || `https://${process.env.RAPIDAPI_HOST}/get-profile-data-by-url`;
  const linkedInUrl = 'https://www.linkedin.com/in/satyanadella';
  endpoint += endpoint.includes('?')
    ? `&url=${encodeURIComponent(linkedInUrl)}`
    : `?url=${encodeURIComponent(linkedInUrl)}&username=satyanadella`;

  const rapid = await jsonFetch(endpoint, {
    headers: {
      'X-RapidAPI-Key': process.env.RAPIDAPI_KEY,
      'X-RapidAPI-Host': process.env.RAPIDAPI_HOST
    }
  });
  if (!rapid.response.ok || rapid.body?.success === false) {
    record('RapidAPI LinkedIn live URL path', 'fail', `HTTP ${rapid.response.status}: ${rapid.body?.message || 'unsuccessful response'}`);
  } else {
    record('RapidAPI LinkedIn live URL path', 'pass');
  }
}

const scenarioResume = `Alex Morgan
Frontend Engineer
alex@example.com
Experience
Built React and TypeScript dashboards, implemented Next.js pages, optimized API performance by 24%.
Projects
Created a full-stack analytics portal with Node.js, PostgreSQL, Docker, GitHub Actions, and automated tests.
Skills
React, TypeScript, JavaScript, Next.js, Node.js, SQL, PostgreSQL, Docker, Testing, CI/CD.
Education
Bachelor of Computer Science.`;

async function runAnalyzeScenario(name, payload) {
  const started = Date.now();
  const res = await jsonFetch(`${baseUrl}/api/analyze`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session.access_token}`
    },
    body: JSON.stringify({ targetRole: 'frontend', forceRefresh: true, ...payload })
  });
  assert(res.response.ok, `${name} failed HTTP ${res.response.status}: ${JSON.stringify(res.body)}`);
  const recordData = res.body?.data || res.body?.analysis || res.body;
  assert(recordData?.user_id === testUserId, 'Analysis response user mismatch');
  assert(recordData?.candidate_data, 'Missing unified candidate object');
  assert(recordData?.gemini_analysis, 'Missing unified AI response');
  assert(recordData?.intelligence_data?.candidateReport, 'Missing cached candidate report');
  assert(recordData?.scores?.overall !== undefined, 'Missing unified scores');
  record(name, 'pass', `${recordData.provider || 'provider?'} ${Date.now() - started}ms`);
}

async function testUnifiedApiFlow() {
  const unauthorized = await jsonFetch(`${baseUrl}/api/history`);
  assert(unauthorized.response.status === 401, `Expected 401, got ${unauthorized.response.status}`);
  record('Protected route rejects unauthorized requests', 'pass');

  const scenarios = [
    ['Analyze: resume only', { resumeText: scenarioResume }],
    ['Analyze: resume + job description', { resumeText: scenarioResume, jobDescription: 'Frontend Engineer role requiring React, TypeScript, Next.js, testing, accessibility, and CI/CD.' }],
    ['Analyze: resume + GitHub', { resumeText: scenarioResume, githubUsername: 'octocat' }],
    ['Analyze: resume + LinkedIn PDF text', { resumeText: scenarioResume, linkedinText: 'Alex Morgan Frontend Engineer React TypeScript Next.js Experience Education Skills Recommendations' }],
    ['Analyze: resume + GitHub + LinkedIn', { resumeText: scenarioResume, githubUsername: 'octocat', linkedinText: 'Alex Morgan Frontend Engineer React TypeScript Next.js Docker PostgreSQL' }],
    ['Analyze: resume + GitHub + LinkedIn + job description', { resumeText: scenarioResume, githubUsername: 'octocat', linkedinText: 'Alex Morgan Frontend Engineer React TypeScript Next.js Docker PostgreSQL', jobDescription: 'We need a Frontend Engineer with React, TypeScript, Next.js, PostgreSQL, Docker, CI/CD, testing, and product ownership.' }]
  ];

  for (const [name, payload] of scenarios) {
    await runAnalyzeScenario(name, payload);
  }

  const cached = await jsonFetch(`${baseUrl}/api/intelligence/report`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session.access_token}`
    },
    body: JSON.stringify({ targetRole: 'frontend' })
  });
  assert(cached.response.ok, `Cached intelligence report failed with ${cached.response.status}`);
  assert((cached.body?.data || cached.body?.analysis)?.candidateReport, 'Cached report missing candidateReport');
  record('Report tabs cached hydration endpoint', 'pass');

  const invalid = await jsonFetch(`${baseUrl}/api/analyze`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session.access_token}`
    },
    body: JSON.stringify({ linkedinUsername: 'not a valid url !!', targetRole: 'frontend' })
  });
  assert(invalid.response.status === 400, `Invalid LinkedIn expected 400, got ${invalid.response.status}`);
  record('Invalid LinkedIn URL handling', 'pass');

  const empty = await jsonFetch(`${baseUrl}/api/analyze`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session.access_token}`
    },
    body: JSON.stringify({ targetRole: 'frontend' })
  });
  assert(empty.response.status === 400, `Empty input expected 400, got ${empty.response.status}`);
  record('Empty input handling', 'pass');
}

async function cleanup() {
  if (admin && testUserId) {
    await admin.from('analyses').delete().eq('user_id', testUserId);
    await admin.from('users').delete().eq('id', testUserId);
    await admin.auth.admin.deleteUser(testUserId);
  }
}

async function main() {
  try {
    let supabaseReady = false;
    try {
      await testSupabaseAuthAndRls();
      supabaseReady = true;
    } catch (error) {
      record('Supabase/Auth/DB validation', 'fail', error.message);
    }

    try {
      await testProviderDirectCalls();
    } catch (error) {
      record('AI provider validation', 'fail', error.message);
    }

    try {
      await testExternalCollectors();
    } catch (error) {
      record('External collector validation', 'fail', error.message);
    }

    if (supabaseReady) {
      try {
        await testUnifiedApiFlow();
      } catch (error) {
        record('Unified API flow validation', 'fail', error.message);
      }
    } else {
      record('Unified API flow validation', 'warn', 'Skipped because Supabase analyses schema is unavailable.');
    }
  } finally {
    await cleanup();
  }

  const failed = results.filter(result => result.status === 'fail');
  const warned = results.filter(result => result.status === 'warn');
  console.log(JSON.stringify({ passed: results.length - failed.length - warned.length, warned: warned.length, failed: failed.length }, null, 2));
  if (failed.length) process.exit(1);
}

main().catch(async (error) => {
  record('Integration test runner', 'fail', error.message);
  await cleanup();
  process.exit(1);
});
