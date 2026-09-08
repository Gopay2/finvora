export interface ReciboItem {
  id: string;
  imei: string;
  producto_id: string;
  proveedor: string;
  tipo_equipo: string;
  fecha_ingreso: string;
  creado_por_username?: string;
  productos?: {
    marca: string;
    modelo: string;
    color: string;
    almacenamiento: string;
    ram: string;
  } | null;
}

export interface ProveedorOpcion {
  label: string;
  sigla: string;
}

export type TipoEquipo = 'credito' | 'concesion';
