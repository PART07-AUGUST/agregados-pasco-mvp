import { Link } from 'react-router-dom';
import { Truck } from 'lucide-react';

export function AuthBrandHeader() {
  return (
    <div className="flex flex-col items-center space-y-3">
      <Link to="/" className="group flex cursor-pointer items-center space-x-2.5">
        <div className="rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 p-2 text-slate-950 shadow-lg shadow-amber-500/10 transition-transform group-hover:scale-105">
          <Truck className="h-6 w-6" />
        </div>
        <div className="text-left">
          <span className="text-[10px] font-bold uppercase tracking-widest text-amber-500">Cerro de Pasco</span>
          <h1 className="text-lg font-extrabold leading-none tracking-tight text-white">
            AGREGADOS <span className="font-light text-slate-400">SIS</span>
          </h1>
        </div>
      </Link>
    </div>
  );
}
