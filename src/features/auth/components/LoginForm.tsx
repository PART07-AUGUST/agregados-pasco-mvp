import { useState, type FormEvent } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { Mail, Lock, ArrowRight, Loader2, AlertCircle, Clock, ShieldAlert } from 'lucide-react';
import { useAuthStore } from '../../../shared/stores/useAuthStore';
import { useLoginRateLimiter } from '../hooks/useLoginRateLimiter';
import { isSessionPersistent, setSessionPersistent } from '../../../shared/services/supabase';

export function LoginForm() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const loginStore = useAuthStore();
  const { isLocked, remainingSeconds, recordFailedAttempt, resetAttempts } = useLoginRateLimiter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(() => isSessionPersistent());
  const [validationError, setValidationError] = useState<string | null>(null);

  const isInactivityNotice = searchParams.get('reason') === 'inactivity';

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (isLocked) {
      return;
    }

    setValidationError(null);

    if (!email.trim() || !password.trim()) {
      setValidationError('Por favor, ingresa tu correo y contraseña.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setValidationError('Por favor, ingresa un correo electrónico válido.');
      return;
    }

    setSessionPersistent(rememberMe);

    const loggedUser = await loginStore.login(email, password);

    if (loggedUser) {
      resetAttempts();
      if (loggedUser.rol === 'ADMINISTRADOR') {
        navigate('/admin', { replace: true });
      } else if (loggedUser.rol === 'CONDUCTOR') {
        navigate('/conductor', { replace: true });
      } else if (loggedUser.rol === 'CLIENTE') {
        navigate('/cliente', { replace: true });
      } else {
        navigate('/', { replace: true });
      }
    } else {
      recordFailedAttempt();
    }
  };

  return (
    <div className="w-full max-w-md bg-slate-900/40 border border-slate-900 rounded-3xl p-8 backdrop-blur-xl relative overflow-hidden">
      <div className="absolute top-0 right-0 -mt-10 -mr-10 w-44 h-44 bg-amber-500/5 rounded-full blur-2xl pointer-events-none"></div>

      <div className="space-y-6">
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold text-white tracking-tight">Portal de Acceso</h2>
          <p className="text-xs text-slate-400">Ingresa tus credenciales autorizadas de Agregados SIS</p>
        </div>

        {isInactivityNotice && (
          <div className="p-3 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-xl text-xs flex items-start space-x-2">
            <Clock className="h-4 w-4 shrink-0 mt-0.5" />
            <span>Tu sesión se cerró automáticamente por inactividad por tu propia seguridad.</span>
          </div>
        )}

        {isLocked && (
          <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl text-xs flex items-start space-x-2">
            <ShieldAlert className="h-4 w-4 shrink-0 mt-0.5" />
            <span>
              Demasiados intentos fallidos. Por seguridad, espera <strong>{remainingSeconds}s</strong> antes de reintentar.
            </span>
          </div>
        )}

        {(validationError || loginStore.error) && !isLocked && (
          <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl text-xs flex items-start space-x-2 animate-shake">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <span>{validationError || loginStore.error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label htmlFor="login-email" className="text-xs font-semibold text-slate-400">Correo Electrónico</label>
            <div className="relative">
              <span className="absolute left-3.5 top-3.5 text-slate-500">
                <Mail className="h-4 w-4" />
              </span>
              <input
                id="login-email"
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setValidationError(null);
                }}
                disabled={loginStore.loading || isLocked}
                placeholder="correo@empresa.com"
                className="w-full bg-slate-950 border border-slate-800/80 focus:border-amber-500 rounded-xl pl-10 pr-4 py-3 text-sm outline-none transition-colors text-white disabled:opacity-50"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="login-password" className="text-xs font-semibold text-slate-400">Contraseña</label>
            <div className="relative">
              <span className="absolute left-3.5 top-3.5 text-slate-500">
                <Lock className="h-4 w-4" />
              </span>
              <input
                id="login-password"
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setValidationError(null);
                }}
                disabled={loginStore.loading || isLocked}
                placeholder="••••••••"
                className="w-full bg-slate-950 border border-slate-800/80 focus:border-amber-500 rounded-xl pl-10 pr-4 py-3 text-sm outline-none transition-colors text-white disabled:opacity-50"
              />
            </div>
          </div>

          <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => {
                  const val = e.target.checked;
                  setRememberMe(val);
                  setSessionPersistent(val);
                }}
                disabled={loginStore.loading || isLocked}
                className="w-4 h-4 rounded bg-slate-950 border border-slate-800 text-amber-500 focus:ring-0 focus:ring-offset-0 cursor-pointer accent-amber-500"
              />
              <span>Mantener sesión iniciada</span>
            </label>
          </div>

          <button
            type="submit"
            disabled={loginStore.loading || isLocked}
            className={`w-full py-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer ${
              loginStore.loading || isLocked
                ? 'bg-amber-600/50 cursor-not-allowed text-slate-800'
                : 'bg-amber-500 hover:bg-amber-600 text-slate-950 shadow-lg shadow-amber-500/10'
            }`}
          >
            {loginStore.loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Ingresando...</span>
              </>
            ) : isLocked ? (
              <>
                <ShieldAlert className="h-4 w-4" />
                <span>Bloqueado ({remainingSeconds}s)</span>
              </>
            ) : (
              <>
                <span>Ingresar al Portal</span>
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>

          <div className="text-center mt-4">
            <Link
              to="/register"
              className="text-slate-400 hover:text-amber-500 font-semibold transition-colors"
            >
              ¿No tienes cuenta? Registrate aquí
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
