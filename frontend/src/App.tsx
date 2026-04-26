import { Routes, Route, Navigate } from 'react-router-dom';
import './index.css';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import DashboardLayout from './pages/DashboardLayout';
import { AuthProvider } from './contexts/AuthContext';

function App() {
  return (
    <AuthProvider>
      <Routes>
        {/* Public */}
        <Route path="/"        element={<LandingPage />} />
        <Route path="/login"   element={<LoginPage />} />
        <Route path="/signup"  element={<SignupPage />} />

        {/* Protected dashboard — DashboardLayout handles auth guard internally */}
        <Route path="/dashboard"          element={<DashboardLayout />} />
        <Route path="/dashboard/history"  element={<DashboardLayout />} />
        <Route path="/dashboard/reports"  element={<DashboardLayout />} />
        <Route path="/dashboard/api"      element={<DashboardLayout />} />
        <Route path="/dashboard/team"     element={<DashboardLayout />} />
        <Route path="/dashboard/billing"  element={<DashboardLayout />} />
        <Route path="/dashboard/settings" element={<DashboardLayout />} />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  );
}

export default App;
