export type EstadoTarea = "Pendientes" | "En proceso" | "Terminado";

export interface Perfil {
  id: string;
  username: string;
  email?: string;
  role?: string;
}

export interface Tarea {
  id: string;
  titulo: string;
  descripcion: string | null;
  estado: EstadoTarea;
  creado_por: string | null;
  asignado_a: string;
  created_at: string;
  updated_at: string;
  creador?: { username: string } | null;
  asignado?: { username: string } | null;
}
