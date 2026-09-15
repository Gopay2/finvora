export interface Producto {
  id: string;
  marca: string;
  modelo: string;
  almacenamiento: string;
  ram: string;
  color: string;
}

export interface ProductoConStock extends Producto {
  cantidadStock: number;
  cantidadDisponible: number;
  cantidadAConsultar: number;
}

export interface RepartoZonaInfo {
  id: string;
  nombre_zona: string;
  repartidor_id: string;
  repartidor_nombre: string;
  repartidor_activo: boolean;
  repartidor_zona_horaria?: string;
}

export interface StockItem {
  producto_id: string;
  estado: string;
  zona: string | null;
  imei?: string;
}

export interface CostoItem {
  producto_id: string;
  costo: number | string;
  costo_payjoy?: number | string;
}

export interface ConfigEngancheItem {
  id?: string;
  cliente_historial: string;
  zona?: string | null;
  vendedor_id?: string | null;
  vendedor_nombre?: string | null;
  producto_id?: string | null;
  proveedor?: string | null;
  montos_fijos?: number[] | null;
  producto_info?: {
    marca: string;
    modelo: string;
    almacenamiento?: string | null;
    ram?: string | null;
    color?: string | null;
  } | null;
  porcentajes: number[];
  permitir_enganche_libre?: boolean;
}

export interface CatalogProductOption {
  id: string;
  marca: string;
  modelo: string;
  almacenamiento?: string | null;
  ram?: string | null;
  color?: string | null;
}

export interface VendedorDisponible {
  id: string;
  nombre: string;
  role?: string;
}

export interface RepartoExistente {
  id?: string;
  repartidor_id?: string | null;
  fecha_reparto?: string | null;
  horario?: string | null;
}
