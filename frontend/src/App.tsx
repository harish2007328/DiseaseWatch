import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AppLayout } from './components/AppLayout';
import { LoginPage } from './pages/LoginPage';
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

export const App: React.FC = () => {
  const { isAuthenticated, role } = useAuth();

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  return (
    <AppLayout>
      <Routes>
        <Route path="/" element={role === 'admin' ? <AdminDashboard /> : <CampDashboard />} />
        <Route path="/map" element={<DistrictMapView />} />
        <Route
          path="/report"
          element={role === 'camp' ? <SubmitHealthReport /> : <Navigate to="/" replace />}
        />
        <Route
          path="/environmental"
          element={role === 'camp' ? <EnvironmentalHazard /> : <Navigate to="/" replace />}
        />
        <Route path="/alerts-actions" element={<AlertsAndActionsView />} />
        
        {/* District Administrator Exclusive Modules */}
        <Route
          path="/verification"
          element={role === 'admin' ? <VerificationQueue /> : <Navigate to="/" replace />}
        />
        <Route
          path="/clusters"
          element={role === 'admin' ? <ClusterAnalysisView /> : <Navigate to="/" replace />}
        />
        <Route
          path="/ml-sandbox"
          element={role === 'admin' ? <MLSandbox /> : <Navigate to="/" replace />}
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AppLayout>
  );
};

export default App;
