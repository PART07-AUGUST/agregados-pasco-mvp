import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  User, 
  Mail, 
  Lock, 
  ArrowRight, 
  Loader2, 
  AlertCircle, 
  ShieldCheck,
  Phone,
  CreditCard,
  Eye,
  EyeOff
} from 'lucide-react';
import { supabase } from '../../../shared/services/supabase';
import { validarDNI, validarCelular } from '../../../shared/validations';

export function RegisterForm() {
  const navigate = useNavigate();

  const [nombres, setNombres] = useState('');
  const [apellidos, setApellidos] = useState('');
  const [dni, setDni] = useState('');
  const [celular, setCelular] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [needsConfirmation, setNeedsConfirmation] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    // 1. Validaciones de campos obligatorios
    if (!nombres.trim() || !apellidos.trim() || !dni.trim() || !celular.trim() || !email.trim() || !password.trim()) {
      setError('Por favor, completa todos los campos obligatorios.');
      return;
    }

    if (!validarDNI(dni)) {
      setError('El DNI debe contener exactamente 8 números.');
      return;
    }

    if (!validarCelular(celular)) {
      setError('El celular debe tener 9 dígitos y empezar con 9.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setError('Por favor, ingresa un correo electrónico válido.');
      return;
    }

    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden.');
      return;
    }

    setLoading(true);

    try {
      const nombreCompleto = `${nombres.trim()} ${apellidos.trim()}`;

      // 2. Registro directo en Supabase Auth
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: email.trim(),
        password: password,
        options: {
          data: {
            nombre: nombreCompleto,
            rol: 'CLIENTE',
            dni: dni.trim(),
            celular: celular.trim(),
            ruc: null
          }
        }
      });

      if (signUpError) {
        throw signUpError;
      }

      if (!data.user) {
        throw new Error('No se pudo completar el registro. Intenta nuevamente.');
      }

      // Si Supabase devuelve identities vacío, el correo ya existía previamente
      if (data.user.identities && data.user.identities.length === 0) {
        throw new Error('Este correo ya está registrado en el sistema. Por favor inicia sesión con tu contraseña o usa otro correo.');
      }

      setSuccess(true);
      
      // Si Supabase no devuelve sesión activa, requiere confirmación de email
      if (!data.session) {
        setNeedsConfirmation(true);
      } else {
        setTimeout(() => {
          navigate('/cliente', { replace: true });
        }, 2000);
      }

    } catch (err: unknown) {
      console.error('Error al registrar usuario:', err);
      const message = err instanceof Error ? err.message : 'Ocurrió un error al procesar el registro.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    if (needsConfirmation) {
      return (
        <div className="w-full max-w-lg bg-slate-900/40 border border-slate-800 rounded-3xl p-8 backdrop-blur-xl text-center space-y-6 animate-in fade-in zoom-in-95 duration-300">
          <div className="mx-auto w-16 h-16 bg-amber-500/10 border border-amber-500/35 rounded-full flex items-center justify-center text-amber-400 shadow-lg shadow-amber-500/10">
            <Mail className="h-8 w-8 animate-pulse" />
          </div>
          <div className="space-y-3">
            <h2 className="text-xl font-bold text-white">¡Confirma tu Correo!</h2>
            <p className="text-xs text-slate-300 leading-relaxed">
              Hemos enviado un correo de verificación a <strong className="text-amber-400 font-semibold">{email}</strong>.
            </p>
            <div className="p-3.5 bg-slate-950/80 border border-slate-800 rounded-xl text-left text-xs text-slate-400 space-y-1.5">
              <p className="font-semibold text-slate-300">Pasos para ingresar:</p>
              <ol className="list-decimal list-inside space-y-1 text-[11px] text-slate-400">
                <li>Abre tu bandeja de entrada en <span className="text-amber-400">{email}</span>.</li>
                <li>Busca el correo de Supabase (revisa también tu carpeta de <em>Spam</em> o <em>No deseados</em>).</li>
                <li>Haz clic en <strong>Confirm your email</strong>.</li>
                <li>Regresa al portal e inicia sesión con tu contraseña.</li>
              </ol>
            </div>
            <div className="pt-2">
              <button
                type="button"
                onClick={() => navigate('/login')}
                className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs transition-colors cursor-pointer"
              >
                Ir a Iniciar Sesión
              </button>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="w-full max-w-lg bg-slate-900/40 border border-slate-800 rounded-3xl p-8 backdrop-blur-xl text-center space-y-6 animate-in fade-in zoom-in-95 duration-300">
        <div className="mx-auto w-16 h-16 bg-emerald-500/10 border border-emerald-500/35 rounded-full flex items-center justify-center text-emerald-400 shadow-lg shadow-emerald-500/10">
          <ShieldCheck className="h-8 w-8 animate-bounce" />
        </div>
        <div className="space-y-2">
          <h2 className="text-xl font-bold text-white">¡Registro Exitoso!</h2>
          <p className="text-xs text-slate-400">
            Tu cuenta de cliente ha sido creada correctamente.
          </p>
          <p className="text-xs text-amber-500 font-semibold animate-pulse mt-2">
            Ingresando al portal de cliente...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-lg bg-slate-900/40 border border-slate-800 rounded-3xl p-8 backdrop-blur-xl relative overflow-hidden shadow-2xl">
      <div className="absolute top-0 right-0 -mt-10 -mr-10 w-44 h-44 bg-amber-500/5 rounded-full blur-2xl pointer-events-none"></div>

      <div className="space-y-6">
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold text-white tracking-tight">Crear Cuenta de Cliente</h2>
          <p className="text-xs text-slate-400">Regístrate para solicitar agregados y cotizar viajes en Cerro de Pasco</p>
        </div>

        {error && (
          <div className="p-3.5 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl text-xs flex items-start space-x-2.5">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          
          {/* Nombres y Apellidos */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-slate-300">Nombres *</label>
              <div className="relative">
                <span className="absolute left-3.5 top-3.5 text-slate-500">
                  <User className="h-4 w-4" />
                </span>
                <input 
                  type="text" 
                  value={nombres}
                  onChange={(e) => setNombres(e.target.value)}
                  disabled={loading}
                  placeholder="Ej. Carlos"
                  className="w-full bg-slate-950/80 border border-slate-800 focus:border-amber-500 rounded-xl pl-10 pr-4 py-2.5 text-xs outline-none transition-colors text-white"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-slate-300">Apellidos *</label>
              <div className="relative">
                <span className="absolute left-3.5 top-3.5 text-slate-500">
                  <User className="h-4 w-4" />
                </span>
                <input 
                  type="text" 
                  value={apellidos}
                  onChange={(e) => setApellidos(e.target.value)}
                  disabled={loading}
                  placeholder="Ej. Mendoza Castro"
                  className="w-full bg-slate-950/80 border border-slate-800 focus:border-amber-500 rounded-xl pl-10 pr-4 py-2.5 text-xs outline-none transition-colors text-white"
                  required
                />
              </div>
            </div>
          </div>

          {/* DNI y Celular */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label className="text-[11px] font-semibold text-slate-300">DNI *</label>
                <span className="text-[10px] text-slate-500 font-mono">8 dígitos</span>
              </div>
              <div className="relative">
                <span className="absolute left-3.5 top-3.5 text-slate-500">
                  <CreditCard className="h-4 w-4" />
                </span>
                <input 
                  type="text" 
                  maxLength={8}
                  value={dni}
                  onChange={(e) => setDni(e.target.value.replace(/\D/g, ''))}
                  disabled={loading}
                  placeholder="74561234"
                  className="w-full bg-slate-950/80 border border-slate-800 focus:border-amber-500 rounded-xl pl-10 pr-4 py-2.5 text-xs outline-none transition-colors text-white font-mono"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label className="text-[11px] font-semibold text-slate-300">Celular *</label>
                <span className="text-[10px] text-slate-500 font-mono">9 dígitos</span>
              </div>
              <div className="relative">
                <span className="absolute left-3.5 top-3.5 text-slate-500">
                  <Phone className="h-4 w-4" />
                </span>
                <input 
                  type="text" 
                  maxLength={9}
                  value={celular}
                  onChange={(e) => setCelular(e.target.value.replace(/\D/g, ''))}
                  disabled={loading}
                  placeholder="963852741"
                  className="w-full bg-slate-950/80 border border-slate-800 focus:border-amber-500 rounded-xl pl-10 pr-4 py-2.5 text-xs outline-none transition-colors text-white font-mono"
                  required
                />
              </div>
            </div>
          </div>

          {/* Correo Electrónico */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold text-slate-300">Correo Electrónico *</label>
            <div className="relative">
              <span className="absolute left-3.5 top-3.5 text-slate-500">
                <Mail className="h-4 w-4" />
              </span>
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                placeholder="ejemplo@correo.com"
                className="w-full bg-slate-950/80 border border-slate-800 focus:border-amber-500 rounded-xl pl-10 pr-4 py-2.5 text-xs outline-none transition-colors text-white"
                required
              />
            </div>
          </div>

          {/* Contraseña y Confirmación */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-slate-300">Contraseña *</label>
              <div className="relative">
                <span className="absolute left-3.5 top-3.5 text-slate-500">
                  <Lock className="h-4 w-4" />
                </span>
                <input 
                  type={showPassword ? 'text' : 'password'} 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  placeholder="Mín. 6 caracteres"
                  className="w-full bg-slate-950/80 border border-slate-800 focus:border-amber-500 rounded-xl pl-10 pr-10 py-2.5 text-xs outline-none transition-colors text-white"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-slate-500 hover:text-slate-300 cursor-pointer"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-slate-300">Confirmar Contraseña *</label>
              <div className="relative">
                <span className="absolute left-3.5 top-3.5 text-slate-500">
                  <Lock className="h-4 w-4" />
                </span>
                <input 
                  type={showPassword ? 'text' : 'password'} 
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={loading}
                  placeholder="Repetir contraseña"
                  className="w-full bg-slate-950/80 border border-slate-800 focus:border-amber-500 rounded-xl pl-10 pr-4 py-2.5 text-xs outline-none transition-colors text-white"
                  required
                />
              </div>
            </div>
          </div>

          <button 
            type="submit"
            disabled={loading}
            className={`w-full py-3.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all active:scale-[0.98] cursor-pointer mt-5 ${
              loading
                ? 'bg-amber-600/50 cursor-not-allowed text-slate-800'
                : 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-lg shadow-amber-500/20'
            }`}
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Creando Cuenta...</span>
              </>
            ) : (
              <>
                <span>Crear Cuenta</span>
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>

          <div className="text-center pt-2">
            <button
              type="button"
              onClick={() => navigate('/login')}
              className="text-slate-400 hover:text-amber-400 font-semibold transition-colors focus:outline-none cursor-pointer"
            >
              ¿Ya tienes una cuenta? Inicia sesión aquí
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default RegisterForm;
