import { useState, useEffect, type FormEvent } from 'react';
import { ClipboardList, Save, AlertCircle, Users, X } from 'lucide-react';
import { ordersService } from '../../../shared/services/ordersService';
import { supabase } from '../../../shared/services/supabase';
import { useAuthStore } from '../../../shared/stores/useAuthStore';

interface OrderFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

interface ClienteOption {
  id: string;
  nombre: string;
}

const MATERIAL_OPTIONS = [
  { value: 'ARENA_FINA', label: 'Arena Fina' },
  { value: 'ARENA_GRUESA', label: 'Arena Gruesa' },
  { value: 'PIEDRA_1_2', label: 'Piedra Chancada de 1/2"' },
  { value: 'PIEDRA_3_4', label: 'Piedra Chancada de 3/4"' },
  { value: 'AFIRMADO', label: 'Afirmado Clasificado' },
  { value: 'TIERRA_CHACRA', label: 'Tierra de Chacra' }
];

export function OrderForm({ onSuccess, onCancel }: OrderFormProps) {
  const { user } = useAuthStore();
  const [clienteId, setClienteId] = useState('');
  const [material, setMaterial] = useState<any>('ARENA_FINA');
  const [volumenM3, setVolumenM3] = useState<number | ''>('');
  const [destino, setDestino] = useState('');

  const [clientes, setClientes] = useState<ClienteOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isAdmin = user?.rol === 'ADMINISTRADOR';

  useEffect(() => {
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
          setClientes(data || []);
        } catch (e: any) {
          console.error('Error al cargar clientes:', e);
        }
      }
      loadClientes();
    } else if (user) {
      // Si somos clientes, automáticamente nos asignamos
      setClienteId(user.id);
    }
  }, [isAdmin, user]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    // 1. Validaciones
    if (!clienteId || !material || volumenM3 === '' || !destino.trim()) {
      setError('Por favor, completa todos los campos obligatorios.');
      return;
    }

    if (Number(volumenM3) <= 0) {
      setError('El volumen en metros cúbicos debe ser mayor a cero.');
      return;
    }

    setLoading(true);
    try {
      await ordersService.createOrder({
        clienteId,
        material,
        volumenM3: Number(volumenM3),
        destino: destino.trim()
      });

      onSuccess();
    } catch (err: any) {
      console.error('Error al crear pedido:', err);
      setError(err.message || 'Ocurrió un error al guardar tu pedido.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 relative">
      <button 
        onClick={onCancel}
        className="absolute top-4 right-4 p-1.5 rounded-lg bg-slate-950 border border-slate-900 text-slate-400 hover:text-white active:scale-95 transition-all cursor-pointer"
      >
        <X className="h-4 w-4" />
      </button>

      <div className="space-y-4">
        {/* Cabecera del Formulario */}
        <div className="flex items-center space-x-2 border-b border-slate-800 pb-3">
          <ClipboardList className="text-amber-500 h-5 w-5" />
          <h4 className="text-sm font-bold text-white uppercase tracking-wider">
            {isAdmin ? 'Registrar Pedido de Material' : 'Solicitar Agregado'}
          </h4>
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
              <label className="font-semibold text-slate-400 flex justify-between">
                <span>Empresa / Constructora Cliente *</span>
                <span className="text-[10px] text-slate-500 flex items-center gap-0.5"><Users className="h-3 w-3" /> Solo rol Cliente</span>
              </label>
              <select 
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Selector de Material */}
            <div className="space-y-1">
              <label className="font-semibold text-slate-400">Material Agregado *</label>
              <select 
                value={material}
                onChange={(e) => setMaterial(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl px-3 py-2.5 outline-none text-white text-xs cursor-pointer"
              >
                {MATERIAL_OPTIONS.map((m) => (
                  <option key={m.value} value={m.value}>{m.label}</option>
                ))}
              </select>
            </div>

            {/* Volumen */}
            <div className="space-y-1">
              <label className="font-semibold text-slate-400">Volumen Requerido (m³) *</label>
              <input 
                type="number" 
                step="0.5"
                value={volumenM3}
                onChange={(e) => {
                  setVolumenM3(e.target.value !== '' ? parseFloat(e.target.value) : '');
                  setError(null);
                }}
                placeholder="Ej. 25"
                className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl px-3 py-2.5 outline-none text-white text-xs font-mono"
              />
            </div>
          </div>

          {/* Destino */}
          <div className="space-y-1">
            <label className="font-semibold text-slate-400">Destino de Entrega (Obra / Dirección) *</label>
            <input 
              type="text" 
              value={destino}
              onChange={(e) => {
                setDestino(e.target.value);
                setError(null);
              }}
              placeholder="Ej. Construcción Multifamiliar Yanacancha - Lote 14"
              className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl px-3 py-2.5 outline-none text-white text-xs"
            />
          </div>

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
              className="flex-1 py-2.5 rounded-xl bg-amber-500 text-slate-950 font-bold hover:bg-amber-600 active:scale-95 transition-all shadow-md shadow-amber-500/10 cursor-pointer flex items-center justify-center gap-1"
            >
              <Save className="h-3.5 w-3.5" />
              <span>{loading ? 'Procesando...' : 'Guardar Pedido'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
