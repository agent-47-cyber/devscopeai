import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { API_BASE_URL } from './config.js';
import LoginPage from './components/LoginPage.jsx';
import LandingPage from './components/LandingPage.jsx';
import InputForm from './components/InputForm.jsx';
import Dashboard from './components/Dashboard.jsx';

const getResponseJson = async (response) => response.json().catch(() => ({}));

function AppRoutes() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);

  const [profileData, setProfileData] = useState({
    githubUsername: '',
    resumeText: '',
    linkedinUsername: '',
    targetRole: 'frontend'
  });

  const [scores, setScores] = useState({
    portfolio: null,
    ats: null,
    github: null,
    careerReady: null
  });

  const [githubAnalysis, setGithubAnalysis] = useState(null);
  const [resumeAnalysis, setResumeAnalysis] = useState(null);
  const [linkedinAnalysis, setLinkedinAnalysis] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // Load user session and history on mount
  useEffect(() => {
    const savedToken = localStorage.getItem('devscope_token');
    const savedUser = localStorage.getItem('devscope_user');

    if (savedToken && savedUser) {
      setToken(savedToken);
      setUser(JSON.parse(savedUser));
      loadUserHistory(savedToken);
    }
  }, []);

  const loadUserHistory = async (authToken) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/history`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });
      if (response.ok) {
        const data = await response.json().catch(() => null);
        if (data) {
          setProfileData({
            githubUsername: data.githubUsername || '',
            resumeText: data.resumeData ? 'Uploaded Resume Details' : '',
            linkedinUsername: data.linkedinUsername || '',
            targetRole: data.targetRole || 'frontend'
          });
          setScores(data.scores || { portfolio: null, ats: null, github: null, careerReady: null });
          setGithubAnalysis(data.githubData || null);
          setResumeAnalysis(data.resumeData || null);
          setLinkedinAnalysis(data.linkedinData || null);
        }
      }
    } catch (err) {
      console.error('Failed to load user history:', err);
    }
  };

  const handleAuthSuccess = (authUser, authToken) => {
    setUser(authUser);
    setToken(authToken);
    loadUserHistory(authToken);
    navigate('/dashboard');
  };

  const handleLogout = () => {
    localStorage.removeItem('devscope_token');
    localStorage.removeItem('devscope_user');
    setUser(null);
    setToken(null);
    setLinkedinAnalysis(null);
    setProfileData({
      githubUsername: '',
      resumeText: '',
      linkedinUsername: '',
      targetRole: 'frontend'
    });
    setGithubAnalysis(null);
    setResumeAnalysis(null);
    navigate('/');
  };

  // Handle Form Submission - Triggers API calls
  const handleStartAnalysis = async (formData) => {
    setIsLoading(true);
    setProfileData(formData);

    try {
      let ghResult = null;
      let resumeResult = null;
      let liResult = null;

      // 1. Analyze GitHub
      if (formData.githubUsername) {
        const ghResponse = await fetch(`${API_BASE_URL}/api/analyze/github`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            username: formData.githubUsername,
            targetRole: formData.targetRole,
            token: token
          })
        });
        if (ghResponse.ok) {
          const raw = await getResponseJson(ghResponse);
          ghResult = raw.data || raw;  // unwrap { success, data } envelope
          setGithubAnalysis(ghResult);
        } else {
          const errorResult = await getResponseJson(ghResponse);
          setGithubAnalysis(null);
          alert(errorResult.error || 'Failed to analyze GitHub username.');
        }
      }

      // 2. Analyze Resume
      if (formData.resumeText) {
        const resumeResponse = await fetch(`${API_BASE_URL}/api/analyze/resume`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            resumeText: formData.resumeText,
            targetRole: formData.targetRole,
            token: token
          })
        });
        if (resumeResponse.ok) {
          const raw = await getResponseJson(resumeResponse);
          resumeResult = raw.data || raw;  // unwrap { success, data } envelope
          setResumeAnalysis(resumeResult);
        } else {
          const errorResult = await getResponseJson(resumeResponse);
          setResumeAnalysis(null);
          alert(errorResult.error || 'This file is not a resume.');
        }
      }

      // 3. Analyze LinkedIn
      if (formData.linkedinUsername) {
        const liResponse = await fetch(`${API_BASE_URL}/api/analyze/linkedin`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            username: formData.linkedinUsername,
            targetRole: formData.targetRole,
            token: token
          })
        });
        if (liResponse.ok) {
          const raw = await getResponseJson(liResponse);
          liResult = raw.data || raw;  // unwrap { success, data } envelope
          setLinkedinAnalysis(liResult);
        } else {
          const errorResult = await getResponseJson(liResponse);
          setLinkedinAnalysis(null);
          alert(errorResult.error || 'This is not a LinkedIn URL or username.');
        }
      }

      // 4. Set Scores based on results
      const newScores = {
        github: ghResult ? ghResult.score : null,
        ats: resumeResult ? resumeResult.atsScore : null,
        careerReady: liResult ? liResult.score : null,
      };

      const activeScores = [];
      if (newScores.github !== null) activeScores.push(newScores.github);
      if (newScores.ats !== null) activeScores.push(newScores.ats);
      if (newScores.careerReady !== null) activeScores.push(newScores.careerReady);

      newScores.portfolio = activeScores.length > 0
        ? Math.round(activeScores.reduce((a, b) => a + b, 0) / activeScores.length)
        : null;

      if (activeScores.length === 0) {
        setIsLoading(false);
        return;
      }

      setScores(newScores);
      navigate('/dashboard');
    } catch (error) {
      console.error('Analysis failed:', error);
      navigate('/dashboard');
    } finally {
      setIsLoading(false);
    }
  };

  const dashboardProps = {
    profileData,
    scores,
    githubAnalysis,
    resumeAnalysis,
    linkedinAnalysis,
    onHome: handleLogout,
    user
  };

  return (
    <Routes>
      {/* Root route: if logged in go to dashboard, else show login */}
      <Route
        path="/"
        element={token ? <Navigate to="/dashboard" /> : <LoginPage onAuthSuccess={handleAuthSuccess} />}
      />
      {/* Also expose /login explicitly */}
      <Route
        path="/login"
        element={token ? <Navigate to="/dashboard" /> : <LoginPage onAuthSuccess={handleAuthSuccess} />}
      />
      {/* Landing page (marketing) - accessible always */}
      <Route
        path="/home"
        element={<LandingPage onGetStarted={() => navigate('/login')} scores={scores} onLoginClick={() => navigate('/login')} user={user} onLogout={handleLogout} />}
      />
      <Route
        path="/input"
        element={token ? <InputForm onSubmit={handleStartAnalysis} onBack={() => navigate('/dashboard')} isLoading={isLoading} /> : <Navigate to="/" />}
      />
      <Route path="/dashboard" element={token ? <Dashboard {...dashboardProps} /> : <Navigate to="/" />} />
      <Route path="/resume" element={token ? <Dashboard {...dashboardProps} /> : <Navigate to="/" />} />
      <Route path="/github" element={token ? <Dashboard {...dashboardProps} /> : <Navigate to="/" />} />
      <Route path="/linkedin" element={token ? <Dashboard {...dashboardProps} /> : <Navigate to="/" />} />
      <Route path="/job-match" element={token ? <Dashboard {...dashboardProps} /> : <Navigate to="/" />} />
      <Route path="/project-gap" element={token ? <Dashboard {...dashboardProps} /> : <Navigate to="/" />} />
      <Route path="/report" element={token ? <Dashboard {...dashboardProps} /> : <Navigate to="/" />} />
      <Route path="/settings" element={token ? <Dashboard {...dashboardProps} /> : <Navigate to="/" />} />
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}
