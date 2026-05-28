import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './shared/stores/useAuthStore';
import { ProtectedRoute } from './routes/ProtectedRoute';

// Importación de Páginas Modulares
import { LandingPage } from './pages/LandingPage';
import { Login } from './pages/Login';
import { Unauthorized } from './pages/Unauthorized';
import { AdminDashboard } from './pages/AdminDashboard';
import { DriverDashboard } from './pages/DriverDashboard';

function App() {
  const initializeAuth = useAuthStore((state) => state.initialize);

  useEffect(() => {
    // Sincronizar sesión y suscripción en caliente de Supabase al levantar el App
    initializeAuth();
  }, [initializeAuth]);

  return (
    <BrowserRouter>
      <Routes>
        {/* 1. RUTAS PÚBLICAS */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/unauthorized" element={<Unauthorized />} />

        {/* 2. RUTAS PRIVADAS: PORTAL ADMINISTRADOR (RLS PROTEGIDA) */}
        <Route element={<ProtectedRoute allowedRoles={['ADMINISTRADOR']} />}>
          <Route path="/admin" element={<AdminDashboard />} />
        </Route>

        {/* 3. RUTAS PRIVADAS: PORTAL CONDUCTOR (RLS PROTEGIDA) */}
        <Route element={<ProtectedRoute allowedRoles={['CONDUCTOR']} />}>
          <Route path="/conductor" element={<DriverDashboard />} />
        </Route>

        {/* 4. REDIRECCIÓN POR DEFECTO */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
