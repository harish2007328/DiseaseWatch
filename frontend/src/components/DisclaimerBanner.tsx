import React, { useState } from 'react';
import { AlertTriangle, ShieldCheck, X } from 'lucide-react';

export const DisclaimerBanner: React.FC = () => {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  return (
    <div className="bg-gradient-to-r from-amber-500/10 via-sky-500/10 to-indigo-500/10 border-b border-amber-200/60 px-4 py-2 text-xs text-slate-700 flex items-center justify-between transition-all">
      <div className="flex items-center gap-2 max-w-5xl mx-auto w-full">
        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-800">
          <AlertTriangle className="h-3 w-3" />
        </span>
        <p className="font-medium leading-relaxed">
          <strong className="text-slate-900 font-semibold">Surveillance & Early Warning Prototype:</strong>{' '}
          DiseaseWatch assists relief camps and district administrators with incident monitoring, risk estimation, and public-health action coordination.{' '}
          <span className="text-amber-900 font-semibold">
            Not a clinical diagnosis or medical prescription tool.
          </span>{' '}
          All automated assessments represent syndromic risk signals to guide preventive community health responses.
        </p>
      </div>
      <button
        onClick={() => setDismissed(true)}
        className="text-slate-400 hover:text-slate-600 p-1 rounded-md transition-colors shrink-0"
        title="Dismiss notice"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
};
