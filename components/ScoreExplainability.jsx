import React from 'react';

export default function ScoreExplainability({ explainability }) {
  if (!explainability) return null;

  return (
    <div className="mt-6 border-t border-outline-variant/30 pt-4 animate-fade-in">
      <h4 className="font-label-caps text-xs text-on-surface-variant mb-3 flex items-center gap-1">
        <span className="material-symbols-outlined text-[14px]">psychology</span>
        Score Explainability
      </h4>
      <div className="grid md:grid-cols-3 gap-4">
        {/* Positive Contributors */}
        <div className="bg-surface-container border border-tertiary/20 p-3 rounded">
          <div className="text-[10px] font-label-caps text-tertiary mb-2 uppercase flex items-center gap-1">
            <span className="material-symbols-outlined text-[12px]">trending_up</span>
            Positive Impact
          </div>
          <ul className="text-xs text-on-surface-variant space-y-1 pl-4 list-disc marker:text-tertiary">
            {(explainability.positiveContributors || []).map((c, i) => (
              <li key={i}>{c}</li>
            ))}
            {(!explainability.positiveContributors || explainability.positiveContributors.length === 0) && (
              <li className="list-none text-on-surface-variant/50 italic -ml-4">None identified</li>
            )}
          </ul>
        </div>
        
        {/* Negative Contributors */}
        <div className="bg-surface-container border border-error/20 p-3 rounded">
          <div className="text-[10px] font-label-caps text-error mb-2 uppercase flex items-center gap-1">
            <span className="material-symbols-outlined text-[12px]">trending_down</span>
            Negative Impact
          </div>
          <ul className="text-xs text-on-surface-variant space-y-1 pl-4 list-disc marker:text-error">
            {(explainability.negativeContributors || []).map((c, i) => (
              <li key={i}>{c}</li>
            ))}
            {(!explainability.negativeContributors || explainability.negativeContributors.length === 0) && (
              <li className="list-none text-on-surface-variant/50 italic -ml-4">None identified</li>
            )}
          </ul>
        </div>

        {/* Potential Gains */}
        <div className="bg-surface-container border border-primary/20 p-3 rounded">
          <div className="text-[10px] font-label-caps text-primary mb-2 uppercase flex items-center gap-1">
            <span className="material-symbols-outlined text-[12px]">lightbulb</span>
            Potential Gains
          </div>
          <ul className="text-xs text-on-surface-variant space-y-1 pl-4 list-disc marker:text-primary">
            {(explainability.potentialGains || []).map((c, i) => (
              <li key={i}>{c}</li>
            ))}
            {(!explainability.potentialGains || explainability.potentialGains.length === 0) && (
              <li className="list-none text-on-surface-variant/50 italic -ml-4">None identified</li>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
}
