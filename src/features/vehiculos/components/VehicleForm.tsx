import { useState, useEffect, type FormEvent } from 'react';
import { Truck, Users, Save, AlertCircle, X } from 'lucide-react';
import { vehiclesService } from '../../../shared/services/vehiclesService';
import { supabase } from '../../../shared/services/supabase';
import { validarPlaca } from '../../../shared/validations';
import type { Vehiculo } from '../../../shared/types';
import { getErrorMessage } from '../../../shared/utils/errors';

interface VehicleFormProps {
  onSuccess: () => void;
  onCancel: () => void;
  editingVehicle?: Vehiculo | null;
}

interface ConductorOption {
  id: string;
  nombre: string;
}

export function VehicleForm({ onSuccess, onCancel, editingVehicle }: VehicleFormProps) {
  const [placa, setPlaca] = useState(editingVehicle?.placa || '');
  const [marca, setMarca] = useState(editingVehicle?.marca || '');
  const [modelo, setModelo] = useState(editingVehicle?.modelo || '');
  const [capacidadM3, setCapacidadM3] = useState<number | ''>(editingVehicle?.capacidadM3 || '');
  const [conductorId, setConductorId] = useState(editingVehicle?.conductorId || '');
  const [activo, setActivo] = useState(editingVehicle?.activo !== undefined ? editingVehicle.activo : true);

  const [conductores, setConductores] = useState<ConductorOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadConductores() {
      try {
        const { data, error: err } = await supabase
          .from('usuarios')
          .select('id, nombre')
          .eq('rol', 'CONDUCTOR')
          .order('nombre', { ascending: true });

        if (err) throw err;
        setConductores(data || []);
      } catch (error: unknown) {
        console.error('Error al cargar conductores para selección:', error);
      }
    }
    loadConductores();
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    // 1. Validaciones del cliente
    if (!placa.trim() || !marca.trim() || !modelo.trim() || capacidadM3 === '') {
      setError('Por favor, completa todos los campos obligatorios.');
      return;
    }

    if (!validarPlaca(placa)) {
      setError('Formato de placa inválido. Debe ser de 3 letras, guion y 3 números (Ej: ABC-123 o A1B-123).');
      return;
    }

    if (Number(capacidadM3) <= 0) {
      setError('La capacidad en metros cúbicos debe ser mayor a cero.');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        placa: placa.toUpperCase().trim(),
        marca: marca.trim(),
        modelo: modelo.trim(),
        capacidadM3: Number(capacidadM3),
        conductorId: conductorId || undefined,
        activo
      };

      if (editingVehicle) {
        await vehiclesService.updateVehicle(editingVehicle.id, payload);
      } else {
        await vehiclesService.createVehicle(payload);
      }

      onSuccess();
    } catch (error: unknown) {
      console.error('Error al guardar vehículo:', error);
      setError(getErrorMessage(error, 'Ocurrió un error al guardar los datos del vehículo.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 relative">
      <button 
        onClick={onCancel}
        className="absolute top-4 right-4 p-1.5 rounded-lg bg-slate-950 border border-slate-900 text-slate-400 hover:text-white active:scale-95 transition-all cursor-pointer"
      >
        <X className="h-4 w-4" />
      </button>

      <div className="space-y-4">
        {/* Cabecera del Formulario */}
        <div className="flex items-center space-x-2 border-b border-slate-800 pb-3">
          <Truck className="text-amber-500 h-5 w-5" />
          <h4 className="text-sm font-bold text-white uppercase tracking-wider">
            {editingVehicle ? 'Editar Vehículo' : 'Registrar Nuevo Volquete'}
          </h4>
        </div>

        {/* Mensaje de Error */}
        {error && (
          <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl text-xs flex items-start space-x-2">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* Placa */}
            <div className="space-y-1">
              <label className="font-semibold text-slate-400">Placa Vehicular *</label>
              <input 
                type="text" 
                value={placa}
                onChange={(e) => {
                  setPlaca(e.target.value);
                  setError(null);
                }}
                placeholder="ABC-123"
                className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl px-3 py-2.5 outline-none font-mono text-white text-xs"
              />
            </div>

            {/* Capacidad */}
            <div className="space-y-1">
              <label className="font-semibold text-slate-400">Capacidad (m³) *</label>
              <input 
                type="number" 
                step="0.1"
                value={capacidadM3}
                onChange={(e) => {
                  setCapacidadM3(e.target.value !== '' ? parseFloat(e.target.value) : '');
                  setError(null);
                }}
                placeholder="Ej. 15"
                className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl px-3 py-2.5 outline-none text-white text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Marca */}
            <div className="space-y-1">
              <label className="font-semibold text-slate-400">Marca *</label>
              <input 
                type="text" 
                value={marca}
                onChange={(e) => {
                  setMarca(e.target.value);
                  setError(null);
                }}
                placeholder="Ej. Volvo"
                className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl px-3 py-2.5 outline-none text-white text-xs"
              />
            </div>

            {/* Modelo */}
            <div className="space-y-1">
              <label className="font-semibold text-slate-400">Modelo *</label>
              <input 
                type="text" 
                value={modelo}
                onChange={(e) => {
                  setModelo(e.target.value);
                  setError(null);
                }}
                placeholder="Ej. FMX 460"
                className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl px-3 py-2.5 outline-none text-white text-xs"
              />
            </div>
          </div>

          {/* Conductor Asignado */}
          <div className="space-y-1">
            <label className="font-semibold text-slate-400 flex justify-between">
              <span>Asignar Conductor (Opcional)</span>
              <span className="text-[10px] text-slate-500 flex items-center gap-0.5"><Users className="h-3 w-3" /> Solo rol Conductor</span>
            </label>
            <select 
              value={conductorId}
              onChange={(e) => setConductorId(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl px-3 py-2.5 outline-none text-white text-xs cursor-pointer"
            >
              <option value="">Sin conductor asignado</option>
              {conductores.map((c) => (
                <option key={c.id} value={c.id}>{c.nombre}</option>
              ))}
            </select>
          </div>

          {/* Estado Activo */}
          <div className="flex items-center space-x-2 pt-1">
            <input 
              type="checkbox" 
              id="activo"
              checked={activo}
              onChange={(e) => setActivo(e.target.checked)}
              className="w-4 h-4 accent-amber-500 rounded bg-slate-950 border-slate-800 cursor-pointer"
            />
            <label htmlFor="activo" className="font-bold text-slate-300 cursor-pointer">
              Vehículo en condiciones operativas (Activo)
            </label>
          </div>

          {/* Botones de acción */}
          <div className="flex gap-3 pt-2">
            <button 
              type="button" 
              onClick={onCancel}
              className="flex-1 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 font-semibold hover:bg-slate-900 active:scale-95 transition-all cursor-pointer"
            >
              Cancelar
            </button>
            <button 
              type="submit"
              disabled={loading}
              className="flex-1 py-2.5 rounded-xl bg-amber-500 text-slate-950 font-bold hover:bg-amber-600 active:scale-95 transition-all shadow-md shadow-amber-500/10 cursor-pointer flex items-center justify-center gap-1"
            >
              <Save className="h-3.5 w-3.5" />
              <span>{loading ? 'Guardando...' : 'Guardar Vehículo'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
