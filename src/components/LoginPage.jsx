import React, { useState, useEffect, useRef } from 'react';
import { API_BASE_URL } from '../config.js';
import { Mail, Lock, User, AlertCircle, ArrowRight, Loader2, Star, Shield, Users, BarChart3, Clock, Sparkles } from 'lucide-react';
import AmbientBackground from './AmbientBackground.jsx';

const TERMINAL_LINES = [
  { delay: 0,    type: 'ok',  text: 'Resume Parsed' },
  { delay: 350,  type: 'sys', text: 'Skills Extracted' },
  { delay: 700,  type: 'ok',  text: 'ATS Evaluation Complete' },
  { delay: 1050, type: 'sys', text: 'GitHub Repositories Indexed' },
  { delay: 1400, type: 'sys', text: 'Technology Graph Built' },
  { delay: 1750, type: 'ok',  text: 'Portfolio Analysis Complete' },
  { delay: 2100, type: 'ok',  text: 'LinkedIn Profile Parsed' },
  { delay: 2450, type: 'sys', text: 'Keyword Visibility Evaluated' },
  { delay: 2800, type: 'ok',  text: 'Recruiter Visibility Complete' },
  { delay: 3150, type: 'ok',  text: 'Candidate Profile Generated' },
];

function CandidateIntelligenceEngineVisual() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationId;
    
    const dpr = window.devicePixelRatio || 1;
    const width = 360;
    const height = 220;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.scale(dpr, dpr);

    const inputs = [
      { id: 'resume', label: 'Resume', y: 45 },
      { id: 'github', label: 'GitHub', y: 88 },
      { id: 'linkedin', label: 'LinkedIn', y: 131 },
      { id: 'job', label: 'Job Role', y: 174 }
    ];

    const outputs = [
      { id: 'ats', label: 'ATS Analysis', y: 30 },
      { id: 'skill', label: 'Skill Verification', y: 70 },
      { id: 'match', label: 'Job Match', y: 110 },
      { id: 'gap', label: 'Project Gap Analysis', y: 150 },
      { id: 'report', label: 'Candidate Report', y: 190 }
    ];

    const cx = 150;
    const cy = height / 2;

    const inX = 60;
    const outX = 240;

    const particles = [];

    const spawnInputParticle = () => {
      const input = inputs[Math.floor(Math.random() * inputs.length)];
      particles.push({
        type: 'in',
        x: inX,
        y: input.y,
        targetX: cx,
        targetY: cy,
        progress: 0,
        speed: 0.006 + Math.random() * 0.003
      });
    };

    const spawnOutputParticle = () => {
      const output = outputs[Math.floor(Math.random() * outputs.length)];
      particles.push({
        type: 'out',
        x: cx,
        y: cy,
        targetX: outX,
        targetY: output.y,
        progress: 0,
        speed: 0.006 + Math.random() * 0.003
      });
    };

    let frameCount = 0;
    let engineAngle = 0;

    const draw = () => {
      ctx.clearRect(0, 0, width, height);

      // Grid Overlay
      ctx.strokeStyle = 'rgba(249, 115, 22, 0.025)';
      ctx.lineWidth = 1;
      for (let i = 0; i < width; i += 15) {
        ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, height); ctx.stroke();
      }
      for (let i = 0; i < height; i += 15) {
        ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(width, i); ctx.stroke();
      }

      ctx.lineWidth = 1;
      
      // Draw Input Lines & Nodes
      inputs.forEach(input => {
        ctx.beginPath();
        ctx.moveTo(inX, input.y);
        ctx.bezierCurveTo(inX + 30, input.y, cx - 40, cy, cx, cy);
        ctx.strokeStyle = 'rgba(64, 64, 64, 0.25)';
        ctx.stroke();
        
        ctx.beginPath();
        ctx.arc(inX, input.y, 2.5, 0, Math.PI * 2);
        ctx.fillStyle = '#0a0a0a';
        ctx.fill();
        ctx.strokeStyle = '#404040';
        ctx.stroke();

        ctx.fillStyle = '#a3a3a3';
        ctx.font = '9px "JetBrains Mono", monospace';
        ctx.textAlign = 'right';
        ctx.fillText(input.label, inX - 8, input.y + 3);
      });

      // Draw Output Lines & Nodes
      outputs.forEach(output => {
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.bezierCurveTo(cx + 40, cy, outX - 30, output.y, outX, output.y);
        ctx.strokeStyle = 'rgba(64, 64, 64, 0.25)';
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(outX, output.y, 2.5, 0, Math.PI * 2);
        ctx.fillStyle = '#0a0a0a';
        ctx.fill();
        ctx.strokeStyle = '#404040';
        ctx.stroke();

        ctx.fillStyle = '#a3a3a3';
        ctx.font = '9px "JetBrains Mono", monospace';
        ctx.textAlign = 'left';
        ctx.fillText(output.label, outX + 8, output.y + 3);
      });

      // Particles
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.progress += p.speed;
        
        if (p.progress >= 1) {
          if (p.type === 'in') spawnOutputParticle();
          particles.splice(i, 1);
          continue;
        }

        const t = p.progress;
        const u = 1 - t;
        const tt = t * t;
        const uu = u * u;
        const uuu = uu * u;
        const ttt = tt * t;

        let px, py;
        if (p.type === 'in') {
          const cp1x = inX + 30, cp1y = p.y;
          const cp2x = cx - 40, cp2y = cy;
          px = uuu * p.x + 3 * uu * t * cp1x + 3 * u * tt * cp2x + ttt * p.targetX;
          py = uuu * p.y + 3 * uu * t * cp1y + 3 * u * tt * cp2y + ttt * p.targetY;
        } else {
          const cp1x = cx + 40, cp1y = cy;
          const cp2x = outX - 30, cp2y = p.targetY;
          px = uuu * p.x + 3 * uu * t * cp1x + 3 * u * tt * cp2x + ttt * p.targetX;
          py = uuu * p.y + 3 * uu * t * cp1y + 3 * u * tt * cp2y + ttt * p.targetY;
        }

        ctx.beginPath();
        const size = 1.0;
        ctx.arc(px, py, size, 0, Math.PI * 2);
        
        const alpha = Math.min(1, Math.sin(p.progress * Math.PI) * 2.5);
        ctx.fillStyle = `rgba(249, 115, 22, ${alpha})`;
        ctx.shadowColor = 'rgba(249, 115, 22, 0.8)';
        ctx.shadowBlur = 4;
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      // Engine Center
      engineAngle += 0.015;

      // Outer thin orbit
      ctx.beginPath();
      ctx.arc(cx, cy, 26, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(249, 115, 22, 0.08)';
      ctx.lineWidth = 0.5;
      ctx.stroke();

      // Dashed rotating ring
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(engineAngle);
      ctx.beginPath();
      ctx.arc(0, 0, 18, 0, Math.PI * 2);
      ctx.setLineDash([2, 4]);
      ctx.strokeStyle = 'rgba(249, 115, 22, 0.3)';
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.restore();

      // Inner core glow
      const pulse = Math.sin(Date.now() / 800) * 0.15 + 0.6;
      const coreGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, 12);
      coreGrad.addColorStop(0, `rgba(249, 115, 22, ${pulse})`);
      coreGrad.addColorStop(1, 'rgba(249, 115, 22, 0)');
      ctx.beginPath();
      ctx.arc(cx, cy, 12, 0, Math.PI * 2);
      ctx.fillStyle = coreGrad;
      ctx.fill();

      // Center dot
      ctx.beginPath();
      ctx.arc(cx, cy, 2, 0, Math.PI * 2);
      ctx.fillStyle = '#fff';
      ctx.shadowColor = '#F97316';
      ctx.shadowBlur = 6;
      ctx.fill();
      ctx.shadowBlur = 0;

      // Engine Label
      ctx.fillStyle = 'rgba(249, 115, 22, 0.9)';
      ctx.font = 'bold 9px "JetBrains Mono", monospace';
      ctx.textAlign = 'center';
      ctx.fillText('DevScope', cx, cy + 35);
      ctx.fillStyle = '#888888';
      ctx.font = '8px "JetBrains Mono", monospace';
      ctx.fillText('Intelligence Engine', cx, cy + 45);

      if (frameCount % 18 === 0) spawnInputParticle();
      frameCount++;

      animationId = requestAnimationFrame(draw);
    };

    draw();
    return () => cancelAnimationFrame(animationId);
  }, []);

  return (
    <div className="relative w-full max-w-[360px] h-[220px] flex items-center justify-center mb-6 select-none -ml-4">
      <canvas ref={canvasRef} className="block w-full h-full" />
    </div>
  );
}

function TerminalPanel() {
  const [visibleLines, setVisibleLines] = useState([]);
  const [showReport, setShowReport] = useState(false);

  useEffect(() => {
    const timeouts = [];
    TERMINAL_LINES.forEach((line) => {
      const id = setTimeout(() => {
        setVisibleLines(prev => {
          if (prev.some(p => p.text === line.text)) return prev;
          return [...prev, line];
        });
      }, line.delay);
      timeouts.push(id);
    });
    const reportId = setTimeout(() => setShowReport(true), 4000);
    
    return () => {
      timeouts.forEach(clearTimeout);
      clearTimeout(reportId);
    };
  }, []);

  return (
    <div className="flex-1 bg-[#080808]/90 flex flex-col p-10 overflow-y-auto relative custom-scrollbar" style={{ backdropFilter: 'blur(2px)', WebkitBackdropFilter: 'blur(2px)' }}>
      {/* Grid background */}
      <div className="absolute inset-0 opacity-5 pointer-events-none" style={{
        backgroundImage: 'linear-gradient(rgba(249, 115, 22, 0.15) 1px, transparent 1px), linear-gradient(90deg, rgba(249, 115, 22, 0.15) 1px, transparent 1px)',
        backgroundSize: '48px 48px'
      }} />

      <div className="relative z-10 flex-1 flex flex-col max-w-[960px] mx-auto w-full">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-2 h-2 rounded-full bg-[#FF7A1A] animate-pulse" />
          <h2 className="text-[#D0D0D0] font-mono text-xs uppercase tracking-widest font-semibold">Live System Pipeline</h2>
        </div>

        {/* Real-time Technical Pipeline Stream */}
        <div className="font-mono bg-[#0c0c0c] border border-[#252525] rounded-lg p-5 mb-8">
          <div className="flex items-center justify-between border-b border-[#252525] pb-3 mb-4 text-[#9A9A9A] text-[11px]">
            <span>ENGINE: V4.1-GEMINI-HYBRID</span>
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
              PIPELINE ACTIVE
            </span>
          </div>

          <div className="space-y-2.5 min-h-[200px]">
            {visibleLines.map((line, i) => (
              <div key={i} className="flex items-center gap-3 text-xs animate-fade-in-up" style={{ animationDelay: '50ms' }}>
                <span className="text-[#9A9A9A] select-none">0{i+1}.</span>
                {line.type === 'ok' ? (
                  <span className="text-[#FF7A1A] font-bold shrink-0">[SUCCESS]</span>
                ) : (
                  <span className="text-[#888] font-bold shrink-0">[INDEX]</span>
                )}
                <span className={line.type === 'ok' ? 'text-white font-medium' : 'text-[#9A9A9A]'}>
                  {line.text}
                </span>
                <span className="ml-auto text-[10px] text-[#9A9A9A]">READY</span>
              </div>
            ))}
            {visibleLines.length < TERMINAL_LINES.length && (
              <div className="flex items-center gap-2 text-xs text-[#FF7A1A] font-bold animate-pulse font-mono pl-6">
                <span>■</span>
                <span className="tracking-widest">PROCESSING STREAM...</span>
              </div>
            )}
          </div>
        </div>

        {/* Candidate Report Card */}
        {showReport && (
          <div className="border border-[#252525] rounded-lg overflow-hidden animate-fade-in-up bg-[#0f0f0f] shadow-2xl">
            {/* Dossier Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#252525] bg-[#111111]">
              <div className="flex items-center gap-2.5">
                <div className="w-2.5 h-2.5 rounded-full bg-[#FF7A1A] animate-pulse" />
                <span className="text-white text-xs font-bold uppercase tracking-wider font-mono">Demo Profile: Staff Frontend Architect</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-[#FF7A1A] text-[10px] bg-[#FF7A1A]/10 px-2.5 py-0.5 border border-[#FF7A1A]/20 font-mono font-bold tracking-widest uppercase rounded-sm">Verified Dossier</span>
                <span className="text-[#9A9A9A] text-xs font-mono">ID: ALX-4902-SE</span>
              </div>
            </div>

            {/* Metrics Row */}
            <div className="grid grid-cols-3 gap-px bg-[#1A1A1A] border-b border-[#252525]">
              <div className="bg-[#0B0B0B] p-4 text-center">
                <div className="text-[#9A9A9A] text-[10px] uppercase font-bold tracking-wider mb-0.5 font-mono">ATS Compatibility</div>
                <div className="text-2xl font-mono font-bold text-white">87<span className="text-xs text-[#9A9A9A]">%</span></div>
                <div className="w-16 mx-auto bg-[#1A1A1A] h-1 rounded-full mt-2 overflow-hidden">
                  <div className="bg-[#FF7A1A] h-full" style={{ width: '87%' }} />
                </div>
              </div>
              <div className="bg-[#0B0B0B] p-4 text-center">
                <div className="text-[#9A9A9A] text-[10px] uppercase font-bold tracking-wider mb-0.5 font-mono">Technical Evidence</div>
                <div className="text-2xl font-mono font-bold text-white">94<span className="text-xs text-[#9A9A9A]">%</span></div>
                <div className="w-16 mx-auto bg-[#1A1A1A] h-1 rounded-full mt-2 overflow-hidden">
                  <div className="bg-[#FF7A1A] h-full" style={{ width: '94%' }} />
                </div>
              </div>
              <div className="bg-[#0B0B0B] p-4 text-center">
                <div className="text-[#9A9A9A] text-[10px] uppercase font-bold tracking-wider mb-0.5 font-mono">Recruiter Confidence</div>
                <div className="text-2xl font-mono font-bold text-white">89<span className="text-xs text-[#9A9A9A]">%</span></div>
                <div className="w-16 mx-auto bg-[#1A1A1A] h-1 rounded-full mt-2 overflow-hidden">
                  <div className="bg-[#FF7A1A] h-full" style={{ width: '89%' }} />
                </div>
              </div>
            </div>

            {/* Two Column Layout */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-px bg-[#1A1A1A]">
              {/* Left column (3/5 width on wide screens) */}
              <div className="md:col-span-3 bg-[#0B0B0B] p-5 space-y-5">
                {/* Verified Strengths */}
                <div>
                  <div className="flex items-center gap-2 mb-2.5">
                    <span className="text-[#FF7A1A] text-xs font-bold uppercase tracking-wider font-mono">✔ Verified Strengths</span>
                  </div>
                  <ul className="space-y-2">
                    <li className="text-[#D0D0D0] text-xs leading-relaxed flex items-start gap-2">
                      <span className="text-[#FF7A1A] mt-0.5 shrink-0">▪</span>
                      <span>Monorepo architecture design (Turborepo, pnpm workspaces, and strict dependency boundaries).</span>
                    </li>
                    <li className="text-[#D0D0D0] text-xs leading-relaxed flex items-start gap-2">
                      <span className="text-[#FF7A1A] mt-0.5 shrink-0">▪</span>
                      <span>Custom lint/compiler tooling (developed AST parser extensions for design system constraints).</span>
                    </li>
                    <li className="text-[#D0D0D0] text-xs leading-relaxed flex items-start gap-2">
                      <span className="text-[#FF7A1A] mt-0.5 shrink-0">▪</span>
                      <span>High-frequency contribution history (380+ commits in active open-source projects this year).</span>
                    </li>
                  </ul>
                </div>

                {/* Portfolio & Code Observations */}
                <div>
                  <div className="flex items-center gap-2 mb-2.5">
                    <span className="text-[#D0D0D0] text-xs font-bold uppercase tracking-wider font-mono">↗ Portfolio & Code Observations</span>
                  </div>
                  <ul className="space-y-2">
                    <li className="text-[#9A9A9A] text-xs leading-relaxed flex items-start gap-2">
                      <span className="text-[#9A9A9A] mt-0.5 shrink-0">▪</span>
                      <span>Deep accessibility enforcement (WCAG AA standards, screen-reader landmarks, and ARIA attributes).</span>
                    </li>
                    <li className="text-[#9A9A9A] text-xs leading-relaxed flex items-start gap-2">
                      <span className="text-[#9A9A9A] mt-0.5 shrink-0">▪</span>
                      <span>Excellent modular separation (clear boundaries between state container and layout components).</span>
                    </li>
                  </ul>
                </div>

                {/* Areas to Probe */}
                <div>
                  <div className="flex items-center gap-2 mb-2.5">
                    <span className="text-[#9A9A9A] text-xs font-bold uppercase tracking-wider font-mono">⚠ Areas to Probe (Hiring Checks)</span>
                  </div>
                  <ul className="space-y-2">
                    <li className="text-[#9A9A9A] text-xs leading-relaxed flex items-start gap-2">
                      <span className="text-[#9A9A9A] mt-0.5 shrink-0">▪</span>
                      <span>Limited relational database usage or serverless infrastructure scaling in public portfolio repositories.</span>
                    </li>
                    <li className="text-[#9A9A9A] text-xs leading-relaxed flex items-start gap-2">
                      <span className="text-[#9A9A9A] mt-0.5 shrink-0">▪</span>
                      <span>No evidence of automated CI/CD workflows or infrastructure-as-code scripts in personal libraries.</span>
                    </li>
                  </ul>
                </div>
              </div>

              {/* Right column (2/5 width) */}
              <div className="md:col-span-2 bg-[#0B0B0B] p-5 space-y-5 border-t md:border-t-0 md:border-l border-[#252525]">
                {/* Repository Insights */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[#D0D0D0] text-xs font-bold uppercase tracking-wider font-mono">Repository Audits</span>
                    <span className="text-[10px] text-[#9A9A9A] font-mono">GitHub API</span>
                  </div>
                  <div className="space-y-2.5">
                    <div className="border border-[#252525] bg-[#090909] rounded p-2.5">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-[#FF7A1A] text-xs font-mono font-bold">core-design-system</span>
                        <span className="text-[#9A9A9A] text-[9px] font-mono">94% Quality</span>
                      </div>
                      <div className="text-[10px] text-[#9A9A9A] leading-tight mb-1">Turborepo component workspace with Storybook.</div>
                      <div className="h-1 bg-[#1A1A1A] w-full rounded-full overflow-hidden">
                        <div className="bg-[#FF7A1A] h-full" style={{ width: '94%' }} />
                      </div>
                    </div>
                    <div className="border border-[#252525] bg-[#090909] rounded p-2.5">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-white text-xs font-mono font-bold">ast-token-linter</span>
                        <span className="text-[#9A9A9A] text-[9px] font-mono">88% Quality</span>
                      </div>
                      <div className="text-[10px] text-[#9A9A9A] leading-tight mb-1">Custom ESLint parser to enforce styling rules.</div>
                      <div className="h-1 bg-[#1A1A1A] w-full rounded-full overflow-hidden">
                        <div className="bg-[#a3a3a3] h-full" style={{ width: '88%' }} />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Recruiter Observation Panel */}
                <div className="border border-[#3c220f] bg-[#1a0e05]/50 p-4 rounded">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-[#FF7A1A] text-xs font-bold uppercase tracking-wider font-mono">Recruiter Observation</span>
                  </div>
                  <p className="text-[#c1a086] text-[11px] leading-relaxed italic">
                    "Candidate demonstrates exceptional frontend architecture and developer tooling capabilities, with verified contribution consistency. Their design system structure and AST parsing projects are exceptional. However, there is a lack of public backend service evidence. In interviews, probe their system-design depth, especially on postgres database design and server-side performance optimization, to verify staff-level capability."
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function LoginPage({ onAuthSuccess }) {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeMethod, setActiveMethod] = useState(null); // 'email' | null

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const endpoint = isLogin ? `${API_BASE_URL}/api/auth/login` : `${API_BASE_URL}/api/auth/register`;
    const payload = isLogin
      ? { email, password }
      : { username, email, password };

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await response.json();

      if (response.ok) {
        localStorage.setItem('devscope_token', data.token);
        localStorage.setItem('devscope_user', JSON.stringify(data.user));
        onAuthSuccess(data.user, data.token);
      } else {
        setError(data.error || 'Authentication failed. Please check your credentials.');
        setLoading(false);
      }
    } catch (err) {
      console.error(err);
      setError('Connection to auth server failed. Please ensure the backend is running.');
      setLoading(false);
    }
  };

  return (
    <div className="h-screen w-screen flex overflow-hidden bg-[#050505]" style={{ fontFamily: "'Inter', 'JetBrains Mono', monospace", position: 'relative' }}>
      {/* Enterprise ambient motion — behind all login UI */}
      <AmbientBackground />

      {/* All content above canvas */}
      <div style={{ position: 'relative', zIndex: 1, display: 'flex', width: '100%', height: '100%', overflow: 'hidden' }}>
      {/* LEFT — Terminal Preview */}
      <TerminalPanel />

      {/* Divider */}
      <div className="w-px bg-[#151515] shrink-0" />

      {/* RIGHT — Auth Panel */}
      <div className="w-[460px] shrink-0 flex flex-col items-center justify-between bg-[#080808]/88 px-12 py-8 relative overflow-y-auto custom-scrollbar" style={{ backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)' }}>
        {/* Corner accents */}
        <div className="absolute top-0 left-0 w-12 h-12 border-t border-l border-[#FF7A1A]/20 pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-12 h-12 border-b border-r border-[#FF7A1A]/20 pointer-events-none" />

        {/* Top Spacer / Visual Group */}
        <div className="w-full flex flex-col items-center mt-4 mb-4">
          {/* Animated 3D Engine Orb */}
          <CandidateIntelligenceEngineVisual />

          {/* Logo */}
          <div className="text-center">
            <h1 className="text-white font-black text-3xl tracking-tight mb-1 font-mono">DevScope</h1>
            <p className="text-[#FF7A1A] text-[10px] tracking-widest uppercase font-bold font-mono">Candidate Intelligence Platform</p>
          </div>

          {/* Pipeline Integration Visual */}
          <div className="mt-6 flex flex-col items-center w-full max-w-[340px] select-none">
            <div className="flex justify-between items-center w-full text-[8.5px] font-mono font-bold uppercase tracking-wider text-[#9A9A9A]">
              <span className="bg-[#0f0f0f] border border-[#252525] px-2 py-1 rounded-sm">Resume</span>
              <div className="flex-1 h-px relative overflow-hidden bg-[#151515] mx-1">
                <div className="absolute top-0 left-0 h-full w-1/3 bg-gradient-to-r from-transparent via-[#FF7A1A] to-transparent animate-[data-stream_1.5s_linear_infinite]" />
              </div>
              <span className="bg-[#0f0f0f] border border-[#252525] px-2 py-1 rounded-sm">GitHub</span>
              <div className="flex-1 h-px relative overflow-hidden bg-[#151515] mx-1">
                <div className="absolute top-0 left-0 h-full w-1/3 bg-gradient-to-r from-transparent via-[#FF7A1A] to-transparent animate-[data-stream_1.5s_linear_infinite_0.2s]" />
              </div>
              <span className="bg-[#0f0f0f] border border-[#252525] px-2 py-1 rounded-sm">LinkedIn</span>
              <div className="flex-1 h-px relative overflow-hidden bg-[#151515] mx-1">
                <div className="absolute top-0 left-0 h-full w-1/3 bg-gradient-to-r from-transparent via-[#FF7A1A] to-transparent animate-[data-stream_1.5s_linear_infinite_0.4s]" />
              </div>
              <span className="bg-[#0f0f0f] border border-[#252525] px-2 py-1 rounded-sm">Job Match</span>
            </div>
            
            <div className="flex flex-col items-center mt-2.5">
              <div className="h-4 w-px relative overflow-hidden bg-[#151515]">
                <div className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-transparent via-[#FF7A1A] to-transparent animate-[data-stream-y_1.5s_linear_infinite]" />
              </div>
              <div className="text-[#FF7A1A] text-[10px] font-mono font-bold uppercase tracking-widest bg-[#FF7A1A]/10 px-4 py-1.5 border border-[#FF7A1A]/20 rounded-sm mt-1 flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-[#FF7A1A] animate-pulse" />
                Candidate Intelligence
              </div>
            </div>
          </div>
        </div>

        {/* Center / Auth Form */}
        <div className="w-full my-auto py-4">
          {activeMethod === 'email' ? (
            <div className="w-full">
              <button
                onClick={() => { setActiveMethod(null); setError(''); }}
                className="text-[#9A9A9A] text-xs hover:text-white transition-colors mb-5 flex items-center gap-1 font-mono"
              >
                ← Back to options
              </button>

              {/* Login / Register toggle */}
              <div className="flex border border-[#252525] rounded mb-5 overflow-hidden">
                <button
                  onClick={() => { setIsLogin(true); setError(''); }}
                  className={`flex-1 py-2 text-xs font-bold uppercase tracking-wider transition-all font-mono ${isLogin ? 'bg-[#FF7A1A] text-black' : 'text-[#9A9A9A] hover:text-white'}`}
                >Sign In</button>
                <button
                  onClick={() => { setIsLogin(false); setError(''); }}
                  className={`flex-1 py-2 text-xs font-bold uppercase tracking-wider transition-all font-mono ${!isLogin ? 'bg-[#FF7A1A] text-black' : 'text-[#9A9A9A] hover:text-white'}`}
                >Register</button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {!isLogin && (
                  <div>
                    <label className="text-[#9A9A9A] text-[10px] uppercase tracking-wider block mb-1 font-mono font-bold">Username</label>
                    <div className="relative">
                      <User size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9A9A9A]" />
                      <input
                        type="text"
                        value={username}
                        onChange={e => setUsername(e.target.value)}
                        required={!isLogin}
                        placeholder="johndoe"
                        className="w-full pl-9 pr-4 py-2.5 bg-[#0B0B0B] border border-[#252525] text-white text-xs placeholder-[#9A9A9A] focus:outline-none focus:border-[#FF7A1A] transition-colors rounded-sm"
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label className="text-[#9A9A9A] text-[10px] uppercase tracking-wider block mb-1 font-mono font-bold">Email Address</label>
                  <div className="relative">
                    <Mail size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9A9A9A]" />
                    <input
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      required
                      placeholder="you@example.com"
                      className="w-full pl-9 pr-4 py-2.5 bg-[#0B0B0B] border border-[#252525] text-white text-xs placeholder-[#9A9A9A] focus:outline-none focus:border-[#FF7A1A] transition-colors rounded-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[#9A9A9A] text-[10px] uppercase tracking-wider block mb-1 font-mono font-bold">Password</label>
                  <div className="relative">
                    <Lock size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9A9A9A]" />
                    <input
                      type="password"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      required
                      placeholder="••••••••"
                      className="w-full pl-9 pr-4 py-2.5 bg-[#0B0B0B] border border-[#252525] text-white text-xs placeholder-[#9A9A9A] focus:outline-none focus:border-[#FF7A1A] transition-colors rounded-sm"
                    />
                  </div>
                </div>

                {error && (
                  <div className="flex items-start gap-2 p-3 border border-red-500/20 bg-red-500/5 rounded-sm">
                    <AlertCircle size={13} className="text-red-500 mt-0.5 shrink-0" />
                    <p className="text-red-400 text-xs leading-tight">{error}</p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-[#FF7A1A] text-black font-bold text-xs uppercase tracking-widest hover:bg-[#FF8A2A] hover:-translate-y-[1px] hover:shadow-[0_4px_12px_rgba(249,115,22,0.15)] transition-all duration-300 disabled:opacity-60 flex items-center justify-center gap-2 font-mono rounded-sm"
                >
                  {loading ? <Loader2 size={14} className="animate-spin" /> : (
                    <>
                      <Mail size={13} />
                      {isLogin ? 'Sign In' : 'Register Account'}
                      <ArrowRight size={13} className="ml-1" />
                    </>
                  )}
                </button>
              </form>
            </div>
          ) : (
            <div className="w-full space-y-3">
              <button
                onClick={() => setActiveMethod('email')}
                className="w-full py-3 border border-dashed border-[#FF7A1A]/40 text-white text-xs font-bold uppercase tracking-widest hover:bg-[#FF7A1A]/5 hover:border-[#FF7A1A] hover:-translate-y-[1px] transition-all duration-300 flex items-center justify-center gap-3 font-mono rounded-sm"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                Continue with Google
              </button>

              <button
                onClick={() => setActiveMethod('email')}
                className="w-full py-3 border border-dashed border-[#FF7A1A]/40 text-white text-xs font-bold uppercase tracking-widest hover:bg-[#FF7A1A]/5 hover:border-[#FF7A1A] hover:-translate-y-[1px] transition-all duration-300 flex items-center justify-center gap-3 font-mono rounded-sm"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0 1 12 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z"/>
                </svg>
                Continue with GitHub
              </button>

              <div className="flex items-center gap-3 py-1 select-none">
                <div className="flex-1 h-px bg-[#151515]" />
                <span className="text-[#9A9A9A] text-[10px] uppercase tracking-widest font-mono">or</span>
                <div className="flex-1 h-px bg-[#151515]" />
              </div>

              <button
                onClick={() => setActiveMethod('email')}
                className="w-full py-3 bg-[#FF7A1A] text-black font-bold text-xs uppercase tracking-widest hover:bg-[#FF8A2A] hover:-translate-y-[1px] hover:shadow-[0_4px_12px_rgba(249,115,22,0.15)] transition-all duration-300 flex items-center justify-center gap-3 font-mono rounded-sm"
              >
                <Mail size={13} />
                Continue with Email
              </button>

              <p className="text-center text-[#9A9A9A] text-[10px] leading-relaxed pt-2">
                By continuing, you agree to our{' '}
                <span className="text-[#9A9A9A] hover:text-white cursor-pointer transition-colors font-mono">Terms</span>
                {' '}and{' '}
                <span className="text-[#9A9A9A] hover:text-white cursor-pointer transition-colors font-mono">Privacy</span>.
              </p>
            </div>
          )}
        </div>

        {/* Bottom / Trust & Stats Panel */}
        <div className="w-full border-t border-[#252525] pt-5 mt-4">
          <div className="text-[9px] font-mono text-[#9A9A9A] uppercase tracking-wider mb-3.5 text-center font-bold">Platform Intelligence Metrics</div>
          
          <div className="grid grid-cols-3 gap-2 text-center mb-4 select-none">
            <div className="border border-[#141414] bg-[#0B0B0B] p-2 rounded-sm hover:-translate-y-[1px] transition-all duration-500 hover:border-[#252525] hover:shadow-[0_4px_12px_rgba(0,0,0,0.5)]">
              <div className="text-white text-xs font-mono font-bold">12,842</div>
              <div className="text-[#9A9A9A] text-[8px] tracking-tight uppercase font-semibold font-mono">Scanned</div>
            </div>
            <div className="border border-[#141414] bg-[#0B0B0B] p-2 rounded-sm hover:-translate-y-[1px] transition-all duration-500 hover:border-[#252525] hover:shadow-[0_4px_12px_rgba(0,0,0,0.5)]">
              <div className="text-white text-xs font-mono font-bold">48x</div>
              <div className="text-[#9A9A9A] text-[8px] tracking-tight uppercase font-semibold font-mono">Faster</div>
            </div>
            <div className="border border-[#141414] bg-[#0B0B0B] p-2 rounded-sm hover:-translate-y-[1px] transition-all duration-500 hover:border-[#252525] hover:shadow-[0_4px_12px_rgba(0,0,0,0.5)]">
              <div className="text-[#22c55e] text-xs font-mono font-bold">+42%</div>
              <div className="text-[#9A9A9A] text-[8px] tracking-tight uppercase font-semibold font-mono">Efficiency</div>
            </div>
          </div>

          <div className="border border-[#1a130f] bg-[#0d0906]/60 p-3 rounded-sm">
            <p className="text-[#c1a086] text-[9.5px] leading-relaxed italic text-center">
              "DevScope revealed a critical database optimization gap in our lead candidate before the technical screen. Saved us 3 engineering hours."
            </p>
            <div className="text-[8px] font-mono text-[#735843] uppercase text-center mt-1.5 font-bold">
              — Director of Engineering, Linear
            </div>
          </div>
        </div>
      </div>

      </div>{/* end content-above-canvas wrapper */}

      <style>{`
        /* Smooth styling custom-scrollbar */
        .custom-scrollbar::-webkit-scrollbar {
          width: 5px;
          height: 5px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #000000;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #1f1f1f;
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #F97316;
        }
        
        @keyframes fade-in-up {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in-up {
          animation: fade-in-up 0.5s cubic-bezier(0.16, 1, 0.3, 1) both;
        }

        @keyframes data-stream {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(300%); }
        }
        
        @keyframes data-stream-y {
          0% { transform: translateY(-100%); }
          100% { transform: translateY(300%); }
        }
      `}</style>
    </div>
  );
}
