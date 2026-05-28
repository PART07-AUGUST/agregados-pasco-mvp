import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  Truck, 
  MapPin, 
  Phone, 
  HardHat, 
  ArrowRight,
  Sparkles,
  CheckCircle2
} from 'lucide-react';
import { useAuthStore } from '../shared/stores/useAuthStore';

export function LandingPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'materiales' | 'flota' | 'cobertura'>('materiales');

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-amber-500 selection:text-slate-950">
      
      {/* Header Logístico */}
      <header className="border-b border-slate-900 bg-slate-950/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-gradient-to-br from-amber-400 to-amber-600 text-slate-950 rounded-xl shadow-lg shadow-amber-500/10">
              <Truck className="h-5 w-5" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-amber-500 tracking-widest uppercase">Cerro de Pasco</span>
              <h1 className="text-md font-extrabold tracking-tight text-white">
                AGREGADOS <span className="text-slate-400 font-light">SIS</span>
              </h1>
            </div>
          </div>

          {/* Menú de Navegación de la Landing */}
          <nav className="hidden md:flex space-x-8 text-sm font-medium text-slate-400">
            <a href="#servicios" className="hover:text-amber-400 transition-colors">Materiales</a>
            <a href="#cobertura" className="hover:text-amber-400 transition-colors">Zonas de Despacho</a>
          </nav>

          <div className="flex items-center space-x-3">
            {/* Botón de Acceso (Fase 3 autenticado / deslogueado) */}
            {user ? (
              <button 
                onClick={() => {
                  if (user.rol === 'ADMINISTRADOR') navigate('/admin');
                  else if (user.rol === 'CONDUCTOR') navigate('/conductor');
                  else navigate('/');
                }}
                className="px-4 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-amber-400 hover:text-amber-500 text-xs font-bold active:scale-95 transition-all cursor-pointer flex items-center gap-1.5"
              >
                <HardHat className="h-3.5 w-3.5 text-amber-500" />
                <span>Panel de {user.nombre.split(' ')[0]}</span>
              </button>
            ) : (
              <Link 
                to="/login"
                className="px-4 py-1.5 rounded-lg bg-amber-500 text-slate-950 font-bold text-xs hover:bg-amber-600 active:scale-95 transition-all shadow-md shadow-amber-500/10 flex items-center gap-1 cursor-pointer"
              >
                <HardHat className="h-3.5 w-3.5" />
                <span>Portal Logístico</span>
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative py-20 sm:py-28 overflow-hidden bg-slate-950">
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat scale-105"
          style={{ backgroundImage: "url('https://vicarmix.com/img/conreto-1.jpg')", backgroundPosition: 'center 30%' }}
        ></div>
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(2,6,23,0.58)_0%,rgba(2,6,23,0.5)_24%,rgba(2,6,23,0.76)_68%,rgba(2,6,23,0.9)_100%)]"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(245,158,11,0.14),transparent_38%)]"></div>
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(15,23,42,0.18)_1px,transparent_1px),linear-gradient(to_bottom,rgba(15,23,42,0.18)_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-30"></div>
        <div className="absolute top-10 right-[18%] w-80 h-80 bg-amber-500/12 rounded-full blur-3xl pointer-events-none"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative text-center space-y-8">
          
          <div className="inline-flex items-center space-x-2 bg-slate-900 border border-slate-800 px-3 py-1 rounded-full text-xs text-amber-400">
            <Sparkles className="h-3.5 w-3.5" />
            <span className="font-medium">Transporte y Suministro de Materiales de Cantera</span>
          </div>

          <div className="space-y-4 max-w-4xl mx-auto">
            <h2 className="text-4xl sm:text-6xl font-extrabold text-white tracking-tight leading-tight sm:leading-none">
              El Corazón de la Construcción y Minería en <span className="bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-600 bg-clip-text text-transparent">Cerro de Pasco</span>
            </h2>
            <p className="text-slate-400 text-base sm:text-xl max-w-2xl mx-auto font-light leading-relaxed">
              Suministro garantizado de agregados de alta calidad (arena, piedra, afirmado) adaptado al clima extremo y con tecnología logística offline para áreas sin cobertura de señal en los andes peruanos.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row justify-center items-center gap-4 max-w-sm mx-auto pt-4">
            <a 
              href="#servicios" 
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-amber-500 text-slate-950 font-bold hover:bg-amber-600 active:scale-95 transition-all text-center shadow-lg shadow-amber-500/20 cursor-pointer"
            >
              Ver Materiales
            </a>
            <a 
              href="#cobertura" 
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 font-semibold hover:bg-slate-800 active:scale-95 transition-all text-center cursor-pointer"
            >
              Zonas de Despacho
            </a>
          </div>

        </div>
      </section>

      {/* Sección de Materiales (Agregados) */}
      <section id="servicios" className="py-20 bg-slate-950 border-t border-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          
          <div className="text-center space-y-3">
            <span className="text-xs font-bold text-amber-500 tracking-widest uppercase">Nuestros Recursos</span>
            <h3 className="text-2xl sm:text-4xl font-extrabold text-white">Agregados Certificados de Cantera</h3>
            <p className="text-slate-400 max-w-xl mx-auto text-sm sm:text-base font-light">
              Abastecemos obras de infraestructura civil, construcción urbana y proyectos mineros en toda la región.
            </p>
          </div>

          {/* Selector de Pestaña */}
          <div className="flex justify-center space-x-2 bg-slate-900 p-1.5 rounded-xl max-w-sm mx-auto">
            <button 
              onClick={() => setActiveTab('materiales')}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${activeTab === 'materiales' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-white'}`}
            >
              Materiales
            </button>
            <button 
              onClick={() => setActiveTab('flota')}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${activeTab === 'flota' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-white'}`}
            >
              Flota de Volquetes
            </button>
            <button 
              onClick={() => setActiveTab('cobertura')}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${activeTab === 'cobertura' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-white'}`}
            >
              Canteras y Origen
            </button>
          </div>

          {/* Contenido Dinámico de la Pestaña */}
          {activeTab === 'materiales' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              
              {/* Material 1: Arena */}
              <div className="bg-slate-900/40 border border-slate-900 hover:border-slate-800 rounded-2xl p-6 space-y-4 hover:translate-y-[-4px] transition-all">
                <div className="h-40 rounded-xl border border-amber-900/30 flex items-center justify-center relative overflow-hidden bg-slate-950">
                  <img
                    src="https://grupohammersac.com/wp-content/uploads/2021/07/1-2-1.jpg"
                    alt="Arena fina"
                    className="absolute inset-0 h-full w-full object-cover opacity-80"
                  />
                  <div className="absolute inset-0 bg-gradient-to-br from-amber-950/40 to-slate-950/70"></div>
                  <div className="absolute bottom-3 left-3 bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[10px] font-bold px-2 py-0.5 rounded">Construcción y Acabados</div>
                </div>
                <h4 className="text-lg font-bold text-white">Arena Fina y Gruesa</h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Ideal para tarrajeo, asentado de ladrillos y preparación de mezclas de concreto de alta resistencia estructural.
                </p>
                <div className="flex justify-between items-center text-xs text-slate-500 font-semibold border-t border-slate-900 pt-3">
                  <span>Densidad Promedio</span>
                  <span className="text-white font-mono">1.6 ton/m³</span>
                </div>
              </div>

              {/* Material 2: Piedra Chancada */}
              <div className="bg-slate-900/40 border border-slate-900 hover:border-slate-800 rounded-2xl p-6 space-y-4 hover:translate-y-[-4px] transition-all">
                <div className="h-40 rounded-xl border border-slate-800/30 flex items-center justify-center relative overflow-hidden bg-slate-950">
                  <img
                    src="https://d34fyu2ua7aizz.cloudfront.net/images/product/6/large/ts_image_5e78e07b27b0b8_15411847.png"
                    alt="Piedra chancada"
                    className="absolute inset-0 h-full w-full object-cover opacity-85"
                  />
                  <div className="absolute inset-0 bg-gradient-to-br from-slate-950/35 to-slate-950/75"></div>
                  <div className="absolute bottom-3 left-3 bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[10px] font-bold px-2 py-0.5 rounded">Concreto Armado</div>
                </div>
                <h4 className="text-lg font-bold text-white">Piedra Chancada (1/2" - 3/4")</h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Piedra de alta dureza clasificada y tamizada, perfecta para vigas, columnas, losas aligeradas y cimientos armados.
                </p>
                <div className="flex justify-between items-center text-xs text-slate-500 font-semibold border-t border-slate-900 pt-3">
                  <span>Tamizado Estándar</span>
                  <span className="text-white font-mono">Astm C-33</span>
                </div>
              </div>

              {/* Material 3: Afirmado */}
              <div className="bg-slate-900/40 border border-slate-900 hover:border-slate-800 rounded-2xl p-6 space-y-4 hover:translate-y-[-4px] transition-all">
                <div className="h-40 rounded-xl border border-amber-950/30 flex items-center justify-center relative overflow-hidden bg-slate-950">
                  <img
                    src="https://ferrincorp.com.pe/wp-content/uploads/2024/08/ARENAGRUESA_1-300x300.webp"
                    alt="Afirmado clasificado"
                    className="absolute inset-0 h-full w-full object-cover opacity-80"
                  />
                  <div className="absolute inset-0 bg-gradient-to-br from-amber-950/35 to-slate-950/75"></div>
                  <div className="absolute bottom-3 left-3 bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[10px] font-bold px-2 py-0.5 rounded">Carreteras y Accesos</div>
                </div>
                <h4 className="text-lg font-bold text-white">Afirmado Clasificado</h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Mezcla de suelo grava-arcilloso ideal para bases y sub-bases viales, terraplenes y pavimentación de accesos mineros.
                </p>
                <div className="flex justify-between items-center text-xs text-slate-500 font-semibold border-t border-slate-900 pt-3">
                  <span>Compactación Máxima</span>
                  <span className="text-white font-mono">Proctor Modificado</span>
                </div>
              </div>

            </div>
          )}

          {activeTab === 'flota' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="p-6 bg-slate-900/30 border border-slate-900 rounded-2xl space-y-4 flex flex-col justify-center">
                <h4 className="text-xl font-bold text-white">Logística y Flota a Gran Altura</h4>
                <p className="text-sm text-slate-400 leading-relaxed">
                  Operamos con volquetes de tres ejes (doble tracción) y camiones semirremolques optimizados para rendir a más de 4,000 metros de altitud en Cerro de Pasco.
                </p>
                <ul className="space-y-2 text-xs text-slate-300 font-medium">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-amber-500" /> Capacidad de carga desde 15 m³ hasta 30 m³.
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-amber-500" /> Motores certificados Euro V adaptados para torque en subida extrema.
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-amber-500" /> Sistema de tolvas de acero de alta resistencia antidesgaste.
                  </li>
                </ul>
              </div>
              <div className="h-64 rounded-2xl bg-gradient-to-tr from-amber-500/10 to-amber-700/5 border border-slate-900 flex items-center justify-center">
                <Truck className="h-20 w-20 text-amber-500/40 animate-pulse" />
              </div>
            </div>
          )}

          {activeTab === 'cobertura' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-5 bg-slate-900/30 border border-slate-900 rounded-xl">
                <MapPin className="h-5 w-5 text-amber-500 mb-2" />
                <h5 className="font-bold text-white">Cantera Quiulacocha</h5>
                <p className="text-xs text-slate-400 mt-1">Suministro principal de arenas finas y agregados lavados a pie de cerro.</p>
              </div>
              <div className="p-5 bg-slate-900/30 border border-slate-900 rounded-xl">
                <MapPin className="h-5 w-5 text-amber-500 mb-2" />
                <h5 className="font-bold text-white">Cantera Tinyahuarco</h5>
                <p className="text-xs text-slate-400 mt-1">Especializada en piedra chancada clasificada y afirmados viales de alta compactación.</p>
              </div>
              <div className="p-5 bg-slate-900/30 border border-slate-900 rounded-xl">
                <MapPin className="h-5 w-5 text-amber-500 mb-2" />
                <h5 className="font-bold text-white">Planta Chaupimarca</h5>
                <p className="text-xs text-slate-400 mt-1">Punto central de despacho, pesaje oficial y control administrativo de guías de remisión.</p>
              </div>
            </div>
          )}

        </div>
      </section>

      {/* Cobertura Logística Cerro de Pasco */}
      <section id="cobertura" className="py-20 bg-slate-900/10 border-t border-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          
          <div className="h-72 rounded-3xl border border-slate-900 overflow-hidden bg-slate-950/60 backdrop-blur-sm shadow-[0_20px_60px_rgba(2,6,23,0.35)]">
            <iframe
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3920.8991117082287!2d-76.25562122538891!3d-10.66493858947709!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x910812b72a568a67%3A0x7aa1547f568fd8ce!2sEscuela%20de%20Sistemas%20y%20Computaci%C3%B3n%20UNDAC!5e0!3m2!1ses!2spe!4v1779932664009!5m2!1ses!2spe"
              className="h-full w-full"
              style={{ border: 0 }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title="Mapa de cobertura Agregados SIS"
            />
          </div>

          <div className="space-y-6">
            <span className="text-xs font-bold text-amber-500 tracking-widest uppercase">Alcance Territorial</span>
            <h3 className="text-3xl font-extrabold text-white tracking-tight">Despachos Directos a Obra y Planta</h3>
            <p className="text-slate-400 leading-relaxed text-sm">
              Nuestra flota está coordinada para cumplir entregas en tiempos óptimos, gestionando las dificultades del clima de altura y el estado de las vías afirmadas en Pasco.
            </p>
            
            <div className="space-y-3 font-semibold text-xs text-slate-300">
              <div className="flex items-center gap-3">
                <ArrowRight className="h-4 w-4 text-amber-500" />
                <span>Ruta Tinyahuarco - Yanacancha: Conexión logística directa.</span>
              </div>
              <div className="flex items-center gap-3">
                <ArrowRight className="h-4 w-4 text-amber-500" />
                <span>Monitoreo de estado de viaje en tiempo real e historial por conductor.</span>
              </div>
              <div className="flex items-center gap-3">
                <ArrowRight className="h-4 w-4 text-amber-500" />
                <span>Control estricto de pesos de entrada y salida con balanza certificada.</span>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* Footer Logístico */}
      <footer className="mt-auto border-t border-slate-900 bg-slate-950 py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-slate-900 text-amber-500 border border-slate-800 rounded-lg">
                <Truck className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white tracking-widest uppercase">AGREGADOS SIS</h4>
                <p className="text-xs text-slate-500">Soporte Técnico & Control de Despacho</p>
              </div>
            </div>

            <div className="flex space-x-6 text-xs text-slate-400 font-medium">
              <a href="#servicios" className="hover:text-amber-400 transition-colors">Materiales</a>
              <a href="#cobertura" className="hover:text-amber-400 transition-colors">Zonas de Despacho</a>
            </div>
          </div>

          <div className="border-t border-slate-900/60 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
            <div className="flex items-center space-x-1.5">
              <span>© {new Date().getFullYear()} Agregados SIS. Todos los derechos reservados.</span>
            </div>
            
            <div className="flex items-center space-x-4">
              <span className="flex items-center gap-1 text-slate-400">
                <Phone className="h-3.5 w-3.5 text-amber-500" />
                +51 987 654 321
              </span>
              <span className="flex items-center gap-1 text-slate-400">
                <MapPin className="h-3.5 w-3.5 text-amber-500" />
                Chaupimarca, Pasco
              </span>
            </div>
          </div>

        </div>
      </footer>

    </div>
  );
}

export default LandingPage;
