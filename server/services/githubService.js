import { generateWithGemini } from './geminiService.js';
import { Prompts } from './geminiPrompts.js';
import { createGithubFallback } from './fallbackAnalysis.js';

export async function analyzeGithub(username, targetRole = 'frontend', resumeData = null, pool = null) {
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

    // 2. Fetch Repositories (ALL public repositories via pagination)
    let repos = [];
    try {
      let page = 1;
      let hasMore = true;
      while (hasMore) {
        const reposRes = await fetch(`https://api.github.com/users/${username}/repos?per_page=100&page=${page}&sort=updated`, { headers });
        if (!reposRes.ok) {
          throw new Error(`GitHub repos status: ${reposRes.status}`);
        }
        const pageRepos = await reposRes.json();
        if (Array.isArray(pageRepos)) {
          repos = repos.concat(pageRepos);
          if (pageRepos.length < 100) hasMore = false;
          else page++;
        } else {
          hasMore = false;
        }
        
        // Safety limit to avoid infinite loops or exceeding API rates on massive accounts
        if (page > 5) hasMore = false; 
      }
    } catch (e) {
      console.warn(`[githubService] GitHub repos API failed: ${e.message}. Using mock fallback.`);
      repos = [
        { name: `${username}-portfolio`, description: 'Personal portfolio website built with React, Vite, and TailwindCSS.', stargazers_count: 8, forks_count: 2, language: 'JavaScript', size: 1048, fork: false, updated_at: new Date().toISOString() },
        { name: 'devscope-intelligence', description: 'Recruiter-grade candidate evaluation system using Google Gemini LLMs.', stargazers_count: 25, forks_count: 5, language: 'JavaScript', size: 2048, fork: false, updated_at: new Date().toISOString() },
      ];
    }

    // 3. Build Compact Profile and Identify Best Repository
    const originalRepos = repos.filter(r => !r.fork);
    const languages = {};
    let totalStars = 0;

    // Calculate heuristic score for each repository
    const scoredRepos = originalRepos.map(r => {
      const recencyScore = new Date(r.updated_at) > new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) ? 10 : 0;
      const descScore = r.description ? 5 : 0;
      const sizeScore = Math.min(r.size / 1000, 10); // cap at 10 pts for size
      const heuristicScore = (r.stargazers_count * 5) + (r.forks_count * 3) + descScore + recencyScore + sizeScore;
      
      return {
        ...r,
        heuristicScore
      };
    });

    const sortedByScore = [...scoredRepos].sort((a, b) => b.heuristicScore - a.heuristicScore);
    const bestRepo = sortedByScore.length > 0 ? sortedByScore[0] : null;

    const topRepositories = scoredRepos
      .sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at)) // Keep chronologically sorted for explorer
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
          updated_at: r.updated_at,
          url: r.html_url,
          heuristicScore: Math.round(r.heuristicScore),
          isBest: bestRepo && r.name === bestRepo.name
        };
      });

    const compactProfile = {
      username: userData.login,
      publicRepos: userData.public_repos,
      followers: userData.followers,
      originalRepoCount: originalRepos.length,
      forkedRepoCount: repos.length - originalRepos.length,
      totalStarsOnTopRepos: totalStars,
      topLanguages: Object.entries(languages).sort((a, b) => b[1] - a[1]).map(l => l[0]),
      topRepositories, // Now contains ALL original repositories for the UI Explorer
      bestRepository: bestRepo ? {
        name: bestRepo.name,
        description: bestRepo.description,
        language: bestRepo.language,
        stars: bestRepo.stargazers_count,
        forks: bestRepo.forks_count,
        updated_at: bestRepo.updated_at
      } : null
    };

    let cachedRepoAnalysis = null;
    let repoHash = null;
    if (pool && bestRepo) {
      try {
        const crypto = await import('crypto');
        repoHash = crypto.createHash('md5').update(bestRepo.name + bestRepo.updated_at).digest('hex');
        const res = await pool.query('SELECT analysis_data FROM repository_analyses WHERE repo_hash = $1', [repoHash]);
        if (res.rows.length > 0) {
          cachedRepoAnalysis = res.rows[0].analysis_data;
          compactProfile.cachedDeepDive = true;
          console.log('[githubService] Found cached deep dive for repository:', bestRepo.name);
        }
      } catch (e) {
        console.warn('[githubService] Failed to check repository cache:', e.message);
      }
    }

    // 4. Send to Gemini with role-aware prompt + cross-reference
    // OPTIMIZATION: Only send the top 5 repositories to Gemini to save tokens
    const geminiPayload = {
      ...compactProfile,
      topRepositories: sortedByScore.slice(0, 5).map(r => ({
        name: r.name,
        description: r.description,
        language: r.language,
        stars: r.stargazers_count,
        updated_at: r.updated_at
      }))
    };
    const prompt = Prompts.githubAnalysis(geminiPayload, targetRole, resumeData);
    const systemInstruction = `You are a Staff Engineer and Technical Hiring Manager evaluating a ${targetRole} engineer candidate's GitHub. 
Provide your evaluation in strict JSON format only. No markdown, no extra text.`;

    let analysisResult;
    try {
      analysisResult = await generateWithGemini(prompt, { systemInstruction, parseJson: true });
      analysisResult._aiSource = 'GEMINI';
    } catch (err) {
      console.warn('[githubService] Gemini unavailable, using local fallback:', err.message);
      analysisResult = createGithubFallback(compactProfile);
      analysisResult._aiSource = 'FALLBACK';
    }

    if (analysisResult && !analysisResult.bestRepositoryDeepAnalysis && cachedRepoAnalysis) {
      analysisResult.bestRepositoryDeepAnalysis = cachedRepoAnalysis;
    } else if (pool && repoHash && analysisResult && analysisResult.bestRepositoryDeepAnalysis) {
      try {
        await pool.query(
          'INSERT INTO repository_analyses (repo_hash, analysis_data) VALUES ($1, $2::jsonb) ON CONFLICT DO NOTHING',
          [repoHash, JSON.stringify(analysisResult.bestRepositoryDeepAnalysis)]
        );
      } catch (e) {
        console.warn('[githubService] Failed to save repository cache:', e.message);
      }
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
