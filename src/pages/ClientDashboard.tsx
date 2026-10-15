import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  LogOut, 
  Plus, 
  RefreshCw,
  MessageSquare,
  Compass
} from 'lucide-react';
import { useAuthStore } from '../shared/stores/useAuthStore';
import { ordersService } from '../shared/services/ordersService';
import type { Pedido } from '../shared/services/ordersService';
import type { RouteCalculationResult } from '../shared/services/freightService';
import { OrdersList } from '../features/pedidos/components/OrdersList';
import { OrderForm, type OrderMaterialItem } from '../features/pedidos/components/OrderForm';
import { FreightCalculatorModal } from '../features/pedidos/components/FreightCalculatorModal';
import { ShimmerSkeleton } from '../shared/components/ShimmerSkeleton';

export function ClientDashboard() {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();

  const [showOrderForm, setShowOrderForm] = useState(false);
  const [showFreightSimulator, setShowFreightSimulator] = useState(false);
  const [preloadedOrderData, setPreloadedOrderData] = useState<{
    destino: string;
    items: OrderMaterialItem[];
    quote: RouteCalculationResult;
  } | null>(null);

  const [orders, setOrders] = useState<Pedido[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Cargar pedidos del cliente (Supabase RLS filtra de forma automática)
  const refreshData = useCallback(async () => {
    setRefreshing(true);
    setError(null);

    try {
      const data = await ordersService.getOrders();
      setOrders(data);
    } catch (e: unknown) {
      console.error('Error cargando pedidos del cliente:', e);
      setError('Ocurrió un error al descargar la información logística desde Supabase.');
    } finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    let active = true;

    async function loadInitial() {
      try {
        const data = await ordersService.getOrders();
        if (active) {
          setOrders(data);
        }
      } catch (e: unknown) {
        if (active) {
          console.error('Error cargando pedidos del cliente:', e);
          setError('Ocurrió un error al descargar la información logística desde Supabase.');
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadInitial();

    return () => {
      active = false;
    };
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/', { replace: true });
  };

  const handleOrderFormSuccess = async () => {
    setShowOrderForm(false);
    setPreloadedOrderData(null);
    await refreshData();
  };

  const handleApplySimulatorQuote = (params: {
    destino: string;
    volumenM3: number;
    material: Pedido['material'];
    materials: Array<{ material: Pedido['material']; volumenM3: number }>;
    quote: RouteCalculationResult;
  }) => {
    setShowFreightSimulator(false);
    setPreloadedOrderData({
      destino: params.destino,
      items: params.materials.map((m, idx) => ({
        id: String(idx + 1),
        material: m.material,
        volumenM3: m.volumenM3,
      })),
      quote: params.quote,
    });
    setShowOrderForm(true);
  };

  // Cálculos de KPIs basados en la lista de pedidos del cliente
  const totalPedidos = orders.length;
  const pedidosPendientes = orders.filter(o => o.estado === 'PENDIENTE').length;
  const pedidosEnRuta = orders.filter(o => o.estado === 'EN_CAMINO' || o.estado === 'ASIGNADO').length;
  const pedidosEntregados = orders.filter(o => o.estado === 'ENTREGADO').length;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-amber-500 selection:text-slate-950">
      
      {/* Barra de Navegación */}
      <header className="border-b border-slate-900 bg-slate-950/80 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-gradient-to-br from-amber-400 to-amber-600 text-slate-950 rounded-xl shadow-lg shadow-amber-500/10">
              <LayoutDashboard className="h-5 w-5" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-amber-500 tracking-widest uppercase">Portal Cliente</span>
              <h1 className="text-md font-extrabold tracking-tight text-white flex items-center gap-1.5">
                AGREGADOS <span className="text-slate-400 font-light">CONSTRUCTORA</span>
              </h1>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <div className="hidden sm:flex flex-col text-right">
              <span className="text-xs font-bold text-white">{user?.nombre}</span>
              <span className="text-[10px] text-amber-400 font-semibold tracking-wider font-mono uppercase">{user?.rol || 'CLIENTE'}</span>
            </div>
            
            <button
              onClick={() => refreshData()}
              disabled={loading || refreshing}
              className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800 active:scale-95 transition-[color,background-color,border-color,opacity,transform,box-shadow] cursor-pointer flex items-center justify-center"
              title="Refrescar datos"
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin text-amber-500' : ''}`} />
            </button>

            <button 
              onClick={handleLogout}
              className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-rose-400 hover:bg-rose-500/10 hover:border-rose-500/20 transition-[color,background-color,border-color,opacity,transform,box-shadow] cursor-pointer flex items-center gap-1.5 text-xs font-bold"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Cerrar Sesión</span>
            </button>
          </div>
        </div>
      </header>

      {/* Contenido Principal */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* Cabecera / Sección Informativa */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-900 pb-4">
          <div>
            <h2 className="text-xl font-extrabold text-white">Consola Logística de Obras</h2>
            <p className="text-xs text-slate-500 mt-1">Simula rutas de canteras, cotiza fletes por volumen y solicita materiales directamente a obra</p>
          </div>

          <div className="flex flex-wrap sm:flex-nowrap gap-2 w-full md:w-auto">
            <button
              onClick={() => setShowFreightSimulator(true)}
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-amber-400 hover:bg-slate-850 hover:border-amber-500/40 active:scale-95 transition-[color,background-color,border-color,opacity,transform,box-shadow] font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
              title="Simular rutas de canteras, fletes y cotizar materiales"
            >
              <Compass className="h-4 w-4 text-amber-500" />
              <span>Simular Flete y Rutas</span>
            </button>

            <a
              href="https://wa.me/51958292145"
              target="_blank"
              rel="noreferrer"
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-850 active:scale-95 transition-[color,background-color,border-color,opacity,transform,box-shadow] font-semibold text-xs flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <MessageSquare className="h-4 w-4 text-emerald-500" />
              <span>Soporte</span>
            </a>

            <button 
              onClick={() => {
                setPreloadedOrderData(null);
                setShowOrderForm(true);
              }}
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs hover:bg-amber-600 active:scale-95 transition-[color,background-color,border-color,opacity,transform,box-shadow] shadow-md shadow-amber-500/10 flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              <span>Solicitar Agregado</span>
            </button>
          </div>
        </div>

        {/* Tarjetas de Desempeño Logístico (KPIs) */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 bg-slate-900/20 border border-slate-900 rounded-3xl flex flex-col justify-between relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-slate-700" />
            <span className="text-[9px] text-slate-500 uppercase font-bold tracking-wider">Total Pedidos</span>
            {loading ? <ShimmerSkeleton className="h-7 w-12 mt-2" /> : <h3 className="text-xl font-bold text-white font-mono mt-2">{totalPedidos}</h3>}
          </div>

          <div className="p-4 bg-slate-900/20 border border-slate-900 rounded-3xl flex flex-col justify-between relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-amber-500" />
            <span className="text-[9px] text-slate-500 uppercase font-bold tracking-wider">Pendientes de Pago</span>
            {loading ? <ShimmerSkeleton className="h-7 w-12 mt-2" /> : <h3 className="text-xl font-bold text-white font-mono mt-2">{pedidosPendientes}</h3>}
          </div>

          <div className="p-4 bg-slate-900/20 border border-slate-900 rounded-3xl flex flex-col justify-between relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500" />
            <span className="text-[9px] text-slate-500 uppercase font-bold tracking-wider">Despachados / En Ruta</span>
            {loading ? <ShimmerSkeleton className="h-7 w-12 mt-2" /> : <h3 className="text-xl font-bold text-white font-mono mt-2">{pedidosEnRuta}</h3>}
          </div>

          <div className="p-4 bg-slate-900/20 border border-slate-900 rounded-3xl flex flex-col justify-between relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500" />
            <span className="text-[9px] text-slate-500 uppercase font-bold tracking-wider">Entregados en Obra</span>
            {loading ? <ShimmerSkeleton className="h-7 w-12 mt-2" /> : <h3 className="text-xl font-bold text-white font-mono mt-2">{pedidosEntregados}</h3>}
          </div>
        </div>

        {/* Mensaje de Error Global */}
        {error && (
          <div className="p-4 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-2xl text-xs flex items-start space-x-2">
            <div className="space-y-1">
              <span className="font-bold">Error al cargar datos</span>
              <p>{error}</p>
              <button onClick={() => refreshData()} className="underline font-semibold block mt-1 hover:text-rose-300">Reintentar carga</button>
            </div>
          </div>
        )}

        {/* Listado de Pedidos */}
        {loading ? (
          <div aria-busy="true" className="bg-slate-900/30 border border-slate-900 rounded-3xl overflow-hidden p-5 space-y-4">
            <div className="flex justify-between">
              <ShimmerSkeleton className="h-4 w-64" />
              <ShimmerSkeleton className="h-5 w-20" />
            </div>
            {['client-row-one', 'client-row-two', 'client-row-three', 'client-row-four'].map((key) => (
              <div key={key} className="grid grid-cols-4 gap-4 items-center border-t border-slate-900 pt-4">
                <ShimmerSkeleton className="h-3 w-28" />
                <ShimmerSkeleton className="h-3 w-24" />
                <ShimmerSkeleton className="h-3 w-36" />
                <ShimmerSkeleton className="h-6 w-20 justify-self-end" />
              </div>
            ))}
            <p className="text-xs text-slate-500 font-mono tracking-widest uppercase text-center pt-2">Consultando base de datos...</p>
          </div>
        ) : (
          <OrdersList 
            orders={orders}
            onAssignClick={() => {}} // Vacío ya que no somos admin
            isAdmin={false}
          />
        )}

      </main>

      {/* Ventana Modal: Registrar Pedido */}
      {showOrderForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto py-8">
          <div className="w-full max-w-lg">
            <OrderForm 
              onSuccess={handleOrderFormSuccess}
              onCancel={() => {
                setShowOrderForm(false);
                setPreloadedOrderData(null);
              }}
              initialDestino={preloadedOrderData?.destino ?? ''}
              initialItems={preloadedOrderData?.items}
              initialQuote={preloadedOrderData?.quote ?? null}
            />
          </div>
        </div>
      )}

      {/* Ventana Modal: Simulador y Cotizador de Fletes */}
      <FreightCalculatorModal
        isOpen={showFreightSimulator}
        onClose={() => setShowFreightSimulator(false)}
        onApply={handleApplySimulatorQuote}
      />

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-900 bg-slate-950 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <span>© {new Date().getFullYear()} Agregados Pasco · Portal de Constructoras</span>
        </div>
      </footer>

    </div>
  );
}

export default ClientDashboard;
