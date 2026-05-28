import { ClipboardCheck, Truck, ShieldX, ShieldAlert, Award } from 'lucide-react';
import type { Pedido } from '../../../shared/services/ordersService';

interface OrdersListProps {
  orders: Pedido[];
  onAssignClick: (order: Pedido) => void;
  onCancelOrder: (id: string) => Promise<void>;
  isAdmin?: boolean;
}

const MATERIAL_LABELS: Record<string, string> = {
  'ARENA_FINA': 'Arena Fina 🏜️',
  'ARENA_GRUESA': 'Arena Gruesa 🏜️',
  'PIEDRA_1_2': 'Piedra Chancada de 1/2" 🪨',
  'PIEDRA_3_4': 'Piedra Chancada de 3/4" 🪨',
  'AFIRMADO': 'Afirmado Clasificado 🛣️',
  'TIERRA_CHACRA': 'Tierra de Chacra ⛰️'
};

export function OrdersList({ orders, onAssignClick, onCancelOrder, isAdmin = false }: OrdersListProps) {
  
  const handleCancelClick = async (id: string) => {
    if (confirm('¿Estás seguro de que deseas cancelar este pedido? Esta acción no se puede deshacer.')) {
      try {
        await onCancelOrder(id);
      } catch (e: any) {
        alert(e.message || 'Error al cancelar pedido');
      }
    }
  };

  return (
    <div className="bg-slate-900/30 border border-slate-900 rounded-3xl overflow-hidden backdrop-blur-md">
      
      {/* Cabecera del Listado */}
      <div className="p-5 border-b border-slate-900 flex justify-between items-center">
        <div>
          <h4 className="text-sm font-bold text-white uppercase tracking-wider">Cartera de Pedidos Suministrados</h4>
          <p className="text-[10px] text-slate-500 mt-0.5">Historial de solicitudes de material de cantera y estado logístico</p>
        </div>
        <span className="px-2.5 py-1 rounded bg-slate-950 border border-slate-900 text-[10px] text-amber-500 font-mono font-bold">
          {orders.length} Pedidos
        </span>
      </div>

      {orders.length === 0 ? (
        <div className="p-12 text-center flex flex-col items-center justify-center space-y-2">
          <div className="p-3 bg-slate-900 border border-slate-800 rounded-2xl text-slate-600">
            <ShieldAlert className="h-8 w-8" />
          </div>
          <span className="text-xs font-bold text-slate-400">No hay pedidos registrados</span>
          <p className="text-[10px] text-slate-500 max-w-xs leading-normal">
            No se han registrado solicitudes de agregados en el sistema por el momento.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto text-xs">
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
                          onClick={() => onAssignClick(p)}
                          className="px-2.5 py-1.5 rounded-lg bg-amber-500 text-slate-950 font-bold hover:bg-amber-600 active:scale-95 transition-all cursor-pointer flex items-center gap-1 text-[10px]"
                          title="Asignar volquete de despacho"
                        >
                          <Truck className="h-3 w-3" />
                          <span>Despachar</span>
                        </button>
                      )}
                      
                      {/* Botón de Cancelar (Visible si está PENDIENTE) */}
                      {p.estado === 'PENDIENTE' && (
                        <button 
                          onClick={() => handleCancelClick(p.id)}
                          className="p-1.5 rounded-lg bg-slate-950 border border-slate-900 text-rose-500 hover:bg-rose-500/10 hover:border-rose-500/20 active:scale-95 transition-all cursor-pointer"
                          title="Cancelar pedido"
                        >
                          <ShieldX className="h-3.5 w-3.5" />
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
      <div className="p-4 border-t border-slate-900 bg-slate-950/20 flex items-center justify-between text-[10px] text-slate-500 font-semibold uppercase tracking-wider">
        <span className="flex items-center gap-1.5"><ClipboardCheck className="h-3.5 w-3.5 text-amber-500" /> Registro General de Pedidos</span>
        <span className="flex items-center gap-1"><Award className="h-3.5 w-3.5 text-amber-500" /> Control de Despachos</span>
      </div>

    </div>
  );
}
export default OrdersList;
