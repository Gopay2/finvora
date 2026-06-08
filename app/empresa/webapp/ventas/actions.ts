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
    cliente_historial: formData.get("cliente_historial") as string,
    zona: formData.get("zona") as string,
    repartidor: formData.get("repartidor") as string,
    especificarLocal: formData.get("especificar_local") as string,
    fecha: formData.get("fecha_entrega") as string,
    hora: formData.get("hora_entrega") as string,
    comentarios: formData.get("comentarios") as string,
  };

  // 4. CONFIGURACIÓN DEL WEBHOOK: Cargamos la URL del webhook de Discord según la zona elegida o el repartidor
  const zonaNormalizada = (data.zona || "").trim().toLowerCase();
  const repartidorNormalizado = (data.repartidor || "").trim().toLowerCase();
  let webhookUrl = process.env.DISCORD_WEBHOOK_URL;

  if (repartidorNormalizado.includes("ct") && process.env.DISCORD_WEBHOOK_URL_6) {
    webhookUrl = process.env.DISCORD_WEBHOOK_URL_6;
  } else if (repartidorNormalizado.includes("cambaceo victor") && process.env.DISCORD_WEBHOOK_URL_3) {
    webhookUrl = process.env.DISCORD_WEBHOOK_URL_3;
  } else if (repartidorNormalizado.includes("cambaceo kevin") && process.env.DISCORD_WEBHOOK_URL_4) {
    webhookUrl = process.env.DISCORD_WEBHOOK_URL_4;
  } else if (repartidorNormalizado.includes("cambaceo angel") && process.env.DISCORD_WEBHOOK_URL_5) {
    webhookUrl = process.env.DISCORD_WEBHOOK_URL_5;
  } else if (zonaNormalizada === "monterrey") {
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
  const embed = {
    title: "NUEVA VENTA REGISTRADA 🚀",
    description: `Registrado a través de la app web.`,
    color: 0xef4444, // Rojo llamativo para llamar la atención del equipo de operaciones
    fields: fields,
    timestamp: new Date().toISOString(),
  };

  // Mención opcional a un rol específico de Discord (ej. Coordinadores o Closers) si está configurado
  const isCambaceo = repartidorNormalizado.includes("cambaceo victor") || repartidorNormalizado.includes("cambaceo kevin") || repartidorNormalizado.includes("cambaceo angel");
  const isCT = repartidorNormalizado.includes("ct");
  const roleId = ((isCambaceo || isCT) && process.env.DISCORD_ROLE_ID_2)
    ? process.env.DISCORD_ROLE_ID_2
    : process.env.DISCORD_ROLE_ID;
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

/**
 * Server Action para registrar y notificar una venta de Cambaceo.
 * Estructura un Embed simplificado en Discord donde el Cambaceador es reportado directamente como el Vendedor.
 */
export async function submitVentaCambaceo(formData: FormData) {
  const supabase = await createClient();

  // 1. CONTROL DE ACCESO: Validar sesión del usuario
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return { success: false, error: "No autorizado. Debes iniciar sesión." };
  }

  // 2. EXTRACCIÓN DE DATOS SIMPLIFICADOS
  const data = {
    enganche_cliente: formData.get("enganche_cliente") as string,
    enganche_plataforma: formData.get("enganche_plataforma") as string,
    celular: formData.get("celular") as string,
    color: formData.get("color_celular") as string,
    imei: formData.get("imei") as string,
    repartidor: formData.get("repartidor") as string,
    comentarios: formData.get("comentarios") as string,
  };

  const file = formData.get("documento") as File | null;

  // 3. CONFIGURACIÓN DEL WEBHOOK (URLs 3, 4 y 5 de Cambaceo con fallback)
  const repartidorNormalizado = (data.repartidor || "").trim().toLowerCase();
  let webhookUrl = process.env.DISCORD_WEBHOOK_URL;

  if (repartidorNormalizado.includes("cambaceo victor") && process.env.DISCORD_WEBHOOK_URL_3) {
    webhookUrl = process.env.DISCORD_WEBHOOK_URL_3;
  } else if (repartidorNormalizado.includes("cambaceo kevin") && process.env.DISCORD_WEBHOOK_URL_4) {
    webhookUrl = process.env.DISCORD_WEBHOOK_URL_4;
  } else if (repartidorNormalizado.includes("cambaceo angel") && process.env.DISCORD_WEBHOOK_URL_5) {
    webhookUrl = process.env.DISCORD_WEBHOOK_URL_5;
  }

  if (!webhookUrl) {
    console.error("DISCORD_WEBHOOK_URL no está configurada en las variables de entorno.");
    return { success: false, error: "Error de configuración en el servidor." };
  }

  // 5. ESTRUCTURA DEL EMBED SIMPLIFICADO: El Cambaceador figura como Vendedor
  const fields = [
    { name: "👤 Vendedor", value: `**${data.repartidor}**`, inline: false },
    { name: "📱 Equipo", value: `**${data.celular}** (${data.color})`, inline: false },
    { name: "🆔 IMEI", value: data.imei ? `\`${data.imei}\`` : "No especificado", inline: false },
    { name: "💰 Enganche Cliente", value: `**$${data.enganche_cliente}**`, inline: false },
    { name: "💰 Enganche Plataforma", value: `**$${data.enganche_plataforma}**`, inline: false },
  ];

  if (data.comentarios && data.comentarios.trim() !== "") {
    fields.push({ name: "💬 Comentarios", value: data.comentarios, inline: false });
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://finvora.mx';

  // Creamos la estructura del Embed
  const embed: any = {
    title: "🚀 NUEVO REGISTRO DE CAMBACEO",
    description: `Registrado a través del formulario simplificado.`,
    color: 0xef4444, // Rojo llamativo
    fields: fields,
    timestamp: new Date().toISOString(),
  };

  const hasFile = file && file.size > 0;
  const isImage = hasFile && file.type.startsWith("image/");

  const extension = file && file.name ? file.name.split('.').pop() || 'png' : 'png';
  const safeFileName = `Comprobante_${Date.now()}.${extension}`;

  if (hasFile) {
    if (isImage) {
      embed.image = {
        url: `attachment://${safeFileName}`
      };
      fields.push({ name: "📄 Comprobante", value: "", inline: false });
    }
  }

  // Mención de rol específica de Cambaceo: DISCORD_ROLE_ID_2 (con fallback a DISCORD_ROLE_ID)
  const roleId = process.env.DISCORD_ROLE_ID_2 || process.env.DISCORD_ROLE_ID;
  const content = roleId ? `🛎️ <@&${roleId}>` : undefined;

  // 6. ENVÍO DEL MENSAJE (JSON o Multipart según la presencia y tipo de archivos)
  try {
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://finvora.mx';
    const botProfile = {
      username: "Finvora Ventas",
      avatar_url: `${siteUrl}/brands/finvoralogo.webp`
    };

    if (hasFile) {
      if (isImage) {
        // --- CASO IMAGEN: Se envía en una sola petición multipart/form-data integrada ---
        const discordFormData = new FormData();
        discordFormData.append("payload_json", JSON.stringify({
          ...botProfile,
          content: content,
          embeds: [embed]
        }));

        const arrayBuffer = await file.arrayBuffer();
        const fileBlob = new Blob([arrayBuffer], { type: file.type });
        discordFormData.append("files[0]", fileBlob, safeFileName);

        const response = await fetch(webhookUrl, {
          method: 'POST',
          body: discordFormData,
        });

        if (!response.ok) {
          const errText = await response.text();
          throw new Error(`Discord API (Image) responded with status ${response.status}: ${errText}`);
        }
      } else {
        // --- CASO PDF (u otros archivos): Se envían dos peticiones consecutivas para que el archivo aparezca ABAJO ---

        // Petición 1: Enviar el Embed principal
        const responseEmbed = await fetch(webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...botProfile,
            content: content,
            embeds: [embed]
          }),
        });

        if (!responseEmbed.ok) {
          const errText = await responseEmbed.text();
          throw new Error(`Discord API (Embed) responded with status ${responseEmbed.status}: ${errText}`);
        }

        // Esperar 1 segundo para garantizar que Discord procese y posicione el Embed primero en el canal
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Petición 2: Enviar el documento adjunto al final
        const discordFormData = new FormData();
        discordFormData.append("payload_json", JSON.stringify({
          ...botProfile,
          content: `📄 Comprobante adjunto para la venta de **${data.repartidor}**:`
        }));

        const arrayBuffer = await file.arrayBuffer();
        const fileBlob = new Blob([arrayBuffer], { type: file.type });
        discordFormData.append("files[0]", fileBlob, safeFileName);

        const responseFile = await fetch(webhookUrl, {
          method: 'POST',
          body: discordFormData,
        });

        if (!responseFile.ok) {
          const errText = await responseFile.text();
          throw new Error(`Discord API (File) responded with status ${responseFile.status}: ${errText}`);
        }
      }
    } else {
      // --- CASO SIN ARCHIVOS: Envío directo de JSON ---
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...botProfile,
          content: content,
          embeds: [embed]
        }),
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Discord API (JSON) responded with status ${response.status}: ${errText}`);
      }
    }

    return { success: true };
  } catch (error) {
    console.error("Error enviando a Discord:", error);
    return { success: false, error: "No se pudo enviar la notificación a Discord." };
  }
}
