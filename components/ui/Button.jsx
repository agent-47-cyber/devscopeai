import React from 'react';
import { Loader2, CheckCircle2 } from 'lucide-react';

export function Button({ 
  children, 
  variant = 'primary', // primary, secondary, ghost
  state = 'default', // default, loading, success
  className = '', 
  disabled = false, 
  icon: Icon,
  ...props 
}) {
  let baseClass = 'inline-flex items-center justify-center gap-2 px-6 py-3 font-label text-[11px] uppercase tracking-[0.1em] rounded-md transition-all duration-fast ease-out';
  
  let variantClass = '';
  switch (variant) {
    case 'primary':
      variantClass = 'bg-primary text-on-primary border border-white/10 shadow-btn-primary hover:bg-primary-hover hover:-translate-y-[1px] hover:shadow-btn-primary-hover active:translate-y-0 active:shadow-btn-primary disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none disabled:hover:translate-y-0';
      break;
    case 'secondary':
      variantClass = 'bg-surface-container-low text-on-background border border-outline-variant hover:border-primary hover:bg-primary/10 hover:text-primary-hover';
      break;
    case 'ghost':
      variantClass = 'bg-transparent text-on-surface-variant border border-transparent hover:bg-surface hover:text-on-background';
      break;
  }

  const isDisabled = disabled || state === 'loading' || state === 'success';

  return (
    <button 
      className={`${baseClass} ${variantClass} ${className}`} 
      disabled={isDisabled}
      {...props}
    >
      {state === 'loading' && <Loader2 size={16} className="animate-spin" />}
      {state === 'success' && <CheckCircle2 size={16} />}
      {state === 'default' && Icon && <Icon size={16} />}
      
      {state === 'loading' ? 'Processing...' : state === 'success' ? 'Success' : children}
    </button>
  );
}
