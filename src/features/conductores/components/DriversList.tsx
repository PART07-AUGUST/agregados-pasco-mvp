import { 
  User, 
  Truck, 
  Phone, 
  CreditCard, 
  FileCheck, 
  Edit3, 
  Power, 
  MessageSquare
} from 'lucide-react';
import type { ConductorDetallado } from '../../../shared/types';

interface DriversListProps {
  conductores: ConductorDetallado[];
  onEditDriver: (conductor: ConductorDetallado) => void;
  onToggleStatus: (conductor: ConductorDetallado) => void;
}

export function DriversList({ conductores, onEditDriver, onToggleStatus }: DriversListProps) {
  if (conductores.length === 0) {
    return (
      <div className="bg-slate-900/30 border border-slate-900 rounded-3xl p-12 text-center space-y-3">
        <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center mx-auto">
          <User className="h-6 w-6" />
        </div>
        <h3 className="text-base font-bold text-white">No hay conductores registrados</h3>
        <p className="text-xs text-slate-500 max-w-sm mx-auto">
          Comienza agregando conductores a la nómina logística para asignarles volquetes y programar despachos de material.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {conductores.map((driver) => {
        const isInactive = driver.activo === false;
        const hasActiveTrip = !!driver.viajeActivo && !isInactive;

        return (
          <div 
            key={driver.id}
            className={`rounded-2xl border transition-all relative overflow-hidden flex flex-col justify-between p-5 space-y-4 ${
              isInactive 
                ? 'bg-slate-950/40 border-slate-900 opacity-60' 
                : hasActiveTrip
                  ? 'bg-slate-900/40 border-amber-500/30 shadow-lg shadow-amber-500/5'
                  : 'bg-slate-900/30 border-slate-800/80 hover:border-slate-700'
            }`}
          >
            {/* Cabecera de la Tarjeta */}
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center space-x-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-xs font-mono shrink-0 ${
                  isInactive 
                    ? 'bg-slate-800 text-slate-400' 
                    : hasActiveTrip 
                      ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' 
                      : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                }`}>
                  {driver.nombre.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white tracking-tight">{driver.nombre}</h4>
                  <p className="text-[11px] text-slate-500 font-mono">{driver.email}</p>
                </div>
              </div>

              {/* Badge de Estado Operativo */}
              <div>
                {isInactive ? (
                  <span className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-400 text-[10px] font-bold tracking-wider uppercase">
                    Inactivo
                  </span>
                ) : hasActiveTrip ? (
                  <span className="px-2 py-0.5 rounded-md bg-amber-500/15 border border-amber-500/30 text-amber-400 text-[10px] font-bold tracking-wider uppercase flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse"></span>
                    En Ruta
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-md bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-[10px] font-bold tracking-wider uppercase flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                    Disponible
                  </span>
                )}
              </div>
            </div>

            {/* Datos Técnicos y Operativos */}
            <div className="space-y-2 text-xs border-y border-slate-850 py-3">
              {/* DNI y Licencia */}
              <div className="grid grid-cols-2 gap-2 text-slate-400">
                <div className="flex items-center space-x-1.5">
                  <CreditCard className="h-3.5 w-3.5 text-slate-500 shrink-0" />
                  <span>DNI:</span>
                  <span className="font-mono text-white font-semibold">{driver.dni || 'Sin DNI'}</span>
                </div>
                <div className="flex items-center space-x-1.5">
                  <FileCheck className="h-3.5 w-3.5 text-slate-500 shrink-0" />
                  <span>Brevete:</span>
                  <span className="font-mono text-white font-semibold">{driver.licenciaConducir || 'N/A'}</span>
                </div>
              </div>

              {/* Volquete Asignado */}
              <div className="flex items-center justify-between text-slate-400 pt-1">
                <span className="flex items-center gap-1.5">
                  <Truck className="h-3.5 w-3.5 text-slate-500 shrink-0" />
                  Volquete Fijo:
                </span>
                {driver.vehiculoAsignado ? (
                  <span className="font-mono text-amber-400 font-bold bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                    {driver.vehiculoAsignado.placa} ({driver.vehiculoAsignado.capacidadM3} m³)
                  </span>
                ) : (
                  <span className="text-slate-500 italic text-[11px]">Sin asignar</span>
                )}
              </div>

              {/* Viaje en curso si existe */}
              {driver.viajeActivo && (
                <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-[11px] space-y-0.5">
                  <span className="text-amber-400 font-bold block">Destino actual:</span>
                  <p className="text-slate-300 truncate">{driver.viajeActivo.destino || 'Destino de obra'}</p>
                </div>
              )}
            </div>

            {/* Acciones del Administrador */}
            <div className="flex items-center justify-between gap-2 pt-1">
              {driver.celular ? (
                <a
                  href={`https://wa.me/51${driver.celular.replace(/\D/g, '')}`}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-emerald-400 hover:bg-slate-900 active:scale-95 transition-all text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                  title="Contactar vía WhatsApp"
                >
                  <MessageSquare className="h-3.5 w-3.5" />
                  <span className="font-mono">{driver.celular}</span>
                </a>
              ) : (
                <span className="text-[11px] text-slate-600 flex items-center gap-1">
                  <Phone className="h-3 w-3" /> Sin teléfono
                </span>
              )}

              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => onEditDriver(driver)}
                  aria-label={`Editar conductor ${driver.nombre}`}
                  className="p-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-900 active:scale-95 transition-all cursor-pointer"
                  title="Editar información"
                >
                  <Edit3 className="h-3.5 w-3.5" />
                </button>

                <button
                  type="button"
                  onClick={() => onToggleStatus(driver)}
                  aria-label={isInactive ? `Activar conductor ${driver.nombre}` : `Desactivar conductor ${driver.nombre}`}
                  className={`p-1.5 rounded-lg border active:scale-95 transition-all cursor-pointer ${
                    isInactive
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20'
                      : 'bg-rose-500/10 border-rose-500/30 text-rose-400 hover:bg-rose-500/20'
                  }`}
                  title={isInactive ? 'Activar conductor' : 'Dar de baja temporal'}
                >
                  <Power className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

          </div>
        );
      })}
    </div>
  );
}

export default DriversList;
