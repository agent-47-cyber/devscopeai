import React, { useState } from 'react';
import { AlertCircle, CheckCircle2 } from 'lucide-react';

export function Input({ 
  icon: Icon, 
  error, 
  valid,
  className = '', 
  wrapperClassName = '',
  ...props 
}) {
  const [isFocused, setIsFocused] = useState(false);

  let baseClass = 'w-full bg-background border rounded-sm text-on-background font-body text-body-md py-3 transition-all duration-fast ease-out placeholder:text-text-disabled';
  
  let paddingClass = Icon ? 'pl-10 pr-4' : 'px-4';
  if (error || valid) paddingClass += ' pr-10';

  let stateClass = 'border-outline-variant hover:border-outline';
  if (error) {
    stateClass = 'border-error shadow-[0_0_0_3px_rgba(239,68,68,0.15)] animate-[shakeHorizontal_300ms_ease-in-out]';
  } else if (isFocused) {
    stateClass = 'border-primary shadow-focus-ring outline-none';
  }

  return (
    <div className={`relative ${wrapperClassName}`}>
      {Icon && (
        <Icon 
          size={18} 
          className={`absolute left-3 top-1/2 -translate-y-1/2 transition-colors duration-fast ${isFocused ? 'text-primary' : error ? 'text-error' : 'text-on-surface-variant'}`} 
        />
      )}
      
      <input
        className={`${baseClass} ${paddingClass} ${stateClass} ${className}`}
        onFocus={(e) => {
          setIsFocused(true);
          props.onFocus?.(e);
        }}
        onBlur={(e) => {
          setIsFocused(false);
          props.onBlur?.(e);
        }}
        {...props}
      />

      {error && (
        <AlertCircle 
          size={18} 
          className="absolute right-3 top-1/2 -translate-y-1/2 text-error" 
        />
      )}
      {valid && !error && (
        <CheckCircle2 
          size={18} 
          className="absolute right-3 top-1/2 -translate-y-1/2 text-success animate-scale-in" 
        />
      )}
    </div>
  );
}
