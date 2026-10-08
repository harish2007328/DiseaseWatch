import React, { useState, useEffect } from 'react';
import { Server, CheckCircle2, AlertCircle, RefreshCw, X, ExternalLink } from 'lucide-react';
import { getApiBase, setCustomApiUrl, checkApiHealth } from '../services/api';

interface ApiConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved?: () => void;
}

export const ApiConfigModal: React.FC<ApiConfigModalProps> = ({ isOpen, onClose, onSaved }) => {
  const [urlInput, setUrlInput] = useState('');
  const [testing, setTesting] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'failed'>('idle');
  const [statusMsg, setStatusMsg] = useState('');

  useEffect(() => {
    if (isOpen) {
      const current = getApiBase();
      setUrlInput(current);
      setStatus('idle');
      setStatusMsg('');
      // Run quick test
      testUrl(current);
    }
  }, [isOpen]);

  const testUrl = async (target: string) => {
    setTesting(true);
    setStatus('idle');
    const isOk = await checkApiHealth(target);
    setTesting(false);
    if (isOk) {
      setStatus('success');
      setStatusMsg('Connected successfully to FastAPI backend & database.');
    } else {
      setStatus('failed');
      setStatusMsg('Cannot reach backend at this address. Check if Render web service is live.');
    }
  };

  const handleSave = () => {
    setCustomApiUrl(urlInput.trim());
    if (onSaved) onSaved();
    onClose();
    window.location.reload();
  };

  const handleResetLocal = () => {
    setUrlInput('http://localhost:8000');
    setCustomApiUrl('http://localhost:8000');
    testUrl('http://localhost:8000');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-[#FFFFFF] border border-[#E5E7EB] rounded-[10px] w-full max-w-[480px] p-6 shadow-xl">
        <div className="flex items-center justify-between pb-3 border-b border-[#E5E7EB]">
          <div className="flex items-center gap-2">
            <Server className="w-4 h-4 text-[#0066CC]" />
            <h2 className="text-[15px] font-semibold text-[#111111]">
              Backend & Database Connection
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-[#6B7280] hover:text-[#111111] p-1 rounded-[5px] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-4 py-4 text-[13px]">
          <p className="text-[#6B7280] leading-relaxed">
            When deployed on Vercel, the frontend needs to connect to your live Render backend URL over HTTPS.
          </p>

          <div>
            <label className="block text-[12px] font-medium text-[#111111] mb-1.5">
              Backend API Endpoint URL
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                placeholder="https://your-service.onrender.com"
                className="flex-1 px-3 py-2 text-[12px] bg-[#FFFFFF] border border-[#E5E7EB] rounded-[7px] text-[#111111] focus:border-[#0066CC] font-mono"
              />
              <button
                type="button"
                onClick={() => testUrl(urlInput)}
                disabled={testing}
                className="px-3 py-2 text-[12px] font-medium border border-[#E5E7EB] hover:bg-[#F7F8FA] rounded-[7px] text-[#111111] transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${testing ? 'animate-spin' : ''}`} />
                <span>Test</span>
              </button>
            </div>
          </div>

          {/* Status feedback */}
          {status === 'success' && (
            <div className="p-3 rounded-[7px] bg-[#F0FDF4] border border-[#BBF7D0] text-[#15803D] text-[12px] flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-[#16A34A]" />
              <span>{statusMsg}</span>
            </div>
          )}

          {status === 'failed' && (
            <div className="p-3 rounded-[7px] bg-[#FEF2F2] border border-[#FECACA] text-[#B91C1C] text-[12px] flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-[#DC2626] mt-0.5" />
              <div>
                <p className="font-medium">{statusMsg}</p>
                <p className="text-[11px] text-[#991B1B] mt-1">
                  Ensure Render Web Service is running and includes <code className="bg-[#FEE2E2] px-1 py-0.5 rounded">SUPABASE_URL</code> and <code className="bg-[#FEE2E2] px-1 py-0.5 rounded">SUPABASE_KEY</code>.
                </p>
              </div>
            </div>
          )}

          <div className="p-3 bg-[#F7F8FA] border border-[#E5E7EB] rounded-[7px] space-y-1.5 text-[11px] text-[#6B7280]">
            <div className="font-semibold text-[#111111]">Permanent Configuration:</div>
            <p>
              In your <strong>Vercel Project Dashboard</strong> &rarr; <strong>Settings</strong> &rarr; <strong>Environment Variables</strong>:
            </p>
            <p className="font-mono text-[#0066CC] bg-[#FFFFFF] p-1.5 rounded border border-[#E5E7EB]">
              VITE_API_URL = {urlInput || 'https://your-service.onrender.com'}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-[#E5E7EB]">
          <button
            type="button"
            onClick={handleResetLocal}
            className="text-[11px] text-[#6B7280] hover:text-[#111111] underline cursor-pointer"
          >
            Reset to localhost:8000
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 text-[12px] font-medium border border-[#E5E7EB] rounded-[7px] text-[#6B7280] hover:text-[#111111] hover:bg-[#F7F8FA] transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-4 py-1.5 text-[12px] font-medium bg-[#0066CC] hover:bg-[#004C99] text-white rounded-[7px] transition-colors cursor-pointer"
            >
              Save & Apply
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
