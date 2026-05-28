# 🚛 Sistema Web de Transporte de Agregados - Arquitectura y Desarrollo MVP

## 📌 Contexto General

Actúa como un Ingeniero de Software Full Stack Senior especializado en aplicaciones web empresariales modernas.

Vamos a construir un MVP (Producto Mínimo Viable) para un sistema web de gestión de transporte de agregados (arena, piedra, afirmado y materiales de construcción), ambientado operativamente en Cerro de Pasco, Perú.

El sistema será utilizado por:
- Administradores desde computadoras
- Conductores desde navegadores móviles (Chrome/Safari)

---

# ⚠️ Restricciones Obligatorias

## Tecnologías Permitidas

### Frontend
- React
- Vite
- TypeScript estricto
- React Router DOM
- TailwindCSS
- Supabase JS Client oficial
- Zustand o Context API

### Backend
- Supabase únicamente
  - PostgreSQL
  - Supabase Auth
  - Supabase Storage
  - Row Level Security (RLS)
  - RPC Functions

---

## 📦 Gestor de Paquetes Obligatorio

Usar `pnpm` como gestor de paquetes.

No usar:
- `npx`
- `npm install`
- `yarn`

Toda instalación debe realizarse con:

```bash
pnpm install
pnpm add paquete
pnpm add -D paquete
```

---

## 🔐 Seguridad en Instalación de Dependencias

Configurar `pnpm` para no instalar paquetes publicados hace menos de 7 días.

Crear o actualizar el archivo `.npmrc` con:

```ini
minimum-release-age=10080
```

Esto equivale a 10080 minutos = 7 días.

Objetivo:
- reducir riesgo de instalar paquetes recién publicados
- evitar dependencias maliciosas recientes
- mejorar seguridad del supply chain

Antes de instalar dependencias, verificar que el proyecto use `pnpm-lock.yaml`.

No usar comandos que descarguen y ejecuten paquetes directamente sin revisión previa.

---

## ❌ Tecnologías Prohibidas

No utilizar:
- Spring Boot
- Express.js
- Node.js Backend personalizado
- Firebase
- Next.js
- Flutter
- Android SDK
- Jetpack Compose
- Swift
- Kotlin Mobile
- Cualquier framework móvil nativo

---

# 🧱 Arquitectura Obligatoria

## Arquitectura por Capas

La aplicación debe seguir una arquitectura limpia por capas:

### 1. Capa de Presentación
- pages
- layouts
- components

### 2. Capa de Aplicación
- hooks
- stores
- context
- manejo de sesión
- casos de uso frontend

### 3. Capa de Dominio
- entidades
- interfaces
- types
- validaciones
- reglas de negocio

### 4. Capa de Infraestructura
- Supabase Client
- repositories
- services
- storage
- llamadas RPC
- persistencia local

---

# 📁 Arquitectura Modular por Features

```txt
src/
 ├── app/
 ├── features/
 │    ├── auth/
 │    ├── pedidos/
 │    ├── viajes/
 │    ├── vehiculos/
 │    ├── balanza/
 │    └── usuarios/
 │
 ├── shared/
 │    ├── components/
 │    ├── hooks/
 │    ├── services/
 │    ├── types/
 │    ├── utils/
 │    └── validations/
 │
 ├── routes/
 ├── layouts/
 ├── pages/
 └── main.tsx
```

---

# 📱 Diseño Responsive Obligatorio

La aplicación debe ser:
- Mobile First
- Responsive
- Optimizada para navegadores móviles
- Compatible con escritorio

---

# 🎨 Requisitos UX/UI

Diseño:
- Dashboard logístico moderno
- Estilo industrial/minero
- Sidebar responsive
- Cards grandes para conductores
- Botones táctiles visibles
- Estados de viaje visuales
- Indicadores de carga y sincronización

---

# 🗄️ Arquitectura de Datos

## Conexión Directa

La aplicación utilizará:

Frontend React
⬇
Supabase JS Client
⬇
Supabase PostgreSQL/Auth/Storage

NO debe existir backend intermedio.

---

# 🔐 Seguridad Obligatoria

Todas las tablas deben usar:
- Row Level Security (RLS)
- Políticas de acceso
- Protección por roles

## Roles del sistema
- ADMINISTRADOR
- CONDUCTOR
- CLIENTE

---

# ⚙️ Reglas de Seguridad RLS

## ADMINISTRADOR
- Acceso total

## CONDUCTOR
- Solo puede:
  - ver sus viajes asignados
  - actualizar estados de sus viajes
  - registrar tickets

## CLIENTE
- Solo puede:
  - crear pedidos
  - ver sus pedidos

---

# ⚠️ Reglas de Desarrollo

## TypeScript
- Todo el código debe usar TypeScript estricto
- No usar `any`

## Manejo de errores
Todas las operaciones async deben:
- usar try/catch
- manejar loading states
- mostrar mensajes amigables
- prevenir doble envío

---

# 🧼 Clean Code y Principios SOLID

Todo el desarrollo debe seguir estrictamente:

## Clean Code
Aplicar:
- nombres descriptivos
- funciones pequeñas
- componentes reutilizables
- separación de responsabilidades
- evitar duplicación de código
- alta legibilidad
- modularidad
- código mantenible y escalable

## Principios SOLID

### S — Single Responsibility Principle
Cada componente, servicio o módulo debe tener una única responsabilidad.

### O — Open/Closed Principle
El sistema debe permitir extensión sin modificar código existente innecesariamente.

### L — Liskov Substitution Principle
Las abstracciones y contratos deben ser consistentes.

### I — Interface Segregation Principle
No crear interfaces gigantes o dependencias innecesarias.

### D — Dependency Inversion Principle
Depender de abstracciones y servicios desacoplados.

---

## Reglas Arquitectónicas

- Evitar lógica de negocio dentro de componentes visuales
- Separar UI, dominio y acceso a datos
- Usar services y repositories
- Mantener componentes desacoplados
- Evitar componentes monolíticos
- Evitar archivos extremadamente largos
- Priorizar reutilización y mantenibilidad

---

# 🔄 Persistencia Offline

Debido a zonas sin cobertura en Cerro de Pasco:

Implementar:
- localStorage
- persistencia temporal
- cola de sincronización
- reintentos automáticos
- botón "Reintentar sincronización"
- detección de conexión mediante navigator.onLine

---

# 📦 Supabase Storage

Las imágenes de tickets deben almacenarse en:
- Bucket: `tickets-balanza`

Flujo:
1. Subir imagen
2. Obtener URL pública
3. Guardar URL en base de datos

---

# 🧠 Arquitectura Transaccional

Todas las operaciones críticas deben usar RPC Functions de PostgreSQL.

Ejemplos:
- asignar_viaje()
- registrar_ticket_balanza()
- confirmar_entrega()

Esto evita inconsistencias entre:
- pedidos
- viajes
- vehículos

---

# 🧾 Validaciones Obligatorias

Implementar validaciones:
- placa formato ABC-123
- DNI 8 dígitos
- celular 9 dígitos
- RUC 11 dígitos
- pesos positivos
- transición secuencial de estados

---

# 🚦 Desarrollo por Fases (MUY IMPORTANTE)

⚠️ NO generar todo el sistema de una sola vez.

El desarrollo debe realizarse estrictamente por fases.

La IA debe generar únicamente la fase solicitada y esperar confirmación antes de continuar.

NO adelantar interfaces, módulos o lógica de fases posteriores.

---

# 📌 Fases del Proyecto

## Fase 1 — Configuración Base
Generar únicamente:
- React + Vite + TypeScript
- TailwindCSS
- Supabase Client
- Variables de entorno
- Arquitectura por capas
- Arquitectura modular
- Configuración inicial
- configuración de pnpm
- archivo `.npmrc` con `minimum-release-age=10080`

---

## Fase 2 — Base de Datos y Seguridad
Generar únicamente:
- Script SQL
- ENUMS PostgreSQL
- Relaciones
- Constraints
- Datos maestros
- RLS
- Policies
- RPC base

---

## Fase 3 — Autenticación
Generar únicamente:
- Login
- Manejo de sesión
- Consulta tabla usuarios
- Roles
- Protección de rutas

---

## Fase 4 — Módulo Administrador
Generar únicamente:
- Dashboard admin
- CRUD pedidos
- CRUD vehículos
- Asignación de viajes

---

## Fase 5 — Módulo Conductor
Generar únicamente:
- Vista móvil
- Flujo secuencial de viaje
- Registro de ticket
- Confirmación de entrega

---

## Fase 6 — Persistencia Offline
Generar únicamente:
- localStorage
- sincronización
- reintentos
- cola offline

---

## Fase 7 — Reportes
Generar únicamente:
- métricas
- dashboards
- estadísticas
- KPIs logísticos
