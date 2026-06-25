/**
 * Crea una fecha en la zona horaria de México (CST UTC-6).
 *
 * @param year Año
 * @param monthIndex Índice del mes (0-11)
 * @param day Día del mes
 * @param hours Hora del día (default 0)
 * @param minutes Minutos (default 0)
 * @param seconds Segundos (default 0)
 * @param ms Milisegundos (default 0)
 * @returns Objeto de fecha de JavaScript ajustado
 */
export function getMexicoDate(
  year: number,
  monthIndex: number,
  day: number,
  hours = 0,
  minutes = 0,
  seconds = 0,
  ms = 0
): Date {
  const dateStr = `${year}-${String(monthIndex + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}T${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}.${String(ms).padStart(3, '0')}`;
  return new Date(`${dateStr}-06:00`); // Offset estándar CST de Ciudad de México
}

/**
 * Calcula las semanas del mes calendario de Lunes a Domingo para México.
 *
 * @param year Año
 * @param monthIndex Índice del mes (0-11)
 * @returns Arreglo de intervalos { start, end } para cada semana del mes
 */
export function getMexicoMonthWeeks(year: number, monthIndex: number): { start: Date; end: Date }[] {
  const firstDay = getMexicoDate(year, monthIndex, 1, 0, 0, 0, 0);
  const lastDayDate = new Date(getMexicoDate(year, monthIndex + 1, 1, 0, 0, 0, 0).getTime() - 1);
  const weeks: { start: Date; end: Date }[] = [];

  let currentStart = new Date(firstDay);

  while (currentStart <= lastDayDate) {
    const dayOfWeek = currentStart.getDay(); // 0 = Domingo, 1 = Lunes
    const daysToSunday = (7 - dayOfWeek) % 7;
    
    const sundayDate = new Date(currentStart);
    sundayDate.setDate(currentStart.getDate() + daysToSunday);
    
    const sundayEndOfDay = getMexicoDate(
      sundayDate.getFullYear(),
      sundayDate.getMonth(),
      sundayDate.getDate(),
      23, 59, 59, 999
    );

    const currentEnd = sundayEndOfDay > lastDayDate ? new Date(lastDayDate) : sundayEndOfDay;

    weeks.push({
      start: new Date(currentStart),
      end: new Date(currentEnd)
    });

    // Avanzamos al lunes siguiente
    const nextMonday = new Date(currentEnd.getTime() + 1);
    currentStart = nextMonday;
  }

  return weeks;
}
