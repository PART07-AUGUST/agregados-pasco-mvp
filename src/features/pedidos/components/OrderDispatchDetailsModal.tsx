import { Truck } from 'lucide-react';
import type { Pedido } from '../../../shared/services/ordersService';
import { ModalContainer } from '../../../shared/components/ModalContainer';

interface OrderDispatchDetailsModalProps {
  order: Pedido;
  onClose: () => void;
}

export function OrderDispatchDetailsModal({ order, onClose }: OrderDispatchDetailsModalProps) {
  return (
    <ModalContainer
      isOpen={true}
      onClose={onClose}
      title="Detalles del Despacho"
      icon={<Truck className="text-amber-500 h-5 w-5" />}
      maxWidth="sm"
    >
      <div className="space-y-4 py-1 text-xs text-slate-300">
        {order.vehiculoPlaca && (
          <div className="space-y-1.5">
            <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider block">
              Volquete Asignado
            </span>
            <div className="font-mono text-xs text-white font-bold flex items-center gap-1.5">
              <span className="bg-amber-500/10 text-amber-500 px-1.5 py-0.5 rounded text-[9px] font-extrabold">
                PLACA
              </span>
              <span>{order.vehiculoPlaca}</span>
            </div>
            {(order.vehiculoMarca || order.vehiculoModelo) && (
              <span className="text-[10px] text-slate-400 block font-semibold">
                {order.vehiculoMarca} {order.vehiculoModelo}
              </span>
            )}
          </div>
        )}

        {order.conductorNombre && (
          <div className="space-y-1.5 pt-4 border-t border-slate-800">
            <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider block">
              Chofer Encargado
            </span>
            <span className="text-white font-bold text-xs block">{order.conductorNombre}</span>
            {order.conductorCelular && (
              <div className="pt-1.5">
                <a
                  href={`https://wa.me/51${order.conductorCelular}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20 rounded-xl font-bold transition-[color,background-color,border-color,opacity,transform,box-shadow] text-[10.5px] cursor-pointer"
                  title="Contactar por WhatsApp"
                >
                  <span>💬 WhatsApp:</span>
                  <span className="underline font-mono">{order.conductorCelular}</span>
                </a>
              </div>
            )}
          </div>
        )}

        <div className="pt-3">
          <button
            type="button"
            onClick={onClose}
            className="w-full py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-400 hover:text-white active:scale-95 transition-[color,background-color,border-color,opacity,transform,box-shadow] font-semibold cursor-pointer text-xs"
          >
            Cerrar Ventana
          </button>
        </div>
      </div>
    </ModalContainer>
  );
}

export default OrderDispatchDetailsModal;
