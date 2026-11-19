'use client';

import React, { useEffect, useMemo, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import * as THREE from 'three';
import {
  ArrowRight,
  Check,
  FileText,
  Github,
  Linkedin,
  LockKeyhole,
  LogOut,
  Mail,
} from 'lucide-react';
import dynamic from 'next/dynamic';
import BootSequence from './BootSequence';

const IntelligenceGraph = dynamic(() => import('./IntelligenceGraph'), { ssr: false });

const pipelineSteps = [
  { id: '01', title: 'Resume Evidence', detail: 'Parse role history, keywords, impact claims', state: 'accepted' },
  { id: '02', title: 'Source Index', detail: 'Bind GitHub, LinkedIn, and target role signals', state: 'indexed' },
  { id: '03', title: 'Technical Validation', detail: 'Compare skills against observable project evidence', state: 'running' },
  { id: '04', title: 'Recruiter Read', detail: 'Translate candidate data into screening decisions', state: 'queued' },
  { id: '05', title: 'Candidate Dossier', detail: 'Generate the final evidence-backed hiring packet', state: 'ready' },
];

const evidenceRows = [
  { source: 'Resume', claim: 'Frontend architecture', proof: '8 shipped systems', score: 92 },
  { source: 'GitHub', claim: 'Code quality', proof: '84 repositories indexed', score: 88 },
  { source: 'LinkedIn', claim: 'Recruiter visibility', proof: '142 profile signals', score: 81 },
  { source: 'Role Brief', claim: 'Staff-level fit', proof: '12 requirement matches', score: 89 },
];

const metrics = [
  { label: 'ATS Readiness', value: '87', suffix: '%' },
  { label: 'Technical Confidence', value: '94', suffix: '%' },
  { label: 'Hiring Signal', value: '89', suffix: '%' },
];

const sidebarMetrics = [
  { label: 'Resume Signals', value: '2,488', meta: '+32 today' },
  { label: 'Projects Indexed', value: '84', meta: 'Updated 3m ago' },
  { label: 'LinkedIn Signals', value: '142', meta: 'Verified' },
];

const authProviders = [
  { id: 'google', label: 'Continue with Google', icon: Mail },
  { id: 'github', label: 'Continue with GitHub', icon: Github },
];

function useRotatingIndex(length, delay = 1800) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setIndex((current) => (current + 1) % length);
    }, delay);
    return () => window.clearInterval(timer);
  }, [length, delay]);

  return index;
}

function SystemBackground() {
  const mountRef = useRef(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    // 1. Setup Scene, Camera, Renderer
    const scene = new THREE.Scene();
    
    const camera = new THREE.PerspectiveCamera(40, window.innerWidth / window.innerHeight, 0.1, 100);
    camera.position.z = 10;

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: "high-performance" });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); // Cap pixel ratio for performance
    renderer.domElement.style.position = 'absolute';
    renderer.domElement.style.top = '0';
    renderer.domElement.style.left = '0';
    mount.appendChild(renderer.domElement);

    // 2. Abstract Geometric Structure (Folded Architectural Planes)
    const structureGroup = new THREE.Group();
    
    const material = new THREE.MeshStandardMaterial({
      color: 0x010101, // Ultra matte black
      roughness: 0.92,
      metalness: 0.15,
    });

    // Create several large, thin architectural planes intersecting
    const planesData = [
      { size: [12, 16, 0.1], pos: [0, 0, 0], rot: [0, Math.PI / 8, 0] },
      { size: [16, 8, 0.1], pos: [-1, 2, -1], rot: [Math.PI / 6, -Math.PI / 12, Math.PI / 16] },
      { size: [8, 20, 0.1], pos: [2, -2, -2], rot: [-Math.PI / 8, Math.PI / 4, 0] },
      { size: [18, 10, 0.1], pos: [-2, -4, -3], rot: [Math.PI / 12, -Math.PI / 6, -Math.PI / 8] },
      { size: [10, 14, 0.1], pos: [1, 3, -1.5], rot: [-Math.PI / 16, -Math.PI / 4, Math.PI / 12] }
    ];

    const geometries = [];
    planesData.forEach(data => {
      const geo = new THREE.BoxGeometry(data.size[0], data.size[1], data.size[2]);
      const mesh = new THREE.Mesh(geo, material);
      mesh.position.set(data.pos[0], data.pos[1], data.pos[2]);
      mesh.rotation.set(data.rot[0], data.rot[1], data.rot[2]);
      structureGroup.add(mesh);
      geometries.push(geo); // Keep track for disposal
    });

    structureGroup.position.set(-4, 0, -2); // Position behind left dashboard
    scene.add(structureGroup);

    // 3. Lighting (Cinematic)
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.02);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xF47A1F, 1.5);
    directionalLight.position.set(10, 20, 10);
    scene.add(directionalLight);

    const backLight = new THREE.DirectionalLight(0xF47A1F, 0.5);
    backLight.position.set(-10, 5, -10);
    scene.add(backLight);

    // MOUSE PARALLAX
    let mouseX = 0;
    let mouseY = 0;
    const handleMouseMove = (event) => {
      mouseX = (event.clientX / window.innerWidth) * 2 - 1;
      mouseY = -(event.clientY / window.innerHeight) * 2 + 1;
    };
    window.addEventListener('mousemove', handleMouseMove);

    // ANIMATION
    const startTime = Date.now();
    let frameId;

    const animate = () => {
      frameId = requestAnimationFrame(animate);
      const elapsedTime = (Date.now() - startTime) / 1000;

      structureGroup.rotation.y = elapsedTime * 0.02;
      structureGroup.rotation.z = Math.sin(elapsedTime * 0.1) * 0.05;
      structureGroup.position.y = Math.sin(elapsedTime * 0.2) * 1;
      
      // Apply subtle mouse parallax
      camera.position.x += (mouseX * 5 + 10 - camera.position.x) * 0.02;
      camera.position.y += (-mouseY * 5 + 8 - camera.position.y) * 0.02;
      camera.lookAt(0, -5, 0);

      renderer.render(scene, camera);
    };

    animate();

    // RESIZE HANDLER
    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(frameId);
      if (mount.contains(renderer.domElement)) {
        mount.removeChild(renderer.domElement);
      }
      geometries.forEach(g => g.dispose());
      material.dispose();
      renderer.dispose();
    };
  }, []);

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-0 bg-[#000000]">
      
      {/* Layer 0: 3D Scene Container */}
      <div ref={mountRef} className="absolute inset-0 z-0"></div>

      {/* Layer 1: Faint Engineering Grid (2% opacity) */}
      <div className="absolute -inset-[100px] opacity-[0.02] z-10 dsx-grid-drift" style={{
        backgroundImage: 'linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)',
        backgroundSize: '64px 64px',
      }} />

      {/* Layer 2: Tiny Drifting Particles (3% opacity) */}
      <div className="absolute inset-0 z-10">
        <div className="absolute top-[20%] left-[30%] w-1 h-1 bg-[#fafafa] rounded-full opacity-[0.03] ds-particle-drift" style={{ animationDelay: '0s' }}></div>
        <div className="absolute top-[80%] left-[70%] w-[2px] h-[2px] bg-[#F47A1F] rounded-full opacity-[0.03] ds-particle-drift" style={{ animationDelay: '4s', animationDuration: '25s' }}></div>
      </div>

      {/* Layer 4: Film Grain (1% opacity) */}
      <svg className="absolute w-0 h-0">
        <filter id="noise">
          <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="4" stitchTiles="stitch" />
        </filter>
      </svg>
      <div className="absolute inset-0 z-50 pointer-events-none opacity-[0.015] mix-blend-overlay dsx-grain" style={{ filter: 'url(#noise)' }}></div>

      {/* Layer 5: Vertical Scanline */}
      <div className="dsx-scan-line"></div>

      {/* Layer 6: Blinking Data Points */}
      <div className="absolute top-[45%] left-[25%] w-1 h-1 bg-[#F47A1F] rounded-full opacity-0 animate-[ds-blink_8s_infinite] z-20"></div>
      <div className="absolute bottom-[35%] right-[40%] w-1 h-1 bg-[#fafafa] rounded-full opacity-0 animate-[ds-blink_12s_infinite_4s] z-20"></div>
    </div>
  );
}

import { motion, AnimatePresence } from 'framer-motion';

function MainHeader() {
  return (
    <div className="relative w-full border border-[rgba(244,122,31,0.2)] bg-[rgba(255,255,255,0.015)] p-6 rounded-sm mb-6 flex flex-col items-center justify-center">
      {/* Corner Brackets */}
      <div className="absolute top-0 left-0 w-4 h-4 border-t border-l border-[#F47A1F]" />
      <div className="absolute top-0 right-0 w-4 h-4 border-t border-r border-[#F47A1F]" />
      <div className="absolute bottom-0 left-0 w-4 h-4 border-b border-l border-[#F47A1F]" />
      <div className="absolute bottom-0 right-0 w-4 h-4 border-b border-r border-[#F47A1F]" />

      {/* Top Indicators */}
      <div className="absolute top-4 left-4 flex items-center gap-2">
        <div className="w-1.5 h-1.5 rounded-full bg-[#F47A1F] animate-pulse" />
        <span className="text-[9px] uppercase tracking-[0.2em] font-mono text-[#F47A1F]">INITIALIZING DEVSCOPE AI</span>
      </div>
      <div className="absolute top-4 right-4 flex items-center gap-2">
        <div className="w-1.5 h-1.5 rounded-full bg-[#3DE273] animate-pulse" />
        <span className="text-[9px] uppercase tracking-[0.2em] font-mono text-[#3DE273]">SYSTEM ONLINE</span>
      </div>

      <IntelligenceCoreLogo />
    </div>
  );
}

function IntelligenceCoreLogo() {
  return (
    <div className="flex flex-col items-center justify-center py-6 w-full">
      <div className="relative w-20 h-20 flex items-center justify-center mb-4">
        {/* Ambient Glow */}
        <motion.div 
          className="absolute w-32 h-32 rounded-full bg-[#F47A1F] opacity-[0.05] blur-[20px] pointer-events-none"
          animate={{ scale: [1, 1.2, 1], opacity: [0.03, 0.08, 0.03] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        />
        
        {/* Outer Ring */}
        <motion.svg className="absolute inset-0 w-full h-full text-[#F47A1F] opacity-30" viewBox="0 0 100 100"
          animate={{ rotate: 360 }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        >
          <circle cx="50" cy="50" r="48" fill="none" stroke="currentColor" strokeWidth="0.5" strokeDasharray="4 8" />
        </motion.svg>

        {/* Orbiting Dot */}
        <motion.div 
          className="absolute inset-0 w-full h-full"
          animate={{ rotate: 360 }}
          transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
        >
          <div className="absolute top-0 left-1/2 w-1.5 h-1.5 -ml-[3px] bg-[#FAFAFA] rounded-full shadow-[0_0_5px_#FAFAFA]" />
        </motion.div>

        {/* Middle Ring */}
        <motion.svg className="absolute inset-2 w-auto h-auto text-[#F47A1F] opacity-50" viewBox="0 0 100 100"
          animate={{ rotate: -360 }}
          transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
        >
          <circle cx="50" cy="50" r="44" fill="none" stroke="currentColor" strokeWidth="1" strokeDasharray="12 4 4 4" />
        </motion.svg>

        {/* Inner Ring */}
        <motion.svg className="absolute inset-4 w-auto h-auto text-[#FAFAFA] opacity-40" viewBox="0 0 100 100"
          animate={{ rotate: 360 }}
          transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
        >
          <circle cx="50" cy="50" r="40" fill="none" stroke="currentColor" strokeWidth="1.5" strokeDasharray="30 10" />
        </motion.svg>

        {/* Glowing Core */}
        <motion.div 
          className="absolute w-6 h-6 rounded-full bg-[#F47A1F]"
          animate={{ scale: [1, 1.15, 1], boxShadow: ["0 0 10px rgba(244,122,31,0.5)", "0 0 25px rgba(244,122,31,0.8)", "0 0 10px rgba(244,122,31,0.5)"] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>

      <h1 className="text-xl font-bold text-[#FAFAFA] tracking-wide m-0 leading-none">DevScope AI</h1>
      <p className="text-[10px] uppercase tracking-widest text-[#9CA3AF] mt-2 font-mono">
        AI-Powered Recruiter Intelligence Engine
      </p>
    </div>
  );
}
function StatusPill({ children, tone = 'default' }) {
  return <span className={`dsx-status dsx-status--${tone}`}>{children}</span>;
}

function PipelineRow({ step, index }) {
  const isComplete = step.type === 'SUCCESS' || step.type === 'INDEX';
  const status = isComplete ? 'DONE' : 'LOADING';

  return (
    <motion.div 
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ 
        duration: 0.45, 
        delay: 0.3 + index * 0.065,
        ease: [0.22, 1, 0.36, 1]
      }}
      className="flex items-center justify-between font-mono text-sm hover:bg-[rgba(255,255,255,0.02)] p-2 rounded-sm transition-colors relative"
    >
      <div className="flex items-center gap-4">
        <span className="text-[#FAFAFA] opacity-50 w-7 text-xs">{step.id}.</span>
        
        {status === 'LOADING' ? (
          <motion.span 
            className="text-[#F47A1F]"
            animate={{ opacity: [1, 0.35, 1] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut', delay: index * 0.12 }}
          >
            [WAITING...]
          </motion.span>
        ) : (
          <span className={step.type === 'SUCCESS' ? 'text-[#F47A1F]' : 'text-[#FAFAFA] opacity-50'}>
            [{step.type}]
          </span>
        )}

        <span className={status === 'DONE' && step.type === 'SUCCESS' ? 'text-[#FAFAFA]' : 'text-[#FAFAFA] opacity-70'}>
          {step.title}
        </span>
      </div>
      <motion.span
        className="text-[#FAFAFA] text-[10px] tracking-widest pr-4"
        animate={status === 'LOADING' ? { opacity: [0.3, 0.1, 0.3] } : { opacity: 0.5 }}
        transition={status === 'LOADING' ? { duration: 2.4, repeat: Infinity, delay: index * 0.18, ease: 'easeInOut' } : {}}
      >
        {status === 'LOADING' ? 'PENDING...' : 'READY'}
      </motion.span>
      
      {status === 'DONE' && (
        <motion.div 
          initial={{ opacity: 0.4 }}
          animate={{ opacity: 0 }}
          transition={{ duration: 0.8 }}
          className="absolute inset-0 bg-[#F47A1F] pointer-events-none"
        />
      )}
    </motion.div>
  );
}

// Character-by-character title animation at 60fps via framer-motion
function AnimatedTitle({ text }) {
  const chars = text.split('');
  return (
    <h2 className="text-[12px] font-mono tracking-[0.15em] text-[#FAFAFA] uppercase m-0 flex">
      {chars.map((char, i) => (
        <motion.span
          key={i}
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: 0.25,
            delay: 0.15 + i * 0.028,
            ease: [0.22, 1, 0.36, 1]
          }}
          style={{ display: char === ' ' ? 'inline-block' : 'inline', minWidth: char === ' ' ? '0.4em' : undefined }}
        >
          {char}
        </motion.span>
      ))}
    </h2>
  );
}

function PipelinePanel({ metrics }) {
  const hasResume = metrics?.resume > 0;
  const hasGithub = metrics?.github > 0;
  const hasLinkedin = metrics?.linkedin > 0;
  const isComplete = hasResume && hasGithub && hasLinkedin;

  const steps = [
    { id: '01', type: hasResume ? 'SUCCESS' : 'WAITING', title: 'Resume Parsed' },
    { id: '02', type: hasResume ? 'INDEX' : 'WAITING', title: 'Skills Extracted' },
    { id: '03', type: hasResume ? 'SUCCESS' : 'WAITING', title: 'ATS Evaluation Complete' },
    { id: '04', type: hasGithub ? 'INDEX' : 'WAITING', title: 'GitHub Repositories Indexed' },
    { id: '05', type: hasGithub ? 'INDEX' : 'WAITING', title: 'Technology Graph Built' },
    { id: '06', type: hasGithub ? 'SUCCESS' : 'WAITING', title: 'Portfolio Analysis Complete' },
    { id: '07', type: hasLinkedin ? 'SUCCESS' : 'WAITING', title: 'LinkedIn Profile Parsed' },
    { id: '08', type: hasLinkedin ? 'INDEX' : 'WAITING', title: 'Keyword Visibility Evaluated' },
    { id: '09', type: hasLinkedin ? 'SUCCESS' : 'WAITING', title: 'Recruiter Visibility Complete' },
    { id: '10', type: isComplete ? 'SUCCESS' : 'WAITING', title: 'Candidate Profile Generated' },
  ];

  return (
    <section className="border border-[rgba(255,255,255,0.05)] bg-transparent rounded-sm p-6 dsx-panel" aria-label="Live System Pipeline">
      <header className="border-b border-[rgba(255,255,255,0.05)] pb-5 mb-5">
        <div className="flex items-center gap-3 mb-5">
          <motion.div
            className={`w-2 h-2 rounded-full flex-shrink-0 ${isComplete ? 'bg-[#3DE273]' : 'bg-[#F47A1F]'}`}
            animate={isComplete ? {} : { opacity: [1, 0.3, 1], scale: [1, 1.4, 1] }}
            transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
          />
          <AnimatedTitle text="LIVE SYSTEM PIPELINE" />
        </div>
        <div className="flex justify-between items-center">
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            transition={{ delay: 0.9, duration: 0.5 }}
            className="text-[11px] font-mono text-[#FAFAFA] tracking-widest uppercase"
          >
            ENGINE: DS INTELLIGENCE CORE V4.1
          </motion.span>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.1, duration: 0.5 }}
            className="flex items-center gap-2"
          >
            <motion.div
              className={`w-1.5 h-1.5 rounded-full ${isComplete ? 'bg-[#3DE273]' : 'bg-[#F47A1F]'}`}
              animate={isComplete ? {} : { opacity: [1, 0.25, 1] }}
              transition={{ duration: 1.2, repeat: Infinity }}
            />
            <span className="text-[11px] font-mono text-[#FAFAFA] opacity-50 tracking-widest uppercase">{isComplete ? 'PIPELINE COMPLETE' : 'PIPELINE ACTIVE'}</span>
          </motion.div>
        </div>
      </header>

      <div className="flex flex-col gap-3 relative">
        <motion.div
          initial={{ scaleY: 0 }}
          animate={{ scaleY: 1 }}
          transition={{ delay: 0.5, duration: 0.9, ease: [0.22, 1, 0.36, 1], originY: 0 }}
          style={{ transformOrigin: 'top' }}
          className="absolute right-0 top-0 bottom-0 w-0.5 bg-[#F47A1F] rounded-full opacity-80 shadow-[0_0_8px_#F47A1F]"
        />
        
        {steps.map((step, i) => (
          <PipelineRow key={step.id} step={step} index={i} />
        ))}
      </div>
    </section>
  );
}

function EvidenceMatrix() {
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    // Slight delay to trigger the CSS transition
    const timer = setTimeout(() => setMounted(true), 100);
    return () => clearTimeout(timer);
  }, []);

  return (
    <section className="dsx-panel dsx-panel--matrix" aria-label="Technical Validation">
      <header className="dsx-panel__header">
        <div>
          <p className="dsx-kicker">Technical Validation</p>
          <h2>Claims are measured against observable evidence.</h2>
        </div>
        <StatusPill>V4.1</StatusPill>
      </header>

      <div className="dsx-matrix">
        <div className="dsx-matrix__head">
          <span>Source</span>
          <span>Claim</span>
          <span>Evidence</span>
          <span>Confidence</span>
        </div>
        {evidenceRows.map((row) => (
          <div className="dsx-matrix__row" key={`${row.source}-${row.claim}`}>
            <strong>{row.source}</strong>
            <span>{row.claim}</span>
            <span>{row.proof}</span>
            <div className="dsx-meter" aria-label={`${row.score}% confidence`}>
              <span style={{ width: mounted ? `${row.score}%` : '0%' }} />
              <em>{mounted ? row.score : '0'}</em>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function AnimatedCounter({ from = 0, to = 100, delay = 0, duration = 2, suffix = '' }) {
  const [count, setCount] = useState(from);

  useEffect(() => {
    let startTimestamp = null;
    let animationFrame;
    const step = (timestamp) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / (duration * 1000), 1);
      
      // easeOutExpo
      const ease = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      setCount(Math.floor(ease * (to - from) + from));
      
      if (progress < 1) {
        animationFrame = window.requestAnimationFrame(step);
      }
    };
    
    const delayTimer = setTimeout(() => {
      animationFrame = window.requestAnimationFrame(step);
    }, delay * 1000);
    
    return () => {
      clearTimeout(delayTimer);
      if (animationFrame) window.cancelAnimationFrame(animationFrame);
    };
  }, [from, to, delay, duration]);

  return <>{count}{suffix && <span className="text-lg opacity-50">{suffix}</span>}</>;
}

function DossierPanel() {
  return (
    <section className="border border-[rgba(255,255,255,0.05)] bg-transparent rounded-sm p-6 dsx-panel" aria-label="Candidate Dossier">
      <header className="flex justify-between items-center border-b border-[rgba(255,255,255,0.05)] pb-5 mb-6">
        <div className="flex items-center gap-4">
          <div className="w-2 h-2 rounded-full bg-[#F47A1F] animate-pulse" />
          <h2 className="text-[12px] font-mono tracking-[0.15em] text-[#FAFAFA] uppercase m-0">
            CANDIDATE DOSSIER <span className="text-[#F47A1F] mx-3">|</span> ROLE: STAFF FRONTEND ARCHITECT
          </h2>
        </div>
        <div className="flex items-center gap-5">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1, boxShadow: ["0 0 0px #F47A1F", "0 0 15px #F47A1F", "0 0 0px #F47A1F"] }}
            transition={{ delay: 6.5, duration: 1 }}
            className="border border-[#F47A1F] text-[#F47A1F] text-[11px] font-mono px-4 py-1.5 tracking-widest rounded-sm"
          >
            VERIFIED DOSSIER
          </motion.div>
          <span className="text-[12px] font-mono text-[#FAFAFA] tracking-widest opacity-60">ID: ALX-4902-SE</span>
        </div>
      </header>

      <div className="grid grid-cols-3 gap-8 border-b border-[rgba(255,255,255,0.05)] pb-6 mb-6">
        <div className="flex flex-col items-center">
          <span className="text-[11px] font-mono tracking-widest text-[#FAFAFA] opacity-60 mb-3">ATS READINESS</span>
          <span className="text-5xl font-bold text-[#FAFAFA] font-mono mb-3">
            <AnimatedCounter from={0} to={87} delay={4.5} suffix="%" />
          </span>
          <div className="w-16 h-0.5 bg-[rgba(255,255,255,0.05)] relative overflow-hidden">
            <motion.div initial={{ width: 0 }} animate={{ width: '87%' }} transition={{ delay: 4.5, duration: 1.5, ease: "easeOut" }} className="absolute inset-y-0 left-0 bg-[#FAFAFA] opacity-20" />
          </div>
        </div>
        <div className="flex flex-col items-center">
          <span className="text-[11px] font-mono tracking-widest text-[#FAFAFA] opacity-60 mb-3">TECHNICAL VALIDATION</span>
          <span className="text-5xl font-bold text-[#FAFAFA] font-mono mb-3">
            <AnimatedCounter from={0} to={94} delay={4.7} suffix="%" />
          </span>
          <div className="w-20 h-1 bg-[rgba(255,255,255,0.05)] relative overflow-hidden rounded-full">
            <motion.div initial={{ width: 0 }} animate={{ width: '94%' }} transition={{ delay: 4.7, duration: 1.5, ease: "easeOut" }} className="absolute inset-y-0 left-0 bg-[#F47A1F]" />
          </div>
        </div>
        <div className="flex flex-col items-center">
          <span className="text-[11px] font-mono tracking-widest text-[#FAFAFA] opacity-60 mb-3">HIRING CONFIDENCE</span>
          <span className="text-5xl font-bold text-[#FAFAFA] font-mono mb-3">
            <AnimatedCounter from={0} to={89} delay={4.9} suffix="%" />
          </span>
          <div className="w-20 h-1 bg-[rgba(255,255,255,0.05)] relative overflow-hidden rounded-full">
            <motion.div initial={{ width: 0 }} animate={{ width: '89%' }} transition={{ delay: 4.9, duration: 1.5, ease: "easeOut" }} className="absolute inset-y-0 left-0 bg-[#F47A1F]" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-8">
        <div className="flex flex-col gap-6">
          <div>
            <h3 className="text-[#F47A1F] text-[11px] font-mono tracking-widest mb-4 uppercase">âœ“ Verified Strengths</h3>
            <ul className="flex flex-col gap-4">
              <li className="flex gap-4 text-sm text-[#FAFAFA] opacity-70 leading-relaxed">
                <span className="text-[#F47A1F] opacity-50 mt-1">â€¢</span>
                Monorepo architecture design (Turborepo, pnpm workspaces, and strict dependency boundaries).
              </li>
              <li className="flex gap-4 text-sm text-[#FAFAFA] opacity-70 leading-relaxed">
                <span className="text-[#F47A1F] opacity-50 mt-1">â€¢</span>
                Custom lint/compiler tooling (developed AST parser extensions for design system constraints).
              </li>
              <li className="flex gap-4 text-sm text-[#FAFAFA] opacity-70 leading-relaxed">
                <span className="text-[#F47A1F] opacity-50 mt-1">â€¢</span>
                High-frequency contribution history (300+ commits in active open-source projects this year).
              </li>
            </ul>
          </div>
          <div>
            <h3 className="text-[#FAFAFA] opacity-50 text-[11px] font-mono tracking-widest mb-4 uppercase">â†— Portfolio & Code Observations</h3>
            <ul className="flex flex-col gap-4">
              <li className="flex gap-4 text-sm text-[#FAFAFA] opacity-70 leading-relaxed">
                <span className="text-[#FAFAFA] opacity-30 mt-1">â€¢</span>
                Deep accessibility enforcement (WCAG AA standards, screen-reader landmarks, and ARIA attributes).
              </li>
              <li className="flex gap-4 text-sm text-[#FAFAFA] opacity-70 leading-relaxed">
                <span className="text-[#FAFAFA] opacity-30 mt-1">â€¢</span>
                Excellent modular separation (clear boundaries between state container and layout components).
              </li>
            </ul>
          </div>
        </div>

        <div className="flex flex-col gap-6">
          <div className="flex justify-between items-end border-b border-[rgba(255,255,255,0.05)] pb-3 mb-2">
            <h3 className="text-[#FAFAFA] opacity-50 text-[11px] font-mono tracking-widest uppercase m-0">Code Evidence</h3>
            <span className="text-[10px] font-mono text-[#FAFAFA] opacity-30">GitHub API</span>
          </div>
          
          <div className="flex flex-col gap-2">
            <div className="flex justify-between items-end">
              <span className="text-[#F47A1F] font-mono text-xs font-bold">core-design-system</span>
              <span className="text-[10px] font-mono text-[#FAFAFA] opacity-50">94% Quality</span>
            </div>
            <p className="text-xs text-[#FAFAFA] opacity-50 m-0 mb-1.5">Turborepo component workspace with Storybook.</p>
            <div className="w-full h-1 bg-[rgba(255,255,255,0.05)] relative overflow-hidden rounded-full">
              <motion.div initial={{ width: 0 }} animate={{ width: '94%' }} transition={{ delay: 5.2, duration: 1.5, ease: "easeOut" }} className="absolute top-0 left-0 bottom-0 bg-[#F47A1F]" />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex justify-between items-end">
              <span className="text-[#FAFAFA] opacity-80 font-mono text-xs font-bold">ast-token-linter</span>
              <span className="text-[10px] font-mono text-[#FAFAFA] opacity-50">88% Quality</span>
            </div>
            <p className="text-xs text-[#FAFAFA] opacity-50 m-0 mb-1.5">Custom ESLint parser to enforce styling rules.</p>
            <div className="w-full h-1 bg-[rgba(255,255,255,0.05)] relative overflow-hidden rounded-full">
              <motion.div initial={{ width: 0 }} animate={{ width: '88%' }} transition={{ delay: 5.4, duration: 1.5, ease: "easeOut" }} className="absolute top-0 left-0 bottom-0 bg-[rgba(255,255,255,0.3)]" />
            </div>
          </div>

          <div className="mt-4 border border-[rgba(244,122,31,0.2)] bg-[rgba(244,122,31,0.02)] p-5 rounded-sm">
            <h3 className="text-[#F47A1F] text-[11px] font-mono tracking-widest mb-3 uppercase">Recruiter Observation</h3>
            <p className="text-sm text-[#F47A1F] opacity-70 italic leading-relaxed m-0">
              {metrics.observation || "No specific recruiter notes provided."}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

function RightConsole({ user, onLogout, metrics }) {
  const router = useRouter();
  const [authMode, setAuthMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [authStatus, setAuthStatus] = useState({ type: 'idle', message: '' });
  const [isAuthBusy, setIsAuthBusy] = useState(false);

  const handleAuth = async (provider) => {
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: `${window.location.origin}/dashboard` },
    });
  };

  const handleEmailAuth = async (event) => {
    event.preventDefault();
    const supabase = createClient();
    const cleanEmail = email.trim();

    if (!cleanEmail) {
      setAuthStatus({ type: 'error', message: 'Enter your email address.' });
      return;
    }

    setIsAuthBusy(true);
    setAuthStatus({ type: 'idle', message: '' });

    try {
      if (authMode === 'forgot') {
        const { error } = await supabase.auth.resetPasswordForEmail(cleanEmail, {
          redirectTo: `${window.location.origin}/dashboard`,
        });
        if (error) throw error;
        setAuthStatus({ type: 'success', message: 'Password reset email sent.' });
        return;
      }

      if (!password || password.length < 6) {
        setAuthStatus({ type: 'error', message: 'Password must be at least 6 characters.' });
        return;
      }

      const result = authMode === 'signup'
        ? await supabase.auth.signUp({
            email: cleanEmail,
            password,
            options: {
              emailRedirectTo: `${window.location.origin}/dashboard`,
              data: { username: cleanEmail.split('@')[0] }
            }
          })
        : await supabase.auth.signInWithPassword({ email: cleanEmail, password });

      if (result.error) throw result.error;

      window.localStorage.setItem('devscope_remember_me', rememberMe ? 'true' : 'false');
      setAuthStatus({
        type: 'success',
        message: authMode === 'signup' && !result.data.session
          ? 'Signup created. Check your email to confirm your account.'
          : 'Authenticated. Opening command center...'
      });

      if (result.data.session) {
        router.push('/dashboard');
      }
    } catch (error) {
      setAuthStatus({ type: 'error', message: error.message || 'Authentication failed.' });
    } finally {
      setIsAuthBusy(false);
    }
  };

  if (user) {
    return (
      <aside className="w-full flex flex-col gap-4 h-full" aria-label="System Command Center">
        <div className="flex justify-center -mt-8 mb-4">
          <IntelligenceGraph metrics={metrics} />
        </div>

        <div className="flex-1 rounded-sm bg-[#050505] border border-[rgba(255,255,255,0.08)] shadow-[0_20px_60px_rgba(0,0,0,0.6)] flex flex-col overflow-hidden">
          <div className="dsx-panel__header items-center pb-4">
            <div>
              <h2 className="text-lg">Command Center</h2>
              <p className="dsx-section-label !m-0 mt-1.5 text-xs">System Status & Quick Actions</p>
            </div>
            <div className="flex gap-3">
              <span className="dsx-status dsx-status--active px-3 py-1.5 text-[10px]">
                <div className="w-2 h-2 rounded-full bg-[#F47A1F] animate-pulse" />
                GEMINI ACTIVE
              </span>
              <span className="dsx-status px-3 py-1.5 text-[10px]">GROQ STANDBY</span>
            </div>
          </div>
          
          <div className="p-5 flex flex-col gap-5 flex-1">
            <div className="grid grid-cols-2 gap-3">
              <button 
                onClick={() => router.push('/dashboard')}
                className="dsx-secondary-action border border-[rgba(255,255,255,0.1)] text-[#FAFAFA] text-xs font-mono tracking-widest py-3 rounded-sm hover:bg-[rgba(255,255,255,0.05)] transition-colors flex items-center justify-center gap-2"
              >
                <FileText size={16} /> ANALYZE RESUME
              </button>
              <button 
                onClick={() => router.push('/dashboard')}
                className="dsx-secondary-action border border-[rgba(255,255,255,0.1)] text-[#FAFAFA] text-xs font-mono tracking-widest py-3 rounded-sm hover:bg-[rgba(255,255,255,0.05)] transition-colors flex items-center justify-center gap-2"
              >
                <Github size={16} /> SYNC GITHUB
              </button>
              <button 
                onClick={() => router.push('/dashboard')}
                className="dsx-secondary-action border border-[rgba(255,255,255,0.1)] text-[#FAFAFA] text-xs font-mono tracking-widest py-3 rounded-sm hover:bg-[rgba(255,255,255,0.05)] transition-colors flex items-center justify-center gap-2"
              >
                <Linkedin size={16} /> FETCH LINKEDIN
              </button>
              <button 
                onClick={() => router.push('/dashboard')}
                className="dsx-secondary-action border border-[rgba(244,122,31,0.3)] bg-[rgba(244,122,31,0.05)] text-[#F47A1F] text-xs font-mono tracking-widest py-3 rounded-sm hover:bg-[rgba(244,122,31,0.1)] transition-colors flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(244,122,31,0.1)]"
              >
                <ArrowRight size={16} /> JOB MATCH
              </button>
            </div>

            <div className="flex-1 border border-[rgba(255,255,255,0.05)] rounded-sm bg-black overflow-hidden flex flex-col mt-2">
              <div className="border-b border-[rgba(255,255,255,0.05)] px-4 py-3 bg-[rgba(255,255,255,0.02)]">
                <span className="text-[10px] font-mono text-[#a1a1aa] tracking-widest uppercase">AI Activity Feed</span>
              </div>
              <div className="p-4 flex flex-col gap-3 overflow-y-auto max-h-[220px] text-xs font-mono">
                <div className="flex gap-3 text-[#c8d0c6]">
                  <span className="opacity-50">14:02:45</span>
                  <span>[MATCH] Candidate score generated (88%)</span>
                </div>
                <div className="flex gap-3 text-[#FAFAFA]">
                  <span className="opacity-50">14:02:42</span>
                  <span>[GITHUB] Analyzed 84 repositories.</span>
                </div>
                <div className="flex gap-3 text-[#F47A1F]">
                  <span className="opacity-50">14:02:38</span>
                  <span>[GEMINI] Processing resume PDF...</span>
                </div>
                <div className="flex gap-3 text-[#FAFAFA]">
                  <span className="opacity-50">14:02:37</span>
                  <span>[SYSTEM] Session authenticated.</span>
                </div>
              </div>
            </div>

            <button onClick={onLogout} className="mt-auto w-full border border-[rgba(255,255,255,0.1)] text-[#a1a1aa] text-[10px] font-mono tracking-widest py-3 rounded-sm hover:bg-[rgba(255,255,255,0.05)] hover:text-[#FAFAFA] transition-colors flex items-center justify-center gap-2">
              <LogOut size={14} /> SECURE LOGOUT
            </button>
          </div>
        </div>
        
        <div className="w-full mt-6">
          <h3 className="text-[10px] font-mono tracking-[0.2em] text-[#FAFAFA] opacity-50 text-center uppercase mb-4">Platform Intelligence Metrics</h3>
          <div className="grid grid-cols-3 gap-3">
            <div className="border border-[rgba(255,255,255,0.05)] bg-[rgba(255,255,255,0.015)] p-4 rounded-sm flex flex-col items-center justify-center gap-1.5 shadow-[0_4px_12px_rgba(0,0,0,0.1)]">
              <span className="text-2xl font-bold text-[#FAFAFA]">{metrics?.resume || 0}</span>
              <span className="text-[8px] font-mono tracking-widest text-[#FAFAFA] opacity-50 uppercase text-center">Resume Signals</span>
            </div>
            <div className="border border-[rgba(255,255,255,0.05)] bg-[rgba(255,255,255,0.015)] p-4 rounded-sm flex flex-col items-center justify-center gap-1.5 shadow-[0_4px_12px_rgba(0,0,0,0.1)]">
              <span className="text-2xl font-bold text-[#FAFAFA]">{metrics?.github || 0}</span>
              <span className="text-[8px] font-mono tracking-widest text-[#FAFAFA] opacity-50 uppercase text-center">Github Repositories</span>
            </div>
            <div className="border border-[rgba(255,255,255,0.05)] bg-[rgba(255,255,255,0.015)] p-4 rounded-sm flex flex-col items-center justify-center gap-1.5 shadow-[0_4px_12px_rgba(0,0,0,0.1)]">
              <span className="text-2xl font-bold text-[#3DE273]">{metrics?.linkedin || 0}</span>
              <span className="text-[8px] font-mono tracking-widest text-[#FAFAFA] opacity-50 uppercase text-center">Linkedin Signals</span>
            </div>
          </div>
        </div>
      </aside>
    );
  }

  return (
    <aside 
      className="w-full max-w-[460px] mx-auto flex flex-col rounded-2xl relative overflow-hidden" 
      style={{
        background: 'linear-gradient(180deg, #0a0a0a 0%, #030303 100%)',
        boxShadow: '0 0 0 1px rgba(255,255,255,0.06), 0 30px 80px rgba(0,0,0,0.8), 0 0 40px rgba(244,122,31,0.06)',
      }}
      aria-label="Authentication console"
    >
      
      {/* Subtle top highlight */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[rgba(255,255,255,0.15)] to-transparent" />

      {/* unified section */}
      <div className="flex flex-col relative z-10 w-full pt-8">
        
        {/* Intelligence Flow embedded into the card */}
        <div className="flex justify-center -mb-4">
          <IntelligenceGraph metrics={metrics} />
        </div>

        {/* Divider */}
        <div className="flex justify-center w-full mb-8 mt-4">
          <div className="w-[80%] h-px bg-gradient-to-r from-transparent via-[rgba(255,255,255,0.1)] to-transparent" />
        </div>

        {/* Auth elements */}
        <div className="px-10 pb-10 flex flex-col items-center">
          <div className="flex flex-col items-center justify-center w-full mb-8 gap-2">
            <div className="flex items-center gap-4">
              <div className="relative w-8 h-8 flex items-center justify-center">
                 <motion.div 
                  className="absolute w-12 h-12 rounded-full bg-[#F47A1F] opacity-[0.1] blur-[10px]"
                  animate={{ scale: [1, 1.2, 1], opacity: [0.05, 0.15, 0.05] }}
                  transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                />
                <motion.svg className="absolute inset-0 w-full h-full text-[#F47A1F] opacity-50" viewBox="0 0 100 100"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                >
                  <circle cx="50" cy="50" r="48" fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray="10 15" />
                </motion.svg>
                <div className="w-3 h-3 bg-[#FAFAFA] rounded-full shadow-[0_0_8px_#FAFAFA]" />
              </div>
              <h2 className="text-xl font-bold tracking-wide text-[#FAFAFA] m-0">DevScope AI</h2>
            </div>
            <p className="text-[10px] font-mono tracking-[0.2em] text-[#FAFAFA] opacity-70 uppercase m-0 mt-1 text-center">Authentication Required</p>
          </div>

          <form onSubmit={handleEmailAuth} className="flex flex-col gap-3 w-full">
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="Email address"
              autoComplete="email"
              className="w-full bg-[#090909] border border-[rgba(255,255,255,0.06)] shadow-[inset_0_2px_4px_rgba(0,0,0,0.4)] text-[#FAFAFA] text-xs font-mono px-4 py-3 rounded-md outline-none focus:border-[#F47A1F] focus:shadow-[inset_0_2px_4px_rgba(0,0,0,0.4),0_0_8px_rgba(244,122,31,0.2)] transition-all"
            />
            {authMode !== 'forgot' && (
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Password"
                autoComplete={authMode === 'signup' ? 'new-password' : 'current-password'}
                className="w-full bg-[#090909] border border-[rgba(255,255,255,0.06)] shadow-[inset_0_2px_4px_rgba(0,0,0,0.4)] text-[#FAFAFA] text-xs font-mono px-4 py-3 rounded-md outline-none focus:border-[#F47A1F] focus:shadow-[inset_0_2px_4px_rgba(0,0,0,0.4),0_0_8px_rgba(244,122,31,0.2)] transition-all"
              />
            )}
            {authMode !== 'forgot' && (
              <label className="flex items-center gap-2 text-[10px] font-mono text-[#FAFAFA] opacity-80 hover:opacity-100 transition-opacity cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(event) => setRememberMe(event.target.checked)}
                  className="accent-[#F47A1F]"
                />
                REMEMBER SESSION
              </label>
            )}
            {authStatus.message && (
              <div className={`text-[10px] font-mono ${authStatus.type === 'error' ? 'text-[#ef4444]' : 'text-[#3DE273]'}`}>
                {authStatus.message}
              </div>
            )}
            <button
              type="submit"
              disabled={isAuthBusy}
              className="dsx-primary-action w-full bg-[#F47A1F] text-[#090909] font-bold text-[10px] font-mono tracking-widest py-3 rounded-sm flex items-center justify-center gap-3 hover:bg-[#ff8f3d] transition-colors shadow-[0_0_20px_rgba(244,122,31,0.2)] disabled:opacity-60"
            >
              {authMode === 'forgot' ? <LockKeyhole size={14} /> : <Mail size={14} />}
              {isAuthBusy ? 'AUTHENTICATING...' : authMode === 'signup' ? 'CREATE ACCOUNT' : authMode === 'forgot' ? 'SEND RESET LINK' : 'LOGIN WITH EMAIL'}
            </button>
            <div className="grid grid-cols-2 gap-2">
              <button type="button" onClick={() => setAuthMode(authMode === 'signup' ? 'login' : 'signup')} className="dsx-secondary-action border border-[rgba(255,255,255,0.06)] bg-[#090909] hover:bg-[rgba(255,255,255,0.03)] text-[#FAFAFA] text-[9px] font-mono tracking-widest py-2 rounded-md transition-colors shadow-[inset_0_2px_4px_rgba(0,0,0,0.4)]">
                {authMode === 'signup' ? 'LOGIN' : 'SIGNUP'}
              </button>
              <button type="button" onClick={() => setAuthMode(authMode === 'forgot' ? 'login' : 'forgot')} className="dsx-secondary-action border border-[rgba(255,255,255,0.06)] bg-[#090909] hover:bg-[rgba(255,255,255,0.03)] text-[#FAFAFA] text-[9px] font-mono tracking-widest py-2 rounded-md transition-colors shadow-[inset_0_2px_4px_rgba(0,0,0,0.4)]">
                {authMode === 'forgot' ? 'BACK' : 'FORGOT'}
              </button>
            </div>
          </form>
          <p className="text-[9px] font-mono text-center text-[#FAFAFA] opacity-30 mt-6 m-0">
            By continuing, you agree to our Terms and Privacy.
          </p>
        </div>
      </div>
    </aside>
  );
}

export default function LandingPage({ user, onLogout }) {
  const [bootComplete, setBootComplete] = useState(false);
  const [metrics, setMetrics] = useState({ resume: 0, github: 0, linkedin: 0 });
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e) => {
      const x = (e.clientX / window.innerWidth - 0.5) * -4;
      const y = (e.clientY / window.innerHeight - 0.5) * -4;
      setMousePos({ x, y });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  useEffect(() => {
    const fetchMetrics = async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from('analyses')
        .select('resume_data, github_data, linkedin_data')
        .limit(50);
      const rows = data || [];
      setMetrics({
        resume: rows.filter(row => row.resume_data).length,
        github: rows.filter(row => row.github_data).length,
        linkedin: rows.filter(row => row.linkedin_data).length
      });
    };
    fetchMetrics();
  }, []);

  const bootVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.08, delayChildren: 0.2 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: -16 },
    show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 220, damping: 28, mass: 0.5 } }
  };

  return (
    <>
      <AnimatePresence>
        {!bootComplete && <BootSequence key="boot" onComplete={() => setBootComplete(true)} />}
      </AnimatePresence>
      <div className="dsx-shell" style={{ background: '#000000' }}>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.5, duration: 1 }}>
          <SystemBackground />
        </motion.div>

        {bootComplete && (
          <motion.div
            className="dsx-app"
            variants={bootVariants}
            initial="hidden"
            animate="show"
            style={{
              transform: `translate(${mousePos.x}px, ${mousePos.y}px)`,
              transition: 'transform 0.1s ease-out'
            }}
          >
            <motion.main className="dsx-main" variants={itemVariants}>
              <div className="dsx-landing-grid">
                <motion.div className="dsx-pipeline-col" variants={itemVariants}>
                  <PipelinePanel metrics={metrics} />
                </motion.div>
                <motion.div className="dsx-console-col" variants={itemVariants}>
                  <RightConsole user={user} onLogout={onLogout} metrics={metrics} />
                </motion.div>
              </div>
            </motion.main>
          </motion.div>
        )}
      </div>
      <style>{`
        .dsx-shell {
          min-height: 100vh;
          background: #000000;
          color: #fafafa;
          font-family: 'Geist', 'Inter', system-ui, sans-serif;
          position: relative;
          letter-spacing: 0;
          display: flex;
          align-items: stretch;
          justify-content: center;
          overflow: hidden;
        }

        .dsx-app {
          width: 100%;
          max-width: 1920px;
          min-height: 100vh;
          position: relative;
          z-index: 1;
          display: flex;
          align-items: stretch;
        }

        .dsx-main {
          flex: 1;
          display: flex;
          align-items: stretch;
        }

        .dsx-landing-grid {
          display: grid;
          grid-template-columns: 1fr 440px;
          width: 100%;
          min-height: 100vh;
        }

        @media (max-width: 1100px) {
          .dsx-landing-grid {
            grid-template-columns: 1fr;
          }
          .dsx-console-col {
            display: none;
          }
        }

        .dsx-pipeline-col {
          display: flex;
          flex-direction: column;
          justify-content: center;
          padding: 48px 48px 48px 56px;
          border-right: 1px solid rgba(255,255,255,0.04);
        }

        .dsx-console-col {
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          padding: 32px 28px;
          background: transparent;
        }

        .dsx-panel {
          background: transparent;
        }
      `}</style>

    </>
  );
}
