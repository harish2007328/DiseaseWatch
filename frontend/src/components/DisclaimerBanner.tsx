import React, { useState } from 'react';
import { ShieldAlert, X } from 'lucide-react';

export const DisclaimerBanner: React.FC = () => {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  return (
    <div className="bg-slate-900 text-slate-300 px-3 py-1 text-[11px] font-medium flex items-center justify-between border-b border-slate-800">
      <div className="flex items-center gap-2 max-w-7xl mx-auto w-full">
        <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-amber-400/20 text-amber-300">
          <ShieldAlert className="h-2.5 w-2.5" />
        </span>
        <p className="truncate">
          <strong className="text-white">Surveillance Prototype:</strong> For syndromic early-warning and relief camp response coordination. Non-clinical diagnostic aid.
        </p>
      </div>
      <button
        onClick={() => setDismissed(true)}
        className="text-slate-400 hover:text-white p-0.5 rounded transition-colors shrink-0 cursor-pointer"
        title="Dismiss notice"
      >
        <X className="h-3 w-3" />
      </button>
    </div>
  );
};
