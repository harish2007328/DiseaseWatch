import React, { useState } from 'react';
import {
  Sliders,
  Play,
  RotateCcw,
  CheckCircle,
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

  const symptomList = [
    { id: 'fever', label: 'High Fever' },
    { id: 'headache', label: 'Severe Headache' },
    { id: 'body_pain', label: 'Body Pain / Myalgia' },
    { id: 'rash', label: 'Skin Rash' },
    { id: 'diarrhea', label: 'Watery Diarrhea' },
    { id: 'vomiting', label: 'Persistent Vomiting' },
    { id: 'cough', label: 'Persistent Cough' },
    { id: 'breathing_difficulty', label: 'Breathing Difficulty' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-[26px] font-semibold tracking-tight text-[#111111]">
          Epidemiological ML Sandbox
        </h1>
        <p className="text-[13px] text-[#6B7280] mt-0.5">
          Tirunelveli District · Simulate outbreak parameters & test model response
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Simulation Controls (6 cols) */}
        <div className="lg:col-span-6 bg-[#FFFFFF] p-5 rounded-[8px] border border-[#E5E7EB] space-y-4">
          <div className="pb-2 border-b border-[#E5E7EB]">
            <h2 className="text-[15px] font-semibold text-[#111111]">
              Simulation Parameters
            </h2>
          </div>

          <div>
            <label className="block text-[12px] font-medium text-[#111111] mb-1.5">
              Active Syndromic Symptoms
            </label>
            <div className="grid grid-cols-2 gap-2">
              {symptomList.map((item) => {
                const isChecked = symptoms[item.id as keyof typeof symptoms] as boolean;
                return (
                  <button
                    type="button"
                    key={item.id}
                    onClick={() =>
                      setSymptoms({ ...symptoms, [item.id]: !isChecked })
                    }
                    className={`px-3 py-2 rounded-[7px] border text-left text-[12px] flex items-center justify-between transition-colors cursor-pointer ${
                      isChecked
                        ? 'bg-[#EAF3FF] border-[#BFDBFE] text-[#0066CC] font-medium'
                        : 'bg-[#FFFFFF] border-[#E5E7EB] text-[#4B5563] hover:bg-[#F7F8FA]'
                    }`}
                  >
                    <span>{item.label}</span>
                    <span className="text-[11px] font-semibold">
                      {isChecked ? '✓' : ''}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-1">
            <div>
              <label className="block text-[12px] font-medium text-[#111111] mb-1">
                Simulated Case Count: {caseCount}
              </label>
              <input
                type="range"
                min={1}
                max={60}
                value={caseCount}
                onChange={(e) => setCaseCount(Number(e.target.value))}
                className="w-full h-1.5 bg-[#E5E7EB] rounded-lg appearance-none cursor-pointer accent-[#0066CC]"
              />
            </div>

            <div>
              <label className="block text-[12px] font-medium text-[#111111] mb-1">
                Clinical Severity
              </label>
              <div className="flex bg-[#F2F3F5] p-1 rounded-[7px]">
                {(['mild', 'moderate', 'severe'] as const).map((sev) => (
                  <button
                    type="button"
                    key={sev}
                    onClick={() => setSeverity(sev)}
                    className={`flex-1 py-1 text-[11px] font-medium rounded-[5px] capitalize transition-colors cursor-pointer ${
                      severity === sev
                        ? 'bg-[#FFFFFF] text-[#111111]'
                        : 'text-[#6B7280] hover:text-[#111111]'
                    }`}
                  >
                    {sev}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <button
            onClick={handleRunModel}
            disabled={loading}
            className="w-full py-2.5 px-4 text-[13px] font-medium rounded-[7px] bg-[#0066CC] hover:bg-[#004C99] text-white flex items-center justify-center gap-2 transition-colors cursor-pointer disabled:opacity-50"
          >
            <Play className="w-3.5 h-3.5" />
            <span>{loading ? 'Evaluating Model...' : 'Run Simulation'}</span>
          </button>
        </div>

        {/* Results Panel (6 cols) */}
        <div className="lg:col-span-6 space-y-4">
          <div className="bg-[#FFFFFF] p-5 rounded-[8px] border border-[#E5E7EB] space-y-4">
            <div className="pb-2 border-b border-[#E5E7EB]">
              <div className="text-[11px] font-semibold text-[#6B7280] uppercase tracking-wider">
                Preliminary Health Risk Assessment
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[12px] text-[#6B7280]">Estimated Risk</span>
                <RiskBadge level={result?.risk_level || 'high'} size="md" />
              </div>

              <div className="flex items-center justify-between">
                <span className="text-[12px] text-[#6B7280]">Suspected syndrome</span>
                <span className="text-[13px] font-semibold text-[#111111]">
                  {result?.suspected_syndrome || 'Vector-Borne Illness (Dengue/Malaria)'}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-[12px] text-[#6B7280]">Confidence</span>
                <span className="text-[13px] font-semibold text-[#0066CC]">
                  {Math.round((result?.confidence || 0.88) * 100)}%
                </span>
              </div>
            </div>

            <div className="pt-3 border-t border-[#E5E7EB]">
              <div className="text-[11px] font-semibold text-[#111111] uppercase tracking-wider mb-2">
                Why?
              </div>
              <ul className="space-y-1.5 text-[12px] text-[#4B5563]">
                <li className="flex items-start gap-1.5">
                  <span className="text-[#0066CC] font-bold">•</span>
                  <span>Cluster of febrile symptoms with retro-orbital headache</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <span className="text-[#0066CC] font-bold">•</span>
                  <span>Environmental vector breeding risk present</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <span className="text-[#0066CC] font-bold">•</span>
                  <span>Case velocity exceeds 3-day baseline threshold</span>
                </li>
              </ul>
            </div>

            <div className="pt-3 border-t border-[#E5E7EB] text-[11px] text-[#6B7280]">
              Surveillance assessment only. Not a medical diagnosis.
            </div>
          </div>

          {/* Recommended Response */}
          <div className="bg-[#FFFFFF] p-5 rounded-[8px] border border-[#E5E7EB] space-y-3">
            <div className="pb-2 border-b border-[#E5E7EB]">
              <div className="text-[11px] font-semibold text-[#6B7280] uppercase tracking-wider">
                Recommended Response
              </div>
            </div>

            <div className="space-y-1 text-[12px]">
              <div className="font-semibold text-[#111111]">Immediate</div>
              <ol className="list-decimal list-inside space-y-0.5 text-[#4B5563]">
                <li>Inspect mosquito breeding sites in camp perimeters</li>
                <li>Deploy thermal fogging and anti-larval spray</li>
                <li>Distribute insecticide-treated bed nets</li>
              </ol>
            </div>

            <div className="space-y-1 pt-2 border-t border-[#E5E7EB] text-[12px]">
              <div className="font-semibold text-[#111111]">Prevention</div>
              <ol className="list-decimal list-inside space-y-0.5 text-[#4B5563]">
                <li>Conduct camp-wide fever screening survey</li>
                <li>Eliminate open stagnant puddles</li>
              </ol>
            </div>

            <div className="pt-2 border-t border-[#E5E7EB] text-[12px]">
              <div className="font-semibold text-[#111111]">Escalation</div>
              <p className="text-[#4B5563] mt-0.5">
                Dispatch rapid medical response unit if cases cross 25 count.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
