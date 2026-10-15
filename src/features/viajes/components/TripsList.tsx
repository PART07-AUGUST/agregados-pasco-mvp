import { useState } from 'react';
import { Scale, Activity } from 'lucide-react';
import type { ViajeDetallado } from '../../../shared/services/tripsService';
import { getMaterialLabel } from '../../../shared/constants/materials';
import { Pagination } from '../../../shared/components/Pagination';

interface TripsListProps {
  trips: ViajeDetallado[];
}

const ITEMS_PER_PAGE = 10;

export function TripsList({ trips }: TripsListProps) {
  const [currentPage, setCurrentPage] = useState(1);

  const totalPages = Math.ceil(trips.length / ITEMS_PER_PAGE) || 1;
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = Math.min(startIndex + ITEMS_PER_PAGE, trips.length);
  const currentTrips = trips.slice(startIndex, endIndex);

  return (
    <div className="bg-slate-900/30 border border-slate-900 rounded-3xl overflow-hidden">
      <div className="p-5 border-b border-slate-900 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h4 className="text-sm font-bold text-white uppercase tracking-wider">
            Despachos en Curso y Tránsito
          </h4>
          <p className="text-[10px] text-slate-500 mt-0.5">
            Seguimiento de pesaje de balanza y entrega final del material en Pasco
          </p>
        </div>

        {trips.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-slate-400 font-mono bg-slate-950/60 border border-slate-800 px-3 py-1 rounded-full">
              Página <strong className="text-amber-400">{currentPage}</strong> de <strong className="text-slate-200">{totalPages}</strong> ({trips.length} viajes)
            </span>
          </div>
        )}
      </div>

      {trips.length === 0 ? (
        <div className="p-12 text-center text-slate-500 text-xs">
          No hay viajes o despachos programados para hoy. Ve a "Pedidos de Obra" para despachar un volquete.
        </div>
      ) : (
        <div className="overflow-x-auto text-xs">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-900 text-slate-500 font-bold uppercase tracking-wider text-[10px] bg-slate-950/20">
                <th className="py-3 px-4">Código / Placa</th>
                <th className="py-3 px-4">Conductor</th>
                <th className="py-3 px-4">Detalles Material</th>
                <th className="py-3 px-4">Ruta / Destino</th>
                <th className="py-3 px-4">Pesaje Entrada</th>
                <th className="py-3 px-4">Pesaje Salida</th>
                <th className="py-3 px-4">Diésel Est. (ML)</th>
                <th className="py-3 px-4">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-900/60 text-slate-300">
              {currentTrips.map((t) => (
                <tr key={t.id} className="hover:bg-slate-900/10 transition-colors">
                  <td className="py-3.5 px-4 font-mono">
                    <span className="text-slate-500 block text-[9px]">ID: {t.id.substring(0, 8).toUpperCase()}</span>
                    <span className="font-bold text-amber-500 tracking-wider">{t.placa}</span>
                  </td>
                  <td className="py-3.5 px-4 font-semibold text-slate-200">
                    {t.conductorNombre}
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="font-bold text-slate-200 block">
                      {t.material ? getMaterialLabel(t.material) : '--'}
                    </span>
                    <span className="text-slate-500 text-[10px]">{t.volumenM3} m³</span>
                  </td>
                  <td className="py-3.5 px-4 text-slate-400 font-medium max-w-[200px]">
                    <span className="text-slate-200 font-semibold block truncate">{t.destino}</span>
                    <span className="text-[10px] text-slate-500 flex items-center gap-1">
                      {t.canteraOrigen && <span>De: {t.canteraOrigen}</span>}
                      {t.distanciaKm != null && <span>• {t.distanciaKm} km</span>}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 font-mono text-slate-400">
                    {t.pesoEntradaKg ? `${(t.pesoEntradaKg / 1000).toFixed(2)} t` : '--'}
                  </td>
                  <td className="py-3.5 px-4 font-mono text-slate-400">
                    {t.pesoSalidaKg ? `${(t.pesoSalidaKg / 1000).toFixed(2)} t` : '--'}
                  </td>
                  <td className="py-3.5 px-4 font-mono">
                    {t.consumoDieselEstimado != null ? (
                      <div>
                        <span className="text-amber-400 font-bold block">{t.consumoDieselEstimado} gal</span>
                        <span className="text-[9px] text-slate-500">S/ {(t.consumoDieselEstimado * 17.5).toFixed(1)}</span>
                      </div>
                    ) : (
                      <span className="text-slate-600">--</span>
                    )}
                  </td>
                  <td className="py-3.5 px-4">
                    <span
                      className={`px-2 py-0.5 rounded font-mono text-[9px] font-bold ${
                        t.estado === 'PENDIENTE'
                          ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                          : t.estado === 'EN_CAMINO'
                          ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                          : t.estado === 'EN_BALANZA'
                          ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex items-center gap-0.5 w-max'
                          : t.estado === 'ENTREGADO'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : 'bg-slate-950 text-slate-600 border border-slate-900'
                      }`}
                    >
                      {t.estado === 'EN_BALANZA' && <Scale className="h-3 w-3 inline text-amber-500" />}
                      <span>{t.estado}</span>
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="p-4 border-t border-slate-900 bg-slate-950/40 flex flex-col gap-3">
        <div className="flex items-center gap-1.5 text-[10px] text-slate-500 font-semibold uppercase tracking-wider">
          <Activity className="h-3.5 w-3.5 text-amber-500" /> Monitoreo de Despacho Logístico
        </div>

        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          totalItems={trips.length}
          itemsPerPage={ITEMS_PER_PAGE}
          itemLabel="viajes"
        />
      </div>
    </div>
  );
}

export default TripsList;



