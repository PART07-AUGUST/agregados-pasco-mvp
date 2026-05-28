import { useCallback, useEffect, useState } from 'react';
import {
  RotateCw,
  CheckCircle2,
  Clock,
  AlertTriangle,
} from 'lucide-react';
import { offlineDb } from '../../../shared/services/offlineDb';
import type { OfflineAction } from '../../../shared/types';
import { tripsService } from '../../../shared/services/tripsService';
import { storageService } from '../../../shared/services/storageService';
import { supabase } from '../../../shared/services/supabase';
import { getErrorMessage } from '../../../shared/utils/errors';

interface OfflineQueueManagerProps {
  onSyncSuccess?: () => void | Promise<void>;
}

export function OfflineQueueManager({ onSyncSuccess }: OfflineQueueManagerProps) {
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [syncing, setSyncing] = useState<boolean>(false);
  const [colaViajes, setColaViajes] = useState<OfflineAction[]>([]);
  const [error, setError] = useState<string | null>(null);

  const loadQueue = useCallback(async () => {
    try {
      const actions = await offlineDb.getPendingActions();
      setColaViajes(actions);
    } catch (queueError: unknown) {
      console.error('Error al cargar cola de IndexedDB:', queueError);
    }
  }, []);

  const supabaseForceStateUpdate = useCallback(async (id: string, estado: 'EN_CAMINO' | 'ENTREGADO') => {
    const { error: supabaseError } = await supabase
      .from('viajes')
      .update({ estado })
      .eq('id', id);

    if (supabaseError) {
      throw supabaseError;
    }
  }, []);

  const handleSincronizar = useCallback(async () => {
    if (!navigator.onLine || syncing) {
      return;
    }

    setSyncing(true);
    setError(null);

    try {
      const actions = await offlineDb.getPendingActions();

      for (const action of actions) {
        if (action.type === 'INICIAR_VIAJE') {
          await supabaseForceStateUpdate(action.viajeId, 'EN_CAMINO');
        } else if (action.type === 'REGISTRAR_BALANZA') {
          const photoFile = await offlineDb.getPendingPhoto(action.viajeId);
          if (!photoFile) {
            throw new Error(`Falta el ticket de pesaje físico para el viaje ${action.viajeId}.`);
          }

          const publicUrl = await storageService.uploadTicketImage(photoFile);

          await tripsService.registerWeighing(
            action.viajeId,
            action.payload.pesoEntrada,
            action.payload.pesoSalida,
            publicUrl
          );

          await offlineDb.deletePendingPhoto(action.viajeId);
        } else {
          await tripsService.completeDelivery(action.viajeId);
        }

        if (action.id !== undefined) {
          await offlineDb.deleteAction(action.id);
        }
      }

      await loadQueue();

      if (onSyncSuccess) {
        await onSyncSuccess();
      }
    } catch (syncError: unknown) {
      console.error('Fallo en sincronización offline:', syncError);
      setError(getErrorMessage(syncError, 'Error de conexión remota.'));
    } finally {
      setSyncing(false);
    }
  }, [loadQueue, onSyncSuccess, supabaseForceStateUpdate, syncing]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadQueue();
    }, 0);

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.clearTimeout(timeoutId);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [loadQueue]);

  useEffect(() => {
    if (isOnline && colaViajes.length > 0 && !syncing) {
      const timeoutId = window.setTimeout(() => {
        void handleSincronizar();
      }, 0);

      return () => {
        window.clearTimeout(timeoutId);
      };
    }
  }, [colaViajes.length, handleSincronizar, isOnline, syncing]);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 max-w-md w-full mx-auto">
      <div className="border-b border-slate-800 pb-3">
        <div>
          <h4 className="text-sm font-bold text-white uppercase tracking-wider">Actualizaciones Pendientes</h4>
          <p className="text-[10px] text-slate-500 font-medium">Tus registros se enviaran automaticamente cuando corresponda.</p>
        </div>
      </div>

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
                    <span className="font-bold text-slate-200 font-mono text-[10px] uppercase">{action.type.replaceAll('_', ' ')}</span>
                    <span className="text-[8px] text-slate-500">
                      {new Date(action.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-[9px] text-slate-400 truncate max-w-[200px]">ID Viaje: {action.viajeId.substring(0, 8)}...</p>
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

      {error && (
        <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-450 text-[10px] rounded-xl flex items-start gap-2">
          <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
          <p className="leading-normal">Error en sincronización: {error}</p>
        </div>
      )}

      {colaViajes.length > 0 && (
        <div className="p-3 bg-amber-500/5 border border-amber-500/10 rounded-xl space-y-2">
          <div className="flex items-start space-x-2 text-[10px] text-slate-400">
            <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
            <p className="leading-normal">
              Tienes {colaViajes.length} acción(es) pendiente(s). {isOnline ? 'La app intentará sincronizar automáticamente.' : 'Presiona sincronizar cuando tengas cobertura.'}
            </p>
          </div>

          <button
            onClick={() => void handleSincronizar()}
            disabled={syncing || !isOnline}
            className={`w-full py-2.5 rounded-xl text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 transition-all active:scale-95 cursor-pointer ${
              syncing || !isOnline
                ? 'bg-amber-600/50 cursor-not-allowed text-slate-800'
                : 'bg-amber-500 hover:bg-amber-600 shadow-md shadow-amber-500/10'
            }`}
          >
            <RotateCw className={`h-3.5 w-3.5 ${syncing ? 'animate-spin' : ''}`} />
            <span>{syncing ? 'Procesando Cola...' : 'Reintentar Sincronización'}</span>
          </button>
        </div>
      )}

    </div>
  );
}
