import { useState, useEffect, type FormEvent } from 'react';
import { Truck, Users, Save, AlertCircle, X, Sparkles, RotateCcw } from 'lucide-react';
import { vehiclesService } from '../../../shared/services/vehiclesService';
import { driversService } from '../../../shared/services/driversService';
import { validarPlaca } from '../../../shared/validations';
import type { Vehiculo } from '../../../shared/types';
import { getErrorMessage } from '../../../shared/utils/errors';
import { CATALOGO_VEHICULOS_PESADOS } from '../constants/heavyVehiclesCatalog';

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

  const brandInCatalog = CATALOGO_VEHICULOS_PESADOS.some(
    (b) => b.marca.toLowerCase() === (editingVehicle?.marca || '').toLowerCase()
  );
  const [isCustomMarca, setIsCustomMarca] = useState(Boolean(editingVehicle?.marca && !brandInCatalog));
  const [isCustomModelo, setIsCustomModelo] = useState(false);

  const [conductores, setConductores] = useState<ConductorOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadConductores() {
      try {
        const data = await driversService.getConductorOptions();
        setConductores(data);
      } catch (err: unknown) {
        console.error('Error al cargar conductores para selección:', err);
      }
    }
    void loadConductores();
  }, []);

  // Obtener la marca actual en el catálogo
  const marcaSeleccionada = CATALOGO_VEHICULOS_PESADOS.find(
    (b) => b.marca.toLowerCase() === marca.toLowerCase()
  );

  const handleMarcaChange = (val: string) => {
    setError(null);
    if (val === '__OTRA__') {
      setIsCustomMarca(true);
      setIsCustomModelo(true);
      setMarca('');
      setModelo('');
    } else {
      setIsCustomMarca(false);
      setIsCustomModelo(false);
      setMarca(val);
      setModelo('');
    }
  };

  const handleModeloSelect = (modelNombre: string) => {
    setError(null);
    if (modelNombre === '__OTRO__') {
      setIsCustomModelo(true);
      setModelo('');
    } else {
      setIsCustomModelo(false);
      setModelo(modelNombre);
      const modelObj = marcaSeleccionada?.modelos.find((m) => m.nombre === modelNombre);
      if (modelObj) {
        setCapacidadM3(modelObj.capacidadSugeridaM3);
      }
    }
  };

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
              <label htmlFor="vehiculo-placa" className="font-semibold text-slate-400">
                Placa Vehicular *
              </label>
              <input 
                id="vehiculo-placa"
                type="text" 
                value={placa}
                onChange={(e) => {
                  setPlaca(e.target.value.toUpperCase());
                  setError(null);
                }}
                placeholder="ABC-123"
                maxLength={8}
                className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl px-3 py-2.5 outline-none font-mono text-white text-xs uppercase"
              />
            </div>

            {/* Capacidad */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label htmlFor="vehiculo-capacidad" className="font-semibold text-slate-400">
                  Capacidad Tolva (m³) *
                </label>
                {marcaSeleccionada && modelo && (
                  <span className="text-[10px] text-amber-400 font-medium flex items-center gap-1">
                    <Sparkles className="h-2.5 w-2.5" /> Sugerida
                  </span>
                )}
              </div>
              <input 
                id="vehiculo-capacidad"
                type="number" 
                step="0.5"
                min="1"
                max="50"
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
              <div className="flex items-center justify-between">
                <label htmlFor="vehiculo-marca" className="font-semibold text-slate-400">
                  Marca de Camión *
                </label>
                {isCustomMarca ? (
                  <button
                    type="button"
                    onClick={() => {
                      setIsCustomMarca(false);
                      setIsCustomModelo(false);
                    }}
                    className="text-[10px] text-amber-400 hover:underline flex items-center gap-0.5 cursor-pointer"
                  >
                    <RotateCcw className="h-2.5 w-2.5" /> Ver catálogo
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setIsCustomMarca(true);
                      setIsCustomModelo(true);
                    }}
                    className="text-[10px] text-slate-400 hover:text-amber-400 hover:underline cursor-pointer"
                  >
                    Escribir manual
                  </button>
                )}
              </div>

              {isCustomMarca ? (
                <input 
                  id="vehiculo-marca"
                  type="text" 
                  value={marca}
                  onChange={(e) => {
                    setMarca(e.target.value);
                    setError(null);
                  }}
                  placeholder="Ej. Kenworth / Scania..."
                  className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl px-3 py-2.5 outline-none text-white text-xs"
                />
              ) : (
                <select
                  id="vehiculo-marca"
                  value={marca}
                  onChange={(e) => handleMarcaChange(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl px-3 py-2.5 outline-none text-white text-xs cursor-pointer"
                >
                  <option value="">-- Seleccionar Marca --</option>
                  {CATALOGO_VEHICULOS_PESADOS.map((item) => (
                    <option key={item.marca} value={item.marca}>
                      {item.marca}
                    </option>
                  ))}
                  <option value="__OTRA__">+ Otra marca no listada...</option>
                </select>
              )}
            </div>

            {/* Modelo */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label htmlFor="vehiculo-modelo" className="font-semibold text-slate-400">
                  Modelo *
                </label>
                {marcaSeleccionada && (
                  isCustomModelo ? (
                    <button
                      type="button"
                      onClick={() => setIsCustomModelo(false)}
                      className="text-[10px] text-amber-400 hover:underline flex items-center gap-0.5 cursor-pointer"
                    >
                      <RotateCcw className="h-2.5 w-2.5" /> Modelos sugeridos
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setIsCustomModelo(true)}
                      className="text-[10px] text-slate-400 hover:text-amber-400 hover:underline cursor-pointer"
                    >
                      Escribir manual
                    </button>
                  )
                )}
              </div>

              {!isCustomMarca && marcaSeleccionada && !isCustomModelo ? (
                <select
                  id="vehiculo-modelo"
                  value={modelo}
                  onChange={(e) => handleModeloSelect(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl px-3 py-2.5 outline-none text-white text-xs cursor-pointer"
                >
                  <option value="">-- Seleccionar Modelo de {marca} --</option>
                  {marcaSeleccionada.modelos.map((m) => (
                    <option key={m.nombre} value={m.nombre}>
                      {m.nombre} (Tolva ~{m.capacidadSugeridaM3} m³)
                    </option>
                  ))}
                  <option value="__OTRO__">+ Otro modelo de {marca}...</option>
                </select>
              ) : (
                <input 
                  id="vehiculo-modelo"
                  type="text" 
                  value={modelo}
                  onChange={(e) => {
                    setModelo(e.target.value);
                    setError(null);
                  }}
                  placeholder={marca ? `Ej. Modelo de ${marca}` : 'Primero selecciona o ingresa la marca'}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl px-3 py-2.5 outline-none text-white text-xs"
                />
              )}
            </div>
          </div>

          {/* Conductor Asignado */}
          <div className="space-y-1">
            <label htmlFor="vehiculo-conductor" className="font-semibold text-slate-400 flex justify-between">
              <span>Asignar Conductor (Opcional)</span>
              <span className="text-[10px] text-slate-500 flex items-center gap-0.5"><Users className="h-3 w-3" /> Solo rol Conductor</span>
            </label>
            <select 
              id="vehiculo-conductor"
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
