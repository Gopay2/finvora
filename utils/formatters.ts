/**
 * Utilidades centralizadas de formateo de datos para la aplicación.
 */

/**
 * Formatea un número como moneda en Pesos Mexicanos (MXN).
 *
 * @param amount - Cantidad numérica a formatear
 * @param minimumFractionDigits - Cantidad mínima de decimales (default: 0)
 * @param maximumFractionDigits - Cantidad máxima de decimales (default: 2)
 * @returns Cadena con el monto formateado (ej. "$1,500" o "$1,500.50")
 */
export function formatMoney(
  amount: number,
  minimumFractionDigits: number = 0,
  maximumFractionDigits: number = 2
): string {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    minimumFractionDigits,
    maximumFractionDigits,
  }).format(amount);
}

/**
 * Formato abreviado de moneda para chips, badges y botones compactos.
 *
 * @param amount - Cantidad numérica a formatear
 * @returns Cadena con el monto precedido por "$" (ej. "$500")
 */
export function formatShortMoney(amount: number): string {
  return formatMoney(amount, 0, 2);
}
