import React, { useState } from 'react';
import { ShieldCheck, X } from 'lucide-react';

export const DisclaimerBanner: React.FC = () => {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  return (
    <div className="bg-[#F7F8FA] text-[#6B7280] text-[12px] px-4 py-1.5 border-b border-[#E5E7EB] flex items-center justify-between">
      <div className="flex items-center gap-2 max-w-7xl mx-auto w-full">
        <ShieldCheck className="w-3.5 h-3.5 text-[#0066CC] shrink-0" />
        <span className="text-[#111111] font-medium">Surveillance Intelligence:</span>
        <span className="truncate">Post-disaster early warning & response coordination only. Not a medical diagnosis system.</span>
      </div>
      <button
        onClick={() => setDismissed(true)}
        className="text-[#6B7280] hover:text-[#111111] p-1 transition-colors cursor-pointer"
        aria-label="Dismiss banner"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};
