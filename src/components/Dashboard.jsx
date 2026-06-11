import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { flushSync } from 'react-dom';
import { API_BASE_URL, API_UPLOAD_URL } from '../config.js';
import Sidebar from './Sidebar';

import DashboardLayout from './DashboardLayout.jsx';
import RoleMatchReport from './RoleMatchReport.jsx';
import LinkedInReport from './LinkedInReport.jsx';
import GithubReport from './GithubReport.jsx';
import ResumeReport from './ResumeReport.jsx';
import ProjectGapReport from './ProjectGapReport.jsx';
import CandidateReport from './CandidateReport.jsx';
import IntelligenceFlowIndicator from './IntelligenceFlowIndicator.jsx';
import ProcessingState from './ProcessingState.jsx';

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
    /\b(experience|work history|employment|professional experience|work experience|career history)\b/i,
    /\b(projects?|personal projects?|academic projects?)\b/i,
    /\b(skills?|technical skills|core competencies|technical proficiency|tech stack)\b/i,
    /\b(education|academic background|qualifications|bachelor|master|phd|university|college|b\.?tech|b\.?e|b\.?sc|mca|bca)\b/i
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

function Dashboard({ profileData = {}, scores: initialScores = { github: null, resume: null, linkedin: null }, githubAnalysis = null, resumeAnalysis = null, linkedinAnalysis = null, onHome = () => { }, user = null, setIsAuthenticated }) {
  const navigate = useNavigate();
  const location = useLocation();

  const getTabFromPath = () => {
    const path = location.pathname;
    if (path.includes('/github')) return 'github';
    if (path.includes('/resume')) return 'resume';
    if (path.includes('/linkedin')) return 'linkedin';
    if (path.includes('/job-match')) return 'recruiter';
    if (path.includes('/project-gap')) return 'projects';
    if (path.includes('/report')) return 'analytics';
    if (path.includes('/settings')) return 'settings';
    return 'overview';
  };
  const activeTab = getTabFromPath();

  const [scores, setScores] = useState(initialScores);
  const [github, setGithub] = useState(githubAnalysis);
  const [resume, setResume] = useState(resumeAnalysis);
  const [linkedin, setLinkedin] = useState(linkedinAnalysis);
  const [selectedRole, setSelectedRole] = useState(profileData.targetRole || 'frontend');
  const [roadmap, setRoadmap] = useState(null);
  const [aiStatus, setAiStatus] = useState(null);

  // Local Search Inputs for Unlinked channels
  const [ghInput, setGhInput] = useState('');
  const [liInput, setLiInput] = useState('');
  const [resumeTextInput, setResumeTextInput] = useState('');

  const [jobMatch, setJobMatch] = useState(null);
  const [isAnalyzingJobMatch, setIsAnalyzingJobMatch] = useState(false);
  const [jobDescription, setJobDescription] = useState('');
  const [projectGap, setProjectGap] = useState(null);
  const [isAnalyzingProjectGap, setIsAnalyzingProjectGap] = useState(false);
  const [candidateReport, setCandidateReport] = useState(null);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);

  const [resumeFileName, setResumeFileName] = useState('');
  const [resumeFileParseStatus, setResumeFileParseStatus] = useState(null); // null | 'parsing' | 'success' | 'error'
  const [resumeFileParseError, setResumeFileParseError] = useState('');
  const [resumeDragActive, setResumeDragActive] = useState(false);

  // LinkedIn PDF state
  const [linkedinTextInput, setLinkedinTextInput] = useState('');
  const [liFileParseError, setLiFileParseError] = useState('');
  const liFileInputRef = useRef(null);

  // LinkedIn self-report state (interactive checklist for Resume Worded-style scoring)
  const [liSelfReport, setLiSelfReport] = useState({
    hasProfilePhoto: false,
    has500Connections: false,
    hasHeadlineKeywords: false,
    hasSummary: false,
    hasSkillsSection: false,
    hasRecommendations: false,
    hasFeatured: false,
    hasEducation: false,
    hasExperience: false
  });

  // Dynamic Scoring Engine Hook
  useEffect(() => {
    import('../utils/scoringEngine.js').then((module) => {
      const {
        calculateResumeScore,
        calculateGithubScore,
        calculateLinkedinScore,
        calculateJobMatchScore,
        calculateProjectGapScore,
        calculateDevScopeScore
      } = module;

      let newScores = { ...scores };
      let updated = false;

      if (resume) {
        const res = calculateResumeScore(resume, selectedRole);
        if (newScores.ats !== res.finalScore) {
          newScores.ats = res.finalScore;
          newScores.resumeDetails = res;
          updated = true;
        }
      }
      if (github) {
        const res = calculateGithubScore(github, selectedRole);
        if (newScores.github !== res.finalScore) {
          newScores.github = res.finalScore;
          newScores.githubDetails = res;
          updated = true;
        }
      }
      if (linkedin) {
        const res = calculateLinkedinScore(linkedin, selectedRole);
        if (newScores.linkedin !== res.finalScore) {
          newScores.linkedin = res.finalScore;
          newScores.linkedinDetails = res;
          updated = true;
        }
      }
      if (jobMatch) {
        const res = calculateJobMatchScore(jobMatch, selectedRole);
        if (newScores.jobMatch !== res.finalScore) {
          newScores.jobMatch = res.finalScore;
          newScores.jobMatchDetails = res;
          updated = true;
        }
      }
      if (projectGap) {
        const res = calculateProjectGapScore(projectGap, selectedRole);
        if (newScores.projectGap !== res.finalScore) {
          newScores.projectGap = res.finalScore;
          newScores.projectGapDetails = res;
          updated = true;
        }
      }

      const overall = calculateDevScopeScore({
        resume: newScores.ats,
        github: newScores.github,
        linkedin: newScores.linkedin,
        jobMatch: newScores.jobMatch,
        projectGap: newScores.projectGap
      });

      if (newScores.overall !== overall) {
        newScores.overall = overall;
        updated = true;
      }

      if (updated) {
        setScores(newScores);
      }
    });
  }, [resume, github, linkedin, jobMatch, projectGap, selectedRole]);

  // Loading States
  const [isAnalyzingGithub, setIsAnalyzingGithub] = useState(false);
  const [isAnalyzingResume, setIsAnalyzingResume] = useState(false);
  const [isAnalyzingLinkedin, setIsAnalyzingLinkedin] = useState(false);

  // Chatbot State
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [isChatTyping, setIsChatTyping] = useState(false);
  const [copiedHeadline, setCopiedHeadline] = useState(false);

  // Loading Simulation State
  const [analysisStep, setAnalysisStep] = useState(0);

  // Recruiter Sim State (legacy)
  const [simLogs, setSimLogs] = useState([
    "[SYSTEM] Ready. Click 'Simulate Recruiter Screen' to run evaluation."
  ]);
  const [isSimulating, setIsSimulating] = useState(false);

  // Export Tracking State
  const [exportState, setExportState] = useState({ status: 'idle', message: '' });

  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatMessages, isChatTyping]);

  useEffect(() => {
    let interval;
    if (isAnalyzingGithub || isAnalyzingResume || isAnalyzingLinkedin || isAnalyzingJobMatch || isAnalyzingProjectGap || isGeneratingReport) {
      setAnalysisStep(0);
      interval = setInterval(() => {
        setAnalysisStep(prev => (prev < 4 ? prev + 1 : prev));
      }, 1500);
    } else {
      setAnalysisStep(0);
    }
    return () => clearInterval(interval);
  }, [isAnalyzingGithub, isAnalyzingResume, isAnalyzingLinkedin, isAnalyzingJobMatch, isAnalyzingProjectGap, isGeneratingReport]);

  // Sync Roadmap based on inputs
  useEffect(() => {
    const fetchRoadmap = async () => {
      try {
        const token = localStorage.getItem('devscope_token');
        const res = await fetch(`${API_BASE_URL}/api/roadmap?role=${selectedRole}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setRoadmap(data);
        }
      } catch (err) {
        console.error('Roadmap fetch error:', err);
      }
    };
    fetchRoadmap();
  }, [selectedRole, github, resume, linkedin]);

  // Fetch AI Status
  useEffect(() => {
    const fetchAiStatus = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/ai-status`);
        if (res.ok) {
          const data = await res.json();
          setAiStatus(data);
        }
      } catch (err) {
        console.error('AI status fetch error:', err);
      }
    };
    fetchAiStatus();
  }, []);

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
  const updateChannelScore = (channel, value) => {
    setScores(prev => {
      const newScores = { ...prev, [channel]: value };
      const activeScores = [];
      if (newScores.github !== null) activeScores.push(newScores.github);
      if (newScores.ats !== null) activeScores.push(newScores.ats);
      if (newScores.careerReady !== null) activeScores.push(newScores.careerReady);

      newScores.portfolio = activeScores.length > 0
        ? Math.round(activeScores.reduce((a, b) => a + b, 0) / activeScores.length)
        : null;

      return newScores;
    });
  };

  const showAlertAfterClearing = (message, clearState) => {
    flushSync(clearState);
    alert(message);
  };

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
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          username: gh,
          targetRole: selectedRole
        })
      });
      const result = await response.json();
      if (response.ok) {
        // Backend wraps response in { success, data } — unwrap it
        const data = result.data || result;
        setGithub(data);

        setScores(prev => {
          const newScores = { ...prev, github: data.score };
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
        showAlertAfterClearing(
          result.error || "Failed to analyze GitHub username. Please verify the profile exists and try again.",
          () => {
            setGithub(null);
            updateChannelScore('github', null);
            setIsAnalyzingGithub(false);
          }
        );
        return;
      }
    } catch (err) {
      console.error(err);
      showAlertAfterClearing("Error reaching the analysis server: " + err.message, () => {
        setGithub(null);
        updateChannelScore('github', null);
        setIsAnalyzingGithub(false);
      });
      return;
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
      showAlertAfterClearing(RESUME_REJECTION_MESSAGE, () => {
        setResume(null);
        updateChannelScore('ats', null);
        setIsAnalyzingResume(false);
      });
      return;
    }
    setIsAnalyzingResume(true);
    try {
      const token = localStorage.getItem('devscope_token');
      const response = await fetch(`${API_BASE_URL}/api/analyze/resume`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          resumeText: text,
          targetRole: selectedRole
        })
      });
      const result = await response.json().catch(() => ({}));
      if (response.ok) {
        // Backend wraps response in { success, data } — unwrap it
        const data = result.data || result;
        setResume(data);

        setScores(prev => {
          const newScores = { ...prev, ats: data.atsScore };
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
        showAlertAfterClearing(result.error || "Failed to analyze resume details. Please try again.", () => {
          setResume(null);
          updateChannelScore('ats', null);
          setIsAnalyzingResume(false);
        });
        return;
      }
    } catch (err) {
      console.error(err);
      showAlertAfterClearing("Error reaching the analysis server: " + err.message, () => {
        setResume(null);
        updateChannelScore('ats', null);
        setIsAnalyzingResume(false);
      });
      return;
    } finally {
      setIsAnalyzingResume(false);
    }
  };

  const handleResumeDrag = function (e) {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setResumeDragActive(true);
    } else if (e.type === "dragleave") {
      setResumeDragActive(false);
    }
  };

  const handleResumeDrop = function (e) {
    e.preventDefault();
    e.stopPropagation();
    setResumeDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleResumeFile(e.dataTransfer.files[0]);
    }
  };

  const handleResumeFile = async (file) => {
    if (!file) return;
    setResumeFileName(file.name);
    setResumeFileParseStatus('parsing');
    setResumeFileParseError('');

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch(`${API_UPLOAD_URL}/api/parse/resume`, {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      if (!response.ok || !data.text || data.text.trim().length < 20) {
        setResumeFileParseStatus('error');
        setResumeFileParseError(data.error || 'Could not extract text. Ensure it is a valid document.');
        return;
      }

      setResumeFileParseStatus('success');
      setResumeTextInput(data.text);
    } catch (err) {
      setResumeFileParseStatus('error');
      setResumeFileParseError('Error parsing file. Please ensure the backend server is running.');
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
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          linkedinText: text,
          targetRole: selectedRole
        })
      });
      const result = await response.json();
      if (response.ok) {
        // Backend wraps response in { success, data } — unwrap it
        const data = result.data || result;
        setLinkedin(data);

        setScores(prev => {
          const newScores = { ...prev, careerReady: data.score };
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
        alert(data?.error || result.error || "Failed to analyze LinkedIn profile. Please verify the link and try again.");
      }
    } catch (err) {
      console.error(err);
      alert("Error reaching the analysis server: " + err.message);
    } finally {
      setIsAnalyzingLinkedin(false);
    }
  };

  const handleLinkLinkedinUrl = async (urlOrUsername, currentSelfReport = null, forceRefresh = false) => {
    let cleanVal = urlOrUsername.trim();
    if (!cleanVal) {
      alert("Please enter a valid LinkedIn URL or username.");
      return;
    }
    cleanVal = parseLinkedInProfileInput(cleanVal);
    if (!cleanVal) {
      showAlertAfterClearing(LINKEDIN_REJECTION_MESSAGE, () => {
        setLinkedin(null);
        updateChannelScore('careerReady', null);
        setIsAnalyzingLinkedin(false);
      });
      return;
    }

    // Detect if this is a NEW profile (different slug)
    const isNewProfile = !linkedin || linkedin.profileHandle !== cleanVal;

    setLiInput(cleanVal);
    setIsAnalyzingLinkedin(true);

    // Determine what selfReport to send:
    // - Manual toggle (currentSelfReport provided) -> send it directly
    // - New profile -> send empty {} so backend auto-scrapes
    // - Same profile re-analyze -> send current liSelfReport
    const reportToSend = currentSelfReport !== null 
      ? currentSelfReport 
      : (isNewProfile ? {} : liSelfReport);

    try {
      const token = localStorage.getItem('devscope_token');
      const response = await fetch(`${API_BASE_URL}/api/analyze/linkedin`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          username: cleanVal,
          targetRole: selectedRole,
          selfReport: reportToSend,
          forceRefresh: forceRefresh
        })
      });
      const result = await response.json();
      if (response.ok) {
        // Backend wraps response in { success, data } — unwrap it
        const data = result.data || result;
        setLinkedin(data);
        setLinkedinTextInput('');

        // Sync self-report state from backend (includes auto-scraped data)
        if (data.selfReport && typeof data.selfReport === 'object') {
          setLiSelfReport({
            hasProfilePhoto: data.selfReport.hasProfilePhoto || false,
            has500Connections: data.selfReport.has500Connections || false,
            hasHeadlineKeywords: data.selfReport.hasHeadlineKeywords || false,
            hasSummary: data.selfReport.hasSummary || false,
            hasSkillsSection: data.selfReport.hasSkillsSection || false,
            hasRecommendations: data.selfReport.hasRecommendations || false,
            hasFeatured: data.selfReport.hasFeatured || false,
            hasEducation: data.selfReport.hasEducation || false,
            hasExperience: data.selfReport.hasExperience || false,
            _autoDetected: data.selfReport._autoDetected || false,
            _confidence: data.selfReport._confidence || '',
            _name: data.selfReport._name || ''
          });
        }

        setScores(prev => {
          const newScores = { ...prev, careerReady: data.score };
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
        showAlertAfterClearing(
          result.error || "Failed to analyze LinkedIn profile. Please verify the URL and try again.",
          () => {
            setLinkedin(null);
            updateChannelScore('careerReady', null);
            setIsAnalyzingLinkedin(false);
          }
        );
        return;
      }
    } catch (err) {
      console.error(err);
      showAlertAfterClearing("Error reaching the analysis server: " + err.message, () => {
        setLinkedin(null);
        updateChannelScore('careerReady', null);
        setIsAnalyzingLinkedin(false);
      });
      return;
    } finally {
      setIsAnalyzingLinkedin(false);
    }
  };

  // Toggle a LinkedIn checklist item and re-analyze with updated self-report
  const handleToggleLinkedinChecklist = (field) => {
    const updated = { ...liSelfReport, [field]: !liSelfReport[field] };
    setLiSelfReport(updated);
    if (linkedin && linkedin.profileHandle) {
      handleLinkLinkedinUrl(linkedin.profileHandle, updated);
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
    // Penalty for skill gaps: more missing skills = bigger deduction
    const gapPenalty = Math.min(signals.missingSkills.length * 3, 20);
    // Penalty for missing channels (not providing data = lower confidence)
    const channelPenalty = (3 - [github, resume, linkedin].filter(Boolean).length) * 4;
    return Math.max(5, Math.min(97, average - gapPenalty - channelPenalty));
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
      resume ? `[RESUME] Action verbs count: ${resume.actionVerbCount || 0}/8. Section completeness: ${Object.values(resume.sectionsChecklist || {}).filter(Boolean).length}/4` : "[RESUME] Skipping ATS checklist verification.",
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
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${savedToken}`
        },
        body: JSON.stringify({
          messages: [...chatMessages, userMsg]
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


  // ── Job Match Handler ─────────────────────────────────────────────────────
  const handleRunJobMatch = async () => {
    if (!jobDescription.trim()) return;
    setIsAnalyzingJobMatch(true);
    try {
      const token = localStorage.getItem('devscope_token');
      const res = await fetch(`${API_BASE_URL}/api/analyze/job-match`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          jobDescription,
          targetRole: selectedRole,
          resumeData: resume,
          githubData: github,
          linkedinData: linkedin
        })
      });
      if (res.ok) {
        const result = await res.json();
        // Backend wraps in { success, data } — unwrap
        setJobMatch(result.data || result);
      } else {
        const err = await res.json().catch(() => ({}));
        const msg = err.error || 'Job match analysis failed.';
        console.error('[job-match] Error:', msg);
        alert(msg);
      }
    } catch (err) {
      console.error(err);
      alert('Error reaching analysis server: ' + err.message);
    } finally {
      setIsAnalyzingJobMatch(false);
    }
  };

  const handleRunProjectGap = async () => {
    setIsAnalyzingProjectGap(true);
    try {
      const token = localStorage.getItem('devscope_token');
      const res = await fetch(`${API_BASE_URL}/api/analyze/project-gap`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          targetRole: selectedRole,
          resumeData: resume,
          githubData: github,
          linkedinData: linkedin,
          jobMatchData: jobMatch,
          projectGapData: projectGap
        })
      });
      if (res.ok) {
        const result = await res.json();
        // Backend wraps in { success, data } — unwrap
        setProjectGap(result.data || result);
      } else {
        const err = await res.json().catch(() => ({}));
        const msg = err.error || 'Project gap analysis failed.';
        console.error('[project-gap] Error:', msg);
        alert(msg);
      }
    } catch (err) {
      console.error(err);
      alert('Error reaching analysis server: ' + err.message);
    } finally {
      setIsAnalyzingProjectGap(false);
    }
  };

  const handleGenerateReport = async () => {
    setIsGeneratingReport(true);
    try {
      const token = localStorage.getItem('devscope_token');
      const res = await fetch(`${API_BASE_URL}/api/analyze/candidate-report`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          targetRole: selectedRole,
          resumeData: resume,
          githubData: github,
          linkedinData: linkedin,
          jobMatchData: jobMatch,
          projectGapData: projectGap
        })
      });
      if (res.ok) {
        const result = await res.json();
        // Backend wraps in { success, data } — unwrap
        setCandidateReport(result.data || result);
      } else {
        const err = await res.json().catch(() => ({}));
        const msg = err.error || 'Report generation failed.';
        console.error('[candidate-report] Error:', msg);
        alert(msg);
      }
    } catch (err) {
      console.error(err);
      alert('Error reaching analysis server: ' + err.message);
    } finally {
      setIsGeneratingReport(false);
    };
  };

  const handleExportReport = async () => {
    const canAnalyze = resume || github || linkedin || (scores && scores.overall > 0);
    if (!canAnalyze) {
      setExportState({ status: 'error', message: 'Complete at least one analysis before generating a report.' });
      setTimeout(() => setExportState({ status: 'idle', message: '' }), 4000);
      return;
    }

    try {
      setExportState({ status: 'loading', message: 'Preparing Intelligence Summary...' });
      const { generateFullReport, generateExecutiveSummary } = await import('../utils/exportReport.js');
      
      await new Promise(r => setTimeout(r, 800));
      setExportState({ status: 'loading', message: 'Generating Executive Summary PDF...' });
      
      generateExecutiveSummary({ scores, candidateReport }, 'Executive_Summary.pdf');

      await new Promise(r => setTimeout(r, 800));
      setExportState({ status: 'loading', message: 'Capturing Full Report UI...' });

      let reportElement = document.getElementById('candidate-report-content');
      let switchedTab = false;
      const originalPath = location.pathname;
      
      if (!reportElement) {
        navigate('/report');
        switchedTab = true;
        await new Promise(r => setTimeout(r, 1000));
        reportElement = document.getElementById('candidate-report-content');
      }

      if (reportElement) {
        await new Promise(r => setTimeout(r, 500));
        await generateFullReport(reportElement, 'Candidate_Intelligence_Report.pdf');
      } else {
        console.warn('Could not find full report DOM element.');
      }
      
      if (switchedTab) {
        navigate(originalPath);
      }

      setExportState({ status: 'success', message: 'Report Generated Successfully' });
      setTimeout(() => setExportState({ status: 'idle', message: '' }), 4000);
    } catch (error) {
      console.error('Export failed:', error);
      setExportState({ status: 'error', message: 'Failed to generate report.' });
      setTimeout(() => setExportState({ status: 'idle', message: '' }), 4000);
    }
  };

  let currentSource = null;
  if (activeTab === 'github') currentSource = github?.analysis_result?._aiSource;
  else if (activeTab === 'resume') currentSource = resume?._aiSource;
  else if (activeTab === 'linkedin') currentSource = linkedin?.analysis_result?._aiSource;
  else if (activeTab === 'recruiter') currentSource = jobMatch?._aiSource;
  else if (activeTab === 'projects') currentSource = projectGap?._aiSource;
  else if (activeTab === 'analytics') currentSource = candidateReport?._aiSource;

  return (
    <DashboardLayout 
      onSignOut={onHome} 
      userName={user ? user.username : (github?.name || null)} 
      user={user}
      onExport={handleExportReport}
      exportState={exportState}
      aiSource={currentSource}
    >
      <div className="tab-panels animate-fade-in">
        {aiStatus && aiStatus.usingFallback && (
          <div className="mx-6 mt-6 mb-0 bg-warning/10 border border-warning/30 rounded-lg p-4 flex items-start gap-3">
            <AlertCircle className="text-warning shrink-0 mt-0.5" size={18} />
            <div>
              <h4 className="font-title-sm text-warning mb-1">Intelligence Engine Running on Fallback</h4>
            </div>
          </div>
        )}
        <div className="pt-6 px-6 pb-0">
          <IntelligenceFlowIndicator resume={resume} github={github} linkedin={linkedin} jobMatch={jobMatch} projectGap={projectGap} candidateReport={candidateReport} activeTab={activeTab} />
        </div>

        {/* Main Content Area */}




        {/* Content wrapper with padding */}
        <div className="p-6">

          <div className="tab-panels animate-fade-in">
            {/* TAB 1: Overview */}
            {activeTab === 'overview' && (
              <div className="overview-grid">
                <div className="overview-main">
                  <div className="card rim-light-amber" style={{ padding: '24px' }}>
                    <div className="recruiter-header" style={{ marginBottom: '20px' }}>
                      <h3 style={{ fontSize: '20px', fontWeight: '800' }}>Candidate Intelligence Overview</h3>
                      <div className="hire-dial-badge" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}>
                        <span>Profile Completion:</span>
                        <span style={{ color: 'var(--color-primary)' }}>
                          {Math.round(([github, resume, linkedin].filter(Boolean).length / 3) * 100)}%
                        </span>
                      </div>
                    </div>
                    
                    {github || resume || linkedin ? (
                      <p style={{ fontSize: '14.5px', color: 'var(--text-primary)', lineHeight: '1.6', marginBottom: '24px' }}>
                        Based on technical signals, the candidate showcases a competent grasp of {github ? github.languages?.[0]?.name || 'modern web' : 'modern web'} ecosystems. 
                        {github ? ' GitHub indicators point to stable repo creations.' : ''} 
                        {resume ? ' The resume keyword parsing indicates solid technical alignment.' : ''} 
                        {linkedin ? ' LinkedIn presence is established.' : ''}
                        Recommendation: Proceed to targeted screening.
                      </p>
                    ) : (
                      <div style={{ padding: '20px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px dashed var(--border-color)', marginBottom: '24px' }}>
                        <p style={{ fontSize: '14.5px', color: 'var(--text-primary)', marginBottom: '16px' }}>
                          Connect your professional profiles to generate a complete candidate intelligence report.
                        </p>
                        <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '10px' }}>
                          <li style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: github ? 'var(--color-tertiary)' : 'var(--text-secondary)' }}>
                            {github ? <CheckCircle size={16} /> : <div style={{ width: '16px', height: '16px', borderRadius: '50%', border: '1px solid var(--text-muted)' }}></div>}
                            Connect GitHub Intelligence
                          </li>
                          <li style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: resume ? 'var(--color-tertiary)' : 'var(--text-secondary)' }}>
                            {resume ? <CheckCircle size={16} /> : <div style={{ width: '16px', height: '16px', borderRadius: '50%', border: '1px solid var(--text-muted)' }}></div>}
                            Upload ATS Resume
                          </li>
                          <li style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: linkedin ? 'var(--color-tertiary)' : 'var(--text-secondary)' }}>
                            {linkedin ? <CheckCircle size={16} /> : <div style={{ width: '16px', height: '16px', borderRadius: '50%', border: '1px solid var(--text-muted)' }}></div>}
                            Link Professional Network
                          </li>
                        </ul>
                      </div>
                    )}

                    <div className="pros-cons-grid">
                      <div className="pro-item" style={{ background: 'rgba(16, 185, 129, 0.05)', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                        <h5 style={{ color: "var(--color-tertiary)", marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px' }}>
                          <CheckCircle size={16} /> Potential Insights
                        </h5>
                        <div style={{ fontSize: '13px', color: "var(--text-primary)", lineHeight: '1.5' }}>
                          {github || resume || linkedin ? (
                            <ul style={{ paddingLeft: '16px', margin: 0, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                              {github && <li>Clean repository structures found</li>}
                              {resume && scores.ats > 70 && <li>ATS resume score matches threshold</li>}
                              {(github || resume) && <li>Key technologies aligned with target role</li>}
                              {linkedin && linkedin.score > 70 && <li>Strong professional network visibility</li>}
                            </ul>
                          ) : (
                            <span style={{ color: 'var(--text-secondary)' }}>Insights will appear once profiles are connected.</span>
                          )}
                        </div>
                      </div>
                      <div className="con-item" style={{ background: 'rgba(245, 158, 11, 0.05)', border: '1px solid rgba(245, 158, 11, 0.2)' }}>
                        <h5 style={{ color: "var(--color-warning)", marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px' }}>
                          <AlertCircle size={16} /> {github || resume || linkedin ? 'Detected Skill Gaps' : 'Analysis Pending'}
                        </h5>
                        <div style={{ fontSize: '13px', color: "var(--text-primary)", lineHeight: '1.5' }}>
                          {github || resume || linkedin ? (
                            <ul style={{ paddingLeft: '16px', margin: 0, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                              {!github && <li>GitHub repository profile not connected</li>}
                              {!resume && <li>Resume intelligence data missing</li>}
                              {!linkedin && <li>LinkedIn network data missing</li>}
                              {roadmap?.gap?.length > 0 && <li>Missing critical skills: {roadmap.gap.slice(0, 2).join(', ')}</li>}
                            </ul>
                          ) : (
                            <span style={{ color: 'var(--text-secondary)' }}>Awaiting candidate data to generate gap analysis.</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
 
                  <div className="card rim-light-amber" style={{ padding: '24px' }}>
                    <h3 style={{ fontSize: '18px', marginBottom: '20px', fontWeight: '800' }}>Intelligence Modules</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                      <div onClick={() => navigate('/github')} className="card rim-light-amber quick-audit-link" style={{ cursor: 'pointer', padding: '16px', background: github ? 'rgba(139, 92, 246, 0.05)' : 'rgba(255,255,255,0.02)', border: github ? '1px solid rgba(139, 92, 246, 0.3)' : '1px solid var(--border-color)' }}>
                        <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', color: github ? 'var(--color-primary)' : 'var(--text-primary)' }}>
                          <Github size={16} /> GitHub
                        </h4>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px' }}>
                          <span style={{ fontSize: '12px', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Status</span>
                          <span style={{ fontSize: '12px', fontWeight: 'bold', color: github ? 'var(--color-tertiary)' : 'var(--text-muted)' }}>{github ? 'Connected' : 'Pending'}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px' }}>
                          <span style={{ fontSize: '12px', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Score</span>
                          <span style={{ fontSize: '14px', fontWeight: '800', color: github ? '#fff' : 'var(--text-muted)' }}>{github ? scores.github : '--'}</span>
                        </div>
                      </div>
                      
                      <div onClick={() => navigate('/resume')} className="card rim-light-amber quick-audit-link" style={{ cursor: 'pointer', padding: '16px', background: resume ? 'rgba(16, 185, 129, 0.05)' : 'rgba(255,255,255,0.02)', border: resume ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid var(--border-color)' }}>
                        <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', color: resume ? 'var(--color-tertiary)' : 'var(--text-primary)' }}>
                          <FileText size={16} /> Resume
                        </h4>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px' }}>
                          <span style={{ fontSize: '12px', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Status</span>
                          <span style={{ fontSize: '12px', fontWeight: 'bold', color: resume ? 'var(--color-tertiary)' : 'var(--text-muted)' }}>{resume ? 'Parsed' : 'Pending'}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px' }}>
                          <span style={{ fontSize: '12px', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>ATS Match</span>
                          <span style={{ fontSize: '14px', fontWeight: '800', color: resume ? '#fff' : 'var(--text-muted)' }}>{resume ? `${scores.ats}%` : '--'}</span>
                        </div>
                      </div>
                      
                      <div onClick={() => navigate('/linkedin')} className="card rim-light-amber quick-audit-link" style={{ cursor: 'pointer', padding: '16px', background: linkedin ? 'rgba(59, 130, 246, 0.05)' : 'rgba(255,255,255,0.02)', border: linkedin ? '1px solid rgba(59, 130, 246, 0.3)' : '1px solid var(--border-color)' }}>
                        <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', color: linkedin ? '#3b82f6' : 'var(--text-primary)' }}>
                          <Linkedin size={16} /> LinkedIn
                        </h4>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px' }}>
                          <span style={{ fontSize: '12px', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Status</span>
                          <span style={{ fontSize: '12px', fontWeight: 'bold', color: linkedin ? 'var(--color-tertiary)' : 'var(--text-muted)' }}>{linkedin ? 'Analyzed' : 'Pending'}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px' }}>
                          <span style={{ fontSize: '12px', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Score</span>
                          <span style={{ fontSize: '14px', fontWeight: '800', color: linkedin ? '#fff' : 'var(--text-muted)' }}>{linkedin ? scores.careerReady : '--'}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="overview-sidebar">
                  <div className="card rim-light-amber" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                    <h3 style={{ fontSize: '18px', marginBottom: '20px', fontWeight: '800' }}>Target Profile Status</h3>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', flexGrow: 1 }}>
                      <div>
                        <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: '600' }}>Target Role</div>
                        <select
                          className="form-input form-select"
                          style={{ padding: '10px 14px', fontSize: '14px', width: '100%', display: 'block', backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', fontWeight: '600', borderRadius: '8px', color: '#fff' }}
                          value={selectedRole}
                          onChange={(e) => setSelectedRole(e.target.value)}
                        >
                          <option value="frontend">Frontend Engineer</option>
                          <option value="backend">Backend Engineer</option>
                          <option value="fullstack">Full-Stack Developer</option>
                          <option value="ml-engineer">Machine Learning Engineer</option>
                        </select>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                        <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '12px' }}>
                          <div style={{ fontSize: '11px', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '4px' }}>Readiness Score</div>
                          <div style={{ fontSize: '20px', fontWeight: '800', color: 'var(--color-primary)' }}>
                            {getRecruiterMatchScore() !== null ? `${getRecruiterMatchScore()}%` : 'N/A'}
                          </div>
                        </div>
                        <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '12px' }}>
                          <div style={{ fontSize: '11px', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '4px' }}>Profile Completion</div>
                          <div style={{ fontSize: '20px', fontWeight: '800', color: 'var(--color-tertiary)' }}>
                            {Math.round(([github, resume, linkedin].filter(Boolean).length / 3) * 100)}%
                          </div>
                        </div>
                      </div>

                      {roadmap && (
                        <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '20px', marginTop: 'auto' }}>
                          <div style={{ marginBottom: '16px' }}>
                            <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: '600' }}>Detected Skill Gaps</div>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                              {roadmap.gap?.length > 0 ? (
                                roadmap.gap.slice(0, 5).map((g, i) => (
                                  <span key={i} className="kw-badge kw-missing" style={{ fontSize: '11px', background: 'rgba(255,255,255,0.05)' }}>{g}</span>
                                ))
                              ) : (
                                <span style={{ fontSize: '12px', color: 'var(--color-tertiary)' }}>✓ No critical gaps detected</span>
                              )}
                            </div>
                          </div>

                          {roadmap.gap?.length > 0 && (
                            <div>
                              <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: '600' }}>Recommended Focus Areas</div>
                              <ul style={{ paddingLeft: '16px', margin: 0, fontSize: '13px', color: 'var(--text-primary)', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                <li>Integrate {roadmap.gap[0]} into a portfolio project</li>
                                {roadmap.gap[1] && <li>Highlight {roadmap.gap[1]} experience in resume</li>}
                              </ul>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: GitHub Analyzer */}
            {activeTab === 'github' && (
              <GithubReport 
                github={github}
                isAnalyzingGithub={isAnalyzingGithub}
                ghInput={ghInput}
                setGhInput={setGhInput}
                handleLinkGithub={handleLinkGithub}
                analysisStep={analysisStep}
                scores={scores}
              />
            )}

            {/* TAB 3: Resume Analyzer */}
            {activeTab === 'resume' && (
              <ResumeReport 
                resume={resume}
                isAnalyzingResume={isAnalyzingResume}
                resumeTextInput={resumeTextInput}
                setResumeTextInput={setResumeTextInput}
                resumeFileName={resumeFileName}
                setResumeFileName={setResumeFileName}
                resumeFileParseStatus={resumeFileParseStatus}
                setResumeFileParseStatus={setResumeFileParseStatus}
                resumeFileParseError={resumeFileParseError}
                setResumeFileParseError={setResumeFileParseError}
                handleLinkResume={handleLinkResume}
                handleResumeFile={handleResumeFile}
                handleResumeDrop={handleResumeDrop}
                handleResumeDrag={handleResumeDrag}
                resumeDragActive={resumeDragActive}
                analysisStep={analysisStep}
                scores={scores}
                setResume={setResume}
              />
            )}

            {/* TAB 4: LinkedIn Analyzer */}
            {activeTab === 'linkedin' && (
              <LinkedInReport
                linkedin={linkedin}
                isAnalyzing={isAnalyzingLinkedin}
                liInput={liInput}
                setLiInput={setLiInput}
                handleLinkLinkedinUrl={handleLinkLinkedinUrl}
                user={user}
                analysisStep={analysisStep}
                scores={scores}
              />
            )}

            {/* TAB 5: Skill Gap */}
            {activeTab === 'roadmap' && roadmap && (
              <div className="card rim-light-amber">
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
              <div className="card rim-light-amber" style={{ padding: '20px' }}>
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

            {/* TAB 7: Recruiter Sim / Job Match */}
            {activeTab === 'recruiter' && (
              <RoleMatchReport
                jobMatch={jobMatch}
                isAnalyzing={isAnalyzingJobMatch}
                jobDescription={jobDescription}
                setJobDescription={setJobDescription}
                handleRunJobMatch={handleRunJobMatch}
                analysisStep={analysisStep}
                scores={scores}
              />
            )}

            {/* TAB 8: Project Gap Analyzer */}
            {activeTab === 'projects' && (
              <ProjectGapReport
                projectGap={projectGap}
                isAnalyzing={isAnalyzingProjectGap}
                handleRunProjectGap={handleRunProjectGap}
                resume={resume}
                github={github}
                linkedin={linkedin}
                analysisStep={analysisStep}
                scores={scores}
              />
            )}

            {/* TAB 9: Candidate Intelligence Report */}
            {activeTab === 'analytics' && (
              <CandidateReport 
                candidateReport={candidateReport}
                isGeneratingReport={isGeneratingReport}
                handleGenerateReport={handleGenerateReport}
                resume={resume}
                github={github}
                linkedin={linkedin}
                scores={scores}
                onExport={handleExportReport}
                exportState={exportState}
              />
            )}

            {/* TAB 10: System Settings */}
            {activeTab === 'settings' && (
              <div className="max-w-4xl animate-fade-in">
                <div className="mb-8">
                  <h2 className="font-display-lg text-display-lg text-primary tracking-tight">System Settings & Telemetry</h2>
                  <p className="text-on-surface-variant mt-2 font-body-md">Verify backend intelligence endpoints and Gemini AI connectivity.</p>
                </div>
                <div className="bg-surface-container-low border border-outline-variant p-6 rim-light-amber">
                  <h3 className="font-title-md mb-4 text-on-surface">Gemini AI Engine Connection</h3>
                  <div className="flex items-center gap-4 mb-4">
                    <button 
                      onClick={async () => {
                        const btn = document.getElementById('test-gemini-btn');
                        const resPre = document.getElementById('gemini-test-res');
                        btn.innerHTML = '<span class="material-symbols-outlined animate-spin text-sm">sync</span> TESTING...';
                        btn.disabled = true;
                        resPre.textContent = 'Awaiting response from Gemini...';
                        try {
                          const res = await fetch(`/api/debug/gemini`);
                          const data = await res.json();
                          resPre.textContent = JSON.stringify(data, null, 2);
                        } catch (e) {
                          resPre.textContent = 'Fetch Error: ' + e.message;
                        } finally {
                          btn.innerHTML = '<span class="material-symbols-outlined text-sm">science</span> TEST GEMINI CONNECTION';
                          btn.disabled = false;
                        }
                      }}
                      id="test-gemini-btn"
                      className="bg-primary text-on-primary px-4 py-2 font-label-caps flex items-center gap-2 hover:brightness-110 active:opacity-80 transition-all border border-primary/20"
                    >
                      <span className="material-symbols-outlined text-sm">science</span>
                      TEST GEMINI CONNECTION
                    </button>
                  </div>
                  <pre id="gemini-test-res" className="bg-[#050505] border border-outline-variant p-4 font-mono text-[12px] text-primary whitespace-pre-wrap overflow-x-auto min-h-[100px]">
Click 'Test Gemini Connection' to verify API key and Google AI response.
                  </pre>
                </div>
              </div>
            )}

          </div>{/* end tab-panels */}
        </div>{/* end content wrapper */}
      </div>
    </DashboardLayout>
  );
}

export default Dashboard;
