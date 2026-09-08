export const ROLES_DISPONIBLES = [
  "Admin",
  "Closer",
  "Cambaceador",
  "CambaCloser",
  "Supervisor",
  "Developer",
  "Repartidor",
  "Bodega",
  "JCI",
  "Sin rol"
] as const;

export type UserRole = typeof ROLES_DISPONIBLES[number];
