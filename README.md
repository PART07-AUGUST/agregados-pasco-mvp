# 🚛 Agregados Pasco — Sistema Integral de Control Logístico y Flotas

> **Plataforma web de última generación para la gestión, transporte y despacho de agregados de cantera (arena, grava, piedra chancada y afirmado), diseñada para operaciones de alta montaña en Cerro de Pasco, Perú (4,380 m s.n.m.).**

Este sistema interconecta en tiempo real a **Administradores de Flota**, **Conductores de Volquetes** y **Empresas Constructoras**, garantizando trazabilidad de pesajes, cálculo geoespacial de fletes y continuidad operativa bajo condiciones extremas y baja cobertura celular mediante una arquitectura **Offline-First**.

---

## 📌 Contexto de Negocio y Operación Altoandina

El transporte de materiales de construcción en el altiplano de Pasco enfrenta condiciones logísticas únicas:
1. **Rutas Extremas y Altura**: Requiere volquetes de doble tracción (6x4 y 8x4) preparados para pendientes pronunciadas y motores certificados para alta montaña.
2. **Georreferenciación de Canteras**: Despachos desde las canteras estratégicas de la región (*Quiulacocha*, *Tinyahuarco*, *Chicrín*, *Huaraucaca*).
3. **Brecha de Conectividad en Cantera**: Las zonas de carga carecen frecuentemente de señal móvil. La aplicación implementa persistencia local en **IndexedDB**, permitiendo a los choferes registrar pesajes y fotos de tickets de balanza sin conexión; la sincronización se realiza automáticamente al recuperar cobertura.

---

## 🚀 Módulos del Sistema

### 1. 🏗️ Portal de Constructoras / Clientes
* **Simulador Logístico Geoespacial**: Estimación de flete en tiempo real integrando **Google Maps Platform** y **GraphHopper Routing**.
* **Cálculo Inteligente de Fletes**: Considera costo base por viaje, flete por tonelada-kilómetro (según material y peso específico) y distancia exacta por carretera.
* **Transformación Directa a Pedido**: Convierte la cotización en una orden formal de despacho hacia la obra con un solo clic.
* **Trazabilidad de Despachos**: Historial de pedidos y estado de entrega de cada volquete.

### 2. 🚛 Portal Móvil del Conductor (Offline-First)
* **UI Adaptativa para Cabina**: Interfaz ergonómica de alto contraste diseñada para pantallas de smartphones en campo.
* **Flujo Secuencial de Despacho**: Estados controlados (*Pendiente $\rightarrow$ En Camino $\rightarrow$ En Balanza $\rightarrow$ Entregado*).
* **Control de Pesaje de Balanza**: Registro de peso tara (entrada) y peso bruto (salida) con cálculo automático de carga neta.
* **Captura de Ticket de Balanza**: Fotografía del comprobante físico respaldada en **IndexedDB** y subida a **Supabase Storage**.

### 3. ⚙️ Consola de Control de Flotas (Administrador)
* **Monitoreo de Despacho en Vivo**: Tablero centralizado de volquetes en ruta, tiempos de entrega y pesajes registrados.
* **Gestión de Flota Vehicular**: Registro técnico de volquetes (marca, modelo, placa de rodaje MTC y capacidad volumétrica en m³).
* **Gestión de Conductores**:
  * Nómina de choferes con validación de DNI (8 dígitos) y Brevete MTC (`licencia_conducir`).
  * Enlace directo a **WhatsApp** (`wa.me`) con mensaje preconfigurado para coordinaciones inmediatas en ruta.
  * Vinculación en un clic con volquetes de la flota.
  * **Aprovisionamiento Seguro de Credenciales**: Creación de usuarios en `auth.users` mediante funciones PostgreSQL con `SECURITY DEFINER` (sin cerrar la sesión del Administrador).
* **Despacho y Asignación de Pedidos**: Asignación ágil de órdenes a camiones disponibles.

### 4. 🌐 Landing Page & Catálogo Industrial
* Vitrina digital institucional con diseño industrial moderno (Slate/Amber).
* Galería de flota de carga pesada adaptada a geografía andina.
* Acceso directo a cotizaciones y autenticación protegida por roles.

---

## 🛠️ Stack Tecnológico

* **Frontend**: React 19 + Vite 8 + TypeScript (Modo Estricto).
* **Styling**: Tailwind CSS v4 + Lucide React Icons.
* **Gestión de Estado**: Zustand (estado global ligero y reactivo).
* **Mapas y Georreferenciación**:
  * **Google Maps JavaScript API** (visualización cartográfica satelital y terreno).
  * **GraphHopper API** (enrutamiento de carga pesada y perfiles de altimetría).
* **Persistencia Offline**: IndexedDB nativo (almacenamiento binario de imágenes y cola de transacciones).
* **Backend como Servicio (BaaS)**: Supabase (PostgreSQL 15+).
  * **Row Level Security (RLS)**: Aislamiento estricto de datos por rol.
  * **Stored Procedures / RPC**: Operaciones atómicas con privilegios elevados (`SECURITY DEFINER`).
  * **Supabase Storage**: Bucket público/privado para comprobantes de pesaje.
* **Gestor de Paquetes**: `pnpm` (exclusivo).

---

## 📁 Estructura del Proyecto (Clean Architecture & SOLID)

```txt
src/
 ├── app/                  # Proveedores de contexto y enrutador principal
 ├── features/             # Módulos por dominio de negocio (Domain Features)
 │    ├── auth/            # Inicio de sesión, control de acceso y RBAC
 │    ├── conductores/     # Gestión de nómina de choferes y credenciales
 │    ├── pedidos/         # Simulador de flete, cotizador y órdenes de obra
 │    ├── vehiculos/       # Flota vehicular y volquetes
 │    └── viajes/          # Ejecución de viajes, pesaje y sincronizador offline
 │
 ├── pages/                # Vistas principales (Landing, Dashboards por Rol)
 ├── shared/               # Componentes y utilidades transversales
 │    ├── components/      # GoogleMapView, modales y átomos reutilizables
 │    ├── hooks/           # Hooks de geolocalización, red y estado
 │    ├── services/        # Clientes API (supabase, googleMapsLoader, freightService)
 │    ├── stores/          # Stores Zustand (useAuthStore)
 │    ├── types/           # Definiciones de tipos TypeScript del dominio
 │    └── utils/           # Validaciones de DNI/MTC y manejo de errores
 │
 └── index.css             # Tema base y tokens de diseño
```

---

## ⚙️ Variables de Entorno

Crea tu archivo `.env.local` a partir de la plantilla:

```bash
cp .env.example .env.local
```

Configura las siguientes credenciales:

```env
# Conexión a Supabase
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu-anon-key

# Google Maps Platform (Mapas interactivos y geocodificación)
VITE_GOOGLE_MAPS_API_KEY=tu-google-maps-api-key

# GraphHopper Routing API (Cálculo de distancias y fletes)
VITE_GRAPHHOPPER_API_KEY=tu-graphhopper-api-key
```

---

## 🗄️ Configuración de Base de Datos (Supabase)

Para desplegar la base de datos completa con soporte de fletes y conductores:

### 1. Esquema Base
En el **SQL Editor** de Supabase, ejecuta el script de inicio:
* [supabase/migrations/20260527_init_schema.sql](supabase/migrations/20260527_init_schema.sql)
*(Crea las tablas de usuarios, vehículos, pedidos, viajes y políticas RLS).*

### 2. Módulo de Conductores y Credenciales Atómicas
Ejecuta la migración de conductores:
* [supabase/migrations/20260905_admin_create_driver_rpc.sql](supabase/migrations/20260905_admin_create_driver_rpc.sql)
*(Habilita `pgcrypto`, agrega `email`, `licencia_conducir` y la función RPC `admin_crear_conductor`).*

### 3. Configurar Storage de Tickets
1. Ve a **Storage** $\rightarrow$ **New bucket** con el nombre exacto: **`tickets-balanza`** (público).
2. En la pestaña **Policies**, aplica:
```sql
CREATE POLICY "Permitir subidas en tickets-balanza" 
ON storage.objects FOR INSERT TO authenticated 
WITH CHECK (bucket_id = 'tickets-balanza');

CREATE POLICY "Permitir lectura en tickets-balanza" 
ON storage.objects FOR SELECT TO authenticated 
USING (bucket_id = 'tickets-balanza');
```

---

## 🚦 Ejecución en Desarrollo

Instala las dependencias y corre el servidor Vite:

```bash
pnpm install
pnpm dev
```

### Usuarios de Demostración y Pruebas E2E

| Rol | Correo Sugerido | Propósito de Prueba |
| :--- | :--- | :--- |
| **Administrador** | `admin@tudominio.com` | Monitoreo en vivo, alta de volquetes y creación de choferes. |
| **Conductor** | `conductor@tudominio.com` | Simulación móvil de viaje, pesaje en balanza y modo offline. |
| **Constructora** | `constructora@tudominio.com` | Simulador de flete con mapas y generación de pedidos. |

---

## 📋 Calidad y Estándares de Código

* **Cero `@Suppress` y `@Ignore`**: Respeto estricto del análisis estático y tipado seguro.
* **Una clase / componente por archivo**: Alta cohesión y mantenibilidad.
* **Verificación continua**: Validado con `tsc -b && vite build` y escaneado con **React Doctor**.

---

## 📜 Licencia

Desarrollado como proyecto MVP para la modernización de la cadena de suministro de construcción en la región Pasco. Todos los derechos reservados.
