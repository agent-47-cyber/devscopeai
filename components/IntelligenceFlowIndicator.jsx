import React from 'react';
import { FileText, Github, Linkedin, Cpu, CheckCircle, Search, FolderSearch, BarChart } from 'lucide-react';
import { Card } from './ui/Card';

export default function IntelligenceFlowIndicator({ resume, github, linkedin, jobMatch, projectGap, candidateReport, activeTab }) {
  const inputSteps = [
    { id: 'resume', icon: FileText, label: 'RES', hasData: !!resume },
    { id: 'github', icon: Github, label: 'GIT', hasData: !!github },
    { id: 'linkedin', icon: Linkedin, label: 'LIN', hasData: !!linkedin },
  ];

  const outputSteps = [
    { id: 'recruiter', icon: Search, label: 'MATCH', hasData: !!jobMatch },
    { id: 'projects', icon: FolderSearch, label: 'GAPS', hasData: !!projectGap },
    { id: 'analytics', icon: BarChart, label: 'REPORT', hasData: !!candidateReport },
  ];

  const hasAllInputs = !!resume && !!github && !!linkedin;
  const isAnalyzing = activeTab === 'recruiter' || activeTab === 'projects' || activeTab === 'analytics';

  return (
    <Card className="mb-8 p-6" hover={false}>
      <div className="flex flex-col md:flex-row items-center justify-between max-w-5xl mx-auto gap-4 md:gap-0">

        {/* Input Nodes */}
        <div className="flex items-center gap-2">
          {inputSteps.map((step, index) => (
            <React.Fragment key={step.id}>
              <div className={`flex flex-col items-center gap-2 flow-node group ${step.hasData ? 'text-primary' : 'text-on-surface-variant'}`}>
                <div className={`w-12 h-10 rounded-sm flex items-center justify-center border transition-all duration-normal ${step.hasData ? 'border-primary/50 bg-primary/10 shadow-[0_0_10px_rgba(184, 161, 96,0.1)]' : 'border-outline-variant bg-surface'}`}>
                  <span className="font-label text-label-xs font-bold">[{step.label}]</span>
                </div>
                {step.hasData && (
                  <div className="absolute -top-1 -right-1 bg-background rounded-full animate-scale-in">
                    <CheckCircle size={14} className="text-success" />
                  </div>
                )}
              </div>

              {/* Connector between inputs */}
              {index < inputSteps.length - 1 && (
                <div className="w-8 h-[2px] bg-outline-variant relative overflow-hidden">
                  <div className={`absolute top-0 left-0 h-full w-full bg-primary transition-transform duration-500 ${step.hasData ? 'translate-x-0' : '-translate-x-full'}`}></div>
                </div>
              )}
            </React.Fragment>
          ))}
        </div>

        {/* Engine Connector In */}
        <div className="hidden md:flex w-12 h-[2px] bg-outline-variant relative overflow-hidden mx-2">
          <div className={`absolute top-0 left-0 h-full w-full bg-primary transition-transform duration-1000 ${hasAllInputs || isAnalyzing ? 'translate-x-0' : '-translate-x-full'}`}></div>
          {(hasAllInputs || isAnalyzing) && <div className="flow-connector active dashed-divider h-full bg-transparent w-full"></div>}
        </div>

        {/* Intelligence Engine Node */}
        <div className={`flex flex-col items-center gap-2 flow-node ${isAnalyzing ? 'intel-card-glow text-primary' : 'text-on-surface-variant'}`}>
          <div className={`w-16 h-12 rounded-sm flex items-center justify-center border transition-all duration-dramatic ${isAnalyzing ? 'border-primary bg-surface shadow-[0_0_15px_rgba(184, 161, 96,0.2)]' : 'border-outline-variant bg-surface'}`}>
            <Cpu size={24} className={isAnalyzing || hasAllInputs ? 'text-primary animate-pulseRing' : 'text-on-surface-variant'} />
          </div>
          <span className="font-label text-label-xs uppercase tracking-[0.15em] font-bold text-center absolute -bottom-6 w-32 left-1/2 -translate-x-1/2 text-on-surface">ENGINE</span>
        </div>

        {/* Engine Connector Out */}
        <div className="hidden md:flex w-12 h-[2px] bg-outline-variant relative overflow-hidden mx-2">
          <div className={`absolute top-0 left-0 h-full w-full bg-success transition-transform duration-1000 ${isAnalyzing ? 'translate-x-0' : '-translate-x-full'}`}></div>
          {isAnalyzing && <div className="flow-connector active dashed-divider h-full bg-transparent w-full" style={{ backgroundImage: 'linear-gradient(to right, var(--color-success) 20%, rgba(255, 255, 255, 0) 0%)' }}></div>}
        </div>

        {/* Output Nodes */}
        <div className="flex items-center gap-2">
          {outputSteps.map((step, index) => {
            const isActive = activeTab === step.id;
            return (
              <React.Fragment key={step.id}>
                <div className={`flex flex-col items-center gap-2 flow-node ${step.hasData ? 'text-success' : isActive ? 'text-on-surface' : 'text-on-surface-variant'}`}>
                  <div className={`w-14 h-10 rounded-sm flex items-center justify-center border transition-all duration-normal ${step.hasData ? 'border-success/50 bg-success/10 shadow-[0_0_10px_rgba(34,197,94,0.1)]' : isActive ? 'border-outline text-on-surface shadow-md' : 'border-outline-variant bg-surface'}`}>
                    <span className="font-label text-label-xs font-bold">[{step.label}]</span>
                  </div>
                  {step.hasData && (
                    <div className="absolute -top-1 -right-1 bg-background rounded-full animate-scale-in z-10">
                      <CheckCircle size={14} className="text-success" />
                    </div>
                  )}
                </div>

                {/* Connector between outputs */}
                {index < outputSteps.length - 1 && (
                  <div className="w-8 h-[2px] bg-outline-variant relative overflow-hidden">
                    <div className={`absolute top-0 left-0 h-full w-full bg-success transition-transform duration-500 ${step.hasData ? 'translate-x-0' : '-translate-x-full'}`}></div>
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>

      </div>
    </Card>
  );
}
