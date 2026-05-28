import { useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Truck } from 'lucide-react';
import { useAuthStore } from '../shared/stores/useAuthStore';
import { LoginForm } from '../features/auth/components/LoginForm';

export function Login() {
  const navigate = useNavigate();
  const { user, initialized } = useAuthStore();

  useEffect(() => {
    // Redireccionar automáticamente si el usuario ya está autenticado
    if (initialized && user) {
      if (user.rol === 'ADMINISTRADOR') {
        navigate('/admin', { replace: true });
      } else if (user.rol === 'CONDUCTOR') {
        navigate('/conductor', { replace: true });
      } else {
        navigate('/', { replace: true });
      }
    }
  }, [user, initialized, navigate]);

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center px-4 relative selection:bg-amber-500 selection:text-slate-950">
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat scale-105"
        style={{ backgroundImage: "url('https://vicarmix.com/img/conreto-1.jpg')", backgroundPosition: 'center 30%' }}
      ></div>
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(2,6,23,0.58)_0%,rgba(2,6,23,0.5)_24%,rgba(2,6,23,0.76)_68%,rgba(2,6,23,0.9)_100%)]"></div>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(245,158,11,0.14),transparent_38%)]"></div>
      
      {/* Retícula decorativa de fondo */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(15,23,42,0.18)_1px,transparent_1px),linear-gradient(to_bottom,rgba(15,23,42,0.18)_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-30"></div>

      <div className="relative z-10 w-full max-w-md flex flex-col space-y-6">
        
        {/* Cabecera / Logo corporativo */}
        <div className="flex flex-col items-center space-y-3">
          <Link to="/" className="flex items-center space-x-2.5 group cursor-pointer">
            <div className="p-2 bg-gradient-to-br from-amber-400 to-amber-600 text-slate-950 rounded-xl shadow-lg shadow-amber-500/10 group-hover:scale-105 transition-transform">
              <Truck className="h-6 w-6" />
            </div>
            <div className="text-left">
              <span className="text-[10px] font-bold text-amber-500 tracking-widest uppercase">Cerro de Pasco</span>
              <h1 className="text-lg font-extrabold tracking-tight text-white leading-none">
                AGREGADOS <span className="text-slate-400 font-light">SIS</span>
              </h1>
            </div>
          </Link>
        </div>

        {/* Formulario */}
        <LoginForm />

        {/* Enlace para volver a la landing */}
        <div className="text-center">
          <Link 
            to="/" 
            className="text-xs text-slate-500 hover:text-amber-400 font-semibold transition-colors cursor-pointer"
          >
            ← Volver a la Página Principal
          </Link>
        </div>
      </div>
    </div>
  );
}

export default Login;
