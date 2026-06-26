/**
 * Crea una fecha en la zona horaria de Tijuana (America/Tijuana),
 * calculando de forma dinámica el offset estacional (DST) para ese instante.
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
export function getTijuanaDate(
  year: number,
  monthIndex: number,
  day: number,
  hours = 0,
  minutes = 0,
  seconds = 0,
  ms = 0
): Date {
  // Usamos Date.UTC para que JavaScript auto-corrija nativamente cualquier desborde (ej: día 32 -> día 2 del mes siguiente)
  const tempUtc = new Date(Date.UTC(year, monthIndex, day, hours, minutes, seconds, ms));
  
  // Formateamos en la timezone de Tijuana para obtener los componentes
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Tijuana',
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric',
    hour12: false
  });
  
  const parts = formatter.formatToParts(tempUtc);
  const getVal = (type: string) => parseInt(parts.find(p => p.type === type)?.value || '0');
  
  // Re-creamos el instante que resultó en Tijuana
  const tzDate = new Date(Date.UTC(
    getVal('year'),
    getVal('month') - 1,
    getVal('day'),
    getVal('hour') === 24 ? 0 : getVal('hour'), // Corrección para formateador de 24h
    getVal('minute'),
    getVal('second')
  ));
  
  const diffMs = tempUtc.getTime() - tzDate.getTime();
  return new Date(tempUtc.getTime() + diffMs);
}

/**
 * Calcula las semanas del mes calendario de Lunes a Domingo para Tijuana.
 *
 * @param year Año
 * @param monthIndex Índice del mes (0-11)
 * @returns Arreglo de intervalos { start, end } para cada semana del mes
 */
export function getTijuanaMonthWeeks(year: number, monthIndex: number): { start: Date; end: Date }[] {
  const firstDay = getTijuanaDate(year, monthIndex, 1, 0, 0, 0, 0);
  
  // Último día del mes
  const nextMonthFirst = getTijuanaDate(year, monthIndex + 1, 1, 0, 0, 0, 0);
  const lastDayDate = new Date(nextMonthFirst.getTime() - 1);
  
  const weeks: { start: Date; end: Date }[] = [];
  let currentStart = new Date(firstDay);

  // Helper para formatear en YYYY-MM-DD en Tijuana
  const toTijuanaStr = (d: Date) => 
    new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Tijuana' }).format(d);

  while (currentStart <= lastDayDate) {
    // Calculamos el día de la semana local de Tijuana
    const tijuanaStr = toTijuanaStr(currentStart);
    const [y, m, d] = tijuanaStr.split('-').map(Number);
    
    // Obtenemos el day of week en Tijuana
    const tempDate = new Date(currentStart);
    const dayOfWeek = tempDate.getUTCDay(); // Usamos UTC tras mapear a Tijuana

    // getUTCDay: 0 = Domingo, 1 = Lunes...
    // Sin embargo, para evitar desajustes del getDay del servidor, usamos una fecha auxiliar
    const dateHelper = new Date(Date.UTC(y, m - 1, d));
    const dayOfWeekTijuana = dateHelper.getUTCDay(); 
    
    const daysToSunday = (7 - dayOfWeekTijuana) % 7;
    
    const sundayDate = getTijuanaDate(y, m - 1, d + daysToSunday, 23, 59, 59, 999);
    const currentEnd = sundayDate > lastDayDate ? new Date(lastDayDate) : sundayDate;

    weeks.push({
      start: new Date(currentStart),
      end: new Date(currentEnd)
    });

    // Avanzamos al día siguiente
    currentStart = new Date(currentEnd.getTime() + 1);
  }

  return weeks;
}
