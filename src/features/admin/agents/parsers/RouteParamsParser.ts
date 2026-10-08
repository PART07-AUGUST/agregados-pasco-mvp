export interface RouteParams {
  distanciaKm?: number;
  desnivelMetros?: number;
  pesoCargaTon?: number;
  volumenM3?: number;
}

const DENSIDAD_AGREGADO_TON_POR_M3 = 1.45;

export class RouteParamsParser {
  static parse(texto: string): RouteParams {
    const distancia = this.match(texto, /(\d+(?:[.,]\d+)?)\s*(?:km|kil[oó]metros?)\b/i);
    const volumen = this.match(texto, /(\d+(?:[.,]\d+)?)\s*(?:m³|m3|metros?\s+c[uú]bicos?)/i);
    const peso = this.match(texto, /(\d+(?:[.,]\d+)?)\s*(?:ton(?:eladas?)?|tn)\b/i);
    const desnivel =
      this.match(texto, /desnivel\s*(?:de)?\s*([+-]?\d+(?:[.,]\d+)?)/i) ??
      this.match(texto, /([+-]?\d+(?:[.,]\d+)?)\s*(?:m|metros?)(?![³3a-z])(?!\s+c[uú]bicos?)/i);

    const pesoDesdeVolumen =
      peso === undefined && volumen !== undefined
        ? Math.round(volumen * DENSIDAD_AGREGADO_TON_POR_M3 * 100) / 100
        : undefined;

    return {
      distanciaKm: distancia,
      desnivelMetros: desnivel,
      pesoCargaTon: peso ?? pesoDesdeVolumen,
      volumenM3: volumen,
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
