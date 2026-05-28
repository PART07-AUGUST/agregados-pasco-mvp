import { useState } from 'react';
import { 
  CheckCircle2, 
  XCircle, 
  Database,
  Layers,
  ShieldAlert
} from 'lucide-react';
import { 
  validarPlaca, 
  validarDNI, 
  validarCelular, 
  validarRUC, 
  validarPesoPositivo 
} from '../../../shared/validations';

export function AdminValidator() {
  const [placa, setPlaca] = useState('');
  const [dni, setDni] = useState('');
  const [celular, setCelular] = useState('');
  const [ruc, setRuc] = useState('');
  const [peso, setPeso] = useState<number | ''>('');
  const [showTechnicalDetails, setShowTechnicalDetails] = useState(false);

  return (
    <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 relative">
      <div className="absolute top-0 right-0 -mt-8 -mr-8 w-48 h-48 bg-amber-500/5 rounded-full blur-2xl pointer-events-none"></div>

      {/* Cabecera del Panel Administrativo */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-800 pb-4 gap-2">
        <div className="flex items-center space-x-2.5">
          <div className="p-1.5 bg-amber-500/10 text-amber-500 rounded-lg">
            <ShieldAlert className="h-4.5 w-4.5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-white uppercase tracking-wider">Panel de Auditoría y Control de Dominio</h4>
            <p className="text-xs text-slate-500">Herramienta exclusiva de administración lograda en Fase 1</p>
          </div>
        </div>
        <button 
          onClick={() => setShowTechnicalDetails(!showTechnicalDetails)}
          className="text-left text-[10px] text-slate-500 hover:text-amber-400 font-semibold underline cursor-pointer self-start sm:self-center"
        >
          {showTechnicalDetails ? 'Ocultar Firma Técnica' : 'Ver Firma Técnica'}
        </button>
      </div>

      {showTechnicalDetails && (
        <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 font-mono text-[10px] text-slate-400 space-y-1 leading-normal overflow-x-auto">
          <p className="text-amber-500 font-semibold">// Firma Técnica del Dominio - src/shared/validations/index.ts</p>
          <p><span className="text-indigo-400">export function</span> <span className="text-amber-300">validarPlaca</span>(placa: string): boolean &#123;</p>
          <p className="pl-4">const regex = /^[A-Z0-9]&#123;3&#125;-[0-9]&#123;3&#125;$/i;</p>
          <p className="pl-4">return regex.test(placa.trim());</p>
          <p>&#125;</p>
        </div>
      )}

      {/* Formulario de Validación */}
      <div className="space-y-4">
        {/* Placa Input */}
        <div className="space-y-1">
          <label className="text-xs font-semibold text-slate-400 flex justify-between">
            <span>Placa del Camión (Formato: ABC-123)</span>
            <span className="text-[10px] font-mono text-slate-500">validarPlaca()</span>
          </label>
          <div className="relative">
            <input 
              type="text" 
              value={placa} 
              onChange={(e) => setPlaca(e.target.value)}
              placeholder="Ej. ABC-123"
              className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl px-4 py-2.5 text-sm outline-none font-mono"
            />
            <div className="absolute right-3 top-3">
              {placa === '' ? (
                <span className="text-[10px] text-slate-600 font-mono">Esperando...</span>
              ) : validarPlaca(placa) ? (
                <div className="flex items-center gap-1 text-emerald-400 text-xs font-bold font-mono">
                  <CheckCircle2 className="h-4.5 w-4.5" />
                  <span>VÁLIDO</span>
                </div>
              ) : (
                <div className="flex items-center gap-1 text-rose-500 text-xs font-bold font-mono">
                  <XCircle className="h-4.5 w-4.5" />
                  <span>INVÁLIDO</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* DNI & Celular Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-400">DNI del Conductor (8 dígitos)</label>
            <div className="relative">
              <input 
                type="text" 
                maxLength={8}
                value={dni} 
                onChange={(e) => setDni(e.target.value)}
                placeholder="Ej. 12345678"
                className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl px-4 py-2.5 text-sm outline-none font-mono"
              />
              <div className="absolute right-3 top-3">
                {dni === '' ? null : validarDNI(dni) ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                ) : (
                  <XCircle className="h-4 w-4 text-rose-500" />
                )}
              </div>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-400">Celular de Contacto (9 dígitos)</label>
            <div className="relative">
              <input 
                type="text" 
                maxLength={9}
                value={celular} 
                onChange={(e) => setCelular(e.target.value)}
                placeholder="Ej. 987654321"
                className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl px-4 py-2.5 text-sm outline-none font-mono"
              />
              <div className="absolute right-3 top-3">
                {celular === '' ? null : validarCelular(celular) ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                ) : (
                  <XCircle className="h-4 w-4 text-rose-500" />
                )}
              </div>
            </div>
          </div>
        </div>

        {/* RUC & Peso Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-400">RUC de Empresa Cliente (11 dígitos)</label>
            <div className="relative">
              <input 
                type="text" 
                maxLength={11}
                value={ruc} 
                onChange={(e) => setRuc(e.target.value)}
                placeholder="Ej. 20123456789"
                className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl px-4 py-2.5 text-sm outline-none font-mono"
              />
              <div className="absolute right-3 top-3">
                {ruc === '' ? null : validarRUC(ruc) ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                ) : (
                  <XCircle className="h-4 w-4 text-rose-500" />
                )}
              </div>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-400">Peso en Balanza (Toneladas)</label>
            <div className="relative">
              <input 
                type="number" 
                step="0.01"
                value={peso} 
                onChange={(e) => setPeso(e.target.value !== '' ? parseFloat(e.target.value) : '')}
                placeholder="Ej. 15.5"
                className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl px-4 py-2.5 text-sm outline-none font-mono"
              />
              <div className="absolute right-3 top-3">
                {peso === '' ? null : validarPesoPositivo(peso) ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                ) : (
                  <XCircle className="h-4 w-4 text-rose-500" />
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Footer del Módulo */}
      <div className="pt-4 flex justify-between items-center text-xs text-slate-500 font-semibold border-t border-slate-800/80">
        <span className="flex items-center gap-1.5"><Layers className="h-3.5 w-3.5" /> Capa de Presentación (Admin)</span>
        <span className="flex items-center gap-1.5"><Database className="h-3.5 w-3.5 text-amber-500" /> Infraestructura Supabase</span>
      </div>
    </div>
  );
}
