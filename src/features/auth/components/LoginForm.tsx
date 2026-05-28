import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, ArrowRight, Loader2, AlertCircle, ShieldCheck } from 'lucide-react';
import { useAuthStore } from '../../../shared/stores/useAuthStore';

export function LoginForm() {
  const navigate = useNavigate();
  const loginStore = useAuthStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    // Validaciones básicas de cliente
    if (!email.trim() || !password.trim()) {
      setValidationError('Por favor, ingresa tu correo y contraseña.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setValidationError('Por favor, ingresa un correo electrónico válido.');
      return;
    }

    // Ejecutar login de Supabase Auth
    const loggedUser = await loginStore.login(email, password);

    if (loggedUser) {
      // Redirección inteligente según el rol obtenido
      if (loggedUser.rol === 'ADMINISTRADOR') {
        navigate('/admin', { replace: true });
      } else if (loggedUser.rol === 'CONDUCTOR') {
        navigate('/conductor', { replace: true });
      } else {
        navigate('/', { replace: true });
      }
    }
  };

  return (
    <div className="w-full max-w-md bg-slate-900/40 border border-slate-900 rounded-3xl p-8 backdrop-blur-xl relative overflow-hidden">
      
      {/* Círculo luminoso de fondo */}
      <div className="absolute top-0 right-0 -mt-10 -mr-10 w-44 h-44 bg-amber-500/5 rounded-full blur-2xl pointer-events-none"></div>
      
      <div className="space-y-6">
        {/* Encabezado del Formulario */}
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold text-white tracking-tight">Portal de Acceso</h2>
          <p className="text-xs text-slate-400">Ingresa tus credenciales autorizadas de Agregados Pasco</p>
        </div>

        {/* Mensajes de Error (Servidor / Cliente) */}
        {(validationError || loginStore.error) && (
          <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl text-xs flex items-start space-x-2 animate-shake">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <span>{validationError || loginStore.error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Campo: Correo */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-400">Correo Electrónico</label>
            <div className="relative">
              <span className="absolute left-3.5 top-3.5 text-slate-500">
                <Mail className="h-4 w-4" />
              </span>
              <input 
                type="email" 
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setValidationError(null);
                }}
                disabled={loginStore.loading}
                placeholder="correo@empresa.com"
                className="w-full bg-slate-950 border border-slate-800/80 focus:border-amber-500 rounded-xl pl-10 pr-4 py-3 text-sm outline-none transition-colors text-white"
              />
            </div>
          </div>

          {/* Campo: Contraseña */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-400">Contraseña</label>
            <div className="relative">
              <span className="absolute left-3.5 top-3.5 text-slate-500">
                <Lock className="h-4 w-4" />
              </span>
              <input 
                type="password" 
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setValidationError(null);
                }}
                disabled={loginStore.loading}
                placeholder="••••••••"
                className="w-full bg-slate-950 border border-slate-800/80 focus:border-amber-500 rounded-xl pl-10 pr-4 py-3 text-sm outline-none transition-colors text-white"
              />
            </div>
          </div>

          {/* Botón de Envío */}
          <button 
            type="submit"
            disabled={loginStore.loading}
            className={`w-full py-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer ${
              loginStore.loading
                ? 'bg-amber-600/50 cursor-not-allowed text-slate-800'
                : 'bg-amber-500 hover:bg-amber-600 text-slate-950 shadow-lg shadow-amber-500/10'
            }`}
          >
            {loginStore.loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Ingresando...</span>
              </>
            ) : (
              <>
                <span>Ingresar al Portal</span>
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        </form>

        {/* Disclaimer de Seguridad */}
        <div className="pt-4 border-t border-slate-900/60 flex items-center justify-center space-x-1.5 text-[10px] text-slate-500 font-semibold uppercase tracking-wider">
          <ShieldCheck className="h-3.5 w-3.5 text-amber-500" />
          <span>Acceso Protegido por Supabase Auth RLS</span>
        </div>
      </div>
    </div>
  );
}
