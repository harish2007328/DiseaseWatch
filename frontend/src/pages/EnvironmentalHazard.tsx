import React, { useState, useEffect } from 'react';
import {
  Droplets,
  Send,
  CheckCircle,
  AlertTriangle,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { createEnvironmentalReport, getCamps, getEnvironmentalReports } from '../services/api';
import { Camp, EnvironmentalReport } from '../types';
import { useNavigate } from 'react-router-dom';

export const EnvironmentalHazard: React.FC = () => {
  const { activeCampId } = useAuth();
  const navigate = useNavigate();

  const [camps, setCamps] = useState<Camp[]>([]);
  const [selectedCampId, setSelectedCampId] = useState<string>(activeCampId || 'camp-1');
  const [issueType, setIssueType] = useState<string>('water_contamination');
  const [severity, setSeverity] = useState<'mild' | 'moderate' | 'severe'>('severe');
  const [location, setLocation] = useState<string>('Main drinking water storage tank near Block C');
  const [description, setDescription] = useState<string>(
    'Turbid flood water ingress noted into open surface pipe. Odor present.'
  );
  const [pastReports, setPastReports] = useState<EnvironmentalReport[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    getCamps().then((res) => {
      setCamps(res.data || []);
      if (!selectedCampId && res.data.length > 0) {
        setSelectedCampId(res.data[0].id);
      }
    });
    loadPastReports();
  }, [selectedCampId]);

  const loadPastReports = async () => {
    try {
      const res = await getEnvironmentalReports(selectedCampId);
      setPastReports(res.data || []);
    } catch {
      // ignore
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await createEnvironmentalReport({
        camp_id: selectedCampId,
        issue_type: issueType,
        severity,
        location,
        description,
      });
      setSuccess(true);
      loadPastReports();
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const hazards = [
    { id: 'water_contamination', label: 'Water Contamination' },
    { id: 'stagnant_water', label: 'Stagnant Flood Water' },
    { id: 'overflowing_toilets', label: 'Sanitation / Latrine Overflow' },
    { id: 'waste_accumulation', label: 'Waste / Garbage Accumulation' },
    { id: 'vector_breeding', label: 'Mosquito / Vector Breeding Site' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-[26px] font-semibold tracking-tight text-[#111111]">
          Report Environmental Incident
        </h1>
        <p className="text-[13px] text-[#6B7280] mt-0.5">
          Tirunelveli District · Water, sanitation and vector risk monitoring
        </p>
      </div>

      {success && (
        <div className="p-3.5 rounded-[8px] bg-[#EAF3FF] border border-[#BFDBFE] text-[#0066CC] text-[13px] font-medium flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-[#0066CC] shrink-0" />
          <span>Environmental incident logged. Alert dispatched to district sanitation engineers.</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Form (7 cols) */}
        <form onSubmit={handleSubmit} className="lg:col-span-7 bg-[#FFFFFF] p-5 rounded-[8px] border border-[#E5E7EB] space-y-4">
          <div>
            <label className="block text-[12px] font-medium text-[#111111] mb-1.5">
              Camp Station
            </label>
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
          </div>

          <div>
            <label className="block text-[12px] font-medium text-[#111111] mb-1.5">
              Hazard Category
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {hazards.map((h) => {
                const isSelected = issueType === h.id;
                return (
                  <button
                    type="button"
                    key={h.id}
                    onClick={() => setIssueType(h.id)}
                    className={`px-3 py-2 rounded-[7px] border text-left text-[12px] flex items-center justify-between transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-[#EAF3FF] border-[#BFDBFE] text-[#0066CC] font-medium'
                        : 'bg-[#FFFFFF] border-[#E5E7EB] text-[#4B5563] hover:bg-[#F7F8FA]'
                    }`}
                  >
                    <span>{h.label}</span>
                    {isSelected && <span className="text-[11px] font-bold">✓</span>}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-1">
            <div>
              <label className="block text-[12px] font-medium text-[#111111] mb-1">
                Specific Location in Camp
              </label>
              <input
                type="text"
                required
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. Block C water tank"
                className="w-full px-3 py-2 text-[13px] bg-[#FFFFFF] border border-[#E5E7EB] rounded-[7px] text-[#111111] focus:border-[#0066CC]"
              />
            </div>

            <div>
              <label className="block text-[12px] font-medium text-[#111111] mb-1">
                Hazard Severity
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

          <div>
            <label className="block text-[12px] font-medium text-[#111111] mb-1">
              Field Description & Urgency
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 text-[12px] bg-[#FFFFFF] border border-[#E5E7EB] rounded-[7px] text-[#111111] focus:border-[#0066CC]"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-2.5 px-4 text-[13px] font-medium rounded-[7px] bg-[#0066CC] hover:bg-[#004C99] text-white flex items-center justify-center gap-2 transition-colors cursor-pointer disabled:opacity-50"
          >
            <span>{submitting ? 'Submitting...' : 'Submit Environmental Report'}</span>
            <Send className="w-3.5 h-3.5" />
          </button>
        </form>

        {/* History / Logged Incidents (5 cols) */}
        <div className="lg:col-span-5 bg-[#FFFFFF] p-5 rounded-[8px] border border-[#E5E7EB] space-y-3">
          <div className="pb-2 border-b border-[#E5E7EB]">
            <h2 className="text-[15px] font-semibold text-[#111111]">
              Recent Environmental Logs
            </h2>
            <p className="text-[12px] text-[#6B7280]">
              Monitored sanitation & water incidents at this camp
            </p>
          </div>

          <div className="space-y-2">
            {pastReports.length === 0 ? (
              <div className="py-8 text-center text-[12px] text-[#6B7280]">
                No environmental incidents logged for this station.
              </div>
            ) : (
              pastReports.slice(0, 5).map((r) => (
                <div
                  key={r.id}
                  className="p-3 rounded-[7px] border border-[#E5E7EB] text-[12px] space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-[#111111]">
                      {r.issue_type.replace('_', ' ').toUpperCase()}
                    </span>
                    <span
                      className={`text-[10px] font-medium px-2 py-0.5 rounded-[4px] border ${
                        r.severity === 'severe'
                          ? 'bg-[#FEF2F2] text-[#B91C1C] border-[#FECACA]'
                          : 'bg-[#FFFBEB] text-[#92400E] border-[#FDE68A]'
                      }`}
                    >
                      {r.severity}
                    </span>
                  </div>
                  <p className="text-[#4B5563] text-[11px]">{r.location}</p>
                  <p className="text-[#6B7280] text-[11px]">{r.description}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
