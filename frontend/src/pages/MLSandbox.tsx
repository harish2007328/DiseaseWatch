import React, { useState } from 'react';
import {
  Cpu,
  Sparkles,
  Play,
  RotateCcw,
  ShieldCheck,
  TrendingUp,
  Sliders,
  CheckCircle,
  HelpCircle,
} from 'lucide-react';
import { analyzeRisk, getRecommendation } from '../services/api';
import { RiskAnalysisResult, Recommendation } from '../types';
import { RiskBadge } from '../components/RiskBadge';

export const MLSandbox: React.FC = () => {
  const [symptoms, setSymptoms] = useState({
    fever: true,
    headache: true,
    body_pain: true,
    cough: false,
    diarrhea: false,
    vomiting: false,
    rash: true,
    breathing_difficulty: false,
    other: '',
  });

  const [caseCount, setCaseCount] = useState<number>(18);
  const [severity, setSeverity] = useState<'mild' | 'moderate' | 'severe'>('severe');
  const [envFactors, setEnvFactors] = useState<string[]>(['stagnant_water', 'high_mosquito_density']);

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<RiskAnalysisResult | null>(null);
  const [recommendation, setRecommendation] = useState<Recommendation | null>(null);

  const handleRunModel = async () => {
    setLoading(true);
    try {
      const riskRes = await analyzeRisk({
        symptoms,
        case_count: caseCount,
        severity,
        environmental_factors: envFactors,
      });
      setResult(riskRes.data);

      const recRes = await getRecommendation({
        alert_reason: `Simulated: ${caseCount} cases with ${riskRes.data.suspected_syndrome}`,
        syndrome: riskRes.data.suspected_syndrome,
        severity: riskRes.data.risk_level,
        environmental_context: envFactors,
      });
      setRecommendation(recRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const toggleSymptom = (key: keyof typeof symptoms) => {
    if (key === 'other') return;
    setSymptoms((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const toggleEnv = (env: string) => {
    setEnvFactors((prev) =>
      prev.includes(env) ? prev.filter((e) => e !== env) : [...prev, env]
    );
  };

  const resetAll = () => {
    setSymptoms({
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
    setCaseCount(5);
    setSeverity('mild');
    setEnvFactors([]);
    setResult(null);
    setRecommendation(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white px-5 py-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h1 className="text-lg md:text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <Cpu className="w-5 h-5 text-purple-600" />
            ML Syndromic Inference Sandbox
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Test multi-vector symptom & environmental feature sets in real-time
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={resetAll}
            className="px-3.5 py-2 text-xs font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center gap-1.5 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset Inputs
          </button>
          <button
            onClick={handleRunModel}
            disabled={loading}
            className="px-4 py-2 text-xs font-bold rounded-xl bg-purple-600 hover:bg-purple-700 text-white shadow-md shadow-purple-600/20 flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            {loading ? 'Evaluating Model...' : 'Execute Inference'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Input Parameters (6 cols) */}
        <div className="lg:col-span-6 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-5">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-600">
            <Sliders className="w-4 h-4 text-purple-600" />
            1. Input Feature Vector
          </div>

          {/* Symptoms */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-2">
              Symptom Co-occurrence Matrix
            </label>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(symptoms)
                .filter(([k]) => k !== 'other')
                .map(([symKey, val]) => (
                  <div
                    key={symKey}
                    onClick={() => toggleSymptom(symKey as any)}
                    className={`p-2.5 rounded-xl border text-xs font-medium cursor-pointer transition-all flex items-center gap-2 select-none ${
                      val
                        ? 'border-purple-500 bg-purple-50 text-purple-950 font-semibold ring-1 ring-purple-400'
                        : 'border-slate-200 bg-slate-50/50 text-slate-700 hover:border-slate-300'
                    }`}
                  >
                    <input type="checkbox" checked={Boolean(val)} onChange={() => {}} className="rounded text-purple-600" />
                    <span className="capitalize">{symKey.replace('_', ' ')}</span>
                  </div>
                ))}
            </div>
          </div>

          {/* Case count & severity */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Incident Volume: {caseCount} cases
              </label>
              <input
                type="range"
                min="1"
                max="50"
                value={caseCount}
                onChange={(e) => setCaseCount(parseInt(e.target.value))}
                className="w-full accent-purple-600"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Observed Severity</label>
              <select
                value={severity}
                onChange={(e) => setSeverity(e.target.value as any)}
                className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-200 focus:ring-2 focus:ring-purple-500 focus:outline-none"
              >
                <option value="mild">Mild</option>
                <option value="moderate">Moderate</option>
                <option value="severe">Severe</option>
              </select>
            </div>
          </div>

          {/* Environmental Hazard Factors */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-2">
              Environmental Risk Co-Factors
            </label>
            <div className="space-y-1.5">
              {[
                { id: 'water_contamination', label: 'Suspected Drinking Water Contamination' },
                { id: 'stagnant_water', label: 'Flood Stagnant Water / Puddles Around Tents' },
                { id: 'high_mosquito_density', label: 'High Vector / Mosquito Swarm Density' },
                { id: 'sewage_overflow', label: 'Latrine Inundation / Sewage Overflow' },
              ].map((item) => {
                const isSelected = envFactors.includes(item.id);
                return (
                  <div
                    key={item.id}
                    onClick={() => toggleEnv(item.id)}
                    className={`p-2.5 rounded-xl border text-xs cursor-pointer transition-all flex items-center gap-2 ${
                      isSelected
                        ? 'border-amber-500 bg-amber-50 text-amber-950 font-semibold'
                        : 'border-slate-200 bg-slate-50/50 text-slate-700'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => {}}
                      className="rounded text-amber-600"
                    />
                    <span>{item.label}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Model Output & Explainability (6 cols) */}
        <div className="lg:col-span-6 space-y-5">
          <div className="bg-slate-900 text-white p-6 rounded-2xl border border-slate-800 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold uppercase tracking-wider text-purple-400 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4" />
                Model Inference Output
              </span>
              {result && <RiskBadge level={result.risk_level} size="md" />}
            </div>

            {result ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-white/5 p-3.5 rounded-xl border border-white/10">
                    <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                      Suspected Syndrome
                    </span>
                    <div className="text-sm font-extrabold text-white mt-1">
                      {result.suspected_syndrome}
                    </div>
                  </div>
                  <div className="bg-white/5 p-3.5 rounded-xl border border-white/10">
                    <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                      Model Confidence
                    </span>
                    <div className="text-2xl font-black text-purple-400 mt-0.5">
                      {Math.round(result.confidence * 100)}%
                    </div>
                  </div>
                </div>

                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block mb-1.5">
                    Model Reasoning & Feature Attribution:
                  </span>
                  <div className="space-y-1.5 text-xs text-slate-300">
                    {result.reasons.map((r, i) => (
                      <div key={i} className="flex items-start gap-2 bg-white/5 p-2 rounded-lg">
                        <span className="text-purple-400 font-bold">•</span>
                        <span>{r}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-12 text-center text-xs text-slate-400">
                Click "Execute Inference" to run the model against current feature vectors.
              </div>
            )}
          </div>

          {/* AI Recommended Response Protocol */}
          {recommendation && (
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                Synthesized Public Health Protocols
              </h3>

              <div className="space-y-2 text-xs">
                <div className="p-3 bg-sky-50 rounded-xl text-sky-900 border border-sky-100">
                  <strong className="block mb-1 text-sky-950 font-bold">Priority Field Interventions:</strong>
                  <ul className="list-disc pl-4 space-y-1 text-sky-800">
                    {recommendation.immediate_actions?.map((act, i) => (
                      <li key={i}>{act}</li>
                    ))}
                  </ul>
                </div>

                {recommendation.awareness_message && (
                  <div className="p-3 bg-amber-50 rounded-xl text-amber-900 border border-amber-100">
                    <strong className="block mb-1 text-amber-950 font-bold">Community Advisory:</strong>
                    <p className="italic text-amber-800">"{recommendation.awareness_message}"</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
