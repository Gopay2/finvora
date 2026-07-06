export const ROLES_DISPONIBLES = [
  "Admin",
  "Closer",
  "Cambaceador",
  "CambaCloser",
  "Supervisor",
  "Developer",
  "Repartidor",
  "Sin rol"
] as const;

export type UserRole = typeof ROLES_DISPONIBLES[number];
