import { useState, type FormEvent } from 'react';
import { 
  User, 
  CreditCard, 
  Phone, 
  Mail, 
  Lock, 
  FileCheck, 
  Truck, 
  Save, 
  X, 
  AlertCircle,
  Loader2
} from 'lucide-react';
import { driversService } from '../../../shared/services/driversService';
import { validarDNI, validarCelular } from '../../../shared/validations';
import type { ConductorDetallado } from '../../../shared/types';
import { getErrorMessage } from '../../../shared/utils/errors';

interface DriverFormProps {
  onSuccess: () => void;
  onCancel: () => void;
  editingDriver?: ConductorDetallado | null;
  availableVehicles?: Array<{ id: string; placa: string; marca: string; modelo: string; capacidadM3: number }>;
}

export function DriverForm({
  onSuccess,
  onCancel,
  editingDriver,
  availableVehicles = [],
}: DriverFormProps) {
  const isEditing = !!editingDriver;

  const [nombre, setNombre] = useState(editingDriver?.nombre || '');
  const [dni, setDni] = useState(editingDriver?.dni || '');
  const [celular, setCelular] = useState(editingDriver?.celular || '');
  const [licenciaConducir, setLicenciaConducir] = useState(editingDriver?.licenciaConducir || '');
  const [vehiculoId, setVehiculoId] = useState(editingDriver?.vehiculoAsignado?.id || '');

  const [email, setEmail] = useState(editingDriver?.email || '');
  const [password, setPassword] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!nombre.trim() || !dni.trim() || !celular.trim()) {
      setError('Por favor, completa los campos obligatorios (Nombre, DNI y Teléfono).');
      return;
    }


    if (!validarDNI(dni.trim())) {
      setError('El DNI debe contener exactamente 8 dígitos numéricos válidos.');
      return;
    }

    if (!validarCelular(celular.trim())) {
      setError('El celular debe tener 9 dígitos y comenzar con 9.');
      return;
    }

    if (!isEditing) {
      if (!email.trim()) {
        setError('El correo electrónico de acceso es obligatorio para crear el usuario.');
        return;
      }
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email.trim())) {
        setError('Ingresa un formato de correo electrónico válido.');
        return;
      }
    }

    setLoading(true);

    try {
      if (isEditing && editingDriver) {
        await driversService.updateDriver(editingDriver.id, {
          nombre: nombre.trim(),
          dni: dni.trim(),
          celular: celular.trim(),
          licenciaConducir: licenciaConducir.trim() || undefined,
          vehiculoId: vehiculoId || null,
        });
      } else {
        await driversService.createDriver({
          email: email.trim(),
          password: password.trim() || undefined,
          nombre: nombre.trim(),
          dni: dni.trim(),
          celular: celular.trim(),
          licenciaConducir: licenciaConducir.trim() || undefined,
          vehiculoId: vehiculoId || undefined,
        });
      }

      onSuccess();
    } catch (err: unknown) {
      console.error('Error guardando conductor:', err);
      setError(getErrorMessage(err, 'Ocurrió un error al guardar los datos del conductor en Supabase.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-7 relative shadow-2xl max-w-2xl w-full my-8">
        <button 
          type="button"
          onClick={onCancel}
          aria-label="Cerrar formulario de conductor"
          className="absolute top-4 right-4 p-1.5 rounded-lg bg-slate-950 border border-slate-900 text-slate-400 hover:text-white active:scale-95 transition-[color,background-color,border-color,opacity,transform,box-shadow] cursor-pointer"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="space-y-4">
          <div className="flex items-center space-x-2 border-b border-slate-800 pb-3">
            <div className="p-1.5 bg-amber-500/10 text-amber-500 rounded-lg">
              <User className="h-5 w-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white uppercase tracking-wider">
                {isEditing ? 'Editar Datos del Conductor' : 'Registrar Nuevo Conductor'}
              </h4>
              <p className="text-[11px] text-slate-500">Gestión de personal de transporte de carga pesada</p>
            </div>
          </div>

          {error && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl text-xs flex items-start space-x-2">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div className="space-y-1">
              <label htmlFor="driver-nombre" className="font-semibold text-slate-400">Nombre Completo y Apellidos *</label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-slate-500 pointer-events-none">
                  <User className="h-4 w-4" />
                </span>
                <input 
                  id="driver-nombre"
                  type="text"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  placeholder="Ej. Juan Carlos Quispe Huamán"
                  className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl pl-9 pr-3 py-2 outline-none text-white text-xs"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label htmlFor="driver-dni" className="font-semibold text-slate-400">DNI (8 dígitos) *</label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-slate-500 pointer-events-none">
                    <CreditCard className="h-4 w-4" />
                  </span>
                  <input 
                    id="driver-dni"
                    type="text"
                    maxLength={8}
                    value={dni}
                    onChange={(e) => setDni(e.target.value.replace(/\D/g, ''))}
                    placeholder="87654321"
                    className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl pl-9 pr-3 py-2 outline-none text-white text-xs font-mono"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label htmlFor="driver-celular" className="font-semibold text-slate-400">Celular / WhatsApp (9 dígitos) *</label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-slate-500 pointer-events-none">
                    <Phone className="h-4 w-4" />
                  </span>
                  <input 
                    id="driver-celular"
                    type="tel"
                    maxLength={9}
                    value={celular}
                    onChange={(e) => setCelular(e.target.value.replace(/\D/g, ''))}
                    placeholder="987654321"
                    className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl pl-9 pr-3 py-2 outline-none text-white text-xs font-mono"
                    required
                  />
                </div>
              </div>
            </div>

            <div className="space-y-1">
              <label htmlFor="driver-licencia" className="font-semibold text-slate-400 flex justify-between">
                <span>Licencia de Conducir (MTC)</span>
                <span className="text-[10px] text-slate-500">Categoría A-IIIb o A-IIIc recomendada</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-slate-500 pointer-events-none">
                  <FileCheck className="h-4 w-4" />
                </span>
                <input 
                  id="driver-licencia"
                  type="text"
                  value={licenciaConducir}
                  onChange={(e) => setLicenciaConducir(e.target.value.toUpperCase())}
                  placeholder="Ej. Q-74839201 (Cat. A-IIIc)"
                  className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl pl-9 pr-3 py-2 outline-none text-white text-xs uppercase"
                />
              </div>
            </div>

            {!isEditing && (
              <div className="p-3 bg-slate-950/60 rounded-2xl border border-slate-850 space-y-3">
                <span className="text-[10px] font-bold text-amber-500 uppercase tracking-wider block">
                  Credenciales de Acceso a la App del Conductor
                </span>

                <div className="space-y-1">
                  <label htmlFor="driver-email" className="font-semibold text-slate-400">Correo Electrónico *</label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-slate-500 pointer-events-none">
                      <Mail className="h-4 w-4" />
                    </span>
                    <input 
                      id="driver-email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="chofer@agregados.com"
                      className="w-full bg-slate-900 border border-slate-800 focus:border-amber-500 rounded-xl pl-9 pr-3 py-2 outline-none text-white text-xs"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label htmlFor="driver-password" className="font-semibold text-slate-400 flex justify-between">
                    <span>Contraseña Provisional</span>
                    <span className="text-[10px] text-amber-400/90">Obligatorio cambio en primer login</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-slate-500 pointer-events-none">
                      <Lock className="h-4 w-4" />
                    </span>
                    <input 
                      id="driver-password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Dejar vacío para generar clave temporal segura"
                      className="w-full bg-slate-900 border border-slate-800 focus:border-amber-500 rounded-xl pl-9 pr-3 py-2 outline-none text-white text-xs"
                    />
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-1">
              <label htmlFor="driver-vehiculo" className="font-semibold text-slate-400 flex justify-between">
                <span>Volquete Asignado de la Flota</span>
                <span className="text-[10px] text-slate-500">Opcional</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-slate-500 pointer-events-none">
                  <Truck className="h-4 w-4" />
                </span>
                <select
                  id="driver-vehiculo"
                  aria-label="Seleccionar volquete asignado"
                  value={vehiculoId}
                  onChange={(e) => setVehiculoId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl pl-9 pr-3 py-2 outline-none text-white text-xs cursor-pointer"
                >
                  <option value="">Sin volquete fijo (asignar por viaje)</option>
                  {availableVehicles.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.placa} — {v.marca} {v.modelo} ({v.capacidadM3} m³)
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button 
                type="button" 
                onClick={onCancel}
                className="flex-1 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 font-semibold hover:bg-slate-900 active:scale-95 transition-[color,background-color,border-color,opacity,transform,box-shadow] cursor-pointer"
              >
                Cancelar
              </button>
              <button 
                type="submit" 
                disabled={loading}
                className="flex-1 py-2.5 rounded-xl bg-amber-500 text-amber-950 font-bold hover:bg-amber-600 active:scale-95 disabled:opacity-50 transition-[color,background-color,border-color,opacity,transform,box-shadow] shadow-md shadow-amber-500/10 cursor-pointer flex items-center justify-center gap-1.5"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    <span>Guardando...</span>
                  </>
                ) : (
                  <>
                    <Save className="h-3.5 w-3.5" />
                    <span>{isEditing ? 'Actualizar Conductor' : 'Registrar Conductor'}</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default DriverForm;


