import { useState, useEffect, useCallback } from 'react';
import { 
  Wifi, 
  WifiOff, 
  Database, 
  RotateCw, 
  CheckCircle2, 
  Clock, 
  AlertTriangle 
} from 'lucide-react';
import { offlineDb } from '../../../shared/services/offlineDb';
import type { OfflineAction } from '../../../shared/services/offlineDb';
import { tripsService } from '../../../shared/services/tripsService';
import { storageService } from '../../../shared/services/storageService';
import { supabase } from '../../../shared/services/supabase';

interface OfflineQueueManagerProps {
  onSyncSuccess?: () => void | Promise<void>;
}

export function OfflineQueueManager({ onSyncSuccess }: OfflineQueueManagerProps) {
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [syncing, setSyncing] = useState<boolean>(false);
  const [colaViajes, setColaViajes] = useState<OfflineAction[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Cargar cola de acciones reales desde IndexedDB
  const cargarCola = useCallback(async () => {
    try {
      const actions = await offlineDb.getPendingActions();
      setColaViajes(actions);
    } catch (err: any) {
      console.error('Error al cargar cola de IndexedDB:', err);
    }
  }, []);

  useEffect(() => {
    cargarCola();
    
    // Escuchar eventos globales de conexión
    const handleOnline = () => {
      setIsOnline(true);
    };
    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [cargarCola]);

  // Sincronización automática al recuperar cobertura
  useEffect(() => {
    if (isOnline && colaViajes.length > 0 && !syncing) {
      console.log('Cobertura de red recuperada. Iniciando sincronización automática de cola...');
      handleSincronizar();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOnline]);

  // Sincronizar cola de acciones de forma SECUENCIAL ESTRICTA
  const handleSincronizar = async () => {
    if (!navigator.onLine) {
      alert("No se puede sincronizar en este momento. Sin cobertura de red.");
      return;
    }

    setSyncing(true);
    setError(null);
    
    try {
      const actions = await offlineDb.getPendingActions();
      
      for (const action of actions) {
        if (action.type === 'INICIAR_VIAJE') {
          // 1. Iniciar viaje en Supabase
          await supabaseForceStateUpdate(action.viajeId, 'EN_CAMINO');
        } 
        else if (action.type === 'REGISTRAR_BALANZA') {
          // 1. Obtener el archivo binario guardado en IndexedDB
          const photoFile = await offlineDb.getPendingPhoto(action.viajeId);
          if (!photoFile) {
            throw new Error(`Falta el ticket de pesaje físico para el viaje ${action.viajeId}.`);
          }

          // 2. Subir imagen a Supabase Storage
          const publicUrl = await storageService.uploadTicketImage(photoFile);

          // 3. Registrar pesaje mediante RPC
          await tripsService.registerWeighing(
            action.viajeId,
            action.payload.pesoEntrada,
            action.payload.pesoSalida,
            publicUrl
          );

          // 4. Eliminar el archivo local una vez sincronizado
          await offlineDb.deletePendingPhoto(action.viajeId);
        } 
        else if (action.type === 'CONFIRMAR_ENTREGA') {
          // 1. Confirmar entrega y liberar camión en Supabase
          await tripsService.completeDelivery(action.viajeId);
        }

        // Eliminar la acción completada de la cola
        if (action.id !== undefined) {
          await offlineDb.deleteAction(action.id);
        }
      }

      // Recargar cola local para limpiar interfaz
      await cargarCola();
      
      // Notificar al Dashboard principal para que actualice la UI
      if (onSyncSuccess) {
        await onSyncSuccess();
      }

    } catch (err: any) {
      console.error('Fallo en sincronización offline:', err);
      setError(err.message || 'Error de conexión remota.');
    } finally {
      setSyncing(false);
    }
  };

  // Método auxiliar para forzar la actualización de estado remota eludiendo fallos de red recursivos
  const supabaseForceStateUpdate = async (id: string, estado: 'EN_CAMINO' | 'ENTREGADO') => {
    const { error: supError } = await supabase
      .from('viajes')
      .update({ estado })
      .eq('id', id);

    if (supError) {
      throw supError;
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 max-w-md w-full mx-auto">
      
      {/* Cabecera del Controlador */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div>
          <h4 className="text-sm font-bold text-white uppercase tracking-wider">Control de Sincronización</h4>
          <p className="text-[10px] text-slate-500 font-medium">Motor de Tolerancia a Fallos (IndexedDB)</p>
        </div>
        
        {/* Indicador de Conexión */}
        <div className={`flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
          isOnline ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
        }`}>
          {isOnline ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
          <span>{isOnline ? 'CON RED' : 'SIN SEÑAL'}</span>
        </div>
      </div>

      {/* Cola de Viajes Pendientes */}
      <div className="space-y-2">
        <h5 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Cola de Sincronización Local</h5>
        
        {colaViajes.length === 0 ? (
          <div className="p-4 bg-slate-950 rounded-xl border border-slate-900 flex flex-col items-center justify-center text-center space-y-1">
            <CheckCircle2 className="h-6 w-6 text-emerald-400" />
            <span className="text-xs font-semibold text-slate-300">Todo sincronizado</span>
            <p className="text-[10px] text-slate-500">No hay viajes o tickets pendientes por subir.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {colaViajes.map((action) => (
              <div key={action.id} className="p-3 bg-slate-950 rounded-xl border border-slate-900 flex justify-between items-center text-xs">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-slate-200 font-mono text-[10px] uppercase">
                      {action.type.replace('_', ' ')}
                    </span>
                    <span className="text-[8px] text-slate-500">
                      {new Date(action.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-[9px] text-slate-400 truncate max-w-[200px]">
                    ID Viaje: {action.viajeId.substring(0, 8)}...
                  </p>
                </div>
                
                <span className="px-2 py-0.5 rounded font-mono text-[9px] font-bold flex items-center gap-1 bg-amber-500/10 text-amber-400 border border-amber-500/20 animate-pulse">
                  <Clock className="h-2.5 w-2.5" />
                  <span>Pendiente</span>
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Mostrar errores si ocurren */}
      {error && (
        <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-450 text-[10px] rounded-xl flex items-start gap-2">
          <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
          <p className="leading-normal">Error en sincronización: {error}</p>
        </div>
      )}

      {/* Botón de reintento/sincronización */}
      {colaViajes.length > 0 && (
        <div className="p-3 bg-amber-500/5 border border-amber-500/10 rounded-xl space-y-2">
          <div className="flex items-start space-x-2 text-[10px] text-slate-400">
            <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
            <p className="leading-normal">
              Tienes {colaViajes.length} acción(es) en cola local de IndexedDB. Presiona sincronizar al tener cobertura.
            </p>
          </div>
          
          <button 
            onClick={handleSincronizar}
            disabled={syncing}
            className={`w-full py-2.5 rounded-xl text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 transition-all active:scale-95 cursor-pointer ${
              syncing 
                ? 'bg-amber-600/50 cursor-not-allowed text-slate-800' 
                : 'bg-amber-500 hover:bg-amber-600 shadow-md shadow-amber-500/10'
            }`}
          >
            <RotateCw className={`h-3.5 w-3.5 ${syncing ? 'animate-spin' : ''}`} />
            <span>{syncing ? 'Procesando Cola...' : 'Reintentar Sincronización'}</span>
          </button>
        </div>
      )}

      {/* Pie del Módulo del Conductor */}
      <div className="pt-2 flex justify-between items-center text-[10px] text-slate-500 font-semibold border-t border-slate-800/80">
        <span className="flex items-center gap-1"><Database className="h-3.5 w-3.5 text-amber-500" /> IndexedDB Activo</span>
        <span>Pasco Offline Core</span>
      </div>

    </div>
  );
}
