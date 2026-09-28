import { CLOSER_ROLES, type CloserRole } from "@/utils/auth-check";

export { CLOSER_ROLES, type CloserRole };

export const ROLES_DISPONIBLES = [
  "Admin",
  ...CLOSER_ROLES,
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
