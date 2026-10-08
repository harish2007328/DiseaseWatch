import React, { useState, useEffect } from 'react';
import {
  Activity,
  Sparkles,
  Send,
  AlertTriangle,
  CheckCircle,
  HelpCircle,
  Thermometer,
  Wind,
  ShieldCheck,
  RefreshCw,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { analyzeRisk, createHealthReport, getCamps } from '../services/api';
import { Camp, RiskAnalysisResult } from '../types';
import { RiskBadge } from '../components/RiskBadge';
import { useNavigate } from 'react-router-dom';

export const SubmitHealthReport: React.FC = () => {
  const { activeCampId, role } = useAuth();
  const navigate = useNavigate();

  const [camps, setCamps] = useState<Camp[]>([]);
  const [selectedCampId, setSelectedCampId] = useState<string>(activeCampId || 'camp-1');

  // Symptoms
  const [symptoms, setSymptoms] = useState({
    fever: false,
    headache: false,
    body_pain: false,
    cough: false,
    diarrhea: false,
    vomiting: false,
    rash: false,
    breathing_difficulty: false,
    other: '',
  });

  const [caseCount, setCaseCount] = useState<number>(12);
  const [affectedPeople, setAffectedPeople] = useState<number>(12);
  const [severity, setSeverity] = useState<'mild' | 'moderate' | 'severe'>('moderate');
  const [notes, setNotes] = useState<string>('Sudden onset in Section B tents following yesterday rains.');

  // Live ML Analysis
  const [analysisResult, setAnalysisResult] = useState<RiskAnalysisResult | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submittedSuccess, setSubmittedSuccess] = useState(false);

  useEffect(() => {
    getCamps().then((res) => {
      setCamps(res.data || []);
      if (!selectedCampId && res.data.length > 0) {
        setSelectedCampId(res.data[0].id);
      }
    });
  }, []);

  // Run live ML inference whenever symptoms or case count changes
  useEffect(() => {
    const timer = setTimeout(() => {
      runMLInference();
    }, 400);
    return () => clearTimeout(timer);
  }, [symptoms, caseCount, severity]);

  const runMLInference = async () => {
    setAnalyzing(true);
    try {
      const res = await analyzeRisk({
        symptoms,
        case_count: Number(caseCount) || 1,
        severity,
        environmental_factors: ['stagnant water', 'crowding'],
      });
      setAnalysisResult(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setAnalyzing(false);
    }
  };

  const handleSymptomToggle = (key: keyof typeof symptoms) => {
    if (key === 'other') return;
    setSymptoms((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await createHealthReport({
        camp_id: selectedCampId,
        symptoms,
        case_count: Number(caseCount) || 1,
        affected_people: Number(affectedPeople) || Number(caseCount) || 1,
        severity,
        notes,
      });
      setSubmittedSuccess(true);
      setTimeout(() => {
        navigate(role === 'admin' ? '/' : '/');
      }, 1800);
    } catch (err) {
      console.error(err);
      alert('Failed to submit report. Please check backend connection.');
    } finally {
      setSubmitting(false);
    }
  };

  const symptomList = [
    { id: 'fever', label: 'Fever (High grade)', icon: Thermometer },
    { id: 'diarrhea', label: 'Watery Diarrhea / Loose Stool', icon: Activity },
    { id: 'vomiting', label: 'Persistent Vomiting / Nausea', icon: Activity },
    { id: 'breathing_difficulty', label: 'Shortness of Breath', icon: Wind },
    { id: 'cough', label: 'Severe Persistent Cough', icon: Wind },
    { id: 'body_pain', label: 'Acute Body Aches / Myalgia', icon: Activity },
    { id: 'headache', label: 'Retro-orbital Headache', icon: Activity },
    { id: 'rash', label: 'Petechial / Skin Rash', icon: Activity },
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <Activity className="w-5 h-5 text-sky-600" />
            Field Health Incident Report
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Report syndromic clusters and unusual health manifestations directly to the district surveillance network
          </p>
        </div>
      </div>

      {submittedSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-sm font-semibold flex items-center gap-3">
          <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>Incident report dispatched successfully! Redirecting to command center...</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Form Controls (7 cols) */}
        <div className="lg:col-span-7 space-y-5 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
          {/* Camp Selector */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
              Target Relief Camp
            </label>
            <select
              value={selectedCampId}
              onChange={(e) => setSelectedCampId(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm font-medium rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500"
            >
              {camps.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} — ({c.ward}, {c.district})
                </option>
              ))}
            </select>
          </div>

          {/* Symptoms Checklist */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">
                Presenting Syndromic Symptoms
              </label>
              <span className="text-[11px] text-slate-400 font-medium">Select all observed</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {symptomList.map((sym) => {
                const Icon = sym.icon;
                const isChecked = symptoms[sym.id as keyof typeof symptoms] as boolean;
                return (
                  <div
                    key={sym.id}
                    onClick={() => handleSymptomToggle(sym.id as any)}
                    className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center gap-2.5 select-none ${
                      isChecked
                        ? 'border-sky-500 bg-sky-50 text-sky-950 font-semibold ring-1 ring-sky-400'
                        : 'border-slate-200 hover:border-slate-300 bg-slate-50/50 text-slate-700'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => {}}
                      className="rounded text-sky-600 focus:ring-sky-500 h-4 w-4"
                    />
                    <span className="text-xs">{sym.label}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Case Counts & Severity */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-2">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Estimated Case Count
              </label>
              <input
                type="number"
                min="1"
                value={caseCount}
                onChange={(e) => setCaseCount(parseInt(e.target.value) || 1)}
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:ring-2 focus:ring-sky-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Total Exposed / Affected
              </label>
              <input
                type="number"
                min="1"
                value={affectedPeople}
                onChange={(e) => setAffectedPeople(parseInt(e.target.value) || 1)}
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:ring-2 focus:ring-sky-500 focus:outline-none"
              />
            </div>

            <div className="col-span-2 sm:col-span-1">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Assessed Severity
              </label>
              <select
                value={severity}
                onChange={(e) => setSeverity(e.target.value as any)}
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:ring-2 focus:ring-sky-500 focus:outline-none"
              >
                <option value="mild">Mild</option>
                <option value="moderate">Moderate</option>
                <option value="severe">Severe</option>
              </select>
            </div>
          </div>

          {/* Qualitative Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Field Observations & Specific Context
            </label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g., Clustered primarily among young children in tent zone B. Common water tanker used."
              className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:ring-2 focus:ring-sky-500 focus:outline-none leading-relaxed"
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 px-4 rounded-xl font-bold text-sm bg-sky-600 hover:bg-sky-700 text-white shadow-lg shadow-sky-600/20 disabled:opacity-50 flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <Send className="w-4 h-4" />
            {submitting ? 'Submitting to District Network...' : 'Submit Health Incident Report'}
          </button>
        </div>

        {/* Right Column: Live AI Risk & Syndrome Preview (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white p-5 rounded-2xl shadow-xl border border-slate-700 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <Sparkles className="w-24 h-24 text-sky-400" />
            </div>

            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-sky-500/20 text-sky-400 border border-sky-500/30">
                  <Sparkles className="w-4 h-4" />
                </span>
                <span className="text-xs font-extrabold uppercase tracking-wider text-sky-300">
                  Live ML Risk Assessment
                </span>
              </div>
              {analyzing && <RefreshCw className="w-3.5 h-3.5 animate-spin text-sky-400" />}
            </div>

            {analysisResult ? (
              <div className="space-y-4">
                {/* Risk Level Badge */}
                <div className="p-4 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between">
                  <div>
                    <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                      Calculated Threat Level
                    </div>
                    <div className="mt-1">
                      <RiskBadge level={analysisResult.risk_level} size="lg" />
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                      Model Confidence
                    </div>
                    <div className="text-xl font-black text-sky-400">
                      {Math.round(analysisResult.confidence * 100)}%
                    </div>
                  </div>
                </div>

                {/* Suspected Syndrome */}
                <div className="p-3.5 rounded-xl bg-sky-950/40 border border-sky-500/30">
                  <div className="text-[10px] uppercase font-bold text-sky-400 tracking-wider">
                    Suspected Syndromic Classification
                  </div>
                  <div className="text-base font-black text-white mt-0.5">
                    {analysisResult.suspected_syndrome}
                  </div>
                </div>

                {/* Contributing factors */}
                <div>
                  <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-2">
                    Key Risk Contributing Drivers
                  </div>
                  <div className="space-y-1.5 text-xs text-slate-300">
                    {analysisResult.reasons.map((reason, idx) => (
                      <div key={idx} className="flex items-start gap-2">
                        <span className="text-sky-400 font-bold">•</span>
                        <span>{reason}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Non Diagnostic Disclaimer in Preview */}
                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-[11px] text-amber-200/90 leading-relaxed">
                  <strong className="text-amber-300">Surveillance Notice:</strong> This machine learning model
                  provides syndromic risk signals to alert district health authorities for water testing and
                  preventive sanitation. It is not an individual medical diagnosis.
                </div>
              </div>
            ) : (
              <div className="py-12 text-center text-xs text-slate-400">
                Evaluating input vectors...
              </div>
            )}
          </div>

          {/* Quick Guidance Box */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2 text-xs text-slate-600">
            <h4 className="font-bold text-slate-800 flex items-center gap-1.5 text-xs">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              Standard Protocol Checklist
            </h4>
            <p>
              • If acute diarrhea is reported with dehydration symptoms, activate the Camp Oral Hydration Corner
              immediately.
            </p>
            <p>
              • Reports with &gt;10 sudden fever or diarrhea cases automatically alert the District Surveillance Unit.
            </p>
          </div>
        </div>
      </form>
    </div>
  );
};
