# 🚛 SIS-AGREGADOS — Sistema Integral de Control Logístico y Flotas

> **Plataforma web de última generación para la gestión, transporte y despacho de agregados de cantera (arena fina, arena gruesa, piedra chancada y afirmado), diseñada para operaciones de alta montaña en Cerro de Pasco, Perú .**

Este sistema interconecta en tiempo real a **Administradores de Flota**, **Conductores de Volquetes** y **Empresas Constructoras**, garantizando trazabilidad de pesajes en balanza, cálculo geoespacial de fletes con perfiles de altitud, reconocimiento inteligente de rutas y continuidad operativa bajo condiciones extremas y baja cobertura celular mediante una arquitectura **Offline-First** y **Clean Architecture**.

---

## 📌 Contexto de Negocio y Operación Altoandina

El transporte de materiales de construcción y áridos en la sierra central y selva central de Pasco enfrenta condiciones logísticas desafiantes:
1. **Rutas Extremas y Altura**: Pendientes pronunciadas entre los 1,800 m s.n.m. (Oxapampa) y los 4,380 m s.n.m. (Cerro de Pasco), requiriendo volquetes de tracción pesada (6x4 y 8x4) con capacidades de tolva de 15 a 20 m³.
2. **Georreferenciación de Canteras**: Despacho desde canteras estratégicas con materiales clasificados según los requerimientos estructurales de la obra.
3. **Brecha de Conectividad en Cantera**: Zonas de carga y pesaje sin cobertura celular. La plataforma implementa persistencia local en **IndexedDB**, permitiendo a los choferes registrar pesajes, tickets físicos de balanza y cambios de estado sin conexión; la sincronización se realiza automáticamente al detectar conectividad.

---

## 🗺️ Red Logística de Canteras, Destinos y Enrutamiento

### 1. Canteras Oficiales de Salida
| Cantera | Distrito / Ubicación | Altitud | Especialidad de Material |
| :--- | :--- | :--- | :--- |
| **Cantera Quiulacocha** | Cerro de Pasco | 4,380 m s.n.m. | Agregados clasificados, arena fina/gruesa, piedra chancada 1/2" y 3/4". |
| **Cantera Smelter** | Tinyahuarco | 4,100 m s.n.m. | Afirmado clasificado, base granular y roca chancada para carreteras. |
| **Cantera Río Huallaga** | Huariaca | 2,940 m s.n.m. | Agregados fluviales de río, arena lavada y confitillo para concreto. |
| **Cantera Bellavista** | Paucartambo | 2,880 m s.n.m. | Material granular, afirmado y piedra seleccionada para obras viales. |
| **Cantera Vinchos** | Pallanchacra | 3,150 m s.n.m. | Agregado chancado y piedra para cimientos y muros de contención. |

---

### 2. Cobertura de Destinos Regionales (Región Pasco y Conexiones)
El sistema cuenta con coordenadas georreferenciadas y rutas directas preconfiguradas para las tres provincias del departamento de Pasco y nodos de la sierra central:

* **Provincia de Pasco**:
  - *Yanacancha (San Juan)*, *Chaupimarca (Centro Histórico)*, *Simón Bolívar (Rancas)*.
  - *Tinyahuarco Pueblo*, *Colquijirca*, *Villa Pasco*, *Huariaca (Valle)*, *Ninacaca*, *Carhuamayo*, *Paucartambo*.
* **Provincia de Oxapampa**:
  - *Oxapampa (Capital)*, *Villa Rica*, *Pozuzo (Colonia)*, *Chontabamba*.
* **Provincia de Daniel Alcides Carrión**:
  - *Yanahuanca (Capital)*.
* **Corredores Logísticos Conectados**:
  - *Tarma (Junín)*, *Junín (Meseta de Bombón)*, *La Oroya (Yauli)*, *Huánuco Ciudad*.

---

### 3. Motor Inteligente de Geocodificación y Reconocimiento de Intención
Para garantizar que cualquier obra, proyecto o punto de entrega sea localizado al instante, el simulador implementa un buscador con **reconocimiento de lenguaje natural** y una arquitectura de fallback en 4 niveles:

1. **Normalizador de Intención Semántica (`normalizeSearchIntent`)**:
   - Limpia automáticamente prefijos conversacionales de obra (*"Obra en..."*, *"Entrega en..."*, *"Cerca a..."*, *"Sector..."*, *"Plaza de..."*), aislando la entidad geográfica central.
2. **Autocompletado en Vivo (Live Auto-suggestions)**:
   - Despliega un menú flotante con puntos de interés y direcciones detectadas en tiempo real mientras el usuario escribe (con debounce de 280 ms).
3. **Polarización Geográfica (Proximity Bias)**:
   - Sesgo geográfico centrado en la Sierra Central (`lat: -10.68, lon: -76.25`), priorizando de forma natural lugares de la región Pasco.
4. **Estrategia en Cascada Resiliente (Zero-Downtime)**:
   - **Nivel 1 (0 ms)**: Presets locales oficiales (instantáneo y sin consumo de red).
   - **Nivel 2**: Google Maps Geocoder (cuando la cuenta cuenta con facturación activa).
   - **Nivel 3 (<400 ms)**: Photon Geocoder (OSM / Komoot sin API key ni costo).
   - **Nivel 4**: OpenStreetMap Nominatim (respaldo secundario).

---

### 4. Modelo de Tarifación y Flete Logístico
El motor calcula de forma transparente la cotización según la fórmula:

$$\text{Costo Total} = \sum (\text{Volumen material} \times \text{Precio } \text{m}^3) + \text{Flete Base} + \text{Flete por Distancia}$$

* **Regla de Carga**: Los agregados no se mezclan en la misma tolva; cada material calcula sus propios viajes de volquete estándar (15 $\text{m}^3$).
* **Flete Base Operativo**: $\text{S/ } 90.00$ por viaje de volquete (incluye cargador frontal y salida de tolva en cantera).
* **Flete por Distancia**: $\text{S/ } 2.60 \text{ por km}$ recorrido por cada $10\text{ m}^3$ transportados, utilizando el kilometraje real por carretera de **GraphHopper Routing API**.

---

## 🚀 Módulos del Sistema

### 1. 🏗️ Portal de Constructoras / Clientes
* **Simulador y Calculadora de Flete Modular**:
  - Selección de cantera de origen con ficha técnica (altitud, coordenadas, descripción).
  - Cotizador multi-material dinámico: agregue múltiples tipos de agregados en una sola orden.
  - Trazado de ruta vial en **Google Maps** interactivo con marcadores y polyline real de carretera.
  - Desglose financiero transparente con opción de aplicar y generar pedido formal con un clic.
* **Flujo de Pago y Despacho Institucional**:
  - Modal con instrucciones de pago formal para el titular empresarial **SIS-AGREGADOS** (Cta. Corriente Interbank Soles).
  - Enlace automático a **WhatsApp Business** con el resumen estructurado de la orden para confirmación de pago y despacho inmediato.

### 2. 🚛 Portal Móvil del Conductor (Offline-First)
* **UI Optimizada para Cabina**: Interfaz ergonómica de alto contraste diseñada para teléfonos en campo.
* **Telemetría GPS en Vivo**: Monitoreo de precisión satelital y botón de navegación directa en Google Maps / Waze.
* **Control de Pesaje de Balanza**:
  - Registro de peso de entrada (tara) y salida (bruto) con cálculo de tonelaje neto transportado.
  - Captura fotográfica del ticket de balanza físico (con preview y almacenamiento en cola offline).
* **Certificación de Entrega en Obra**: Confirmación digital de recepción con nombre del encargado y comprobante fotográfico.

### 3. ⚙️ Consola de Control de Flotas (Administrador)
* **Monitoreo Centralizado de Despachos (`TripsList`)**:
  - Estado del volquete (*Pendiente $\rightarrow$ En Camino $\rightarrow$ En Balanza $\rightarrow$ Entregado*).
  - Control de pesajes registrados en balanza en toneladas métricas.
* **Gestión de Flota Vehicular y Catálogo Especializado (`VehiclesList` & `VehicleForm`)**:
  - Catálogo integrado de volquetes pesados para minería y construcción (*Volvo FMX, Scania XT Heavy Tipper, Mercedes-Benz Actros/Arocs, Iveco Trakker, Sinotruk HOWO, Shacman*).
  - Selección en cascada de marca/modelo con autocompletado de capacidad de tolva (15 a 20 $\text{m}^3$).
  - Validación de placa peruana MTC / SUNARP (`ABC-123`).
* **Gestión de Conductores (`DriversList` & `DriverForm`)**:
  - Validación de DNI (8 dígitos) y licencia de conducir MTC.
  - Enlace directo a WhatsApp para coordinaciones con el chofer.
  - Aprovisionamiento seguro de credenciales mediante RPC PostgreSQL (`SECURITY DEFINER`).
* **Despacho Logístico Desacoplado (`TripAssignModal` & `useTripDispatch`)**:
  - Asignación atómica de chofer y volquete libre a pedidos pendientes mediante RPC PostgreSQL `asignar_viaje`.

---

## 🏛️ Arquitectura de Software y Clean Code

El sistema aplica principios estrictos de **Clean Architecture**, **SOLID** y modularización:

```txt
src/
├── shared/                                 # Capa Compartida Transversal
│   ├── components/
│   │   ├── GoogleMapView.tsx               # Visor de mapa satelital interactivo
│   │   └── ModalContainer.tsx              # Componente base accesible (role="dialog", Escape, glassmorphism)
│   ├── constants/
│   │   └── materials.ts                    # Single Source of Truth para nombres y precios de agregados
│   ├── services/                           # Servicios de Infraestructura e I/O
│   │   ├── driversService.ts               # Gestión de conductores y generación criptográfica de claves
│   │   ├── freightService.ts               # Motor de fletes, presets y geocodificación multiescalón
│   │   ├── graphhopperService.ts           # Cliente de enrutamiento por carretera y altimetría
│   │   ├── storageService.ts               # Subida segura de tickets (validación 5MB, MIME y extensiones)
│   │   ├── supabase.ts                     # Cliente Supabase PostgreSQL
│   │   ├── tripsService.ts                 # Operaciones de viajes, pesaje y recursos de despacho
│   │   └── vehiclesService.ts              # CRUD de flota vehicular
│   └── utils/
│       └── supabaseRelations.ts            # Mappers puros para uniones relacionales de Supabase
│
├── features/                               # Módulos por Dominio de Negocio
│   ├── auth/
│   │   └── components/
│   │       ├── LoginForm.tsx               # Acceso unificado por roles
│   │       ├── RegisterForm.tsx            # Registro público forzado a rol CLIENTE
│   │       └── ForcePasswordChangeModal    # Barrera de seguridad para cambio obligatorio en primer acceso
│   │
│   ├── pedidos/
│   │   ├── components/
│   │   │   ├── OrdersList.tsx              # Listado general de pedidos de obra
│   │   │   ├── OrderForm.tsx               # Registro de pedidos con cuenta titular SIS-AGREGADOS
│   │   │   ├── OrderDispatchDetailsModal   # Modal atómico para ver detalles del volquete y chofer
│   │   │   ├── FreightCalculatorModal.tsx  # Orquestador limpio de simulación de fletes (147 líneas)
│   │   │   └── calculator/                 # Subcomponentes Atómicos del Cotizador
│   │   │       ├── QuarrySelector.tsx      # Selector de canteras de salida
│   │   │       ├── MaterialItemsList.tsx   # Lista multi-material dinámica
│   │   │       ├── DestinationPresetList   # Buscador con autocompletado y presets regionales
│   │   │       └── QuoteBreakdownCard.tsx  # Desglose financiero y métricas viales
│   │   └── hooks/
│   │       └── useFreightCalculator.ts     # Presenter Hook: Estado y debounce reactivo
│   │
│   └── viajes/
│       ├── components/
│       │   ├── DriverTripActive.tsx        # Orquestador de panel móvil del chofer (127 líneas)
│       │   ├── TripAssignModal.tsx         # Modal declarativo de despacho sin acoplamiento a BD
│       │   ├── TripsList.tsx               # Tabla de monitoreo de viajes para el Administrador
│       │   └── driver/                     # Subcomponentes Atómicos del Chofer
│       │       ├── TripInfoCard.tsx        # Stepper y datos del flete
│       │       ├── DriverGpsPanel.tsx      # GPS en vivo y navegación externa
│       │       ├── WeighingForm.tsx        # Registro de balanza y foto de ticket
│       │       └── DeliveryConfirmation    # Certificado final de entrega en obra
│       └── hooks/
│           ├── useDriverTripActions.ts     # Presenter Hook: GPS, cámara y sincronización offline
│           └── useTripDispatch.ts          # Presenter Hook: Asignación de despacho
│
└── pages/                                  # Vistas Raíz (Landing, AdminDashboard, ClientDashboard)
```

### Estándares de Calidad:
* **Cero `@Suppress` y `@Ignore`**: Se corrige la causa raíz de cualquier aviso de linting o tipado.
* **Una clase / componente por archivo**: Alta cohesión y máxima facilidad para pruebas unitarias.
* **Separación de Lógica y Presentación**: Componentes visuales limpios alimentados por Custom Hooks (Presenters) libres de JSX.

---

## 🛡️ Seguridad Integral y Migraciones de Base de Datos

La plataforma aplica el principio de **Defensa en Profundidad** (*Defense in Depth*), garantizando que las restricciones críticas de negocio y datos residan en la base de datos (PostgreSQL / RLS) y no solo en la interfaz:

1. **Inmutabilidad de Roles y Prevención de Escalada**:
   - `handle_new_user()` asigna de forma inmutable el rol `'CLIENTE'`, ignorando cualquier payload de registro alterado desde el cliente.
   - Trigger `BEFORE UPDATE ON public.usuarios` (`proteger_columna_rol`) que rechaza cualquier intento de auto-promoción de rol por parte de usuarios no administradores.
2. **Aprovisionamiento y Cambio Obligatorio de Contraseñas**:
   - Generación de claves temporales aleatorias de alta entropía mediante `crypto.getRandomValues()` en `driversService.ts`.
   - Bandera `requiere_cambio_password` en `public.usuarios` activada en la creación del chofer.
   - Interceptor en `ProtectedRoute.tsx` que despliega `ForcePasswordChangeModal.tsx`, bloqueando el acceso operativo hasta que el usuario establezca una clave personal y segura.
3. **Hardening de Supabase Storage (`tickets-balanza`)**:
   - RLS en `storage.objects` restringido para subidas exclusivamente a `CONDUCTOR` y `ADMINISTRADOR`.
   - Validación de tipos MIME autorizados (`image/jpeg`, `image/png`, `image/webp`) y límite estricto de 5 MB por archivo.
   - Protección contra listado masivo (`public_bucket_allows_listing`): el listado de archivos está reservado a Administradores, manteniendo las URLs de descarga públicas operativas.
4. **Principio de Menor Privilegio (Least Privilege) en RPCs**:
   - Blindaje de `SET search_path = public, auth, pg_temp;` en todas las funciones con privilegios elevados (`SECURITY DEFINER`).
   - Revocación de `EXECUTE` a usuarios anónimos (`anon` y `PUBLIC`) en todas las funciones de negocio e internas de trigger.

### Despliegue de Migraciones en Supabase:
Las migraciones versionadas se encuentran en `supabase/migrations/`:
- `20260527_seed_users_storage_and_trip_guards.sql`: Semilla base y políticas iniciales.
- `20260905_admin_create_driver_rpc.sql`: Procedimiento atómico para registro de choferes.
- `20260906_security_hardening.sql`: Script integral de hardening, inmutabilidad de roles y cierre de privilegios.

Para aplicarlas, copie el contenido de la migración en el **SQL Editor** del panel de control de Supabase y ejecute el script.

---

## 🛠️ Stack Tecnológico

* **Frontend**: React 19 + Vite 8 + TypeScript (Modo Estricto).
* **Estilizado**: Tailwind CSS v4 + Lucide React Icons.
* **Gestión de Estado**: Zustand (sesión y autenticación global).
* **Motores Geoespaciales**:
  * **Google Maps Platform** (Maps JavaScript API).
  * **GraphHopper Routing API** (perfil vial de carga pesada).
  * **Photon / Komoot OpenStreetMap** (geocodificación de alta velocidad con proximity bias).
* **Persistencia Offline**: IndexedDB nativo (`offlineDb.ts`) para fotos de tickets y cola transaccional.
* **Backend como Servicio (BaaS)**: Supabase (PostgreSQL 15+).
  * **Row Level Security (RLS)**: Aislamiento por roles (`ADMINISTRADOR`, `CONDUCTOR`, `CLIENTE`).
  * **Stored Procedures (RPC)**: `asignar_viaje`, `registrar_ticket_balanza`, `confirmar_entrega`, `admin_crear_conductor`, `marcar_password_actualizada`.
  * **Supabase Storage**: Bucket `tickets-balanza` con cuota de 5 MB y validación MIME.
* **Gestor de Paquetes**: `pnpm` v11.4+.

---

## ⚙️ Variables de Entorno

Crea tu archivo `.env.local` a partir de la plantilla:

```bash
cp .env.example .env.local
```

Configura las claves de servicio:

```env
# Supabase BaaS
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu-anon-key

# Google Maps Platform (Mapas interactivos)
VITE_GOOGLE_MAPS_API_KEY=tu-google-maps-api-key

# GraphHopper Routing API (Cálculo de distancias viales por carretera)
VITE_GRAPHHOPPER_API_KEY=tu-graphhopper-api-key
```

---

## 🚦 Ejecución en Desarrollo

```bash
# Instalar dependencias
pnpm install

# Iniciar servidor local
pnpm dev
```

### Comandos de Verificación de Calidad:
```bash
# Verificación de linting (ESLint estricto)
pnpm run lint

# Verificación de tipos TypeScript y build de producción
pnpm run build
```

---

## 📜 Licencia

Desarrollado como plataforma integral para la modernización de la cadena de suministro y transporte de áridos en la región Pasco. Todos los derechos reservados.
