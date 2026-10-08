export interface RouteParams {
  distanciaKm?: number;
  desnivelMetros?: number;
  pesoCargaTon?: number;
  volumenM3?: number;
  destinoDetectado?: string;
  esDistanciaReferencial?: boolean;
}

interface DestinoRegionalReferencia {
  nombres: string[];
  distanciaKm: number;
  desnivelMetros: number;
  nombreOficial: string;
}

const DESTINOS_REGIONALES: DestinoRegionalReferencia[] = [
  { nombres: ['tarma'], distanciaKm: 105, desnivelMetros: -1330, nombreOficial: 'Tarma' },
  { nombres: ['carhuamayo'], distanciaKm: 42, desnivelMetros: -260, nombreOficial: 'Carhuamayo' },
  { nombres: ['junin', 'junín'], distanciaKm: 65, desnivelMetros: -280, nombreOficial: 'Junín' },
  { nombres: ['huanuco', 'huánuco'], distanciaKm: 105, desnivelMetros: -2480, nombreOficial: 'Huánuco' },
  { nombres: ['yanacancha', 'san juan'], distanciaKm: 6, desnivelMetros: 50, nombreOficial: 'Yanacancha' },
  { nombres: ['chaupimarca'], distanciaKm: 4, desnivelMetros: 20, nombreOficial: 'Chaupimarca' },
  { nombres: ['tinyahuarco', 'villa pasco', 'colquijirca'], distanciaKm: 8, desnivelMetros: -50, nombreOficial: 'Tinyahuarco' },
  { nombres: ['huariaca'], distanciaKm: 45, desnivelMetros: -1440, nombreOficial: 'Huariaca' },
  { nombres: ['ninacaca'], distanciaKm: 32, desnivelMetros: -200, nombreOficial: 'Ninacaca' },
  { nombres: ['paucartambo'], distanciaKm: 78, desnivelMetros: -1500, nombreOficial: 'Paucartambo' },
  { nombres: ['la oroya', 'oroya'], distanciaKm: 125, desnivelMetros: -640, nombreOficial: 'La Oroya' },
  { nombres: ['oxapampa'], distanciaKm: 140, desnivelMetros: -2570, nombreOficial: 'Oxapampa' },
  { nombres: ['villa rica'], distanciaKm: 165, desnivelMetros: -2900, nombreOficial: 'Villa Rica' },
  { nombres: ['yanahuanca'], distanciaKm: 42, desnivelMetros: -1200, nombreOficial: 'Yanahuanca' },
];

const DENSIDAD_AGREGADO_TON_POR_M3 = 1.45;

export class RouteParamsParser {
  static parse(texto: string): RouteParams {
    const distancia = this.match(texto, /(\d+(?:[.,]\d+)?)\s*(?:km|kil[oó]metros?)\b/i);
    const volumen = this.match(texto, /(\d+(?:[.,]\d+)?)\s*(?:m³|m3|metros?\s+c[uú]bicos?)/i);
    const peso = this.match(texto, /(\d+(?:[.,]\d+)?)\s*(?:ton(?:eladas?)?|tn)\b/i);
    const desnivel =
      this.match(texto, /desnivel\s*(?:de)?\s*([+-]?\d+(?:[.,]\d+)?)/i) ??
      this.match(texto, /([+-]?\d+(?:[.,]\d+)?)\s*(?:m|metros?)(?![³3a-z])(?!\s+c[uú]bicos?)/i);

    const textoNormalizado = texto.toLowerCase();
    const destinoEncontrado = DESTINOS_REGIONALES.find((d) =>
      d.nombres.some((nombre) => textoNormalizado.includes(nombre))
    );

    const pesoDesdeVolumen =
      peso === undefined && volumen !== undefined
        ? Math.round(volumen * DENSIDAD_AGREGADO_TON_POR_M3 * 100) / 100
        : undefined;

    // Si el usuario especificó km numéricos explícitos, prevalecen; si no, usamos la distancia de referencia regional
    const distanciaFinal = distancia ?? destinoEncontrado?.distanciaKm;
    const desnivelFinal = desnivel ?? (distancia === undefined ? destinoEncontrado?.desnivelMetros : undefined);

    return {
      distanciaKm: distanciaFinal,
      desnivelMetros: desnivelFinal,
      pesoCargaTon: peso ?? pesoDesdeVolumen,
      volumenM3: volumen,
      destinoDetectado: destinoEncontrado?.nombreOficial,
      esDistanciaReferencial: distancia === undefined && destinoEncontrado !== undefined,
    };
  }

  private static match(texto: string, regex: RegExp): number | undefined {
    const resultado = texto.match(regex);
    if (!resultado) {
      return undefined;
    }
    const valor = parseFloat(resultado[1].replace(',', '.'));
    return Number.isFinite(valor) ? valor : undefined;
  }
}
