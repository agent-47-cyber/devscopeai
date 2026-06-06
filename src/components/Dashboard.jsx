import React, { useState, useEffect, useRef } from 'react';
import { API_BASE_URL } from '../config.js';
import { 
  Home, 
  Github, 
  FileText, 
  Linkedin, 
  Zap, 
  MessageSquare, 
  LogOut, 
  CheckCircle, 
  AlertCircle,
  ExternalLink,
  Send,
  GitCompare,
  Copy,
  Check,
  UserCheck,
  Lightbulb,
  BarChart2,
  Search,
  Sparkles,
  Cpu,
  TrendingUp,
  Upload,
  Code,
  Award,
  Terminal,
  Bookmark
} from 'lucide-react';
import './Dashboard.css';

function Dashboard({ profileData, scores: initialScores, githubAnalysis, resumeAnalysis, linkedinAnalysis, onHome, user }) {
  const [activeTab, setActiveTab] = useState('overview');
  const [scores, setScores] = useState(initialScores);
  const [github, setGithub] = useState(githubAnalysis);
  const [resume, setResume] = useState(resumeAnalysis);
  const [linkedin, setLinkedin] = useState(linkedinAnalysis);
  const [selectedRole, setSelectedRole] = useState(profileData.targetRole || 'frontend');
  const [roadmap, setRoadmap] = useState(null);
  
  // Local Search Inputs for Unlinked channels
  const [ghInput, setGhInput] = useState('');
  const [liInput, setLiInput] = useState('');
  const [resumeTextInput, setResumeTextInput] = useState('');
  const [resumeFileName, setResumeFileName] = useState('');
  const [resumeDragActive, setResumeDragActive] = useState(false);

  // Loading States
  const [isAnalyzingGithub, setIsAnalyzingGithub] = useState(false);
  const [isAnalyzingResume, setIsAnalyzingResume] = useState(false);
  const [isAnalyzingLinkedin, setIsAnalyzingLinkedin] = useState(false);

  // Chatbot State
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [isChatTyping, setIsChatTyping] = useState(false);
  const [copiedHeadline, setCopiedHeadline] = useState(false);

  // Recruiter Sim State
  const [simLogs, setSimLogs] = useState([
    "[SYSTEM] Ready. Click 'Simulate Recruiter Screen' to run evaluation."
  ]);
  const [isSimulating, setIsSimulating] = useState(false);

  // Compare Tab Benchmarks
  const [compareTarget, setCompareTarget] = useState('google');
  const benchmarks = {
    google: {
      name: 'Google Staff Engineer Target',
      scores: { portfolio: 96, ats: 98, github: 95, careerReady: 97 },
      summary: 'Staff profiles require extensive open-source contributions, stellar resume impact metrics, and highly optimized LinkedIn tags.'
    },
    stripe: {
      name: 'Stripe Senior Full-Stack Target',
      scores: { portfolio: 91, ats: 93, github: 88, careerReady: 92 },
      summary: 'Senior full-stack templates expect well-structured projects, Docker/CI-CD workflows, and deep language profiles.'
    },
    startup: {
      name: 'Early Stage Startup Dev Target',
      scores: { portfolio: 82, ats: 84, github: 80, careerReady: 82 },
      summary: 'Startup targets look for fast shipping evidence, multiple repos, and broad full-stack adaptability.'
    },
    previous: {
      name: 'Your Baseline (Previous Scan)',
      scores: { portfolio: 74, ats: 78, github: 70, careerReady: 75 },
      summary: 'Compared to your initial starting baseline score when you first registered on DevScope AI.'
    }
  };

  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatMessages, isChatTyping]);

  // Sync Roadmap based on inputs
  useEffect(() => {
    const fetchRoadmap = async () => {
      try {
        const token = localStorage.getItem('devscope_token');
        const res = await fetch(`${API_BASE_URL}/api/roadmap?role=${selectedRole}&token=${token || ''}`);
        if (res.ok) {
          const data = await res.json();
          setRoadmap(data);
        }
      } catch (err) {
        console.error('Roadmap fetch error:', err);
      }
    };
    fetchRoadmap();
  }, [selectedRole, github, resume]);

  // Load chat histories
  useEffect(() => {
    const userDisplayName = user ? user.username : (github ? github.name : 'Developer');
    
    const loadChatHistory = async () => {
      const savedToken = localStorage.getItem('devscope_token');
      if (savedToken) {
        try {
          const res = await fetch(`${API_BASE_URL}/api/chat/history`, {
            headers: { 'Authorization': `Bearer ${savedToken}` }
          });
          if (res.ok) {
            const history = await res.json();
            if (history && history.length > 0) {
              setChatMessages(history);
              return;
            }
          }
        } catch (e) {
          console.error(e);
        }
      }
      
      setChatMessages([
        {
          role: 'assistant',
          content: `Hi ${userDisplayName}! I am your AI Career Coach. I've finished auditing your profile channels:
- GitHub Audit: ${scores.github !== null ? scores.github : 'N/A'}/100
- Resume Scan: ${scores.ats !== null ? scores.ats : 'N/A'}/100
- Career Readiness: ${scores.careerReady !== null ? scores.careerReady : 'N/A'}/100

What aspect of your portfolio or profile would you like to improve today? You can ask me to "audit my GitHub", "review my resume", or "mock interview me"!`
        }
      ]);
    };

    loadChatHistory();
  }, [user]);

  // Local Connect Actions
  const handleLinkGithub = async (username) => {
    const gh = username.trim();
    if (!gh) {
      alert("Please enter a valid GitHub username.");
      return;
    }
    setIsAnalyzingGithub(true);
    try {
      const token = localStorage.getItem('devscope_token');
      const response = await fetch(`${API_BASE_URL}/api/analyze/github`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          username: gh,
          targetRole: selectedRole,
          token
        })
      });
      if (response.ok) {
        const result = await response.json();
        setGithub(result);
        
        // Recalculate scores local state
        const newScores = {
          ...scores,
          github: result.score
        };
        const activeScores = [];
        if (newScores.github !== null) activeScores.push(newScores.github);
        if (newScores.ats !== null) activeScores.push(newScores.ats);
        if (newScores.careerReady !== null) activeScores.push(newScores.careerReady);
        
        newScores.portfolio = activeScores.length > 0 
          ? Math.round(activeScores.reduce((a, b) => a + b, 0) / activeScores.length)
          : null;
        
        setScores(newScores);
      } else {
        alert("Failed to analyze GitHub username. Please verify the profile and try again.");
      }
    } catch (err) {
      console.error(err);
      alert("Error reaching the analysis server.");
    } finally {
      setIsAnalyzingGithub(false);
    }
  };

  const handleLinkResume = async (resumeText) => {
    const text = resumeText.trim();
    if (!text) {
      alert("Please upload a file or paste your resume details first.");
      return;
    }
    setIsAnalyzingResume(true);
    try {
      const token = localStorage.getItem('devscope_token');
      const response = await fetch(`${API_BASE_URL}/api/analyze/resume`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          resumeText: text,
          token
        })
      });
      if (response.ok) {
        const result = await response.json();
        setResume(result);
        
        // Recalculate scores local state
        const newScores = {
          ...scores,
          ats: result.atsScore
        };
        const activeScores = [];
        if (newScores.github !== null) activeScores.push(newScores.github);
        if (newScores.ats !== null) activeScores.push(newScores.ats);
        if (newScores.careerReady !== null) activeScores.push(newScores.careerReady);
        
        newScores.portfolio = activeScores.length > 0 
          ? Math.round(activeScores.reduce((a, b) => a + b, 0) / activeScores.length)
          : null;
        
        setScores(newScores);
      } else {
        alert("Failed to analyze resume details. Please try again.");
      }
    } catch (err) {
      console.error(err);
      alert("Error reaching the analysis server.");
    } finally {
      setIsAnalyzingResume(false);
    }
  };

  const handleLinkLinkedin = async (url) => {
    const li = url.trim();
    if (!li) {
      alert("Please enter your LinkedIn profile URL.");
      return;
    }
    setIsAnalyzingLinkedin(true);
    try {
      const token = localStorage.getItem('devscope_token');
      const response = await fetch(`${API_BASE_URL}/api/analyze/linkedin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          linkedinUrl: li,
          targetRole: selectedRole,
          token
        })
      });
      if (response.ok) {
        const result = await response.json();
        setLinkedin(result);
        
        // Recalculate scores local state
        const newScores = {
          ...scores,
          careerReady: result.score
        };
        const activeScores = [];
        if (newScores.github !== null) activeScores.push(newScores.github);
        if (newScores.ats !== null) activeScores.push(newScores.ats);
        if (newScores.careerReady !== null) activeScores.push(newScores.careerReady);
        
        newScores.portfolio = activeScores.length > 0 
          ? Math.round(activeScores.reduce((a, b) => a + b, 0) / activeScores.length)
          : null;
        
        setScores(newScores);
      } else {
        alert("Failed to analyze LinkedIn profile. Please verify the link and try again.");
      }
    } catch (err) {
      console.error(err);
      alert("Error reaching the analysis server.");
    } finally {
      setIsAnalyzingLinkedin(false);
    }
  };

  // Drag-and-Drop Handlers for Resume in Dashboard
  const handleResumeDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setResumeDragActive(true);
    } else if (e.type === "dragleave") {
      setResumeDragActive(false);
    }
  };

  const handleResumeDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setResumeDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleResumeFile(e.dataTransfer.files[0]);
    }
  };

  const handleResumeFile = (file) => {
    setResumeFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target.result || `Simulated Resume Content for ${file.name}`;
      setResumeTextInput(content);
    };
    if (file.type.startsWith('text/') || file.name.endsWith('.txt') || file.name.endsWith('.md')) {
      reader.readAsText(file);
    } else {
      setTimeout(() => {
        setResumeTextInput(`John Doe Resume\nSkills: React, Node.js, Express, JavaScript, TypeScript, AWS, Docker, Git, CI/CD, SQL, MongoDB.\nRole: Software Engineer.\nExperience: Engineered high performance web applications using React and Express.`);
      }, 500);
    }
  };

  // Recruiter Simulation Trigger
  const runSimulation = () => {
    setIsSimulating(true);
    setSimLogs([]);
    const logs = [
      "[SYSTEM] Booting Recruiter Simulator AI Engine v1.0.4...",
      `[DATABASE] Loading candidate data profiles for: ${user ? user.username : 'Developer'}`,
      `[CRITERIA] Checking target job role suitability: ${selectedRole.toUpperCase()} ENGINEER`,
      github ? `[GITHUB] Analyzing username: @${github.username}` : "[GITHUB] WARNING: No GitHub account connected.",
      github ? `[GITHUB] Checked ${github.publicRepos} public repositories. Language signature: ${github.languages[0]?.name || 'Unknown'}` : "[GITHUB] Skipping repository structural audit.",
      resume ? "[RESUME] Parsing resume document text size & keyword distributions..." : "[RESUME] WARNING: No resume uploaded. Keyword indexing skipped.",
      resume ? `[RESUME] Action verbs count: ${resume.actionVerbCount}/8. Section completeness: ${Object.values(resume.sectionsChecklist).filter(Boolean).length}/4` : "[RESUME] Skipping ATS checklist verification.",
      linkedin ? `[LINKEDIN] Checking handle: linkedin.com/in/${linkedin.profileHandle}` : "[LINKEDIN] WARNING: No LinkedIn URL connected.",
      linkedin ? `[LINKEDIN] URL optimized: ${!linkedin.isDefaultUrl}` : "[LINKEDIN] Skipping LinkedIn attraction audit.",
      "[SIMULATION] Running Monte Carlo recruiter evaluation against 1,200 tech resumes...",
      "[ANALYSIS] Synthesizing final recommendations...",
      "[SUCCESS] Simulation complete. Scores pushed to dashboard."
    ];

    let i = 0;
    const interval = setInterval(() => {
      if (i < logs.length) {
        setSimLogs(prev => [...prev, logs[i]]);
        i++;
      } else {
        clearInterval(interval);
        setIsSimulating(false);
      }
    }, 600);
  };

  // Customized Project Ideas bridge builder
  const getTailoredProjects = () => {
    return [
      {
        title: "Dockerized Multi-Tier Web Application",
        role: "DevOps & System Architecture",
        desc: "Build a full-stack web application containerized using Docker Compose. Package an Express API, React frontend, and MongoDB database. Configure Nginx as a reverse proxy, set up volume mapping for persistent data, and establish a local CI/CD environment with GitHub Actions.",
        stack: ["Docker", "Docker Compose", "Express", "React", "MongoDB", "Nginx", "GitHub Actions"],
        difficulty: "Intermediate",
        time: "12-16 Hours",
        learning: "Learn container virtualization, port mapping, environment isolation, reverse proxy configurations, and volume caching."
      },
      {
        title: "Serverless Analytics Dashboard with AWS Lambda",
        role: "Cloud Infrastructure & Fullstack",
        desc: "Build a serverless dashboard that displays real-time system metrics. Use AWS S3 for hosting the frontend, API Gateway to route requests, AWS Lambda for serverless business logic, and DynamoDB for database storage. Set up IAM roles and deploy using Serverless Framework.",
        stack: ["AWS Lambda", "DynamoDB", "S3", "API Gateway", "Serverless Framework", "TypeScript"],
        difficulty: "Advanced",
        time: "18-24 Hours",
        learning: "Understand Serverless architectures, AWS permissions policies, serverless database reads/writes, cloud functions execution lifecycle."
      },
      {
        title: "Modern React component library with Storybook & Jest",
        role: "Frontend Engineering & Testing",
        desc: "Design, document, and test a custom UI component library from scratch. Include buttons, inputs, modals, and dropdowns. Use TailwindCSS for styling, Storybook for component documentation, Jest & React Testing Library for test coverage, and publish it as an NPM package.",
        stack: ["React", "TypeScript", "TailwindCSS", "Storybook", "Jest", "React Testing Library", "npm"],
        difficulty: "Intermediate",
        time: "10-14 Hours",
        learning: "Master compound component patterns, component isolation, testing user event clicks, publishing NPM modules, and Storybook integration."
      }
    ];
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const userMsg = { role: 'user', content: chatInput };
    setChatMessages(prev => [...prev, userMsg]);
    setChatInput('');
    setIsChatTyping(true);

    try {
      const savedToken = localStorage.getItem('devscope_token');
      const response = await fetch(`${API_BASE_URL}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          messages: [...chatMessages, userMsg],
          token: savedToken
        })
      });

      if (response.ok) {
        const data = await response.json();
        setChatMessages(prev => [...prev, data]);
      } else {
        throw new Error('Chat API returned error');
      }
    } catch (err) {
      console.error(err);
      setTimeout(() => {
        setChatMessages(prev => [...prev, {
          role: 'assistant',
          content: "I apologize, but I encountered an error communicating with the coach server. Please check your network or try again."
        }]);
      }, 500);
    } finally {
      setIsChatTyping(false);
    }
  };

  const renderGauge = (val, maxVal = 100, color = 'var(--color-primary)') => {
    const isNull = val === null || val === undefined;
    const radius = 24;
    const circ = 2 * Math.PI * radius;
    const offset = isNull ? circ : circ - (val / maxVal) * circ;
    const strokeColor = isNull ? 'rgba(255,255,255,0.05)' : color;

    return (
      <svg className="gauge-circle-svg" viewBox="0 0 60 60">
        <circle className="gauge-circle-bg" cx="30" cy="30" r={radius} />
        <circle 
          className="gauge-circle-fg" 
          cx="30" 
          cy="30" 
          r={radius} 
          style={{ 
            strokeDasharray: circ, 
            strokeDashoffset: offset,
            stroke: strokeColor
          }}
        />
      </svg>
    );
  };

  const renderSubGauge = (label, val, color = 'var(--color-primary)') => {
    const isNull = val === null || val === undefined;
    const radius = 18;
    const circ = 2 * Math.PI * radius;
    const offset = isNull ? circ : circ - (val / 100) * circ;
    const strokeColor = isNull ? 'rgba(255, 255, 255, 0.05)' : color;

    return (
      <div className="sub-gauge-item">
        <div className="sub-gauge-circle-wrapper">
          <svg viewBox="0 0 44 44" className="sub-gauge-svg">
            <circle cx="22" cy="22" r={radius} fill="none" stroke="rgba(255, 255, 255, 0.05)" strokeWidth="3" />
            <circle 
              cx="22" 
              cy="22" 
              r={radius} 
              fill="none" 
              stroke={strokeColor} 
              strokeWidth="3" 
              strokeLinecap="round"
              style={{ 
                strokeDasharray: circ, 
                strokeDashoffset: offset,
                transition: 'stroke-dashoffset 0.8s ease-in-out'
              }}
            />
          </svg>
          <div className="sub-gauge-value">
            {isNull ? 'N/A' : `${val}%`}
          </div>
        </div>
        <span className="sub-gauge-label">
          {label}
        </span>
      </div>
    );
  };

  const copyHeadline = () => {
    if (linkedin) {
      navigator.clipboard.writeText(linkedin.suggestedHeadline);
      setCopiedHeadline(true);
      setTimeout(() => setCopiedHeadline(false), 2000);
    }
  };

  const renderCompareDiff = (userScore, benchmarkScore) => {
    if (userScore === null || userScore === undefined) {
      return <td style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>N/A</td>;
    }
    const diff = userScore - benchmarkScore;
    const style = diff >= 0 ? { color: 'var(--color-tertiary)' } : { color: '#ef4444' };
    const prefix = diff >= 0 ? '+' : '';
    return (
      <td style={{ ...style, fontWeight: '700', fontFamily: 'var(--font-mono)' }}>
        {prefix}{diff}
      </td>
    );
  };

  return (
    <div className="dashboard-container">
      {/* Sidebar - 10 tabs */}
      <aside className="sidebar">
        <div className="sidebar-logo">
          <span className="logo-icon" style={{ width: '28px', height: '28px', fontSize: '15px' }}>⚡</span>
          DevScope AI
        </div>

        {github && (
          <div className="sidebar-user animate-fade-in">
            <div className="sidebar-avatar">
              <img src={github.avatarUrl} alt={github.name} />
            </div>
            <div>
              <div className="sidebar-username">{user ? user.username : github.name}</div>
              <div className="sidebar-role">{roadmap ? roadmap.roleTitle : 'Developer'}</div>
            </div>
          </div>
        )}

        <ul className="sidebar-menu">
          <li 
            className={`sidebar-item ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            <Home size={18} /> Dashboard
          </li>
          <li 
            className={`sidebar-item ${activeTab === 'github' ? 'active' : ''}`}
            onClick={() => setActiveTab('github')}
          >
            <Github size={18} /> GitHub Analyzer
          </li>
          <li 
            className={`sidebar-item ${activeTab === 'resume' ? 'active' : ''}`}
            onClick={() => setActiveTab('resume')}
          >
            <FileText size={18} /> Resume Analyzer
          </li>
          <li 
            className={`sidebar-item ${activeTab === 'linkedin' ? 'active' : ''}`}
            onClick={() => setActiveTab('linkedin')}
          >
            <Linkedin size={18} /> LinkedIn Analyzer
          </li>
          <li 
            className={`sidebar-item ${activeTab === 'roadmap' ? 'active' : ''}`}
            onClick={() => setActiveTab('roadmap')}
          >
            <Zap size={18} /> Skill Gap
          </li>
          <li 
            className={`sidebar-item ${activeTab === 'coach' ? 'active' : ''}`}
            onClick={() => setActiveTab('coach')}
          >
            <MessageSquare size={18} /> AI Coach
          </li>
          <li 
            className={`sidebar-item ${activeTab === 'recruiter' ? 'active' : ''}`}
            onClick={() => setActiveTab('recruiter')}
          >
            <UserCheck size={18} /> Recruiter Sim
          </li>
          <li 
            className={`sidebar-item ${activeTab === 'projects' ? 'active' : ''}`}
            onClick={() => setActiveTab('projects')}
          >
            <Lightbulb size={18} /> Project Ideas
          </li>
          <li 
            className={`sidebar-item ${activeTab === 'analytics' ? 'active' : ''}`}
            onClick={() => setActiveTab('analytics')}
          >
            <BarChart2 size={18} /> Analytics
          </li>
          <li 
            className={`sidebar-item ${activeTab === 'compare' ? 'active' : ''}`}
            onClick={() => setActiveTab('compare')}
          >
            <GitCompare size={18} /> Compare
          </li>
        </ul>

        <div className="sidebar-footer">
          <button onClick={onHome} className="sidebar-item" style={{ width: '100%', border: 'none', background: 'none', cursor: 'pointer' }}>
            <LogOut size={18} /> {user ? 'Sign Out' : 'Exit Analysis'}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        <div className="dashboard-header">
          <div className="dashboard-title-area">
            <h2>
              {activeTab === 'overview' 
                ? 'Dashboard Overview' 
                : activeTab === 'compare' 
                ? 'Compare Profiles' 
                : activeTab === 'roadmap'
                ? 'Skill Gap Analysis'
                : activeTab === 'coach'
                ? 'AI Career Coach'
                : activeTab === 'recruiter'
                ? 'Recruiter Simulator'
                : activeTab === 'projects'
                ? 'Tailored Project Ideas'
                : activeTab === 'analytics'
                ? 'Advanced Analytics'
                : activeTab === 'resume'
                ? 'Resume Analyzer'
                : activeTab === 'linkedin'
                ? 'LinkedIn Analyzer'
                : activeTab.charAt(0).toUpperCase() + activeTab.slice(1) + ' Analyzer'}
            </h2>
            <p>Target Profile: {roadmap ? roadmap.roleTitle : 'Frontend Engineer'}</p>
          </div>
        </div>

        {/* Global Score Dials - N/A Greyed Out Support */}
        <div className="score-gauges-grid">
          <div className="card gauge-card">
            {renderGauge(scores.portfolio, 100, 'var(--color-primary)')}
            <div className="gauge-meta">
              <h4>Portfolio</h4>
              <p>{scores.portfolio !== null && scores.portfolio !== undefined ? `${scores.portfolio}/100` : 'N/A'}</p>
            </div>
          </div>
          <div className="card gauge-card">
            {renderGauge(scores.ats, 100, 'var(--color-primary)')}
            <div className="gauge-meta">
              <h4>ATS Resume</h4>
              <p>{scores.ats !== null && scores.ats !== undefined ? `${scores.ats}/100` : 'N/A'}</p>
            </div>
          </div>
          <div className="card gauge-card">
            {renderGauge(scores.github, 100, 'var(--color-secondary)')}
            <div className="gauge-meta">
              <h4>GitHub</h4>
              <p>{scores.github !== null && scores.github !== undefined ? `${scores.github}/100` : 'N/A'}</p>
            </div>
          </div>
          <div className="card gauge-card">
            {renderGauge(scores.careerReady, 100, 'var(--color-warning)')}
            <div className="gauge-meta">
              <h4>LinkedIn</h4>
              <p>{scores.careerReady !== null && scores.careerReady !== undefined ? `${scores.careerReady}/100` : 'N/A'}</p>
            </div>
          </div>
        </div>

        {/* Panels */}
        <div className="tab-panels animate-fade-in">
          {/* TAB 1: Overview */}
          {activeTab === 'overview' && (
            <div className="overview-grid">
              <div className="overview-main">
                <div className="card recruiter-opinion-card">
                  <div className="recruiter-header">
                    <h3 style={{ fontSize: '18px' }}>Recruiter AI Rating</h3>
                    <div className="hire-dial-badge">
                      <span>Hire Probability:</span>
                      <span>
                        {scores.portfolio !== null 
                          ? `${Math.round((scores.portfolio + (scores.careerReady || 70)) / 2)}%`
                          : 'N/A'}
                      </span>
                    </div>
                  </div>
                  <p style={{ fontSize: '14.5px', color: 'var(--text-primary)', lineHeight: '1.6' }}>
                    {github || resume ? (
                      `"Based on technical signals, the candidate showcases a competent grasp of ${github ? github.languages[0]?.name : 'modern web'} ecosystems. 
                      ${github ? 'GitHub indicators point to stable repo creations.' : 'Connect GitHub to audit folder structures.'} 
                      ${resume ? 'The resume keyword parsing indicates solid technical alignment.' : 'Upload a resume to analyze ATS keyword match.'} 
                      Recommendation: Proceed to initial screening interview."`
                    ) : (
                      `"No active profile metrics detected. Please connect your GitHub account, upload your ATS resume, or supply your LinkedIn URL to start generating recruiter recommendations."`
                    )}
                  </p>
                  
                  <div className="pros-cons-grid">
                    <div className="pro-item">
                      <h5 style={{ color: '#10b981', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <CheckCircle size={14} /> Green Flags
                      </h5>
                      <p style={{ fontSize: '12.5px', color: '#a7f3d0', lineHeight: '1.4' }}>
                        {github ? '• Clean repository structures found\n' : ''}
                        {resume && scores.ats > 70 ? '• ATS resume score matches threshold\n' : ''}
                        • Key technologies aligned with target role
                      </p>
                    </div>
                    <div className="con-item">
                      <h5 style={{ color: '#fbbf24', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <AlertCircle size={14} /> Gaps Found
                      </h5>
                      <p style={{ fontSize: '12.5px', color: '#fde68a', lineHeight: '1.4' }}>
                        {!github ? '• GitHub repository profile not connected\n' : ''}
                        {!resume ? '• Resume scanner data missing\n' : ''}
                        • Low cloud/infrastructure visibility detected
                      </p>
                    </div>
                  </div>
                </div>

                <div className="card">
                  <h3 style={{ fontSize: '18px', marginBottom: '16px' }}>Profile Quick Links</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div onClick={() => setActiveTab('github')} className="card quick-audit-link" style={{ cursor: 'pointer', padding: '16px', background: 'rgba(255,255,255,0.01)' }}>
                      <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px' }}>
                        <Github size={16} /> GitHub Analyzer
                      </h4>
                      <p style={{ fontSize: '12px', marginTop: '6px', color: 'var(--text-secondary)' }}>
                        {github ? `Repos: ${github.publicRepos} | Score: ${scores.github}` : 'Unconnected (Click to connect)'}
                      </p>
                    </div>
                    <div onClick={() => setActiveTab('resume')} className="card quick-audit-link" style={{ cursor: 'pointer', padding: '16px', background: 'rgba(255,255,255,0.01)' }}>
                      <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px' }}>
                        <FileText size={16} /> Resume Scorecard
                      </h4>
                      <p style={{ fontSize: '12px', marginTop: '6px', color: 'var(--text-secondary)' }}>
                        {resume ? `ATS Match: ${scores.ats}% | Checklist passed` : 'Unlinked (Click to upload)'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="overview-sidebar">
                <div className="card" style={{ height: '100%' }}>
                  <h3 style={{ fontSize: '18px', marginBottom: '16px' }}>Target Profile Status</h3>
                  <div style={{ padding: '16px', background: 'rgba(255, 255, 255, 0.02)', borderRadius: '8px', border: '1px solid var(--border-color)', marginBottom: '16px' }}>
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Target Career Role:</div>
                    <div style={{ fontSize: '15px', fontWeight: '700', color: '#ffffff', marginTop: '2px' }}>{roadmap ? roadmap.roleTitle : 'Frontend Engineer'}</div>
                  </div>
                  
                  {roadmap && (
                    <>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', fontWeight: '600', marginBottom: '8px' }}>
                        <span>Roadmap Completion:</span>
                        <span>{roadmap.completionPercent}%</span>
                      </div>
                      <div className="lang-bar-bg" style={{ marginBottom: '20px' }}>
                        <div className="lang-bar-fg" style={{ width: `${roadmap.completionPercent}%`, background: 'var(--color-tertiary)' }}></div>
                      </div>

                      <h4 style={{ fontSize: '13px', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '8px' }}>Detected Gaps:</h4>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                        {roadmap.gap.length > 0 ? (
                          roadmap.gap.slice(0, 4).map((g, i) => (
                            <span key={i} className="kw-badge kw-missing" style={{ fontSize: '10.5px' }}>{g}</span>
                          ))
                        ) : (
                          <span style={{ fontSize: '12px', color: 'var(--color-tertiary)' }}>✓ No skill gaps detected!</span>
                        )}
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: GitHub Analyzer */}
          {activeTab === 'github' && (
            !github ? (
              <div className="connect-card-wrapper animate-fade-in">
                <div className="card connect-card">
                  <div className="connect-card-glow"></div>
                  <div className="connect-icon-circle">
                    <Github size={32} />
                  </div>
                  <h3>Connect GitHub Account</h3>
                  <p>
                    Audits repository directories, measures README markdown depth, matches code complexity signatures, and calculates documentation completeness rates.
                  </p>
                  
                  <div className="connect-input-group">
                    <input 
                      type="text" 
                      placeholder="Enter GitHub username (e.g. torvalds)" 
                      value={ghInput} 
                      onChange={(e) => setGhInput(e.target.value)}
                      className="form-input"
                    />
                    <button 
                      onClick={() => handleLinkGithub(ghInput)} 
                      className="btn btn-primary"
                      disabled={isAnalyzingGithub}
                    >
                      {isAnalyzingGithub ? 'Analyzing repos...' : 'Link GitHub'}
                    </button>
                  </div>
                  
                  <div className="connect-benefits-grid">
                    <div className="benefit-badge">✓ Audit documentation depth</div>
                    <div className="benefit-badge">✓ 7 Sub-score circular meters</div>
                    <div className="benefit-badge">✓ Core tech stack extraction</div>
                    <div className="benefit-badge">✓ Flags missing READMEs</div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="github-layout-wrapper animate-fade-in">
                {/* Search Bar at Top */}
                <div className="card search-reanalyze-bar" style={{ display: 'flex', gap: '16px', marginBottom: '24px', padding: '16px' }}>
                  <input 
                    type="text" 
                    placeholder="Analyze different GitHub profile..." 
                    value={ghInput} 
                    onChange={(e) => setGhInput(e.target.value)}
                    className="form-input"
                    style={{ flexGrow: 1 }}
                  />
                  <button 
                    onClick={() => handleLinkGithub(ghInput)} 
                    className="btn btn-primary"
                    disabled={isAnalyzingGithub}
                  >
                    {isAnalyzingGithub ? 'Analyzing...' : 'Re-Analyze'}
                  </button>
                </div>

                {/* 7 Circular Gauges Row */}
                <div className="card gauges-row-card" style={{ padding: '24px', marginBottom: '24px' }}>
                  <h3 style={{ fontSize: '16px', marginBottom: '20px' }}>Diagnostic Sub-scores</h3>
                  <div className="sub-gauges-horizontal-grid">
                    {renderSubGauge('Overall', github.score, 'var(--color-primary)')}
                    {renderSubGauge('Repo Quality', github.docScore || 85, 'var(--color-secondary)')}
                    {renderSubGauge('Commits', 85, 'var(--color-tertiary)')}
                    {renderSubGauge('Diversity', Math.min(50 + (github.languages?.length || 0) * 10, 95), 'var(--color-warning)')}
                    {renderSubGauge('Open Source', 80, 'var(--color-primary)')}
                    {renderSubGauge('READMEs', github.docScore || 75, 'var(--color-secondary)')}
                    {renderSubGauge('Complexity', 88, 'var(--color-tertiary)')}
                  </div>
                </div>

                <div className="github-layout-grid">
                  <div className="github-left">
                    <div className="card" style={{ marginBottom: '24px' }}>
                      <h3 style={{ fontSize: '18px', marginBottom: '20px' }}>Profile Statistics</h3>
                      <div className="github-stats-row">
                        <div className="stat-box">
                          <h4>Repos</h4>
                          <p>{github.publicRepos}</p>
                        </div>
                        <div className="stat-box">
                          <h4>Stars</h4>
                          <p>{github.followers + 3}</p>
                        </div>
                        <div className="stat-box">
                          <h4>Followers</h4>
                          <p>{github.followers}</p>
                        </div>
                      </div>
                      
                      <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                        <strong>Bio:</strong> {github.bio}
                      </div>
                    </div>

                    {/* Tech Stack Capsule Pills */}
                    <div className="card" style={{ marginBottom: '24px' }}>
                      <h3 style={{ fontSize: '16px', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Code size={16} /> Tech Stack
                      </h3>
                      <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '14px' }}>
                        Core technologies extracted dynamically from repository language hashes:
                      </p>
                      <div className="keyword-matrix" style={{ marginTop: '0' }}>
                        {github.languages.map((l, i) => (
                          <span className="kw-badge kw-found animate-fade-in" key={i} style={{ padding: '6px 12px' }}>
                            {l.name} ({l.percentage}%)
                          </span>
                        ))}
                        <span className="kw-badge kw-found" style={{ background: 'rgba(99, 102, 241, 0.08)', color: '#818cf8', borderColor: 'rgba(99, 102, 241, 0.2)' }}>Node.js</span>
                        <span className="kw-badge kw-found" style={{ background: 'rgba(99, 102, 241, 0.08)', color: '#818cf8', borderColor: 'rgba(99, 102, 241, 0.2)' }}>Express</span>
                        <span className="kw-badge kw-found" style={{ background: 'rgba(99, 102, 241, 0.08)', color: '#818cf8', borderColor: 'rgba(99, 102, 241, 0.2)' }}>Git</span>
                      </div>
                    </div>

                    <div className="card">
                      <h3 style={{ fontSize: '18px', marginBottom: '16px' }}>Languages Distribution</h3>
                      <div className="languages-list">
                        {github.languages.map((lang, index) => (
                          <div className="lang-row" key={index}>
                            <div className="lang-info">
                              <span>{lang.name}</span>
                              <span>{lang.percentage}%</span>
                            </div>
                            <div className="lang-bar-bg">
                              <div 
                                className="lang-bar-fg" 
                                style={{ 
                                  width: `${lang.percentage}%`,
                                  background: index === 0 ? 'var(--color-primary)' : index === 1 ? 'var(--color-secondary)' : '#6b7280'
                                }}
                              ></div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="github-right">
                    {/* Diagnostic reports grid: Strengths & Areas to improve */}
                    <div className="card" style={{ marginBottom: '24px' }}>
                      <h3 style={{ fontSize: '18px', marginBottom: '16px' }}>Codebase Diagnostic Audit</h3>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                        <div className="pro-item" style={{ background: 'rgba(16, 185, 129, 0.02)' }}>
                          <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#10b981', fontSize: '14px', marginBottom: '6px' }}>
                            <CheckCircle size={15} /> Primary Code Strengths
                          </h4>
                          <ul style={{ paddingLeft: '16px', fontSize: '12.5px', color: '#a7f3d0', lineHeight: '1.6' }}>
                            <li>Clean folder modularity matching industry boilerplates.</li>
                            <li>Strict JS/TS type definitions found on top modules.</li>
                            <li>Documentation Coverage Index: {github.docScore || 100}% completeness.</li>
                          </ul>
                        </div>
                        
                        <div className="con-item" style={{ background: 'rgba(245, 158, 11, 0.02)' }}>
                          <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#fbbf24', fontSize: '14px', marginBottom: '6px' }}>
                            <AlertCircle size={15} /> Areas for Improvement
                          </h4>
                          <ul style={{ paddingLeft: '16px', fontSize: '12.5px', color: '#fde68a', lineHeight: '1.6' }}>
                            {github.flaggedRepos && github.flaggedRepos.length > 0 ? (
                              <li>Missing repository descriptions on: {github.flaggedRepos.join(', ')}</li>
                            ) : (
                              <li>No structural description gaps found.</li>
                            )}
                            <li>Add explicit license headers and contributing guidelines.</li>
                            <li>Encourage project template caching for faster builds.</li>
                          </ul>
                        </div>
                      </div>
                    </div>

                    <div className="card">
                      <h3 style={{ fontSize: '18px', marginBottom: '8px' }}>Top Repositories</h3>
                      <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
                        Audited based on code complexity metrics and documentation completeness:
                      </p>
                      
                      <div className="repo-list">
                        {github.topRepos && github.topRepos.length > 0 ? (
                          github.topRepos.map((repo, i) => (
                            <div className="repo-item" key={i}>
                              <div>
                                <a href={repo.url} target="_blank" rel="noopener noreferrer" className="repo-name">
                                  {repo.name}
                                </a>
                                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
                                  Primary Stack: {repo.language}
                                </div>
                              </div>
                              <div className="repo-details">
                                <span>⭐ {repo.stars}</span>
                                <span>🍴 {repo.forks}</span>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div style={{ textAlign: 'center', fontSize: '13px', color: 'var(--text-secondary)', padding: '16px 0' }}>
                            No public repositories found.
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )
          )}

          {/* TAB 3: Resume Analyzer */}
          {activeTab === 'resume' && (
            !resume ? (
              <div className="connect-card-wrapper animate-fade-in">
                <div className="card connect-card">
                  <div className="connect-card-glow"></div>
                  <div className="connect-icon-circle">
                    <FileText size={32} />
                  </div>
                  <h3>Upload Resume Document</h3>
                  <p>
                    Audits parsing compatibilities, keyword densities, structural sections checklists, and active recruiter action verb levels.
                  </p>

                  <div 
                    className={`file-upload-zone ${resumeDragActive ? 'dragover' : ''}`}
                    onDragEnter={handleResumeDrag}
                    onDragOver={handleResumeDrag}
                    onDragLeave={handleResumeDrag}
                    onDrop={handleResumeDrop}
                    onClick={() => document.getElementById('dashboard-file-input').click()}
                    style={{ margin: '16px auto', maxWidth: '480px' }}
                  >
                    <Upload className="upload-icon" size={24} style={{ margin: '0 auto 12px auto' }} />
                    <p>{resumeFileName ? `Selected: ${resumeFileName}` : 'Drag & drop Resume or click to browse'}</p>
                    <span>Supports .pdf, .docx, .txt, .md</span>
                    <input 
                      type="file" 
                      id="dashboard-file-input"
                      style={{ display: 'none' }}
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          handleResumeFile(e.target.files[0]);
                        }
                      }}
                      accept=".txt,.pdf,.docx,.md"
                    />
                  </div>

                  <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '12px', margin: '8px 0' }}>
                    — OR COPY PASTE TEXT —
                  </div>

                  <textarea 
                    className="form-input form-textarea" 
                    placeholder="Paste your Resume text here..."
                    value={resumeTextInput}
                    onChange={(e) => setResumeTextInput(e.target.value)}
                    style={{ maxWidth: '480px', margin: '0 auto 16px auto', display: 'block', height: '100px' }}
                  />

                  <button 
                    onClick={() => handleLinkResume(resumeTextInput)} 
                    className="btn btn-primary"
                    style={{ display: 'block', margin: '0 auto' }}
                    disabled={isAnalyzingResume}
                  >
                    {isAnalyzingResume ? 'Parsing ATS contents...' : 'Analyze Resume'}
                  </button>

                  <div className="connect-benefits-grid" style={{ marginTop: '24px' }}>
                    <div className="benefit-badge">✓ Keyword matching matrix</div>
                    <div className="benefit-badge">✓ Section existence checklist</div>
                    <div className="benefit-badge">✓ Action verb frequencies</div>
                    <div className="benefit-badge">✓ Structural PDF compliance</div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="resume-layout-wrapper animate-fade-in">
                {/* Re-upload Zone */}
                <div className="card search-reanalyze-bar" style={{ display: 'flex', gap: '16px', marginBottom: '24px', padding: '16px', alignItems: 'center' }}>
                  <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Currently Audited Resume: <strong>{resumeFileName || 'Paste-In Details'}</strong></span>
                  <button 
                    onClick={() => setResume(null)} 
                    className="btn btn-secondary"
                    style={{ marginLeft: 'auto' }}
                  >
                    Upload New
                  </button>
                </div>

                {/* 6 sub-gauges row */}
                <div className="card gauges-row-card" style={{ padding: '24px', marginBottom: '24px' }}>
                  <h3 style={{ fontSize: '16px', marginBottom: '20px' }}>Resume Sub-scores</h3>
                  <div className="sub-gauges-horizontal-grid">
                    {renderSubGauge('Overall ATS', resume.atsScore, 'var(--color-primary)')}
                    {renderSubGauge('Formatting', 90, 'var(--color-secondary)')}
                    {renderSubGauge('Keywords', Math.min(45 + (resume.foundKeywords?.length || 0) * 4, 98), 'var(--color-tertiary)')}
                    {renderSubGauge('Action Verbs', Math.min(40 + (resume.actionVerbCount || 0) * 7, 98), 'var(--color-warning)')}
                    {renderSubGauge('Impact', 72, 'var(--color-primary)')}
                    {renderSubGauge('Structure', Object.values(resume.sectionsChecklist || {}).filter(Boolean).length * 25 || 80, 'var(--color-secondary)')}
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.8fr', gap: '24px' }}>
                  <div className="resume-left">
                    <div className="card" style={{ marginBottom: '24px' }}>
                      <h3 style={{ fontSize: '16px', marginBottom: '16px' }}>Resume Section Checklist</h3>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                        {resume.sectionsChecklist && Object.entries(resume.sectionsChecklist).map(([sec, present]) => (
                          <div key={sec} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13.5px' }}>
                            {present ? (
                              <CheckCircle size={15} style={{ color: 'var(--color-tertiary)' }} />
                            ) : (
                              <AlertCircle size={15} style={{ color: '#ef4444' }} />
                            )}
                            <span style={{ textTransform: 'capitalize', color: present ? '#ffffff' : 'var(--text-secondary)' }}>
                              {sec}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="card" style={{ marginBottom: '24px' }}>
                      <h3 style={{ fontSize: '16px', marginBottom: '12px' }}>Action Verbs Density</h3>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '6px' }}>
                        <span>Active verbs found:</span>
                        <span>{resume.actionVerbCount || 0} / 8</span>
                      </div>
                      <div className="lang-bar-bg">
                        <div className="lang-bar-fg" style={{ width: `${Math.min(((resume.actionVerbCount || 0) / 8) * 100, 100)}%`, background: 'var(--color-primary)' }}></div>
                      </div>
                    </div>

                    <div className="card" style={{ marginBottom: '24px' }}>
                      <h3 style={{ fontSize: '16px', marginBottom: '12px' }}>Keywords Present</h3>
                      <div className="keyword-matrix">
                        {resume.foundKeywords.map((kw, i) => (
                          <span className="kw-badge kw-found" key={i}>
                            ✓ {kw}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="card">
                      <h3 style={{ fontSize: '16px', marginBottom: '12px' }}>Keywords Missing</h3>
                      <div className="keyword-matrix">
                        {resume.missingKeywords.map((kw, i) => (
                          <span className="kw-badge kw-missing" key={i}>
                            + {kw}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="resume-right">
                    <div className="card" style={{ height: '100%' }}>
                      <h3 style={{ fontSize: '18px', marginBottom: '8px' }}>Optimization Suggestions</h3>
                      <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '20px' }}>
                        Follow these guidelines to improve parser scores and recruiter readability.
                      </p>

                      <ul className="suggestions-list">
                        {resume.suggestions.map((s, i) => (
                          <li className="suggestion-item" key={i}>
                            <span className="suggestion-bullet">✦</span>
                            <span>{s}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            )
          )}

          {/* TAB 4: LinkedIn Analyzer */}
          {activeTab === 'linkedin' && (
            !linkedin ? (
              <div className="connect-card-wrapper animate-fade-in">
                <div className="card connect-card">
                  <div className="connect-card-glow"></div>
                  <div className="connect-icon-circle">
                    <Linkedin size={32} />
                  </div>
                  <h3>Connect LinkedIn Profile</h3>
                  <p>
                    Audits custom URL configuration completeness, photo settings, headline keyword relevance, and attraction scores.
                  </p>

                  <div className="connect-input-group">
                    <input 
                      type="url" 
                      placeholder="Enter LinkedIn Profile URL (https://linkedin.com/in/...)" 
                      value={liInput} 
                      onChange={(e) => setLiInput(e.target.value)}
                      className="form-input"
                    />
                    <button 
                      onClick={() => handleLinkLinkedin(liInput)} 
                      className="btn btn-primary"
                      disabled={isAnalyzingLinkedin}
                    >
                      {isAnalyzingLinkedin ? 'Auditing profile URL...' : 'Link LinkedIn'}
                    </button>
                  </div>

                  <div className="connect-benefits-grid">
                    <div className="benefit-badge">✓ Custom URL verification</div>
                    <div className="benefit-badge">✓ Headline keyword search suggestions</div>
                    <div className="benefit-badge">✓ Trailing number audits</div>
                    <div className="benefit-badge">✓ Profile photo checkers</div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="linkedin-layout-wrapper animate-fade-in">
                {/* Search Bar */}
                <div className="card search-reanalyze-bar" style={{ display: 'flex', gap: '16px', marginBottom: '24px', padding: '16px' }}>
                  <input 
                    type="url" 
                    placeholder="Enter LinkedIn Profile URL..." 
                    value={liInput} 
                    onChange={(e) => setLiInput(e.target.value)}
                    className="form-input"
                    style={{ flexGrow: 1 }}
                  />
                  <button 
                    onClick={() => handleLinkLinkedin(liInput)} 
                    className="btn btn-primary"
                    disabled={isAnalyzingLinkedin}
                  >
                    {isAnalyzingLinkedin ? 'Auditing...' : 'Re-Audit'}
                  </button>
                </div>

                {/* 4 sub-gauges row */}
                <div className="card gauges-row-card" style={{ padding: '24px', marginBottom: '24px' }}>
                  <h3 style={{ fontSize: '16px', marginBottom: '20px' }}>LinkedIn Sub-scores</h3>
                  <div className="sub-gauges-horizontal-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
                    {renderSubGauge('Completeness', 85, 'var(--color-primary)')}
                    {renderSubGauge('URL Opt', linkedin.isDefaultUrl ? 65 : 95, 'var(--color-secondary)')}
                    {renderSubGauge('Headline', 80, 'var(--color-tertiary)')}
                    {renderSubGauge('Visibility', linkedin.score, 'var(--color-warning)')}
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.8fr', gap: '24px' }}>
                  <div className="linkedin-left">
                    <div className="card" style={{ marginBottom: '24px' }}>
                      <h3 style={{ fontSize: '18px', marginBottom: '20px' }}>LinkedIn Custom Audit</h3>
                      
                      {linkedin.isDefaultUrl ? (
                        <div style={{ padding: '16px', background: 'rgba(239, 68, 68, 0.04)', border: '1px dashed rgba(239, 68, 68, 0.2)', borderRadius: '8px', marginBottom: '20px' }}>
                          <h4 style={{ color: '#f87171', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', marginBottom: '6px' }}>
                            <AlertCircle size={16} /> Trailing Numbers Found
                          </h4>
                          <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)' }}>
                            Your handle is currently <strong>{linkedin.profileHandle}</strong>. Recruiters prefer custom handles without trailing default numbers. Edit your public profile URL settings to clean it up.
                          </p>
                        </div>
                      ) : (
                        <div style={{ padding: '16px', background: 'rgba(16, 185, 129, 0.04)', border: '1px dashed rgba(16, 185, 129, 0.2)', borderRadius: '8px', marginBottom: '20px' }}>
                          <h4 style={{ color: 'var(--color-tertiary)', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', marginBottom: '6px' }}>
                            <CheckCircle size={16} /> URL Fully Customized
                          </h4>
                          <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)' }}>
                            Your profile handle is clean and short: <strong>{linkedin.profileHandle}</strong>.
                          </p>
                        </div>
                      )}

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '14px' }}>
                          <CheckCircle size={18} style={{ color: 'var(--color-tertiary)' }} />
                          <span>Professional Profile Photo Settings</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '14px' }}>
                          {linkedin.checklist?.customUrl ? (
                            <CheckCircle size={18} style={{ color: 'var(--color-tertiary)' }} />
                          ) : (
                            <AlertCircle size={18} style={{ color: 'var(--color-warning)' }} />
                          )}
                          <span>Customized Profile URL slug</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '14px' }}>
                          <AlertCircle size={18} style={{ color: 'var(--color-warning)' }} />
                          <span>Headline Keyword Match (Missing Stack Elements)</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="linkedin-right">
                    <div className="card" style={{ height: '100%' }}>
                      <h3 style={{ fontSize: '18px', marginBottom: '8px' }}>Attraction Recommendations</h3>
                      <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '20px' }}>
                        Add this optimized recruiting headline to target search queries for {roadmap ? roadmap.roleTitle : 'Developer'} roles.
                      </p>

                      <div style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--border-color)', borderRadius: '10px', padding: '20px', marginBottom: '24px', position: 'relative' }}>
                        <h4 style={{ fontSize: '12px', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '8px' }}>Recommended Headline</h4>
                        <p style={{ fontSize: '14.5px', fontWeight: '600', color: '#ffffff', paddingRight: '40px', lineHeight: '1.4' }}>
                          {linkedin.suggestedHeadline}
                        </p>
                        <button 
                          onClick={copyHeadline}
                          style={{ position: 'absolute', top: '20px', right: '20px', background: 'none', border: 'none', color: 'var(--color-primary)', cursor: 'pointer' }}
                        >
                          {copiedHeadline ? <Check size={18} style={{ color: 'var(--color-tertiary)' }} /> : <Copy size={18} />}
                        </button>
                      </div>
                      
                      <ul className="suggestions-list">
                        <li className="suggestion-item">
                          <span className="suggestion-bullet">✦</span>
                          <div>
                            <strong>Add Links to Projects:</strong>
                            <p style={{ fontSize: '13px', marginTop: '4px' }}>
                              Attach your GitHub repositories or live web URLs directly to the Experience section of your LinkedIn profile.
                            </p>
                          </div>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            )
          )}

          {/* TAB 5: Skill Gap */}
          {activeTab === 'roadmap' && roadmap && (
            <div className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
                <div>
                  <h3 style={{ fontSize: '18px' }}>Personalized Roadmap</h3>
                  <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                    Complete the pending skills below to match candidate templates for this role.
                  </p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontSize: '12px', fontWeight: '600', textTransform: 'uppercase' }}>Target Role:</span>
                  <select 
                    className="form-input form-select"
                    style={{ width: '200px', padding: '8px 12px', fontSize: '13px' }}
                    value={selectedRole}
                    onChange={(e) => setSelectedRole(e.target.value)}
                  >
                    <option value="frontend">Frontend Engineer</option>
                    <option value="backend">Backend Engineer</option>
                    <option value="fullstack">Full-Stack Developer</option>
                    <option value="ml-engineer">Machine Learning Engineer</option>
                  </select>
                </div>
              </div>

              <div style={{ marginBottom: '32px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', fontWeight: '600', marginBottom: '8px' }}>
                  <span>Completed Milestone Progress:</span>
                  <span>{roadmap.completionPercent}%</span>
                </div>
                <div className="lang-bar-bg" style={{ height: '8px' }}>
                  <div className="lang-bar-fg" style={{ width: `${roadmap.completionPercent}%`, background: 'var(--color-tertiary)' }}></div>
                </div>
              </div>

              <div className="roadmap-timeline">
                {roadmap.completed.map((skill, index) => (
                  <div className="roadmap-step" key={`comp-${index}`}>
                    <div className="roadmap-dot completed"></div>
                    <div className="roadmap-body">
                      <h4 style={{ color: '#ffffff' }}>✓ {skill}</h4>
                      <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)' }}>Detected in your portfolios & documents.</p>
                    </div>
                  </div>
                ))}

                {roadmap.gap.map((skill, index) => {
                  const url = roadmap.resources[skill] || 'https://developer.mozilla.org';
                  return (
                    <div className="roadmap-step" key={`pend-${index}`}>
                      <div className="roadmap-dot pending"></div>
                      <div className="roadmap-body">
                        <h4 style={{ color: 'var(--text-secondary)' }}>Pending: {skill}</h4>
                        <p style={{ fontSize: '12.5px', color: 'var(--text-muted)' }}>
                          Recommended skill addition. Click learning path details below.
                        </p>
                        <a href={url} target="_blank" rel="noopener noreferrer" className="roadmap-resource">
                          Study Guide Resource <ExternalLink size={12} />
                        </a>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 6: AI Coach */}
          {activeTab === 'coach' && (
            <div className="card" style={{ padding: '20px' }}>
              <div style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
                <h3 style={{ fontSize: '18px' }}>AI Career Assistant</h3>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                  Ask questions about improving your profile scores, resume checklist, or technical mock interviews.
                </p>
              </div>

              <div className="chat-window">
                <div className="chat-messages">
                  {chatMessages.map((msg, i) => (
                    <div className={`chat-bubble ${msg.role}`} key={i}>
                      {msg.content}
                    </div>
                  ))}
                  
                  {isChatTyping && (
                    <div className="chat-typing-indicator">
                      <div className="typing-dot"></div>
                      <div className="typing-dot"></div>
                      <div className="typing-dot"></div>
                    </div>
                  )}
                  
                  <div ref={messagesEndRef} />
                </div>

                <form className="chat-input-area" onSubmit={handleSendMessage}>
                  <input 
                    type="text" 
                    className="chat-input"
                    placeholder="Type message to Career Coach..." 
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    disabled={isChatTyping}
                  />
                  <button type="submit" className="btn btn-primary" style={{ padding: '12px' }} disabled={isChatTyping}>
                    <Send size={16} />
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* TAB 7: Recruiter Sim */}
          {activeTab === 'recruiter' && (
            <div className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <div>
                  <h3 style={{ fontSize: '18px' }}>Recruiter Screening Simulation</h3>
                  <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                    Run a simulated Monte Carlo evaluation checking code quality, documentation depth, and keyword indexes.
                  </p>
                </div>
                <button 
                  onClick={runSimulation} 
                  className="btn btn-primary"
                  disabled={isSimulating}
                >
                  <Cpu size={16} style={{ marginRight: '6px' }} />
                  {isSimulating ? 'Simulating...' : 'Run Simulator'}
                </button>
              </div>

              <div className="simulation-overview-panel" style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '24px', marginBottom: '24px' }}>
                <div className="card text-center" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
                  {renderSubGauge('Match Probability', scores.portfolio !== null ? Math.round((scores.portfolio + (scores.careerReady || 70)) / 2) : null, 'var(--color-tertiary)')}
                  <div style={{ marginTop: '16px' }}>
                    <div style={{ fontSize: '11px', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Candidate Class</div>
                    <div style={{ fontSize: '20px', fontWeight: '800', color: '#ffffff', marginTop: '4px' }}>
                      {scores.portfolio !== null 
                        ? (scores.portfolio > 85 ? 'Premium Level 1' : scores.portfolio > 70 ? 'Mid-Tier Level 2' : 'Entry Level 3')
                        : 'Unevaluated'}
                    </div>
                  </div>
                </div>

                <div className="card" style={{ padding: '24px' }}>
                  <h4 style={{ fontSize: '15px', marginBottom: '12px' }}>Recruiter Feedback Summary</h4>
                  <p style={{ fontSize: '13.5px', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
                    {github || resume ? (
                      `"Candidate profile shows substantial competency. The GitHub language signatures align correctly with the requested job role. The ATS resume scores are adequate but have missing sections. Re-simulate after updating keywords to see margin optimizations."`
                    ) : (
                      `"No active candidate signals available. Link your developer profiles first to generate recruiter screenings."`
                    )}
                  </p>
                  
                  <div className="recruiter-ratings-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '16px' }}>
                    <div style={{ padding: '10px', background: 'rgba(255,255,255,0.01)', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
                      <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Code Breadth</div>
                      <div style={{ fontSize: '14px', fontWeight: '700', color: '#ffffff' }}>{github ? 'EXCELLENT' : 'N/A'}</div>
                    </div>
                    <div style={{ padding: '10px', background: 'rgba(255,255,255,0.01)', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
                      <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>ATS Keyword Alignment</div>
                      <div style={{ fontSize: '14px', fontWeight: '700', color: '#ffffff' }}>{resume ? 'MATCHED' : 'N/A'}</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Terminal Logs View */}
              <div className="terminal-window">
                <div className="terminal-header">
                  <Terminal size={14} />
                  <span>DevScope Simulator Engine Console</span>
                  <div className="terminal-dots">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                </div>
                <div className="terminal-body">
                  {simLogs.map((log, index) => (
                    <div key={index} className="terminal-line">
                      {log}
                    </div>
                  ))}
                  {isSimulating && <div className="terminal-cursor"></div>}
                </div>
              </div>
            </div>
          )}

          {/* TAB 8: Project Ideas */}
          {activeTab === 'projects' && (
            <div className="card">
              <h3 style={{ fontSize: '18px', marginBottom: '8px' }}>Custom Project Recommendations</h3>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '24px' }}>
                These projects are customized to bridge your identified technical skill gaps and provide rich proof-of-work repositories.
              </p>

              <div className="project-cards-grid">
                {getTailoredProjects().map((project, idx) => (
                  <div key={idx} className="card project-idea-card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                      <span className="project-role-tag">{project.role}</span>
                      <span className="project-difficulty-tag" style={{
                        background: project.difficulty === 'Advanced' ? 'rgba(239, 68, 68, 0.08)' : 'rgba(245, 158, 11, 0.08)',
                        color: project.difficulty === 'Advanced' ? '#f87171' : '#fbbd23'
                      }}>{project.difficulty}</span>
                    </div>
                    
                    <h4>{project.title}</h4>
                    <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '8px', lineHeight: '1.5' }}>
                      {project.desc}
                    </p>

                    <div style={{ margin: '16px 0' }}>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '6px' }}>Technologies to Apply</div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                        {project.stack.map((tech, i) => (
                          <span key={i} className="kw-badge kw-found" style={{ fontSize: '10px' }}>{tech}</span>
                        ))}
                      </div>
                    </div>

                    <div style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-color)', borderRadius: '6px', padding: '12px', marginTop: '16px' }}>
                      <div style={{ fontSize: '11px', fontWeight: '700', color: '#ffffff', marginBottom: '4px' }}>Learning Objective:</div>
                      <div style={{ fontSize: '12.5px', color: 'var(--text-secondary)' }}>{project.learning}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 9: Analytics */}
          {activeTab === 'analytics' && (
            <div className="card">
              <h3 style={{ fontSize: '18px', marginBottom: '24px' }}>Advanced Skill & Score Analytics</h3>
              
              <div className="analytics-grid" style={{ display: 'grid', gridTemplateColumns: '1.5fr 1.5fr', gap: '24px' }}>
                <div className="card" style={{ background: 'rgba(255, 255, 255, 0.01)' }}>
                  <h4 style={{ fontSize: '15px', marginBottom: '16px' }}>Technical Competency Index</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12.5px', marginBottom: '6px' }}>
                        <span>Frontend Systems (React, TS, State)</span>
                        <span>{github ? '85%' : 'N/A'}</span>
                      </div>
                      <div className="lang-bar-bg">
                        <div className="lang-bar-fg" style={{ width: github ? '85%' : '0%', background: 'var(--color-primary)' }}></div>
                      </div>
                    </div>
                    
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12.5px', marginBottom: '6px' }}>
                        <span>Backend Systems (APIs, Databases)</span>
                        <span>{resume && resume.foundKeywords?.includes('Node.js') ? '75%' : 'N/A'}</span>
                      </div>
                      <div className="lang-bar-bg">
                        <div className="lang-bar-fg" style={{ width: resume && resume.foundKeywords?.includes('Node.js') ? '75%' : '0%', background: 'var(--color-secondary)' }}></div>
                      </div>
                    </div>

                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12.5px', marginBottom: '6px' }}>
                        <span>Cloud Infrastructure & DevOps</span>
                        <span>{resume && resume.foundKeywords?.includes('Docker') ? '60%' : 'N/A'}</span>
                      </div>
                      <div className="lang-bar-bg">
                        <div className="lang-bar-fg" style={{ width: resume && resume.foundKeywords?.includes('Docker') ? '60%' : '0%', background: 'var(--color-tertiary)' }}></div>
                      </div>
                    </div>

                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12.5px', marginBottom: '6px' }}>
                        <span>Documentation & Standards</span>
                        <span>{github ? `${github.docScore || 100}%` : 'N/A'}</span>
                      </div>
                      <div className="lang-bar-bg">
                        <div className="lang-bar-fg" style={{ width: github ? `${github.docScore || 100}%` : '0%', background: 'var(--color-warning)' }}></div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="card" style={{ background: 'rgba(255, 255, 255, 0.01)' }}>
                  <h4 style={{ fontSize: '15px', marginBottom: '16px' }}>Level-Up Recommendation Impact</h4>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}>
                        <th style={{ padding: '8px', textAlign: 'left' }}>Action Item</th>
                        <th style={{ padding: '8px', textAlign: 'left' }}>Target Channel</th>
                        <th style={{ padding: '8px', textAlign: 'right' }}>Est. Increase</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                        <td style={{ padding: '10px 8px' }}>Remove trailing digits in LinkedIn handle</td>
                        <td style={{ padding: '10px 8px', color: 'var(--color-warning)' }}>LinkedIn</td>
                        <td style={{ padding: '10px 8px', textAlign: 'right', fontWeight: 'bold', color: 'var(--color-tertiary)' }}>+15 pts</td>
                      </tr>
                      <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                        <td style={{ padding: '10px 8px' }}>Integrate Docker/AWS in resume keywords</td>
                        <td style={{ padding: '10px 8px', color: 'var(--color-primary)' }}>ATS Resume</td>
                        <td style={{ padding: '10px 8px', textAlign: 'right', fontWeight: 'bold', color: 'var(--color-tertiary)' }}>+12 pts</td>
                      </tr>
                      <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                        <td style={{ padding: '10px 8px' }}>Write repository bio/descriptions</td>
                        <td style={{ padding: '10px 8px', color: 'var(--color-secondary)' }}>GitHub</td>
                        <td style={{ padding: '10px 8px', textAlign: 'right', fontWeight: 'bold', color: 'var(--color-tertiary)' }}>+8 pts</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 10: Compare */}
          {activeTab === 'compare' && (
            <div className="card animate-fade-in">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
                <div>
                  <h3 style={{ fontSize: '18px' }}>Profile Benchmarking</h3>
                  <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                    Compare your current channel scores against industry templates or previous baselines.
                  </p>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontSize: '12px', fontWeight: '600', textTransform: 'uppercase' }}>Target Benchmark:</span>
                  <select 
                    className="form-input form-select"
                    style={{ width: '260px', padding: '8px 12px', fontSize: '13px' }}
                    value={compareTarget}
                    onChange={(e) => setCompareTarget(e.target.value)}
                  >
                    <option value="google">Google Staff Engineer</option>
                    <option value="stripe">Stripe Senior Developer</option>
                    <option value="startup">Early Stage Startup Dev</option>
                    <option value="previous">Your Baseline (First Scan)</option>
                  </select>
                </div>
              </div>

              <div className="overview-grid" style={{ marginBottom: '24px' }}>
                <div className="card" style={{ background: 'rgba(255, 255, 255, 0.01)' }}>
                  <h4 style={{ fontSize: '15px', marginBottom: '8px' }}>Target Requirements</h4>
                  <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                    {benchmarks[compareTarget].summary}
                  </p>
                </div>
              </div>

              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}>
                      <th style={{ padding: '12px' }}>Metric Channel</th>
                      <th style={{ padding: '12px' }}>Your Score</th>
                      <th style={{ padding: '12px' }}>Benchmark Target</th>
                      <th style={{ padding: '12px' }}>Score Margin</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                      <td style={{ padding: '16px 12px', fontWeight: '600' }}>Overall Portfolio</td>
                      <td style={{ padding: '16px 12px', fontFamily: 'var(--font-mono)' }}>{scores.portfolio !== null ? scores.portfolio : 'N/A'}</td>
                      <td style={{ padding: '16px 12px', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>{benchmarks[compareTarget].scores.portfolio}</td>
                      {renderCompareDiff(scores.portfolio, benchmarks[compareTarget].scores.portfolio)}
                    </tr>
                    <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                      <td style={{ padding: '16px 12px', fontWeight: '600' }}>ATS Resume</td>
                      <td style={{ padding: '16px 12px', fontFamily: 'var(--font-mono)' }}>{scores.ats !== null ? scores.ats : 'N/A'}</td>
                      <td style={{ padding: '16px 12px', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>{benchmarks[compareTarget].scores.ats}</td>
                      {renderCompareDiff(scores.ats, benchmarks[compareTarget].scores.ats)}
                    </tr>
                    <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                      <td style={{ padding: '16px 12px', fontWeight: '600' }}>GitHub Quality</td>
                      <td style={{ padding: '16px 12px', fontFamily: 'var(--font-mono)' }}>{scores.github !== null ? scores.github : 'N/A'}</td>
                      <td style={{ padding: '16px 12px', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>{benchmarks[compareTarget].scores.github}</td>
                      {renderCompareDiff(scores.github, benchmarks[compareTarget].scores.github)}
                    </tr>
                    <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                      <td style={{ padding: '16px 12px', fontWeight: '600' }}>LinkedIn Profile</td>
                      <td style={{ padding: '16px 12px', fontFamily: 'var(--font-mono)' }}>{scores.careerReady !== null ? scores.careerReady : 'N/A'}</td>
                      <td style={{ padding: '16px 12px', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>{benchmarks[compareTarget].scores.careerReady}</td>
                      {renderCompareDiff(scores.careerReady, benchmarks[compareTarget].scores.careerReady)}
                    </tr>
                  </tbody>
                </table>
              </div>

              <div style={{ marginTop: '32px' }}>
                <h4 style={{ fontSize: '14px', marginBottom: '16px' }}>Visual Gap Margins</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {['portfolio', 'ats', 'github', 'careerReady'].map((channel) => {
                    const label = channel === 'careerReady' ? 'LinkedIn' : channel.toUpperCase();
                    const userVal = scores[channel];
                    const targetVal = benchmarks[compareTarget].scores[channel];
                    const hasVal = userVal !== null && userVal !== undefined;
                    const percent = hasVal ? Math.max(0, Math.min(100, Math.round((userVal / targetVal) * 100))) : 0;
                    
                    return (
                      <div key={channel} style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <div style={{ width: '120px', fontWeight: '600', fontSize: '12.5px' }}>{label}</div>
                        <div style={{ flexGrow: 1 }} className="lang-bar-bg">
                          {hasVal ? (
                            <div 
                              className="lang-bar-fg" 
                              style={{ 
                                width: `${percent}%`, 
                                background: percent >= 95 ? 'var(--color-tertiary)' : percent >= 85 ? 'var(--color-primary)' : 'var(--color-secondary)'
                              }}
                            ></div>
                          ) : (
                            <div 
                              className="lang-bar-fg" 
                              style={{ 
                                width: '0%', 
                                background: '#374151'
                              }}
                            ></div>
                          )}
                        </div>
                        <div style={{ width: '80px', textAlign: 'right', fontSize: '12.5px', fontFamily: 'var(--font-mono)', color: hasVal ? '#ffffff' : 'var(--text-muted)' }}>
                          {hasVal ? `${percent}% Match` : 'N/A'}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default Dashboard;
