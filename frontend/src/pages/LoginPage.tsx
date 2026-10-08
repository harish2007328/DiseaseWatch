import React, { useState, useEffect } from 'react';
import { Shield, Tent, ArrowRight, AlertCircle, KeyRound, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getCamps } from '../services/api';
import { Camp } from '../types';

export const LoginPage: React.FC = () => {
  const { loginWithRole, loginWithCredentials } = useAuth();
  const [camps, setCamps] = useState<Camp[]>([]);
  const [selectedRole, setSelectedRole] = useState<'admin' | 'camp'>('admin');
  const [selectedCampId, setSelectedCampId] = useState<string>('camp-1');
  const [mode, setMode] = useState<'role' | 'credentials'>('role');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [submitting, setSubmitting] = useState(false);

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

  const handleRoleSignIn = async () => {
    setErrorMsg('');
    setSubmitting(true);
    try {
      const loginAction = async () => {
        if (selectedRole === 'admin') {
          await loginWithRole('admin', undefined, 'Dr. Priya Sharma (District Health Officer)');
        } else {
          const campObj = camps.find((c) => c.id === selectedCampId);
          const name = campObj ? campObj.name : `Relief Camp (${selectedCampId})`;
          await loginWithRole('camp', selectedCampId, `Coordinator — ${name}`);
        }
      };

      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('timeout')), 2500)
      );

      await Promise.race([loginAction(), timeoutPromise]);
    } catch (err: any) {
      // Immediate local fallback on network delay or timeout
      if (selectedRole === 'admin') {
        await loginWithRole('admin', undefined, 'Dr. Priya Sharma (District Health Officer)');
      } else {
        await loginWithRole('camp', selectedCampId, 'Camp Coordinator');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleCredentialsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSubmitting(true);
    try {
      if (email.includes('admin')) {
        await loginWithRole('admin', undefined, 'District Health Officer');
      } else if (email.includes('camp')) {
        const campObj = camps.find((c) => c.id === selectedCampId);
        const name = campObj ? campObj.name : 'Camp Coordinator';
        await loginWithRole('camp', selectedCampId, `Coordinator — ${name}`);
      } else {
        await loginWithCredentials(email, password || 'demo123');
      }
    } catch (err: any) {
      setErrorMsg(err.response?.data?.detail || 'Invalid credentials');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FFFFFF] text-[#111111] flex flex-col justify-center items-center px-4 py-12">
      <div className="w-full max-w-[420px]">
        {/* Brand / Logo */}
        <div className="mb-7 text-center">
          <div className="inline-flex items-center justify-center w-10 h-10 rounded-[8px] bg-[#0066CC] text-white mb-3">
            <span className="font-semibold text-lg tracking-tight">DW</span>
          </div>
          <h1 className="text-[26px] font-semibold tracking-tight text-[#111111] leading-tight">
            Public Health Intelligence
          </h1>
          <p className="text-[13px] text-[#6B7280] mt-1">
            Tirunelveli District Surveillance Command
          </p>
        </div>

        {/* Login Panel */}
        <div className="bg-[#FFFFFF] border border-[#E5E7EB] rounded-[10px] p-6 space-y-4">
          {/* Mode Switcher */}
          <div className="flex bg-[#F2F3F5] p-1 rounded-[7px]">
            <button
              type="button"
              onClick={() => setMode('role')}
              className={`flex-1 py-1.5 text-[12px] font-medium rounded-[5px] transition-colors cursor-pointer flex items-center justify-center gap-1.5 ${
                mode === 'role'
                  ? 'bg-[#FFFFFF] text-[#111111]'
                  : 'text-[#6B7280] hover:text-[#111111]'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-[#0066CC]" />
              <span>Select Role</span>
            </button>
            <button
              type="button"
              onClick={() => setMode('credentials')}
              className={`flex-1 py-1.5 text-[12px] font-medium rounded-[5px] transition-colors cursor-pointer flex items-center justify-center gap-1.5 ${
                mode === 'credentials'
                  ? 'bg-[#FFFFFF] text-[#111111]'
                  : 'text-[#6B7280] hover:text-[#111111]'
              }`}
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span>Account Credentials</span>
            </button>
          </div>

          {errorMsg && (
            <div className="p-2.5 rounded-[7px] bg-[#FEF2F2] border border-[#FECACA] text-[#B91C1C] text-[12px] flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {mode === 'role' ? (
            <div className="space-y-4 pt-1">
              <div>
                <label className="block text-[12px] font-medium text-[#111111] mb-2">
                  Choose Operational Role:
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedRole('admin')}
                    className={`p-3 rounded-[7px] border text-left text-[12px] transition-colors cursor-pointer flex flex-col gap-1 ${
                      selectedRole === 'admin'
                        ? 'bg-[#EAF3FF] border-[#0066CC] text-[#0066CC] font-medium'
                        : 'bg-[#FFFFFF] border-[#E5E7EB] text-[#4B5563] hover:bg-[#F7F8FA]'
                    }`}
                  >
                    <div className="flex items-center gap-1.5">
                      <Shield className="w-4 h-4 text-[#0066CC]" />
                      <span className="font-semibold text-[#111111]">Administrator</span>
                    </div>
                    <span className="text-[11px] text-[#6B7280]">
                      District-wide GIS & alerts
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedRole('camp')}
                    className={`p-3 rounded-[7px] border text-left text-[12px] transition-colors cursor-pointer flex flex-col gap-1 ${
                      selectedRole === 'camp'
                        ? 'bg-[#EAF3FF] border-[#0066CC] text-[#0066CC] font-medium'
                        : 'bg-[#FFFFFF] border-[#E5E7EB] text-[#4B5563] hover:bg-[#F7F8FA]'
                    }`}
                  >
                    <div className="flex items-center gap-1.5">
                      <Tent className="w-4 h-4 text-[#0066CC]" />
                      <span className="font-semibold text-[#111111]">Camp Coordinator</span>
                    </div>
                    <span className="text-[11px] text-[#6B7280]">
                      Field health & hazards
                    </span>
                  </button>
                </div>
              </div>

              {/* Direct Camp Station Selector */}
              {selectedRole === 'camp' && (
                <div className="p-3 bg-[#F7F8FA] border border-[#E5E7EB] rounded-[7px] space-y-1.5">
                  <label className="block text-[12px] font-semibold text-[#111111]">
                    Select Your Assigned Relief Camp Station:
                  </label>
                  <select
                    value={selectedCampId}
                    onChange={(e) => setSelectedCampId(e.target.value)}
                    className="w-full px-3 py-2 text-[12px] font-medium bg-[#FFFFFF] border border-[#E5E7EB] rounded-[7px] text-[#111111] focus:border-[#0066CC]"
                  >
                    {camps.length > 0 ? (
                      camps.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name} — {c.ward || 'Tirunelveli'}
                        </option>
                      ))
                    ) : (
                      <>
                        <option value="camp-1">Camp 01 — Govt High School (Palayamkottai)</option>
                        <option value="camp-2">Camp 02 — Community Hall (Tirunelveli Town)</option>
                        <option value="camp-3">Camp 03 — Sports Complex (Melapalayam)</option>
                        <option value="camp-4">Camp 04 — Panchayat Union Hall</option>
                        <option value="camp-5">Camp 05 — Relief Shelter B</option>
                        <option value="camp-6">Camp 06 — Red Cross Center</option>
                      </>
                    )}
                  </select>
                  <p className="text-[11px] text-[#6B7280]">
                    You can also switch camp stations at any time in the top bar.
                  </p>
                </div>
              )}

              <button
                type="button"
                onClick={handleRoleSignIn}
                disabled={submitting}
                className="w-full py-2.5 px-4 text-[13px] font-medium text-white bg-[#0066CC] hover:bg-[#004C99] rounded-[7px] transition-colors flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 mt-3"
              >
                <span>{submitting ? 'Entering console...' : `Enter as ${selectedRole === 'admin' ? 'District Administrator' : 'Camp Coordinator'}`}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <form onSubmit={handleCredentialsSubmit} className="space-y-4 pt-1">
              <div>
                <label className="block text-[12px] font-medium text-[#111111] mb-1">
                  Email
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@diseasewatch.demo"
                  className="w-full px-3 py-2 text-[13px] bg-[#FFFFFF] border border-[#E5E7EB] rounded-[7px] text-[#111111] focus:border-[#0066CC]"
                />
              </div>

              <div>
                <label className="block text-[12px] font-medium text-[#111111] mb-1">
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3 py-2 text-[13px] bg-[#FFFFFF] border border-[#E5E7EB] rounded-[7px] text-[#111111] focus:border-[#0066CC]"
                />
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setEmail('admin@diseasewatch.demo');
                    setPassword('admin123');
                  }}
                  className="flex-1 py-1 px-2 rounded-[5px] border border-[#E5E7EB] text-[11px] text-[#6B7280] hover:text-[#111111] hover:bg-[#F7F8FA] cursor-pointer"
                >
                  Fill Admin
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEmail('camp@diseasewatch.demo');
                    setPassword('camp123');
                  }}
                  className="flex-1 py-1 px-2 rounded-[5px] border border-[#E5E7EB] text-[11px] text-[#6B7280] hover:text-[#111111] hover:bg-[#F7F8FA] cursor-pointer"
                >
                  Fill Camp
                </button>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-2.5 px-4 text-[13px] font-medium text-white bg-[#0066CC] hover:bg-[#004C99] rounded-[7px] transition-colors flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <span>{submitting ? 'Authenticating...' : 'Sign in'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </form>
          )}
        </div>

        <p className="text-[11px] text-[#6B7280] text-center mt-5">
          Public Health Surveillance Prototype · Non-Diagnostic Decision Aid
        </p>
      </div>
    </div>
  );
};
