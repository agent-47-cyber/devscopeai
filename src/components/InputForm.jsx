import React, { useState, useEffect } from 'react';
import { Upload, ArrowLeft, Terminal, CheckCircle, AlertCircle, Loader, Loader2 } from 'lucide-react';
import { API_UPLOAD_URL } from '../config.js';
import './InputForm.css';

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

function InputForm({ onSubmit, onBack, isLoading }) {
  const [githubUsername, setGithubUsername] = useState('');
  const [linkedinUsername, setLinkedinUsername] = useState('');
  const [resumeText, setResumeText] = useState('');
  const [targetRole, setTargetRole] = useState('frontend');
  const [fileName, setFileName] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const [scanStep, setScanStep] = useState(0);
  const [fileParseStatus, setFileParseStatus] = useState(null); // null | 'parsing' | 'success' | 'error'
  const [fileParseError, setFileParseError] = useState('');

  const scanSteps = [
    'Connecting to GitHub API...',
    'Parsing repositories & language signatures...',
    'Analyzing commit histories & metadata...',
    'Parsing resume document...',
    'Auditing ATS keywords & syntax...',
    'Checking LinkedIn profile structure...',
    'Running recruiter simulations...',
    'Synthesizing personalized career roadmap...'
  ];

  useEffect(() => {
    let interval;
    if (isLoading) {
      interval = setInterval(() => {
        setScanStep((prev) => (prev + 1) % scanSteps.length);
      }, 1500);
    } else {
      setScanStep(0);
    }
    return () => clearInterval(interval);
  }, [isLoading]);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') setDragActive(true);
    else if (e.type === 'dragleave') setDragActive(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  // REAL FILE PARSING — uploads to server for text extraction
  const handleFile = async (file) => {
    const ext = file.name.split('.').pop().toLowerCase();
    const allowedExts = ['pdf', 'docx', 'txt', 'md'];

    if (!allowedExts.includes(ext)) {
      setFileParseStatus('error');
      setFileParseError(`Unsupported file type ".${ext}". Please upload a PDF, DOCX, TXT, or MD file.`);
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setFileParseStatus('error');
      setFileParseError('File is too large (max 10MB). Please upload a smaller file or paste text directly.');
      return;
    }

    // For plain text files, read directly in browser (fast, no server needed)
    if (ext === 'txt' || ext === 'md') {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target.result || '';
        if (!looksLikeResume(content)) {
          setFileName(file.name);
          setResumeText('');
          setFileParseStatus('error');
          setFileParseError(RESUME_REJECTION_MESSAGE);
          alert(RESUME_REJECTION_MESSAGE);
          return;
        }
        setFileName(file.name);
        setResumeText(content);
        setFileParseStatus('success');
        setFileParseError('');
      };
      reader.onerror = () => {
        setFileParseStatus('error');
        setFileParseError('Failed to read the text file. Please try copy-pasting instead.');
      };
      reader.readAsText(file);
      return;
    }

    // For PDF and DOCX — send to server for real extraction
    setFileName(file.name);
    setFileParseStatus('parsing');
    setFileParseError('');
    setResumeText('');

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(`${API_UPLOAD_URL}/api/parse/resume`, {
        method: 'POST',
        body: formData
        // Don't set Content-Type header — browser sets it with boundary automatically
      });

      const data = await response.json();

      if (!response.ok) {
        setFileParseStatus('error');
        const message = data.error || 'Failed to parse file. Please try copy-pasting your resume text.';
        setFileParseError(message);
        alert(message);
        return;
      }

      if (!data.text || data.text.trim().length < 20) {
        setFileParseStatus('error');
        const message = 'Could not extract meaningful text from this file. It may be a scanned image PDF. Please paste your resume text instead.';
        setFileParseError(message);
        alert(message);
        return;
      }

      setResumeText(data.text);
      setFileParseStatus('success');
      setFileParseError('');
    } catch (err) {
      console.error('File parse error:', err);
      setFileParseStatus('error');
      const message = 'Network error while parsing file. Please check your connection or paste your resume text instead.';
      setFileParseError(message);
      alert(message);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    let gh = githubUsername.trim();
    if (gh) {
      gh = gh.replace(/^(https?:\/\/)?(www\.)?github\.com\//i, '');
      gh = gh.replace(/^git@github\.com:/i, '');
      gh = gh.split('/')[0].split('?')[0].split('#')[0];
      setGithubUsername(gh);
    }
    let li = linkedinUsername.trim();
    if (li) {
      const cleanLinkedin = parseLinkedInProfileInput(li);
      if (!cleanLinkedin) {
        alert(LINKEDIN_REJECTION_MESSAGE);
        return;
      }
      li = cleanLinkedin;
      setLinkedinUsername(li);
    }
    const rt = resumeText.trim();

    if (!gh && !li && !rt) {
      alert('Please enter at least one channel to analyze (GitHub Username, LinkedIn Username, or Resume Text).');
      return;
    }

    if (fileParseStatus === 'parsing') {
      alert('Please wait — your resume file is still being parsed.');
      return;
    }

    if (rt && !looksLikeResume(rt)) {
      alert(RESUME_REJECTION_MESSAGE);
      return;
    }

    onSubmit({ githubUsername: gh, linkedinUsername: li, resumeText: rt, targetRole });
  };

  return (
    <div className="input-form-wrapper">
      <div className="input-form-card">
        {isLoading && (
          <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/80 backdrop-blur-xl rounded-2xl border border-[#252525] overflow-hidden">
            {/* Animated scanning line */}
            <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-[#FF7A1A] to-transparent animate-[scan_2s_ease-in-out_infinite]"></div>
            
            {/* Central Intelligence Core */}
            <div className="relative w-24 h-24 mb-8 flex items-center justify-center">
              {/* Outer pulsing ring */}
              <div className="absolute inset-0 border-2 border-[#FF7A1A]/20 rounded-full animate-[ping_2s_cubic-bezier(0,0,0.2,1)_infinite]"></div>
              {/* Middle spinning dashed ring */}
              <div className="absolute inset-1 border border-dashed border-[#FF7A1A]/40 rounded-full animate-[spin_4s_linear_infinite]"></div>
              {/* Inner glowing core */}
              <div className="absolute inset-4 bg-gradient-to-tr from-[#FF7A1A] to-[#ffb77d] rounded-full blur-md opacity-40 animate-[pulse_1.5s_ease-in-out_infinite]"></div>
              <div className="absolute inset-6 bg-[#FF7A1A] rounded-full shadow-[0_0_20px_rgba(249,115,22,0.8)] flex items-center justify-center">
                <Terminal size={18} className="text-white animate-pulse" />
              </div>
            </div>

            <h3 className="text-xl font-bold tracking-tight text-white mb-2 animate-pulse">
              Synthesizing Intelligence
            </h3>
            
            <div className="flex items-center gap-2 text-sm text-[#c7c6c6] bg-[#111111]/80 px-4 py-2 rounded-full border border-[#252525] shadow-lg">
              <Loader2 size={14} className="animate-spin text-[#FF7A1A]" />
              <span className="font-mono tracking-tight">{scanSteps[scanStep]}</span>
            </div>
          </div>
        )}

        <div className="form-header">
          <h2 className="form-title text-gradient">Start Your Analysis</h2>
          <p className="form-subtitle">Submit details to see your profile through recruiter lenses</p>
        </div>

        <form onSubmit={handleSubmit}>
          {/* GitHub Username */}
          <div className="form-group">
            <label className="form-label" htmlFor="github">GitHub Username</label>
            <input
              type="text"
              id="github"
              className="form-input"
              placeholder="e.g. torvalds"
              value={githubUsername}
              onChange={(e) => setGithubUsername(e.target.value)}
            />
          </div>

          {/* LinkedIn Username */}
          <div className="form-group">
            <label className="form-label" htmlFor="linkedin">LinkedIn Username</label>
            <input
              type="text"
              id="linkedin"
              className="form-input"
              placeholder="e.g. your-name"
              value={linkedinUsername}
              onChange={(e) => setLinkedinUsername(e.target.value)}
            />
          </div>

          {/* Target Role */}
          <div className="form-group">
            <label className="form-label" htmlFor="role">Target Job Role</label>
            <select
              id="role"
              className="form-input form-select"
              value={targetRole}
              onChange={(e) => setTargetRole(e.target.value)}
            >
              <option value="frontend">Frontend Engineer</option>
              <option value="backend">Backend Engineer</option>
              <option value="fullstack">Full-Stack Developer</option>
              <option value="ml-engineer">Machine Learning Engineer</option>
            </select>
          </div>

          {/* Resume Upload */}
          <div className="form-group">
            <label className="form-label">Resume / CV</label>

            <div
              className={`file-upload-zone ${dragActive ? 'dragover' : ''} ${fileParseStatus === 'error' ? 'upload-error' : ''} ${fileParseStatus === 'success' ? 'upload-success' : ''}`}
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
              onClick={() => fileParseStatus !== 'parsing' && document.getElementById('file-input').click()}
              style={{ cursor: fileParseStatus === 'parsing' ? 'wait' : 'pointer' }}
            >
              {fileParseStatus === 'parsing' ? (
                <>
                  <Loader size={24} style={{ margin: '0 auto 12px auto', animation: 'spin 1s linear infinite', display: 'block' }} />
                  <p>Extracting text from <strong>{fileName}</strong>...</p>
                  <span>This may take a few seconds</span>
                </>
              ) : fileParseStatus === 'success' ? (
                <>
                  <CheckCircle size={24} style={{ margin: '0 auto 12px auto', display: 'block', color: '#10b981' }} />
                  <p style={{ color: '#10b981' }}>✅ Resume parsed: <strong>{fileName}</strong></p>
                  <span>Text extracted successfully. Click to replace.</span>
                </>
              ) : fileParseStatus === 'error' ? (
                <>
                  <AlertCircle size={24} style={{ margin: '0 auto 12px auto', display: 'block', color: '#ef4444' }} />
                  <p style={{ color: '#ef4444' }}>Upload failed</p>
                  <span>Click to try again</span>
                </>
              ) : (
                <>
                  <Upload size={24} style={{ margin: '0 auto 12px auto', display: 'block' }} />
                  <p>{fileName ? `Selected: ${fileName}` : 'Drag & drop your Resume or click to browse'}</p>
                  <span>Supports .pdf, .docx, .txt, .md (Max 10MB)</span>
                </>
              )}

              <input
                type="file"
                id="file-input"
                style={{ display: 'none' }}
                onChange={handleFileChange}
                accept=".txt,.pdf,.docx,.md"
              />
            </div>

            {/* Error message */}
            {fileParseStatus === 'error' && fileParseError && (
              <div style={{
                marginTop: '10px',
                padding: '12px 16px',
                background: 'rgba(239, 68, 68, 0.08)',
                border: '1px solid rgba(239, 68, 68, 0.25)',
                borderRadius: '8px',
                fontSize: '13px',
                color: '#fca5a5',
                lineHeight: '1.5'
              }}>
                ⚠️ {fileParseError}
              </div>
            )}

            <div style={{ margin: '16px 0 8px 0', textAlign: 'center', color: 'var(--text-muted)', fontSize: '12px' }}>
              — OR COPY PASTE TEXT BELOW —
            </div>

            <textarea
              className="form-input form-textarea"
              placeholder="Paste your full resume text here (plain text works best for ATS analysis)..."
              value={resumeText}
              onChange={(e) => {
                setResumeText(e.target.value);
                if (fileName) {
                  setFileName('');
                  setFileParseStatus(null);
                  setFileParseError('');
                }
              }}
            />
            {resumeText && (
              <div style={{ marginTop: '6px', fontSize: '12px', color: 'var(--text-muted)' }}>
                📝 {resumeText.trim().split(/\s+/).filter(Boolean).length} words detected
              </div>
            )}
          </div>

          {/* Submit Actions */}
          <div className="form-actions">
            <button type="button" className="btn btn-secondary" onClick={onBack}>
              <ArrowLeft size={16} /> Back
            </button>
            <button type="submit" className="btn btn-primary" disabled={isLoading || fileParseStatus === 'parsing'}>
              {fileParseStatus === 'parsing' ? 'Parsing file...' : 'Analyze Profile →'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default InputForm;
