import React, { useState, useEffect } from 'react';
import { ShieldCheck, ArrowRight, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getCamps } from '../services/api';
import { Camp } from '../types';

export const LoginPage: React.FC = () => {
  const { loginWithRole, loginWithCredentials } = useAuth();
  const [camps, setCamps] = useState<Camp[]>([]);
  const [selectedCampId, setSelectedCampId] = useState<string>('camp-1');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showRoleSelector, setShowRoleSelector] = useState(false);

  useEffect(() => {
    getCamps()
      .then((res) => {
        if (res.data && res.data.length > 0) {
          setCamps(res.data);
          setSelectedCampId(res.data[0].id);
        }
      })
      .catch(() => {});
  }, []);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setErrorMsg('Please enter an email address');
      return;
    }
    setSubmitting(true);
    setErrorMsg('');

    try {
      if (email.includes('admin')) {
        await loginWithRole('admin', undefined, 'District Health Officer');
      } else if (email.includes('camp')) {
        const campObj = camps.find((c) => c.id === selectedCampId);
        const name = campObj ? campObj.name : `Relief Camp (${selectedCampId})`;
        await loginWithRole('camp', selectedCampId, `Coordinator — ${name}`);
      } else {
        await loginWithCredentials(email, password || 'demo123');
      }
    } catch (err: any) {
      setErrorMsg(err.response?.data?.detail || 'Authentication failed. Please check credentials.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDemoAccess = async (type: 'admin' | 'camp') => {
    setErrorMsg('');
    setSubmitting(true);
    try {
      if (type === 'admin') {
        setEmail('admin@diseasewatch.demo');
        setPassword('admin123');
        await loginWithRole('admin', undefined, 'Dr. Priya Sharma (District Health Officer)');
      } else {
        setEmail('camp@diseasewatch.demo');
        setPassword('camp123');
        const campObj = camps.find((c) => c.id === selectedCampId);
        const name = campObj ? campObj.name : 'Camp 01 — Govt High School';
        await loginWithRole('camp', selectedCampId, `Coordinator — ${name}`);
      }
    } catch (err: any) {
      setErrorMsg('Error signing into demo session');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FFFFFF] text-[#111111] flex flex-col justify-center items-center px-4 py-12">
      {/* Centered Login Panel */}
      <div className="w-full max-w-[380px]">
        {/* Brand / Logo */}
        <div className="mb-8 text-center">
          <div className="inline-flex items-center justify-center w-10 h-10 rounded-[8px] bg-[#0066CC] text-white mb-4">
            <span className="font-semibold text-lg tracking-tight">DW</span>
          </div>
          <h1 className="text-[26px] font-semibold tracking-tight text-[#111111] leading-tight">
            Public Health Intelligence
          </h1>
          <p className="text-[13px] text-[#6B7280] mt-1">
            Monitor. Detect. Respond.
          </p>
        </div>

        {/* Login Box */}
        <div className="bg-[#FFFFFF] border border-[#E5E7EB] rounded-[10px] p-6">
          {errorMsg && (
            <div className="mb-4 p-2.5 rounded-[7px] bg-[#FEF2F2] border border-[#FECACA] text-[#B91C1C] text-[12px] flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSignIn} className="space-y-4">
            <div>
              <label className="block text-[12px] font-medium text-[#111111] mb-1.5">
                Email
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@organization.gov"
                className="w-full px-3 py-2 text-[13px] bg-[#FFFFFF] border border-[#E5E7EB] rounded-[7px] text-[#111111] focus:border-[#0066CC] transition-colors"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-[12px] font-medium text-[#111111]">
                  Password
                </label>
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3 py-2 text-[13px] bg-[#FFFFFF] border border-[#E5E7EB] rounded-[7px] text-[#111111] focus:border-[#0066CC] transition-colors"
              />
            </div>

            {/* Optional Camp Station Selector */}
            {email.includes('camp') && (
              <div>
                <label className="block text-[12px] font-medium text-[#111111] mb-1.5">
                  Assigned Camp Station
                </label>
                <select
                  value={selectedCampId}
                  onChange={(e) => setSelectedCampId(e.target.value)}
                  className="w-full px-3 py-2 text-[13px] bg-[#FFFFFF] border border-[#E5E7EB] rounded-[7px] text-[#111111] focus:border-[#0066CC]"
                >
                  {camps.length > 0 ? (
                    camps.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.ward || 'Tirunelveli'})
                      </option>
                    ))
                  ) : (
                    <>
                      <option value="camp-1">Camp 01 — Govt High School</option>
                      <option value="camp-2">Camp 02 — Community Hall</option>
                      <option value="camp-3">Camp 03 — Sports Complex</option>
                    </>
                  )}
                </select>
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-2.5 px-4 text-[13px] font-medium text-white bg-[#0066CC] hover:bg-[#004C99] rounded-[7px] transition-colors flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 mt-2"
            >
              <span>{submitting ? 'Authenticating...' : 'Sign in'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </form>

          {/* Demo Access section */}
          <div className="mt-6 pt-5 border-t border-[#E5E7EB]">
            <p className="text-[11px] font-medium text-[#6B7280] uppercase tracking-wider mb-2.5">
              Demo access
            </p>
            <div className="space-y-1.5">
              <button
                type="button"
                onClick={() => handleDemoAccess('admin')}
                className="w-full text-left px-3 py-2 rounded-[7px] border border-[#E5E7EB] hover:bg-[#F7F8FA] transition-colors text-[12px] flex items-center justify-between group cursor-pointer"
              >
                <div>
                  <div className="font-medium text-[#111111]">Admin</div>
                  <div className="text-[#6B7280] text-[11px]">admin@diseasewatch.demo</div>
                </div>
                <span className="text-[#0066CC] text-[11px] font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                  Use →
                </span>
              </button>

              <button
                type="button"
                onClick={() => handleDemoAccess('camp')}
                className="w-full text-left px-3 py-2 rounded-[7px] border border-[#E5E7EB] hover:bg-[#F7F8FA] transition-colors text-[12px] flex items-center justify-between group cursor-pointer"
              >
                <div>
                  <div className="font-medium text-[#111111]">Camp Coordinator</div>
                  <div className="text-[#6B7280] text-[11px]">camp@diseasewatch.demo</div>
                </div>
                <span className="text-[#0066CC] text-[11px] font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                  Use →
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Minimal Footer Disclaimer */}
        <p className="text-[11px] text-[#6B7280] text-center mt-6">
          Tirunelveli District Health Command · Decision Support Only
        </p>
      </div>
    </div>
  );
};
