# Demo de conexión OpenPLC ↔ Node-RED

Esta primera etapa solo usa variables simuladas. OpenPLC Runtime v4 corre en Windows mediante Docker Desktop; un puente Python local habla Modbus TCP con el PLC y envía datos a Node-RED en Render por HTTPS. No se abren puertos del PLC hacia Internet.

```text
OpenPLC Runtime (Windows, 127.0.0.1:1502)
           ↕ Modbus TCP
puente Python local
           ↕ HTTPS + autenticación básica
Node-RED (Render Free)
```

## 1. Preparar OpenPLC en Windows

1. Inicia Docker Desktop y comprueba que esté usando contenedores Linux.
2. Desde la raíz de `Agregados`, ejecuta `docker compose -f digital-twin/openplc/compose.yaml up -d`. Se usa Runtime **v4.3.1**, compatible con el Editor v4.3.2 probado aquí. El Runtime escucha para el Editor en `https://localhost:8443`; no tiene una interfaz web propia. El puerto Modbus `1502` queda enlazado **solo a `127.0.0.1`**.
3. Instala [OpenPLC Editor v4](https://autonomylogic.com/download/), abre el proyecto [`openplc/project`](openplc/project) y selecciona **Device → Configuration → OpenPLC Runtime v4**. Conéctate a `127.0.0.1`. Si el runtime es nuevo, crea su primer usuario en el Editor y conserva esa contraseña de forma segura.
4. El proyecto ya incluye el programa [`openplc/project/pous/programs/main.st`](openplc/project/pous/programs/main.st) y el servidor Modbus/TCP habilitado en `0.0.0.0:1502` con `%QX` para coils 0–2. Usa **Build and upload**; el estado debe llegar a `PLC: RUNNING`.
5. Ejecuta `uv run --project digital-twin/bridge python digital-twin/bridge/check_plc.py` para comprobar la lectura, la escritura ON/OFF y el cambio periódico. El puerto `8443` es únicamente para el Editor; el puente usa `1502`.

Mapa Modbus, con direcciones **base cero**:

| Coil | Variable IEC | Uso |
| --- | --- | --- |
| 0 | `%QX0.0` | `pulse`, cambia cada 10 segundos en OpenPLC |
| 1 | `%QX0.1` | `remote_command`, escrito por el puente |
| 2 | `%QX0.2` | `command_ack`, copia del comando que calcula el PLC |

No conectes estas variables de prueba a salidas físicas. La [documentación de OpenPLC](https://edge.autonomylogic.com/docs/openplc-editor/communication/modbus/addressing/) explica la correspondencia entre coils y direcciones IEC.

## 2. Desplegar Node-RED en Render

El archivo [`render.yaml`](../render.yaml) documenta un servicio web **Free** en Virginia. Para esta demo se puede crear directamente un único servicio Docker desde la rama que contiene estos archivos, usando `digital-twin/node-red` como contexto y `digital-twin/node-red/Dockerfile` como Dockerfile. La imagen usa Node-RED 5.0.9 y carga [`node-red/flows.json`](node-red/flows.json) al iniciar.

Configura estos secretos en Render durante la creación del servicio:

| Variable | Valor |
| --- | --- |
| `NODE_RED_CREDENTIAL_SECRET` | Cadena aleatoria larga; permite cifrar credenciales de flujos |
| `NODE_RED_ADMIN_USER` | Usuario para el editor, por ejemplo `admin` |
| `NODE_RED_ADMIN_PASSWORD_HASH` | Hash bcrypt de una contraseña fuerte del editor |
| `NODE_RED_BRIDGE_USER` | Usuario distinto para el puente, por ejemplo `plc-bridge` |
| `NODE_RED_BRIDGE_PASSWORD_HASH` | Hash bcrypt de la contraseña del puente |

Puedes generar contraseñas aleatorias y hashes con `digital-twin/generate_credentials.py` (requiere el paquete Python `bcrypt`). Crea `digital-twin/.local/credentials.json`, `render-env.json` y `node-red.env`, todos excluidos de Git. El editor estará en `https://<servicio>.onrender.com/editor`; los endpoints `/plc/*` tienen autenticación básica independiente. Render proporciona HTTPS a la URL pública.

El plan Free pierde los cambios de archivos al reiniciar. Si cambias el flujo en el editor, exporta el JSON y actualiza `node-red/flows.json` en Git antes de desplegar de nuevo. El comando vuelve a `false` y el estado de conexión vuelve a desconectado después de cada reinicio. Render puede tardar en iniciar si el servicio se durmió.

## 3. Ejecutar el puente local

Necesitas Python 3.12 y `uv`. Ejecuta `python digital-twin/configure_bridge.py https://<servicio>.onrender.com` para crear el archivo `digital-twin/bridge/.env` con la URL y las credenciales originales del puente. Deben coincidir con las variables de Render. El archivo `.env` está excluido de Git.

Desde la raíz del proyecto:

```powershell
uv run --project digital-twin/bridge --env-file digital-twin/bridge/.env python digital-twin/bridge/bridge.py --once
uv run --project digital-twin/bridge --env-file digital-twin/bridge/.env python digital-twin/bridge/bridge.py
```

El puente lee las tres coils cada 5 segundos, publica la lectura, consulta el comando de Node-RED, escribe coil 1 y comprueba coil 2. Si Render o OpenPLC no responde, registra el fallo y reintenta el ciclo siguiente. Detenlo con `Ctrl+C`.

## 4. Probar ambos sentidos

1. Abre el editor de Node-RED en Render y mira **Debug**. `Lecturas de OpenPLC` debe mostrar `pulse` cambiando y `Estado de conexión` debe ponerse verde.
2. Pulsa **Comando ON** y comprueba en Debug que `Comando confirmado` indica `desired: true, observed: true`. Repite con **Comando OFF** y ambos valores en `false`.
3. Detén el puente: tras 15 segundos, `Estado de conexión` debe ponerse rojo. Reinícialo y verifica que vuelve a verde.
4. Reinicia el servicio de Render desde su panel y comprueba que el flujo reaparece, el comando es `false` y el puente se reconecta.

Para comprobar el contrato HTTP sin abrir el editor, ejecuta `python digital-twin/check_api.py https://<servicio>.onrender.com`. Para activar las pruebas desde la API protegida del Editor, usa `python digital-twin/set_command.py https://<servicio>.onrender.com on` y luego `off`; el puente debe estar en marcha para obtener la confirmación del PLC.

La API del puente usa JSON:

- `POST /plc/telemetry`: `{ "pulse": true, "command": false, "ack": false, "timestamp": "2026-11-04T12:00:00+00:00" }`
- `GET /plc/command`: `{ "desired": false, "version": 0 }`
- `POST /plc/ack`: `{ "desired": false, "observed": false, "version": 0 }`
