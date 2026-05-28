'use server';

import { createClient } from "@/utils/supabase/server";

/**
 * Server Action que procesa el registro y envío de una nueva venta directa a un canal de Discord.
 * Realiza verificaciones de sesión del vendedor, formatea un enlace interactivo de WhatsApp
 * para contacto rápido con el cliente, y estructura un Embed estético de Discord para notificaciones
 * de ventas de alta prioridad.
 * 
 * @security Valida de forma estricta que exista una sesión de usuario activa para prevenir el spam o inyecciones de ventas falsas desde clientes no autenticados.
 * @param formData Datos enviados desde el formulario de Ventas (nombre de cliente, identificación, CURP, enganche, dirección, teléfono, etc.)
 * @returns Objeto de respuesta que indica si el envío fue exitoso o el mensaje de error correspondiente.
 */
export async function submitVenta(formData: FormData) {
  const supabase = await createClient();

  // 1. CONTROL DE ACCESO: Validamos activamente que el usuario esté logueado
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return { success: false, error: "No autorizado. Debes iniciar sesión." };
  }

  // 2. OBTENER INFORMACIÓN DE PERFIL: Recuperamos el nombre de usuario y rol del vendedor
  const { data: profile } = await supabase
    .from("perfiles")
    .select("role, username")
    .eq("id", user.id)
    .single();

  const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
  const userDisplayName = profile?.username
    ? `${profile.role}: ${capitalize(profile.username)}`
    : user.email;

  // 3. EXTRACCIÓN DE DATOS: Obtenemos los campos clave capturados del formulario
  const data = {
    nombre: formData.get("nombre_cliente") as string,
    identificacion: formData.get("identificacion_fisica") as string,
    curp: formData.get("curp") as string,
    telefono: formData.get("telefono") as string,
    direccion: formData.get("direccion") as string,
    enganche: formData.get("enganche") as string,
    celular: formData.get("celular") as string,
    color: formData.get("color_celular") as string,
    imei: formData.get("imei") as string,
    cuenta: formData.get("cuenta_activa") as string,
    zona: formData.get("zona") as string,
    repartidor: formData.get("repartidor") as string,
    fecha: formData.get("fecha_entrega") as string,
    hora: formData.get("hora_entrega") as string,
    comentarios: formData.get("comentarios") as string,
  };

  // 4. CONFIGURACIÓN DEL WEBHOOK: Cargamos la URL del webhook de Discord según la zona elegida
  const zonaNormalizada = (data.zona || "").trim().toLowerCase();
  let webhookUrl = process.env.DISCORD_WEBHOOK_URL;

  if (zonaNormalizada === "monterrey") {
    webhookUrl = process.env.DISCORD_WEBHOOK_URL_2 || process.env.DISCORD_WEBHOOK_URL;
  }

  if (!webhookUrl) {
    console.error("DISCORD_WEBHOOK_URL no está configurada en las variables de entorno.");
    return { success: false, error: "Error de configuración en el servidor." };
  }

  // 5. ENLACE DE WHATSAPP: Limpiamos el teléfono (solo dígitos) para habilitar un chat directo con el cliente
  const cleanPhone = data.telefono.replace(/\D/g, '');
  const whatsappUrl = `https://wa.me/${cleanPhone}`;

  // 6. ESTRUCTURA DEL PAYLOAD: Diseñamos los campos (fields) del Embed para organizar visualmente los datos
  const fields = [
    { name: "👤 Vendedor", value: `**${userDisplayName}**`, inline: false },
    { name: "👤 Cliente", value: `**${data.nombre}**`, inline: false },
    { name: "🪪 CURP", value: `\`${data.curp}\``, inline: false },
    { name: "📄 Identificación física vigente", value: data.identificacion, inline: false },
    { name: "📞 Teléfono", value: `[${data.telefono}](${whatsappUrl})`, inline: false },
    { name: "📍 Dirección", value: data.direccion, inline: false },
    { name: "📍 Zona de Reparto", value: data.zona || "No especificada", inline: false },
    { name: "🛵 Repartidor Asignado", value: data.repartidor || "No asignado", inline: false },
    { name: "📱 Equipo", value: `**${data.celular}** (${data.color})`, inline: false },
    { name: "🆔 IMEI", value: data.imei ? `\`${data.imei}\`` : "No especificado", inline: false },
    { name: "💰 Enganche", value: `**$${data.enganche}**`, inline: false },
    { name: "✅ Cuenta Activa", value: data.cuenta.toUpperCase(), inline: false },
    { name: "📅 Fecha de Entrega", value: data.fecha, inline: false },
    { name: "⏰ Hora de Entrega", value: data.hora, inline: false },
  ];

  // Agregamos el campo de comentarios de forma condicional si no está vacío
  if (data.comentarios && data.comentarios.trim() !== "") {
    fields.push({ name: "💬 Comentarios", value: data.comentarios, inline: false });
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://finvora.mx';

  // 7. DISEÑO ESTÉTICO DEL EMBED: Configuramos un color rojo llamativo y metadatos limpios
  const embed = {
    title: "NUEVA VENTA REGISTRADA 🚀",
    description: `Registrado a través de la app web.`,
    color: 0xef4444, // Rojo llamativo para llamar la atención del equipo de operaciones
    fields: fields,
    timestamp: new Date().toISOString(),
  };

  // Mención opcional a un rol específico de Discord (ej. Coordinadores o Closers) si está configurado
  const roleId = process.env.DISCORD_ROLE_ID;
  const content = roleId ? `🛎️ <@&${roleId}>` : undefined;

  // 8. ENVÍO DEL MENSAJE: Realizamos la llamada HTTP POST al Webhook
  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: "Finvora Ventas",
        avatar_url: `${siteUrl}/brands/finvoralogo.webp`,
        content: content,
        embeds: [embed]
      }),
    });

    if (!response.ok) {
      throw new Error(`Discord API responded with status ${response.status}`);
    }

    return { success: true };
  } catch (error) {
    console.error("Error enviando a Discord:", error);
    return { success: false, error: "No se pudo enviar la notificación a Discord." };
  }
}
