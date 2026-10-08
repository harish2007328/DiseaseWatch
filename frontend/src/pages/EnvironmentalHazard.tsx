import React, { useState, useEffect } from 'react';
import {
  Droplets,
  AlertTriangle,
  Send,
  CheckCircle,
  MapPin,
  Trash2,
  Bug,
  Waves,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { createEnvironmentalReport, getCamps, getEnvironmentalReports } from '../services/api';
import { Camp, EnvironmentalReport } from '../types';
import { useNavigate } from 'react-router-dom';

export const EnvironmentalHazard: React.FC = () => {
  const { activeCampId, role } = useAuth();
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
      alert('Failed to submit environmental report');
    } finally {
      setSubmitting(false);
    }
  };

  const hazards = [
    { id: 'water_contamination', label: 'Drinking Water Contamination', icon: Droplets, color: 'text-sky-600' },
    { id: 'stagnant_water', label: 'Stagnant Flood Water / Puddles', icon: Waves, color: 'text-indigo-600' },
    { id: 'sewage_overflow', label: 'Sewage / Latrine Overflow', icon: AlertTriangle, color: 'text-rose-600' },
    { id: 'mosquito_breeding', label: 'High Vector / Mosquito Swarm', icon: Bug, color: 'text-amber-600' },
    { id: 'waste_accumulation', label: 'Solid Waste / Garbage Piles', icon: Trash2, color: 'text-orange-600' },
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-white px-5 py-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
        <div>
          <h1 className="text-lg md:text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <Droplets className="w-5 h-5 text-amber-600" />
            Environmental Hazard Report
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Log water contamination, sanitation issues, and vector breeding points
          </p>
        </div>
      </div>

      {success && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-sm font-semibold flex items-center gap-3">
          <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>Environmental hazard recorded! District surveillance alert updated.</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Form (7 cols) */}
        <div className="lg:col-span-7 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-5">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                Relief Camp
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

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
                Hazard Category
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {hazards.map((h) => {
                  const Icon = h.icon;
                  const isSelected = issueType === h.id;
                  return (
                    <div
                      key={h.id}
                      onClick={() => setIssueType(h.id)}
                      className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center gap-2.5 select-none ${
                        isSelected
                          ? 'border-amber-500 bg-amber-50 text-amber-950 font-semibold ring-1 ring-amber-400'
                          : 'border-slate-200 hover:border-slate-300 bg-slate-50/50 text-slate-700'
                      }`}
                    >
                      <Icon className={`w-4 h-4 ${h.color}`} />
                      <span className="text-xs">{h.label}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Severity Assessment</label>
                <select
                  value={severity}
                  onChange={(e) => setSeverity(e.target.value as any)}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:ring-2 focus:ring-sky-500 focus:outline-none"
                >
                  <option value="mild">Mild (Minor issue)</option>
                  <option value="moderate">Moderate (Potential risk)</option>
                  <option value="severe">Severe (Critical outbreak risk)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" /> Specific Location / Point
                </label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g. Near Latrine Block 2"
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:ring-2 focus:ring-sky-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Hazard Details & Evidence
              </label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe condition, foul odor, water discoloration, vector concentration..."
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:ring-2 focus:ring-sky-500 focus:outline-none leading-relaxed"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 px-4 rounded-xl font-bold text-sm bg-amber-600 hover:bg-amber-700 text-white shadow-lg shadow-amber-600/20 disabled:opacity-50 flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <Send className="w-4 h-4" />
              {submitting ? 'Transmitting Hazard Report...' : 'Log Environmental Incident'}
            </button>
          </form>
        </div>

        {/* Hazard Log List (5 cols) */}
        <div className="lg:col-span-5 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col">
          <h2 className="text-sm font-extrabold text-slate-900 uppercase tracking-wide mb-3">
            Active Environmental Log
          </h2>
          <div className="flex-1 overflow-y-auto space-y-3 max-h-[420px] pr-1">
            {pastReports.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">
                No active hazards logged for this location yet.
              </div>
            ) : (
              pastReports.map((item) => (
                <div key={item.id} className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-slate-800 capitalize">
                      {item.issue_type.replace('_', ' ')}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        item.severity === 'severe'
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {item.severity}
                    </span>
                  </div>
                  {item.location && (
                    <div className="text-[11px] text-slate-500 flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-slate-400" /> {item.location}
                    </div>
                  )}
                  {item.description && (
                    <p className="text-xs text-slate-600 leading-snug">{item.description}</p>
                  )}
                  <div className="text-[10px] text-slate-400 pt-1">
                    Logged: {new Date(item.reported_at).toLocaleString()}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
