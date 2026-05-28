import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../shared/stores/useAuthStore';
import type { UserRole } from '../shared/types';

interface ProtectedRouteProps {
  allowedRoles?: UserRole[];
}

export function ProtectedRoute({ allowedRoles }: ProtectedRouteProps) {
  const { user, initialized, loading } = useAuthStore();

  // 1. Si no se ha inicializado la sesión (comprobación de token en curso), mostramos cargando premium
  if (!initialized || loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center space-y-4">
        <div className="w-12 h-12 border-4 border-amber-500/20 border-t-amber-500 rounded-full animate-spin"></div>
        <p className="text-xs text-slate-500 font-mono tracking-widest uppercase">Verificando Credenciales...</p>
      </div>
    );
  }

  // 2. Si el usuario no está autenticado, redirigimos al portal de acceso (Login)
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // 3. Si se especificaron roles permitidos y el rol actual no está incluido, redirigimos a No Autorizado
  if (allowedRoles && !allowedRoles.includes(user.rol)) {
    return <Navigate to="/unauthorized" replace />;
  }

  // 4. Si todo es correcto, renderizamos el Outlet del enrutador
  return <Outlet />;
}
export default ProtectedRoute;
