import React from 'react';

export function Card({ children, className = '', hover = false, glow = false, active = false, ...props }) {
  let baseClass = 'bg-card border border-outline-variant rounded-sm p-6 shadow-card transition-all duration-normal ease-out';
  
  if (hover) {
    baseClass += ' hover:bg-elevated hover:border-outline hover:-translate-y-[1px] hover:shadow-card-hover';
  }
  if (glow) {
    baseClass += ' intel-card-glow';
  }
  if (active) {
    baseClass += ' border-primary/30 shadow-glow';
  }

  return (
    <div className={`${baseClass} ${className}`} {...props}>
      {children}
    </div>
  );
}

export function CardHeader({ children, className = '', ...props }) {
  return <div className={`mb-6 flex justify-between items-start ${className}`} {...props}>{children}</div>;
}

export function CardTitle({ children, className = '', ...props }) {
  return <h3 className={`font-title text-title-lg text-on-background ${className}`} {...props}>{children}</h3>;
}
