/**
 * Utilidades para manejo estandarizado de fechas en Zona Horaria Tijuana (America/Tijuana)
 */

/**
 * Obtiene la fecha actual en formato YYYY-MM-DD según la zona horaria America/Tijuana.
 */
export function getTijuanaTodayString(): string {
  const now = new Date();
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Tijuana',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  return formatter.format(now); // Formato YYYY-MM-DD
}

/**
 * Convierte un string de fecha (YYYY-MM-DD) a objeto Date local interpretado a medianoche UTC
 * para evitar desfases de huso horario.
 */
export function parseDateUTC(dateStr: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}

/**
 * Formatea una fecha YYYY-MM-DD a formato legible en español (ej. "05 Ago 2026").
 */
export function formatFechaLegible(dateStr: string | null | undefined): string {
  if (!dateStr) return 'Sin fecha';
  try {
    const date = parseDateUTC(dateStr);
    return new Intl.DateTimeFormat('es-MX', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      timeZone: 'UTC',
    }).format(date);
  } catch {
    return dateStr;
  }
}

/**
 * Formatea una fecha YYYY-MM-DD a formato numérico dd/mm/aaaa (ej. "15/08/2026").
 */
export function formatFechaDDMMYYYY(dateStr: string | null | undefined): string {
  if (!dateStr) return 'Sin fecha';
  try {
    const clean = dateStr.split('T')[0];
    const parts = clean.split('-');
    if (parts.length === 3) {
      const [year, month, day] = parts;
      return `${day.padStart(2, '0')}/${month.padStart(2, '0')}/${year}`;
    }
    return dateStr;
  } catch {
    return dateStr;
  }
}

/**
 * Suma N semanas a una fecha dada (YYYY-MM-DD) y devuelve el nuevo string YYYY-MM-DD.
 */
export function addWeeksToDate(dateStr: string, weeks: number): string {
  const date = parseDateUTC(dateStr);
  date.setUTCDate(date.getUTCDate() + weeks * 7);
  return date.toISOString().split('T')[0];
}

/**
 * Obtiene el rango de fechas (lunes a domingo) de la semana actual en Tijuana.
 */
export function getTijuanaCurrentWeekRange(): { startOfWeek: string; endOfWeek: string } {
  const todayStr = getTijuanaTodayString();
  const today = parseDateUTC(todayStr);
  const dayOfWeek = today.getUTCDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  
  const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const monday = new Date(today);
  monday.setUTCDate(today.getUTCDate() + diffToMonday);
  
  const sunday = new Date(monday);
  sunday.setUTCDate(monday.getUTCDate() + 6);
  
  return {
    startOfWeek: monday.toISOString().split('T')[0],
    endOfWeek: sunday.toISOString().split('T')[0]
  };
}

/**
 * Comprueba si una fecha de próximo pago cae dentro de la semana actual (Lunes a Domingo) en Tijuana.
 */
export function isFechaEnSemanaActual(fechaStr: string | null | undefined): boolean {
  if (!fechaStr) return false;
  const cleanDate = fechaStr.split('T')[0];
  const { startOfWeek, endOfWeek } = getTijuanaCurrentWeekRange();
  
  // Retorna true solo si el próximo pago cae estrictamente entre el Lunes y el Domingo de la semana actual
  return cleanDate >= startOfWeek && cleanDate <= endOfWeek;
}

/**
 * Obtiene la fecha Date (UTC) correspondiente al Lunes de la semana calendario que contiene a `dateStr` (YYYY-MM-DD).
 */
export function getMondayOfDate(dateStr: string): Date {
  const clean = dateStr.split('T')[0];
  const date = parseDateUTC(clean);
  const dayOfWeek = date.getUTCDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  date.setUTCDate(date.getUTCDate() + diffToMonday);
  return date;
}

/**
 * Calcula el número de la semana actual correspondiente a un crédito tomando como referencia
 * la zona horaria Tijuana y semanas calendario (Lunes a Domingo).
 * 
 * - Si el día de hoy cae dentro de la misma semana calendario (Lunes a Domingo) que la fecha_proximo_pago inicial (o antes), retorna 1.
 * - Si transcurren semanas calendario posteriores, incrementa (2, 3, etc.).
 */
export function calculateSemanasTranscurridas(
  fechaProximoPagoStr: string | null | undefined,
  maxPlazos: number | null | undefined
): number {
  if (!fechaProximoPagoStr) return 1;

  const todayStr = getTijuanaTodayString();
  const mondayToday = getMondayOfDate(todayStr);
  const mondayInicio = getMondayOfDate(fechaProximoPagoStr);

  if (mondayToday.getTime() <= mondayInicio.getTime()) {
    return 1;
  }

  const diffTime = mondayToday.getTime() - mondayInicio.getTime();
  const diffDays = Math.round(diffTime / (1000 * 3600 * 24));
  
  const semanas = Math.floor(diffDays / 7) + 1;

  if (maxPlazos && maxPlazos > 0) {
    return Math.min(semanas, maxPlazos);
  }
  return semanas;
}

/**
 * Calcula el saldo restante actual para un crédito.
 */
export function calculateSaldoRestante(
  precioTotal: number,
  pagoInicial: number,
  pagoSemanal: number,
  fechaProximoPago: string | null | undefined,
  plazos: number | null | undefined
): number {
  const deudaInicial = Math.max(0, precioTotal - pagoInicial);
  if (!fechaProximoPago || !plazos || plazos <= 0 || pagoSemanal <= 0) {
    return deudaInicial;
  }

  const semanasTranscurridas = calculateSemanasTranscurridas(fechaProximoPago, plazos);
  const totalDescontado = semanasTranscurridas * pagoSemanal;

  return Math.max(0, deudaInicial - totalDescontado);
}
