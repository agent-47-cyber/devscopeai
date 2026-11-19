import React from 'react';

export function Badge({ children, variant = 'default', className = '', icon: Icon, ...props }) {
  let baseClass = 'inline-flex items-center justify-center gap-1.5 px-2.5 py-1 font-label text-label-xs uppercase tracking-[0.10em] rounded-sm border transition-colors duration-fast';
  
  let variantClass = '';
  switch (variant) {
    case 'default':
      variantClass = 'bg-surface-elevated text-text-secondary border-outline';
      break;
    case 'success':
      variantClass = 'bg-success/10 text-success border-success/30';
      break;
    case 'warning':
      variantClass = 'bg-warning/10 text-warning border-warning/30';
      break;
    case 'error':
      variantClass = 'bg-error/10 text-error border-error/30';
      break;
    case 'primary':
      variantClass = 'bg-primary/10 text-primary border-primary/30';
      break;
    case 'cached':
      variantClass = 'bg-success/5 text-success border-success/20';
      break;
  }

  return (
    <span className={`${baseClass} ${variantClass} ${className}`} {...props}>
      {Icon && <Icon size={12} />}
      {children}
    </span>
  );
}
