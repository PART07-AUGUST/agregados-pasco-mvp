import { validarDNI, validarRUC } from '../validations';

export interface DniResult {
  dni: string;
  nombres: string;
  apellidoPaterno: string;
  apellidoMaterno: string;
  nombreCompleto: string;
  fuente: 'RENIEC';
}

export interface RucResult {
  ruc: string;
  razonSocial: string;
  estado: string; // 'ACTIVO' | 'BAJA'
  condicion: string; // 'HABIDO' | 'NO HABIDO'
  direccion?: string;
  departamento?: string;
  provincia?: string;
  distrito?: string;
  fuente: 'SUNAT';
}

// Caché en memoria para evitar llamadas redundantes de un mismo documento en la sesión
const dniCache = new Map<string, DniResult>();
const rucCache = new Map<string, RucResult>();

export const peruIdentityService = {
  /**
   * Consulta los datos reales de un DNI ante RENIEC
   */
  async consultarDni(dni: string): Promise<DniResult> {
    const cleanDni = dni.trim();
    if (!validarDNI(cleanDni)) {
      throw new Error('El DNI debe tener exactamente 8 dígitos numéricos.');
    }

    if (dniCache.has(cleanDni)) {
      return dniCache.get(cleanDni)!;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    try {
      const response = await fetch(`https://api.apis.net.pe/v1/dni?numero=${cleanDni}`, {
        signal: controller.signal,
        headers: {
          'Accept': 'application/json',
        },
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        if (response.status === 404 || response.status === 422) {
          throw new Error(`El DNI ${cleanDni} no fue encontrado en el padrón oficial de RENIEC.`);
        }
        if (response.status === 429) {
          throw new Error('Límite de consultas simultáneas alcanzado. Por favor, espera unos segundos.');
        }
        throw new Error(`Error en el servicio de RENIEC (Código HTTP ${response.status}).`);
      }

      const data = await response.json();

      if (!data || (!data.nombre && !data.nombres)) {
        throw new Error(`No se obtuvieron registros oficiales para el DNI ${cleanDni}.`);
      }

      const nombres = (data.nombres || '').toUpperCase().trim();
      const apellidoPaterno = (data.apellidoPaterno || '').toUpperCase().trim();
      const apellidoMaterno = (data.apellidoMaterno || '').toUpperCase().trim();
      const nombreCompleto = (data.nombre || `${nombres} ${apellidoPaterno} ${apellidoMaterno}`).toUpperCase().trim();

      const result: DniResult = {
        dni: cleanDni,
        nombres,
        apellidoPaterno,
        apellidoMaterno,
        nombreCompleto,
        fuente: 'RENIEC',
      };

      dniCache.set(cleanDni, result);
      return result;
    } catch (err: unknown) {
      if (err instanceof Error) {
        if (err.name === 'AbortError') {
          throw new Error('Tiempo de espera agotado al conectar con RENIEC. Verifica tu conexión a internet.', { cause: err });
        }
        throw err;
      }
      throw new Error('Ocurrió un error al consultar los datos del DNI.', { cause: err });
    }
  },

  /**
   * Consulta los datos reales de un RUC ante la base oficial de SUNAT
   */
  async consultarRuc(ruc: string): Promise<RucResult> {
    const cleanRuc = ruc.trim();
    if (!validarRUC(cleanRuc)) {
      throw new Error('El RUC debe tener exactamente 11 dígitos numéricos.');
    }

    if (rucCache.has(cleanRuc)) {
      return rucCache.get(cleanRuc)!;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    try {
      const response = await fetch(`https://api.apis.net.pe/v1/ruc?numero=${cleanRuc}`, {
        signal: controller.signal,
        headers: {
          'Accept': 'application/json',
        },
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        if (response.status === 404 || response.status === 422) {
          throw new Error(`El RUC ${cleanRuc} no es válido o no está registrado en el padrón de SUNAT.`);
        }
        if (response.status === 429) {
          throw new Error('Límite de consultas simultáneas alcanzado. Por favor, espera unos segundos.');
        }
        throw new Error(`Error en el servicio de SUNAT (Código HTTP ${response.status}).`);
      }

      const data = await response.json();

      if (!data || (!data.nombre && !data.razonSocial)) {
        throw new Error(`No se encontró información tributaria para el RUC ${cleanRuc}.`);
      }

      const razonSocial = (data.nombre || data.razonSocial || '').toUpperCase().trim();
      const estado = (data.estado || 'ACTIVO').toUpperCase().trim();
      const condicion = (data.condicion || 'HABIDO').toUpperCase().trim();
      const direccion = (data.direccion || '').trim();
      const departamento = (data.departamento || '').trim();
      const provincia = (data.provincia || '').trim();
      const distrito = (data.distrito || '').trim();

      const result: RucResult = {
        ruc: cleanRuc,
        razonSocial,
        estado,
        condicion,
        direccion,
        departamento,
        provincia,
        distrito,
        fuente: 'SUNAT',
      };

      rucCache.set(cleanRuc, result);
      return result;
    } catch (err: unknown) {
      if (err instanceof Error) {
        if (err.name === 'AbortError') {
          throw new Error('Tiempo de espera agotado al conectar con SUNAT. Verifica tu conexión a internet.', { cause: err });
        }
        throw err;
      }
      throw new Error('Ocurrió un error al consultar los datos del RUC.', { cause: err });
    }
  },
};
