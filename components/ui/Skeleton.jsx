import React from 'react';

export function Skeleton({ className = '', variant = 'text', ...props }) {
  let baseClass = 'bg-surface-elevated animate-skeleton rounded-sm';
  
  if (variant === 'circular') {
    baseClass += ' rounded-full';
  } else if (variant === 'card') {
    baseClass += ' w-full h-32';
  }
  
  return (
    <div className={`${baseClass} ${className}`} {...props} />
  );
}

export function SkeletonCard({ className = '' }) {
  return (
    <div className={`bg-card border border-outline-variant rounded-sm p-6 flex flex-col gap-4 ${className}`}>
      <Skeleton className="w-1/3 h-6" />
      <div className="flex flex-col gap-2 mt-2">
        <Skeleton className="w-full h-4" />
        <Skeleton className="w-5/6 h-4" />
        <Skeleton className="w-4/6 h-4" />
      </div>
    </div>
  );
}
