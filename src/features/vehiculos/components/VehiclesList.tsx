import { Edit2, Trash2, ShieldCheck, AlertCircle } from 'lucide-react';
import type { VehiculoConConductor } from '../../../shared/services/vehiclesService';

interface VehiclesListProps {
  vehicles: VehiculoConConductor[];
  onEdit: (vehicle: VehiculoConConductor) => void;
  onDelete: (id: string) => Promise<void>;
}

export function VehiclesList({ vehicles, onEdit, onDelete }: VehiclesListProps) {
  const handleDeleteClick = async (id: string, placa: string) => {
    if (confirm(`¿Estás seguro de que deseas eliminar permanentemente el vehículo con placa "${placa}" de la flota?`)) {
      try {
        await onDelete(id);
      } catch (e: any) {
        alert(e.message || 'Error al eliminar vehículo');
      }
    }
  };

  return (
    <div className="bg-slate-900/30 border border-slate-900 rounded-3xl overflow-hidden backdrop-blur-md">
      
      {/* Cabecera del Listado */}
      <div className="p-5 border-b border-slate-900 flex justify-between items-center">
        <div>
          <h4 className="text-sm font-bold text-white uppercase tracking-wider">Flota de Volquetes Registrados</h4>
          <p className="text-[10px] text-slate-500 mt-0.5">Control de capacidad de carga y conductores asignados en cantera</p>
        </div>
        <span className="px-2.5 py-1 rounded bg-slate-950 border border-slate-900 text-[10px] text-amber-500 font-mono font-bold">
          {vehicles.length} Vehículos
        </span>
      </div>

      {vehicles.length === 0 ? (
        <div className="p-12 text-center flex flex-col items-center justify-center space-y-2">
          <div className="p-3 bg-slate-900 border border-slate-800 rounded-2xl text-slate-600">
            <AlertCircle className="h-8 w-8" />
          </div>
          <span className="text-xs font-bold text-slate-400">No hay vehículos registrados</span>
          <p className="text-[10px] text-slate-500 max-w-xs leading-normal">
            Comienza registrando tu primer volquete usando el formulario administrativo lateral.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto text-xs">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-900 text-slate-500 font-bold uppercase tracking-wider text-[10px] bg-slate-950/20">
                <th className="py-3 px-4">Placa</th>
                <th className="py-3 px-4">Especificaciones</th>
                <th className="py-3 px-4">Capacidad</th>
                <th className="py-3 px-4">Conductor Asignado</th>
                <th className="py-3 px-4">Estado</th>
                <th className="py-3 px-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-900/60">
              {vehicles.map((v) => (
                <tr key={v.id} className="hover:bg-slate-900/10 transition-colors">
                  
                  {/* Placa */}
                  <td className="py-3.5 px-4 font-mono font-bold text-amber-500 tracking-wider">
                    {v.placa}
                  </td>
                  
                  {/* Especificaciones */}
                  <td className="py-3.5 px-4">
                    <span className="font-bold text-slate-200">{v.marca}</span>
                    <span className="text-slate-400 block text-[10px]">{v.modelo}</span>
                  </td>
                  
                  {/* Capacidad */}
                  <td className="py-3.5 px-4 font-mono font-semibold text-slate-300">
                    {v.capacidadM3} m³
                  </td>
                  
                  {/* Conductor */}
                  <td className="py-3.5 px-4">
                    <span className="text-slate-300 font-medium">{v.conductorNombre}</span>
                  </td>
                  
                  {/* Estado */}
                  <td className="py-3.5 px-4">
                    <span className={`px-2 py-0.5 rounded font-mono text-[9px] font-bold ${
                      v.activo 
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                        : 'bg-slate-950 text-slate-600 border border-slate-900'
                    }`}>
                      {v.activo ? 'OPERATIVO' : 'DE BAJA'}
                    </span>
                  </td>
                  
                  {/* Acciones */}
                  <td className="py-3.5 px-4 text-right">
                    <div className="flex items-center justify-end space-x-2">
                      <button 
                        onClick={() => onEdit(v)}
                        className="p-1.5 rounded-lg bg-slate-950 border border-slate-900 text-slate-400 hover:text-white active:scale-95 transition-all cursor-pointer"
                        title="Editar vehículo"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </button>
                      <button 
                        onClick={() => handleDeleteClick(v.id, v.placa)}
                        className="p-1.5 rounded-lg bg-slate-950 border border-slate-900 text-rose-500/80 hover:text-rose-400 hover:bg-rose-500/10 active:scale-95 transition-all cursor-pointer"
                        title="Eliminar vehículo"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>

                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Footer del Listado */}
      <div className="p-4 border-t border-slate-900 bg-slate-950/20 flex items-center justify-between text-[10px] text-slate-500 font-semibold uppercase tracking-wider">
        <span className="flex items-center gap-1"><ShieldCheck className="h-3.5 w-3.5 text-amber-500" /> Base de Datos Flota Activa</span>
        <span>Supabase Sync</span>
      </div>

    </div>
  );
}
export default VehiclesList;
