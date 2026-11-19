'use client';

import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';

export default function IntelligenceGraph({ metrics }) {
  // Derive active states from metrics to sync animation with backend progress
  const hasResume = metrics?.resume > 0;
  const hasGithub = metrics?.github > 0;
  const hasLinkedin = metrics?.linkedin > 0;
  const isComplete = hasResume && hasGithub && hasLinkedin;

  const [hoveredNode, setHoveredNode] = useState(null);

  // Nodes definition
  const leftNodes = [
    { id: 'resume', label: 'Resume', y: 80, active: hasResume },
    { id: 'github', label: 'GitHub', y: 140, active: hasGithub },
    { id: 'linkedin', label: 'LinkedIn', y: 200, active: hasLinkedin },
    { id: 'jobdesc', label: 'Job Description', y: 260, active: true },
  ];

  const rightNodes = [
    { id: 'report', label: 'Candidate Report', y: 110, active: isComplete },
    { id: 'ats', label: 'ATS Score', y: 170, active: isComplete },
    { id: 'match', label: 'Job Match', y: 230, active: isComplete },
  ];

  const corePos = { x: 250, y: 170 };

  // Calculate smooth SVG cubic bezier curves (like fiber optic cables)
  const generatePath = (startX, startY, endX, endY) => {
    const midX = (startX + endX) / 2;
    return `M ${startX} ${startY} C ${midX} ${startY}, ${midX} ${endY}, ${endX} ${endY}`;
  };

  const getLineColor = (id, isActive) => {
    if (hoveredNode === id) return "rgba(255, 122, 26, 0.9)";
    if (isActive) return "rgba(255, 122, 26, 0.6)";
    return "rgba(255, 122, 26, 0.3)";
  };

  // Generate packet configurations once to avoid React re-renders breaking animations
  const packets = useMemo(() => {
    const p = [];
    // 3 packets per left node
    leftNodes.forEach(node => {
      for (let i = 0; i < 3; i++) {
        p.push({
          id: `packet-left-${node.id}-${i}`,
          path: generatePath(100, node.y, corePos.x, corePos.y),
          duration: 1.2 + Math.random() * 1.0,
          delay: Math.random() * 1.5,
          length: 0.03 + Math.random() * 0.05,
          width: 1.5 + Math.random() * 1.5,
          ease: "easeIn",
          opacityAnim: [0, 0.6, 1, 0] // Brighten near the core, fade at exit
        });
      }
    });
    // 3 packets per right node
    rightNodes.forEach(node => {
      for (let i = 0; i < 3; i++) {
        p.push({
          id: `packet-right-${node.id}-${i}`,
          path: generatePath(corePos.x, corePos.y, 400, node.y),
          duration: 1.2 + Math.random() * 1.0,
          delay: Math.random() * 1.5,
          length: 0.03 + Math.random() * 0.05,
          width: 1.5 + Math.random() * 1.5,
          ease: "easeOut",
          opacityAnim: [0, 1, 0.6, 0] // Bright at start (core), fade away
        });
      }
    });
    return p;
  }, []);

  return (
    <div className="w-full max-w-[500px] aspect-[5/4] relative flex items-center justify-center -mb-8">
      
      <svg viewBox="-120 0 740 340" className="w-full h-full overflow-visible">
        <defs>
          <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
          
          <radialGradient id="core-glow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="rgba(255,122,26,0.25)" />
            <stop offset="100%" stopColor="transparent" />
          </radialGradient>
        </defs>

        {/* Base Connection Lines with breathing glow */}
        {leftNodes.map(node => (
          <motion.path 
            key={`line-${node.id}`} 
            d={generatePath(100, node.y, corePos.x, corePos.y)} 
            stroke={getLineColor(node.id, node.active)} 
            strokeWidth="1.5" 
            fill="none" 
            className="transition-colors duration-500"
            animate={{ strokeOpacity: [0.4, 0.8, 0.4] }}
            transition={{ duration: 3 + Math.random() * 2, repeat: Infinity, ease: "easeInOut" }}
          />
        ))}
        {rightNodes.map(node => (
          <motion.path 
            key={`line-${node.id}`} 
            d={generatePath(corePos.x, corePos.y, 400, node.y)} 
            stroke={getLineColor(node.id, node.active)} 
            strokeWidth="1.5" 
            fill="none" 
            className="transition-colors duration-500"
            animate={{ strokeOpacity: [0.4, 0.8, 0.4] }}
            transition={{ duration: 3 + Math.random() * 2, repeat: Infinity, ease: "easeInOut" }}
          />
        ))}

        {/* High-Performance Data Packets */}
        {packets.map(packet => (
          <motion.path
            key={packet.id}
            d={packet.path}
            stroke="#FF7A1A"
            strokeWidth={packet.width}
            strokeLinecap="round"
            filter="url(#glow)"
            fill="none"
            initial={{ pathLength: packet.length, pathOffset: 0, opacity: 0 }}
            animate={{ 
              pathOffset: [0, 1],
              opacity: packet.opacityAnim
            }}
            transition={{ 
              duration: packet.duration, 
              repeat: Infinity, 
              ease: packet.ease,
              delay: packet.delay
            }}
          />
        ))}

        {/* Left Source Nodes */}
        {leftNodes.map(node => {
          const isHovered = hoveredNode === node.id;
          return (
            <g 
              key={node.id} 
              transform={`translate(100, ${node.y})`} 
              onMouseEnter={() => setHoveredNode(node.id)} 
              onMouseLeave={() => setHoveredNode(null)}
              style={{ cursor: 'pointer' }}
            >
              {/* Minimal White Dot */}
              <circle cx="-22" cy="0" r="1.5" fill="#FFFFFF" opacity={0.3} />
              
              {/* Pulse Indicator */}
              <motion.circle 
                cx="-12" 
                cy="0" 
                r="3" 
                fill="#FF7A1A" 
                filter="url(#glow)"
                animate={{ opacity: [0.4, 0.9, 0.4], scale: [1, 1.2, 1] }}
                transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut", delay: Math.random() * 2 }} 
                className="transition-all duration-300" 
              />
              
              <text 
                x="-36" 
                y="4" 
                fill="#FAFAFA" 
                fontSize="14" 
                fontWeight="500"
                fontFamily="'Geist Mono', 'JetBrains Mono', monospace" 
                textAnchor="end" 
                opacity="0.9" 
                style={{ WebkitFontSmoothing: 'antialiased', letterSpacing: '0.05em' }}
              >
                {node.label}
              </text>
            </g>
          );
        })}

        {/* Right Output Nodes */}
        {rightNodes.map(node => {
          const isHovered = hoveredNode === node.id;
          return (
            <g 
              key={node.id} 
              transform={`translate(400, ${node.y})`} 
              onMouseEnter={() => setHoveredNode(node.id)} 
              onMouseLeave={() => setHoveredNode(null)}
              style={{ cursor: 'pointer' }}
            >
              <motion.circle 
                cx="12" 
                cy="0" 
                r="3" 
                fill="#FF7A1A" 
                filter="url(#glow)"
                animate={{ opacity: [0.4, 0.9, 0.4], scale: [1, 1.2, 1] }}
                transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut", delay: Math.random() * 2 }} 
                className="transition-all duration-300" 
              />
              
              <circle cx="22" cy="0" r="1.5" fill="#FFFFFF" opacity={0.3} />
              
              <text 
                x="36" 
                y="4" 
                fill="#FAFAFA" 
                fontSize="14"
                fontWeight="500"
                fontFamily="'Geist Mono', 'JetBrains Mono', monospace" 
                textAnchor="start" 
                opacity="0.9" 
                style={{ WebkitFontSmoothing: 'antialiased', letterSpacing: '0.05em' }}
              >
                {node.label}
              </text>
            </g>
          );
        })}

        {/* AI Intelligence Core */}
        <g transform={`translate(${corePos.x}, ${corePos.y})`}>
          
          {/* Ambient Glow behind the core */}
          <motion.circle 
            r="45" 
            fill="url(#core-glow)" 
            animate={{ opacity: [0.4, 0.7, 0.4], scale: [0.9, 1.1, 0.9] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          />

          {/* Expanding Scan Waves */}
          {[0, 1, 2].map(i => (
             <motion.circle 
               key={`wave-${i}`}
               r="10" 
               stroke="#FF7A1A" 
               strokeWidth="1" 
               fill="none"
               animate={{ opacity: [0.6, 0], scale: [1, 4.5] }}
               transition={{ duration: 3, repeat: Infinity, ease: "easeOut", delay: i * 1 }}
             />
          ))}
          
          {/* Ring 1 - Solid, very slow clockwise */}
          <motion.circle 
            r="18" 
            stroke="rgba(255,122,26,0.8)" 
            strokeWidth="1.5" 
            fill="none"
            animate={{ rotate: 360, scale: [0.95, 1.05, 0.95] }} 
            transition={{ 
              rotate: { duration: 20, repeat: Infinity, ease: "linear" },
              scale: { duration: 3, repeat: Infinity, ease: "easeInOut" }
            }}
          />
          
          {/* Ring 2 - Dashed, counter-clockwise */}
          <motion.circle 
            r="24" 
            stroke="rgba(255,122,26,0.6)" 
            strokeWidth="1" 
            fill="none" 
            strokeDasharray="4 8"
            animate={{ rotate: -360 }} 
            transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
          />
          
          {/* Ring 3 - Segmented, outer */}
          <motion.circle 
            r="32" 
            stroke="rgba(255,122,26,0.4)" 
            strokeWidth="1" 
            fill="none" 
            strokeDasharray="20 15 5 15"
            animate={{ rotate: 360 }} 
            transition={{ duration: 35, repeat: Infinity, ease: "linear" }}
          />

          {/* Orbiting particles */}
          <motion.g animate={{ rotate: 360 }} transition={{ duration: 8, repeat: Infinity, ease: "linear" }}>
            <circle cx="24" cy="0" r="2" fill="#FF7A1A" filter="url(#glow)" />
            <circle cx="-24" cy="0" r="1.5" fill="#FF7A1A" opacity="0.6" />
          </motion.g>

          <motion.g animate={{ rotate: -360 }} transition={{ duration: 12, repeat: Infinity, ease: "linear" }}>
            <circle cx="0" cy="32" r="1.5" fill="#FF7A1A" filter="url(#glow)" />
            <circle cx="0" cy="-32" r="2" fill="#FF7A1A" opacity="0.8" />
          </motion.g>

          {/* Glowing Orange Nucleus */}
          <motion.circle 
            r="8" 
            fill="#FF7A1A" 
            filter="url(#glow)"
            animate={{ 
              opacity: [0.8, 1, 0.8], 
              scale: [0.9, 1.15, 0.9] 
            }} 
            transition={{ 
              duration: 2, 
              repeat: Infinity, 
              ease: "easeInOut" 
            }}
          />
          {/* Inner core super bright center */}
          <motion.circle 
            r="3" 
            fill="#FFFFFF" 
            opacity="0.9" 
            filter="url(#glow)" 
            animate={{ scale: [0.8, 1.2, 0.8] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
          />
        </g>
      </svg>
    </div>
  );
}
