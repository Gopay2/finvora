/**
 * Utilidades de cálculo temporal y normalización de productos para Pedido Sugerido.
 */

import { getTijuanaDate } from '@/utils/date-helpers';
import type { SemanasAnalizadas, SemanaRangoInfo } from '@/types/pedido-sugerido';

/**
 * Formatea una fecha en formato corto para etiquetas de tabla (ej: "10 a 16 Ago.").
 *
 * @param fechaInicio - Fecha de inicio de la semana
 * @param fechaFin - Fecha de fin de la semana
 * @returns Cadena con formato "DD a DD Mes."
 */
function formatearRangoSemanaCorto(fechaInicio: Date, fechaFin: Date): string {
  const diaInicio = new Intl.DateTimeFormat('es-MX', {
    timeZone: 'America/Tijuana',
    day: 'numeric',
  }).format(fechaInicio);

  const diaFin = new Intl.DateTimeFormat('es-MX', {
    timeZone: 'America/Tijuana',
    day: 'numeric',
  }).format(fechaFin);

  const mesFin = new Intl.DateTimeFormat('es-MX', {
    timeZone: 'America/Tijuana',
    month: 'short',
  }).format(fechaFin);

  const mesCapitalizado = mesFin.charAt(0).toUpperCase() + mesFin.slice(1);
  return `${diaInicio} a ${diaFin} ${mesCapitalizado}`;
}

/**
 * Formatea una fecha en formato completo numérico para reportes y Excel (ej: "10/08/2026 al 16/08/2026").
 */
function formatearRangoSemanaCompleto(fechaInicio: Date, fechaFin: Date): string {
  const formateador = new Intl.DateTimeFormat('es-MX', {
    timeZone: 'America/Tijuana',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

  return `${formateador.format(fechaInicio)} al ${formateador.format(fechaFin)}`;
}

/**
 * Construye el objeto SemanaRangoInfo con marcas temporales y etiquetas formateadas.
 */
function construirSemanaRango(fechaLunes: Date, fechaDomingo: Date): SemanaRangoInfo {
  return {
    fechaInicioIso: fechaLunes.toISOString(),
    fechaFinIso: fechaDomingo.toISOString(),
    etiquetaCorta: formatearRangoSemanaCorto(fechaLunes, fechaDomingo),
    etiquetaCompleta: formatearRangoSemanaCompleto(fechaLunes, fechaDomingo),
  };
}

/**
 * Calcula estrictamente las dos semanas calendario cerradas anteriores a la semana actual
 * bajo la zona horaria oficial del negocio (America/Tijuana).
 *
 * - Si hoy estamos en la semana en curso (Lunes a Domingo):
 *   - Semana 2 (más reciente): Lunes 00:00:00 a Domingo 23:59:59 de la semana anterior.
 *   - Semana 1 (antepasada): Lunes 00:00:00 a Domingo 23:59:59 de la semana previa a Semana 2.
 */
export function getDosSemanasAnterioresTijuana(fechaReferencia: Date = new Date()): SemanasAnalizadas {
  // 1. Obtener fecha actual en zona horaria Tijuana en formato YYYY-MM-DD
  const formatoCadenaTijuana = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Tijuana',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(fechaReferencia);

  const [anioActual, mesActual, diaActual] = formatoCadenaTijuana.split('-').map(Number);

  // 2. Determinar el día de la semana actual (0 = Domingo, 1 = Lunes, ..., 6 = Sábado)
  const fechaUtcBase = new Date(Date.UTC(anioActual, mesActual - 1, diaActual));
  const diaDeSemana = fechaUtcBase.getUTCDay();
  const diasDesdeLunes = diaDeSemana === 0 ? 6 : diaDeSemana - 1;

  // Lunes de la semana en curso
  const lunesSemanaActual = new Date(fechaUtcBase);
  lunesSemanaActual.setUTCDate(fechaUtcBase.getUTCDate() - diasDesdeLunes);

  // 3. Semana 2 (semana pasada): Lunes = lunes actual - 7 días, Domingo = lunes actual - 1 día
  const lunesSemana2Helper = new Date(lunesSemanaActual);
  lunesSemana2Helper.setUTCDate(lunesSemanaActual.getUTCDate() - 7);

  const domingoSemana2Helper = new Date(lunesSemanaActual);
  domingoSemana2Helper.setUTCDate(lunesSemanaActual.getUTCDate() - 1);

  const lunesSemana2 = getTijuanaDate(
    lunesSemana2Helper.getUTCFullYear(),
    lunesSemana2Helper.getUTCMonth(),
    lunesSemana2Helper.getUTCDate(),
    0, 0, 0, 0
  );

  const domingoSemana2 = getTijuanaDate(
    domingoSemana2Helper.getUTCFullYear(),
    domingoSemana2Helper.getUTCMonth(),
    domingoSemana2Helper.getUTCDate(),
    23, 59, 59, 999
  );

  // 4. Semana 1 (semana antepasada): Lunes = lunes actual - 14 días, Domingo = lunes actual - 8 días
  const lunesSemana1Helper = new Date(lunesSemanaActual);
  lunesSemana1Helper.setUTCDate(lunesSemanaActual.getUTCDate() - 14);

  const domingoSemana1Helper = new Date(lunesSemanaActual);
  domingoSemana1Helper.setUTCDate(lunesSemanaActual.getUTCDate() - 8);

  const lunesSemana1 = getTijuanaDate(
    lunesSemana1Helper.getUTCFullYear(),
    lunesSemana1Helper.getUTCMonth(),
    lunesSemana1Helper.getUTCDate(),
    0, 0, 0, 0
  );

  const domingoSemana1 = getTijuanaDate(
    domingoSemana1Helper.getUTCFullYear(),
    domingoSemana1Helper.getUTCMonth(),
    domingoSemana1Helper.getUTCDate(),
    23, 59, 59, 999
  );

  return {
    semana1: construirSemanaRango(lunesSemana1, domingoSemana1),
    semana2: construirSemanaRango(lunesSemana2, domingoSemana2),
  };
}

/**
 * Identifica la Región Comercial principal (TIJ, GDL, MTY) a partir del nombre del modelo o producto.
 * En Finvora, los modelos llevan en su nomenclatura "TIJ", "MTY" o "GDL".
 *
 * @param textoModelo - Nombre del modelo o producto (ej: "SAMSUNG A15 TIJ")
 * @returns "TIJ" | "GDL" | "MTY"
 */
export function identificarRegionDeModelo(textoModelo: string): 'TIJ' | 'GDL' | 'MTY' {
  if (!textoModelo) return 'TIJ';
  const normalizado = textoModelo.toUpperCase().trim();

  if (normalizado.includes('MTY') || normalizado.includes('MONTERREY')) {
    return 'MTY';
  }
  if (normalizado.includes('GDL') || normalizado.includes('GUADALAJARA')) {
    return 'GDL';
  }
  return 'TIJ';
}

/**
 * Limpia las siglas de región técnicas del modelo para mostrarlo limpio en la tabla (ej. "SAMSUNG A17").
 *
 * @param modeloOriginal - Nombre original del modelo (ej: "SAMSUNG A17 TIJ", "MOTO G56 (MTY)")
 * @param marca - Marca opcional para asegurar que el modelo empiece con la marca si no la tiene
 * @returns Nombre de modelo limpio y presentado para compras
 */
export function limpiarNombreModeloComercial(modeloOriginal: string, marca?: string): string {
  if (!modeloOriginal) return 'Modelo Desconocido';

  // Remover siglas regionales entre paréntesis o al final de la cadena
  let modeloLimpio = modeloOriginal
    .replace(/\b(TIJ|MTY|GDL)\b/gi, '')
    .replace(/\s*\(\s*\)\s*/g, '')
    .replace(/\s*-\s*$/g, '')
    .replace(/\s{2,}/g, ' ')
    .trim();

  // Si la marca no está incluida al principio del modelo, se la prefijamos para máxima claridad
  if (marca && marca.trim()) {
    const marcaLimpia = marca.trim().toUpperCase();
    if (!modeloLimpio.toUpperCase().startsWith(marcaLimpia)) {
      modeloLimpio = `${marcaLimpia} ${modeloLimpio}`;
    }
  }

  return modeloLimpio.toUpperCase();
}

/**
 * Mapea la sigla regional a su nombre completo oficial para visualización en la tabla (Tijuana, Monterrey, Guadalajara).
 *
 * @param regionSigla - Sigla ("TIJ", "GDL", "MTY")
 * @returns "Tijuana" | "Guadalajara" | "Monterrey"
 */
export function mapearNombreRegionCompleto(regionSigla: string): string {
  const normalizado = (regionSigla || '').toUpperCase().trim();
  if (normalizado === 'TIJ' || normalizado.includes('TIJUANA')) return 'Tijuana';
  if (normalizado === 'GDL' || normalizado.includes('GUADALAJARA')) return 'Guadalajara';
  if (normalizado === 'MTY' || normalizado.includes('MONTERREY')) return 'Monterrey';
  return regionSigla;
}

/**
 * Formatea el nombre del modelo incorporando RAM y Almacenamiento (sin color)
 * para distinguir versiones específicas con diferente memoria.
 *
 * @param modeloOriginal - Nombre base del producto (ej: "A15 TIJ")
 * @param marca - Marca del equipo (ej: "SAMSUNG")
 * @param almacenamiento - Capacidad de almacenamiento (ej: "128GB")
 * @param ram - Memoria RAM (ej: "4GB")
 * @returns Nombre descriptivo completo (ej: "SAMSUNG A15 - 128GB / 4GB")
 */
export function formatearModeloConSpecs(
  modeloOriginal: string,
  marca?: string,
  almacenamiento?: string,
  ram?: string
): string {
  const base = limpiarNombreModeloComercial(modeloOriginal, marca);
  const specs: string[] = [];

  let almacenamientoNormalizado = (almacenamiento || '').trim();
  let ramNormalizada = (ram || '').trim();

  // Normalizar espacios y asegurar sufijo GB si es numérico puro (ej: "128" -> "128GB")
  if (almacenamientoNormalizado) {
    almacenamientoNormalizado = almacenamientoNormalizado.replace(/\s+/g, '');
    if (/^\d+$/.test(almacenamientoNormalizado)) {
      almacenamientoNormalizado = `${almacenamientoNormalizado}GB`;
    }
  }

  if (ramNormalizada) {
    ramNormalizada = ramNormalizada.replace(/\s+/g, '');
    if (/^\d+$/.test(ramNormalizada)) {
      ramNormalizada = `${ramNormalizada}GB`;
    }
  }

  if (almacenamientoNormalizado && !base.toUpperCase().includes(almacenamientoNormalizado.toUpperCase())) {
    specs.push(almacenamientoNormalizado.toUpperCase());
  }
  if (ramNormalizada && !base.toUpperCase().includes(ramNormalizada.toUpperCase())) {
    specs.push(ramNormalizada.toUpperCase());
  }

  if (specs.length > 0) {
    return `${base} - ${specs.join(' / ')}`;
  }
  return base;
}

/**
 * Calcula la cantidad sugerida de compra aplicando la regla de negocio:
 * Promedio de ventas de las 2 semanas redondeado al número entero más cercano.
 *
 * @param ventasSemana1 - Unidades vendidas en Semana 1
 * @param ventasSemana2 - Unidades vendidas en Semana 2
 * @returns Cantidad de unidades sugeridas para compra
 */
export function calcularCantidadSugerida(ventasSemana1: number, ventasSemana2: number): number {
  const promedio = (ventasSemana1 + ventasSemana2) / 2;
  return Math.round(promedio);
}

