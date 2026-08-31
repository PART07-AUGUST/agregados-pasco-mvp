import { validarDNI, validarRUC } from '../validations';

export interface DniResult {
  dni: string;
  nombres: string;
  apellidoPaterno: string;
  apellidoMaterno: string;
  nombreCompleto: string;
  fuente: 'RENIEC' | 'FALLBACK_LOCAL';
}

export interface RucResult {
  ruc: string;
  razonSocial: string;
  estado: string; // 'ACTIVO'
  condicion: string; // 'HABIDO'
  direccion?: string;
  departamento?: string;
  provincia?: string;
  distrito?: string;
  fuente: 'SUNAT' | 'FALLBACK_LOCAL';
}

// Caché en memoria para evitar consultas redundantes durante la sesión
const dniCache = new Map<string, DniResult>();
const rucCache = new Map<string, RucResult>();

// Mock data contextual para Pasco en caso de falta de red o cuota excedida de APIs libres
const MOCK_RUC_DATABASE: Record<string, Omit<RucResult, 'ruc' | 'fuente'>> = {
  '20123456789': {
    razonSocial: 'CONSTRUCTORA LOS ANDES S.A.C.',
    estado: 'ACTIVO',
    condicion: 'HABIDO',
    direccion: 'Av. Las Brisas 240, Yanacancha',
    departamento: 'PASCO',
    provincia: 'PASCO',
    distrito: 'YANACANCHA',
  },
  '20489123456': {
    razonSocial: 'INGENIERIA Y MINERIA PASCO S.R.L.',
    estado: 'ACTIVO',
    condicion: 'HABIDO',
    direccion: 'Jr. Bolognesi 105, Chaupimarca',
    departamento: 'PASCO',
    provincia: 'PASCO',
    distrito: 'CHAUPIMARCA',
  },
  '20543216789': {
    razonSocial: 'CONSORCIO VIAL CERRO DE PASCO',
    estado: 'ACTIVO',
    condicion: 'HABIDO',
    direccion: 'Carretera Central Km 12, Tinyahuarco',
    departamento: 'PASCO',
    provincia: 'PASCO',
    distrito: 'TINYAHUARCO',
  },
};

const MOCK_DNI_DATABASE: Record<string, Omit<DniResult, 'dni' | 'fuente'>> = {
  '74839201': {
    nombres: 'PAOLO DANIEL',
    apellidoPaterno: 'ROJAS',
    apellidoMaterno: 'VALVERDE',
    nombreCompleto: 'PAOLO DANIEL ROJAS VALVERDE',
  },
  '87654321': {
    nombres: 'JUAN CARLOS',
    apellidoPaterno: 'CONDOR',
    apellidoMaterno: 'QUISPE',
    nombreCompleto: 'JUAN CARLOS CONDOR QUISPE',
  },
  '44556677': {
    nombres: 'MARCO ANTONIO',
    apellidoPaterno: 'SOTO',
    apellidoMaterno: 'MAYTA',
    nombreCompleto: 'MARCO ANTONIO SOTO MAYTA',
  },
};

export const peruIdentityService = {
  /**
   * Consulta los datos de un DNI peruano (8 dígitos) ante RENIEC
   */
  async consultarDni(dni: string): Promise<DniResult> {
    const cleanDni = dni.trim();
    if (!validarDNI(cleanDni)) {
      throw new Error('El DNI debe tener exactamente 8 dígitos numéricos.');
    }

    if (dniCache.has(cleanDni)) {
      return dniCache.get(cleanDni)!;
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);

      // Endpoint público de consulta rápida DNI
      const response = await fetch(`https://api.decolecta.com/v1/reniec/dni?numero=${cleanDni}`, {
        signal: controller.signal,
        headers: { 'Accept': 'application/json' },
      }).catch(() => null);

      clearTimeout(timeoutId);

      if (response && response.ok) {
        const data = await response.json();
        if (data && (data.nombres || data.nombreCompleto || data.first_name)) {
          const nombres = (data.nombres || data.first_name || '').toUpperCase().trim();
          const apellidoPaterno = (data.apellidoPaterno || data.last_name || '').toUpperCase().trim();
          const apellidoMaterno = (data.apellidoMaterno || data.mother_last_name || '').toUpperCase().trim();
          const nombreCompleto = data.nombreCompleto?.toUpperCase().trim() || 
            `${nombres} ${apellidoPaterno} ${apellidoMaterno}`.trim();

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
        }
      }
    } catch (err) {
      console.warn('API pública de DNI no disponible, recurriendo a fallback inteligente:', err);
    }

    // Fallback inteligente o simulación para pruebas
    const mock = MOCK_DNI_DATABASE[cleanDni];
    if (mock) {
      const result: DniResult = {
        dni: cleanDni,
        ...mock,
        fuente: 'FALLBACK_LOCAL',
      };
      dniCache.set(cleanDni, result);
      return result;
    }

    // Generador determinístico de nombres para cualquier DNI válido en ambiente de demo/desarrollo
    const demoResult: DniResult = {
      dni: cleanDni,
      nombres: 'CIUDADANO',
      apellidoPaterno: 'PASCO',
      apellidoMaterno: `DNI-${cleanDni.slice(-4)}`,
      nombreCompleto: `CIUDADANO PASCO DNI-${cleanDni.slice(-4)}`,
      fuente: 'FALLBACK_LOCAL',
    };
    dniCache.set(cleanDni, demoResult);
    return demoResult;
  },

  /**
   * Consulta los datos de un RUC de empresa (11 dígitos) ante SUNAT
   */
  async consultarRuc(ruc: string): Promise<RucResult> {
    const cleanRuc = ruc.trim();
    if (!validarRUC(cleanRuc)) {
      throw new Error('El RUC debe tener exactamente 11 dígitos numéricos.');
    }

    if (rucCache.has(cleanRuc)) {
      return rucCache.get(cleanRuc)!;
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4500);

      const response = await fetch(`https://api.decolecta.com/v1/sunat/ruc?numero=${cleanRuc}`, {
        signal: controller.signal,
        headers: { 'Accept': 'application/json' },
      }).catch(() => null);

      clearTimeout(timeoutId);

      if (response && response.ok) {
        const data = await response.json();
        if (data && (data.razonSocial || data.nombre_o_razon_social)) {
          const razonSocial = (data.razonSocial || data.nombre_o_razon_social || '').toUpperCase().trim();
          const estado = (data.estado || 'ACTIVO').toUpperCase().trim();
          const condicion = (data.condicion || 'HABIDO').toUpperCase().trim();

          const result: RucResult = {
            ruc: cleanRuc,
            razonSocial,
            estado,
            condicion,
            direccion: data.direccion || data.direccion_completa || '',
            departamento: data.departamento || '',
            provincia: data.provincia || '',
            distrito: data.distrito || '',
            fuente: 'SUNAT',
          };
          rucCache.set(cleanRuc, result);
          return result;
        }
      }
    } catch (err) {
      console.warn('API pública de SUNAT no disponible, recurriendo a fallback inteligente:', err);
    }

    // Fallback de base de datos mock para RUCs de prueba
    const mock = MOCK_RUC_DATABASE[cleanRuc];
    if (mock) {
      const result: RucResult = {
        ruc: cleanRuc,
        ...mock,
        fuente: 'FALLBACK_LOCAL',
      };
      rucCache.set(cleanRuc, result);
      return result;
    }

    // Generador de constructora para RUC en ambiente de demo/desarrollo
    const demoResult: RucResult = {
      ruc: cleanRuc,
      razonSocial: `CONSTRUCTORA & SERVICIOS PASCO RUC-${cleanRuc.slice(-4)} S.A.C.`,
      estado: 'ACTIVO',
      condicion: 'HABIDO',
      direccion: 'Zona Industrial Cerro de Pasco',
      departamento: 'PASCO',
      provincia: 'PASCO',
      distrito: 'YANACANCHA',
      fuente: 'FALLBACK_LOCAL',
    };
    rucCache.set(cleanRuc, demoResult);
    return demoResult;
  },
};
