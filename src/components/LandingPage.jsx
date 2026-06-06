import React, { useState } from 'react';
import { 
  Github, 
  FileText, 
  Linkedin, 
  Zap, 
  MessageSquare, 
  UserCheck, 
  Cpu, 
  BarChart3, 
  ArrowRight, 
  Plus 
} from 'lucide-react';
import './LandingPage.css';

function LandingPage({ onGetStarted, scores, onLoginClick, user, onLogout }) {
  const [activeFaq, setActiveFaq] = useState(null);

  const toggleFaq = (index) => {
    if (activeFaq === index) {
      setActiveFaq(null);
    } else {
      setActiveFaq(index);
    }
  };

  const features = [
    {
      icon: <Github size={22} />,
      title: "GitHub Analyzer",
      description: "Deep analysis of repos, commits, tech stack & open-source contributions."
    },
    {
      icon: <FileText size={22} />,
      title: "Resume Scanner",
      description: "ATS scoring, keyword analysis & optimization suggestions."
    },
    {
      icon: <Linkedin size={22} />,
      title: "LinkedIn Analyzer",
      description: "Profile completeness, visibility & recruiter attraction scoring."
    },
    {
      icon: <Zap size={22} />,
      title: "Skill Gap Detection",
      description: "Identify missing skills for your target role with learning roadmaps."
    },
    {
      icon: <MessageSquare size={22} />,
      title: "AI Career Coach",
      description: "Interactive assistant for career guidance & interview prep."
    },
    {
      icon: <UserCheck size={22} />,
      title: "Recruiter Simulator",
      description: "See your profile through a recruiter's eyes with hire probability."
    },
    {
      icon: <Cpu size={22} />,
      title: "Project Engine",
      description: "Personalized project ideas to boost your resume impact."
    },
    {
      icon: <BarChart3 size={22} />,
      title: "Analytics Dashboard",
      description: "Track your growth with detailed charts and progress metrics."
    }
  ];

  const testimonials = [
    {
      avatar: "AC",
      name: "Alex Chen",
      role: "Software Engineer @ Google",
      quote: "\"DevScope AI helped me identify gaps in my GitHub profile that I never noticed. Landed my dream job!\""
    },
    {
      avatar: "SK",
      name: "Sarah Kim",
      role: "Full Stack Dev @ Stripe",
      quote: "\"The recruiter simulation was eye-opening. It completely changed how I present my portfolio.\""
    },
    {
      avatar: "JP",
      name: "James Patel",
      role: "ML Engineer @ OpenAI",
      quote: "\"The skill gap analysis gave me a clear roadmap. Within 3 months, I had the skills to transition into AI.\""
    }
  ];

  const faqs = [
    {
      q: "How does the GitHub analysis work?",
      a: "We use AI to analyze your public GitHub profile including repository quality, commit patterns, README quality, tech diversity, and overall project complexity to generate a comprehensive score."
    },
    {
      q: "Is my data secure?",
      a: "Absolutely. All uploaded files are encrypted and processed securely. We never store your raw files permanently — only the extracted analysis data."
    },
    {
      q: "Can I use DevScope AI for free?",
      a: "Yes! Our free tier includes basic analyses. Upgrade to Pro for unlimited access to all features including the AI Career Coach and Recruiter Simulator."
    },
    {
      q: "How accurate is the ATS scoring?",
      a: "Our ATS scoring model is trained on patterns from major ATS systems used by Fortune 500 companies, achieving 90%+ accuracy on keyword matching and formatting analysis."
    }
  ];

  return (
    <div className="landing-page animate-fade-in">
      {/* Header */}
      <header className="header">
        <div className="container header-container">
          <a href="#" className="logo">
            <div className="logo-icon">⚡</div>
            DevScope AI
          </a>
          <nav className="nav-links">
            <a href="#features" className="nav-link">Features</a>
            <a href="#pricing" className="nav-link">Pricing</a>
            <a href="#faq" className="nav-link">FAQ</a>
          </nav>
          <div className="header-actions">
            {user ? (
              <>
                <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                  Hi, <strong>{user.username}</strong>
                </span>
                <button className="btn btn-secondary btn-sm" onClick={onLogout}>Log Out</button>
              </>
            ) : (
              <>
                <button className="login-link" style={{ background: 'none', border: 'none', cursor: 'pointer' }} onClick={onLoginClick}>
                  Log In
                </button>
                <button className="btn btn-primary btn-sm" onClick={onGetStarted}>Get Started →</button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="hero">
        <div className="container">
          <div className="hero-badge-container">
            <div className="hero-badge">
              <span className="dot"></span>
              AI-Powered Portfolio Intelligence
            </div>
          </div>
          <h1 className="hero-title">
            See Your Profile <br />
            <span className="text-gradient">Through a Recruiter’s Eyes</span>
          </h1>
          <p className="hero-description">
            Analyze your GitHub, resume & LinkedIn with AI. Get recruiter-grade feedback, ATS scoring, skill-gap analysis, and a personalized career roadmap.
          </p>
          <div className="hero-actions">
            <button className="btn btn-primary" onClick={onGetStarted}>
              Start Free Analysis <ArrowRight size={16} />
            </button>
            <a href="#features" className="btn btn-secondary">See How It Works</a>
          </div>

          {/* Metrics bar */}
          <div className="metrics-wrapper">
            <div className="metrics-card">
              <div className="metric-item">
                <div className="metric-val">{scores.portfolio}</div>
                <div className="metric-label">Portfolio Score</div>
              </div>
              <div className="metric-item">
                <div className="metric-val">{scores.ats}</div>
                <div className="metric-label">ATS Score</div>
              </div>
              <div className="metric-item">
                <div className="metric-val">{scores.github}</div>
                <div className="metric-label">GitHub Score</div>
              </div>
              <div className="metric-item">
                <div className="metric-val">{scores.careerReady}</div>
                <div className="metric-label">Career Ready</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="features-section">
        <div className="container">
          <h2 className="section-title">Everything You Need to Stand Out</h2>
          <p className="section-subtitle">
            Comprehensive tools to analyze, improve, and showcase your developer profile
          </p>
          
          <div className="features-grid">
            {features.map((feature, idx) => (
              <div className="card feature-card" key={idx}>
                <div className="feature-icon-wrapper">
                  {feature.icon}
                </div>
                <h3>{feature.title}</h3>
                <p>{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="testimonials-section">
        <div className="container">
          <h2 className="section-title" style={{ marginBottom: '56px' }}>Loved by Developers</h2>
          <div className="testimonials-grid">
            {testimonials.map((t, idx) => (
              <div className="card testimonial-card" key={idx}>
                <div className="stars">★★★★★</div>
                <p className="testimonial-quote">{t.quote}</p>
                <div className="testimonial-author">
                  <div className="author-avatar">{t.avatar}</div>
                  <div>
                    <div className="author-name">{t.name}</div>
                    <div className="author-role">{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="faq-section">
        <div className="container">
          <h2 className="section-title" style={{ textAlign: 'center', marginBottom: '56px' }}>Frequently Asked Questions</h2>
          <div className="faq-list">
            {faqs.map((faq, idx) => (
              <div 
                className={`faq-item ${activeFaq === idx ? 'active' : ''}`} 
                key={idx}
              >
                <button className="faq-question" onClick={() => toggleFaq(idx)}>
                  {faq.q}
                  <Plus size={18} className="faq-icon" />
                </button>
                <div className="faq-answer">
                  <p>{faq.a}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="container footer-container">
          <a href="#" className="logo">
            <div className="logo-icon">⚡</div>
            DevScope AI
          </a>
          <div className="footer-links">
            <a href="#" className="footer-link">Privacy Policy</a>
            <a href="#" className="footer-link">Terms of Service</a>
            <a href="#" className="footer-link">Contact</a>
          </div>
          <div className="copyright">
            © 2026 DevScope AI. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}

export default LandingPage;
