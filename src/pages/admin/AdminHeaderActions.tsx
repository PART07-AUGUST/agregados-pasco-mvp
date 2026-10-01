import { Plus } from 'lucide-react';
import type { DashboardTab } from '../useAdminDashboardData';

interface AdminHeaderActionsProps {
  activeTab: DashboardTab;
  showVehicleForm: boolean;
  showDriverForm: boolean;
  showOrderForm: boolean;
  onAddVehicle: () => void;
  onAddDriver: () => void;
  onAddOrder: () => void;
}

export function AdminHeaderActions({
  activeTab,
  showVehicleForm,
  showDriverForm,
  showOrderForm,
  onAddVehicle,
  onAddDriver,
  onAddOrder,
}: AdminHeaderActionsProps) {
  if (activeTab === 'flota' && !showVehicleForm) {
    return (
      <button 
        type="button"
        onClick={onAddVehicle}
        className="w-full sm:w-auto px-4 py-2 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs hover:bg-amber-600 active:scale-95 transition-colors shadow-md shadow-amber-500/10 flex items-center justify-center gap-1 cursor-pointer"
      >
        <Plus className="h-4 w-4" />
        <span>Agregar Vehículo</span>
      </button>
    );
  }

  if (activeTab === 'conductores' && !showDriverForm) {
    return (
      <button 
        type="button"
        onClick={onAddDriver}
        className="w-full sm:w-auto px-4 py-2 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs hover:bg-amber-600 active:scale-95 transition-colors shadow-md shadow-amber-500/10 flex items-center justify-center gap-1 cursor-pointer"
      >
        <Plus className="h-4 w-4" />
        <span>Nuevo Conductor</span>
      </button>
    );
  }

  if (activeTab === 'pedidos' && !showOrderForm) {
    return (
      <button 
        type="button"
        onClick={onAddOrder}
        className="w-full sm:w-auto px-4 py-2 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs hover:bg-amber-600 active:scale-95 transition-colors shadow-md shadow-amber-500/10 flex items-center justify-center gap-1 cursor-pointer"
      >
        <Plus className="h-4 w-4" />
        <span>Registrar Pedido</span>
      </button>
    );
  }

  return null;
}

export default AdminHeaderActions;
