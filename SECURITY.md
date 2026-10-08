# 🛡️ Política y Matriz de Seguridad - SIS-AGREGADOS

> **Documento de Cumplimiento Normativo y Postura de Seguridad**  
> **Versión:** 1.1.0  
> **Última Auditoría:** Octubre 2026  
> **Marcos de Referencia:** CIS Controls v8, OWASP ASVS v4.0, ISO/IEC 27001:2022 (Anexo A)

---

## 1. Declaración de Postura de Seguridad (Executive Summary)

El sistema **SIS-AGREGADOS** gestiona operaciones críticas de despacho, pesaje y comercialización de agregados de cantera para minería y construcción civil en Cerro de Pasco. Este documento formaliza las defensas técnicas, controles de acceso y procedimientos de auditoría bajo el principio de **Defensa en Profundidad (Defense in Depth)** y **Mínimo Privilegio (Least Privilege)**.

---

## 2. Matriz de Cumplimiento (Compliance Mapping)

A continuación se detalla la correspondencia entre los controles internacionales y la arquitectura técnica implementada en el repositorio:

| Dominio de Seguridad | CIS Controls v8 | OWASP ASVS v4.0 | ISO/IEC 27001:2022 | Implementación en SIS-AGREGADOS | Estado |
| :--- | :--- | :--- | :--- | :--- | :---: |
| **Control de Acceso a Nivel de Datos** | Control 6: Access Control Management | V4: Access Control (V4.1, V4.2) | A.8.20 Control de acceso a redes y sistemas | **Row Level Security (RLS)** en PostgreSQL (`pedidos`, `viajes`, `usuarios`, `vehiculos`). Aislamiento multi-tenant validado por `auth.uid()`. | 🟢 Conforme |
| **Integridad de Modificación y RPCs** | Control 4: Secure Configuration of Assets | V1: Architecture & Threat Modeling (V1.4) | A.8.26 Arquitectura y principios de ingeniería segura | Prohibición de mutaciones directas `UPDATE`/`DELETE` en `viajes`. Mutaciones encapsuladas en RPCs `SECURITY DEFINER` (`iniciar_viaje`, `registrar_ticket_balanza`, `confirmar_entrega`). | 🟢 Conforme |
| **Cifrado de Credenciales y Secretos** | Control 3: Data Protection | V2: Authentication (V2.1, V2.4) | A.8.24 Uso de criptografía | Contraseñas cifradas mediante **bcrypt** (`crypt(..., gen_salt('bf'))`) en `auth.users`. Ausencia de contraseñas en texto plano. Separación estricta de `service_role_key`. | 🟢 Conforme |
| **Prevención de Inyección y Sanitización** | Control 4: Secure Configuration | V5: Validation, Sanitization and Encoding | A.8.28 Codificación segura | PostgREST con consultas parametrizadas nativas (Prepared Statements). Ausencia de SQL dinámico no sanitizado en PL/pgSQL (`SET search_path = public, auth, pg_temp`). | 🟢 Conforme |
| **Protección de Almacenamiento (Storage)** | Control 3: Data Protection | V8: Data Protection & Privacy | A.8.12 Prevención de fuga de datos | Políticas de Storage en bucket `tickets-balanza`: solo choferes y administradores pueden subir tickets; solo administradores pueden listar el bucket completo. | 🟢 Conforme |
| **Seguridad de la Cadena de Suministro** | Control 2: Software Asset Management | V14: Build and Deployment | A.8.8 Gestión de vulnerabilidades técnicas | Auditorías automáticas vía `pnpm audit`. Integridad garantizada mediante `pnpm-lock.yaml`. | 🟡 En Monitoreo |
| **Autenticación Multifactor (MFA)** | Control 6.3: Multi-Factor Authentication | V2.8: Multi-factor Authentication | A.8.5 Autenticación segura | Planificado para Administradores de base central y despacho. | 🔵 Roadmap |
| **Cabeceras HTTP de Protección (Edge/CDN)** | Control 4.8: Uninstall or Disable Unnecessary Services | V14.4: HTTP Security Headers | A.8.20 Redes y servicios web | Implementación de CSP, HSTS, X-Frame-Options y X-Content-Type-Options en capa de hosting (Vercel). | 🔵 Roadmap |

---

## 3. Arquitectura de Control de Acceso (Row Level Security & BOLA Prevention)

El 100% de las operaciones de lectura y escritura están gobernadas por políticas RLS activadas (`ENABLE ROW LEVEL SECURITY`) y funciones helper de aislamiento:

### A. Funciones de Aislamiento Antirrecursión (Anti-Recursion Helpers)
Para prevenir bloqueos por recursión circular en PostgreSQL, las relaciones cruzadas se evalúan mediante helpers con privilegios `SECURITY DEFINER` y alcance `STABLE`:
* `public.es_cliente_de_pedido(p_pedido_id, p_cliente_id)`: Asegura que un cliente solo audite viajes vinculados a sus órdenes de compra.
* `public.es_conductor_de_pedido(p_pedido_id, p_conductor_id)`: Permite al conductor leer el destino y material de su carga sin exponer la cartera de clientes.
* `public.es_vehiculo_de_cliente(p_vehiculo_id, p_cliente_id)`: Restringe la visibilidad de camiones a aquellos que despachan sus pedidos activos.

### B. Matriz de Permisos por Rol

| Tabla | Rol `CLIENTE` | Rol `CONDUCTOR` | Rol `ADMINISTRADOR` |
| :--- | :--- | :--- | :--- |
| **`public.usuarios`** | Solo su propio perfil + chofer de su pedido activo | Solo su propio perfil + cliente de su viaje activo | Todos los usuarios (lectura y registro) |
| **`public.pedidos`** | Solo sus propios pedidos (`cliente_id = auth.uid()`) | Solo el pedido asignado a su viaje activo | Acceso total (lectura y gestión) |
| **`public.viajes`** | Solo viajes de sus pedidos | Solo viajes donde esté asignado como chofer | Acceso total |
| **`public.vehiculos`** | Solo unidades que transportan su pedido | Unidades operativas para despacho | Toda la flota (inventario, placas, GPS) |
| **`public.ml_parametros`** | Lectura pública (cálculo de consumo y fletes) | Lectura pública | Modificación restringida a pipeline `service_role` |

---

## 4. Guía de Auditoría Dinámica (Pentesting Checklist para Desarrolladores)

Antes de fusionar código a `main`, todo desarrollador debe validar este checklist en su entorno local:

- [ ] **Test BOLA / IDOR:** Intentar consultar `/rest/v1/pedidos?select=*` con un token de `CONDUCTOR`. La respuesta debe ser `[]`.
- [ ] **Test Fuga de Flota:** Intentar consultar `/rest/v1/vehiculos?select=*` con un token de `CLIENTE`. La respuesta debe excluir camiones ajenos a sus obras.
- [ ] **Test Mutación Directa:** Intentar enviar un `PATCH` a `/rest/v1/viajes` con un token de chofer. La base de datos debe impedir la alteración arbitraria de pesos o estados.
- [ ] **Test Search Path Hijacking:** Toda función `SECURITY DEFINER` debe incluir explícitamente `SET search_path = public, auth, pg_temp`.
- [ ] **Test Fuga de Secretos:** Ningún archivo `.env` o código fuente debe exponer llaves maestras (`service_role`, credenciales de bases de datos o pasarelas de pago) con prefijo `VITE_`.

---

## 5. Reporte de Vulnerabilidades (Vulnerability Disclosure Policy)

Si detectas un fallo de seguridad o una política RLS permisiva:
1. **No abras un Issue público en GitHub.**
2. Envía un correo con el vector de ataque y la prueba de concepto (PoC) a: `seguridad@agregadospasco.pe`.
3. El equipo de ingeniería aplicará un parche y desplegará la migración correctiva en un plazo máximo de 48 horas bajo la política de divulgación coordinada.
