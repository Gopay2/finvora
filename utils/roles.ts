/**
 * Jerarquía de roles comerciales de Closer y utilidades de roles de usuario.
 * Este archivo NO debe importar módulos de servidor (como cookies o next/headers),
 * para que pueda ser utilizado de forma segura tanto en Server Components como en Client Components.
 */

export const CLOSER_ROLES = [
  'Closer Jr',
  'Closer Sr.',
  'Closer Advanced',
  'Closer Pro',
  'Closer Expert',
] as const;

export type CloserRole = typeof CLOSER_ROLES[number];

/**
 * Determina si un rol corresponde a cualquiera de las variantes de Closer (o legacy 'Closer').
 */
export function isCloserRole(role: string): boolean {
  return (CLOSER_ROLES as readonly string[]).includes(role) || role === 'Closer';
}

/**
 * Verifica si el rol del usuario está en la lista permitida.
 * Devuelve true si está permitido, false si no.
 * 
 * RETROCOMPATIBILIDAD DEFENSIVA:
 * Si la lista allowedRoles incluye "Closer", cualquier variante de Closer
 * (Closer Jr, Closer Sr., Closer Advanced, Closer Pro, Closer Expert) tiene acceso concedido automáticamente.
 */
export function isAllowed(userRole: string, allowedRoles: string[]): boolean {
  if (allowedRoles.includes(userRole)) return true;
  if (allowedRoles.includes('Closer') && isCloserRole(userRole)) {
    return true;
  }
  return false;
}
