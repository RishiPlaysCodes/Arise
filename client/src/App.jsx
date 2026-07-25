import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './hooks/useAuth';
import Layout from './components/Layout';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import SetupPage from './pages/SetupPage';
import DashboardPage from './pages/DashboardPage';
import QuestsPage from './pages/QuestsPage';
import DietPage from './pages/DietPage';
import StepsPage from './pages/StepsPage';
import CombatPage from './pages/CombatPage';
import ProfilePage from './pages/ProfilePage';
import PunishmentPage from './pages/PunishmentPage';

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-sl-dark">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-sl-purple border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-sl-purple-light font-game text-lg">Loading System...</p>
        </div>
      </div>
    );
  }

  if (!user) return <Navigate to="/login" />;
  return children;
}

function SetupGuard({ children }) {
  const { bodyProfile, loading } = useAuth();
  
  if (loading) return null;
  if (!bodyProfile) return <Navigate to="/setup" />;
  return children;
}

function AppRoutes() {
  const { user } = useAuth();

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/dashboard" /> : <LoginPage />} />
      <Route path="/register" element={user ? <Navigate to="/dashboard" /> : <RegisterPage />} />
      <Route path="/setup" element={
        <ProtectedRoute><SetupPage /></ProtectedRoute>
      } />
      <Route path="/" element={
        <ProtectedRoute>
          <SetupGuard>
            <Layout />
          </SetupGuard>
        </ProtectedRoute>
      }>
        <Route index element={<Navigate to="/dashboard" />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="quests" element={<QuestsPage />} />
        <Route path="diet" element={<DietPage />} />
        <Route path="steps" element={<StepsPage />} />
        <Route path="combat" element={<CombatPage />} />
        <Route path="profile" element={<ProfilePage />} />
        <Route path="punishment" element={<PunishmentPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/dashboard" />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
