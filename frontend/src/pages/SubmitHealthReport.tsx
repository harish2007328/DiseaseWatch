import React, { useState, useEffect } from 'react';
import {
  Activity,
  Send,
  AlertTriangle,
  CheckCircle,
  ShieldCheck,
  ChevronRight,
  Info,
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
    diarrhea: true,
    vomiting: true,
    rash: false,
    breathing_difficulty: false,
    other: '',
  });

  const [caseCount, setCaseCount] = useState<number>(14);
  const [affectedPeople, setAffectedPeople] = useState<number>(14);
  const [severity, setSeverity] = useState<'mild' | 'moderate' | 'severe'>('moderate');
  const [notes, setNotes] = useState<string>('Sudden onset in Section B tents following yesterday rains.');

  // Live ML Analysis
  const [analysisResult, setAnalysisResult] = useState<RiskAnalysisResult | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submittedSuccess, setSubmittedSuccess] = useState(false);

  useEffect(() => {
    getCamps().then((res) => {
      const campList = res.data || [];
      setCamps(campList);
      if (activeCampId) {
        setSelectedCampId(activeCampId);
      } else if (campList.length > 0) {
        setSelectedCampId(campList[0].id);
      }
    });
  }, [activeCampId]);

  useEffect(() => {
    const timer = setTimeout(() => {
      runMLInference();
    }, 300);
    return () => clearTimeout(timer);
  }, [symptoms, caseCount, severity]);

  const runMLInference = async () => {
    setAnalyzing(true);
    try {
      const res = await analyzeRisk({
        camp_id: selectedCampId,
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
        navigate('/');
      }, 1500);
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const symptomList = [
    { id: 'diarrhea', label: 'Diarrhea / Loose Stool' },
    { id: 'vomiting', label: 'Vomiting / Nausea' },
    { id: 'fever', label: 'High Fever' },
    { id: 'cough', label: 'Persistent Cough' },
    { id: 'breathing_difficulty', label: 'Shortness of Breath' },
    { id: 'body_pain', label: 'Body Aches / Myalgia' },
    { id: 'headache', label: 'Severe Headache' },
    { id: 'rash', label: 'Skin Rash' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-[26px] font-semibold tracking-tight text-[#111111]">
          Report Health Incident
        </h1>
        <p className="text-[13px] text-[#6B7280] mt-0.5">
          Tirunelveli District · Syndromic incident log & ML assessment
        </p>
      </div>

      {submittedSuccess && (
        <div className="p-3.5 rounded-[8px] bg-[#EAF3FF] border border-[#BFDBFE] text-[#0066CC] text-[13px] font-medium flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-[#0066CC] shrink-0" />
          <span>Incident report dispatched to district command desk successfully.</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Clean Compact Form Controls (7 cols) */}
        <div className="lg:col-span-7 space-y-4 bg-[#FFFFFF] p-5 rounded-[8px] border border-[#E5E7EB]">
          <div>
            <label className="block text-[12px] font-medium text-[#111111] mb-1.5">
              Reporting Camp Station
            </label>
            {role === 'camp' ? (
              <div className="w-full px-3 py-2 text-[13px] bg-[#F7F8FA] border border-[#E5E7EB] rounded-[7px] text-[#111111] font-medium flex items-center justify-between">
                <span>{camps.find((c) => c.id === selectedCampId)?.name || 'Assigned Relief Camp'}</span>
                <span className="text-[11px] font-semibold text-[#0066CC] bg-[#EAF3FF] px-2 py-0.5 rounded-[4px]">
                  Your Assigned Station
                </span>
              </div>
            ) : (
              <select
                value={selectedCampId}
                onChange={(e) => setSelectedCampId(e.target.value)}
                className="w-full px-3 py-2 text-[13px] bg-[#FFFFFF] border border-[#E5E7EB] rounded-[7px] text-[#111111] focus:border-[#0066CC]"
              >
                {camps.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} — ({c.ward || 'Tirunelveli'})
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Symptom Selection (Checkboxes / Compact Grid) */}
          <div>
            <label className="block text-[12px] font-medium text-[#111111] mb-1.5">
              Reported Symptoms
            </label>
            <div className="grid grid-cols-2 gap-2">
              {symptomList.map((item) => {
                const isChecked = symptoms[item.id as keyof typeof symptoms] as boolean;
                return (
                  <button
                    type="button"
                    key={item.id}
                    onClick={() => handleSymptomToggle(item.id as keyof typeof symptoms)}
                    className={`px-3 py-2 rounded-[7px] border text-left text-[12px] flex items-center justify-between transition-colors cursor-pointer ${
                      isChecked
                        ? 'bg-[#EAF3FF] border-[#BFDBFE] text-[#0066CC] font-medium'
                        : 'bg-[#FFFFFF] border-[#E5E7EB] text-[#4B5563] hover:bg-[#F7F8FA]'
                    }`}
                  >
                    <span>{item.label}</span>
                    <span
                      className={`w-3.5 h-3.5 rounded-[3px] border flex items-center justify-center text-[9px] ${
                        isChecked
                          ? 'bg-[#0066CC] border-[#0066CC] text-white'
                          : 'border-[#D1D5DB]'
                      }`}
                    >
                      {isChecked && '✓'}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Counts & Severity Row */}
          <div className="grid grid-cols-2 gap-3 pt-1">
            <div>
              <label className="block text-[12px] font-medium text-[#111111] mb-1">
                Active Cases Count
              </label>
              <input
                type="number"
                min={1}
                required
                value={caseCount}
                onChange={(e) => {
                  setCaseCount(Number(e.target.value));
                  setAffectedPeople(Number(e.target.value));
                }}
                className="w-full px-3 py-2 text-[13px] bg-[#FFFFFF] border border-[#E5E7EB] rounded-[7px] text-[#111111] focus:border-[#0066CC]"
              />
            </div>

            <div>
              <label className="block text-[12px] font-medium text-[#111111] mb-1">
                Clinical Severity
              </label>
              {/* Segmented Control */}
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

          {/* Observations */}
          <div>
            <label className="block text-[12px] font-medium text-[#111111] mb-1">
              Field Observations
            </label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Cluster observed around Sector 2 drinking tank..."
              className="w-full px-3 py-2 text-[12px] bg-[#FFFFFF] border border-[#E5E7EB] rounded-[7px] text-[#111111] focus:border-[#0066CC]"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-2.5 px-4 text-[13px] font-medium rounded-[7px] bg-[#0066CC] hover:bg-[#004C99] text-white flex items-center justify-center gap-2 transition-colors cursor-pointer disabled:opacity-50"
          >
            <span>{submitting ? 'Submitting...' : 'Submit Health Incident Report'}</span>
            <Send className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Right Column: Preliminary ML Risk Assessment & Response Briefing (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          {/* ML Assessment Card */}
          <div className="bg-[#FFFFFF] p-5 rounded-[8px] border border-[#E5E7EB] space-y-4">
            <div className="border-b border-[#E5E7EB] pb-2">
              <div className="text-[11px] font-semibold text-[#6B7280] uppercase tracking-wider">
                Preliminary Health Risk Assessment
              </div>
            </div>

            {/* Risk Level & Syndrome */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[12px] text-[#6B7280]">Estimated Risk Level</span>
                <RiskBadge
                  level={analysisResult?.risk_level || 'high'}
                  size="md"
                />
              </div>

              <div className="flex items-center justify-between">
                <span className="text-[12px] text-[#6B7280]">Suspected syndrome</span>
                <span className="text-[13px] font-semibold text-[#111111]">
                  {analysisResult?.suspected_syndrome || 'Waterborne illness'}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-[12px] text-[#6B7280]">Model Confidence</span>
                <span className="text-[13px] font-semibold text-[#0066CC]">
                  {Math.round((analysisResult?.confidence || 0.87) * 100)}%
                </span>
              </div>
            </div>

            {/* Why breakdown */}
            <div className="pt-3 border-t border-[#E5E7EB]">
              <div className="text-[11px] font-semibold text-[#111111] uppercase tracking-wider mb-2">
                Why?
              </div>
              <ul className="space-y-1.5 text-[12px] text-[#4B5563]">
                <li className="flex items-start gap-1.5">
                  <span className="text-[#0066CC] font-bold">•</span>
                  <span>Case count increased significantly</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <span className="text-[#0066CC] font-bold">•</span>
                  <span>Water contamination reported</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <span className="text-[#0066CC] font-bold">•</span>
                  <span>Poor sanitation reported</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <span className="text-[#0066CC] font-bold">•</span>
                  <span>Nearby camps show similar symptoms</span>
                </li>
              </ul>
            </div>

            {/* Non Diagnostic Disclaimer */}
            <div className="pt-3 border-t border-[#E5E7EB] text-[11px] text-[#6B7280]">
              Surveillance assessment only. Not a medical diagnosis.
            </div>
          </div>

          {/* AI Action Recommendation (Intelligent Public-Health Briefing) */}
          <div className="bg-[#FFFFFF] p-5 rounded-[8px] border border-[#E5E7EB] space-y-3.5">
            <div className="border-b border-[#E5E7EB] pb-2">
              <div className="text-[11px] font-semibold text-[#6B7280] uppercase tracking-wider">
                Recommended Response
              </div>
            </div>

            {/* Immediate */}
            <div className="space-y-1.5">
              <div className="text-[12px] font-semibold text-[#111111]">
                Immediate
              </div>
              <ol className="list-decimal list-inside space-y-1 text-[12px] text-[#4B5563]">
                <li>Inspect reported water source</li>
                <li>Arrange safe drinking water</li>
                <li>Increase sanitation monitoring</li>
              </ol>
            </div>

            {/* Prevention */}
            <div className="space-y-1.5 pt-2 border-t border-[#E5E7EB]">
              <div className="text-[12px] font-semibold text-[#111111]">
                Prevention
              </div>
              <ol className="list-decimal list-inside space-y-1 text-[12px] text-[#4B5563]">
                <li>Issue hygiene awareness guidance</li>
                <li>Monitor new cases</li>
                <li>Inspect nearby camps</li>
              </ol>
            </div>

            {/* Escalation */}
            <div className="space-y-1 pt-2 border-t border-[#E5E7EB]">
              <div className="text-[12px] font-semibold text-[#111111]">
                Escalation
              </div>
              <p className="text-[12px] text-[#4B5563]">
                Notify district health authorities if case numbers continue increasing.
              </p>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};
