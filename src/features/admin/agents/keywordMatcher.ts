const normalizar = (texto: string): string =>
  texto.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

const REGEX_CALCULO = /calcul|consumo|cuanto cuest|cuanto gast|cuanto consum|costo|costaria|galon|diesel|combustible/;
const REGEX_ANOMALIA = /anomal|exceso|desvio|sobrecosto|sobreconsumo|fuga|auditor/;
const REGEX_FORMULA = /formula|modelo|coeficiente|ecuacion/;
const REGEX_FLOTA = /volquete|flota|camion|pedido|despacho|chofer|conductor|disponible|libre|atender|asign/;

export function matchesCalculo(texto: string): boolean {
  return REGEX_CALCULO.test(normalizar(texto));
}

export function matchesAnomalia(texto: string): boolean {
  return REGEX_ANOMALIA.test(normalizar(texto));
}

export function matchesFormula(texto: string): boolean {
  return REGEX_FORMULA.test(normalizar(texto));
}

export function matchesFlota(texto: string): boolean {
  return REGEX_FLOTA.test(normalizar(texto));
}

export function matchesCombustible(texto: string): boolean {
  const norm = normalizar(texto);
  return REGEX_CALCULO.test(norm) || REGEX_ANOMALIA.test(norm) || REGEX_FORMULA.test(norm);
}
