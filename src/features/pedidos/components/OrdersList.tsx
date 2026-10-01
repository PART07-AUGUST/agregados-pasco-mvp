import { useState } from 'react';
import { ClipboardCheck, Truck, ShieldX, ShieldAlert, Award, Info } from 'lucide-react';
import type { Pedido } from '../../../shared/services/ordersService';
import { getErrorMessage } from '../../../shared/utils/errors';
import { getMaterialLabel } from '../../../shared/constants/materials';
import { OrderDispatchDetailsModal } from './OrderDispatchDetailsModal';
import { Pagination } from '../../../shared/components/Pagination';

interface OrdersListProps {
  orders: Pedido[];
  onAssignClick: (order: Pedido) => void;
  onCancelOrder: (id: string) => Promise<void>;
  isAdmin?: boolean;
}

const ITEMS_PER_PAGE = 10;

export function OrdersList({ orders, onAssignClick, onCancelOrder, isAdmin = false }: OrdersListProps) {
  const [selectedDispatchOrder, setSelectedDispatchOrder] = useState<Pedido | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  const totalPages = Math.ceil(orders.length / ITEMS_PER_PAGE) || 1;
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = Math.min(startIndex + ITEMS_PER_PAGE, orders.length);
  const currentOrders = orders.slice(startIndex, endIndex);

  const handleCancelClick = async (id: string) => {
    if (confirm('¿Estás seguro de que deseas cancelar este pedido? Esta acción no se puede deshacer.')) {
      try {
        await onCancelOrder(id);
      } catch (error: unknown) {
        alert(getErrorMessage(error, 'Error al cancelar pedido'));
      }
    }
  };

  return (
    <div className="bg-slate-900/30 border border-slate-900 rounded-3xl overflow-hidden backdrop-blur-md relative">
      <div className="p-5 border-b border-slate-900 flex justify-between items-center relative z-10">
        <div>
          <h4 className="text-sm font-bold text-white uppercase tracking-wider">Cartera de Pedidos Suministrados</h4>
          <p className="text-[10px] text-slate-500 mt-0.5">Historial de solicitudes de material de cantera y estado logístico</p>
        </div>
        <span className="px-2.5 py-1 rounded bg-slate-950 border border-slate-900 text-[10px] text-amber-500 font-mono font-bold">
          {orders.length} Pedidos
        </span>
      </div>

      {orders.length === 0 ? (
        <div className="p-12 text-center flex flex-col items-center justify-center space-y-2 relative z-10">
          <div className="p-3 bg-slate-900 border border-slate-800 rounded-2xl text-slate-600">
            <ShieldAlert className="h-8 w-8" />
          </div>
          <span className="text-xs font-bold text-slate-400">No hay pedidos registrados</span>
          <p className="text-[10px] text-slate-500 max-w-xs leading-normal">
            No se han registrado solicitudes de agregados en el sistema por el momento.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto text-xs relative z-10">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-900 text-slate-500 font-bold uppercase tracking-wider text-[10px] bg-slate-950/20">
                <th className="py-3 px-4">Constructora / Cliente</th>
                <th className="py-3 px-4">Material</th>
                <th className="py-3 px-4">Volumen</th>
                <th className="py-3 px-4">Destino de Entrega</th>
                <th className="py-3 px-4">Estado</th>
                <th className="py-3 px-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-900/60">
              {currentOrders.map((p) => (
                <tr key={p.id} className="hover:bg-slate-900/10 transition-colors">
                  <td className="py-3.5 px-4 font-bold text-slate-200">
                    {p.clienteNombre}
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="font-semibold text-slate-300">{getMaterialLabel(p.material)}</span>
                  </td>
                  <td className="py-3.5 px-4 font-mono font-bold text-amber-500">
                    {p.volumenM3} m³
                  </td>
                  <td className="py-3.5 px-4 text-slate-400 font-medium">
                    {p.destino}
                  </td>
                  <td className="py-3.5 px-4">
                    <span className={`px-2 py-0.5 rounded font-mono text-[9px] font-bold ${
                      p.estado === 'PENDIENTE' 
                        ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20 animate-pulse'
                        : p.estado === 'ASIGNADO'
                        ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                        : p.estado === 'EN_CAMINO'
                        ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                        : p.estado === 'ENTREGADO'
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : 'bg-slate-950 text-slate-600 border border-slate-900'
                    }`}>
                      {p.estado}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <div className="flex items-center justify-end space-x-2">
                      {isAdmin && p.estado === 'PENDIENTE' && (
                        <button 
                          type="button"
                          onClick={() => onAssignClick(p)}
                          className="px-2.5 py-1.5 rounded-lg bg-amber-500 text-amber-950 font-bold hover:bg-amber-600 active:scale-95 transition-all cursor-pointer flex items-center gap-1 text-[10px]"
                          title="Asignar volquete de despacho"
                        >
                          <Truck className="h-3.5 w-3.5" />
                          <span>Despachar</span>
                        </button>
                      )}
                      
                      {p.estado === 'PENDIENTE' && (
                        <button 
                          type="button"
                          onClick={() => handleCancelClick(p.id)}
                          className="p-1.5 rounded-lg bg-slate-950 border border-slate-900 text-rose-500 hover:bg-rose-500/10 hover:border-rose-500/20 active:scale-95 transition-all cursor-pointer"
                          title="Cancelar pedido"
                        >
                          <ShieldX className="h-3.5 w-3.5" />
                        </button>
                      )}

                      {p.estado !== 'PENDIENTE' && p.estado !== 'CANCELADO' && (p.vehiculoPlaca || p.conductorNombre) && (
                        <button 
                          type="button"
                          onClick={() => setSelectedDispatchOrder(p)}
                          className="p-1.5 rounded-lg border border-slate-850 bg-slate-950 text-slate-450 hover:text-amber-400 hover:border-amber-500/30 transition-all cursor-pointer flex items-center justify-center"
                          title="Ver detalles del despacho"
                        >
                          <Info className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="p-4 border-t border-slate-900 bg-slate-950/20 flex flex-col gap-3 relative z-10">
        <div className="flex items-center justify-between text-[10px] text-slate-500 font-semibold uppercase tracking-wider">
          <span className="flex items-center gap-1.5"><ClipboardCheck className="h-3.5 w-3.5 text-amber-500" /> Registro General de Pedidos</span>
          <span className="flex items-center gap-1"><Award className="h-3.5 w-3.5 text-amber-500" /> Control de Despachos</span>
        </div>

        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          totalItems={orders.length}
          itemsPerPage={ITEMS_PER_PAGE}
          itemLabel="pedidos"
        />
      </div>

      {selectedDispatchOrder && (
        <OrderDispatchDetailsModal
          order={selectedDispatchOrder}
          onClose={() => setSelectedDispatchOrder(null)}
        />
      )}
    </div>
  );
}

export default OrdersList;

