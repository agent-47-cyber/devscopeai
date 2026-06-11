import React from 'react';
import { FileText, Github, Linkedin, Cpu, CheckCircle, Search, FolderSearch, BarChart } from 'lucide-react';

export default function IntelligenceFlowIndicator({ resume, github, linkedin, jobMatch, projectGap, candidateReport, activeTab }) {
  const inputSteps = [
    { id: 'resume', icon: FileText, label: 'Resume', hasData: !!resume },
    { id: 'github', icon: Github, label: 'GitHub', hasData: !!github },
    { id: 'linkedin', icon: Linkedin, label: 'LinkedIn', hasData: !!linkedin },
  ];

  const outputSteps = [
    { id: 'recruiter', icon: Search, label: 'MATCH', hasData: !!jobMatch },
    { id: 'projects', icon: FolderSearch, label: 'GAPS', hasData: !!projectGap },
    { id: 'analytics', icon: BarChart, label: 'REPORT', hasData: !!candidateReport },
  ];

  const hasAllInputs = !!resume && !!github && !!linkedin;
  const isAnalyzing = activeTab === 'recruiter' || activeTab === 'projects' || activeTab === 'analytics';

  return (
    <div className="bg-surface-container-low border border-outline-variant rounded-lg p-4 mb-8">
      <div className="flex flex-col md:flex-row items-center justify-between max-w-5xl mx-auto gap-4 md:gap-0">

        {/* Input Nodes */}
        <div className="flex items-center gap-2">
          {inputSteps.map((step, index) => (
            <React.Fragment key={step.id}>
              <div className={`flex flex-col items-center gap-2 flow-node ${step.hasData ? 'text-primary' : 'text-on-surface-variant'}`}>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 ${step.hasData ? 'border-primary bg-primary/10' : 'border-outline-variant bg-surface'}`}>
                  <step.icon size={18} className={step.hasData ? 'text-primary' : 'text-on-surface-variant'} />
                </div>
                <span className="text-[9px] uppercase tracking-widest font-bold">{step.label}</span>
                {step.hasData && (
                  <div className="absolute -top-1 -right-1 bg-surface rounded-full">
                    <CheckCircle size={14} className="text-tertiary" />
                  </div>
                )}
              </div>

              {/* Connector between inputs */}
              {index < inputSteps.length - 1 && (
                <div className="w-6 h-[2px] bg-outline-variant relative overflow-hidden">
                  <div className={`absolute top-0 left-0 h-full w-full bg-primary transition-transform duration-500 ${step.hasData ? 'translate-x-0' : '-translate-x-full'}`}></div>
                </div>
              )}
            </React.Fragment>
          ))}
        </div>

        {/* Engine Connector In */}
        <div className="hidden md:flex w-10 h-[2px] bg-outline-variant relative overflow-hidden mx-2">
          <div className={`absolute top-0 left-0 h-full w-full bg-primary transition-transform duration-1000 ${hasAllInputs || isAnalyzing ? 'translate-x-0' : '-translate-x-full'}`}></div>
          {(hasAllInputs || isAnalyzing) && <div className="flow-connector active"></div>}
        </div>

        {/* Intelligence Engine Node */}
        <div className={`flex flex-col items-center gap-2 flow-node ${isAnalyzing ? 'intel-card-glow text-white' : 'text-on-surface-variant'}`}>
          <div className={`w-14 h-14 rounded-xl flex items-center justify-center border-2 ${isAnalyzing ? 'border-primary bg-surface shadow-[0_0_15px_rgba(249,115,22,0.3)]' : 'border-outline-variant bg-surface'}`}>
            <Cpu size={28} className={isAnalyzing || hasAllInputs ? 'text-primary' : 'text-on-surface-variant'} />
          </div>
          <span className="text-[9px] uppercase tracking-widest font-bold text-center w-24">DevScope Engine</span>
        </div>

        {/* Engine Connector Out */}
        <div className="hidden md:flex w-10 h-[2px] bg-outline-variant relative overflow-hidden mx-2">
          <div className={`absolute top-0 left-0 h-full w-full bg-tertiary transition-transform duration-1000 ${isAnalyzing ? 'translate-x-0' : '-translate-x-full'}`}></div>
          {isAnalyzing && <div className="flow-connector active" style={{ background: 'linear-gradient(90deg, var(--color-tertiary), transparent)' }}></div>}
        </div>

        {/* Output Nodes */}
        <div className="flex items-center gap-2">
          {outputSteps.map((step, index) => {
            const isActive = activeTab === step.id;
            return (
              <React.Fragment key={step.id}>
                <div className={`flex flex-col items-center gap-2 flow-node ${step.hasData ? 'text-tertiary' : isActive ? 'text-on-surface' : 'text-on-surface-variant'}`}>
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 ${step.hasData ? 'border-tertiary bg-tertiary/10' : isActive ? 'border-outline text-on-surface' : 'border-outline-variant bg-surface'}`}>
                    <span className="text-[10px] font-mono font-bold">{step.label}</span>
                  </div>
                  {step.hasData && (
                    <div className="absolute -top-1 -right-1 bg-surface rounded-full z-10">
                      <CheckCircle size={14} className="text-tertiary" />
                    </div>
                  )}
                </div>

                {/* Connector between outputs */}
                {index < outputSteps.length - 1 && (
                  <div className="w-6 h-[2px] bg-outline-variant relative overflow-hidden">
                    <div className={`absolute top-0 left-0 h-full w-full bg-tertiary transition-transform duration-500 ${step.hasData ? 'translate-x-0' : '-translate-x-full'}`}></div>
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>

      </div>
    </div>
  );
}
