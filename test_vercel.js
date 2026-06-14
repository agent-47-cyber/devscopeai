const BASE = 'https://devscopeai-nine.vercel.app';

async function test() {
  console.log('=== LOGIN ===');
  const loginRes = await fetch(`${BASE}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'test@test.com', password: 'test1234' })
  });
  let loginData = await loginRes.json();
  
  if (!loginData.token) {
    console.log('Login failed, trying to register...');
    const regRes = await fetch(`${BASE}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'test@test.com', password: 'test1234', username: 'testuser99' })
    });
    loginData = await regRes.json();
  }

  const token = loginData.token;
  if (!token) {
    console.error('Failed to get token');
    return;
  }

  console.log('=== GITHUB ANALYSIS (darkmoon564) ===');
  const ghRes = await fetch(`${BASE}/api/analyze/github`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
    body: JSON.stringify({ username: 'darkmoon564', targetRole: 'frontend' })
  });
  const ghData = await ghRes.json();
  console.log('Status:', ghRes.status);
  console.log('AI Source:', ghData.data?._aiSource || ghData.data?._meta?.source || 'UNKNOWN');
  console.log('Success:', ghData.success);
}
test().catch(console.error);
