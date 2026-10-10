import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, ShieldCheck } from 'lucide-react';
import { supabase } from '../../../shared/services/supabase';
import { validarDNI, validarCelular } from '../../../shared/validations';
import { RegisterFields } from './RegisterFields';

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

      setTimeout(() => {
        navigate('/login', { replace: true });
      }, 1500);

    } catch (err: unknown) {
      console.error('Error al registrar usuario:', err);
      const message = err instanceof Error ? err.message : 'Ocurrió un error al procesar el registro.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
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

        <RegisterFields
          nombres={nombres}
          apellidos={apellidos}
          dni={dni}
          celular={celular}
          email={email}
          password={password}
          confirmPassword={confirmPassword}
          showPassword={showPassword}
          loading={loading}
          setNombres={setNombres}
          setApellidos={setApellidos}
          setDni={setDni}
          setCelular={setCelular}
          setEmail={setEmail}
          setPassword={setPassword}
          setConfirmPassword={setConfirmPassword}
          setShowPassword={setShowPassword}
          onSubmit={handleSubmit}
          onGoToLogin={() => navigate('/login')}
        />
      </div>
    </div>
  );
}

export default RegisterForm;
