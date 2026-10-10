import {
  User,
  Mail,
  Lock,
  ArrowRight,
  Loader2,
  Phone,
  CreditCard,
  Eye,
  EyeOff,
} from 'lucide-react';

interface RegisterFieldsProps {
  nombres: string;
  apellidos: string;
  dni: string;
  celular: string;
  email: string;
  password: string;
  confirmPassword: string;
  showPassword: boolean;
  loading: boolean;
  setNombres: (value: string) => void;
  setApellidos: (value: string) => void;
  setDni: (value: string) => void;
  setCelular: (value: string) => void;
  setEmail: (value: string) => void;
  setPassword: (value: string) => void;
  setConfirmPassword: (value: string) => void;
  setShowPassword: (value: boolean) => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  onGoToLogin: () => void;
}

export function RegisterFields({
  nombres,
  apellidos,
  dni,
  celular,
  email,
  password,
  confirmPassword,
  showPassword,
  loading,
  setNombres,
  setApellidos,
  setDni,
  setCelular,
  setEmail,
  setPassword,
  setConfirmPassword,
  setShowPassword,
  onSubmit,
  onGoToLogin,
}: RegisterFieldsProps) {
  return (
    <form onSubmit={onSubmit} className="space-y-4 text-xs">
      <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
        <div className="space-y-1.5">
          <label htmlFor="register-nombres" className="text-[11px] font-semibold text-slate-300">Nombres *</label>
          <div className="relative">
            <span className="absolute left-3.5 top-3.5 text-slate-500"><User className="h-4 w-4" /></span>
            <input id="register-nombres" type="text" value={nombres} onChange={(e) => setNombres(e.target.value)} disabled={loading} placeholder="Ej. Carlos" className="w-full bg-slate-950/80 border border-slate-800 focus:border-amber-500 rounded-xl pl-10 pr-4 py-2.5 text-xs outline-none transition-colors text-white" required />
          </div>
        </div>
        <div className="space-y-1.5">
          <label htmlFor="register-apellidos" className="text-[11px] font-semibold text-slate-300">Apellidos *</label>
          <div className="relative">
            <span className="absolute left-3.5 top-3.5 text-slate-500"><User className="h-4 w-4" /></span>
            <input id="register-apellidos" type="text" value={apellidos} onChange={(e) => setApellidos(e.target.value)} disabled={loading} placeholder="Ej. Mendoza Castro" className="w-full bg-slate-950/80 border border-slate-800 focus:border-amber-500 rounded-xl pl-10 pr-4 py-2.5 text-xs outline-none transition-colors text-white" required />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label htmlFor="register-dni" className="text-[11px] font-semibold text-slate-300">DNI *</label>
            <span className="text-[10px] font-mono text-slate-500">8 dígitos</span>
          </div>
          <div className="relative">
            <span className="absolute left-3.5 top-3.5 text-slate-500"><CreditCard className="h-4 w-4" /></span>
            <input id="register-dni" type="text" maxLength={8} value={dni} onChange={(e) => setDni(e.target.value.replace(/\D/g, ''))} disabled={loading} placeholder="74561234" className="w-full bg-slate-950/80 border border-slate-800 focus:border-amber-500 rounded-xl pl-10 pr-4 py-2.5 text-xs outline-none transition-colors text-white font-mono" required />
          </div>
        </div>
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label htmlFor="register-celular" className="text-[11px] font-semibold text-slate-300">Celular *</label>
            <span className="text-[10px] font-mono text-slate-500">9 dígitos</span>
          </div>
          <div className="relative">
            <span className="absolute left-3.5 top-3.5 text-slate-500"><Phone className="h-4 w-4" /></span>
            <input id="register-celular" type="text" maxLength={9} value={celular} onChange={(e) => setCelular(e.target.value.replace(/\D/g, ''))} disabled={loading} placeholder="963852741" className="w-full bg-slate-950/80 border border-slate-800 focus:border-amber-500 rounded-xl pl-10 pr-4 py-2.5 text-xs outline-none transition-colors text-white font-mono" required />
          </div>
        </div>
      </div>

      <div className="space-y-1.5">
        <label htmlFor="register-email" className="text-[11px] font-semibold text-slate-300">Correo Electrónico *</label>
        <div className="relative">
          <span className="absolute left-3.5 top-3.5 text-slate-500"><Mail className="h-4 w-4" /></span>
          <input id="register-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} disabled={loading} placeholder="ejemplo@correo.com" className="w-full bg-slate-950/80 border border-slate-800 focus:border-amber-500 rounded-xl pl-10 pr-4 py-2.5 text-xs outline-none transition-colors text-white" required />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
        <div className="space-y-1.5">
          <label htmlFor="register-password" className="text-[11px] font-semibold text-slate-300">Contraseña *</label>
          <div className="relative">
            <span className="absolute left-3.5 top-3.5 text-slate-500"><Lock className="h-4 w-4" /></span>
            <input id="register-password" type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} disabled={loading} placeholder="Mín. 6 caracteres" className="w-full bg-slate-950/80 border border-slate-800 focus:border-amber-500 rounded-xl pl-10 pr-10 py-2.5 text-xs outline-none transition-colors text-white" required />
            <button type="button" onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'} title={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'} className="absolute right-3 top-3 cursor-pointer text-slate-500 hover:text-slate-300" tabIndex={-1}>
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>
        <div className="space-y-1.5">
          <label htmlFor="register-confirm-password" className="text-[11px] font-semibold text-slate-300">Confirmar Contraseña *</label>
          <div className="relative">
            <span className="absolute left-3.5 top-3.5 text-slate-500"><Lock className="h-4 w-4" /></span>
            <input id="register-confirm-password" type={showPassword ? 'text' : 'password'} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} disabled={loading} placeholder="Repetir contraseña" className="w-full bg-slate-950/80 border border-slate-800 focus:border-amber-500 rounded-xl pl-10 pr-4 py-2.5 text-xs outline-none transition-colors text-white" required />
          </div>
        </div>
      </div>

      <button type="submit" disabled={loading} className={`mt-5 flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl py-3.5 text-xs font-bold transition-[color,background-color,border-color,opacity,transform,box-shadow] active:scale-[0.98] ${loading ? 'cursor-not-allowed bg-amber-600/50 text-slate-800' : 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20 hover:bg-amber-400'}`}>
        {loading ? <><Loader2 className="h-4 w-4 animate-spin" /><span>Creando Cuenta...</span></> : <><span>Crear Cuenta</span><ArrowRight className="h-4 w-4" /></>}
      </button>

      <div className="pt-2 text-center">
        <button type="button" onClick={onGoToLogin} className="cursor-pointer font-semibold text-slate-400 transition-colors hover:text-amber-400 focus:outline-none">
          ¿Ya tienes una cuenta? Inicia sesión aquí
        </button>
      </div>
    </form>
  );
}
