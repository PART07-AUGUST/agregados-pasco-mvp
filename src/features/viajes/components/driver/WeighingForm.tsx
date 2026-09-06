import type { ChangeEvent, FormEvent, RefObject } from 'react';
import { Scale, Camera, Upload, Loader2, Check } from 'lucide-react';

interface WeighingFormProps {
  pesoEntrada: string;
  pesoSalida: string;
  onPesoEntradaChange: (val: string) => void;
  onPesoSalidaChange: (val: string) => void;
  selectedFile: File | null;
  previewUrl: string | null;
  fileInputRef: RefObject<HTMLInputElement | null>;
  onPhotoChange: (e: ChangeEvent<HTMLInputElement>) => void;
  onClearPhoto: () => void;
  onSubmit: (e: FormEvent) => void;
  loading: boolean;
  uploadProgress: boolean;
}

export function WeighingForm({
  pesoEntrada,
  pesoSalida,
  onPesoEntradaChange,
  onPesoSalidaChange,
  selectedFile,
  previewUrl,
  fileInputRef,
  onPhotoChange,
  onClearPhoto,
  onSubmit,
  loading,
  uploadProgress,
}: WeighingFormProps) {
  return (
    <div className="space-y-4">
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="flex items-center space-x-1.5 text-xs font-bold text-slate-200 border-b border-slate-800 pb-2">
          <Scale className="h-4 w-4 text-indigo-400" />
          <span>Formulario de Pesaje en Balanza</span>
        </div>

        <p className="text-[10px] text-slate-400 leading-normal">
          Ingresa los pesos registrados por la balanza autorizada en toneladas e inmortaliza el ticket de pesaje mediante una fotografía.
        </p>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <label htmlFor="input-peso-entrada" className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Peso Entrada (t)
            </label>
            <input
              id="input-peso-entrada"
              type="number"
              step="0.01"
              placeholder="Ej. 26.40"
              value={pesoEntrada}
              onChange={(e) => onPesoEntradaChange(e.target.value)}
              required
              className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs font-mono focus:outline-none focus:border-indigo-500"
            />
          </div>
          <div className="space-y-1">
            <label htmlFor="input-peso-salida" className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Peso Salida (t)
            </label>
            <input
              id="input-peso-salida"
              type="number"
              step="0.01"
              placeholder="Ej. 10.20"
              value={pesoSalida}
              onChange={(e) => onPesoSalidaChange(e.target.value)}
              required
              className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs font-mono focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            Foto del Ticket Físico
          </label>

          <input
            type="file"
            accept="image/*"
            capture="environment"
            ref={fileInputRef}
            onChange={onPhotoChange}
            className="hidden"
          />

          {!previewUrl ? (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full py-6 border-2 border-dashed border-slate-800 hover:border-indigo-500 rounded-2xl bg-slate-950/40 flex flex-col items-center justify-center gap-2 group transition-all text-slate-400 hover:text-indigo-400 cursor-pointer"
            >
              <div className="p-2 bg-slate-900 rounded-full border border-slate-850 group-hover:bg-indigo-500/10">
                <Camera className="h-5 w-5 text-slate-400 group-hover:text-indigo-400" />
              </div>
              <span className="text-[10.5px] font-bold">Tomar Foto con Cámara</span>
              <span className="text-[9px] text-slate-500">Capture el ticket físico completo y nítido</span>
            </button>
          ) : (
            <div className="relative rounded-2xl overflow-hidden border border-slate-800 bg-slate-950 p-2 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <img
                  src={previewUrl}
                  alt="Previsualización de Ticket"
                  className="w-12 h-12 object-cover rounded-lg border border-slate-800 shrink-0"
                />
                <div className="text-left">
                  <span className="text-[10px] font-bold text-slate-200 block truncate max-w-[150px]">
                    {selectedFile?.name || 'ticket_camara.jpg'}
                  </span>
                  <span className="text-[9px] text-emerald-400 font-semibold flex items-center gap-0.5">
                    <Check className="h-3 w-3" /> Foto capturada
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={onClearPhoto}
                className="p-1.5 bg-slate-900 border border-slate-800 rounded-lg text-rose-400 hover:bg-rose-500/15 transition-all cursor-pointer mr-1"
              >
                Cambiar
              </button>
            </div>
          )}
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3.5 bg-indigo-500 hover:bg-indigo-600 disabled:bg-indigo-600/35 text-white font-extrabold text-sm rounded-2xl flex items-center justify-center gap-2 transition-all active:scale-95 shadow-md shadow-indigo-500/5 cursor-pointer mt-2"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Upload className="h-4 w-4" />
          )}
          <span>
            {uploadProgress ? 'SUBIENDO IMAGEN DEL TICKET...' : 'REGISTRAR PESOS Y AVANZAR'}
          </span>
        </button>
      </form>
    </div>
  );
}
