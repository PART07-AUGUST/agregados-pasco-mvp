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
  FileText,
  CreditCard,
  Search,
  Sparkles,
  Building2,
  CheckCircle2
} from 'lucide-react';
import { supabase } from '../../../shared/services/supabase';
import { peruIdentityService, type RucResult, type DniResult } from '../../../shared/services/peruIdentityService';
import { validarDNI, validarCelular, validarRUC } from '../../../shared/validations';

export function RegisterForm() {
  const navigate = useNavigate();

  const [ruc, setRuc] = useState('');
  const [nombre, setNombre] = useState('');
  const [dni, setDni] = useState('');
  const [representanteNombre, setRepresentanteNombre] = useState('');
  const [email, setEmail] = useState('');
  const [celular, setCelular] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Estados de consulta a APIs externas
  const [searchingRuc, setSearchingRuc] = useState(false);
  const [rucData, setRucData] = useState<RucResult | null>(null);
  const [searchingDni, setSearchingDni] = useState(false);
  const [dniData, setDniData] = useState<DniResult | null>(null);
  const [apiNotice, setApiNotice] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Consulta automática / manual a SUNAT por RUC
  const handleConsultarRuc = async (rucAQuienConsultar?: string) => {
    const rucQuery = (rucAQuienConsultar || ruc).trim();
    if (!validarRUC(rucQuery)) {
      setError('Ingresa un RUC válido de 11 dígitos para consultar ante SUNAT.');
      return;
    }

    setSearchingRuc(true);
    setError(null);
    setApiNotice(null);

    try {
      const result = await peruIdentityService.consultarRuc(rucQuery);
      setRucData(result);
      setNombre(result.razonSocial);
      setApiNotice(`✅ SUNAT: Razón Social "${result.razonSocial}" autocompletada con éxito.`);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'No se pudo consultar el RUC. Puedes ingresar los datos manualmente.';
      setError(message);
    } finally {
      setSearchingRuc(false);
    }
  };

  // Consulta automática / manual a RENIEC por DNI
  const handleConsultarDni = async (dniAQuienConsultar?: string) => {
    const dniQuery = (dniAQuienConsultar || dni).trim();
    if (!validarDNI(dniQuery)) {
      setError('Ingresa un DNI válido de 8 dígitos para consultar ante RENIEC.');
      return;
    }

    setSearchingDni(true);
    setError(null);

    try {
      const result = await peruIdentityService.consultarDni(dniQuery);
      setDniData(result);
      setRepresentanteNombre(result.nombreCompleto);
      // Si el nombre de la empresa aún está vacío, sugerir el nombre del titular
      if (!nombre.trim()) {
        setNombre(result.nombreCompleto);
      }
      setApiNotice(`✅ RENIEC: Representante "${result.nombreCompleto}" verificado.`);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'No se pudo consultar el DNI. Puedes ingresar los datos manualmente.';
      setError(message);
    } finally {
      setSearchingDni(false);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    // 1. Validaciones básicas del cliente
    if (!nombre.trim() || !email.trim() || !password.trim() || !confirmPassword.trim() || !dni.trim() || !celular.trim()) {
      setError('Por favor, completa todos los campos obligatorios.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Por favor, ingresa un correo electrónico válido.');
      return;
    }

    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Las contraseñas ingresadas no coinciden.');
      return;
    }

    if (!validarDNI(dni)) {
      setError('El DNI debe contener exactamente 8 números.');
      return;
    }

    if (!validarCelular(celular)) {
      setError('El celular debe contener exactamente 9 números y empezar con 9.');
      return;
    }

    if (ruc.trim() && !validarRUC(ruc)) {
      setError('El RUC debe contener exactamente 11 números.');
      return;
    }

    setLoading(true);

    try {
      // 2. Registro en Supabase Auth
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: email.trim(),
        password: password,
        options: {
          data: {
            nombre: nombre.trim(),
            rol: 'CLIENTE',
            dni: dni.trim(),
            celular: celular.trim(),
            ruc: ruc.trim() ? ruc.trim() : null
          }
        }
      });

      if (signUpError) throw signUpError;

      if (!data.user) {
        throw new Error('No se pudo completar el registro.');
      }

      setSuccess(true);
      
      // Esperar 3 segundos y redirigir a Login
      setTimeout(() => {
        navigate('/login', { replace: true });
      }, 3000);

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
      <div className="w-full max-w-lg bg-slate-900/40 border border-slate-900 rounded-3xl p-8 backdrop-blur-xl text-center space-y-6">
        <div className="mx-auto w-16 h-16 bg-emerald-500/10 border border-emerald-500/35 rounded-full flex items-center justify-center text-emerald-400">
          <ShieldCheck className="h-8 w-8 animate-bounce" />
        </div>
        <div className="space-y-2">
          <h2 className="text-xl font-bold text-white">¡Registro Exitoso!</h2>
          <p className="text-xs text-slate-400">
            Tu cuenta de constructora ha sido registrada correctamente.
          </p>
          <p className="text-xs text-amber-500 font-semibold animate-pulse mt-2">
            Redireccionando al portal de acceso...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-lg bg-slate-900/40 border border-slate-900 rounded-3xl p-8 backdrop-blur-xl relative overflow-hidden">
      
      <div className="absolute top-0 right-0 -mt-10 -mr-10 w-44 h-44 bg-amber-500/5 rounded-full blur-2xl pointer-events-none"></div>

      <div className="space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-500/10 border border-amber-500/25 rounded-full text-[10px] text-amber-400 font-bold mb-1">
            <Sparkles className="h-3 w-3" />
            <span>Autocompletado SUNAT / RENIEC Activo</span>
          </div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Registro de Constructora</h2>
          <p className="text-xs text-slate-400">Crea tu cuenta de cliente para solicitar agregados en Cerro de Pasco</p>
        </div>

        {error && (
          <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl text-xs flex items-start space-x-2">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {apiNotice && (
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl text-xs flex items-start space-x-2">
            <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" />
            <span>{apiNotice}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          
          {/* SECCIÓN 1: IDENTIFICACIÓN TRIBUTARIA (SUNAT / RUC) */}
          <div className="p-4 bg-slate-950/70 border border-slate-800 rounded-2xl space-y-3">
            <div className="flex justify-between items-center">
              <label className="text-xs font-bold text-amber-400 flex items-center gap-1.5 uppercase tracking-wider">
                <Building2 className="h-4 w-4" />
                1. Datos de la Empresa (SUNAT)
              </label>
              <span className="text-[10px] text-slate-500 font-mono">11 dígitos</span>
            </div>

            {/* Input de RUC con botón de consulta SUNAT */}
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-slate-400">RUC de la Constructora *</label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <span className="absolute left-3.5 top-3 text-slate-500">
                    <FileText className="h-4 w-4" />
                  </span>
                  <input 
                    type="text" 
                    maxLength={11}
                    value={ruc}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, '');
                      setRuc(val);
                      if (val.length === 11) {
                        handleConsultarRuc(val);
                      }
                    }}
                    disabled={loading || searchingRuc}
                    placeholder="Ej. 20123456789"
                    className="w-full bg-slate-900 border border-slate-800 focus:border-amber-500 rounded-xl pl-10 pr-4 py-2.5 text-xs outline-none transition-colors text-white font-mono"
                    required
                  />
                </div>
                <button
                  type="button"
                  onClick={() => handleConsultarRuc()}
                  disabled={searchingRuc || ruc.length !== 11}
                  className="px-3.5 py-2.5 bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 text-amber-400 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                >
                  {searchingRuc ? (
                    <Loader2 className="h-4 w-4 animate-spin text-amber-400" />
                  ) : (
                    <Search className="h-4 w-4" />
                  )}
                  <span>Validar RUC</span>
                </button>
              </div>
            </div>

            {/* Razón Social autocompletada */}
            <div className="space-y-1">
              <div className="flex justify-between items-center">
                <label className="text-[11px] font-semibold text-slate-400">Razón Social Oficial *</label>
                {rucData && (
                  <span className="text-[9px] bg-emerald-500/15 text-emerald-400 font-bold px-2 py-0.5 rounded-md border border-emerald-500/30">
                    {rucData.estado} - {rucData.condicion}
                  </span>
                )}
              </div>
              <div className="relative">
                <span className="absolute left-3.5 top-3 text-slate-500">
                  <Building2 className="h-4 w-4" />
                </span>
                <input 
                  type="text" 
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  disabled={loading}
                  placeholder="Ej. Constructora Los Andes S.A.C."
                  className="w-full bg-slate-900 border border-slate-800 focus:border-amber-500 rounded-xl pl-10 pr-4 py-2.5 text-xs outline-none transition-colors text-white font-semibold"
                  required
                />
              </div>
            </div>
          </div>

          {/* SECCIÓN 2: REPRESENTANTE LEGAL (RENIEC / DNI) */}
          <div className="p-4 bg-slate-950/70 border border-slate-800 rounded-2xl space-y-3">
            <div className="flex justify-between items-center">
              <label className="text-xs font-bold text-amber-400 flex items-center gap-1.5 uppercase tracking-wider">
                <CreditCard className="h-4 w-4" />
                2. Representante Legal (RENIEC)
              </label>
              <span className="text-[10px] text-slate-500 font-mono">8 dígitos</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Input DNI con botón de consulta RENIEC */}
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-400">DNI del Representante *</label>
                <div className="relative">
                  <span className="absolute left-3.5 top-3 text-slate-500">
                    <CreditCard className="h-4 w-4" />
                  </span>
                  <input 
                    type="text" 
                    maxLength={8}
                    value={dni}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, '');
                      setDni(val);
                      if (val.length === 8) {
                        handleConsultarDni(val);
                      }
                    }}
                    disabled={loading || searchingDni}
                    placeholder="8 dígitos"
                    className="w-full bg-slate-900 border border-slate-800 focus:border-amber-500 rounded-xl pl-10 pr-8 py-2.5 text-xs outline-none transition-colors text-white font-mono"
                    required
                  />
                  {searchingDni && (
                    <span className="absolute right-3 top-3 text-amber-500">
                      <Loader2 className="h-4 w-4 animate-spin" />
                    </span>
                  )}
                </div>
              </div>

              {/* Nombres del Representante */}
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-400">Nombres del Titular</label>
                <div className="relative">
                  <span className="absolute left-3.5 top-3 text-slate-500">
                    <User className="h-4 w-4" />
                  </span>
                  <input 
                    type="text" 
                    value={representanteNombre || dniData?.nombreCompleto || ''}
                    onChange={(e) => setRepresentanteNombre(e.target.value)}
                    disabled={loading}
                    placeholder="Nombres completos"
                    className="w-full bg-slate-900 border border-slate-800 focus:border-amber-500 rounded-xl pl-10 pr-4 py-2.5 text-xs outline-none transition-colors text-slate-300"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* SECCIÓN 3: CONTACTO Y CREDENCIALES DE ACCESO */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Correo */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-400">Correo Electrónico *</label>
              <div className="relative">
                <span className="absolute left-3.5 top-3.5 text-slate-500">
                  <Mail className="h-4 w-4" />
                </span>
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                  placeholder="constructora@empresa.com"
                  className="w-full bg-slate-950 border border-slate-800/80 focus:border-amber-500 rounded-xl pl-10 pr-4 py-3 text-xs outline-none transition-colors text-white"
                  required
                />
              </div>
            </div>

            {/* Celular */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-400">Celular de Contacto *</label>
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
                  placeholder="987654321"
                  className="w-full bg-slate-950 border border-slate-800/80 focus:border-amber-500 rounded-xl pl-10 pr-4 py-3 text-xs outline-none transition-colors text-white font-mono"
                  required
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Contraseña */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-400">Contraseña *</label>
              <div className="relative">
                <span className="absolute left-3.5 top-3.5 text-slate-500">
                  <Lock className="h-4 w-4" />
                </span>
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  placeholder="Mín. 6 caracteres"
                  className="w-full bg-slate-950 border border-slate-800/80 focus:border-amber-500 rounded-xl pl-10 pr-4 py-3 text-xs outline-none transition-colors text-white"
                  required
                />
              </div>
            </div>

            {/* Confirmar Contraseña */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-400">Confirmar Contraseña *</label>
              <div className="relative">
                <span className="absolute left-3.5 top-3.5 text-slate-500">
                  <Lock className="h-4 w-4" />
                </span>
                <input 
                  type="password" 
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={loading}
                  placeholder="Repetir contraseña"
                  className="w-full bg-slate-950 border border-slate-800/80 focus:border-amber-500 rounded-xl pl-10 pr-4 py-3 text-xs outline-none transition-colors text-white"
                  required
                />
              </div>
            </div>
          </div>

          <button 
            type="submit"
            disabled={loading}
            className={`w-full py-3.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer mt-4 ${
              loading
                ? 'bg-amber-600/50 cursor-not-allowed text-slate-800'
                : 'bg-amber-500 hover:bg-amber-600 text-slate-950 shadow-lg shadow-amber-500/10'
            }`}
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Creando Cuenta...</span>
              </>
            ) : (
              <>
                <span>Registrar Constructora</span>
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>

          <div className="text-center mt-3">
            <button
              type="button"
              onClick={() => navigate('/login')}
              className="text-slate-450 hover:text-amber-500 font-semibold transition-colors focus:outline-none"
            >
              ¿Ya tienes cuenta? Inicia sesión aquí
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
export default RegisterForm;
