import type { ProveedorOpcion } from '@/types/recibo';

/**
 * Lista de áreas de proveedores y proveedores habilitados con su sigla.
 */
export const PROVEEDORES: ProveedorOpcion[] = [
  { area: 'Tijuana', proveedor: 'Android Tj', sigla: 'TIJ', label: 'Tijuana' },
  { area: 'Guadalajara', proveedor: 'WindCell', sigla: 'GDL', label: 'Guadalajara' },
  { area: 'Monterrey', proveedor: 'Sbmx', sigla: 'MTY', label: 'Monterrey' },
];

/**
 * Mapa de relación entre Área de Proveedor y Proveedores (admite múltiples a futuro).
 */
export const AREAS_PROVEEDORES = {
  Tijuana: ['Android Tj'],
  Guadalajara: ['WindCell'],
  Monterrey: ['Sbmx'],
} as const;

/**
 * Obtiene el código de color hexadecimal aproximado según el nombre del color del equipo.
 */
export function getColorHex(colorName: string): string {
  const norm = (colorName || '').toLowerCase().trim();
  if (norm.includes('negro') || norm.includes('black') || norm.includes('midnight') || norm.includes('oscuro')) return '#1e293b';
  if (norm.includes('blanco') || norm.includes('white') || norm.includes('starlight') || norm.includes('claro')) return '#f8fafc';
  if (norm.includes('azul') || norm.includes('blue')) return '#3b82f6';
  if (norm.includes('verde') || norm.includes('green')) return '#84cc16';
  if (norm.includes('plata') || norm.includes('silver') || norm.includes('gris') || norm.includes('gray')) return '#cbd5e1';
  if (norm.includes('oro') || norm.includes('gold') || norm.includes('dorado')) return '#eab308';
  if (norm.includes('rojo') || norm.includes('red')) return '#ef4444';
  if (norm.includes('rosa') || norm.includes('pink')) return '#ec4899';
  if (norm.includes('morado') || norm.includes('violeta') || norm.includes('purple')) return '#a855f7';
  return '#64748b';
}

/**
 * Formatea una fecha en formato ISO a fecha (DD/MM/AAAA) y hora (HH:MM:SS) legibles.
 */
export function formatFecha(isoString: string): { fecha: string; hora: string } {
  try {
    const fechaObj = new Date(isoString);
    const dia = String(fechaObj.getDate()).padStart(2, '0');
    const mes = String(fechaObj.getMonth() + 1).padStart(2, '0');
    const anio = fechaObj.getFullYear();
    const hora = String(fechaObj.getHours()).padStart(2, '0');
    const min = String(fechaObj.getMinutes()).padStart(2, '0');
    const seg = String(fechaObj.getSeconds()).padStart(2, '0');
    return {
      fecha: `${dia}/${mes}/${anio}`,
      hora: `${hora}:${min}:${seg}`,
    };
  } catch {
    return { fecha: isoString, hora: '' };
  }
}
