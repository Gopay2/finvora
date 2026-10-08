/**
 * Representa una unidad física individual actualmente presente en la tabla 'stock'
 * bajo modalidad de concesión o en tránsito con estado previo de concesión.
 */
export interface StockConcesionItem {
  imei: string;
  producto_id: string;
  zona: string | null;
  estado: string;
  estado_previo?: string | null;
  fecha_ingreso: string;
  fecha_en_envio?: string | null;
  productos?: {
    id: string;
    marca: string;
    modelo: string;
    color: string | null;
    almacenamiento: string;
    ram: string | null;
  } | null;
  repartidores?: {
    id: string;
    nombre: string;
  } | null;
}

/**
 * Representa un registro histórico de venta en la tabla 'ventas',
 * con trazabilidad de su estado operativo previo ('Concesión', 'Disponible', 'Test', etc.).
 */
export interface VentaItem {
  id: string;
  imei: string;
  producto_id: string;
  zona?: string | null;
  vendedor_id?: string | null;
  vendedor_nombre?: string | null;
  fecha_ingreso: string;
  fecha_venta: string;
  estado_previo?: string | null;
  productos?: {
    id: string;
    marca: string;
    modelo: string;
    color: string | null;
    almacenamiento: string;
    ram: string | null;
  } | null;
  vendedor?: {
    id: string;
    username: string;
  } | null;
}

/**
 * Opción simplificada para selectores de repartidores / ubicaciones de inventario.
 */
export interface RepartidorOption {
  id: string;
  nombre: string;
}

/**
 * Opción simplificada para selectores de vendedores / perfiles de usuario.
 */
export interface PerfilOption {
  id: string;
  username: string;
}

/**
 * Identificadores válidos para las tres pestañas de navegación en la sección Detalle de Equipos.
 */
export type DetalleEquiposTab = "concesion" | "vendidos_concesion" | "vendidos_credito";


