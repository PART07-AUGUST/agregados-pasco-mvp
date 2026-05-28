import { useNavigate } from 'react-router-dom';
import { ShieldAlert, ArrowLeft, Home } from 'lucide-react';

export function Unauthorized() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center px-4 relative selection:bg-amber-500 selection:text-slate-950">
      
      {/* Retícula decorativa de fondo */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#0f172a_1px,transparent_1px),linear-gradient(to_bottom,#0f172a_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-30"></div>

      <div className="relative z-10 w-full max-w-md bg-slate-900/40 border border-slate-900 rounded-3xl p-8 backdrop-blur-xl text-center space-y-6">
        
        {/* Icono de Alerta de Escudo */}
        <div className="flex justify-center">
          <div className="p-4 bg-rose-500/10 text-rose-500 rounded-2xl border border-rose-500/20 shadow-lg shadow-rose-500/5 animate-bounce-slow">
            <ShieldAlert className="h-10 w-10" />
          </div>
        </div>

        {/* Título de Error */}
        <div className="space-y-2">
          <h1 className="text-2xl font-extrabold text-white tracking-tight">Acceso No Autorizado</h1>
          <p className="text-xs text-slate-400 max-w-xs mx-auto leading-relaxed">
            Código 403. Tu rol de usuario no cuenta con los privilegios necesarios para ver esta sección logística.
          </p>
        </div>

        {/* Botones de acción */}
        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <button 
            onClick={() => navigate(-1)}
            className="flex-1 px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 font-semibold hover:bg-slate-900 active:scale-95 transition-all text-xs flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Volver Atrás</span>
          </button>
          
          <button 
            onClick={() => navigate('/', { replace: true })}
            className="flex-1 px-4 py-2.5 rounded-xl bg-amber-500 text-slate-950 font-bold hover:bg-amber-600 active:scale-95 transition-all text-xs flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Home className="h-3.5 w-3.5" />
            <span>Página de Inicio</span>
          </button>
        </div>

        <div className="text-[9px] text-slate-600 font-mono">
          SISTEMA DE SEGURIDAD RLS - AGREGADOS SIS
        </div>
      </div>
    </div>
  );
}

export default Unauthorized;
