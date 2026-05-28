import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Truck, 
  ClipboardList, 
  ShieldAlert, 
  LogOut, 
  Plus, 
  Activity, 
  Scale
} from 'lucide-react';
import { useAuthStore } from '../shared/stores/useAuthStore';

// Servicios de Infraestructura
import { vehiclesService, type VehiculoConConductor } from '../shared/services/vehiclesService';
import { ordersService, type Pedido } from '../shared/services/ordersService';
import { tripsService, type ViajeDetallado } from '../shared/services/tripsService';

// Componentes Reutilizables de Features
import { VehiclesList } from '../features/vehiculos/components/VehiclesList';
import { VehicleForm } from '../features/vehiculos/components/VehicleForm';
import { OrdersList } from '../features/pedidos/components/OrdersList';
import { OrderForm } from '../features/pedidos/components/OrderForm';
import { TripAssignModal } from '../features/viajes/components/TripAssignModal';
import { getErrorMessage } from '../shared/utils/errors';

export function AdminDashboard() {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();

  // Estados de Pestañas y Ventanas modales
  const [activeTab, setActiveTab] = useState<'monitoreo' | 'flota' | 'pedidos'>('monitoreo');
  
  const [showVehicleForm, setShowVehicleForm] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<VehiculoConConductor | null>(null);
  
  const [showOrderForm, setShowOrderForm] = useState(false);
  
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Pedido | null>(null);

  // Estados de datos de Supabase
  const [vehicles, setVehicles] = useState<VehiculoConConductor[]>([]);
  const [orders, setOrders] = useState<Pedido[]>([]);
  const [trips, setTrips] = useState<ViajeDetallado[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Carga unificada de recursos desde Supabase
  const refreshData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [vData, oData, tData] = await Promise.all([
        vehiclesService.getVehicles(),
        ordersService.getOrders(),
        tripsService.getTrips()
      ]);
      
      setVehicles(vData);
      setOrders(oData);
      setTrips(tData);
    } catch (loadError: unknown) {
      console.error('Error cargando recursos en dashboard:', loadError);
      setError(getErrorMessage(loadError, 'Ocurrió un error al descargar la información logística desde Supabase.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void refreshData();
    }, 0);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/', { replace: true });
  };

  // CRUD handlers: Vehículos
  const handleEditVehicle = (vehicle: VehiculoConConductor) => {
    setEditingVehicle(vehicle);
    setShowVehicleForm(true);
  };

  const handleDeleteVehicle = async (id: string) => {
    await vehiclesService.deleteVehicle(id);
    await refreshData();
  };

  const handleVehicleFormSuccess = async () => {
    setShowVehicleForm(false);
    setEditingVehicle(null);
    await refreshData();
  };

  // CRUD handlers: Pedidos
  const handleCancelOrder = async (id: string) => {
    await ordersService.updateOrderState(id, 'CANCELADO');
    await refreshData();
  };

  const handleOrderFormSuccess = async () => {
    setShowOrderForm(false);
    await refreshData();
  };

  // Despacho handlers: Asignaciones
  const handleAssignClick = (order: Pedido) => {
    setSelectedOrder(order);
    setShowAssignModal(true);
  };

  const handleAssignSuccess = async () => {
    setShowAssignModal(false);
    setSelectedOrder(null);
    await refreshData();
  };

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
              <span className="text-[10px] font-bold text-amber-500 tracking-widest uppercase">Panel de Control</span>
              <h1 className="text-md font-extrabold tracking-tight text-white">
                AGREGADOS <span className="text-slate-400 font-light">SIS</span>
              </h1>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <div className="hidden sm:flex flex-col text-right">
              <span className="text-xs font-bold text-white">{user?.nombre}</span>
              <span className="text-[10px] text-amber-400 font-semibold tracking-wider font-mono uppercase">{user?.rol}</span>
            </div>
            
            <button 
              onClick={handleLogout}
              className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-rose-400 hover:bg-rose-500/10 hover:border-rose-500/20 transition-all cursor-pointer flex items-center gap-1.5 text-xs font-bold"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Cerrar Sesión</span>
            </button>
          </div>
        </div>
      </header>

      {/* Contenido Principal */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* Cabecera / Selector de Pestañas */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-900 pb-4">
          <div className="flex space-x-2 bg-slate-900/60 p-1 rounded-xl border border-slate-900 max-w-full overflow-x-auto">
            <button 
              onClick={() => setActiveTab('monitoreo')}
              className={`px-4 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
                activeTab === 'monitoreo' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Activity className="h-3.5 w-3.5" />
              <span>Monitoreo de Despacho</span>
            </button>
            <button 
              onClick={() => setActiveTab('flota')}
              className={`px-4 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
                activeTab === 'flota' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Truck className="h-3.5 w-3.5" />
              <span>Flota Vehicular</span>
            </button>
            <button 
              onClick={() => setActiveTab('pedidos')}
              className={`px-4 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
                activeTab === 'pedidos' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-white'
              }`}
            >
              <ClipboardList className="h-3.5 w-3.5" />
              <span>Pedidos de Obra</span>
            </button>
          </div>

          <div className="flex gap-2 w-full md:w-auto">
            {activeTab === 'flota' && !showVehicleForm && (
              <button 
                onClick={() => { setEditingVehicle(null); setShowVehicleForm(true); }}
                className="w-full md:w-auto px-4 py-2 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs hover:bg-amber-600 active:scale-95 transition-all shadow-md shadow-amber-500/10 flex items-center justify-center gap-1 cursor-pointer"
              >
                <Plus className="h-4 w-4" />
                <span>Agregar Vehículo</span>
              </button>
            )}
            {activeTab === 'pedidos' && !showOrderForm && (
              <button 
                onClick={() => setShowOrderForm(true)}
                className="w-full md:w-auto px-4 py-2 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs hover:bg-amber-600 active:scale-95 transition-all shadow-md shadow-amber-500/10 flex items-center justify-center gap-1 cursor-pointer"
              >
                <Plus className="h-4 w-4" />
                <span>Registrar Pedido</span>
              </button>
            )}
          </div>
        </div>

        {/* Mensaje de Error Global */}
        {error && (
          <div className="p-4 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-2xl text-xs flex items-start space-x-2">
            <ShieldAlert className="h-5 w-5 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span className="font-bold">Error de Conexión</span>
              <p>{error}</p>
              <button onClick={refreshData} className="underline font-semibold block mt-1 hover:text-rose-300">Reintentar carga</button>
            </div>
          </div>
        )}

        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center space-y-4">
            <div className="w-12 h-12 border-4 border-amber-500/20 border-t-amber-500 rounded-full animate-spin"></div>
            <p className="text-xs text-slate-500 font-mono tracking-widest uppercase">Cargando panel de control...</p>
          </div>
        ) : (
          <div className="space-y-6">
            
            {/* PESTAÑA 1: MONITOREO DE DESPACHOS */}
            {activeTab === 'monitoreo' && (
              <div className="space-y-6">
                
                {/* Panel de Viajes Activos */}
                <div className="bg-slate-900/30 border border-slate-900 rounded-3xl overflow-hidden">
                  <div className="p-5 border-b border-slate-900">
                    <h4 className="text-sm font-bold text-white uppercase tracking-wider">Despachos en Curso y Tránsito</h4>
                    <p className="text-[10px] text-slate-500 mt-0.5">Seguimiento de pesaje de balanza y entrega final del material en Pasco</p>
                  </div>
                  
                  {trips.length === 0 ? (
                    <div className="p-12 text-center text-slate-500 text-xs">
                      No hay viajes o despachos programados para hoy. Ve a "Pedidos de Obra" para despachar un volquete.
                    </div>
                  ) : (
                    <div className="overflow-x-auto text-xs">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="border-b border-slate-900 text-slate-500 font-bold uppercase tracking-wider text-[10px] bg-slate-950/20">
                            <th className="py-3 px-4">Código / Placa</th>
                            <th className="py-3 px-4">Conductor</th>
                            <th className="py-3 px-4">Detalles Material</th>
                            <th className="py-3 px-4">Destino</th>
                            <th className="py-3 px-4">Pesaje Entrada</th>
                            <th className="py-3 px-4">Pesaje Salida</th>
                            <th className="py-3 px-4">Estado</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-900/60 text-slate-300">
                          {trips.map((t) => (
                            <tr key={t.id} className="hover:bg-slate-900/10 transition-colors">
                              <td className="py-3.5 px-4 font-mono">
                                <span className="text-slate-500 block text-[9px]">ID: {t.id.substring(0,8).toUpperCase()}</span>
                                <span className="font-bold text-amber-500 tracking-wider">{t.placa}</span>
                              </td>
                              <td className="py-3.5 px-4 font-semibold text-slate-200">
                                {t.conductorNombre}
                              </td>
                              <td className="py-3.5 px-4">
                                <span className="font-bold text-slate-200 block">{t.material?.replace('_', ' ')}</span>
                                <span className="text-slate-500 text-[10px]">{t.volumenM3} m³</span>
                              </td>
                              <td className="py-3.5 px-4 text-slate-400 font-medium max-w-[180px] truncate">
                                {t.destino}
                              </td>
                              <td className="py-3.5 px-4 font-mono text-slate-400">
                                {t.pesoEntradaKg ? `${(t.pesoEntradaKg / 1000).toFixed(2)} t` : '--'}
                              </td>
                              <td className="py-3.5 px-4 font-mono text-slate-400">
                                {t.pesoSalidaKg ? `${(t.pesoSalidaKg / 1000).toFixed(2)} t` : '--'}
                              </td>
                              <td className="py-3.5 px-4">
                                <span className={`px-2 py-0.5 rounded font-mono text-[9px] font-bold ${
                                  t.estado === 'PENDIENTE' 
                                    ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                                    : t.estado === 'EN_CAMINO'
                                    ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                                    : t.estado === 'EN_BALANZA'
                                    ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex items-center gap-0.5 w-max'
                                    : t.estado === 'ENTREGADO'
                                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                    : 'bg-slate-950 text-slate-600 border border-slate-900'
                                }`}>
                                  {t.estado === 'EN_BALANZA' && <Scale className="h-3 w-3 inline text-amber-500" />}
                                  <span>{t.estado}</span>
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                  <div className="p-4 border-t border-slate-900 bg-slate-950/20 flex items-center justify-between text-[10px] text-slate-500 font-semibold uppercase tracking-wider">
                    <span className="flex items-center gap-1.5"><Activity className="h-3.5 w-3.5 text-amber-500" /> Monitoreo de Despacho Logístico</span>
                  </div>
                </div>

              </div>
            )}

            {/* PESTAÑA 2: GESTIÓN DE FLOTA (CRUD VEHÍCULOS) */}
            {activeTab === 'flota' && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                {showVehicleForm && (
                  <div className="lg:col-span-4">
                    <VehicleForm 
                      onSuccess={handleVehicleFormSuccess}
                      onCancel={() => { setShowVehicleForm(false); setEditingVehicle(null); }}
                      editingVehicle={editingVehicle}
                    />
                  </div>
                )}
                
                <div className={showVehicleForm ? 'lg:col-span-8' : 'lg:col-span-12'}>
                  <VehiclesList 
                    vehicles={vehicles}
                    onEdit={handleEditVehicle}
                    onDelete={handleDeleteVehicle}
                  />
                </div>
              </div>
            )}

            {/* PESTAÑA 3: CRUD PEDIDOS */}
            {activeTab === 'pedidos' && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                {showOrderForm && (
                  <div className="lg:col-span-4">
                    <OrderForm 
                      onSuccess={handleOrderFormSuccess}
                      onCancel={() => setShowOrderForm(false)}
                    />
                  </div>
                )}

                <div className={showOrderForm ? 'lg:col-span-8' : 'lg:col-span-12'}>
                  <OrdersList 
                    orders={orders}
                    onAssignClick={handleAssignClick}
                    onCancelOrder={handleCancelOrder}
                    isAdmin={true}
                  />
                </div>
              </div>
            )}



          </div>
        )}

      </main>

      {/* Modales Auxiliares */}
      {showAssignModal && selectedOrder && (
        <TripAssignModal 
          order={selectedOrder}
          onSuccess={handleAssignSuccess}
          onCancel={() => { setShowAssignModal(false); setSelectedOrder(null); }}
        />
      )}

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-900 bg-slate-950 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <span>© {new Date().getFullYear()} Agregados SIS · Consola de Control de Flotas</span>
          <span className="font-mono text-[10px] text-slate-600">OPERACIONES LOGISTICAS EN LINEA</span>
        </div>
      </footer>

    </div>
  );
}

export default AdminDashboard;
