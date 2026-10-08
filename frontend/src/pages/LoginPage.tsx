import React, { useState, useEffect } from 'react';
import {
  Activity,
  Shield,
  Tent,
  ArrowRight,
  Lock,
  UserCheck,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  MapPin,
  LogIn,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getCamps } from '../services/api';
import { Camp } from '../types';

export const LoginPage: React.FC = () => {
  const { loginWithRole, loginWithCredentials } = useAuth();
  const [camps, setCamps] = useState<Camp[]>([]);
  const [selectedCampId, setSelectedCampId] = useState<string>('camp-1');
  const [loadingRole, setLoadingRole] = useState<string | null>(null);

  // Credentials tab state
  const [tab, setTab] = useState<'quick' | 'credentials'>('quick');
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
      .catch(() => {
        // offline fallback
      });
  }, []);

  const handleSelectRole = async (role: 'admin' | 'camp') => {
    setLoadingRole(role);
    setErrorMsg('');
    try {
      if (role === 'admin') {
        await loginWithRole('admin');
      } else {
        const campObj = camps.find((c) => c.id === selectedCampId);
        const campName = campObj ? campObj.name : `Camp (${selectedCampId})`;
        await loginWithRole('camp', selectedCampId, `Coordinator — ${campName}`);
      }
    } catch (err: any) {
      setErrorMsg(err.response?.data?.detail || 'Authentication failed');
    } finally {
      setLoadingRole(null);
    }
  };

  const handleCredentialsLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg('');
    try {
      await loginWithCredentials(email, password);
    } catch (err: any) {
      setErrorMsg(
        err.response?.data?.detail || 'Invalid email or password. Please verify credentials.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const fillDemoCreds = (type: 'admin' | 'camp') => {
    if (type === 'admin') {
      setEmail('admin@districthealth.gov.in');
      setPassword('admin123');
    } else {
      setEmail('camp@reliefcamp.org');
      setPassword('camp123');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-slate-100 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-2xl text-center relative z-10">
        {/* Brand Icon */}
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-sky-500 to-teal-400 text-white shadow-xl shadow-sky-500/30 mb-4 animate-bounce-slow">
          <Activity className="w-8 h-8 animate-pulse" />
        </div>

        <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white">
          Disease<span className="text-sky-400">Watch</span>
        </h1>
        <p className="mt-2 text-sm text-slate-300 font-medium">
          Post-Disaster Public Health Incident Monitoring, Syndromic Surveillance & Rapid Response System
        </p>

        {/* Non Medical Disclaimer Pill */}
        <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-semibold">
          <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
          <span>Surveillance Prototype • Non-Diagnostic Public Health Aid</span>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-xl relative z-10">
        <div className="bg-white/95 backdrop-blur-xl border border-slate-200/80 rounded-3xl shadow-2xl p-6 sm:p-8 text-slate-900">
          {/* Tab Switcher */}
          <div className="flex bg-slate-100 p-1 rounded-2xl mb-6">
            <button
              onClick={() => setTab('quick')}
              className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                tab === 'quick' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-sky-600" />
              Direct Role Entry (Quick Demo)
            </button>
            <button
              onClick={() => setTab('credentials')}
              className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                tab === 'credentials' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Lock className="w-3.5 h-3.5 text-slate-500" />
              Account Credentials
            </button>
          </div>

          {errorMsg && (
            <div className="mb-5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          {tab === 'quick' ? (
            <div className="space-y-4">
              <div className="text-center mb-4">
                <h2 className="text-base font-extrabold text-slate-900">
                  Select Your Operational Role
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Choose a persona to enter the respective duty console
                </p>
              </div>

              {/* Role 1: District Health Officer */}
              <div
                onClick={() => handleSelectRole('admin')}
                className="group p-5 rounded-2xl border-2 border-slate-200 hover:border-sky-500 bg-slate-50/60 hover:bg-sky-50/40 transition-all cursor-pointer relative overflow-hidden"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3.5">
                    <div className="p-3 rounded-2xl bg-sky-600 text-white shadow-md shadow-sky-600/20 group-hover:scale-105 transition-transform">
                      <Shield className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-extrabold text-sm text-slate-900">
                          District Health Administrator
                        </h3>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-sky-100 text-sky-800 uppercase">
                          Command
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                        Access multi-camp GIS surveillance map, early warning alerts, outbreak cluster radar, and dispatch public-health action directives.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-200/60 flex items-center justify-between text-xs font-bold text-sky-700 group-hover:text-sky-800">
                  <span>Enter District Command Desk</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>

              {/* Role 2: Camp Coordinator */}
              <div className="p-5 rounded-2xl border-2 border-slate-200 hover:border-teal-500 bg-slate-50/60 transition-all">
                <div className="flex items-start gap-3.5">
                  <div className="p-3 rounded-2xl bg-teal-600 text-white shadow-md shadow-teal-600/20">
                    <Tent className="w-6 h-6" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-extrabold text-sm text-slate-900">
                        Relief Camp Coordinator
                      </h3>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-teal-100 text-teal-800 uppercase">
                        Field Unit
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                      Report syndromic symptom clusters with real-time ML risk preview, log environmental hazards, and track assigned action directives.
                    </p>

                    {/* Camp Station Selection */}
                    <div className="mt-3">
                      <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1 flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-teal-600" />
                        Select Assigned Relief Camp Station:
                      </label>
                      <select
                        value={selectedCampId}
                        onChange={(e) => setSelectedCampId(e.target.value)}
                        className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 text-slate-900 cursor-pointer shadow-xs"
                      >
                        {camps.length > 0 ? (
                          camps.map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.name} — ({c.ward}, {c.district})
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

                    <button
                      onClick={() => handleSelectRole('camp')}
                      className="mt-3.5 w-full py-2.5 px-4 rounded-xl text-xs font-bold bg-teal-600 hover:bg-teal-700 text-white shadow-md shadow-teal-600/20 flex items-center justify-center gap-2 transition-all cursor-pointer"
                    >
                      <span>Enter Camp Coordinator Desk</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <form onSubmit={handleCredentialsLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. admin@districthealth.gov.in"
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Password
                </label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              {/* Quick autofill buttons */}
              <div className="pt-1 flex flex-wrap gap-2 text-xs">
                <span className="text-slate-400 text-[11px] self-center">Autofill demo:</span>
                <button
                  type="button"
                  onClick={() => fillDemoCreds('admin')}
                  className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-semibold transition-colors cursor-pointer"
                >
                  Admin (admin123)
                </button>
                <button
                  type="button"
                  onClick={() => fillDemoCreds('camp')}
                  className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-semibold transition-colors cursor-pointer"
                >
                  Camp Coord (camp123)
                </button>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="mt-4 w-full py-3 px-4 rounded-xl text-xs font-bold bg-sky-600 hover:bg-sky-700 text-white shadow-lg shadow-sky-600/20 disabled:opacity-50 flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <LogIn className="w-4 h-4" />
                {submitting ? 'Verifying Credentials...' : 'Authenticate & Enter DiseaseWatch'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
