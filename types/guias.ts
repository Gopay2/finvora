export interface Guia {
  id: string;
  titulo: string;
  slug?: string | null;
  categoria: string;
  resumen?: string | null;
  contenido: string;
  video_url?: string | null;
  imagenes: string[];
  autor_id?: string | null;
  destacado: boolean;
  orden: number;
  created_at: string;
  updated_at: string;
  autor?: {
    id: string;
    username: string | null;
    role: string;
  } | null;
}

export interface GuiaCategoria {
  id: string;
  nombre: string;
  created_at?: string;
  count?: number;
}

export interface GuiaFormData {
  id?: string;
  titulo: string;
  categoria: string;
  resumen?: string;
  contenido: string;
  video_url?: string;
  imagenesExistentes?: string[];
  nuevasImagenes?: File[];
  destacado?: boolean;
}
