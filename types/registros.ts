export interface Venta {
  id: string;
  imei: string;
  precio_costo: number;
  fecha_ingreso: string;
  fecha_venta: string;
  repartidor?: {
    id: string;
    nombre: string;
  };
  productos?: {
    marca: string;
    modelo: string;
    color: string;
    almacenamiento: string;
    ram: string;
  };
  vendedor?: {
    id: string;
    username: string;
  };
}

export interface OrdenEntrega {
  id: string;
  folio: string;
  consecutivo: number;
  nombre_cliente: string;
  identificacion_fisica?: string;
  curp?: string;
  telefono: string;
  direccion: string;
  enganche?: number;
  celular: string;
  color_celular: string;
  imei?: string;
  cuenta_activa?: string;
  cliente_historial?: string;
  zona: string;
  repartidor?: string;
  repartidor_id?: string;
  especificar_local?: string;
  fecha_entrega?: string;
  hora_entrega?: string;
  comentarios?: string;
  created_at: string;
  vendedor?: {
    id: string;
    username: string;
  };
  repartidores?: {
    id: string;
    nombre: string;
  };
}

export interface PerfilOption {
  id: string;
  username: string;
}

export interface RepartidorOption {
  id: string;
  nombre: string;
}

export interface Garantia {
  id: string;
  imei: string;
  precio_costo: number;
  motivo: string;
  fecha_ingreso: string;
  fecha_garantia: string;
  repartidor?: {
    id: string;
    nombre: string;
  };
  productos?: {
    marca: string;
    modelo: string;
    color: string;
    almacenamiento: string;
    ram: string;
  };
  solicitante?: {
    id: string;
    username: string;
  };
}

export interface OrdenGarantia {
  id: string;
  folio: string;
  consecutivo: number;
  zona: string;
  nombre_cliente: string;
  telefono: string;
  ubicacion: string;
  tag?: string;
  modelo: string;
  imei: string;
  fecha_entrega?: string;
  costo_equipo?: number;
  enganche_registrado?: number;
  enganche_recibido?: number;
  motivo_garantia: string;
  descripcion_falla: string;
  accesorios_entregados?: string;
  estado_fisico?: string;
  observaciones?: string;
  created_at: string;
  vendedor?: {
    id: string;
    username: string;
  };
}

export interface ZonaReparto {
  nombre_zona: string;
  repartidor_id: string;
}

export type RegistrosTab = "ventas" | "ordenes" | "garantias" | "ordenes_garantia";
