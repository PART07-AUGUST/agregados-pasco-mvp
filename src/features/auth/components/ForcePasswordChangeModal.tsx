import { useState, type FormEvent } from 'react';
import { KeyRound, ShieldAlert, Check, Eye, EyeOff, Lock, AlertTriangle, ArrowRight } from 'lucide-react';
import { useAuthStore } from '../../../shared/stores/useAuthStore';

interface PasswordRequirement {
  id: string;
  label: string;
  valid: boolean;
}

export function ForcePasswordChangeModal() {
  const { user, completePasswordChange, logout } = useAuthStore();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const requirements: PasswordRequirement[] = [
    {
      id: 'min-length',
      label: 'Mínimo 8 caracteres',
      valid: newPassword.length >= 8,
    },
    {
      id: 'has-number',
      label: 'Al menos un número (0-9)',
      valid: /\d/.test(newPassword),
    },
    {
      id: 'has-letter',
      label: 'Al menos una letra (A-Z o a-z)',
      valid: /[a-zA-Z]/.test(newPassword),
    },
    {
      id: 'passwords-match',
      label: 'Las contraseñas coinciden',
      valid: newPassword.length > 0 && newPassword === confirmPassword,
    },
  ];

  const allRequirementsMet = requirements.every((r) => r.valid);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!allRequirementsMet) {
      setErrorMessage('Por favor, cumple con todos los requisitos de seguridad indicados.');
      return;
    }

    setLoading(true);

    try {
      await completePasswordChange(newPassword);
    } catch (err: unknown) {
      setErrorMessage(
        err instanceof Error ? err.message : 'No se pudo actualizar la contraseña. Intenta nuevamente.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (err) {
      console.error('Error al salir:', err);
    }
  };

  return (
    <dialog
      open
      aria-modal="true"
      aria-labelledby="password-change-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in"
      onCancel={(event) => event.preventDefault()}
    >
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl shadow-amber-500/5 p-6 sm:p-8 space-y-6">
        {/* Header con icono y advertencia de seguridad */}
        <div className="text-center space-y-2">
          <div className="mx-auto w-14 h-14 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex items-center justify-center text-amber-500 shadow-inner">
            <KeyRound className="w-7 h-7" />
          </div>
          <h2 id="password-change-title" className="text-xl font-bold text-white tracking-tight">
            Cambio Obligatorio de Contraseña
          </h2>
          <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
            Hola <strong className="text-slate-200">{user?.nombre || 'usuario'}</strong>. Has iniciado sesión con una clave provisional. Por seguridad operativa, debes configurar una contraseña privada para continuar.
          </p>
        </div>

        {/* Mensaje de Error */}
        {errorMessage && (
          <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-2xl flex items-start gap-2.5 text-xs text-red-400">
            <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5 text-red-400" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Nueva Contraseña */}
          <div className="space-y-1.5">
            <label htmlFor="new-password" className="text-xs font-semibold text-slate-300">
              Nueva Contraseña
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-3 text-slate-500 pointer-events-none">
                <Lock className="w-4 h-4" />
              </span>
              <input
                id="new-password"
                type={showPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Ingresa tu nueva clave personal"
                className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-2xl pl-10 pr-10 py-2.5 text-white text-xs outline-none transition-colors"
                autoComplete="new-password"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-3 text-slate-500 hover:text-slate-300 focus:outline-none transition-colors"
                title={showPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Confirmar Contraseña */}
          <div className="space-y-1.5">
            <label htmlFor="confirm-password" className="text-xs font-semibold text-slate-300">
              Confirmar Nueva Contraseña
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-3 text-slate-500 pointer-events-none">
                <Lock className="w-4 h-4" />
              </span>
              <input
                id="confirm-password"
                type={showPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repite la nueva contraseña"
                className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-2xl pl-10 pr-4 py-2.5 text-white text-xs outline-none transition-colors"
                autoComplete="new-password"
                required
              />
            </div>
          </div>

          {/* Lista interactiva de requisitos de seguridad */}
          <div className="p-3 bg-slate-950/60 rounded-2xl border border-slate-850 space-y-2">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Requisitos de Seguridad
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
              {requirements.map((req) => (
                <div
                  key={req.id}
                  className={`flex items-center gap-1.5 transition-colors ${
                    req.valid ? 'text-emerald-400' : 'text-slate-500'
                  }`}
                >
                  <div
                    className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[9px] ${
                      req.valid
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : 'bg-slate-800 text-slate-600'
                    }`}
                  >
                    {req.valid ? <Check className="w-2.5 h-2.5" /> : '•'}
                  </div>
                  <span>{req.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Botones de acción */}
          <div className="pt-2 space-y-2">
            <button
              type="submit"
              disabled={!allRequirementsMet || loading}
              className="w-full py-3 px-4 rounded-2xl font-bold text-xs uppercase tracking-wider bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 shadow-lg shadow-amber-500/20 disabled:opacity-40 disabled:cursor-not-allowed transition-[color,background-color,border-color,opacity,transform,box-shadow] flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                  <span>Guardando Contraseña...</span>
                </>
              ) : (
                <>
                  <span>Establecer y Continuar</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleLogout}
              disabled={loading}
              className="w-full py-2 text-center text-xs text-slate-400 hover:text-slate-200 transition-colors"
            >
              Cerrar Sesión e Intentar Después
            </button>
          </div>
        </form>

        {/* Footer info de auditoría */}
        <div className="flex items-center justify-center gap-1.5 text-[10px] text-slate-400 border-t border-slate-800/80 pt-4">
          <ShieldAlert className="w-3.5 h-3.5 text-amber-500/70" />
          <span>Políticas de Control de Acceso Criptográfico SIS-AGREGADOS</span>
        </div>
      </div>
    </dialog>
  );
}
export default ForcePasswordChangeModal;
