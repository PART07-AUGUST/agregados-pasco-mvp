# 🚛 Agregados Pasco - MVP de Control Logístico

> **Producto Mínimo Viable (MVP) para la gestión y transporte de agregados (arena, piedra, afirmado), ambientado operativamente en Cerro de Pasco, Perú (4,380 m s.n.m.).**

Este sistema web está diseñado para conectar de manera segura y eficiente a administradores de flota, conductores de volquetes y constructoras clientes, optimizando el ciclo logístico de cantera a obra, incluso bajo condiciones extremas y de baja conectividad altoandina.

---

## 📌 Contexto de Negocio

El transporte de materiales de construcción en Cerro de Pasco afronta dos grandes desafíos:
1. **Altitud y Clima Extremo**: Exige el control de flotas con volquetes de doble tracción aptos para torque a gran altura.
2. **Brecha de Conectividad**: Las canteras principales (*Quiulacocha*, *Tinyahuarco*) carecen de cobertura celular estable. Este MVP implementa una arquitectura **Offline-First** (apoyada en **IndexedDB**) que permite a los conductores registrar tickets de balanza de forma local en el navegador y sincronizarlos automáticamente al recuperar señal.

---

## 🛠️ Stack Tecnológico

El proyecto está construido bajo una arquitectura limpia sin servidores intermedios, conectando de forma directa al cliente React con el motor transaccional y seguridad de Supabase.

* **Frontend**: React 19 + Vite 8 + TypeScript (Estricto).
* **Styling**: Tailwind CSS v4 (mediante el plugin oficial `@tailwindcss/vite`).
* **Estado e Iconos**: Zustand (gestión de estado ligero) + Lucide Icons.
* **Persistencia Local**: IndexedDB nativo de alto rendimiento (para soporte offline y retención de imágenes binarias).
* **Backend como Servicio (BaaS)**: Supabase (PostgreSQL + Auth + Storage).
* **Seguridad y Control**: Row Level Security (RLS) + PostgreSQL Triggers + RPC Functions.
* **Gestor de Paquetes**: `pnpm` (exclusivo).

---

## 🔐 Seguridad y Variables de Entorno

Para salvaguardar la seguridad del código fuente y proteger las credenciales de infraestructura, el proyecto implementa las siguientes directivas:

1. **Exclusión de Archivos Sensibles**:
   * El archivo `.env.local` que almacena tus API keys de Supabase locales está configurado y excluido en [.gitignore](.gitignore) para evitar que se filtre accidentalmente en repositorios públicos.
   * El archivo `.npmrc` restringe la descarga de dependencias con menos de **7 días de publicadas** (`minimum-release-age=10080`), protegiendo la base del código contra ataques de suplantación y malware en el supply chain.

2. **Configuración de Variables de Entorno**:
   Crea tu configuración local renombrando el archivo `.env.example`:
   ```bash
   cp .env.example .env.local
   ```
   Luego edita `.env.local` y añade tus credenciales privadas de Supabase:
   ```env
   VITE_SUPABASE_URL=https://tu-proyecto-id.supabase.co
   VITE_SUPABASE_PUBLISHABLE_KEY=tu-publishable-key-segura
   ```

---

## 📁 Estructura Modular del Proyecto (SOLID)

La aplicación sigue una **arquitectura por capas desacoplada** combinada con **módulos por características (features)**:

```txt
src/
 ├── app/                  # Configuraciones globales y proveedores de contexto
 ├── features/             # Características modulares aisladas (SOLID)
 │    ├── auth/            # Módulo de Autenticación, sesión y roles
 │    ├── pedidos/         # Gestión de pedidos de constructoras
 │    ├── viajes/          # Control de viajes y OfflineQueueManager
 │    ├── vehiculos/       # Registro y estado de la flota de volquetes
 │    └── usuarios/        # Gestión de perfiles públicos
 │
 ├── shared/               # Recursos transversales reutilizables
 │    ├── components/      # UI Atoms/Molecules transversales
 │    ├── hooks/           # Custom React hooks
 │    ├── services/        # Clientes de API e infraestructura (supabase.ts, offlineDb.ts)
 │    ├── types/           # Tipados e interfaces del dominio base
 │    └── validations/     # Funciones puras de validación de negocio
 │
 ├── main.tsx              # Punto de entrada de la aplicación
 └── index.css             # Estilos globales y tema industrial Slate/Amber
```

---

## 🚦 Guía de Desarrollo y Pruebas Locales

### 1. Prerrequisitos e Instalación
Tener instalado Node.js (v22 o superior) y el gestor de paquetes `pnpm` globalmente:
```bash
npm install -g pnpm
pnpm install
```

### 2. Configurar Infraestructura de Supabase
Para realizar pruebas transaccionales de extremo a extremo, configura tu instancia de Supabase de la siguiente manera:

#### A. Inicializar Base de Datos (Esquema y Relaciones)
Ve al **SQL Editor** de Supabase, crea una nueva consulta y ejecuta el script completo de migraciones que se encuentra en:
* [supabase/migrations/20260527_init_schema.sql](supabase/migrations/20260527_init_schema.sql)

*(Este script inicializará las tablas, CHECK constraints para placas/DNI, disparadores y las funciones RPC como `asignar_viaje` y `registrar_ticket_balanza` bajo SECURITY DEFINER).*

#### B. Configurar Supabase Auth (Desactivar Confirmación de Correo)
Para poder crear usuarios de prueba rápidamente sin requerir enlaces de verificación de correo reales:
1. Ve a **Authentication** $\rightarrow$ **Providers** $\rightarrow$ **Email**.
2. Desactiva la casilla **Confirm Email**.
3. Guarda los cambios.

#### C. Crear Cuentas de Prueba e Inicializar Roles
Ve a **Authentication** $\rightarrow$ **Users** $\rightarrow$ **Add User** $\rightarrow$ **Create User** y registra las siguientes credenciales:
* **Admin**: `admin@agregados.com` (Contraseña: `admin123`)
* **Conductor**: `conductor@agregados.com` (Contraseña: `conductor123`)
* **Constructora**: `constructora@agregados.com` (Contraseña: `constructora123`)

Una vez creados los usuarios en Supabase Auth, ve a tu **SQL Editor** y ejecuta la siguiente consulta para darles su rol y metadata real:
```sql
-- 1. Asignar Administrador
UPDATE public.usuarios SET rol = 'ADMINISTRADOR', nombre = 'Paolo Admin', dni = '74839201', celular = '987654321'
WHERE id IN (SELECT id FROM auth.users WHERE email = 'admin@agregados.com');

-- 2. Asignar Conductor
UPDATE public.usuarios SET rol = 'CONDUCTOR', nombre = 'Juan Conductor Pasco', dni = '87654321', celular = '912345678'
WHERE id IN (SELECT id FROM auth.users WHERE email = 'conductor@agregados.com');

-- 3. Asignar Cliente Constructora
UPDATE public.usuarios SET rol = 'CLIENTE', nombre = 'Constructora Los Andes S.A.C.', dni = '44556677', celular = '998877665', ruc = '20123456789'
WHERE id IN (SELECT id FROM auth.users WHERE email = 'constructora@agregados.com');
```

#### D. Configurar Supabase Storage (Fotos de Tickets)
Para habilitar la carga física de las fotos de los tickets de balanza de los choferes:
1. Ve a **Storage** $\rightarrow$ **New bucket**.
2. Nómbralo exactamente: **`tickets-balanza`**.
3. Configúralo como **Public bucket (ON)** y haz clic en crear.
4. Ve a la pestaña **Policies** de Storage y ejecuta el siguiente SQL en el editor de base de datos para habilitar permisos de subida:
```sql
CREATE POLICY "Permitir subidas en tickets-balanza" ON storage.objects FOR INSERT TO public WITH CHECK (bucket_id = 'tickets-balanza');
CREATE POLICY "Permitir lectura en tickets-balanza" ON storage.objects FOR SELECT TO public USING (bucket_id = 'tickets-balanza');
```

### 3. Ejecutar y Probar la Aplicación
Corre el servidor local de desarrollo:
```bash
pnpm dev
```
1. Entra a `http://localhost:5173/login` con `admin@agregados.com` $\rightarrow$ **Dashboard Admin**:
   * Pestaña **Flota Vehicular**: Registra un nuevo volquete y asígnale a *Juan Conductor Pasco* (aparecerá en la lista).
   * Pestaña **Pedidos de Obra**: Registra un pedido a nombre de *Constructora Los Andes S.A.C.* (aparecerá en la lista) y despáchalo asignándole el vehículo Scania creado.
2. Abre una ventana de incógnito o en tu celular y loguéate con `conductor@agregados.com` $\rightarrow$ **Portal del Conductor**:
   * Presiona **Iniciar Viaje** (puedes probar apagando el Wi-Fi en DevTools para ver el soporte offline en acción).
   * Rellena los pesajes de balanza y toma una foto de prueba del ticket (se guardará de forma nativa e invisible en IndexedDB si estás sin señal).
   * Presiona **Confirmar Entrega** para liberar los recursos.

---

## 🛣️ Hoja de Ruta de Desarrollo

* **[x] Fase 1**: Configuración Base, Estructura Modular, Validaciones de Dominio y Landing Page.
* **[x] Fase 2**: Diseño de Base de Datos SQL, Relaciones, Seguridad RLS y RPCs de Supabase.
* **[x] Fase 3**: Autenticación, Control de Sesión y Perfiles de Usuarios por Roles.
* **[x] Fase 4**: Panel de Control Administrativo (CRUD Pedidos, Vehículos y Asignación de Viajes).
* **[x] Fase 5**: Interfaz Móvil para el Conductor (Pesaje, Carga de Fotos y Guía de Transporte).
* **[x] Fase 6**: Mecanismo de Persistencia con IndexedDB y Sincronización Offline.
