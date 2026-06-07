import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from './config.js';
import LandingPage from './components/LandingPage.jsx';
import InputForm from './components/InputForm.jsx';
import Dashboard from './components/Dashboard.jsx';
import AuthModal from './components/AuthModal.jsx';

const getResponseJson = async (response) => response.json().catch(() => ({}));

function App() {
  const [currentView, setCurrentView] = useState('landing'); // 'landing', 'input', 'dashboard'
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [showAuthModal, setShowAuthModal] = useState(false);

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
        const data = await response.json();
        if (data) {
          setProfileData({
            githubUsername: data.githubUsername || '',
            resumeText: data.resumeData ? 'Uploaded Resume Details' : '',
            linkedinUsername: data.linkedinUsername || '',
            targetRole: data.targetRole || 'frontend'
          });
          setScores(data.scores);
          setGithubAnalysis(data.githubData);
          setResumeAnalysis(data.resumeData);
          setLinkedinAnalysis(data.linkedinData);
          setCurrentView('dashboard');
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
  };

  const handleLogout = () => {
    localStorage.removeItem('devscope_token');
    localStorage.removeItem('devscope_user');
    setUser(null);
    setToken(null);
    setLinkedinAnalysis(null);
    resetApp();
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
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            username: formData.githubUsername,
            targetRole: formData.targetRole,
            token: token
          })
        });
        if (ghResponse.ok) {
          ghResult = await getResponseJson(ghResponse);
          setGithubAnalysis(ghResult);
        } else {
          const errorResult = await getResponseJson(ghResponse);
          alert(errorResult.error || 'Failed to analyze GitHub username. Please verify the profile exists and try again.');
        }
      }

      // 2. Analyze Resume
      if (formData.resumeText) {
        const resumeResponse = await fetch(`${API_BASE_URL}/api/analyze/resume`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            resumeText: formData.resumeText,
            targetRole: formData.targetRole,
            token: token
          })
        });
        if (resumeResponse.ok) {
          resumeResult = await getResponseJson(resumeResponse);
          setResumeAnalysis(resumeResult);
        } else {
          const errorResult = await getResponseJson(resumeResponse);
          alert(errorResult.error || 'This file is not a resume. Please upload a resume file or paste your resume text.');
        }
      }

      // 3. Analyze LinkedIn
      if (formData.linkedinUsername) {
        const liResponse = await fetch(`${API_BASE_URL}/api/analyze/linkedin`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            username: formData.linkedinUsername,
            targetRole: formData.targetRole,
            token: token
          })
        });
        if (liResponse.ok) {
          liResult = await getResponseJson(liResponse);
          setLinkedinAnalysis(liResult);
        } else {
          const errorResult = await getResponseJson(liResponse);
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
        setCurrentView('input');
        return;
      }
      
      setScores(newScores);
      setCurrentView('dashboard');
    } catch (error) {
      console.error('Analysis failed:', error);
      setCurrentView('dashboard');
    } finally {
      setIsLoading(false);
    }
  };

  const resetApp = () => {
    setCurrentView('landing');
    setProfileData({
      githubUsername: '',
      resumeText: '',
      linkedinUsername: '',
      targetRole: 'frontend'
    });
    setGithubAnalysis(null);
    setResumeAnalysis(null);
    setLinkedinAnalysis(null);
  };

  const triggerGetStarted = () => {
    if (user) {
      setCurrentView('input');
    } else {
      setShowAuthModal(true);
    }
  };

  return (
    <div className="app-wrapper">
      {currentView === 'landing' && (
        <LandingPage 
          onGetStarted={triggerGetStarted} 
          scores={scores}
          onLoginClick={() => setShowAuthModal(true)}
          user={user}
          onLogout={handleLogout}
        />
      )}

      {currentView === 'input' && (
        <InputForm 
          onSubmit={handleStartAnalysis} 
          onBack={() => setCurrentView('landing')}
          isLoading={isLoading}
        />
      )}

      {currentView === 'dashboard' && (
        <Dashboard 
          profileData={profileData}
          scores={scores}
          githubAnalysis={githubAnalysis}
          resumeAnalysis={resumeAnalysis}
          linkedinAnalysis={linkedinAnalysis}
          onHome={handleLogout} // Logs out and returns to landing
          user={user}
        />
      )}

      {showAuthModal && (
        <AuthModal 
          onClose={() => setShowAuthModal(false)} 
          onAuthSuccess={handleAuthSuccess}
        />
      )}
    </div>
  );
}

export default App;
