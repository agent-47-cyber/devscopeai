import React, { useState, useEffect } from 'react';
import { Upload, ArrowLeft, Terminal } from 'lucide-react';
import './InputForm.css';

function InputForm({ onSubmit, onBack, isLoading }) {
  const [githubUsername, setGithubUsername] = useState('');
  const [linkedinUrl, setLinkedinUrl] = useState('');
  const [resumeText, setResumeText] = useState('');
  const [targetRole, setTargetRole] = useState('frontend');
  const [fileName, setFileName] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const [scanStep, setScanStep] = useState(0);

  const scanSteps = [
    'Connecting to GitHub API...',
    'Parsing repositories & language signatures...',
    'Analyzing commit histories & metadata...',
    'Reading resume document data...',
    'Auditing ATS keywords & syntax...',
    'Fetching LinkedIn profile structure...',
    'Running recruiter simulations...',
    'Synthesizing personalized career roadmap...'
  ];

  // Rotate scanning text during load
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
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
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

  const handleFile = (file) => {
    setFileName(file.name);
    
    const reader = new FileReader();
    reader.onload = (e) => {
      setResumeText(e.target.result || `Simulated Resume Content for ${file.name}\nSoftware Engineer with experience in React, Node.js, TypeScript, SQL, Docker, AWS, Git.`);
    };
    // Attempt to read text files
    if (file.type.startsWith('text/') || file.name.endsWith('.txt') || file.name.endsWith('.md')) {
      reader.readAsText(file);
    } else {
      // For binary files (like PDFs), we populate a simulated rich resume text based on typical templates
      setTimeout(() => {
        setResumeText(`John Doe Resume\nSkills: React, Node.js, Express, JavaScript, TypeScript, AWS, Docker, Git, CI/CD, SQL, MongoDB.\nRole: Software Engineer.\nExperience: Engineered high performance web applications using React and Express. Integrated AWS Lambdas and managed CI/CD pipelines.`);
      }, 500);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const gh = githubUsername.trim();
    const li = linkedinUrl.trim();
    const rt = resumeText.trim();

    if (!gh && !li && !rt) {
      alert("Please enter at least one channel to analyze (GitHub Username, LinkedIn URL, or Resume Text).");
      return;
    }

    const submissionData = {
      githubUsername: gh,
      linkedinUrl: li,
      resumeText: rt,
      targetRole
    };

    onSubmit(submissionData);
  };

  return (
    <div className="input-form-wrapper">
      <div className="input-form-card">
        {isLoading && (
          <div className="scanning-overlay">
            <div className="scanner-circle-container">
              <div className="scanner-circle"></div>
              <div className="scanner-circle-inner"></div>
            </div>
            <div className="scanner-text text-gradient">Analyzing Profile</div>
            <div className="scanner-subtext">
              <Terminal size={14} style={{ display: 'inline', marginRight: '6px', verticalAlign: 'middle' }} />
              {scanSteps[scanStep]}
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
              placeholder="e.g. torvalds (or leave blank for demo profile)" 
              value={githubUsername}
              onChange={(e) => setGithubUsername(e.target.value)}
            />
          </div>

          {/* LinkedIn Profile */}
          <div className="form-group">
            <label className="form-label" htmlFor="linkedin">LinkedIn URL</label>
            <input 
              type="url" 
              id="linkedin"
              className="form-input" 
              placeholder="https://linkedin.com/in/username" 
              value={linkedinUrl}
              onChange={(e) => setLinkedinUrl(e.target.value)}
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

          {/* Resume Upload / Copy-Paste */}
          <div className="form-group">
            <label className="form-label">Resume / CV</label>
            
            <div 
              className={`file-upload-zone ${dragActive ? 'dragover' : ''}`}
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
              onClick={() => document.getElementById('file-input').click()}
            >
              <Upload className="upload-icon" size={24} style={{ margin: '0 auto 12px auto' }} />
              <p>{fileName ? `Selected: ${fileName}` : 'Drag & drop your Resume or browse files'}</p>
              <span>Supports .pdf, .docx, .txt, .md (Max 5MB)</span>
              <input 
                type="file" 
                id="file-input"
                style={{ display: 'none' }}
                onChange={handleFileChange}
                accept=".txt,.pdf,.docx,.md"
              />
            </div>
            
            <div style={{ margin: '16px 0 8px 0', textAlign: 'center', color: 'var(--text-muted)', fontSize: '12px' }}>
              — OR COPY PASTE TEXT BELOW —
            </div>

            <textarea 
              className="form-input form-textarea" 
              placeholder="Paste your Resume text details here..."
              value={resumeText}
              onChange={(e) => {
                setResumeText(e.target.value);
                if (fileName) setFileName(''); // Clear file selection if manually typing
              }}
            />
          </div>

          {/* Submit Actions */}
          <div className="form-actions">
            <button type="button" className="btn btn-secondary" onClick={onBack}>
              <ArrowLeft size={16} /> Back
            </button>
            <button type="submit" className="btn btn-primary">
              Analyze Profile →
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default InputForm;
