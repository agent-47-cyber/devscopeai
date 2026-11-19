'use client';
import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

const CircularGauge = ({ score, label, colorClass, size = 160 }) => {
  const [offset, setOffset] = useState(440);
  const validScore = score !== null && score !== undefined ? score : 0;
  
  useEffect(() => {
    // 440 is the stroke-dasharray (2 * pi * r ≈ 440 for r=70)
    const newOffset = 440 - (440 * validScore) / 100;
    setTimeout(() => setOffset(newOffset), 100);
  }, [validScore]);

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg className="w-full h-full -rotate-90" viewBox="0 0 160 160">
        <circle 
          cx="80" 
          cy="80" 
          r="70" 
          fill="none" 
          stroke="#1c1b1b" 
          strokeWidth="12"
        />
        <circle 
          cx="80" 
          cy="80" 
          r="70" 
          fill="none" 
          stroke={score === null ? '#333' : 'currentColor'}
          className={colorClass}
          strokeWidth="12"
          strokeLinecap="square"
          strokeDasharray="440"
          style={{ 
            strokeDashoffset: offset,
            transition: 'stroke-dashoffset 1.5s cubic-bezier(0.22, 1, 0.36, 1)'
          }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={`font-data-lg text-[48px] ${score === null ? 'text-on-surface-variant' : colorClass}`}>
          {score !== null ? score : '--'}
        </span>
        <span className="font-label-caps text-label-caps text-on-surface-variant">/ 100</span>
      </div>
    </div>
  );
};

export const ExecutiveKPI = ({ scores }) => {
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } }
  };

  return (
    <motion.div 
      variants={container} 
      initial="hidden" 
      animate="show" 
      className="grid grid-cols-12 gap-card-gap mb-card-gap"
    >
      {/* Overall Match Index */}
      <motion.section variants={item} className="col-span-12 lg:col-span-3 bg-surface-container border border-outline-variant p-6 flex flex-col items-center justify-center relative overflow-hidden rim-light-amber">
        <div className="absolute top-0 left-0 w-full h-1 bg-primary/20"></div>
        <h3 className="font-label-caps text-label-caps text-on-surface-variant mb-4 self-start">OVERALL MATCH INDEX</h3>
        <CircularGauge score={scores?.portfolio} colorClass="text-primary" size={140} />
      </motion.section>

      {/* Engineering Intelligence */}
      <motion.section variants={item} className="col-span-12 lg:col-span-3 bg-surface-container border border-outline-variant p-6 flex flex-col items-center justify-center relative overflow-hidden rim-light-amber">
        <div className="absolute top-0 left-0 w-full h-1 bg-amber-500/20"></div>
        <h3 className="font-label-caps text-label-caps text-on-surface-variant mb-4 self-start">ENGINEERING INTELLIGENCE</h3>
        <CircularGauge score={scores?.github} colorClass="text-amber-500" size={140} />
      </motion.section>

      {/* Resume Intelligence */}
      <motion.section variants={item} className="col-span-12 lg:col-span-3 bg-surface-container border border-outline-variant p-6 flex flex-col items-center justify-center relative overflow-hidden rim-light-amber">
        <div className="absolute top-0 left-0 w-full h-1 bg-orange-400/20"></div>
        <h3 className="font-label-caps text-label-caps text-on-surface-variant mb-4 self-start">RESUME INTELLIGENCE</h3>
        <CircularGauge score={scores?.ats} colorClass="text-orange-400" size={140} />
      </motion.section>

      {/* Professional Presence */}
      <motion.section variants={item} className="col-span-12 lg:col-span-3 bg-surface-container border border-outline-variant p-6 flex flex-col items-center justify-center relative overflow-hidden rim-light-amber">
        <div className="absolute top-0 left-0 w-full h-1 bg-yellow-600/20"></div>
        <h3 className="font-label-caps text-label-caps text-on-surface-variant mb-4 self-start">PROFESSIONAL PRESENCE</h3>
        <CircularGauge score={scores?.careerReady} colorClass="text-yellow-600" size={140} />
      </motion.section>
    </motion.div>
  );
};

