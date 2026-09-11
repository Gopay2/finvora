export interface ReciboItem {
  id: string;
  imei: string;
  producto_id: string;
  area_proveedor?: string;
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
  area: string;
  proveedor: string;
  sigla: string;
  label?: string;
}

export type TipoEquipo = 'credito' | 'concesion';

export interface PreCargaItem {
  tempId: string;
  imei: string;
  producto_id: string;
  area_proveedor?: string;
  proveedor: string;
  tipo_equipo: TipoEquipo | string;
  fecha_ingreso: string;
  productos?: {
    marca: string;
    modelo: string;
    color: string;
    almacenamiento?: string;
    ram?: string;
  } | null;
}
