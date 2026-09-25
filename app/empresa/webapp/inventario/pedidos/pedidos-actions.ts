'use server';

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { getUserProfile, isAllowed } from "@/utils/auth-check";
import { getTijuanaDate } from "@/utils/date-helpers";
import { fetchAllFromTable } from "@/utils/supabase/pagination";
import type { PedidoItemInput, ConsolidadoPedidoItem } from "@/types/pedidos-stock";

const ALLOWED_PEDIDO_ROLES = ["Admin", "Supervisor", "Developer", "JCI", "Closer"];
const ALLOWED_CONSOLIDADO_ROLES = ["Admin", "Supervisor", "Developer", "JCI"];

interface RegistrarPedidoParams {
  zona: string;
  items: PedidoItemInput[];
}

/**
 * Registra un nuevo pedido de stock agrupado bajo un único pedido_id.
 * Se guarda la zona, el vendedor autenticado, la fecha y cada uno de los modelos solicitados con su cantidad.
 */
export async function registrarPedidoStock({ zona, items }: RegistrarPedidoParams) {
  const { role, id: userId, username } = await getUserProfile();

  if (!isAllowed(role, ALLOWED_PEDIDO_ROLES)) {
    return { error: "No tienes permisos para registrar pedidos de stock." };
  }

  const zonaLimpia = (zona || "").trim();
  if (!zonaLimpia) {
    return { error: "Debes seleccionar la ciudad / zona de entrega del pedido." };
  }

  if (!items || items.length === 0) {
    return { error: "No has seleccionado ningún equipo para el pedido." };
  }

  // Filtrar solo items con cantidad > 0 y validar campos requeridos
  const itemsValidos = items.filter((it) => it.cantidad > 0);
  if (itemsValidos.length === 0) {
    return { error: "Debes solicitar al menos un equipo con cantidad mayor a cero." };
  }

  for (const item of itemsValidos) {
    if (!item.producto_id || !item.modelo) {
      return { error: "Hay equipos seleccionados con datos incompletos en el catálogo." };
    }
  }

  const supabase = await createClient();
  const pedidoId = crypto.randomUUID();
  const fechaPedidoIso = new Date().toISOString();

  const filasAInsertar = itemsValidos.map((item) => ({
    pedido_id: pedidoId,
    vendedor_id: userId,
    vendedor_nombre: username || "Vendedor",
    zona: zonaLimpia,
    producto_id: item.producto_id,
    marca: item.marca,
    modelo: item.modelo,
    almacenamiento: item.almacenamiento || null,
    ram: item.ram || null,
    color: item.color || null,
    cantidad: item.cantidad,
    fecha_pedido: fechaPedidoIso,
  }));

  const { error: insertError } = await supabase
    .from("pedidos_stock")
    .insert(filasAInsertar);

  if (insertError) {
    console.error("Error al registrar pedido en pedidos_stock:", insertError);
    if (insertError.message.includes("Could not find the table")) {
      return {
        error: "La tabla 'pedidos_stock' aún no ha sido creada en la base de datos de Supabase. Por favor ejecuta el script SQL de creación.",
      };
    }
    return { error: `Error de base de datos al guardar pedido: ${insertError.message}` };
  }

  revalidatePath("/empresa/webapp/inventario/pedidos");

  const totalEquipos = itemsValidos.reduce((acc, it) => acc + it.cantidad, 0);

  return {
    success: true,
    resumen: {
      pedidoId,
      fechaPedido: fechaPedidoIso,
      zona: zonaLimpia,
      vendedorNombre: username || "Vendedor",
      items: itemsValidos,
      totalEquipos,
    },
  };
}

interface FiltrosConsolidado {
  fechaDesde?: string;
  fechaHasta?: string;
  vendedorId?: string;
}

interface PedidoRawRow {
  id: string;
  zona: string;
  modelo: string;
  marca: string;
  almacenamiento?: string | null;
  ram?: string | null;
  cantidad: number;
  vendedor_id: string | null;
  fecha_pedido: string;
}

/**
 * Consulta y consolida todos los pedidos registrados en pedidos_stock,
 * agrupando por (zona, modelo) y sumando la cantidad total según los filtros de fecha y vendedor.
 */
export async function obtenerConsolidadoPedidos({
  fechaDesde,
  fechaHasta,
  vendedorId,
}: FiltrosConsolidado) {
  const { role } = await getUserProfile();

  if (!isAllowed(role, ALLOWED_CONSOLIDADO_ROLES)) {
    return { error: "No tienes permisos para ver el consolidado de pedidos.", items: [] };
  }

  const supabase = await createClient();

  // Calcular límites de fecha en horario Tijuana si se especifican
  let startDateIso: string | null = null;
  let endDateIso: string | null = null;

  if (fechaDesde) {
    const [y, m, d] = fechaDesde.split("-").map(Number);
    if (y && m && d) {
      startDateIso = getTijuanaDate(y, m - 1, d, 0, 0, 0, 0).toISOString();
    }
  }

  if (fechaHasta) {
    const [y, m, d] = fechaHasta.split("-").map(Number);
    if (y && m && d) {
      endDateIso = getTijuanaDate(y, m - 1, d, 23, 59, 59, 999).toISOString();
    }
  }

  try {
    const pedidos = await fetchAllFromTable<PedidoRawRow>(
      supabase,
      "pedidos_stock",
      "id, zona, modelo, marca, almacenamiento, ram, cantidad, vendedor_id, fecha_pedido",
      {
        orderColumn: "fecha_pedido",
        ascending: false,
        filterFn: (query) => {
          if (startDateIso) query = query.gte("fecha_pedido", startDateIso);
          if (endDateIso) query = query.lte("fecha_pedido", endDateIso);
          if (vendedorId && vendedorId.trim() !== "") {
            query = query.eq("vendedor_id", vendedorId.trim());
          }
          return query;
        },
      }
    );

    // Agrupación en memoria por Zona + Modelo + Specs
    const map = new Map<string, ConsolidadoPedidoItem>();

    pedidos.forEach((row) => {
      const clave = `${row.zona.toUpperCase()}___${row.modelo.toUpperCase()}___${(row.almacenamiento || "").toUpperCase()}___${(row.ram || "").toUpperCase()}`;
      if (!map.has(clave)) {
        map.set(clave, {
          zona: row.zona,
          modelo: row.modelo,
          marca: row.marca,
          almacenamiento: row.almacenamiento || null,
          ram: row.ram || null,
          cantidad: 0,
        });
      }
      map.get(clave)!.cantidad += row.cantidad;
    });

    const resultado: ConsolidadoPedidoItem[] = Array.from(map.values()).sort((a, b) => {
      const cmpZona = a.zona.localeCompare(b.zona);
      if (cmpZona !== 0) return cmpZona;
      return a.modelo.localeCompare(b.modelo);
    });

    return { success: true, items: resultado };
  } catch (err: any) {
    console.error("Error al obtener consolidado de pedidos:", err);
    return {
      error: `Error al consultar consolidado: ${err?.message || "Error desconocido"}`,
      items: [],
    };
  }
}
