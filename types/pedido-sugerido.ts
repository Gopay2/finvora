/**
 * Definiciones de tipos e interfaces para el módulo de Pedido Sugerido (JCI).
 */

export type TipoAgrupacion = 'region' | 'ciudad';

/**
 * Representa una fila individual calculada para la tabla de Pedido Sugerido.
 */
export interface PedidoSugeridoFila {
  id: string;
  agrupacion: string; // Nombre de la Región (TIJ, GDL, MTY) o Ciudad (TIJUANA, ROSARITO, etc.)
  tipoAgrupacion: TipoAgrupacion;
  modelo: string; // Nombre comercial del modelo con especificaciones (ej: SAMSUNG A17 - 128GB / 4GB)
  marca: string; // Marca del equipo (ej: Samsung, Motorola, Honor)
  almacenamiento?: string; // Almacenamiento interno (ej: 128GB)
  ram?: string; // Memoria RAM (ej: 4GB)
  semana1: number; // Unidades vendidas en la Semana 1 (antepasada)
  semana2: number; // Unidades vendidas en la Semana 2 (pasada)
  sugerido: number; // Promedio redondeado a la unidad más cercana
}

/**
 * Metadatos y rango de fechas de una semana de análisis.
 */
export interface SemanaRangoInfo {
  fechaInicioIso: string;
  fechaFinIso: string;
  etiquetaCorta: string; // Ej: "10 a 16 Ago."
  etiquetaCompleta: string; // Ej: "10/08/2026 al 16/08/2026"
}

/**
 * Rangos temporales de las dos semanas previas completas evaluadas.
 */
export interface SemanasAnalizadas {
  semana1: SemanaRangoInfo; // Semana antepasada (Semana N - 2)
  semana2: SemanaRangoInfo; // Semana pasada (Semana N - 1)
}

/**
 * Métricas consolidadas del reporte para tarjetas de KPI superiores.
 */
export interface PedidoSugeridoKpis {
  totalSugerido: number;
  totalSemana1: number;
  totalSemana2: number;
  modeloLider: string;
}

/**
 * Propiedades transferidas desde el Server Component hacia la vista cliente.
 */
export interface PedidoSugeridoClientViewProps {
  filasRegion: PedidoSugeridoFila[];
  filasCiudad: PedidoSugeridoFila[];
  semanas: SemanasAnalizadas;
}
