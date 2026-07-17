'use server';

import { createClient } from "@/utils/supabase/server";

/**
 * Server Action que procesa el registro y envío de una nueva orden de entrega a un canal de Discord.
 * Realiza verificaciones de sesión del vendedor, formatea un enlace interactivo de WhatsApp
 * para contacto rápido con el cliente, y estructura un Embed estético de Discord para notificaciones
 * de ordenes de entrega de alta prioridad.
 * 
 * @security Valida de forma estricta que exista una sesión de usuario activa para prevenir el spam o inyecciones de órdenes falsas desde clientes no autenticados.
 * @param formData Datos enviados desde el formulario de Orden de Entrega (nombre de cliente, identificación, CURP, enganche, dirección, teléfono, etc.)
 * @returns Objeto de respuesta que indica si el envío fue exitoso o el mensaje de error correspondiente.
 */
export async function submitOrdenEntrega(formData: FormData) {
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
    cliente_historial: formData.get("cliente_historial") as string,
    zona: formData.get("zona") as string,
    repartidor: formData.get("repartidor") as string,
    repartidor_id: formData.get("repartidor_id") as string,
    especificarLocal: formData.get("especificar_local") as string,
    fecha: formData.get("fecha_entrega") as string,
    hora: formData.get("hora_entrega") as string,
    comentarios: formData.get("comentarios") as string,
  };

  const verificacionFile = formData.get("verificacion_crediticia") as any;

  // 3.5. PERSISTIR EN BASE DE DATOS Y OBTENER FOLIO ÚNICO
  const { data: dbData, error: insertError } = await supabase
    .from("ordenes_entrega")
    .insert({
      vendedor_id: user.id,
      nombre_cliente: data.nombre,
      identificacion_fisica: data.identificacion || null,
      curp: data.curp || null,
      telefono: data.telefono,
      direccion: data.direccion,
      enganche: data.enganche ? parseFloat(data.enganche) : null,
      celular: data.celular,
      color_celular: data.color,
      imei: data.imei || null,
      cuenta_activa: data.cuenta,
      cliente_historial: data.cliente_historial || null,
      zona: data.zona,
      repartidor: data.repartidor || null,
      repartidor_id: data.repartidor_id || null,
      especificar_local: data.especificarLocal || null,
      fecha_entrega: data.fecha || null,
      hora_entrega: data.hora || null,
      comentarios: data.comentarios || null
    })
    .select("folio")
    .single();

  if (insertError) {
    console.error("Error al guardar la orden de entrega:", insertError);
    return { success: false, error: "No se pudo guardar la orden de entrega en la base de datos." };
  }

  const generatedFolio = dbData?.folio || "SIN-FOLIO";

  // 4. CONFIGURACIÓN DEL WEBHOOK: Cargamos la URL del webhook de Discord según la zona elegida o el repartidor
  const zonaNormalizada = (data.zona || "").trim().toLowerCase();
  const repartidorNormalizado = (data.repartidor || "").trim().toLowerCase();
  let webhookUrl = process.env.DISCORD_WEBHOOK_URL;

  if (repartidorNormalizado.includes("ct") && process.env.DISCORD_WEBHOOK_URL_6) {
    webhookUrl = process.env.DISCORD_WEBHOOK_URL_6;
  } else if (repartidorNormalizado.includes("cambaceo victor") && process.env.DISCORD_WEBHOOK_URL_3) {
    webhookUrl = process.env.DISCORD_WEBHOOK_URL_3;
  } else if (repartidorNormalizado.includes("cambaceo angel") && process.env.DISCORD_WEBHOOK_URL_5) {
    webhookUrl = process.env.DISCORD_WEBHOOK_URL_5;
  } else if (repartidorNormalizado.includes("cambaceo brenda") && process.env.DISCORD_WEBHOOK_URL_7) {
    webhookUrl = process.env.DISCORD_WEBHOOK_URL_7;
  } else if (zonaNormalizada === "monterrey") {
    webhookUrl = process.env.DISCORD_WEBHOOK_URL_2 || process.env.DISCORD_WEBHOOK_URL;
  } else if (zonaNormalizada === "mexicali") {
    webhookUrl = process.env.DISCORD_WEBHOOK_URL_9 || process.env.DISCORD_WEBHOOK_URL;
  } else if (zonaNormalizada === "guadalajara") {
    webhookUrl = process.env.DISCORD_WEBHOOK_URL_4 || process.env.DISCORD_WEBHOOK_URL;
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
    { name: "📋 Folio de Orden", value: `**${generatedFolio}**`, inline: false },
    { name: "👤 Vendedor", value: `**${userDisplayName}**`, inline: false },
    { name: "👤 Cliente", value: `**${data.nombre}**`, inline: false },
    { name: "🪪 CURP", value: `\`${data.curp}\``, inline: false },
    { name: "📄 Identificación física vigente", value: data.identificacion, inline: false },
    { name: "📞 Teléfono", value: `[${data.telefono}](${whatsappUrl})`, inline: false },
    { name: "📍 Dirección", value: data.direccion, inline: false },
    { name: "📍 Zona de Reparto", value: data.zona || "No especificada", inline: false },
    { name: "🛵 Repartidor Asignado", value: data.repartidor || "No asignado", inline: false },
  ];

  if (data.repartidor === "Local CT" && data.especificarLocal) {
    fields.push({ name: "🏪 Local Especificado", value: data.especificarLocal, inline: false });
  }

  fields.push(
    { name: "📱 Equipo", value: `**${data.celular}** (${data.color})`, inline: false },
    { name: "🆔 IMEI", value: data.imei ? `\`${data.imei}\`` : "No especificado", inline: false },
    { name: "💰 Enganche", value: `**$${data.enganche}**`, inline: false },
    { name: "✅ Cuenta Activa", value: data.cuenta.toUpperCase(), inline: false },
    { name: "📜 ¿Cliente con historial?", value: data.cliente_historial ? data.cliente_historial.toUpperCase() : "NO ESPECIFICADO", inline: false },
    { name: "📅 Fecha de Entrega", value: data.fecha, inline: false },
    { name: "⏰ Hora de Entrega", value: data.hora, inline: false }
  );

  // Agregamos el campo de comentarios de forma condicional si no está vacío
  if (data.comentarios && data.comentarios.trim() !== "") {
    fields.push({ name: "💬 Comentarios", value: data.comentarios, inline: false });
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://finvora.mx';

  // 7. DISEÑO ESTÉTICO DEL EMBED: Configuramos un color rojo llamativo y metadatos limpios
  const embed: any = {
    title: `NUEVA ORDEN DE ENTREGA 🚀`,
    description: `Registrado a través de la app web.`,
    color: 0xef4444, // Rojo llamativo para llamar la atención del equipo de operaciones
    fields: fields,
    timestamp: new Date().toISOString(),
  };

  const embeds = [embed];
  const hasFile = verificacionFile && verificacionFile.size > 0;
  const isImage = hasFile && verificacionFile.type.startsWith("image/");

  if (isImage) {
    // Si es imagen, la metemos al final del embed único y le creamos un field de título directamente arriba
    fields.push({
      name: "📄 Verificación Crediticia",
      value: "", // El espacio de ancho cero oculta el valor en Discord, mostrando solo el título
      inline: false
    });
    embed.image = { url: `attachment://${verificacionFile.name}` };
  }

  // Mención opcional a un rol específico de Discord (ej. Coordinadores o Closers) si está configurado
  const isCambaceo = 
    repartidorNormalizado.includes("cambaceo victor") || 
    repartidorNormalizado.includes("cambaceo angel") ||
    repartidorNormalizado.includes("cambaceo brenda");
  const isCT = repartidorNormalizado.includes("ct");
  const roleId = ((isCambaceo || isCT) && process.env.DISCORD_ROLE_ID_2)
    ? process.env.DISCORD_ROLE_ID_2
    : process.env.DISCORD_ROLE_ID;
  const content = roleId ? `🛎️ <@&${roleId}>` : undefined;

  // 8. ENVÍO DEL MENSAJE: Realizamos la llamada HTTP POST al Webhook
  try {
    let response;

    if (isImage) {
      // Caso Imagen: Envío único con el embed y la imagen adjunta
      const discordForm = new FormData();
      
      discordForm.append("payload_json", JSON.stringify({
        username: "Finvora Ventas",
        avatar_url: `${siteUrl}/brands/finvoralogo.webp`,
        content: content,
        embeds: embeds
      }));

      discordForm.append("files[0]", verificacionFile, verificacionFile.name);

      response = await fetch(webhookUrl, {
        method: 'POST',
        body: discordForm
      });
    } else {
      // Caso PDF o Sin Archivo: Enviamos primero el embed como JSON
      response = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: "Finvora Ventas",
          avatar_url: `${siteUrl}/brands/finvoralogo.webp`,
          content: content,
          embeds: embeds
        }),
      });

      // Si es un PDF y la primera petición fue exitosa, enviamos el archivo en un segundo mensaje consecutivo
      if (response.ok && hasFile) {
        try {
          const secondForm = new FormData();
          secondForm.append("payload_json", JSON.stringify({
            username: "Finvora Ventas",
            avatar_url: `${siteUrl}/brands/finvoralogo.webp`,
            content: `📄 Verificación crediticia adjunta para la orden **${generatedFolio}**:`
          }));
          secondForm.append("files[0]", verificacionFile, verificacionFile.name);

          await fetch(webhookUrl, {
            method: 'POST',
            body: secondForm
          });
        } catch (secError) {
          console.error("Error enviando el archivo PDF adjunto a Discord:", secError);
          // No bloqueamos el flujo principal si el segundo mensaje falla por red
        }
      }
    }

    if (!response.ok) {
      throw new Error(`Discord API responded with status ${response.status}`);
    }

    return { success: true, folio: generatedFolio };
  } catch (error) {
    console.error("Error enviando a Discord:", error);
    return { success: false, error: "No se pudo enviar la notificación a Discord." };
  }
}

