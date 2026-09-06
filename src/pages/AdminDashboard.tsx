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
  Users
} from 'lucide-react';
import { useAuthStore } from '../shared/stores/useAuthStore';

// Servicios de Infraestructura
import { vehiclesService, type VehiculoConConductor } from '../shared/services/vehiclesService';
import { ordersService, type Pedido } from '../shared/services/ordersService';
import { tripsService, type ViajeDetallado } from '../shared/services/tripsService';
import { driversService } from '../shared/services/driversService';
import type { ConductorDetallado } from '../shared/types';

// Componentes Reutilizables de Features
import { VehiclesList } from '../features/vehiculos/components/VehiclesList';
import { VehicleForm } from '../features/vehiculos/components/VehicleForm';
import { OrdersList } from '../features/pedidos/components/OrdersList';
import { OrderForm } from '../features/pedidos/components/OrderForm';
import { TripAssignModal } from '../features/viajes/components/TripAssignModal';
import { TripsList } from '../features/viajes/components/TripsList';
import { DriversList } from '../features/conductores/components/DriversList';
import { DriverForm } from '../features/conductores/components/DriverForm';
import { getErrorMessage } from '../shared/utils/errors';

export function AdminDashboard() {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();

  // Estados de Pestañas y Ventanas modales
  const [activeTab, setActiveTab] = useState<'monitoreo' | 'flota' | 'conductores' | 'pedidos'>('monitoreo');
  
  const [showVehicleForm, setShowVehicleForm] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<VehiculoConConductor | null>(null);

  const [showDriverForm, setShowDriverForm] = useState(false);
  const [editingDriver, setEditingDriver] = useState<ConductorDetallado | null>(null);
  
  const [showOrderForm, setShowOrderForm] = useState(false);
  
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Pedido | null>(null);

  // Estados de datos de Supabase
  const [vehicles, setVehicles] = useState<VehiculoConConductor[]>([]);
  const [drivers, setDrivers] = useState<ConductorDetallado[]>([]);
  const [orders, setOrders] = useState<Pedido[]>([]);
  const [trips, setTrips] = useState<ViajeDetallado[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Carga unificada de recursos desde Supabase
  const refreshData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [vData, oData, tData, dData] = await Promise.all([
        vehiclesService.getVehicles(),
        ordersService.getOrders(),
        tripsService.getTrips(),
        driversService.getDrivers().catch((err: unknown) => {
          console.warn('Advertencia al cargar conductores en panel:', err);
          return [];
        })
      ]);
      
      setVehicles(vData);
      setOrders(oData);
      setTrips(tData);
      setDrivers(dData);
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

  // CRUD handlers: Conductores
  const handleEditDriver = (driver: ConductorDetallado) => {
    setEditingDriver(driver);
    setShowDriverForm(true);
  };

  const handleToggleDriverStatus = async (driver: ConductorDetallado) => {
    try {
      await driversService.toggleDriverStatus(driver.id, !driver.activo);
      await refreshData();
    } catch (err: unknown) {
      console.error('Error actualizando estado de conductor:', err);
      setError(getErrorMessage(err, 'No se pudo cambiar el estado del conductor.'));
    }
  };

  const handleDriverFormSuccess = async () => {
    setShowDriverForm(false);
    setEditingDriver(null);
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
              onClick={() => setActiveTab('conductores')}
              className={`px-4 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
                activeTab === 'conductores' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Users className="h-3.5 w-3.5" />
              <span>Conductores</span>
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

          <div className="flex flex-wrap gap-2 w-full md:w-auto">
            {activeTab === 'flota' && !showVehicleForm && (
              <button 
                onClick={() => { setEditingVehicle(null); setShowVehicleForm(true); }}
                className="w-full sm:w-auto px-4 py-2 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs hover:bg-amber-600 active:scale-95 transition-all shadow-md shadow-amber-500/10 flex items-center justify-center gap-1 cursor-pointer"
              >
                <Plus className="h-4 w-4" />
                <span>Agregar Vehículo</span>
              </button>
            )}
            {activeTab === 'conductores' && !showDriverForm && (
              <button 
                onClick={() => { setEditingDriver(null); setShowDriverForm(true); }}
                className="w-full sm:w-auto px-4 py-2 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs hover:bg-amber-600 active:scale-95 transition-all shadow-md shadow-amber-500/10 flex items-center justify-center gap-1 cursor-pointer"
              >
                <Plus className="h-4 w-4" />
                <span>Nuevo Conductor</span>
              </button>
            )}
            {activeTab === 'pedidos' && !showOrderForm && (
              <button 
                onClick={() => setShowOrderForm(true)}
                className="w-full sm:w-auto px-4 py-2 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs hover:bg-amber-600 active:scale-95 transition-all shadow-md shadow-amber-500/10 flex items-center justify-center gap-1 cursor-pointer"
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
                <TripsList trips={trips} />
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

            {/* PESTAÑA: CONDUCTORES */}
            {activeTab === 'conductores' && (
              <div className="space-y-6">
                {showDriverForm && (
                  <div className="max-w-4xl mx-auto">
                    <DriverForm 
                      onSuccess={handleDriverFormSuccess}
                      onCancel={() => { setShowDriverForm(false); setEditingDriver(null); }}
                      editingDriver={editingDriver}
                      availableVehicles={vehicles}
                    />
                  </div>
                )}

                <DriversList 
                  conductores={drivers}
                  onEditDriver={handleEditDriver}
                  onToggleStatus={handleToggleDriverStatus}
                />
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
