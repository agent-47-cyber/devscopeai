import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Github, Mail, CheckCircle2, CircleDashed, ArrowRight } from 'lucide-react';
import styles from './Login.module.css';
import { API_BASE_URL } from '../config.js';

export default function Login({ setIsAuthenticated }) {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Animation State
  const [step, setStep] = useState(0);

  useEffect(() => {
    // Sequence the animation steps
    const timers = [
      setTimeout(() => setStep(1), 800),   // Resume
      setTimeout(() => setStep(2), 1600),  // GitHub
      setTimeout(() => setStep(3), 2400),  // LinkedIn
      setTimeout(() => setStep(4), 3200),  // Job Match
      setTimeout(() => setStep(5), 4000),  // Reveal Insights
    ];
    return () => timers.forEach(clearTimeout);
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      if (response.ok) {
        const data = await response.json();
        localStorage.setItem('devscope_token', data.token);
        localStorage.setItem('devscope_user', JSON.stringify(data.user));
        setIsAuthenticated(true);
        navigate('/dashboard');
      } else {
        alert('Login failed. Check your credentials.');
      }
    } catch (err) {
      alert('Error logging in.');
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.leftSide}>
        <div className={styles.previewWrapper}>
          
          <div className={styles.reportMock}>
            <div className={styles.reportHeader}>
              <div className={styles.candidateName}>Intelligence Processing</div>
              <div className={styles.badge}>Live</div>
            </div>
            
            <div className={styles.processingList}>
              <div className={`${styles.processItem} ${step >= 1 ? styles.active : ''}`}>
                {step >= 1 ? <CheckCircle2 size={18} className={styles.iconSuccess} /> : <CircleDashed size={18} className={styles.iconPending} />}
                <span>Resume Analysis Complete</span>
              </div>
              <div className={`${styles.processItem} ${step >= 2 ? styles.active : ''}`}>
                {step >= 2 ? <CheckCircle2 size={18} className={styles.iconSuccess} /> : <CircleDashed size={18} className={styles.iconPending} />}
                <span>GitHub Analysis Complete</span>
              </div>
              <div className={`${styles.processItem} ${step >= 3 ? styles.active : ''}`}>
                {step >= 3 ? <CheckCircle2 size={18} className={styles.iconSuccess} /> : <CircleDashed size={18} className={styles.iconPending} />}
                <span>LinkedIn Analysis Complete</span>
              </div>
              <div className={`${styles.processItem} ${step >= 4 ? styles.active : ''}`}>
                {step >= 4 ? <CheckCircle2 size={18} className={styles.iconSuccess} /> : <CircleDashed size={18} className={styles.iconPending} />}
                <span>Job Match Complete</span>
              </div>
            </div>

            <div className={`${styles.insightsContainer} ${step >= 5 ? styles.visible : ''}`}>
              <div className={styles.divider}></div>
              
              <div className={styles.insightGrid}>
                <div className={styles.insightCard}>
                  <div className={styles.insightLabel}>Strengths</div>
                  <div className={styles.insightValue}>System Architecture, React</div>
                </div>
                <div className={styles.insightCard}>
                  <div className={styles.insightLabel}>Risks</div>
                  <div className={styles.insightValueWarning}>No Automated Testing</div>
                </div>
                <div className={styles.insightCard}>
                  <div className={styles.insightLabel}>Portfolio Gaps</div>
                  <div className={styles.insightValueError}>Cloud Infrastructure</div>
                </div>
              </div>

              <div className={styles.recommendationBox}>
                <div className={styles.insightLabel}>Primary Recommendation</div>
                <div className={styles.recommendationText}>
                  Deploy a full-stack project using AWS/GCP with a CI/CD pipeline to bridge the gap between mid-level evidence and senior expectations.
                </div>
              </div>
            </div>
          </div>
          
        </div>
      </div>
      
      <div className={styles.rightSide}>
        <div className={styles.authContainer}>
          <h2 className={styles.title}>Sign in to DevScope</h2>
          <p className={styles.subtitle}>Welcome back. Please enter your details.</p>

          <form className={styles.form} onSubmit={handleLogin}>
            <div className={styles.inputGroup}>
              <label>Email</label>
              <input 
                type="email" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                required 
                placeholder="Enter your email"
              />
            </div>
            <div className={styles.inputGroup}>
              <label>Password</label>
              <input 
                type="password" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                required 
                placeholder="Enter your password"
              />
            </div>
            <button type="submit" className={styles.primaryBtn}>
              Sign In <ArrowRight size={16} />
            </button>
          </form>

          <div className={styles.dividerAuth}>
            <span>or continue with</span>
          </div>

          <div className={styles.socialAuth}>
            <button className={styles.socialBtn}>
              <Github size={18} /> GitHub
            </button>
            <button className={styles.socialBtn}>
              <Mail size={18} /> Google
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
