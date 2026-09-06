import { Layers, Plus, Trash2, Truck } from 'lucide-react';
import { MATERIAL_LABELS, MATERIAL_PRICES_PER_M3, type MaterialType } from '../../../../shared/constants/materials';
import type { Pedido } from '../../../../shared/services/ordersService';
import type { CalculatorMaterialItem } from '../../hooks/useFreightCalculator';

interface MaterialItemsListProps {
  materialList: CalculatorMaterialItem[];
  totalVolumenM3: number;
  totalTrips?: number;
  onAddMaterial: () => void;
  onRemoveMaterial: (id: string) => void;
  onUpdateMaterial: (id: string, field: 'material' | 'volumenM3', value: unknown) => void;
}

export function MaterialItemsList({
  materialList,
  totalVolumenM3,
  totalTrips,
  onAddMaterial,
  onRemoveMaterial,
  onUpdateMaterial,
}: MaterialItemsListProps) {
  return (
    <div className="p-4 bg-slate-950/80 rounded-2xl border border-slate-800/80 space-y-3">
      <div className="flex justify-between items-center">
        <label className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
          <Layers className="h-4 w-4 text-amber-500" />
          Materiales solicitados ({materialList.length})
        </label>
        <span className="text-[11px] text-amber-400 font-mono font-semibold">
          Volumen total: {totalVolumenM3} m³
        </span>
      </div>

      <div className="space-y-2.5 max-h-48 overflow-y-auto pr-1">
        {materialList.map((item, index) => (
          <div key={item.id} className="p-2.5 bg-slate-900 rounded-xl border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Ítem #{index + 1}
              </span>
              {materialList.length > 1 && (
                <button
                  type="button"
                  onClick={() => onRemoveMaterial(item.id)}
                  className="text-rose-400 hover:text-rose-300 p-1 rounded hover:bg-rose-500/10 transition-colors cursor-pointer"
                  title="Eliminar este material"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            <div className="grid grid-cols-12 gap-2">
              <div className="col-span-8">
                <select
                  aria-label={`Tipo de material ítem ${index + 1}`}
                  value={item.material}
                  onChange={(e) => onUpdateMaterial(item.id, 'material', e.target.value as Pedido['material'])}
                  className="w-full bg-slate-950 border border-slate-750 focus:border-amber-500 rounded-lg px-2.5 py-1.5 outline-none text-white text-xs font-medium cursor-pointer"
                >
                  {(Object.keys(MATERIAL_LABELS) as MaterialType[]).map((mat) => (
                    <option key={mat} value={mat}>
                      {MATERIAL_LABELS[mat]} (S/ {MATERIAL_PRICES_PER_M3[mat].toFixed(2)}/m³)
                    </option>
                  ))}
                </select>
              </div>

              <div className="col-span-4">
                <div className="relative">
                  <input
                    type="number"
                    min="1"
                    step="0.5"
                    aria-label={`Volumen en m3 ítem ${index + 1}`}
                    value={item.volumenM3}
                    onChange={(e) =>
                      onUpdateMaterial(item.id, 'volumenM3', Math.max(1, parseFloat(e.target.value) || 1))
                    }
                    className="w-full bg-slate-950 border border-slate-750 focus:border-amber-500 rounded-lg px-2.5 py-1.5 outline-none text-white text-xs font-mono pr-6 text-right"
                  />
                  <span className="absolute right-1.5 top-2 text-[9px] text-slate-500 pointer-events-none">m³</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={onAddMaterial}
        className="w-full py-2 bg-slate-900 hover:bg-slate-850 border border-dashed border-slate-750 hover:border-amber-500/50 text-slate-300 hover:text-amber-400 rounded-xl font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer text-xs"
      >
        <Plus className="h-3.5 w-3.5 text-amber-500" />
        <span>+ Agregar otro tipo de material a la orden</span>
      </button>

      <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono bg-slate-900/60 px-3 py-1.5 rounded-lg border border-slate-800">
        <span className="flex items-center gap-1">
          <Truck className="h-3.5 w-3.5 text-amber-500" />
          Volquetes necesarios:
        </span>
        <span className="text-amber-400 font-bold">
          🚛 {totalTrips ?? Math.max(1, Math.ceil(totalVolumenM3 / 15))} viaje(s) de volquete (15 m³)
        </span>
      </div>
    </div>
  );
}
