import React, { useState, useEffect } from 'react';
import { Terminal, CheckCircle2, Loader2 } from 'lucide-react';

export default function ProcessingState({ steps, currentStep, isComplete }) {
  const [visibleSteps, setVisibleSteps] = useState([]);

  useEffect(() => {
    if (currentStep >= 0 && !visibleSteps.includes(currentStep)) {
      setVisibleSteps(prev => [...prev, currentStep]);
    }
  }, [currentStep, visibleSteps]);

  return (
    <div className="bg-[#050505] border border-[#252525] rounded-md p-6 font-mono text-sm max-w-2xl mx-auto shadow-2xl">
      <div className="flex items-center gap-2 mb-6 border-b border-[#252525] pb-3 text-[#9A9A9A]">
        <Terminal size={16} />
        <span>DEVSCOPE INTELLIGENCE ENGINE :: PROCESSING</span>
      </div>
      
      <div className="flex flex-col gap-4">
        {steps.map((step, index) => {
          const isActive = currentStep === index && !isComplete;
          const isPassed = currentStep > index || isComplete;
          
          if (!visibleSteps.includes(index) && !isPassed && !isActive) return null;

          return (
            <div key={index} className="flex items-start gap-3 animate-fade-in">
              <div className="mt-[2px]">
                {isPassed ? (
                  <CheckCircle2 size={16} className="text-[#22c55e]" />
                ) : isActive ? (
                  <Loader2 size={16} className="text-[#F97316] animate-spin" />
                ) : (
                  <div className="w-4 h-4 rounded-full border border-[#252525]" />
                )}
              </div>
              <div className={isActive ? 'text-white' : isPassed ? 'text-[#D0D0D0]' : 'text-[#9A9A9A]'}>
                {step}
              </div>
            </div>
          );
        })}
      </div>
      
      <div className="mt-8 pt-4 border-t border-[#252525]">
        <div className="h-1 w-full bg-[#111] rounded-full overflow-hidden">
           <div 
             className="h-full bg-gradient-to-r from-[#F97316] to-[#ff8c3a] transition-all duration-500 ease-out" 
             style={{ width: `${isComplete ? 100 : ((currentStep + 1) / steps.length) * 100}%` }}
           />
        </div>
      </div>
    </div>
  );
}
