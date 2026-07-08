import { useState } from 'react';
import { ClipboardCheck, Truck, ShieldX, ShieldAlert, Award, Info, X } from 'lucide-react';
import type { Pedido } from '../../../shared/services/ordersService';
import { getErrorMessage } from '../../../shared/utils/errors';

interface OrdersListProps {
  orders: Pedido[];
  onAssignClick: (order: Pedido) => void;
  onCancelOrder: (id: string) => Promise<void>;
  isAdmin?: boolean;
}

const MATERIAL_LABELS: Record<string, string> = {
  'ARENA_FINA': 'Arena Fina',
  'ARENA_GRUESA': 'Arena Gruesa',
  'PIEDRA_1_2': 'Piedra Chancada de 1/2"',
  'PIEDRA_3_4': 'Piedra Chancada de 3/4"',
  'AFIRMADO': 'Afirmado Clasificado',
  'TIERRA_CHACRA': 'Tierra de Chacra'
};

export function OrdersList({ orders, onAssignClick, onCancelOrder, isAdmin = false }: OrdersListProps) {
  const [selectedDispatchOrder, setSelectedDispatchOrder] = useState<Pedido | null>(null);

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
      
      {/* Cabecera del Listado */}
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
              {orders.map((p) => (
                <tr key={p.id} className="hover:bg-slate-900/10 transition-colors">
                  
                  {/* Constructora / Cliente */}
                  <td className="py-3.5 px-4 font-bold text-slate-200">
                    {p.clienteNombre}
                  </td>
                  
                  {/* Material */}
                  <td className="py-3.5 px-4">
                    <span className="font-semibold text-slate-300">{MATERIAL_LABELS[p.material] || p.material}</span>
                  </td>
                  
                  {/* Volumen */}
                  <td className="py-3.5 px-4 font-mono font-bold text-amber-500">
                    {p.volumenM3} m³
                  </td>
                  
                  {/* Destino */}
                  <td className="py-3.5 px-4 text-slate-400 font-medium">
                    {p.destino}
                  </td>
                  
                  {/* Estado */}
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
                  
                  {/* Acciones */}
                  <td className="py-3.5 px-4 text-right">
                    <div className="flex items-center justify-end space-x-2">
                      
                      {/* Botón de Asignar (Solo visible para Admin si el pedido está PENDIENTE) */}
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
                      
                      {/* Botón de Cancelar (Visible si está PENDIENTE) */}
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

                      {/* Botón de Detalles del Despacho (Visible para pedidos despachados) */}
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

      {/* Footer del Listado */}
      <div className="p-4 border-t border-slate-900 bg-slate-950/20 flex items-center justify-between text-[10px] text-slate-500 font-semibold uppercase tracking-wider relative z-10">
        <span className="flex items-center gap-1.5"><ClipboardCheck className="h-3.5 w-3.5 text-amber-500" /> Registro General de Pedidos</span>
        <span className="flex items-center gap-1"><Award className="h-3.5 w-3.5 text-amber-500" /> Control de Despachos</span>
      </div>

      {/* Modal de Información de Despacho */}
      {selectedDispatchOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 relative max-w-sm w-full space-y-4 text-xs text-slate-300 animate-in zoom-in-95 duration-200">
            <button 
              type="button"
              onClick={() => setSelectedDispatchOrder(null)}
              className="absolute top-4 right-4 p-1.5 rounded-lg bg-slate-950 border border-slate-900 text-slate-400 hover:text-white active:scale-95 transition-all cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="flex items-center space-x-2 border-b border-slate-800 pb-3">
              <Truck className="text-amber-500 h-5 w-5" />
              <h4 className="text-sm font-bold text-white uppercase tracking-wider">
                Detalles del Despacho
              </h4>
            </div>

            <div className="space-y-4 py-1">
              {selectedDispatchOrder.vehiculoPlaca && (
                <div className="space-y-1.5">
                  <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider block">Volquete Asignado</span>
                  <div className="font-mono text-xs text-white font-bold flex items-center gap-1.5">
                    <span className="bg-amber-500/10 text-amber-500 px-1.5 py-0.5 rounded text-[9px] font-extrabold">PLACA</span>
                    <span>{selectedDispatchOrder.vehiculoPlaca}</span>
                  </div>
                  {(selectedDispatchOrder.vehiculoMarca || selectedDispatchOrder.vehiculoModelo) && (
                    <span className="text-[10px] text-slate-400 block font-semibold">
                      {selectedDispatchOrder.vehiculoMarca} {selectedDispatchOrder.vehiculoModelo}
                    </span>
                  )}
                </div>
              )}
              
              {selectedDispatchOrder.conductorNombre && (
                <div className="space-y-1.5 pt-4 border-t border-slate-850">
                  <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider block">Chofer Encargado</span>
                  <span className="text-white font-bold text-xs block">{selectedDispatchOrder.conductorNombre}</span>
                  {selectedDispatchOrder.conductorCelular && (
                    <div className="pt-1.5">
                      <a 
                        href={`https://wa.me/51${selectedDispatchOrder.conductorCelular}`} 
                        target="_blank" 
                        rel="noreferrer" 
                        className="inline-flex items-center gap-1.5 px-3 py-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20 rounded-xl font-bold transition-all text-[10.5px] cursor-pointer"
                        title="Contactar por WhatsApp"
                      >
                        <span>💬 WhatsApp:</span>
                        <span className="underline font-mono">{selectedDispatchOrder.conductorCelular}</span>
                      </a>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="pt-3">
              <button
                type="button"
                onClick={() => setSelectedDispatchOrder(null)}
                className="w-full py-2.5 rounded-xl bg-slate-950 border border-slate-850 text-slate-400 hover:text-white active:scale-95 transition-all font-semibold cursor-pointer text-xs"
              >
                Cerrar Ventana
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
export default OrdersList;
