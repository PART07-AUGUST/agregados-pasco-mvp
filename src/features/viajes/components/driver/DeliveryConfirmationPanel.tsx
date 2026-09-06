import { CheckCircle2, FileText, Eye, Loader2 } from 'lucide-react';

interface DeliveryConfirmationPanelProps {
  pesoEntradaDbTon: string | null;
  pesoSalidaDbTon: string | null;
  pesoNetoDbTon: string | null;
  ticketBalanzaUrl?: string;
  loading: boolean;
  onConfirmDelivery: () => void;
}

export function DeliveryConfirmationPanel({
  pesoEntradaDbTon,
  pesoSalidaDbTon,
  pesoNetoDbTon,
  ticketBalanzaUrl,
  loading,
  onConfirmDelivery,
}: DeliveryConfirmationPanelProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-1.5 text-xs font-bold text-emerald-400 border-b border-slate-800 pb-2">
        <CheckCircle2 className="h-4 w-4 text-emerald-400" />
        <span>Pesaje Registrado Exitosamente</span>
      </div>

      <div className="grid grid-cols-3 gap-2 bg-slate-950 p-3 rounded-2xl border border-slate-900 text-center font-mono">
        <div className="space-y-0.5">
          <span className="text-[8px] text-slate-500 uppercase font-bold tracking-wider block">Entrada</span>
          <span className="text-xs font-bold text-slate-200">{pesoEntradaDbTon || '--'} t</span>
        </div>
        <div className="space-y-0.5 border-x border-slate-900">
          <span className="text-[8px] text-slate-500 uppercase font-bold tracking-wider block">Tara/Salida</span>
          <span className="text-xs font-bold text-slate-200">{pesoSalidaDbTon || '--'} t</span>
        </div>
        <div className="space-y-0.5">
          <span className="text-[8px] text-slate-400 uppercase font-bold tracking-wider block">Neto Real</span>
          <span className="text-xs font-extrabold text-emerald-400">{pesoNetoDbTon || '--'} t</span>
        </div>
      </div>

      {ticketBalanzaUrl && (
        <div className="flex items-center justify-between p-3 bg-slate-950/60 border border-slate-850 rounded-xl text-xs">
          <div className="flex items-center space-x-2 text-slate-300">
            <FileText className="h-4 w-4 text-indigo-400 shrink-0" />
            <span className="text-[10px] font-bold">Ticket de Pesaje</span>
          </div>
          <a
            href={ticketBalanzaUrl}
            target="_blank"
            rel="noreferrer"
            className="px-2.5 py-1 rounded bg-slate-900 border border-slate-800 hover:bg-slate-800 text-[10px] text-amber-400 font-bold transition-all flex items-center gap-1 cursor-pointer"
          >
            <Eye className="h-3 w-3" /> Ver Foto
          </a>
        </div>
      )}

      <div className="p-3.5 bg-emerald-500/5 border border-emerald-500/10 rounded-xl text-[11px] text-slate-400 leading-normal">
        🚚 **Entrega en Obra**: Te encuentras en camino al destino. Al finalizar la descarga de los agregados en la obra acordada, presiona el botón verde de abajo para certificar la entrega, liberar la unidad y cerrar tu hoja de ruta.
      </div>

      <button
        onClick={onConfirmDelivery}
        disabled={loading}
        className="w-full py-3.5 bg-emerald-500 hover:bg-emerald-600 disabled:bg-emerald-600/35 text-slate-950 font-extrabold text-sm rounded-2xl flex items-center justify-center gap-2 transition-all active:scale-95 shadow-md shadow-emerald-500/5 cursor-pointer"
      >
        {loading ? <Loader2 className="h-4 w-4 animate-spin text-slate-950" /> : <CheckCircle2 className="h-4 w-4" />}
        <span>CONFIRMAR ENTREGA EN OBRA</span>
      </button>
    </div>
  );
}
