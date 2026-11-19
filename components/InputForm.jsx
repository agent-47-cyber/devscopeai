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
  const [jobDescription, setJobDescription] = useState('');
  const [resumeFilePath, setResumeFilePath] = useState('');
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

      if (!response.ok) {
        setFileParseStatus('error');
        const data = await response.json().catch(() => ({}));
        const message = typeof data.error === 'string' ? data.error : (data.error?.message || 'Failed to parse file. Please ensure the backend server is running.');
        setFileParseError(message);
        alert(message);
        return;
      }

      const data = await response.json();

      if (!data.text || data.text.trim().length < 20) {
        setFileParseStatus('error');
        const message = 'Could not extract meaningful text from this file. It may be a scanned image PDF. Please paste your resume text instead.';
        setFileParseError(message);
        alert(message);
        return;
      }

      setResumeText(data.text);
      setResumeFilePath(data.filePath || '');
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

    const jd = jobDescription.trim();

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

    onSubmit({ githubUsername: gh, linkedinUsername: li, resumeText: rt, jobDescription: jd, targetRole, resumeFilePath });
  };

  return (
    <div className="w-full flex justify-center py-6">
      <div 
        className="w-full max-w-[460px] flex flex-col rounded-2xl relative overflow-hidden px-10 pb-10 pt-10"
        style={{
          background: 'linear-gradient(180deg, #0a0a0a 0%, #030303 100%)',
          boxShadow: '0 0 0 1px rgba(255,255,255,0.06), 0 30px 80px rgba(0,0,0,0.8), 0 0 40px rgba(244,122,31,0.06)'
        }}
      >
        {/* Subtle top highlight */}
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[rgba(255,255,255,0.15)] to-transparent" />

        {isLoading && (
          <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-[#050505]/90 backdrop-blur-xl border border-[rgba(255,255,255,0.06)] overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-[#F47A1F] to-transparent animate-[scan_2s_ease-in-out_infinite]"></div>
            
            <div className="relative w-24 h-24 mb-8 flex items-center justify-center">
              <div className="absolute inset-0 border-2 border-[#F47A1F]/20 rounded-full animate-[ping_2s_cubic-bezier(0,0,0.2,1)_infinite]"></div>
              <div className="absolute inset-1 border border-dashed border-[#F47A1F]/40 rounded-full animate-[spin_4s_linear_infinite]"></div>
              <div className="absolute inset-4 bg-[#F47A1F] rounded-full blur-md opacity-20 animate-[pulse_1.5s_ease-in-out_infinite]"></div>
              <div className="absolute inset-6 bg-[#F47A1F] rounded-full shadow-[0_0_20px_rgba(244,122,31,0.4)] flex items-center justify-center">
                <Terminal size={18} className="text-[#090909] animate-pulse" />
              </div>
            </div>

            <h3 className="text-xl font-bold tracking-wide text-[#FAFAFA] mb-2 animate-pulse">
              Synthesizing Intelligence
            </h3>
            
            <div className="flex items-center gap-2 text-[10px] font-mono text-[#FAFAFA] opacity-80 bg-[#090909] px-4 py-2 rounded-full border border-[rgba(255,255,255,0.06)] shadow-lg uppercase tracking-widest">
              <Loader2 size={12} className="animate-spin text-[#F47A1F]" />
              <span>{scanSteps[scanStep]}</span>
            </div>
          </div>
        )}

        <div className="flex flex-col items-center justify-center w-full mb-8 gap-2">
          <h2 className="text-xl font-bold tracking-wide text-[#FAFAFA] m-0">Start Your Analysis</h2>
          <p className="text-[10px] font-mono tracking-[0.2em] text-[#FAFAFA] opacity-70 uppercase m-0 mt-1 text-center">Submit details for recruiter intelligence</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 w-full">
          {/* GitHub Username */}
          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-mono tracking-[0.2em] text-[#FAFAFA] opacity-70 uppercase" htmlFor="github">GitHub Username</label>
            <input
              type="text"
              id="github"
              className="w-full bg-[#090909] border border-[rgba(255,255,255,0.06)] shadow-[inset_0_2px_4px_rgba(0,0,0,0.4)] text-[#FAFAFA] text-xs font-mono px-4 py-3 rounded-md outline-none focus:border-[#F47A1F] focus:shadow-[inset_0_2px_4px_rgba(0,0,0,0.4),0_0_8px_rgba(244,122,31,0.2)] transition-all"
              placeholder="e.g. torvalds"
              value={githubUsername}
              onChange={(e) => setGithubUsername(e.target.value)}
            />
          </div>

          {/* LinkedIn Username */}
          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-mono tracking-[0.2em] text-[#FAFAFA] opacity-70 uppercase" htmlFor="linkedin">LinkedIn Username</label>
            <input
              type="text"
              id="linkedin"
              className="w-full bg-[#090909] border border-[rgba(255,255,255,0.06)] shadow-[inset_0_2px_4px_rgba(0,0,0,0.4)] text-[#FAFAFA] text-xs font-mono px-4 py-3 rounded-md outline-none focus:border-[#F47A1F] focus:shadow-[inset_0_2px_4px_rgba(0,0,0,0.4),0_0_8px_rgba(244,122,31,0.2)] transition-all"
              placeholder="e.g. your-name"
              value={linkedinUsername}
              onChange={(e) => setLinkedinUsername(e.target.value)}
            />
          </div>

          {/* Target Role */}
          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-mono tracking-[0.2em] text-[#FAFAFA] opacity-70 uppercase" htmlFor="role">Target Job Role</label>
            <select
              id="role"
              className="w-full bg-[#090909] border border-[rgba(255,255,255,0.06)] shadow-[inset_0_2px_4px_rgba(0,0,0,0.4)] text-[#FAFAFA] text-xs font-mono px-4 py-3 rounded-md outline-none focus:border-[#F47A1F] focus:shadow-[inset_0_2px_4px_rgba(0,0,0,0.4),0_0_8px_rgba(244,122,31,0.2)] transition-all appearance-none"
              value={targetRole}
              onChange={(e) => setTargetRole(e.target.value)}
            >
              <option value="frontend">Frontend Engineer</option>
              <option value="backend">Backend Engineer</option>
              <option value="fullstack">Full-Stack Developer</option>
              <option value="ml-engineer">Machine Learning Engineer</option>
            </select>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-mono tracking-[0.2em] text-[#FAFAFA] opacity-70 uppercase" htmlFor="job-description">Job Description</label>
            <textarea
              id="job-description"
              className="w-full bg-[#090909] border border-[rgba(255,255,255,0.06)] shadow-[inset_0_2px_4px_rgba(0,0,0,0.4)] text-[#FAFAFA] text-xs font-mono px-4 py-3 rounded-md outline-none focus:border-[#F47A1F] focus:shadow-[inset_0_2px_4px_rgba(0,0,0,0.4),0_0_8px_rgba(244,122,31,0.2)] transition-all min-h-[90px] resize-y"
              placeholder="Paste the target job description here..."
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
            />
          </div>

          {/* Resume Upload */}
          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-mono tracking-[0.2em] text-[#FAFAFA] opacity-70 uppercase">Resume / CV</label>

            <div
              className={`flex flex-col items-center justify-center w-full py-6 border border-dashed rounded-md transition-all ${dragActive ? 'border-[#F47A1F] bg-[rgba(244,122,31,0.05)]' : 'border-[rgba(255,255,255,0.1)] bg-[#090909] hover:border-[rgba(255,255,255,0.2)]'}`}
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
              onClick={() => fileParseStatus !== 'parsing' && document.getElementById('file-input').click()}
              style={{ cursor: fileParseStatus === 'parsing' ? 'wait' : 'pointer' }}
            >
              {fileParseStatus === 'parsing' ? (
                <>
                  <Loader size={20} className="animate-spin text-[#F47A1F] mb-3" />
                  <p className="text-xs font-mono text-[#FAFAFA] mb-1">Extracting from <strong>{fileName}</strong>...</p>
                  <span className="text-[9px] font-mono text-[#FAFAFA] opacity-50 uppercase tracking-widest">This may take a few seconds</span>
                </>
              ) : fileParseStatus === 'success' ? (
                <>
                  <CheckCircle size={20} className="text-[#3DE273] mb-3" />
                  <p className="text-xs font-mono text-[#3DE273] mb-1">✅ Parsed: <strong>{fileName}</strong></p>
                  <span className="text-[9px] font-mono text-[#FAFAFA] opacity-50 uppercase tracking-widest">Click to replace</span>
                </>
              ) : fileParseStatus === 'error' ? (
                <>
                  <AlertCircle size={20} className="text-[#ef4444] mb-3" />
                  <p className="text-xs font-mono text-[#ef4444] mb-1">Upload failed</p>
                  <span className="text-[9px] font-mono text-[#FAFAFA] opacity-50 uppercase tracking-widest">Click to try again</span>
                </>
              ) : (
                <>
                  <Upload size={20} className="text-[#FAFAFA] opacity-70 mb-3" />
                  <p className="text-xs font-mono text-[#FAFAFA] opacity-90 mb-1">{fileName ? `Selected: ${fileName}` : 'Drag & drop your Resume or click to browse'}</p>
                  <span className="text-[9px] font-mono text-[#FAFAFA] opacity-50 uppercase tracking-widest">.pdf, .docx, .txt, .md (Max 10MB)</span>
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
            
            {fileParseStatus === 'error' && fileParseError && (
              <div className="mt-2 p-3 bg-[rgba(239,68,68,0.08)] border border-[rgba(239,68,68,0.25)] rounded-md text-[11px] font-mono text-[#fca5a5] leading-relaxed">
                ⚠️ {fileParseError}
              </div>
            )}

            <div className="my-2 text-center text-[10px] font-mono text-[#FAFAFA] opacity-40 uppercase tracking-widest">
              — OR COPY PASTE TEXT BELOW —
            </div>

            <textarea
              className="w-full bg-[#090909] border border-[rgba(255,255,255,0.06)] shadow-[inset_0_2px_4px_rgba(0,0,0,0.4)] text-[#FAFAFA] text-xs font-mono px-4 py-3 rounded-md outline-none focus:border-[#F47A1F] focus:shadow-[inset_0_2px_4px_rgba(0,0,0,0.4),0_0_8px_rgba(244,122,31,0.2)] transition-all min-h-[90px] resize-y"
              placeholder="Paste your full resume text here..."
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
              <div className="mt-1 text-[10px] font-mono text-[#FAFAFA] opacity-50 text-right">
                📝 {resumeText.trim().split(/\s+/).filter(Boolean).length} words detected
              </div>
            )}
          </div>

          {/* Submit Actions */}
          <div className="grid grid-cols-[120px_1fr] gap-3 mt-4">
            <button type="button" onClick={onBack} className="dsx-secondary-action border border-[rgba(255,255,255,0.06)] bg-[#090909] hover:bg-[rgba(255,255,255,0.03)] text-[#FAFAFA] text-[10px] font-mono tracking-widest py-3 rounded-md transition-colors shadow-[inset_0_2px_4px_rgba(0,0,0,0.4)] flex items-center justify-center gap-2">
              <ArrowLeft size={14} /> BACK
            </button>
            <button type="submit" disabled={isLoading || fileParseStatus === 'parsing'} className="dsx-primary-action w-full bg-[#F47A1F] text-[#090909] font-bold text-[10px] font-mono tracking-widest py-3 rounded-sm flex items-center justify-center gap-2 hover:bg-[#ff8f3d] transition-colors shadow-[0_0_20px_rgba(244,122,31,0.2)] disabled:opacity-60">
              {fileParseStatus === 'parsing' ? 'PARSING...' : 'ANALYZE PROFILE →'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default InputForm;
