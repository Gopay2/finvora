export interface PedidoItemInput {
  producto_id: string;
  marca: string;
  modelo: string;
  almacenamiento?: string | null;
  ram?: string | null;
  color?: string | null;
  cantidad: number;
}

export interface PedidoStockRow {
  id: string;
  pedido_id: string;
  vendedor_id: string | null;
  vendedor_nombre: string;
  zona: string;
  producto_id: string;
  marca: string;
  modelo: string;
  almacenamiento?: string | null;
  ram?: string | null;
  color?: string | null;
  cantidad: number;
  fecha_pedido: string;
  created_at: string;
}

export interface ConsolidadoPedidoItem {
  zona: string;
  modelo: string;
  marca: string;
  almacenamiento?: string | null;
  ram?: string | null;
  cantidad: number;
}

export interface UltimoPedidoResumen {
  pedidoId: string;
  fechaPedido: string;
  zona: string;
  vendedorNombre: string;
  items: PedidoItemInput[];
  totalEquipos: number;
}
