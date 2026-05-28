/**
 * Valida si una placa tiene el formato peruano estándar de tres letras, un guion y tres números (Ej. ABC-123 o A1B-123 para nuevas).
 */
export function validarPlaca(placa: string): boolean {
  const regex = /^[A-Z0-9]{3}-[0-9]{3}$/i;
  return regex.test(placa.trim());
}

/**
 * Valida si un DNI tiene exactamente 8 dígitos numéricos.
 */
export function validarDNI(dni: string): boolean {
  const regex =/^[0-9]{8}$/;
  return regex.test(dni.trim());
}

/**
 * Valida si un celular tiene exactamente 9 dígitos numéricos (comenzando con 9).
 */
export function validarCelular(celular: string): boolean {
  const regex = /^9[0-9]{8}$/;
  return regex.test(celular.trim());
}

/**
 * Valida si un RUC tiene exactamente 11 dígitos numéricos.
 */
export function validarRUC(ruc: string): boolean {
  const regex = /^[0-9]{11}$/;
  return regex.test(ruc.trim());
}

/**
 * Valida si el peso ingresado es un número positivo mayor que cero.
 */
export function validarPesoPositivo(peso: number): boolean {
  return typeof peso === 'number' && !isNaN(peso) && peso > 0;
}
