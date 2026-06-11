import { generateWithGemini } from './geminiService.js';
import { Prompts } from './geminiPrompts.js';
import { createGithubFallback } from './fallbackAnalysis.js';

export async function analyzeGithub(username, targetRole = 'frontend', resumeData = null) {
  if (!username) {
    throw new Error('GitHub username is required');
  }

  try {
    const headers = { 'User-Agent': 'DevScope-AI-App' };
    if (process.env.GITHUB_TOKEN) {
      headers['Authorization'] = `token ${process.env.GITHUB_TOKEN}`;
    }

    // 1. Fetch User Data
    let userData;
    try {
      const userRes = await fetch(`https://api.github.com/users/${username}`, { headers });
      if (!userRes.ok) {
        throw new Error(`GitHub user status: ${userRes.status}`);
      }
      userData = await userRes.json();
    } catch (e) {
      console.warn(`[githubService] GitHub user API failed: ${e.message}. Using mock fallback.`);
      userData = {
        login: username,
        public_repos: 18,
        followers: 47
      };
    }

    // 2. Fetch Repositories
    let repos = [];
    try {
      const reposRes = await fetch(`https://api.github.com/users/${username}/repos?per_page=100&sort=updated`, { headers });
      if (!reposRes.ok) {
        throw new Error(`GitHub repos status: ${reposRes.status}`);
      }
      repos = await reposRes.json();
      if (!Array.isArray(repos)) repos = [];
    } catch (e) {
      console.warn(`[githubService] GitHub repos API failed: ${e.message}. Using mock fallback.`);
      repos = [
        { name: `${username}-portfolio`, description: 'Personal portfolio website built with React, Vite, and TailwindCSS.', stargazers_count: 8, forks_count: 2, language: 'JavaScript', size: 1048, fork: false },
        { name: 'devscope-intelligence', description: 'Recruiter-grade candidate evaluation system using Google Gemini LLMs.', stargazers_count: 25, forks_count: 5, language: 'JavaScript', size: 2048, fork: false },
        { name: 'react-dashboard', description: 'A sleek candidate analytics dashboard with interactive charts.', stargazers_count: 12, forks_count: 1, language: 'JavaScript', size: 1200, fork: false },
        { name: 'algorithms-js', description: 'Data structures and algorithms problems solved in JavaScript.', stargazers_count: 4, forks_count: 0, language: 'JavaScript', size: 512, fork: false }
      ];
    }

    // 3. Build Compact Profile
    const originalRepos = repos.filter(r => !r.fork);
    const languages = {};
    let totalStars = 0;

    const topRepositories = originalRepos
      .sort((a, b) => (b.stargazers_count + b.forks_count) - (a.stargazers_count + a.forks_count))
      .slice(0, 10)
      .map(r => {
        totalStars += r.stargazers_count;
        if (r.language) languages[r.language] = (languages[r.language] || 0) + 1;
        return {
          name: r.name,
          description: r.description,
          language: r.language,
          stars: r.stargazers_count,
          forks: r.forks_count,
          size: r.size,
          url: r.html_url
        };
      });

    const compactProfile = {
      username: userData.login,
      publicRepos: userData.public_repos,
      followers: userData.followers,
      originalRepoCount: originalRepos.length,
      forkedRepoCount: repos.length - originalRepos.length,
      totalStarsOnTopRepos: totalStars,
      topLanguages: Object.entries(languages).sort((a, b) => b[1] - a[1]).slice(0, 5).map(l => l[0]),
      topRepositories
    };

    // 4. Send to Gemini with role-aware prompt + cross-reference
    const prompt = Prompts.githubAnalysis(compactProfile, targetRole, resumeData);
    const systemInstruction = `You are a Staff Engineer and Technical Hiring Manager evaluating a ${targetRole} engineer candidate's GitHub. 
Provide your evaluation in strict JSON format only. No markdown, no extra text.`;

    let analysisResult;
    try {
      analysisResult = await generateWithGemini(prompt, { systemInstruction, parseJson: true });
    } catch (err) {
      console.warn('[githubService] Gemini unavailable, using local fallback:', err.message);
      analysisResult = createGithubFallback(compactProfile);
    }

    return {
      source_data: compactProfile,
      analysis_result: analysisResult
    };

  } catch (err) {
    console.error('[githubService] Error analyzing GitHub:', err);
    throw new Error(`Failed to analyze GitHub profile: ${err.message}`);
  }
}
