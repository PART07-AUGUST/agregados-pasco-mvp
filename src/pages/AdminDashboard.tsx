import { 
  LayoutDashboard, 
  Truck, 
  ClipboardList, 
  ShieldAlert, 
  LogOut, 
  Activity, 
  Users,
  BrainCircuit,
} from 'lucide-react';
import { TripAssignModal } from '../features/viajes/components/TripAssignModal';
import { TripsList } from '../features/viajes/components/TripsList';
import { DriversList } from '../features/conductores/components/DriversList';
import { DriverForm } from '../features/conductores/components/DriverForm';
import { useAdminDashboardData } from './useAdminDashboardData';
import { FleetSection } from './admin/FleetSection';
import { OrdersSection } from './admin/OrdersSection';
import { AdminHeaderActions } from './admin/AdminHeaderActions';
import { useAdminCopilot } from '../features/admin/hooks/useAdminCopilot';
import { CopilotTriggerButton } from '../features/admin/components/CopilotTriggerButton';
import { AdminCopilotModal } from '../features/admin/components/AdminCopilotModal';
import { ShimmerSkeleton } from '../shared/components/ShimmerSkeleton';
import { MlComparisonPanel } from '../features/admin/components/MlComparisonPanel';

const DASHBOARD_TABS = [
  { id: 'monitoreo', label: 'Monitoreo de Despacho', icon: Activity },
  { id: 'flota', label: 'Flota Vehicular', icon: Truck },
  { id: 'conductores', label: 'Conductores', icon: Users },
  { id: 'pedidos', label: 'Pedidos de Obra', icon: ClipboardList },
  { id: 'machine-learning', label: 'Machine Learning', icon: BrainCircuit },
] as const;

function AdminDashboardLoadingSkeleton({ activeTab }: { activeTab: string }) {
  const isDriversTab = activeTab === 'conductores';
  const skeletonKeys = ['one', 'two', 'three', 'four'];

  return (
    <div aria-busy="true" className="space-y-6">
      {isDriversTab ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {skeletonKeys.map((key) => (
            <div key={key} className="rounded-2xl border border-slate-900 bg-slate-900/30 p-5 space-y-4">
              <div className="flex items-center gap-3">
                <ShimmerSkeleton className="h-10 w-10 rounded-xl" />
                <div className="space-y-2 flex-1">
                  <ShimmerSkeleton className="h-3 w-32" />
                  <ShimmerSkeleton className="h-2.5 w-44" />
                </div>
              </div>
              <div className="border-y border-slate-850 py-3 space-y-3">
                <ShimmerSkeleton className="h-3 w-full" />
                <ShimmerSkeleton className="h-3 w-4/5" />
                <ShimmerSkeleton className="h-3 w-3/5" />
              </div>
              <div className="flex justify-between">
                <ShimmerSkeleton className="h-7 w-24" />
                <ShimmerSkeleton className="h-7 w-14" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-slate-900/30 border border-slate-900 rounded-3xl overflow-hidden">
          <div className="p-5 border-b border-slate-900 space-y-2">
            <ShimmerSkeleton className="h-4 w-64" />
            <ShimmerSkeleton className="h-2.5 w-96 max-w-full" />
          </div>
          <div className="p-4 space-y-4">
            {['row-one', 'row-two', 'row-three', 'row-four', 'row-five'].map((key) => (
              <div key={key} className="grid grid-cols-5 gap-4 items-center">
                <ShimmerSkeleton className="h-3 w-24" />
                <ShimmerSkeleton className="h-3 w-32" />
                <ShimmerSkeleton className="h-3 w-20" />
                <ShimmerSkeleton className="h-3 w-40" />
                <ShimmerSkeleton className="h-6 w-20 justify-self-end" />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export function AdminDashboard() {
  const {
    user,
    activeTab,
    setActiveTab,
    showVehicleForm,
    setShowVehicleForm,
    editingVehicle,
    setEditingVehicle,
    showDriverForm,
    setShowDriverForm,
    editingDriver,
    setEditingDriver,
    showOrderForm,
    setShowOrderForm,
    showAssignModal,
    setShowAssignModal,
    selectedOrder,
    setSelectedOrder,
    vehicles,
    drivers,
    orders,
    trips,
    loading,
    error,
    refreshData,
    handleLogout,
    handleEditVehicle,
    handleDeleteVehicle,
    handleVehicleFormSuccess,
    handleCancelOrder,
    handleOrderFormSuccess,
    handleEditDriver,
    handleToggleDriverStatus,
    handleDriverFormSuccess,
    handleAssignClick,
    handleAssignSuccess,
  } = useAdminDashboardData();

  const copilot = useAdminCopilot();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-amber-500 selection:text-slate-950">
      
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
              type="button"
              onClick={handleLogout}
              className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-rose-400 hover:bg-rose-500/10 hover:border-rose-500/20 transition-colors cursor-pointer flex items-center gap-1.5 text-xs font-bold"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Cerrar Sesión</span>
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-900 pb-4">
          <div className="flex space-x-2 bg-slate-900/60 p-1 rounded-xl border border-slate-900 max-w-full overflow-x-auto">
            {DASHBOARD_TABS.map(({ id, label, icon: Icon }) => (
              <button 
                key={id}
                type="button"
                onClick={() => setActiveTab(id)}
                className={`px-4 py-2 text-xs font-bold rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 shrink-0 ${
                  activeTab === id ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-white'
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                <span>{label}</span>
              </button>
            ))}
          </div>

          <div className="flex flex-wrap gap-2 w-full md:w-auto">
            <AdminHeaderActions 
              activeTab={activeTab}
              showVehicleForm={showVehicleForm}
              showDriverForm={showDriverForm}
              showOrderForm={showOrderForm}
              onAddVehicle={() => { setEditingVehicle(null); setShowVehicleForm(true); }}
              onAddDriver={() => { setEditingDriver(null); setShowDriverForm(true); }}
              onAddOrder={() => setShowOrderForm(true)}
            />
          </div>
        </div>

        {error && (
          <div className="p-4 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-2xl text-xs flex items-start space-x-2">
            <ShieldAlert className="h-5 w-5 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span className="font-bold">Error de Conexión</span>
              <p>{error}</p>
              <button type="button" onClick={refreshData} className="underline font-semibold block mt-1 hover:text-rose-300">Reintentar carga</button>
            </div>
          </div>
        )}

        {loading ? (
          <AdminDashboardLoadingSkeleton activeTab={activeTab} />
        ) : (
          <div className="space-y-6">
            {activeTab === 'monitoreo' && (
              <div className="space-y-6">
                <TripsList trips={trips} onActualFuelSaved={refreshData} />
              </div>
            )}

            {activeTab === 'flota' && (
              <FleetSection 
                vehicles={vehicles}
                showVehicleForm={showVehicleForm}
                editingVehicle={editingVehicle}
                onEditVehicle={handleEditVehicle}
                onDeleteVehicle={handleDeleteVehicle}
                onFormSuccess={handleVehicleFormSuccess}
                onFormCancel={() => { setShowVehicleForm(false); setEditingVehicle(null); }}
              />
            )}

            {activeTab === 'conductores' && (
              <div className="space-y-6">
                <DriversList 
                  conductores={drivers}
                  onEditDriver={handleEditDriver}
                  onToggleStatus={handleToggleDriverStatus}
                  onAddDriver={() => { setEditingDriver(null); setShowDriverForm(true); }}
                />
              </div>
            )}

            {activeTab === 'pedidos' && (
              <OrdersSection 
                orders={orders}
                showOrderForm={showOrderForm}
                onAssignClick={handleAssignClick}
                onCancelOrder={handleCancelOrder}
                onFormSuccess={handleOrderFormSuccess}
                onFormCancel={() => setShowOrderForm(false)}
              />
            )}

            {activeTab === 'machine-learning' && <MlComparisonPanel />}
          </div>
        )}

      </main>

      {showDriverForm && (
        <DriverForm 
          onSuccess={handleDriverFormSuccess}
          onCancel={() => { setShowDriverForm(false); setEditingDriver(null); }}
          editingDriver={editingDriver}
          availableVehicles={vehicles}
        />
      )}

      {showAssignModal && selectedOrder && (
        <TripAssignModal 
          order={selectedOrder}
          onSuccess={handleAssignSuccess}
          onCancel={() => { setShowAssignModal(false); setSelectedOrder(null); }}
        />
      )}

      <CopilotTriggerButton 
        onClick={() => copilot.setIsOpen(true)}
        remainingQuota={copilot.remainingQuota}
        showQuota={copilot.showQuota}
      />

      <AdminCopilotModal 
        isOpen={copilot.isOpen}
        onClose={() => copilot.setIsOpen(false)}
        messages={copilot.messages}
        input={copilot.input}
        setInput={copilot.setInput}
        isGenerating={copilot.isGenerating}
        error={copilot.error}
        remainingQuota={copilot.remainingQuota}
        maxQuota={copilot.maxQuota}
        showQuota={copilot.showQuota}
        onSendMessage={copilot.sendMessage}
        onClearChat={copilot.clearChat}
      />

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
