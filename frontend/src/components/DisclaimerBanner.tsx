import React, { useState } from 'react';
import { ShieldCheck, Server, X } from 'lucide-react';
import { ApiConfigModal } from './ApiConfigModal';
import { getApiBase } from '../services/api';

export const DisclaimerBanner: React.FC = () => {
  const [dismissed, setDismissed] = useState(false);
  const [showConfig, setShowConfig] = useState(false);
  const currentBase = getApiBase();
  const isCloud = !currentBase.includes('localhost') && !currentBase.includes('127.0.0.1');

  if (dismissed) return null;

  return (
    <>
      <div className="bg-[#F7F8FA] text-[#6B7280] text-[12px] px-4 py-1.5 border-b border-[#E5E7EB] flex items-center justify-between">
        <div className="flex items-center gap-2 max-w-7xl mx-auto w-full">
          <ShieldCheck className="w-3.5 h-3.5 text-[#0066CC] shrink-0" />
          <span className="text-[#111111] font-medium">Surveillance Intelligence:</span>
          <span className="truncate">Post-disaster early warning & response coordination only. Not a medical diagnosis system.</span>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={() => setShowConfig(true)}
            className="flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-[5px] bg-[#FFFFFF] border border-[#E5E7EB] hover:border-[#0066CC] text-[#111111] transition-colors cursor-pointer"
            title="Configure backend endpoint"
          >
            <span className={`w-1.5 h-1.5 rounded-full ${isCloud ? 'bg-[#16A34A]' : 'bg-[#0066CC]'}`}></span>
            <Server className="w-3 h-3 text-[#6B7280]" />
            <span className="font-mono text-[10px] hidden md:inline truncate max-w-[130px]">{currentBase}</span>
            <span className="md:hidden">API</span>
          </button>

          <button
            onClick={() => setDismissed(true)}
            className="text-[#6B7280] hover:text-[#111111] p-1 transition-colors cursor-pointer"
            aria-label="Dismiss banner"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <ApiConfigModal isOpen={showConfig} onClose={() => setShowConfig(false)} />
    </>
  );
};
