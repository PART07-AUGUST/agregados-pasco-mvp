import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Truck,
  LogOut,
  Navigation,
  FileCheck2,
  HardHat,
  Loader2,
  RefreshCw,
  WifiOff,
} from 'lucide-react';
import { useAuthStore } from '../shared/stores/useAuthStore';
import { tripsService } from '../shared/services/tripsService';
import type { ViajeDetallado } from '../shared/services/tripsService';
import { DriverTripActive } from '../features/viajes/components/DriverTripActive';
import { OfflineQueueManager } from '../features/viajes/components/OfflineQueueManager';
import { supabase } from '../shared/services/supabase';
import { getErrorMessage } from '../shared/utils/errors';

export function DriverDashboard() {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();

  const [activeTrip, setActiveTrip] = useState<ViajeDetallado | null>(null);
  const [completedCount, setCompletedCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);

  useEffect(() => {
    const handleConnectionChange = () => setIsOnline(navigator.onLine);
    window.addEventListener('online', handleConnectionChange);
    window.addEventListener('offline', handleConnectionChange);

    return () => {
      window.removeEventListener('online', handleConnectionChange);
      window.removeEventListener('offline', handleConnectionChange);
    };
  }, []);

  useEffect(() => {
    if (!user?.id) {
      const timeoutId = window.setTimeout(() => {
        setActiveTrip(null);
        setCompletedCount(0);
        setLoading(false);
      }, 0);

      return () => {
        window.clearTimeout(timeoutId);
      };

      return;
    }

    let cancelled = false;

    const loadDriverData = async (isRefresh = false) => {
      if (cancelled) {
        return;
      }

      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);

      try {
        const trip = await tripsService.getDriverActiveTrip(user.id);

        const { count, error: countError } = await supabase
          .from('viajes')
          .select('*', { count: 'exact', head: true })
          .eq('conductor_id', user.id)
          .eq('estado', 'ENTREGADO');

        if (cancelled) {
          return;
        }

        setActiveTrip(trip);

        if (countError) {
          console.error('Error al contar viajes entregados:', countError);
          setCompletedCount(0);
        } else {
          setCompletedCount(count || 0);
        }
      } catch (loadError: unknown) {
        if (cancelled) {
          return;
        }

        console.error('Error al cargar datos del conductor:', loadError);
        setError(getErrorMessage(loadError, 'Error al sincronizar datos del servidor de Agregados SIS.'));
      } finally {
        if (!cancelled) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    };

    void loadDriverData();

    return () => {
      cancelled = true;
    };
  }, [user]);

  const refreshDriverData = async (isRefresh = false) => {
    if (!user?.id) {
      return;
    }

    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);

    try {
      const trip = await tripsService.getDriverActiveTrip(user.id);

      const { count, error: countError } = await supabase
        .from('viajes')
        .select('*', { count: 'exact', head: true })
        .eq('conductor_id', user.id)
        .eq('estado', 'ENTREGADO');

      setActiveTrip(trip);

      if (countError) {
        console.error('Error al contar viajes entregados:', countError);
        setCompletedCount(0);
      } else {
        setCompletedCount(count || 0);
      }
    } catch (refreshError: unknown) {
      console.error('Error al cargar datos del conductor:', refreshError);
      setError(getErrorMessage(refreshError, 'Error al sincronizar datos del servidor de Agregados SIS.'));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/', { replace: true });
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-amber-500 selection:text-slate-950">
      <header className="border-b border-slate-900 bg-slate-950/90 backdrop-blur sticky top-0 z-50 px-4 h-16 flex items-center justify-between">
        <div className="flex items-center space-x-2.5">
          <div className="p-1.5 bg-gradient-to-br from-amber-400 to-amber-600 text-slate-950 rounded-lg">
            <Truck className="h-4.5 w-4.5" />
          </div>
          <div>
            <span className="text-[9px] font-bold text-amber-500 tracking-wider uppercase">Portal Conductor</span>
            <h1 className="text-sm font-extrabold text-white">Agregados SIS</h1>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => void refreshDriverData(true)}
            disabled={loading || refreshing}
            className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800 active:scale-95 transition-all cursor-pointer flex items-center justify-center"
            title="Refrescar datos"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin text-amber-500' : ''}`} />
          </button>

          <button
            onClick={handleLogout}
            className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-rose-450 hover:bg-rose-500/10 active:scale-95 transition-all cursor-pointer flex items-center gap-1 text-[11px] font-bold"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span>Salir</span>
          </button>
        </div>
      </header>

      <main className="flex-1 max-w-md w-full mx-auto px-4 py-6 space-y-6">
        {!isOnline && (
          <div className="bg-amber-500/10 border border-amber-500/25 rounded-2xl p-4 flex items-center justify-between gap-3 animate-pulse">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-amber-500/10 rounded-full shrink-0">
                <WifiOff className="h-4 w-4 text-amber-500" />
              </div>
              <div className="text-left">
                <h4 className="text-xs font-extrabold text-amber-400">Modo Sin Cobertura Activo</h4>
                <p className="text-[9.5px] text-amber-500/90 leading-normal mt-0.5">
                  Operando localmente. Tus fotos y pesajes se guardan de forma segura mientras recuperas señal.
                </p>
              </div>
            </div>
          </div>
        )}

        <section className="bg-slate-900/30 border border-slate-900 rounded-2xl p-4 flex items-center justify-between gap-3">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-slate-950 rounded-full border border-slate-850">
              <HardHat className="h-5 w-5 text-amber-500" />
            </div>
            <div>
              <span className="text-[9px] font-semibold text-slate-500 uppercase tracking-widest">Conductor Autorizado</span>
              <h2 className="text-sm font-bold text-white leading-normal">{user?.nombre || 'Chofer Pasco'}</h2>
            </div>
          </div>
        </section>

        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 bg-slate-900/20 border border-slate-900 rounded-2xl flex flex-col justify-between relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500" />
            <Navigation className="h-5 w-5 text-indigo-400" />
            <div className="mt-4">
              <span className="text-[9px] text-slate-500 uppercase font-bold tracking-wider">Historial</span>
              <h3 className="text-lg font-bold text-white font-mono leading-none mt-1">
                {loading ? '--' : `${completedCount} viajes`}
              </h3>
            </div>
          </div>

          <div className="p-4 bg-slate-900/20 border border-slate-900 rounded-2xl flex flex-col justify-between relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500" />
            <FileCheck2 className="h-5 w-5 text-emerald-400" />
            <div className="mt-4">
              <span className="text-[9px] text-slate-500 uppercase font-bold tracking-wider">Balanza</span>
              <h3 className="text-lg font-bold text-white font-mono leading-none mt-1">100% OK</h3>
            </div>
          </div>
        </div>

        <OfflineQueueManager onSyncSuccess={() => refreshDriverData(true)} />

        {loading ? (
          <div className="p-12 bg-slate-900/30 border border-slate-900 rounded-3xl flex flex-col items-center justify-center space-y-3">
            <Loader2 className="h-7 w-7 text-amber-500 animate-spin" />
            <span className="text-xs text-slate-450 font-medium">Sincronizando datos de despacho...</span>
          </div>
        ) : error ? (
          <div className="p-6 bg-rose-500/10 border border-rose-500/20 rounded-3xl text-center space-y-3">
            <p className="text-xs text-rose-400 font-semibold">{error}</p>
            <button
              onClick={() => void refreshDriverData()}
              className="px-4 py-2 bg-slate-900 border border-slate-800 hover:bg-slate-800 text-xs text-amber-400 font-bold rounded-xl transition-all cursor-pointer"
            >
              Reintentar Conexión
            </button>
          </div>
        ) : activeTrip ? (
          <DriverTripActive trip={activeTrip} onRefresh={() => refreshDriverData()} />
        ) : (
          <div className="p-8 bg-slate-900/30 border border-slate-900 border-dashed rounded-3xl flex flex-col items-center justify-center text-center space-y-4">
            <div className="p-4 bg-slate-900 rounded-full border border-slate-850">
              <Truck className="h-8 w-8 text-slate-600" />
            </div>
            <div className="space-y-1 max-w-xs">
              <h3 className="text-sm font-bold text-white">Sin Viajes Asignados</h3>
              <p className="text-[11px] text-slate-500 leading-normal">
                Actualmente no tienes ninguna orden de despacho programada. Mantente al tanto mientras la central administrativa asigna una carga.
              </p>
            </div>
            <button
              onClick={() => void refreshDriverData(true)}
              className="px-4 py-2 bg-slate-900 border border-slate-800 hover:bg-slate-800 text-xs text-amber-400 font-extrabold rounded-xl transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer"
            >
              <RefreshCw className="h-3 w-3" />
              <span>Verificar Nuevos Despachos</span>
            </button>
          </div>
        )}
      </main>

      <footer className="mt-auto py-4 bg-slate-950 border-t border-slate-900 text-center">
        <span className="text-[10px] text-slate-500 font-mono tracking-widest uppercase">© 2026 Agregados SIS</span>
      </footer>
    </div>
  );
}

export default DriverDashboard;
