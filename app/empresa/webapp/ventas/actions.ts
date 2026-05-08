'use server';

import { createClient } from "@/utils/supabase/server";

/**
 * Acción de servidor para enviar los datos de la venta a Discord mediante un Webhook.
 */
export async function submitVenta(formData: FormData) {
  const supabase = await createClient();

  // Obtenemos el perfil del usuario logueado
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = await supabase
    .from("perfiles")
    .select("role, username")
    .eq("id", user?.id)
    .single();

  const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
  const userDisplayName = profile?.username
    ? `${profile.role}: ${capitalize(profile.username)}`
    : user?.email;

  const webhookUrl = process.env.DISCORD_WEBHOOK_URL;

  if (!webhookUrl) {
    console.error("DISCORD_WEBHOOK_URL no está configurada en las variables de entorno.");
    return { success: false, error: "Error de configuración en el servidor." };
  }

  // Extraemos los datos del formulario
  const data = {
    nombre: formData.get("nombre_cliente") as string,
    identificacion: formData.get("identificacion_fisica") as string,
    curp: formData.get("curp") as string,
    telefono: formData.get("telefono") as string,
    direccion: formData.get("direccion") as string,
    enganche: formData.get("enganche") as string,
    celular: formData.get("celular") as string,
    color: formData.get("color_celular") as string,
    cuenta: formData.get("cuenta_activa") as string,
    fecha: formData.get("fecha_entrega") as string,
    hora: formData.get("hora_entrega") as string,
    comentarios: formData.get("comentarios") as string,
  };

  // Limpiamos el teléfono para el link de WhatsApp (solo números)
  const cleanPhone = data.telefono.replace(/\D/g, '');
  const whatsappUrl = `https://wa.me/${cleanPhone}`;

  // Formateamos el mensaje para Discord usando "Embeds" para que se vea prolijo
  const fields = [
    { name: "👤 Vendedor", value: `**${userDisplayName}**`, inline: false },
    { name: "👤 Cliente", value: `**${data.nombre}**`, inline: false },
    { name: "🪪 CURP", value: `\`${data.curp}\``, inline: false },
    { name: "📄 Identificación física vigente", value: data.identificacion, inline: false },
    { name: "📞 Teléfono", value: `[${data.telefono}](${whatsappUrl})`, inline: false },
    { name: "📍 Dirección", value: data.direccion, inline: false },
    { name: "📱 Equipo", value: `**${data.celular}** (${data.color})`, inline: false },
    { name: "💰 Enganche", value: `**$${data.enganche}**`, inline: false },
    { name: "✅ Cuenta Activa", value: data.cuenta.toUpperCase(), inline: false },
    { name: "📅 Fecha de Entrega", value: data.fecha, inline: false },
    { name: "⏰ Hora de Entrega", value: data.hora, inline: false },
  ];


  // Agregamos comentarios solo si existen
  if (data.comentarios && data.comentarios.trim() !== "") {
    fields.push({ name: "💬 Comentarios", value: data.comentarios, inline: false });
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://finvora.mx';

  const embed = {
    title: "NUEVA VENTA REGISTRADA 🚀",
    description: `Registrado a través de la app web.`,
    color: 0xef4444, // Rojo llamativo para alertas de venta
    fields: fields,
    timestamp: new Date().toISOString(),
  };

  const roleId = process.env.DISCORD_ROLE_ID;
  const content = roleId ? `🛎️ <@&${roleId}>` : undefined;

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
