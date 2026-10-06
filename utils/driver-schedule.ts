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
 * Configuración de días de descanso por repartidor (Fallback retrocompatible en memoria).
 * Llave: Nombre normalizado en minúsculas.
 * Valor: Lista de números de días donde descansa (0 = Domingo ... 6 = Sábado).
 */
export const DRIVER_REST_DAYS: Record<string, number[]> = {
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

export interface DriverScheduleInput {
  nombre?: string | null;
  dias?: number[] | null;
  horario_inicio?: string | null;
  horario_fin?: string | null;
}

/**
 * Determina si una fecha específica corresponde al día de descanso de un repartidor.
 * Admite tanto un objeto de repartidor con su array 'dias' dinámico de base de datos,
 * como una cadena de texto con el nombre (con fallback retrocompatible).
 * 
 * @param driverInput Objeto de repartidor o nombre del repartidor
 * @param dateInput Fecha objetivo en formato 'YYYY-MM-DD', ISO string o un objeto Date
 * @param customDias Opcional: Array de días laborales activos si se pasa nombre por separado
 * @returns {DriverRestDayResult} Objeto con la información de si descansa y los días asignados
 */
export function getDriverRestDayInfo(
  driverInput: string | DriverScheduleInput | null | undefined, 
  dateInput: string | Date | null | undefined,
  customDias?: number[] | null
): DriverRestDayResult {
  if (!driverInput || !dateInput) {
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

  // 1. Verificación DINÁMICA (Si se provee el array de 'dias' laborales de la base de datos)
  let workingDays: number[] | null = null;
  let driverNameStr = '';

  if (typeof driverInput === 'object') {
    driverNameStr = driverInput.nombre || '';
    if (Array.isArray(driverInput.dias) && driverInput.dias.length > 0) {
      workingDays = driverInput.dias;
    }
  } else {
    driverNameStr = driverInput;
    if (Array.isArray(customDias) && customDias.length > 0) {
      workingDays = customDias;
    }
  }

  if (workingDays && workingDays.length > 0) {
    const isWorkingDay = workingDays.includes(dayOfWeek);
    // Calcular nombres de los días de descanso (días no incluidos en workingDays)
    const restDayIndices = [0, 1, 2, 3, 4, 5, 6].filter(d => !workingDays!.includes(d));
    const restDayNames = restDayIndices.map(d => WEEKDAY_NAMES[d]);

    return {
      isRestDay: !isWorkingDay,
      dayOfWeekName,
      restDayNames
    };
  }

  // 2. Fallback RETROCOMPATIBLE (por nombre en memoria si la BD no envió 'dias')
  const normalizedDriver = driverNameStr
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
 * Configuración de rangos horarios por repartidor o ubicación.
 * Admite tanto un objeto de repartidor con 'horario_inicio' y 'horario_fin',
 * como el nombre del chofer con fallback automático.
 */
export function getDriverScheduleConfig(
  driverInput: string | DriverScheduleInput | null | undefined,
  customInicio?: string | null,
  customFin?: string | null
): {
  startHour: number;
  startMinute: number;
  endHour: number;
  endMinute: number;
} {
  let driverNameStr = '';
  let hInicio = customInicio;
  let hFin = customFin;

  if (typeof driverInput === 'object' && driverInput !== null) {
    driverNameStr = driverInput.nombre || '';
    if (driverInput.horario_inicio) hInicio = driverInput.horario_inicio;
    if (driverInput.horario_fin) hFin = driverInput.horario_fin;
  } else if (typeof driverInput === 'string') {
    driverNameStr = driverInput;
  }

  // 1. Si tenemos horario_inicio y horario_fin dinámicos de la BD
  if (hInicio && hFin && hInicio.includes(':') && hFin.includes(':')) {
    const [startH, startM] = hInicio.split(':').map(Number);
    const [endH, endM] = hFin.split(':').map(Number);

    if (!isNaN(startH) && !isNaN(startM) && !isNaN(endH) && !isNaN(endM)) {
      return {
        startHour: startH,
        startMinute: startM,
        endHour: endH,
        endMinute: endM,
      };
    }
  }

  // 2. Fallback RETROCOMPATIBLE por nombre
  const norm = (driverNameStr || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

  if (norm.includes("ct")) {
    return { startHour: 10, startMinute: 0, endHour: 17, endMinute: 0 };
  }
  if (norm.includes("angel")) {
    return { startHour: 10, startMinute: 0, endHour: 17, endMinute: 30 };
  }
  if (norm.includes("felix")) {
    return { startHour: 10, startMinute: 0, endHour: 18, endMinute: 30 };
  }

  // Estándar para los demás repartidores (09:00 a 19:00)
  return { startHour: 9, startMinute: 0, endHour: 19, endMinute: 0 };
}

/**
 * Genera la lista de slots de tiempo en intervalos (por defecto 30 min) según el rango configurado.
 */
export function getDriverSlotList(
  driverInput: string | DriverScheduleInput | null | undefined,
  intervalMinutes: number = 30
): string[] {
  const { startHour, startMinute, endHour, endMinute } = getDriverScheduleConfig(driverInput);
  const slots: string[] = [];
  const startTotal = startHour * 60 + startMinute;
  const endTotal = endHour * 60 + endMinute;

  for (let m = startTotal; m <= endTotal; m += intervalMinutes) {
    const h = Math.floor(m / 60);
    const min = m % 60;
    slots.push(`${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}`);
  }

  return slots;
}
