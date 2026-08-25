/**
 * Nombres de los días de la semana en español (0 = Domingo ... 6 = Sábado)
 */
export const WEEKDAY_NAMES = [
  'Domingo',
  'Lunes',
  'Martes',
  'Miércoles',
  'Jueves',
  'Viernes',
  'Sábado',
];

/**
 * Configuración de días de descanso por repartidor.
 * Llave: Nombre normalizado en minúsculas (o palabra clave única como 'felix').
 * Valor: Lista de números de días donde descansa (0 = Domingo, 1 = Lunes, ..., 3 = Miércoles, ..., 6 = Sábado).
 */
export const DRIVER_REST_DAYS: Record<string, number[]> = {
  felix: [3], // 3 = Miércoles
  angel: [2], // 2 = Martes
};

/**
 * Resultado de la verificación de días de descanso de un repartidor.
 */
export interface DriverRestDayResult {
  /** Indica si la fecha consultada corresponde a un día de descanso del repartidor */
  isRestDay: boolean;
  /** Nombre del día de la semana analizado (ej: "Miércoles") */
  dayOfWeekName: string;
  /** Lista de nombres de todos los días de descanso configurados para el repartidor */
  restDayNames: string[];
}

/**
 * Determina si una fecha específica corresponde al día de descanso programado de un repartidor.
 * Realiza una normalización del nombre (eliminando acentos y mayúsculas) para comparar
 * contra el diccionario de reglas de descanso.
 * 
 * @param driverName Nombre completo o alias del repartidor
 * @param dateInput Fecha objetivo en formato 'YYYY-MM-DD', ISO string o un objeto Date
 * @returns {DriverRestDayResult} Objeto con la información de si descansa y los días asignados
 * 
 * @example
 * ```ts
 * const res = getDriverRestDayInfo("Félix Repartidor", "2026-07-29");
 * // { isRestDay: true, dayOfWeekName: "Miércoles", restDayNames: ["Miércoles"] }
 * ```
 */
export function getDriverRestDayInfo(
  driverName: string | null | undefined, 
  dateInput: string | Date | null | undefined
): DriverRestDayResult {
  if (!driverName || !dateInput) {
    return { isRestDay: false, dayOfWeekName: '', restDayNames: [] };
  }

  let dateObj: Date;
  if (typeof dateInput === 'string') {
    const parts = dateInput.split('T')[0].split('-');
    if (parts.length < 3) return { isRestDay: false, dayOfWeekName: '', restDayNames: [] };
    const yearNum = parseInt(parts[0], 10);
    const monthNum = parseInt(parts[1], 10);
    const dayNum = parseInt(parts[2], 10);
    if (isNaN(yearNum) || isNaN(monthNum) || isNaN(dayNum)) {
      return { isRestDay: false, dayOfWeekName: '', restDayNames: [] };
    }
    dateObj = new Date(yearNum, monthNum - 1, dayNum);
  } else {
    dateObj = dateInput;
  }

  const dayOfWeek = dateObj.getDay();
  const dayOfWeekName = WEEKDAY_NAMES[dayOfWeek] || '';

  const normalizedDriver = driverName
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

  for (const [key, restDays] of Object.entries(DRIVER_REST_DAYS)) {
    if (normalizedDriver.includes(key)) {
      const restDayNames = restDays.map(restDayIndex => WEEKDAY_NAMES[restDayIndex]);
      const isRestDay = restDays.includes(dayOfWeek);
      return { isRestDay, dayOfWeekName, restDayNames };
    }
  }

  return { isRestDay: false, dayOfWeekName, restDayNames: [] };
}

/**
 * Configuración de rangos horarios por repartidor.
 */
export function getDriverScheduleConfig(driverName: string | null | undefined): {
  startHour: number;
  startMinute: number;
  endHour: number;
  endMinute: number;
} {
  const norm = (driverName || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

  if (norm.includes("ct")) {
    return { startHour: 10, startMinute: 0, endHour: 17, endMinute: 0 };
  }
  if (norm.includes("angel")) {
    return { startHour: 10, startMinute: 0, endHour: 17, endMinute: 30 };
  }
  // Estándar para los demás repartidores (09:00 a 19:00)
  return { startHour: 9, startMinute: 0, endHour: 19, endMinute: 0 };
}

