import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { DisclaimerBanner } from './components/DisclaimerBanner';
import { AdminDashboard } from './pages/AdminDashboard';
import { CampDashboard } from './pages/CampDashboard';
import { DistrictMapView } from './pages/DistrictMapView';
import { VerificationQueue } from './pages/VerificationQueue';
import { AlertsAndActionsView } from './pages/AlertsAndActionsView';
import { ClusterAnalysisView } from './pages/ClusterAnalysisView';
import { MLSandbox } from './pages/MLSandbox';
import { SubmitHealthReport } from './pages/SubmitHealthReport';
import { EnvironmentalHazard } from './pages/EnvironmentalHazard';
import { useAuth } from './context/AuthContext';
import { Activity, ShieldCheck } from 'lucide-react';

export const App: React.FC = () => {
  const { role } = useAuth();

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 font-sans">
      <DisclaimerBanner />
      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full">
        <Routes>
          {/* Main overview switches automatically between Admin and Camp based on selected active role */}
          <Route path="/" element={role === 'admin' ? <AdminDashboard /> : <CampDashboard />} />
          <Route path="/map" element={<DistrictMapView />} />
          <Route path="/verification" element={<VerificationQueue />} />
          <Route path="/alerts-actions" element={<AlertsAndActionsView />} />
          <Route path="/clusters" element={<ClusterAnalysisView />} />
          <Route path="/ml-sandbox" element={<MLSandbox />} />
          <Route path="/report" element={<SubmitHealthReport />} />
          <Route path="/environmental" element={<EnvironmentalHazard />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-6 mt-12 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-sky-600 flex items-center justify-center text-white">
              <Activity className="w-3.5 h-3.5" />
            </div>
            <span className="font-bold text-slate-800">DiseaseWatch System</span>
            <span className="text-slate-400">• Post-Disaster Health Surveillance & Outbreak Interceptor</span>
          </div>

          <div className="flex items-center gap-4 text-slate-400 text-[11px]">
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              Non-Diagnostic Public Health Aid
            </span>
            <span>•</span>
            <span>Hackathon Prototype v1.0</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
