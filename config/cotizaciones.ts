/**
 * Configuración central de parámetros comerciales, recargos y reglas de zonas para Cotizaciones y Órdenes de Entrega.
 */

export interface TerminoPagoConfig {
  meses: number;
  semanas: number;
  recargoPorcentaje: number;
}

/**
 * Configuración de Términos de Pago (Plazos en meses, semanas equivalentes y porcentaje de recargo adicional).
 * Editables individualmente para ajustar las condiciones de crédito y cálculo de cuotas semanales:
 *  - 3 meses (13 semanas)  -> 30.70% recargo
 *  - 6 meses (26 semanas)  -> 58.20% recargo
 *  - 9 meses (39 semanas)  -> 114.90% recargo
 *  - 12 meses (52 semanas) -> 116.10% recargo
 */
export const TERMINOS_PAGO_CONFIG: TerminoPagoConfig[] = [
  { meses: 3, semanas: 13, recargoPorcentaje: 30.70 },
  { meses: 6, semanas: 26, recargoPorcentaje: 58.20 },
  { meses: 9, semanas: 39, recargoPorcentaje: 114.90 },
  { meses: 12, semanas: 52, recargoPorcentaje: 116.10 },
];

/**
 * Lista de zonas principales predeterminadas garantizadas en todos los selectores.
 */
export const ZONAS_PREDETERMINADAS = [
  "Córdoba",
  "Ensenada",
  "Guadalajara",
  "Mexicali",
  "Monterrey",
  "Rosarito",
  "Tijuana",
] as const;

/**
 * Mapeo centralizado de zonas hacia las siglas de modelo (TIJ, MTY, GDL)
 * y plaza de costo mayorista (Tijuana, Monterrey, Guadalajara).
 *
 * Reglas comerciales:
 * - Córdoba, Ensenada, Mexicali, Rosarito y Tijuana -> Solo influyen sobre modelos con "TIJ" (Costo base: Tijuana).
 * - Monterrey -> Solo influye sobre modelos con "MTY" (Costo base: Monterrey).
 * - Guadalajara -> Solo influye sobre modelos con "GDL" (Costo base: Guadalajara).
 */
export function getSiglaZonaPorNombre(zonaNombre: string): "tij" | "mty" | "gdl" | "" {
  if (!zonaNombre) return "";
  const norm = zonaNombre
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();

  // Zonas asociadas a TIJ (Tijuana, Ensenada, Mexicali, Rosarito, Córdoba)
  if (
    norm.includes("tijuana") ||
    norm.includes("tij") ||
    norm.includes("ensenada") ||
    norm.includes("mexicali") ||
    norm.includes("rosarito") ||
    norm.includes("cordoba")
  ) {
    return "tij";
  }

  // Zonas asociadas a MTY (Monterrey)
  if (norm.includes("monterrey") || norm.includes("mty")) {
    return "mty";
  }

  // Zonas asociadas a GDL (Guadalajara)
  if (norm.includes("guadalajara") || norm.includes("gdl")) {
    return "gdl";
  }

  return "";
}

/**
 * Retorna el nombre de la plaza principal de costo para una zona dada.
 */
export function getPlazaCostoPrincipal(zonaNombre: string): string {
  const sigla = getSiglaZonaPorNombre(zonaNombre);
  if (sigla === "tij") return "Tijuana";
  if (sigla === "mty") return "Monterrey";
  if (sigla === "gdl") return "Guadalajara";
  return zonaNombre;
}
