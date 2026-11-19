import React, { useEffect, useState } from 'react';

export function ScoreGauge({ 
  value, 
  maxValue = 100, 
  size = 180, 
  strokeWidth = 12, 
  color = 'var(--color-primary)',
  label,
  delay = 200,
  className = '' 
}) {
  const isNull = value === null || value === undefined;
  const targetValue = isNull ? 0 : Math.min(Math.max(value, 0), maxValue);
  
  const [animatedValue, setAnimatedValue] = useState(0);
  const [dashOffset, setDashOffset] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  
  useEffect(() => {
    // Entrance delay
    const timer = setTimeout(() => {
      setIsVisible(true);
      const targetOffset = isNull ? circumference : circumference - (targetValue / maxValue) * circumference;
      setDashOffset(targetOffset);
      
      // Simple count up
      if (!isNull) {
        let start = 0;
        const duration = 600;
        const interval = 16;
        const step = (targetValue / (duration / interval));
        
        const counter = setInterval(() => {
          start += step;
          if (start >= targetValue) {
            setAnimatedValue(targetValue);
            clearInterval(counter);
          } else {
            setAnimatedValue(Math.floor(start));
          }
        }, interval);
        return () => clearInterval(counter);
      }
    }, delay);
    
    return () => clearTimeout(timer);
  }, [targetValue, maxValue, circumference, isNull, delay]);

  const offsetToRender = isVisible ? dashOffset : circumference;

  return (
    <div className={`relative flex flex-col items-center justify-center ${className}`} style={{ width: size, height: size }}>
      <svg 
        width={size} 
        height={size} 
        viewBox={`0 0 ${size} ${size}`} 
        className="transform -rotate-90"
      >
        <circle 
          cx={size / 2} 
          cy={size / 2} 
          r={radius} 
          fill="none" 
          stroke="rgba(255,255,255,0.05)" 
          strokeWidth={strokeWidth} 
        />
        <circle 
          cx={size / 2} 
          cy={size / 2} 
          r={radius} 
          fill="none" 
          stroke={isNull ? 'rgba(255,255,255,0.05)' : color} 
          strokeWidth={strokeWidth} 
          strokeLinecap="round"
          style={{
            strokeDasharray: circumference,
            strokeDashoffset: offsetToRender,
            transition: 'stroke-dashoffset 800ms ease-out'
          }}
        />
      </svg>
      
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-display text-data-lg text-on-background">
          {isNull ? '--' : animatedValue}
        </span>
        {label && (
          <span className={`font-label text-label-xs text-text-muted mt-1 uppercase transition-opacity duration-300 ${isVisible ? 'opacity-100' : 'opacity-0'}`}>
            {label}
          </span>
        )}
      </div>
    </div>
  );
}

export function MiniScoreGauge({ value, label, color = 'var(--color-primary)' }) {
  const isNull = value === null || value === undefined;
  const radius = 18;
  const circ = 2 * Math.PI * radius;
  
  const [isVisible, setIsVisible] = useState(false);
  
  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 200);
    return () => clearTimeout(timer);
  }, []);

  const offset = isNull ? circ : circ - (value / 100) * circ;
  const strokeColor = isNull ? 'rgba(255, 255, 255, 0.05)' : color;

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative w-11 h-11 flex items-center justify-center">
        <svg viewBox="0 0 44 44" className="absolute inset-0 transform -rotate-90">
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
              strokeDashoffset: isVisible ? offset : circ,
              transition: 'stroke-dashoffset 800ms ease-out'
            }}
          />
        </svg>
        <span className="font-label text-label-xs text-on-background absolute z-10 font-bold">
          {isNull ? 'N/A' : `${value}%`}
        </span>
      </div>
      {label && <span className="font-label text-label-xs text-text-muted uppercase tracking-[0.10em]">{label}</span>}
    </div>
  );
}
