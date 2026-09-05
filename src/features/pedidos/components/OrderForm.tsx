import { useState, useEffect, type FormEvent } from 'react';
import { 
  ClipboardList, 
  Save, 
  AlertCircle, 
  Users, 
  X, 
  CheckCircle2, 
  MessageSquare, 
  Copy, 
  ExternalLink,
  MapPin,
  Sparkles,
  Truck,
  Plus,
  Trash2
} from 'lucide-react';
import { ordersService } from '../../../shared/services/ordersService';
import type { Pedido } from '../../../shared/services/ordersService';
import { supabase } from '../../../shared/services/supabase';
import { useAuthStore } from '../../../shared/stores/useAuthStore';
import { getErrorMessage } from '../../../shared/utils/errors';
import { FreightCalculatorModal } from './FreightCalculatorModal';
import type { RouteCalculationResult } from '../../../shared/services/freightService';

interface OrderFormProps {
  onSuccess: () => void;
  onCancel: () => void;
  initialDestino?: string;
  initialItems?: OrderMaterialItem[];
  initialQuote?: RouteCalculationResult | null;
}

interface ClienteOption {
  id: string;
  nombre: string;
}

export interface OrderMaterialItem {
  id: string;
  material: Pedido['material'];
  volumenM3: number | '';
}

const MATERIAL_OPTIONS: Array<{ value: Pedido['material']; label: string }> = [
  { value: 'ARENA_FINA', label: 'Arena Fina' },
  { value: 'ARENA_GRUESA', label: 'Arena Gruesa' },
  { value: 'PIEDRA_1_2', label: 'Piedra Chancada de 1/2"' },
  { value: 'PIEDRA_3_4', label: 'Piedra Chancada de 3/4"' },
  { value: 'AFIRMADO', label: 'Afirmado Clasificado' },
  { value: 'TIERRA_CHACRA', label: 'Tierra de Chacra' }
];

export function OrderForm({
  onSuccess,
  onCancel,
  initialDestino = '',
  initialItems,
  initialQuote = null,
}: OrderFormProps) {
  const { user } = useAuthStore();
  const [clienteId, setClienteId] = useState('');
  
  // Soporte para Múltiples Materiales en una sola orden / obra
  const [items, setItems] = useState<OrderMaterialItem[]>(() => {
    if (initialItems && initialItems.length > 0) {
      return initialItems;
    }
    return [{ id: '1', material: 'ARENA_FINA', volumenM3: '' }];
  });

  const [destino, setDestino] = useState(initialDestino);

  // Estado para la calculadora de fletes
  const [isFreightModalOpen, setIsFreightModalOpen] = useState(false);
  const [freightQuote, setFreightQuote] = useState<RouteCalculationResult | null>(initialQuote);

  const [clientes, setClientes] = useState<ClienteOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Estados para el flujo de éxito y pago del cliente
  const [createdOrder, setCreatedOrder] = useState<Pedido | null>(null);
  const [copied, setCopied] = useState(false);

  const isAdmin = user?.rol === 'ADMINISTRADOR';
  const effectiveClienteId = isAdmin ? clienteId : (user?.id ?? '');

  // Operaciones de Ítems de Material
  const handleAddItem = () => {
    setItems((prev) => [
      ...prev,
      { id: String(Date.now()), material: 'PIEDRA_1_2', volumenM3: '' },
    ]);
  };

  const handleRemoveItem = (id: string) => {
    if (items.length <= 1) return;
    setItems((prev) => prev.filter((i) => i.id !== id));
    setFreightQuote(null);
  };

  const handleItemChange = (id: string, field: 'material' | 'volumenM3', value: unknown) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: value } : item))
    );
    setFreightQuote(null);
  };

  const totalVolumenM3 = items.reduce((acc, curr) => acc + (Number(curr.volumenM3) || 0), 0);
  const estimatedTrips = Math.max(
    1,
    items.reduce((acc, curr) => acc + Math.max(1, Math.ceil((Number(curr.volumenM3) || 0) / 15)), 0)
  );

  useEffect(() => {
    let isSubscribed = true;

    // Si somos Administrador, cargamos la lista de constructoras/clientes para registrar pedidos
    if (isAdmin) {
      async function loadClientes() {
        try {
          const { data, error: err } = await supabase
            .from('usuarios')
            .select('id, nombre')
            .eq('rol', 'CLIENTE')
            .order('nombre', { ascending: true });

          if (err) throw err;
          if (isSubscribed) {
            setClientes(data || []);
          }
        } catch (error: unknown) {
          console.error('Error al cargar clientes:', error);
        }
      }
      loadClientes();
    }

    return () => {
      isSubscribed = false;
    };
  }, [isAdmin]);

  const handleApplyFreightQuote = (params: {
    destino: string;
    volumenM3: number;
    material: Pedido['material'];
    materials?: Array<{ material: Pedido['material']; volumenM3: number }>;
    quote: RouteCalculationResult;
  }) => {
    setDestino(params.destino);
    if (params.materials && params.materials.length > 0) {
      setItems(
        params.materials.map((m, idx) => ({
          id: String(idx + 1),
          material: m.material,
          volumenM3: m.volumenM3,
        }))
      );
    } else {
      setItems([
        { id: '1', material: params.material, volumenM3: params.volumenM3 },
      ]);
    }
    setFreightQuote(params.quote);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    // 1. Validaciones
    if (!effectiveClienteId || !destino.trim()) {
      setError('Por favor, completa el cliente y la dirección de entrega.');
      return;
    }

    if (items.some((it) => it.volumenM3 === '' || Number(it.volumenM3) <= 0)) {
      setError('Por favor, indica un volumen mayor a cero para todos los materiales solicitados.');
      return;
    }

    setLoading(true);
    try {
      // Cada material genera su correspondiente despacho/viaje de volquete de forma concurrente
      const createdOrders = await Promise.all(
        items.map((item) =>
          ordersService.createOrder({
            clienteId: effectiveClienteId,
            material: item.material,
            volumenM3: Number(item.volumenM3),
            destino: destino.trim(),
          })
        )
      );

      if (!isAdmin) {
        setCreatedOrder(createdOrders[0]);
      } else {
        onSuccess();
      }
    } catch (error: unknown) {
      console.error('Error al crear pedido:', error);
      setError(getErrorMessage(error, 'Ocurrió un error al guardar tu pedido.'));
    } finally {
      setLoading(false);
    }
  };

  if (createdOrder) {
    const materialLabel = MATERIAL_OPTIONS.find(m => m.value === createdOrder.material)?.label || createdOrder.material;
    const totalMsg = freightQuote ? ` Total estimado: S/ ${freightQuote.grandTotal.toFixed(2)} (inc. flete de ${freightQuote.distanceKm} km).` : '';
    const waText = `Hola, adjunto el comprobante de pago para mi pedido de ${materialLabel} por ${createdOrder.volumenM3} m³ con destino a ${createdOrder.destino}.${totalMsg} ID de Pedido: ${createdOrder.id}`;
    const waUrl = `https://wa.me/51958292145?text=${encodeURIComponent(waText)}`;

    return (
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 relative text-xs">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-2xl flex items-center justify-center mx-auto">
            <CheckCircle2 className="h-6 w-6" />
          </div>
          <div>
            <h4 className="text-base font-bold text-white uppercase tracking-wider">¡Solicitud Registrada con Éxito!</h4>
            <p className="text-slate-400 mt-1">Tu pedido de agregado ha sido creado y está pendiente de confirmación de pago.</p>
          </div>

          {/* Tarjeta de Pago Interbank */}
          <div className="bg-slate-950 border border-slate-800/80 rounded-2xl p-4 text-left space-y-3">
            <div className="flex justify-between items-center border-b border-slate-800 pb-2">
              <span className="font-bold text-amber-400 uppercase tracking-wider text-[11px]">Instrucciones de Pago</span>
              <span className="text-[10px] text-slate-500 font-mono">Cta. Ahorros Soles</span>
            </div>
            
            <div className="space-y-1">
              <span className="text-[10px] text-slate-400">Banco Interbank:</span>
              <div className="flex items-center justify-between bg-slate-900 p-2 rounded-xl border border-slate-800">
                <span className="font-mono text-white font-bold tracking-wider">898 3373516599</span>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText('8983373516599');
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                  }}
                  className="text-amber-400 hover:text-amber-300 p-1 flex items-center gap-1 text-[10px] font-semibold cursor-pointer"
                >
                  <Copy className="h-3.5 w-3.5" />
                  <span>{copied ? '¡Copiado!' : 'Copiar'}</span>
                </button>
              </div>
            </div>

            <div className="text-[10px] text-slate-400">
              Titular: <strong className="text-slate-200">Paolo Valentino Ramirez Alanya</strong>
            </div>

            <p className="text-[10px] text-slate-500 italic">
              * Una vez realizada la transferencia o depósito, envía la captura del voucher por WhatsApp para asignar volquete.
            </p>
          </div>

          <div className="flex flex-col gap-2 pt-2">
            <a
              href={waUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-3 rounded-xl bg-emerald-500 text-slate-950 font-bold hover:bg-emerald-400 active:scale-95 transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20"
            >
              <MessageSquare className="h-4 w-4" />
              <span>Enviar Comprobante por WhatsApp</span>
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </div>

          <button
            type="button"
            onClick={onSuccess}
            className="w-full py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-400 font-semibold hover:text-white transition-all cursor-pointer"
          >
            Volver al Panel Principal
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 relative">
        <button 
          type="button"
          onClick={onCancel}
          aria-label="Cerrar formulario de pedido"
          className="absolute top-4 right-4 p-1.5 rounded-lg bg-slate-950 border border-slate-900 text-slate-400 hover:text-white active:scale-95 transition-all cursor-pointer"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="space-y-4">
          {/* Cabecera del Formulario (Limpia y sin redundancia) */}
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center space-x-2">
              <ClipboardList className="text-amber-500 h-5 w-5" />
              <h4 className="text-sm font-bold text-white uppercase tracking-wider">
                {isAdmin ? 'Registrar Pedido de Material' : 'Solicitar Agregado'}
              </h4>
            </div>
          </div>

          {/* Mensaje de Error */}
          {error && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl text-xs flex items-start space-x-2">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            
            {/* Asignar Cliente (Solo visible si es Admin) */}
            {isAdmin ? (
              <div className="space-y-1">
                <label htmlFor="cliente-select" className="font-semibold text-slate-400 flex justify-between">
                  <span>Empresa / Constructora Cliente *</span>
                  <span className="text-[10px] text-slate-500 flex items-center gap-0.5"><Users className="h-3 w-3" /> Solo rol Cliente</span>
                </label>
                <select 
                  id="cliente-select"
                  aria-label="Empresa o constructora cliente"
                  value={clienteId}
                  onChange={(e) => setClienteId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl px-3 py-2.5 outline-none text-white text-xs cursor-pointer"
                >
                  <option value="">Selecciona constructora...</option>
                  {clientes.map((c) => (
                    <option key={c.id} value={c.id}>{c.nombre}</option>
                  ))}
                </select>
              </div>
            ) : (
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-900 text-[11px] text-slate-400">
                <span className="font-bold text-slate-300">Cliente Solicitante:</span> {user?.nombre}
              </div>
            )}

            {/* SECCIÓN MULTI-MATERIAL: Permite llevar uno o más materiales para la misma obra */}
            <div className="space-y-2.5">
              <div className="flex justify-between items-center">
                <label className="font-semibold text-slate-400">Material(es) de Agregado *</label>
                {totalVolumenM3 > 0 && (
                  <span className="text-[11px] text-amber-400 font-mono font-bold flex items-center gap-1">
                    <Truck className="h-3.5 w-3.5 text-amber-500" />
                    Total: {totalVolumenM3} m³ (~{estimatedTrips} viaje{estimatedTrips > 1 ? 's' : ''})
                  </span>
                )}
              </div>

              <div className="space-y-2">
                {items.map((item, index) => (
                  <div key={item.id} className="p-3 bg-slate-950 rounded-2xl border border-slate-800/80 space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-bold text-slate-500 uppercase">
                        Ítem #{index + 1}
                      </span>
                      {items.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(item.id)}
                          aria-label={`Eliminar ítem ${index + 1}`}
                          className="text-rose-400 hover:text-rose-300 p-0.5 rounded cursor-pointer transition-colors"
                          title="Eliminar este material"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                      <div className="sm:col-span-8">
                        <select 
                          aria-label={`Tipo de material ítem ${index + 1}`}
                          value={item.material}
                          onChange={(e) => handleItemChange(item.id, 'material', e.target.value as Pedido['material'])}
                          className="w-full bg-slate-900 border border-slate-800 focus:border-amber-500 rounded-xl px-3 py-2 outline-none text-white text-xs cursor-pointer"
                        >
                          {MATERIAL_OPTIONS.map((m) => (
                            <option key={m.value} value={m.value}>{m.label}</option>
                          ))}
                        </select>
                      </div>

                      <div className="sm:col-span-4 relative">
                        <input 
                          type="number" 
                          step="0.5"
                          min="1"
                          aria-label={`Volumen en m3 ítem ${index + 1}`}
                          value={item.volumenM3}
                          onChange={(e) => handleItemChange(item.id, 'volumenM3', e.target.value !== '' ? parseFloat(e.target.value) : '')}
                          placeholder="Volumen m³"
                          className="w-full bg-slate-900 border border-slate-800 focus:border-amber-500 rounded-xl px-3 py-2 outline-none text-white text-xs font-mono pr-7"
                        />
                        <span className="absolute right-2.5 top-2.5 text-[10px] text-slate-500 pointer-events-none">m³</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Botón para agregar más materiales */}
              <button
                type="button"
                onClick={handleAddItem}
                className="w-full py-2 bg-slate-950 hover:bg-slate-900 border border-dashed border-slate-800 hover:border-amber-500/40 text-slate-400 hover:text-amber-400 rounded-xl font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer text-xs"
              >
                <Plus className="h-3.5 w-3.5 text-amber-500" />
                <span>+ Agregar otro material (Arena, Piedra, Afirmado...)</span>
              </button>
            </div>

            {/* Destino con un ÚNICO botón integrado hacia el Mapa (Sin redundancia) */}
            <div className="space-y-1">
              <label htmlFor="destino-obra-input" className="font-semibold text-slate-400">Destino de Entrega (Obra / Dirección) *</label>
              <div className="flex gap-2">
                <input 
                  id="destino-obra-input"
                  aria-label="Destino de entrega en obra"
                  type="text" 
                  value={destino}
                  onChange={(e) => {
                    setDestino(e.target.value);
                    setError(null);
                  }}
                  placeholder="Ej. Yanacancha - San Juan (Multifamiliar Lote 14) o Tarma"
                  className="flex-1 bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl px-3 py-2.5 outline-none text-white text-xs"
                />
                <button
                  type="button"
                  onClick={() => setIsFreightModalOpen(true)}
                  aria-label="Simular flete y ruta en mapa satelital"
                  className="px-3 py-2.5 bg-slate-950 hover:bg-slate-900 border border-slate-800 hover:border-amber-500/50 text-amber-400 rounded-xl flex items-center gap-1.5 cursor-pointer transition-all text-xs font-semibold shrink-0"
                  title="Simular flete y ruta en mapa satelital"
                >
                  <MapPin className="h-4 w-4 text-amber-500" />
                  <span>Mapa</span>
                </button>
              </div>
            </div>

            {/* Badge de Resumen de Flete si fue calculado */}
            {freightQuote && (
              <div className="p-3.5 bg-slate-950 border border-amber-500/30 rounded-2xl space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1">
                    <Sparkles className="h-3 w-3" /> Cotización Oficial ({freightQuote.quarry.name})
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {freightQuote.distanceKm} km (~{freightQuote.durationMinutes} min)
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center text-[10px] font-mono">
                  <div className="bg-slate-900 p-1.5 rounded-lg border border-slate-850">
                    <span className="text-slate-500 block text-[8px]">MATERIALES</span>
                    <span className="text-white font-bold">S/ {freightQuote.materialTotal.toFixed(2)}</span>
                  </div>
                  <div className="bg-slate-900 p-1.5 rounded-lg border border-slate-850">
                    <span className="text-slate-500 block text-[8px]">FLETE ({freightQuote.totalTrips ?? 1} VIAJE{((freightQuote.totalTrips ?? 1) > 1) ? 'S' : ''})</span>
                    <span className="text-white font-bold">S/ {freightQuote.freightTotal.toFixed(2)}</span>
                  </div>
                  <div className="bg-amber-500/15 p-1.5 rounded-lg border border-amber-500/30">
                    <span className="text-amber-400 block text-[8px] font-bold">TOTAL ESTIMADO</span>
                    <span className="text-amber-400 font-bold">S/ {freightQuote.grandTotal.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Botones de acción */}
            <div className="flex gap-3 pt-2">
              <button 
                type="button" 
                onClick={onCancel}
                className="flex-1 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 font-semibold hover:bg-slate-900 active:scale-95 transition-all cursor-pointer"
              >
                Cancelar
              </button>
              <button 
                type="submit" 
                disabled={loading}
                className="flex-1 py-2.5 rounded-xl bg-amber-500 text-amber-950 font-bold hover:bg-amber-600 active:scale-95 transition-all shadow-md shadow-amber-500/10 cursor-pointer flex items-center justify-center gap-1"
              >
                <Save className="h-3.5 w-3.5" />
                <span>{loading ? 'Procesando...' : (items.length > 1 ? `Guardar ${items.length} Pedidos` : 'Guardar Pedido')}</span>
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Modal de Cálculo de Flete */}
      <FreightCalculatorModal
        isOpen={isFreightModalOpen}
        onClose={() => setIsFreightModalOpen(false)}
        initialMaterial={items[0]?.material || 'ARENA_FINA'}
        initialVolumenM3={Number(items[0]?.volumenM3) || 15}
        initialMaterials={items.reduce<Array<{ material: Pedido['material']; volumenM3: number }>>((acc, it) => {
          const vol = Number(it.volumenM3);
          if (vol > 0) acc.push({ material: it.material, volumenM3: vol });
          return acc;
        }, [])}
        initialDestino={destino}
        onApply={handleApplyFreightQuote}
      />
    </>
  );
}
