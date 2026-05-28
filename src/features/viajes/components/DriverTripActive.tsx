import { useState, useRef } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import { 
  Truck, 
  Scale, 
  CheckCircle2, 
  Camera, 
  Upload, 
  AlertTriangle, 
  Loader2, 
  MapPin, 
  FileText,
  Eye,
  Check
} from 'lucide-react';
import type { ViajeDetallado } from '../../../shared/services/tripsService';
import { tripsService } from '../../../shared/services/tripsService';
import { storageService } from '../../../shared/services/storageService';

interface DriverTripActiveProps {
  trip: ViajeDetallado;
  onRefresh: () => void | Promise<void>;
}

export function DriverTripActive({ trip, onRefresh }: DriverTripActiveProps) {
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  // Estados para el formulario de pesaje
  const [pesoEntrada, setPesoEntrada] = useState<string>('');
  const [pesoSalida, setPesoSalida] = useState<string>('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<boolean>(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Iniciar el viaje (Cambiar de PENDIENTE a EN_CAMINO)
  const handleStartTrip = async () => {
    setLoading(true);
    setError(null);
    try {
      await tripsService.updateTripState(trip.id, 'EN_CAMINO');
      await onRefresh();
    } catch (err: any) {
      console.error('Error al iniciar viaje:', err);
      setError(err.message || 'No se pudo iniciar el viaje. Verifica tu conexión.');
    } finally {
      setLoading(false);
    }
  };

  // Manejar cambio de foto de ticket
  const handlePhotoChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      setSelectedFile(file);
      
      // Crear URL local para previsualizar la foto antes de subirla
      const objectUrl = URL.createObjectURL(file);
      setPreviewUrl(objectUrl);
    }
  };

  // Enviar formulario de pesaje a Balanza (RPC registrar_ticket_balanza)
  const handleRegisterWeighing = async (e: FormEvent) => {
    e.preventDefault();
    if (!pesoEntrada || !pesoSalida) {
      setError('Por favor, ingresa los pesos de entrada y salida.');
      return;
    }

    const pEntradaVal = parseFloat(pesoEntrada);
    const pSalidaVal = parseFloat(pesoSalida);

    if (isNaN(pEntradaVal) || pEntradaVal <= 0 || isNaN(pSalidaVal) || pSalidaVal <= 0) {
      setError('Los pesos deben ser números positivos mayores que cero.');
      return;
    }

    if (!selectedFile) {
      setError('Por favor, toma o selecciona una foto del ticket físico de la balanza.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Convertir de toneladas (UI) a Kilogramos (Base de Datos)
      const pesoEntradaKg = Math.round(pEntradaVal * 1000);
      const pesoSalidaKg = Math.round(pSalidaVal * 1000);

      if (!navigator.onLine) {
        setUploadProgress(false);
        // Modo Offline: guardamos el binario y registramos la acción localmente en IndexedDB
        await tripsService.registerWeighingOffline(
          trip.id,
          pesoEntradaKg,
          pesoSalidaKg,
          selectedFile
        );
      } else {
        setUploadProgress(true);
        // 1. Subir imagen a Supabase Storage
        const ticketUrl = await storageService.uploadTicketImage(selectedFile);
        setUploadProgress(false);

        // 2. Registrar transacción vía RPC en Supabase del pesaje
        await tripsService.registerWeighing(
          trip.id,
          pesoEntradaKg,
          pesoSalidaKg,
          ticketUrl
        );
      }

      // Limpiar estados del formulario
      setPesoEntrada('');
      setPesoSalida('');
      setSelectedFile(null);
      setPreviewUrl(null);

      // Refrescar el viaje activo
      await onRefresh();
    } catch (err: any) {
      console.error('Error al registrar pesaje en balanza:', err);
      setError(err.message || 'Error al guardar pesaje en balanza. Reintenta.');
      setUploadProgress(false);
    } finally {
      setLoading(false);
    }
  };

  // Confirmar entrega en obra final (Cambiar a ENTREGADO y liberar camión)
  const handleConfirmDelivery = async () => {
    setLoading(true);
    setError(null);
    try {
      await tripsService.completeDelivery(trip.id);
      await onRefresh();
    } catch (err: any) {
      console.error('Error al confirmar entrega:', err);
      setError(err.message || 'No se pudo confirmar la entrega. Intenta nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  // Calcular pesos en toneladas si existen en el viaje (desde la base de datos)
  const pesoEntradaDbTon = trip.pesoEntradaKg ? (trip.pesoEntradaKg / 1000).toFixed(2) : null;
  const pesoSalidaDbTon = trip.pesoSalidaKg ? (trip.pesoSalidaKg / 1000).toFixed(2) : null;
  const pesoNetoDbTon = trip.pesoEntradaKg && trip.pesoSalidaKg 
    ? ((trip.pesoEntradaKg - trip.pesoSalidaKg) / 1000).toFixed(2) 
    : null;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-6 max-w-md w-full mx-auto relative overflow-hidden">
      
      {/* Detalle decorativo superior según el estado actual */}
      <div className={`absolute top-0 left-0 right-0 h-1.5 ${
        trip.estado === 'PENDIENTE' ? 'bg-amber-500' :
        trip.estado === 'EN_CAMINO' ? 'bg-indigo-500' :
        'bg-emerald-500'
      }`} />

      {/* Cabecera de Viaje Activo */}
      <div className="flex justify-between items-start pt-1">
        <div>
          <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest font-mono">VIAJE EN CURSO</span>
          <h3 className="text-base font-extrabold text-white mt-0.5">Control de Ruta</h3>
        </div>
        <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold font-mono border ${
          trip.estado === 'PENDIENTE' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
          trip.estado === 'EN_CAMINO' ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' :
          'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
        }`}>
          {trip.estado === 'PENDIENTE' ? 'POR INICIAR' :
           trip.estado === 'EN_CAMINO' ? 'EN RUTA' :
           'EN BALANZA'}
        </span>
      </div>

      {/* Línea de Tiempo del Flujo de Trabajo Móvil */}
      <div className="flex items-center justify-between px-2 pt-2 pb-1 border-b border-slate-800/80">
        <div className="flex flex-col items-center space-y-1 flex-1">
          <div className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
            trip.estado === 'PENDIENTE'
              ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20 scale-110'
              : 'bg-emerald-500/25 text-emerald-400 border border-emerald-500/30'
          }`}>
            {trip.estado !== 'PENDIENTE' ? <Check className="h-4 w-4" /> : '1'}
          </div>
          <span className="text-[8.5px] font-bold uppercase tracking-wider text-slate-400 text-center">Salida</span>
        </div>

        <div className={`h-0.5 flex-1 transition-all ${
          trip.estado !== 'PENDIENTE' ? 'bg-emerald-500/30' : 'bg-slate-800'
        }`} />

        <div className="flex flex-col items-center space-y-1 flex-1">
          <div className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
            trip.estado === 'EN_CAMINO'
              ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/20 scale-110'
              : trip.estado === 'EN_BALANZA'
              ? 'bg-emerald-500/25 text-emerald-400 border border-emerald-500/30'
              : 'bg-slate-850 text-slate-600 border border-slate-800'
          }`}>
            {trip.estado === 'EN_BALANZA' ? <Check className="h-4 w-4" /> : '2'}
          </div>
          <span className="text-[8.5px] font-bold uppercase tracking-wider text-slate-400 text-center">Balanza</span>
        </div>

        <div className={`h-0.5 flex-1 transition-all ${
          trip.estado === 'EN_BALANZA' ? 'bg-emerald-500/30' : 'bg-slate-800'
        }`} />

        <div className="flex flex-col items-center space-y-1 flex-1">
          <div className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
            trip.estado === 'EN_BALANZA'
              ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/20 scale-110 animate-pulse'
              : 'bg-slate-850 text-slate-600 border border-slate-800'
          }`}>
            3
          </div>
          <span className="text-[8.5px] font-bold uppercase tracking-wider text-slate-400 text-center">Obra</span>
        </div>
      </div>

      {/* Datos del Pedido Asignado */}
      <div className="bg-slate-950/60 rounded-2xl p-4 border border-slate-850 space-y-3">
        <div className="flex items-start space-x-3">
          <MapPin className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Destino de la Carga</span>
            <p className="text-xs font-bold text-slate-200">{trip.destino}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-900">
          <div className="space-y-0.5">
            <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Material</span>
            <p className="text-xs font-bold text-white uppercase font-mono">
              {trip.material?.replace('_', ' ')}
            </p>
          </div>
          <div className="space-y-0.5">
            <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Vehículo (Volquete)</span>
            <p className="text-xs font-bold text-amber-400 font-mono">
              Placa: {trip.placa}
            </p>
          </div>
        </div>

        {trip.clienteNombre && (
          <div className="pt-2 border-t border-slate-900 space-y-0.5">
            <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Cliente</span>
            <p className="text-xs font-semibold text-slate-300">{trip.clienteNombre}</p>
          </div>
        )}
      </div>

      {/* Mostrar errores si ocurren */}
      {error && (
        <div className="p-3.5 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs rounded-xl flex items-start gap-2.5">
          <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
          <p className="leading-normal">{error}</p>
        </div>
      )}

      {/* SECCIÓN DINÁMICA SEGÚN ESTADO DE LA MÁQUINA DE ESTADO */}

      {/* ESTADO 1: PENDIENTE (Espera a que el conductor inicie viaje al salir de cantera) */}
      {trip.estado === 'PENDIENTE' && (
        <div className="space-y-3.5">
          <div className="p-3.5 bg-amber-500/5 border border-amber-500/10 rounded-xl text-[11px] text-slate-400 leading-normal">
            ℹ️ **Indicaciones de Salida**: Una vez que tu volquete esté cargado con el agregado correspondiente en la cantera y listo para partir, presiona el botón de abajo para notificar al centro de control.
          </div>
          
          <button
            onClick={handleStartTrip}
            disabled={loading}
            className="w-full py-3.5 bg-amber-500 hover:bg-amber-600 disabled:bg-amber-600/35 text-slate-950 font-extrabold text-sm rounded-2xl flex items-center justify-center gap-2 transition-all active:scale-95 shadow-md shadow-amber-500/5 cursor-pointer"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin text-slate-950" />
            ) : (
              <Truck className="h-4 w-4" />
            )}
            <span>INICIAR VIAJE (SALIDA)</span>
          </button>
        </div>
      )}

      {/* ESTADO 2: EN_CAMINO (El conductor está manejando, debe registrarse en la Balanza del trayecto) */}
      {trip.estado === 'EN_CAMINO' && (
        <form onSubmit={handleRegisterWeighing} className="space-y-4">
          <div className="flex items-center space-x-1.5 text-xs font-bold text-slate-200 border-b border-slate-800 pb-2">
            <Scale className="h-4 w-4 text-indigo-400" />
            <span>Formulario de Pesaje en Balanza</span>
          </div>

          <p className="text-[10px] text-slate-400 leading-normal">
            Ingresa los pesos registrados por la balanza autorizada en toneladas e inmortaliza el ticket de pesaje mediante una fotografía.
          </p>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Peso Entrada (t)
              </label>
              <input
                type="number"
                step="0.01"
                placeholder="Ej. 26.40"
                value={pesoEntrada}
                onChange={(e) => setPesoEntrada(e.target.value)}
                required
                className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs font-mono focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Peso Salida (t)
              </label>
              <input
                type="number"
                step="0.01"
                placeholder="Ej. 10.20"
                value={pesoSalida}
                onChange={(e) => setPesoSalida(e.target.value)}
                required
                className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs font-mono focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Subida y Previsualización de Foto del Ticket */}
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Foto del Ticket Físico
            </label>
            
            <input
              type="file"
              accept="image/*"
              capture="environment"
              ref={fileInputRef}
              onChange={handlePhotoChange}
              className="hidden"
            />

            {!previewUrl ? (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full py-6 border-2 border-dashed border-slate-800 hover:border-indigo-500 rounded-2xl bg-slate-950/40 flex flex-col items-center justify-center gap-2 group transition-all text-slate-450 hover:text-indigo-400 cursor-pointer"
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
                  onClick={() => {
                    setSelectedFile(null);
                    setPreviewUrl(null);
                  }}
                  className="p-1.5 bg-slate-900 border border-slate-800 rounded-lg text-rose-400 hover:bg-rose-500/15 transition-all cursor-pointer mr-1"
                >
                  Cambiar
                </button>
              </div>
            )}
          </div>

          {/* Botón de Enviar Pesajes */}
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
      )}

      {/* ESTADO 3: EN_BALANZA (El chofer ya registró pesajes, está en camino a la obra final para entregar) */}
      {trip.estado === 'EN_BALANZA' && (
        <div className="space-y-4">
          <div className="flex items-center space-x-1.5 text-xs font-bold text-emerald-400 border-b border-slate-800 pb-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
            <span>Pesaje Registrado Exitosamente</span>
          </div>

          {/* Datos del pesaje guardado */}
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

          {trip.ticketBalanzaUrl && (
            <div className="flex items-center justify-between p-3 bg-slate-950/60 border border-slate-850 rounded-xl text-xs">
              <div className="flex items-center space-x-2 text-slate-300">
                <FileText className="h-4 w-4 text-indigo-400 shrink-0" />
                <span className="text-[10px] font-bold">Ticket de Pesaje</span>
              </div>
              <a
                href={trip.ticketBalanzaUrl}
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

          {/* Botón de Entrega Completa */}
          <button
            onClick={handleConfirmDelivery}
            disabled={loading}
            className="w-full py-3.5 bg-emerald-500 hover:bg-emerald-600 disabled:bg-emerald-600/35 text-slate-950 font-extrabold text-sm rounded-2xl flex items-center justify-center gap-2 transition-all active:scale-95 shadow-md shadow-emerald-500/5 cursor-pointer"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin text-slate-950" />
            ) : (
              <CheckCircle2 className="h-4 w-4" />
            )}
            <span>CONFIRMAR ENTREGA EN OBRA</span>
          </button>
        </div>
      )}

    </div>
  );
}

export default DriverTripActive;
