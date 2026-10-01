import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../shared/stores/useAuthStore';
import { vehiclesService, type VehiculoConConductor } from '../shared/services/vehiclesService';
import { ordersService, type Pedido } from '../shared/services/ordersService';
import { tripsService, type ViajeDetallado } from '../shared/services/tripsService';
import { driversService } from '../shared/services/driversService';
import type { ConductorDetallado } from '../shared/types';
import { getErrorMessage } from '../shared/utils/errors';

export type DashboardTab = 'monitoreo' | 'flota' | 'conductores' | 'pedidos';

export function useAdminDashboardData() {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();

  const [activeTab, setActiveTab] = useState<DashboardTab>('monitoreo');
  
  const [showVehicleForm, setShowVehicleForm] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<VehiculoConConductor | null>(null);

  const [showDriverForm, setShowDriverForm] = useState(false);
  const [editingDriver, setEditingDriver] = useState<ConductorDetallado | null>(null);
  
  const [showOrderForm, setShowOrderForm] = useState(false);
  
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Pedido | null>(null);

  const [vehicles, setVehicles] = useState<VehiculoConConductor[]>([]);
  const [drivers, setDrivers] = useState<ConductorDetallado[]>([]);
  const [orders, setOrders] = useState<Pedido[]>([]);
  const [trips, setTrips] = useState<ViajeDetallado[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [vData, oData, tData, dData] = await Promise.all([
        vehiclesService.getVehicles(),
        ordersService.getOrders(),
        tripsService.getTrips(),
        driversService.getDrivers().catch(() => [])
      ]);
      
      setVehicles(vData);
      setOrders(oData);
      setTrips(tData);
      setDrivers(dData);
    } catch (loadError: unknown) {
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

  const handleCancelOrder = async (id: string) => {
    await ordersService.updateOrderState(id, 'CANCELADO');
    await refreshData();
  };

  const handleOrderFormSuccess = async () => {
    setShowOrderForm(false);
    await refreshData();
  };

  const handleEditDriver = (driver: ConductorDetallado) => {
    setEditingDriver(driver);
    setShowDriverForm(true);
  };

  const handleToggleDriverStatus = async (driver: ConductorDetallado) => {
    try {
      await driversService.toggleDriverStatus(driver.id, !driver.activo);
      await refreshData();
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'No se pudo cambiar el estado del conductor.'));
    }
  };

  const handleDriverFormSuccess = async () => {
    setShowDriverForm(false);
    setEditingDriver(null);
    await refreshData();
  };

  const handleAssignClick = (order: Pedido) => {
    setSelectedOrder(order);
    setShowAssignModal(true);
  };

  const handleAssignSuccess = async () => {
    setShowAssignModal(false);
    setSelectedOrder(null);
    await refreshData();
  };

  return {
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
  };
}
