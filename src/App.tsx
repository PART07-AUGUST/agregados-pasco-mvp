import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './shared/stores/useAuthStore';
import { ProtectedRoute } from './routes/ProtectedRoute';
import { useInactivityTimeout } from './shared/hooks/useInactivityTimeout';

import { LandingPage } from './pages/LandingPage';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { Unauthorized } from './pages/Unauthorized';
import { AdminDashboard } from './pages/AdminDashboard';
import { ClientDashboard } from './pages/ClientDashboard';
import { DriverDashboard } from './pages/DriverDashboard';

function InactivityWatcher() {
  useInactivityTimeout();
  return null;
}

function App() {
  const initializeAuth = useAuthStore((state) => state.initialize);

  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  return (
    <BrowserRouter>
      <InactivityWatcher />
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/unauthorized" element={<Unauthorized />} />

        <Route element={<ProtectedRoute allowedRoles={['ADMINISTRADOR']} />}>
          <Route path="/admin" element={<AdminDashboard />} />
        </Route>

        <Route element={<ProtectedRoute allowedRoles={['CONDUCTOR']} />}>
          <Route path="/conductor" element={<DriverDashboard />} />
        </Route>

        <Route element={<ProtectedRoute allowedRoles={['CLIENTE']} />}>
          <Route path="/cliente" element={<ClientDashboard />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
