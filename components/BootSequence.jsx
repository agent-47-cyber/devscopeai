'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function BootSequence({ onComplete }) {
  const [phase, setPhase] = useState(0);
  const [text, setText] = useState('');
  const fullText = 'INITIALIZING DEVSCOPE AI...';

  useEffect(() => {
    // Check if we've already booted in this session
    const hasBooted = sessionStorage.getItem('devscope_booted');
    if (hasBooted) {
      onComplete();
      return;
    }

    // Sequence Timeline
    // Phase 0: 0.0s - 0.1s -> Black screen, blinking cursor
    // Phase 1: 0.1s - 0.4s -> Typing text
    // Phase 2: 0.4s - 0.7s -> Scan line drop
    // Phase 3: 0.7s - 1.2s -> Background fade in
    // Phase 4: 1.2s -> Complete & unmount

    const timeouts = [];

    // Start Phase 0 immediately
    setPhase(0);

    // Start Phase 1 (Typing)
    timeouts.push(setTimeout(() => {
      setPhase(1);
      let i = 0;
      const typeInterval = setInterval(() => {
        setText(fullText.substring(0, i + 1));
        i++;
        if (i >= fullText.length) {
          clearInterval(typeInterval);
        }
      }, 10);
      timeouts.push(typeInterval);
    }, 100));

    // Start Phase 2 (Scan line)
    timeouts.push(setTimeout(() => {
      setPhase(2);
    }, 400));

    // Start Phase 3 (Fade to main)
    timeouts.push(setTimeout(() => {
      setPhase(3);
    }, 700));

    // Complete (Phase 4)
    timeouts.push(setTimeout(() => {
      sessionStorage.setItem('devscope_booted', 'true');
      onComplete();
    }, 1200));

    return () => {
      timeouts.forEach(t => clearTimeout(t));
    };
  }, [onComplete]);

  // If already booted, render nothing (handled by parent AnimatePresence)
  
  return (
    <motion.div
      className="fixed inset-0 z-[999] bg-[#000000] flex items-center justify-center pointer-events-none"
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 1, ease: "easeInOut" }}
    >
      <div className="relative w-full h-full flex items-center justify-center">
        
        {/* Phase 0 & 1: Terminal Text */}
        <div className="absolute flex items-center gap-2">
          <span className="text-[#F47A1F] font-mono text-[11px] tracking-widest uppercase">{text}</span>
          {(phase === 0 || phase === 1) && (
            <motion.div 
              className="w-2 h-3.5 bg-[#F47A1F]"
              animate={{ opacity: [1, 0, 1] }}
              transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
            />
          )}
        </div>

        {/* Phase 2: Scan Line Drop */}
        <AnimatePresence>
          {phase === 2 && (
            <motion.div
              className="absolute top-0 left-0 right-0 h-0.5 bg-[#F47A1F] shadow-[0_0_15px_#F47A1F]"
              initial={{ y: 0, opacity: 0 }}
              animate={{ y: typeof window !== 'undefined' ? window.innerHeight : 1000, opacity: [0, 1, 1, 0] }}
              transition={{ duration: 0.8, ease: "linear" }}
            />
          )}
        </AnimatePresence>

        {/* Phase 3: Grid Reveal overlay (fades in slightly before background unmounts) */}
        <AnimatePresence>
          {phase === 3 && (
            <motion.div
              className="absolute inset-0 flex items-center justify-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
            >
              <div className="absolute inset-0 bg-[#000000]" />
              <div className="absolute inset-0 opacity-[0.02]" style={{
                backgroundImage: 'linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)',
                backgroundSize: '64px 64px',
              }} />
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full bg-[#F47A1F] opacity-[0.05] blur-[80px]" />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
