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
};

export interface DriverRestDayResult {
  isRestDay: boolean;
  dayOfWeekName: string;
  restDayNames: string[];
}

/**
 * Determina si una fecha específica cae en el día de descanso de un repartidor.
 * @param driverName Nombre del repartidor
 * @param dateInput Fecha en formato YYYY-MM-DD o instancia Date
 */
export function getDriverRestDayInfo(driverName: string | null | undefined, dateInput: string | Date | null | undefined): DriverRestDayResult {
  if (!driverName || !dateInput) {
    return { isRestDay: false, dayOfWeekName: '', restDayNames: [] };
  }

  let dateObj: Date;
  if (typeof dateInput === 'string') {
    const parts = dateInput.split('T')[0].split('-');
    if (parts.length < 3) return { isRestDay: false, dayOfWeekName: '', restDayNames: [] };
    const y = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10);
    const d = parseInt(parts[2], 10);
    if (isNaN(y) || isNaN(m) || isNaN(d)) return { isRestDay: false, dayOfWeekName: '', restDayNames: [] };
    dateObj = new Date(y, m - 1, d);
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
      const restDayNames = restDays.map(d => WEEKDAY_NAMES[d]);
      const isRestDay = restDays.includes(dayOfWeek);
      return { isRestDay, dayOfWeekName, restDayNames };
    }
  }

  return { isRestDay: false, dayOfWeekName, restDayNames: [] };
}
