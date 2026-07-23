'use server';

// ─── Next.js y utilidades externas ─────────────────────────────────────────
import { revalidatePath } from "next/cache";

// ─── Utilidades locales ─────────────────────────────────────────────────────
import { createClient } from "@/utils/supabase/server";
import { getUserProfile, isAllowed } from "@/utils/auth-check";
import { registrarVenta } from "@/app/empresa/webapp/stock/stock-actions";

export interface ComprobanteRecord {
  id: string;
  nombre_cliente: string;
  comentarios: string | null;
  precio_compra: number;
  pago_inicial: number;
  pago_recibido: number;
  celular: string | null;
  color_celular: string | null;
  imei: string | null;
  comprobante_url: string;
  created_at: string;
  costo_equipo?: number;
  vendedor: {
    id: string;
    username: string;
    role: string;
  } | null;
  repartidor: {
    id: string;
    nombre: string;
  } | null;
  creador: {
    id: string;
    username: string;
    role: string;
  } | null;
}

interface PerfilSubQuery {
  id: string;
  username: string;
  role: string;
}

interface RepartidorSubQuery {
  id: string;
  nombre: string;
}

interface ComprobanteRawResponse {
  id: string;
  nombre_cliente: string;
  comentarios: string | null;
  precio_compra: string | number;
  pago_inicial: string | number;
  pago_recibido: string | number;
  celular: string | null;
  color_celular: string | null;
  imei: string | null;
  comprobante_url: string;
  created_at: string;
  vendedor: PerfilSubQuery | PerfilSubQuery[] | null;
  repartidor: RepartidorSubQuery | RepartidorSubQuery[] | null;
  creador: PerfilSubQuery | PerfilSubQuery[] | null;
}

/**
 * Server Action para subir un comprobante de enganche y registrarlo en la base de datos.
 * Accesible por: Admin, Supervisor, Developer, Repartidor.
 */
/**
 * Sube un archivo de comprobante al storage de Supabase.
 */
async function uploadComprobanteFile(
  file: File,
  supabase: any
): Promise<{ success: boolean; publicUrl?: string; error?: string }> {
  try {
    const fileExt = file.name.split('.').pop() || 'png';
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
    const filePath = `comprobantes/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('comprobantes')
      .upload(filePath, file, {
        contentType: file.type,
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) {
      console.error("Error al subir archivo a storage:", uploadError);
      return { success: false, error: uploadError.message };
    }

    const { data: { publicUrl } } = supabase.storage
      .from('comprobantes')
      .getPublicUrl(filePath);

    return { success: true, publicUrl };
  } catch (error: any) {
    console.error("Excepción en la carga del archivo:", error);
    return { success: false, error: "Ocurrió un error inesperado al subir el comprobante." };
  }
}

interface DiscordNotificationParams {
  nombreCliente: string;
  vendedorId: string;
  repartidorId: string;
  precioCompra: number;
  pagoInicial: number;
  pagoRecibido: number;
  celular: string | null;
  colorCelular: string | null;
  imei: string | null;
  comentarios: string | null;
  comprobanteUrl: string;
  userRole: string;
  currentUsername: string;
  supabase: any;
}

/**
 * Envía una notificación formateada a Discord con los detalles del comprobante registrado.
 */
async function sendDiscordNotification(params: DiscordNotificationParams) {
  const webhookUrl = process.env.DISCORD_WEBHOOK_URL_8;
  const roleId = process.env.DISCORD_ROLE_ID_2;

  if (!webhookUrl) return;

  try {
    const { data: vendedorPerfil } = await params.supabase
      .from("perfiles")
      .select("username, role")
      .eq("id", params.vendedorId)
      .single();

    let repartidorName = "Desconocido";
    const { data: repartidorLogistics } = await params.supabase
      .from("repartidores")
      .select("nombre")
      .eq("id", params.repartidorId)
      .maybeSingle();

    if (repartidorLogistics) {
      repartidorName = repartidorLogistics.nombre;
    }

    const vendedorName = vendedorPerfil?.username
      ? `${vendedorPerfil.role}: ${vendedorPerfil.username.charAt(0).toUpperCase() + vendedorPerfil.username.slice(1)}`
      : "Desconocido";

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://finvora.mx';
    const fields = [
      { name: "👤 Cliente", value: `**${params.nombreCliente.trim()}**`, inline: false },
      { name: "👤 Vendedor", value: `**${vendedorName}**`, inline: false },
      { name: "👤 Repartidor/Cambaceador", value: `**${repartidorName}**`, inline: false },
      { name: "💵 Pago Recibido", value: `**$${params.pagoRecibido.toFixed(2)}**`, inline: true },
    ];

    if (params.celular) {
      const cleanCelular = params.celular.replace(/ - \d+GB.*$/, "");
      fields.push({ name: "📱 Equipo", value: `**${cleanCelular}** ${params.colorCelular ? `(${params.colorCelular})` : ""}`, inline: false });
    }
    if (params.imei) {
      fields.push({ name: "🆔 IMEI", value: `\`${params.imei}\``, inline: false });
    }

    if (params.comentarios && params.comentarios.trim()) {
      fields.push({ name: "📝 Comentarios", value: params.comentarios.trim(), inline: false });
    }

    fields.push(
      { name: "📄 Archivo Comprobante", value: `[Visualizar](${params.comprobanteUrl})`, inline: false }
    );

    const embed = {
      title: "NUEVA VENTA REGISTRADA 🧾",
      description: `Se ha registrado en Finvora un nuevo comprobante.`,
      color: 0x10b981,
      fields: fields,
      timestamp: new Date().toISOString(),
    };

    const discordResponse = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: "Finvora Comprobantes",
        avatar_url: `${siteUrl}/brands/finvoralogo.webp`,
        content: roleId ? `🛎️ <@&${roleId}>` : undefined,
        embeds: [embed]
      }),
    });

    if (!discordResponse.ok) {
      console.error(`Error de Discord API al notificar comprobante: status ${discordResponse.status}`);
    }
  } catch (discordError) {
    console.error("Error enviando notificación de comprobante a Discord:", discordError);
  }
}

/**
 * Server Action para subir un comprobante de enganche y registrarlo en la base de datos.
 * Accesible por: Admin, Supervisor, Developer, Repartidor.
 */
export async function submitComprobante(formData: FormData) {
  const { id: currentUserId, role: userRole, username: currentUsername } = await getUserProfile();

  if (!currentUserId || !isAllowed(userRole, ["Developer", "Admin", "Supervisor", "Repartidor", "Cambaceador", "CambaCloser"])) {
    return { success: false, error: "No autorizado. No tienes los permisos necesarios." };
  }

  const nombreCliente = formData.get("nombre_cliente") as string;
  const comentarios = formData.get("comentarios") as string;
  const vendedorId = formData.get("vendedor_id") as string;
  const repartidorId = formData.get("repartidor_id") as string;
  const precioCompraRaw = formData.get("precio_compra") as string;
  const pagoInicialRaw = formData.get("pago_inicial") as string;
  const pagoRecibidoRaw = formData.get("pago_recibido") as string;
  const celular = formData.get("celular") as string;
  const colorCelular = formData.get("color_celular") as string;
  const imei = formData.get("imei") as string;
  const file = formData.get("comprobante") as File | null;

  if (!nombreCliente || !nombreCliente.trim() || !vendedorId || !repartidorId || !precioCompraRaw || !pagoInicialRaw || !pagoRecibidoRaw || !file || file.size === 0) {
    return { success: false, error: "Todos los campos son obligatorios, incluyendo el comprobante." };
  }

  const precioCompra = parseFloat(precioCompraRaw.replace(',', '.'));
  const pagoInicial = parseFloat(pagoInicialRaw.replace(',', '.'));
  const pagoRecibido = parseFloat(pagoRecibidoRaw.replace(',', '.'));

  if (isNaN(precioCompra) || precioCompra < 0) {
    return { success: false, error: "El precio de compra debe ser un número válido mayor o igual a cero." };
  }
  if (isNaN(pagoInicial) || pagoInicial < 0) {
    return { success: false, error: "El pago inicial debe ser un número válido mayor o igual a cero." };
  }
  if (isNaN(pagoRecibido) || pagoRecibido < 0) {
    return { success: false, error: "El pago recibido debe ser un número válido mayor o igual a cero." };
  }

  const supabase = await createClient();

  // 1. Subir el comprobante a Supabase Storage
  const uploadResult = await uploadComprobanteFile(file, supabase);
  if (!uploadResult.success || !uploadResult.publicUrl) {
    return { success: false, error: uploadResult.error || "Error al subir el comprobante." };
  }

  const comprobanteUrl = uploadResult.publicUrl;

  // 2. Registrar en la base de datos
  const { error } = await supabase
    .from('comprobantes')
    .insert([{
      nombre_cliente: nombreCliente.trim(),
      comentarios: comentarios ? comentarios.trim() : null,
      vendedor_id: vendedorId,
      repartidor_id: repartidorId,
      precio_compra: precioCompra,
      pago_inicial: pagoInicial,
      pago_recibido: pagoRecibido,
      celular: celular || null,
      color_celular: colorCelular || null,
      imei: imei || null,
      comprobante_url: comprobanteUrl,
      creado_por: currentUserId
    }]);

  if (error) {
    console.error("Error al registrar comprobante en DB:", error);
    // Limpieza: intentar borrar el archivo de storage si falló la base de datos
    try {
      const searchString = "/storage/v1/object/public/comprobantes/";
      const index = comprobanteUrl.indexOf(searchString);
      if (index !== -1) {
        const filePath = comprobanteUrl.substring(index + searchString.length);
        await supabase.storage.from('comprobantes').remove([filePath]);
      }
    } catch (cleanupError) {
      console.error("Error al limpiar archivo de storage tras fallo en DB:", cleanupError);
    }
    return { success: false, error: `Error en la base de datos: ${error.message}` };
  }

  // 3. Si se seleccionó un IMEI, registrar la venta y dar de baja en la tabla de stock
  if (imei && imei.trim()) {
    const ventaResult = await registrarVenta(imei.trim(), vendedorId);
    if (ventaResult.error) {
      console.error("Error al registrar la venta de IMEI desde comprobantes:", ventaResult.error);
    }
  }

  // 4. Enviar notificación a Discord (asíncrona)
  sendDiscordNotification({
    nombreCliente,
    vendedorId,
    repartidorId,
    precioCompra,
    pagoInicial,
    pagoRecibido,
    celular,
    colorCelular,
    imei,
    comentarios,
    comprobanteUrl,
    userRole,
    currentUsername: currentUsername || "",
    supabase
  });

  revalidatePath('/empresa/webapp/comprobantes');
  return { success: true };
}

/**
 * Server Action para obtener los comprobantes cargados en los últimos 2 meses.
 * Accesible únicamente por roles superiores: Admin, Supervisor, Developer.
 */
export async function getComprobantes(): Promise<{ success: boolean; data?: ComprobanteRecord[]; error?: string }> {
  const { role: userRole } = await getUserProfile();

  if (!isAllowed(userRole, ["Admin", "Supervisor", "Developer"])) {
    return { success: false, error: "No autorizado. No tienes permisos para ver estos registros." };
  }

  const supabase = await createClient();

  // Calcular la fecha límite de hace 2 meses
  const twoMonthsAgo = new Date();
  twoMonthsAgo.setMonth(twoMonthsAgo.getMonth() - 2);

  const { data, error } = await supabase
    .from('comprobantes')
    .select(`
      id,
      nombre_cliente,
      comentarios,
      precio_compra,
      pago_inicial,
      pago_recibido,
      celular,
      color_celular,
      imei,
      comprobante_url,
      created_at,
      vendedor:perfiles!vendedor_id (id, username, role),
      repartidor:repartidores!repartidor_id (id, nombre),
      creador:perfiles!creado_por (id, username, role)
    `)
    .gte('created_at', twoMonthsAgo.toISOString())
    .order('created_at', { ascending: false });

  if (error) {
    console.error("Error al obtener comprobantes:", error);
    return { success: false, error: `Error en la consulta: ${error.message}` };
  }

  // Mapeamos los datos de tipado para devolver un esquema seguro
  const rawComprobantes = (data as any) as ComprobanteRawResponse[] | null;
  const formattedData: ComprobanteRecord[] = (rawComprobantes || []).map((comprobanteRaw: ComprobanteRawResponse) => ({
    id: comprobanteRaw.id,
    nombre_cliente: comprobanteRaw.nombre_cliente,
    comentarios: comprobanteRaw.comentarios || null,
    precio_compra: Number(comprobanteRaw.precio_compra),
    pago_inicial: Number(comprobanteRaw.pago_inicial),
    pago_recibido: Number(comprobanteRaw.pago_recibido),
    celular: comprobanteRaw.celular || null,
    color_celular: comprobanteRaw.color_celular || null,
    imei: comprobanteRaw.imei || null,
    comprobante_url: comprobanteRaw.comprobante_url,
    created_at: comprobanteRaw.created_at,
    vendedor: Array.isArray(comprobanteRaw.vendedor) ? comprobanteRaw.vendedor[0] : (comprobanteRaw.vendedor as PerfilSubQuery | null),
    repartidor: Array.isArray(comprobanteRaw.repartidor) ? comprobanteRaw.repartidor[0] : (comprobanteRaw.repartidor as RepartidorSubQuery | null),
    creador: Array.isArray(comprobanteRaw.creador) ? comprobanteRaw.creador[0] : (comprobanteRaw.creador as PerfilSubQuery | null),
  }));

  return { success: true, data: formattedData };
}

/**
 * Server Action para eliminar un comprobante de la base de datos y su archivo de storage.
 * Accesible únicamente por roles superiores: Admin, Supervisor, Developer.
 */
export async function eliminarComprobante(id: string): Promise<{ success: boolean; error?: string }> {
  const { role: userRole } = await getUserProfile();

  if (!isAllowed(userRole, ["Admin", "Supervisor", "Developer"])) {
    return { success: false, error: "No autorizado. No tienes permisos para eliminar registros." };
  }

  const supabase = await createClient();

  // 1. Obtener la URL del comprobante para poder borrar el archivo de storage
  const { data: comprobanteItem, error: fetchError } = await supabase
    .from('comprobantes')
    .select('comprobante_url')
    .eq('id', id)
    .single();

  if (fetchError || !comprobanteItem) {
    console.error("Error al buscar el comprobante:", fetchError);
    return { success: false, error: "No se encontró el registro a eliminar." };
  }

  const comprobanteUrl = comprobanteItem.comprobante_url;

  // 2. Eliminar el registro de la base de datos
  const { data: deletedRows, error: deleteError } = await supabase
    .from('comprobantes')
    .delete()
    .eq('id', id)
    .select();

  if (deleteError) {
    console.error("Error al eliminar el comprobante de la DB:", deleteError);
    return { success: false, error: `Error en la base de datos: ${deleteError.message}` };
  }

  if (!deletedRows || deletedRows.length === 0) {
    console.warn("No se eliminó ninguna fila. RLS podría estar bloqueando el DELETE.");
    return {
      success: false,
      error: "No se pudo eliminar el registro. Row Level Security (RLS) bloqueó la operación o no tienes permisos de eliminación en Supabase para la tabla 'comprobantes'."
    };
  }

  // 3. Eliminar el archivo de Supabase Storage
  try {
    const searchString = "/storage/v1/object/public/comprobantes/";
    const index = comprobanteUrl.indexOf(searchString);
    if (index !== -1) {
      const filePath = comprobanteUrl.substring(index + searchString.length);
      await supabase.storage.from('comprobantes').remove([filePath]);
    }
  } catch (cleanupError) {
    console.error("Error al limpiar archivo de storage tras eliminación:", cleanupError);
  }

  revalidatePath('/empresa/webapp/comprobantes');
  return { success: true };
}
