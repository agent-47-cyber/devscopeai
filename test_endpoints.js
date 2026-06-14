// Quick script to test all API endpoints locally
const BASE = 'http://127.0.0.1:5000';

async function test() {
  console.log('=== 1. HEALTH CHECK ===');
  const health = await fetch(`${BASE}/api/health`).then(r => r.json());
  console.log(JSON.stringify(health, null, 2));

  console.log('\n=== 2. GEMINI DEBUG ===');
  const gemini = await fetch(`${BASE}/api/debug/gemini`).then(r => r.json());
  console.log(JSON.stringify(gemini, null, 2));

  console.log('\n=== 3. AI STATUS ===');
  const aiStatus = await fetch(`${BASE}/api/ai-status`).then(r => r.json());
  console.log(JSON.stringify(aiStatus, null, 2));

  console.log('\n=== 4. LOGIN ===');
  const loginRes = await fetch(`${BASE}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'test@test.com', password: 'test1234' })
  });
  const loginData = await loginRes.json();
  console.log(JSON.stringify(loginData, null, 2));

  if (!loginData.token) {
    console.log('Login failed, trying to register...');
    const regRes = await fetch(`${BASE}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'test@test.com', password: 'test1234', username: 'testuser99' })
    });
    const regData = await regRes.json();
    console.log('Register:', JSON.stringify(regData, null, 2));
    if (regData.token) loginData.token = regData.token;
  }

  if (!loginData.token) {
    console.error('No token available, cannot test authed endpoints');
    return;
  }

  const token = loginData.token;
  const authHeaders = { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` };

  console.log('\n=== 5. GITHUB ANALYSIS (darkmoon564) ===');
  const ghRes = await fetch(`${BASE}/api/analyze/github`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({ username: 'darkmoon564', targetRole: 'frontend' })
  });
  const ghData = await ghRes.json();
  console.log('Status:', ghRes.status);
  console.log('AI Source:', ghData.data?._aiSource || ghData.data?._meta?.source || 'UNKNOWN');
  console.log('Score:', ghData.data?.score);
  console.log('Success:', ghData.success);
  if (ghData.error) console.log('Error:', ghData.error);

  console.log('\n=== 6. RESUME ANALYSIS (text) ===');
  const resumeRes = await fetch(`${BASE}/api/analyze/resume`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      resumeText: 'John Smith. Software Engineer with 3 years of experience in React, Node.js, TypeScript, and AWS. Built a full-stack e-commerce platform serving 10k users. Led migration of legacy jQuery to React reducing bundle size by 40%. Experience with CI/CD pipelines, Docker, and agile methodologies. Education: B.S. Computer Science, State University 2021. Skills: JavaScript, TypeScript, React, Node.js, Express, PostgreSQL, MongoDB, AWS, Docker, Git, Jest, Cypress.',
      targetRole: 'frontend'
    })
  });
  const resumeData = await resumeRes.json();
  console.log('Status:', resumeRes.status);
  console.log('AI Source:', resumeData.data?._aiSource || resumeData.data?._meta?.source || 'UNKNOWN');
  console.log('ATS Score:', resumeData.data?.atsScore);
  console.log('Success:', resumeData.success);
  if (resumeData.error) console.log('Error:', resumeData.error);

  console.log('\n=== DONE ===');
}

test().catch(e => console.error('Test failed:', e));
