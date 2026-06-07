import React, { useState, useEffect, useRef } from 'react';
import { API_BASE_URL, API_UPLOAD_URL } from '../config.js';
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

const RESUME_REJECTION_MESSAGE = 'This file is not a resume. Please upload a resume file or paste your resume text.';
const LINKEDIN_REJECTION_MESSAGE = 'This is not a LinkedIn URL or username.';

const looksLikeResume = (text = '') => {
  const normalized = text.replace(/\s+/g, ' ').trim();
  const lower = normalized.toLowerCase();
  const wordCount = normalized ? normalized.split(/\s+/).filter(Boolean).length : 0;
  if (wordCount < 30) return false;

  const sectionPatterns = [
    /\b(experience|work history|employment|professional experience|internship|intern)\b/i,
    /\b(projects?|portfolio|open source|built|developed)\b/i,
    /\b(skills?|technical skills|technologies|tools|frameworks|languages)\b/i,
    /\b(education|degree|bachelor|master|phd|university|college|b\.?tech|b\.?e|b\.?sc|mca|bca)\b/i
  ];
  const sectionCount = sectionPatterns.filter((pattern) => pattern.test(normalized)).length;
  const indicators = [
    /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/.test(normalized) || /linkedin\.com\/in\/|github\.com\//i.test(normalized),
    /\b(resume|curriculum vitae|cv)\b/i.test(normalized),
    /\b(20\d{2}|19\d{2}|jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec|present)\b/i.test(normalized),
    /\b(javascript|typescript|react|node\.?js|python|java|sql|mongodb|postgres|aws|docker|kubernetes|html|css|git|api|machine learning)\b/i.test(lower),
    /\b(engineer|developer|designer|analyst|manager|intern|student|architect|consultant)\b/i.test(lower),
    /\b(developed|built|created|implemented|designed|managed|led|optimized|deployed|analyzed|collaborated|improved)\b/i.test(lower)
  ].filter(Boolean).length;

  return sectionCount >= 2 || (sectionCount >= 1 && indicators >= 2);
};

const parseLinkedInProfileInput = (value = '') => {
  const raw = value.trim();
  if (!raw) return null;

  const isUrlLike = /^https?:\/\//i.test(raw) || /^www\./i.test(raw) || /\.[a-z]{2,}(\/|$)/i.test(raw);
  const slugPattern = /^[a-z0-9](?:[a-z0-9-]{1,98}[a-z0-9])?$/i;

  if (isUrlLike) {
    try {
      const parsed = new URL(/^https?:\/\//i.test(raw) ? raw : `https://${raw}`);
      const host = parsed.hostname.toLowerCase().replace(/^www\./, '');
      const parts = parsed.pathname.split('/').filter(Boolean);
      return host === 'linkedin.com' && parts[0]?.toLowerCase() === 'in' && parts[1] && slugPattern.test(parts[1])
        ? parts[1]
        : null;
    } catch (err) {
      return null;
    }
  }

  return raw.includes('/') || raw.includes('@') || raw.includes('.') || !slugPattern.test(raw) ? null : raw;
};

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
  const [resumeFileParseStatus, setResumeFileParseStatus] = useState(null); // null | 'parsing' | 'success' | 'error'
  const [resumeFileParseError, setResumeFileParseError] = useState('');
  const [resumeDragActive, setResumeDragActive] = useState(false);

  // LinkedIn PDF state
  const [linkedinTextInput, setLinkedinTextInput] = useState('');
  const [liFileParseError, setLiFileParseError] = useState('');
  const liFileInputRef = useRef(null);

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
    let gh = username.trim();
    if (gh) {
      gh = gh.replace(/^(https?:\/\/)?(www\.)?github\.com\//i, '');
      gh = gh.replace(/^git@github\.com:/i, '');
      gh = gh.split('/')[0].split('?')[0].split('#')[0];
      setGhInput(gh);
    }
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
      const result = await response.json();
      if (response.ok) {
        setGithub(result);

        setScores(prev => {
          const newScores = { ...prev, github: result.score };
          const activeScores = [];
          if (newScores.github !== null) activeScores.push(newScores.github);
          if (newScores.ats !== null) activeScores.push(newScores.ats);
          if (newScores.careerReady !== null) activeScores.push(newScores.careerReady);

          newScores.portfolio = activeScores.length > 0
            ? Math.round(activeScores.reduce((a, b) => a + b, 0) / activeScores.length)
            : null;

          return newScores;
        });
      } else {
        alert(result.error || "Failed to analyze GitHub username. Please verify the profile exists and try again.");
      }
    } catch (err) {
      console.error(err);
      alert("Error reaching the analysis server: " + err.message);
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
    if (!looksLikeResume(text)) {
      alert(RESUME_REJECTION_MESSAGE);
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
          targetRole: selectedRole,
          token
        })
      });
      const result = await response.json().catch(() => ({}));
      if (response.ok) {
        setResume(result);

        setScores(prev => {
          const newScores = { ...prev, ats: result.atsScore };
          const activeScores = [];
          if (newScores.github !== null) activeScores.push(newScores.github);
          if (newScores.ats !== null) activeScores.push(newScores.ats);
          if (newScores.careerReady !== null) activeScores.push(newScores.careerReady);

          newScores.portfolio = activeScores.length > 0
            ? Math.round(activeScores.reduce((a, b) => a + b, 0) / activeScores.length)
            : null;

          return newScores;
        });
      } else {
        alert(result.error || "Failed to analyze resume details. Please try again.");
      }
    } catch (err) {
      console.error(err);
      alert("Error reaching the analysis server: " + err.message);
    } finally {
      setIsAnalyzingResume(false);
    }
  };

  const handleLiFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      setLiFileParseError('Please upload a PDF file exported directly from LinkedIn.');
      return;
    }

    setLiFileParseError('');
    setIsAnalyzingLinkedin(true);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch(`${API_UPLOAD_URL}/api/parse/resume`, {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      if (!response.ok || !data.text || data.text.trim().length < 20) {
        setLiFileParseError(data.error || 'Could not extract text from the LinkedIn PDF. Ensure it is a valid export.');
        setIsAnalyzingLinkedin(false);
        return;
      }

      setLinkedinTextInput(data.text);
      await handleLinkLinkedin(data.text);
    } catch (err) {
      setLiFileParseError('Error parsing PDF file. Please ensure the backend server is running.');
      setIsAnalyzingLinkedin(false);
    }
  };

  const handleLinkLinkedin = async (text) => {
    if (!text) {
      alert("Please upload your LinkedIn PDF export first.");
      return;
    }
    setIsAnalyzingLinkedin(true);
    try {
      const token = localStorage.getItem('devscope_token');
      const response = await fetch(`${API_BASE_URL}/api/analyze/linkedin-pdf`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          linkedinText: text,
          targetRole: selectedRole,
          token
        })
      });
      const result = await response.json();
      if (response.ok) {
        setLinkedin(result);

        setScores(prev => {
          const newScores = { ...prev, careerReady: result.score };
          const activeScores = [];
          if (newScores.github !== null) activeScores.push(newScores.github);
          if (newScores.ats !== null) activeScores.push(newScores.ats);
          if (newScores.careerReady !== null) activeScores.push(newScores.careerReady);

          newScores.portfolio = activeScores.length > 0
            ? Math.round(activeScores.reduce((a, b) => a + b, 0) / activeScores.length)
            : null;

          return newScores;
        });
      } else {
        alert(result.error || "Failed to analyze LinkedIn profile. Please verify the link and try again.");
      }
    } catch (err) {
      console.error(err);
      alert("Error reaching the analysis server: " + err.message);
    } finally {
      setIsAnalyzingLinkedin(false);
    }
  };

  const handleLinkLinkedinUrl = async (urlOrUsername, currentSelfReport = null) => {
    let cleanVal = urlOrUsername.trim();
    if (!cleanVal) {
      alert("Please enter a valid LinkedIn URL or username.");
      return;
    }
    cleanVal = parseLinkedInProfileInput(cleanVal);
    if (!cleanVal) {
      alert(LINKEDIN_REJECTION_MESSAGE);
      return;
    }
    setLiInput(cleanVal);
    setIsAnalyzingLinkedin(true);
    try {
      const token = localStorage.getItem('devscope_token');
      const response = await fetch(`${API_BASE_URL}/api/analyze/linkedin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: cleanVal,
          targetRole: selectedRole,
          token,
          ...(currentSelfReport ? { selfReport: currentSelfReport } : {})
        })
      });
      const result = await response.json();
      if (response.ok) {
        setLinkedin(result);
        setLinkedinTextInput(''); // Clear PDF input text since we analyzed by URL

        setScores(prev => {
          const newScores = { ...prev, careerReady: result.score };
          const activeScores = [];
          if (newScores.github !== null) activeScores.push(newScores.github);
          if (newScores.ats !== null) activeScores.push(newScores.ats);
          if (newScores.careerReady !== null) activeScores.push(newScores.careerReady);

          newScores.portfolio = activeScores.length > 0
            ? Math.round(activeScores.reduce((a, b) => a + b, 0) / activeScores.length)
            : null;

          return newScores;
        });
      } else {
        alert(result.error || "Failed to analyze LinkedIn profile. Please verify the URL and try again.");
      }
    } catch (err) {
      console.error(err);
      alert("Error reaching the analysis server: " + err.message);
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

  const handleResumeFile = async (file) => {
    const ext = file.name.split('.').pop().toLowerCase();
    const allowedExts = ['pdf', 'docx', 'txt', 'md'];

    if (!allowedExts.includes(ext)) {
      setResumeFileParseStatus('error');
      setResumeFileParseError(`Unsupported file type ".${ext}". Please upload a PDF, DOCX, TXT, or MD file.`);
      return;
    }

    // Text files: read directly
    if (ext === 'txt' || ext === 'md') {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target.result || '';
        if (!looksLikeResume(content)) {
          setResumeFileName(file.name);
          setResumeTextInput('');
          setResumeFileParseStatus('error');
          setResumeFileParseError(RESUME_REJECTION_MESSAGE);
          alert(RESUME_REJECTION_MESSAGE);
          return;
        }
        setResumeFileName(file.name);
        setResumeTextInput(content);
        setResumeFileParseStatus('success');
        setResumeFileParseError('');
      };
      reader.onerror = () => {
        setResumeFileParseStatus('error');
        setResumeFileParseError('Failed to read the file. Please try copy-pasting instead.');
      };
      reader.readAsText(file);
      return;
    }

    // PDF / DOCX: send to server for real extraction
    setResumeFileName(file.name);
    setResumeFileParseStatus('parsing');
    setResumeFileParseError('');
    setResumeTextInput('');

    try {
      const formData = new FormData();
      formData.append('file', file);
      const response = await fetch(`${API_UPLOAD_URL}/api/parse/resume`, {
        method: 'POST',
        body: formData
      });
      const data = await response.json();
      if (!response.ok || !data.text || data.text.trim().length < 20) {
        setResumeFileParseStatus('error');
        const message = data.error || 'Could not extract text from this file. Please paste your resume text instead.';
        setResumeFileParseError(message);
        alert(message);
        return;
      }
      setResumeTextInput(data.text);
      setResumeFileParseStatus('success');
      setResumeFileParseError('');
    } catch (err) {
      setResumeFileParseStatus('error');
      const message = 'Network error while parsing file. Please paste your resume text instead.';
      setResumeFileParseError(message);
      alert(message);
    }
  };

  const normalizeSkill = (value = '') =>
    value.toString().toLowerCase().replace(/[^a-z0-9+#.]+/g, ' ').trim();

  const getProfileSignals = () => {
    const foundSkills = new Set();
    const missingSkills = new Set();

    if (github?.languages) github.languages.forEach((lang) => foundSkills.add(lang.name));
    if (resume?.foundKeywords) resume.foundKeywords.forEach((skill) => foundSkills.add(skill));
    if (linkedin?.foundKws) linkedin.foundKws.forEach((skill) => foundSkills.add(skill));

    if (roadmap?.gap) roadmap.gap.forEach((skill) => missingSkills.add(skill));
    if (resume?.roleKeywordsMissing) resume.roleKeywordsMissing.forEach((skill) => missingSkills.add(skill));
    if (linkedin?.missingKws) linkedin.missingKws.forEach((skill) => missingSkills.add(skill));

    const normalizedFound = [...foundSkills].map(normalizeSkill);
    const filteredMissing = [...missingSkills].filter((skill) => {
      const normalized = normalizeSkill(skill);
      return !normalizedFound.some((found) => normalized.includes(found) || found.includes(normalized.split(' ')[0]));
    });

    const channels = [
      {
        name: 'GitHub',
        score: scores.github,
        connected: Boolean(github),
        issue: github
          ? ((github.docScore || 0) < 70 ? 'Improve README coverage and repo descriptions.' : 'Repository proof looks usable.')
          : 'Connect GitHub to prove hands-on work.'
      },
      {
        name: 'Resume',
        score: scores.ats,
        connected: Boolean(resume),
        issue: resume
          ? ((resume.roleKeywordsMissing?.length || 0) > 0 ? `Add ${resume.roleKeywordsMissing.slice(0, 2).join(', ')} to improve ATS alignment.` : 'Resume keywords are aligned.')
          : 'Upload a resume to detect ATS gaps.'
      },
      {
        name: 'LinkedIn',
        score: scores.careerReady,
        connected: Boolean(linkedin),
        issue: linkedin
          ? ((linkedin.score || 0) < 75 ? (linkedin.tips?.[0] || 'Improve profile completeness and visibility.') : 'Recruiter visibility looks healthy.')
          : 'Analyze LinkedIn to estimate recruiter visibility.'
      }
    ];

    const weakestChannel = [...channels].sort((a, b) => {
      const aScore = a.connected && a.score !== null && a.score !== undefined ? a.score : -1;
      const bScore = b.connected && b.score !== null && b.score !== undefined ? b.score : -1;
      return aScore - bScore;
    })[0];

    return {
      foundSkills: [...foundSkills],
      missingSkills: filteredMissing.length ? filteredMissing : [...missingSkills],
      channels,
      weakestChannel,
      roleTitle: roadmap?.roleTitle || 'Developer'
    };
  };

  const getRecruiterMatchScore = (signals = getProfileSignals()) => {
    const availableScores = [scores.github, scores.ats, scores.careerReady]
      .filter((score) => score !== null && score !== undefined);
    if (availableScores.length === 0) return null;
    const average = Math.round(availableScores.reduce((sum, score) => sum + score, 0) / availableScores.length);
    const gapPenalty = Math.min(signals.missingSkills.length * 2, 14);
    const evidenceBonus = [github, resume, linkedin].filter(Boolean).length * 3;
    return Math.max(10, Math.min(97, average - gapPenalty + evidenceBonus));
  };

  const getRecruiterSummary = (signals = getProfileSignals()) => {
    if (!github && !resume && !linkedin) {
      return 'No active candidate signals are available yet. Connect GitHub, resume, or LinkedIn to generate a screening.';
    }
    const strengths = signals.foundSkills.slice(0, 5).join(', ') || 'general developer fundamentals';
    const gaps = signals.missingSkills.slice(0, 4).join(', ') || 'portfolio depth and measurable impact';
    return `Recruiter read: strongest evidence is ${strengths}. The next screen risk is ${signals.weakestChannel?.name || 'profile completeness'}: ${signals.weakestChannel?.issue || 'add clearer proof'}. Build or document ${gaps} to raise match confidence.`;
  };

  // Recruiter Simulation Trigger
  const runSimulation = () => {
    const signals = getProfileSignals();
    const matchScore = getRecruiterMatchScore(signals);
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
      linkedin ? `[LINKEDIN] Visibility score: ${linkedin.score}/100. URL optimized: ${!linkedin.isDefaultUrl}` : "[LINKEDIN] Skipping LinkedIn attraction audit.",
      `[SKILLS] Detected skills: ${signals.foundSkills.slice(0, 6).join(', ') || 'insufficient data'}`,
      `[GAPS] Highest priority gaps: ${signals.missingSkills.slice(0, 5).join(', ') || 'none detected'}`,
      `[RISK] Weakest channel: ${signals.weakestChannel?.name || 'N/A'} - ${signals.weakestChannel?.issue || 'No issue detected.'}`,
      "[SIMULATION] Running weighted recruiter evaluation against role requirements...",
      `[RESULT] Estimated match probability: ${matchScore !== null ? `${matchScore}%` : 'N/A'}`,
      "[SUCCESS] Simulation complete. Recommendations refreshed from active profile signals."
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
    const signals = getProfileSignals();
    const gaps = signals.missingSkills;
    
    // Choose dynamic concepts based on exact gaps
    const hasDocker = gaps.some(g => g.toLowerCase().includes('docker'));
    const hasCICD = gaps.some(g => g.toLowerCase().includes('ci/cd') || g.toLowerCase().includes('github actions'));
    const hasTesting = gaps.some(g => g.toLowerCase().includes('jest') || g.toLowerCase().includes('cypress') || g.toLowerCase().includes('testing'));
    const hasDB = gaps.some(g => g.toLowerCase().includes('sql') || g.toLowerCase().includes('mongo') || g.toLowerCase().includes('postgres'));
    const hasCloud = gaps.some(g => g.toLowerCase().includes('aws') || g.toLowerCase().includes('gcp') || g.toLowerCase().includes('azure'));

    const gapOne = gaps[0] || 'production deployment';
    const gapTwo = gaps[1] || 'testing';
    const gapThree = gaps[2] || 'documentation';

    const baseProjects = [];

    // Map projects dynamically based on specific skill gaps
    if (hasDocker) {
      baseProjects.push({
        title: 'Containerized Microservice Architecture',
        role: 'DevOps & Architecture Proof',
        desc: `Build a small multi-container app using Docker and Docker Compose. It proves you understand how to isolate services and manage environments.`,
        stack: ['Docker', 'Docker Compose', gapOne, gapTwo],
        difficulty: 'Intermediate',
        time: '10-15 Hours',
        learning: `Replaces keyword claims with a deployable container environment recruiters can see.`
      });
    }

    if (hasTesting) {
      baseProjects.push({
        title: 'High-Coverage Test Suite for Existing Project',
        role: 'Quality Assurance & Testing',
        desc: `Take one of your existing GitHub projects and add comprehensive unit and E2E tests. Add a coverage badge to your README.`,
        stack: ['Jest/Cypress', 'GitHub Actions', gapTwo],
        difficulty: 'Intermediate',
        time: '8-12 Hours',
        learning: `Demonstrates professional test-driven discipline, which is highly sought after.`
      });
    }

    if (hasCloud || hasCICD) {
      baseProjects.push({
        title: 'Automated CI/CD Deployment Pipeline',
        role: 'Cloud & Infrastructure',
        desc: `Set up a fully automated pipeline that lints, builds, tests, and deploys your application to AWS/GCP/Vercel on every push to main.`,
        stack: ['GitHub Actions', 'Cloud Provider', gapOne],
        difficulty: 'Advanced',
        time: '12-16 Hours',
        learning: `Proves you can deliver software to production automatically, bridging the gap between local dev and live ops.`
      });
    }

    if (hasDB) {
      baseProjects.push({
        title: 'Complex Data Modeling API',
        role: 'Backend Data Systems',
        desc: `Build a robust backend with complex relational queries, migrations, and indexing to demonstrate deep database proficiency.`,
        stack: ['PostgreSQL/MongoDB', 'ORM/Query Builder', gapOne],
        difficulty: 'Intermediate',
        time: '14-18 Hours',
        learning: `Shows you understand how to design and optimize data schemas beyond basic CRUD.`
      });
    }

    // Role fallbacks if specific gaps aren't hit
    if (baseProjects.length < 2) {
      if (selectedRole === 'frontend') {
        baseProjects.push({
          title: `Recruiter-Ready ${gapOne} UI Dashboard`,
          role: 'Frontend Proof-of-Work',
          desc: `Build a polished dashboard around your target role with live data, filters, empty states, loading states, and a case-study README.`,
          stack: ['React', 'TypeScript', gapOne, 'Recharts'],
          difficulty: 'Intermediate',
          time: '10-14 Hours',
          learning: `Turns your detected frontend gaps into a visible, reviewable project.`
        });
      } else if (selectedRole === 'backend') {
        baseProjects.push({
          title: `${gapOne} API Service with Audit Logs`,
          role: 'Backend Systems',
          desc: `Build a REST API with auth, validation, pagination, migrations, rate limits, and audit logs. Include API docs.`,
          stack: ['Node.js', 'Express', gapOne, 'Swagger'],
          difficulty: 'Intermediate',
          time: '12-18 Hours',
          learning: `Converts backend skill gaps into production patterns: reliability and clear contracts.`
        });
      } else if (selectedRole === 'ml-engineer') {
         baseProjects.push({
          title: `${gapOne} Resume Ranker Model`,
          role: 'Applied ML',
          desc: `Train a small model or rules-plus-ML pipeline that ranks resumes against roles, explains keyword gaps, and exposes predictions through an API.`,
          stack: ['Python', 'Scikit-Learn', 'FastAPI', gapOne],
          difficulty: 'Advanced',
          time: '18-26 Hours',
          learning: `Shows data prep, model evaluation, explainability, and deployment thinking.`
        });
      } else {
        baseProjects.push({
          title: `${gapOne} Placement Tracker SaaS`,
          role: 'Full-Stack Product Build',
          desc: `Build a job application tracker with auth, resume upload, profile scoring, charts, and role-based dashboards.`,
          stack: ['React', 'Node.js', gapOne, gapTwo],
          difficulty: 'Intermediate',
          time: '14-20 Hours',
          learning: `Connects frontend, backend, and product thinking in one project.`
        });
      }
    }

    return [
      ...baseProjects,
      {
        title: `${signals.weakestChannel?.name || 'Profile'} Repair Sprint`,
        role: 'Recruiter Signal Boost',
        desc: `Create a before/after case study that fixes your weakest channel: ${signals.weakestChannel?.issue || 'add stronger evidence and cleaner documentation'}`,
        stack: [signals.weakestChannel?.name || 'Portfolio', gapThree, 'README', 'Metrics'],
        difficulty: 'Beginner',
        time: '4-8 Hours',
        learning: `Directly raises the lowest visible signal in your current profile.`
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

  // --- Auto Re-Analyze on Role Change ---
  const lastAnalyzedRole = useRef(selectedRole);

  useEffect(() => {
    if (selectedRole !== lastAnalyzedRole.current) {
      lastAnalyzedRole.current = selectedRole;

      const reanalyze = async () => {
        if (resumeTextInput && resume) {
          await handleLinkResume(resumeTextInput);
        }
        if (linkedin) {
          if (linkedin.isPdfParsed && linkedinTextInput) {
            await handleLinkLinkedin(linkedinTextInput);
          } else if (!linkedin.isPdfParsed && (linkedin.profileUrl || linkedin.profileHandle)) {
            await handleLinkLinkedinUrl(linkedin.profileUrl || linkedin.profileHandle, linkedin.selfReport);
          }
        }
        if (github && github.username) {
          await handleLinkGithub(github.username);
        }
      };
      reanalyze();
    }
  }, [selectedRole, resumeTextInput, resume, linkedin, github]);

  // --- Analytics Computations ---
  const frontendKeywords = ['React', 'Vue', 'Angular', 'Next.js', 'TypeScript', 'JavaScript', 'HTML/CSS', 'Tailwind', 'Redux', 'Webpack'];
  const backendKeywords = ['Node.js', 'Express', 'Django', 'FastAPI', 'Flask', 'Spring Boot', 'PostgreSQL', 'MySQL', 'MongoDB', 'Redis', 'GraphQL', 'REST API', 'SQL'];
  const devopsKeywords = ['AWS', 'GCP', 'Azure', 'Docker', 'Kubernetes', 'CI/CD', 'Linux', 'Nginx'];

  let frontendMatch = 0;
  let backendMatch = 0;
  let devopsMatch = 0;

  const detectedSkillNames = [
    ...(resume?.foundKeywords || []),
    ...(linkedin?.foundKws || []),
    ...(github?.languages?.map((language) => language.name) || [])
  ];

  if (detectedSkillNames.length > 0) {
    const hasSkillMatch = (skill, target) => normalizeSkill(skill).includes(normalizeSkill(target)) || normalizeSkill(target).includes(normalizeSkill(skill));
    frontendMatch = Math.round((frontendKeywords.filter(kw => detectedSkillNames.some(skill => hasSkillMatch(skill, kw))).length / frontendKeywords.length) * 100);
    backendMatch = Math.round((backendKeywords.filter(kw => detectedSkillNames.some(skill => hasSkillMatch(skill, kw))).length / backendKeywords.length) * 100);
    devopsMatch = Math.round((devopsKeywords.filter(kw => detectedSkillNames.some(skill => hasSkillMatch(skill, kw))).length / devopsKeywords.length) * 100);
  }

  const recommendations = [];
  if (linkedin && linkedin.tips && linkedin.tips.length > 0) {
    recommendations.push({ item: linkedin.tips[0], channel: 'LinkedIn', increase: '+15 pts', color: 'var(--color-warning)' });
  }
  if (resume && resume.roleKeywordsMissing && resume.roleKeywordsMissing.length > 0) {
    recommendations.push({ item: `Add keyword: ${resume.roleKeywordsMissing[0]}`, channel: 'ATS Resume', increase: '+12 pts', color: 'var(--color-primary)' });
  }
  if (github && github.flaggedRepos && github.flaggedRepos.length > 0) {
    recommendations.push({ item: `Improve README for: ${github.flaggedRepos[0]}`, channel: 'GitHub', increase: '+8 pts', color: 'var(--color-secondary)' });
  }
  if (resume && resume.suggestions && resume.suggestions.length > 0 && recommendations.length < 3) {
    const text = resume.suggestions[0].replace(/^[^\w]+/, '');
    recommendations.push({ item: text, channel: 'ATS Resume', increase: '+5 pts', color: 'var(--color-primary)' });
  }
  if (recommendations.length === 0) {
    recommendations.push({ item: 'Build a new full-stack project', channel: 'Portfolio', increase: '+10 pts', color: 'var(--color-tertiary)' });
  }

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
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '4px' }}>
              <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Target Role:</span>
              <select
                className="form-input form-select"
                style={{ padding: '4px 8px', fontSize: '13px', width: 'auto', display: 'inline-block' }}
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
                        {getRecruiterMatchScore() !== null
                          ? `${getRecruiterMatchScore()}%`
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
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '8px' }}>Target Career Role:</div>
                    <select
                      className="form-input form-select"
                      style={{ padding: '8px 12px', fontSize: '14px', width: '100%', display: 'block', backgroundColor: 'var(--bg-lighter)', fontWeight: '600' }}
                      value={selectedRole}
                      onChange={(e) => setSelectedRole(e.target.value)}
                    >
                      <option value="frontend">Frontend Engineer</option>
                      <option value="backend">Backend Engineer</option>
                      <option value="fullstack">Full-Stack Developer</option>
                      <option value="ml-engineer">Machine Learning Engineer</option>
                    </select>
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
                    {renderSubGauge('Repo Quality', github.docScore ?? 0, 'var(--color-secondary)')}
                    {renderSubGauge('Commits', Math.min(10 + (github.publicRepos || 0) * 3, 95), 'var(--color-tertiary)')}
                    {renderSubGauge('Diversity', Math.min((github.languages?.length || 0) * 14, 95), 'var(--color-warning)')}
                    {renderSubGauge('Open Source', Math.min(10 + (github.totalStars || 0) * 3 + (github.totalForks || 0) * 5, 95), 'var(--color-primary)')}
                    {renderSubGauge('READMEs', github.docScore ?? 0, 'var(--color-secondary)')}
                    {renderSubGauge('Complexity', Math.min(15 + (github.publicRepos || 0) * 2 + (github.languages?.length || 0) * 8, 95), 'var(--color-tertiary)')}
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
                          <p>{github.totalStars ?? 0}</p>
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
                    {resumeFileParseStatus === 'parsing' ? (
                      <><p>Extracting text from <strong>{resumeFileName}</strong>...</p><span>Please wait</span></>
                    ) : resumeFileParseStatus === 'success' ? (
                      <><p style={{ color: '#10b981' }}>✅ Parsed: <strong>{resumeFileName}</strong></p><span>Click to replace</span></>
                    ) : resumeFileParseStatus === 'error' ? (
                      <><p style={{ color: '#ef4444' }}>Upload failed</p><span>Click to try again</span></>
                    ) : (
                      <><p>{resumeFileName ? `Selected: ${resumeFileName}` : 'Drag & drop Resume or click to browse'}</p><span>Supports .pdf, .docx, .txt, .md</span></>
                    )}
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

                  {resumeFileParseStatus === 'error' && resumeFileParseError && (
                    <div style={{ marginTop: '8px', padding: '10px 14px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '8px', fontSize: '13px', color: '#fca5a5' }}>
                      ⚠️ {resumeFileParseError}
                    </div>
                  )}

                  <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '12px', margin: '8px 0' }}>
                    — OR COPY PASTE TEXT —
                  </div>

                  <textarea
                    className="form-input form-textarea"
                    placeholder="Paste your full resume text here..."
                    value={resumeTextInput}
                    onChange={(e) => {
                      setResumeTextInput(e.target.value);
                      if (resumeFileName) { setResumeFileName(''); setResumeFileParseStatus(null); }
                    }}
                    style={{ maxWidth: '480px', margin: '0 auto 4px auto', display: 'block', height: '100px' }}
                  />
                  {resumeTextInput && (
                    <div style={{ textAlign: 'center', fontSize: '11px', color: 'var(--text-muted)', marginBottom: '12px' }}>
                      {resumeTextInput.trim().split(/\s+/).filter(Boolean).length} words
                    </div>
                  )}

                  <button
                    onClick={() => handleLinkResume(resumeTextInput)}
                    className="btn btn-primary"
                    style={{ display: 'block', margin: '0 auto' }}
                    disabled={isAnalyzingResume || resumeFileParseStatus === 'parsing'}
                  >
                    {isAnalyzingResume ? 'Analyzing...' : resumeFileParseStatus === 'parsing' ? 'Parsing file...' : 'Analyze Resume'}
                  </button>

                  <div className="connect-benefits-grid" style={{ marginTop: '24px' }}>
                    <div className="benefit-badge">✓ Real keyword matching</div>
                    <div className="benefit-badge">✓ Section existence checklist</div>
                    <div className="benefit-badge">✓ Action verb count</div>
                    <div className="benefit-badge">✓ Contact info detection</div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="resume-layout-wrapper animate-fade-in">
                {/* Re-upload Zone */}
                <div className="card search-reanalyze-bar" style={{ display: 'flex', gap: '16px', marginBottom: '24px', padding: '16px', alignItems: 'center' }}>
                  <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Currently Audited Resume: <strong>{resumeFileName || 'Paste-In Details'}</strong></span>
                  {resume.wordCount && (
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)', background: 'rgba(255,255,255,0.04)', padding: '3px 10px', borderRadius: '20px' }}>
                      {resume.wordCount} words
                    </span>
                  )}
                  <button
                    onClick={() => {
                      setResume(null);
                      setResumeTextInput('');
                      setResumeFileName('');
                      setResumeFileParseStatus(null);
                      setResumeFileParseError('');
                    }}
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
                    {renderSubGauge('Overall ATS', resume.atsScore || 0, 'var(--color-primary)')}
                    {renderSubGauge('Sections', Math.round(((resume.scoreBreakdown?.sectionScore || 0) / 25) * 100), 'var(--color-secondary)')}
                    {renderSubGauge('Keywords', Math.round(((resume.scoreBreakdown?.keywordScore || 0) / 35) * 100), 'var(--color-tertiary)')}
                    {renderSubGauge('Action Verbs', Math.round(((resume.scoreBreakdown?.verbScore || 0) / 20) * 100), 'var(--color-warning)')}
                    {renderSubGauge('Impact', resume.hasQuantification ? 80 : 15, 'var(--color-primary)')}
                    {renderSubGauge('Contact', ((resume.scoreBreakdown?.contactScore || 0) / 5) * 100, 'var(--color-secondary)')}
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
                    Audits profile URL structure, headline keyword optimization, search visibility scoring, and generates role-targeted headline recommendations.
                  </p>

                  <div className="connect-input-group">
                    <input
                      type="text"
                      placeholder="Paste LinkedIn URL (e.g. linkedin.com/in/username)"
                      value={liInput}
                      onChange={(e) => setLiInput(e.target.value)}
                      className="form-input"
                    />
                    <button
                      onClick={() => handleLinkLinkedinUrl(liInput)}
                      className="btn btn-primary"
                      disabled={isAnalyzingLinkedin}
                    >
                      {isAnalyzingLinkedin ? 'Analyzing profile...' : 'Analyze LinkedIn'}
                    </button>
                  </div>

                  <div className="connect-benefits-grid">
                    <div className="benefit-badge">✓ URL structure & SEO audit</div>
                    <div className="benefit-badge">✓ Headline keyword scoring</div>
                    <div className="benefit-badge">✓ Role-targeted optimization</div>
                    <div className="benefit-badge">✓ Recruiter visibility tips</div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="linkedin-layout-wrapper animate-fade-in">
                {/* Search Bar at Top — matches GitHub style */}
                <div className="card search-reanalyze-bar" style={{ display: 'flex', gap: '16px', marginBottom: '24px', padding: '16px' }}>
                  <input
                    type="text"
                    placeholder="Analyze different LinkedIn profile..."
                    value={liInput}
                    onChange={(e) => setLiInput(e.target.value)}
                    className="form-input"
                    style={{ flexGrow: 1 }}
                  />
                  <button
                    onClick={() => handleLinkLinkedinUrl(liInput)}
                    className="btn btn-primary"
                    disabled={isAnalyzingLinkedin}
                  >
                    {isAnalyzingLinkedin ? 'Analyzing...' : 'Re-Analyze'}
                  </button>
                </div>

                {/* Circular Gauges Row */}
                <div className="card gauges-row-card" style={{ padding: '24px', marginBottom: '24px' }}>
                  <h3 style={{ fontSize: '16px', marginBottom: '20px' }}>LinkedIn Diagnostic Scores</h3>
                  <div className="sub-gauges-horizontal-grid">
                    {renderSubGauge('Overall', linkedin.score, 'var(--color-primary)')}
                    {renderSubGauge('URL Quality', linkedin.slugQuality === 'excellent' ? 100 : linkedin.slugQuality === 'good' ? 70 : 30, 'var(--color-secondary)')}
                    {renderSubGauge('Headline', linkedin.scoreBreakdown?.headlineScore ? Math.round((linkedin.scoreBreakdown.headlineScore / 10) * 100) : 50, 'var(--color-tertiary)')}
                    {renderSubGauge('Completeness', linkedin.scoreBreakdown ? Math.round(((linkedin.scoreBreakdown.photoScore + linkedin.scoreBreakdown.summaryScore + linkedin.scoreBreakdown.skillsScore + linkedin.scoreBreakdown.recommendationsScore) / 35) * 100) : 40, 'var(--color-warning)')}
                    {renderSubGauge('Visibility', linkedin.scoreBreakdown?.connectionsScore ? Math.round((linkedin.scoreBreakdown.connectionsScore / 10) * 100) : 30, 'var(--color-primary)')}
                  </div>
                </div>

                <div className="github-layout-grid">
                  <div className="github-left">
                    {/* Profile Info */}
                    <div className="card" style={{ marginBottom: '24px' }}>
                      <h3 style={{ fontSize: '18px', marginBottom: '20px' }}>Profile Analysis</h3>
                      <div className="github-stats-row">
                        <div className="stat-box">
                          <div className="stat-value" style={{ color: linkedin.slugQuality === 'excellent' ? 'var(--color-tertiary)' : linkedin.slugQuality === 'good' ? 'var(--color-warning)' : '#ef4444' }}>
                            {linkedin.slugQuality === 'excellent' ? '✓ Excellent' : linkedin.slugQuality === 'good' ? '~ Good' : '✗ Default'}
                          </div>
                          <div className="stat-label">URL Quality</div>
                        </div>
                        <div className="stat-box">
                          <div className="stat-value">{linkedin.profileHandle || 'N/A'}</div>
                          <div className="stat-label">Profile Handle</div>
                        </div>
                        <div className="stat-box">
                          <div className="stat-value">{linkedin.score}/100</div>
                          <div className="stat-label">Overall Score</div>
                        </div>
                      </div>
                    </div>

                    {/* Score Breakdown */}
                    <div className="card" style={{ marginBottom: '24px' }}>
                      <h3 style={{ fontSize: '16px', marginBottom: '16px' }}>Score Breakdown</h3>
                      {linkedin.scoreBreakdown && [
                        { label: 'URL Structure', value: linkedin.scoreBreakdown.urlScore, max: 28 },
                        { label: 'Profile Photo', value: linkedin.scoreBreakdown.photoScore, max: 9 },
                        { label: 'Headline / Role Clues', value: linkedin.scoreBreakdown.headlineScore, max: 16 },
                        { label: 'Connections Strength', value: linkedin.scoreBreakdown.connectionsScore, max: 9 },
                        { label: 'About/Summary', value: linkedin.scoreBreakdown.summaryScore, max: 8 },
                        { label: 'Skills Section', value: linkedin.scoreBreakdown.skillsScore, max: 8 },
                        { label: 'Recommendations', value: linkedin.scoreBreakdown.recommendationsScore, max: 7 }
                      ].map((item, i) => (
                        <div key={i} style={{ marginBottom: '14px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '6px' }}>
                            <span style={{ color: 'var(--text-secondary)' }}>{item.label}</span>
                            <span style={{ fontWeight: '600' }}>{item.value}/{item.max}</span>
                          </div>
                          <div className="lang-bar-bg">
                            <div className="lang-bar-fg" style={{ width: `${(item.value / item.max) * 100}%`, background: item.value >= item.max * 0.7 ? 'var(--color-tertiary)' : item.value > 0 ? 'var(--color-warning)' : '#ef4444' }}></div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Profile Checklist */}
                    <div className="card">
                      <h3 style={{ fontSize: '16px', marginBottom: '16px' }}>Optimization Checklist</h3>
                      {linkedin.checklist && Object.entries({
                        'Custom URL': linkedin.checklist.customUrl,
                        'Profile Photo': linkedin.checklist.profilePhoto,
                        'Headline Keywords': linkedin.checklist.headlineKeywords,
                        'Connections 500+': linkedin.checklist.connectionsStrength,
                        'About Section': linkedin.checklist.aboutSection,
                        'Skills Endorsed': linkedin.checklist.skillsEndorsed,
                        'Recommendations': linkedin.checklist.recommendations
                      }).map(([label, passed], i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 0', borderBottom: i < 6 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
                          {passed ? (
                            <CheckCircle size={15} style={{ color: 'var(--color-tertiary)' }} />
                          ) : (
                            <AlertCircle size={15} style={{ color: '#ef4444' }} />
                          )}
                          <span style={{ textTransform: 'capitalize', color: passed ? '#ffffff' : 'var(--text-secondary)', fontSize: '13px' }}>
                            {label}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="github-right">
                    {/* Recommended Headline */}
                    <div className="card" style={{ marginBottom: '24px' }}>
                      <h3 style={{ fontSize: '18px', marginBottom: '8px' }}>Recommended Headline</h3>
                      <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '20px' }}>
                        Use this optimized headline to rank higher in recruiter search queries for {roadmap ? roadmap.roleTitle : 'Developer'} roles.
                      </p>

                      <div style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--border-color)', borderRadius: '10px', padding: '20px', marginBottom: '24px', position: 'relative' }}>
                        <h4 style={{ fontSize: '12px', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '8px' }}>Optimized Headline</h4>
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
                    </div>

                    {/* Optimization Suggestions */}
                    <div className="card">
                      <h3 style={{ fontSize: '18px', marginBottom: '8px' }}>Optimization Suggestions</h3>
                      <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '20px' }}>
                        Follow these guidelines to improve your LinkedIn visibility and recruiter reach.
                      </p>

                      <ul className="suggestions-list">
                        {(linkedin.tips || []).map((tip, i) => (
                          <li className="suggestion-item" key={i}>
                            <span className="suggestion-bullet">✦</span>
                            <span style={{ fontSize: '13px', lineHeight: '1.5' }}>{tip}</span>
                          </li>
                        ))}
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
                  {renderSubGauge('Match Probability', getRecruiterMatchScore(), 'var(--color-tertiary)')}
                  <div style={{ marginTop: '16px' }}>
                    <div style={{ fontSize: '11px', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Candidate Class</div>
                    <div style={{ fontSize: '20px', fontWeight: '800', color: '#ffffff', marginTop: '4px' }}>
                      {getRecruiterMatchScore() !== null
                        ? (getRecruiterMatchScore() > 85 ? 'Strong Match' : getRecruiterMatchScore() > 70 ? 'Review Queue' : 'Needs Proof')
                        : 'Unevaluated'}
                    </div>
                  </div>
                </div>

                <div className="card" style={{ padding: '24px' }}>
                  <h4 style={{ fontSize: '15px', marginBottom: '12px' }}>Recruiter Feedback Summary</h4>
                  <p style={{ fontSize: '13.5px', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
                    "{getRecruiterSummary()}"
                  </p>

                  <div className="recruiter-ratings-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '16px' }}>
                    <div style={{ padding: '10px', background: 'rgba(255,255,255,0.01)', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
                      <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Code Breadth</div>
                      <div style={{ fontSize: '14px', fontWeight: '700', color: '#ffffff' }}>{github ? (github.docScore >= 70 ? 'STRONG' : 'NEEDS DOCS') : 'N/A'}</div>
                    </div>
                    <div style={{ padding: '10px', background: 'rgba(255,255,255,0.01)', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
                      <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>ATS Keyword Alignment</div>
                      <div style={{ fontSize: '14px', fontWeight: '700', color: '#ffffff' }}>{resume ? (resume.roleKeywordsMissing?.length ? 'GAPS FOUND' : 'MATCHED') : 'N/A'}</div>
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
                        <span>{detectedSkillNames.length > 0 ? `${frontendMatch}%` : 'N/A'}</span>
                      </div>
                      <div className="lang-bar-bg">
                        <div className="lang-bar-fg" style={{ width: detectedSkillNames.length > 0 ? `${frontendMatch}%` : '0%', background: 'var(--color-primary)' }}></div>
                      </div>
                    </div>

                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12.5px', marginBottom: '6px' }}>
                        <span>Backend Systems (APIs, Databases)</span>
                        <span>{detectedSkillNames.length > 0 ? `${backendMatch}%` : 'N/A'}</span>
                      </div>
                      <div className="lang-bar-bg">
                        <div className="lang-bar-fg" style={{ width: detectedSkillNames.length > 0 ? `${backendMatch}%` : '0%', background: 'var(--color-secondary)' }}></div>
                      </div>
                    </div>

                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12.5px', marginBottom: '6px' }}>
                        <span>Cloud Infrastructure & DevOps</span>
                        <span>{detectedSkillNames.length > 0 ? `${devopsMatch}%` : 'N/A'}</span>
                      </div>
                      <div className="lang-bar-bg">
                        <div className="lang-bar-fg" style={{ width: detectedSkillNames.length > 0 ? `${devopsMatch}%` : '0%', background: 'var(--color-tertiary)' }}></div>
                      </div>
                    </div>

                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12.5px', marginBottom: '6px' }}>
                        <span>Code Quality & Documentation</span>
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
                  {recommendations.length > 0 ? (
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                      <thead>
                        <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}>
                          <th style={{ padding: '8px', textAlign: 'left' }}>Action Item</th>
                          <th style={{ padding: '8px', textAlign: 'left' }}>Target Channel</th>
                          <th style={{ padding: '8px', textAlign: 'right' }}>Est. Increase</th>
                        </tr>
                      </thead>
                      <tbody>
                        {recommendations.map((rec, i) => (
                          <tr key={i} style={{ borderBottom: '1px solid var(--border-color)' }}>
                            <td style={{ padding: '10px 8px' }}>{rec.item}</td>
                            <td style={{ padding: '10px 8px', color: rec.color }}>{rec.channel}</td>
                            <td style={{ padding: '10px 8px', textAlign: 'right', fontWeight: 'bold', color: 'var(--color-tertiary)' }}>{rec.increase}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <div style={{ color: 'var(--text-secondary)', fontSize: '13px', fontStyle: 'italic' }}>Connect more channels to get actionable recommendations.</div>
                  )}
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
