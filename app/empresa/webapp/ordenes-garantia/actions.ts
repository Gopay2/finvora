'use server';

import { createClient } from "@/utils/supabase/server";

/**
 * Server Action para insertar la orden de garantía en Supabase y enviar la alerta a Discord.
 */
export async function submitOrdenGarantia(formData: FormData) {
  const supabase = await createClient();

  // CONTROL DE ACCESO
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return { success: false, error: "No autorizado. Debes iniciar sesión." };
  }

  // Obtener el perfil del creador
  const { data: profile } = await supabase
    .from("perfiles")
    .select("role, username")
    .eq("id", user.id)
    .single();

  const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
  const userDisplayName = profile?.username
    ? `${profile.role}: ${capitalize(profile.username)}`
    : user.email;

  // Extracción de datos del formulario (agrupando Marca y Modelo)
  const marcaForm = formData.get("marca") as string;
  const modeloForm = formData.get("modelo") as string;
  const modeloCompleto = `${marcaForm} ${modeloForm}`;

  const data = {
    nombre_cliente: formData.get("nombre_cliente") as string,
    telefono: formData.get("telefono") as string,
    ubicacion: formData.get("ubicacion") as string,
    zona: formData.get("zona") as string,
    tag: formData.get("tag") as string,
    modelo: modeloCompleto,
    imei: formData.get("imei") as string,
    fecha_entrega: formData.get("fecha_entrega") as string, // Compra
    costo_equipo: formData.get("costo_equipo") as string,
    enganche_registrado: formData.get("enganche_registrado") as string,
    enganche_recibido: formData.get("enganche_recibido") as string,
    motivo_garantia: formData.get("motivo_garantia") as string,
    descripcion_falla: formData.get("descripcion_falla") as string,
    accesorios_entregados: formData.get("accesorios_entregados") as string,
    estado_fisico: formData.get("estado_fisico") as string,
    observaciones: formData.get("observaciones") as string,
  };

  // Múltiples fotos
  const fotosFiles = formData.getAll("fotos") as File[];
  const validFotos = fotosFiles.filter(f => f.size > 0);

  // 1. Guardar en Base de Datos Supabase
  const { data: dbData, error: insertError } = await supabase
    .from("ordenes_garantia")
    .insert({
      vendedor_id: user.id,
      zona: data.zona,
      nombre_cliente: data.nombre_cliente,
      telefono: data.telefono,
      ubicacion: data.ubicacion,
      tag: data.tag || null,
      modelo: data.modelo,
      imei: data.imei,
      fecha_entrega: data.fecha_entrega ? data.fecha_entrega : null,
      costo_equipo: data.costo_equipo ? parseFloat(data.costo_equipo) : null,
      enganche_registrado: data.enganche_registrado ? parseFloat(data.enganche_registrado) : null,
      enganche_recibido: data.enganche_recibido ? parseFloat(data.enganche_recibido) : null,
      motivo_garantia: data.motivo_garantia,
      descripcion_falla: data.descripcion_falla,
      accesorios_entregados: data.accesorios_entregados || null,
      estado_fisico: data.estado_fisico || null,
      observaciones: data.observaciones || null
    })
    .select("folio")
    .single();

  if (insertError) {
    console.error("Error al guardar orden de garantía:", insertError);
    return { success: false, error: "No se pudo guardar la orden de garantía en la base de datos." };
  }

  const generatedFolio = dbData?.folio || "SIN-FOLIO";

  // 2. Configurar Webhook de Discord
  const webhookUrl = process.env.DISCORD_WEBHOOK_URL_3 || process.env.DISCORD_WEBHOOK_URL;
  if (!webhookUrl) {
    console.error("DISCORD_WEBHOOK_URL_3 no configurado.");
    return { success: true, folio: generatedFolio, warning: "Guardado en BD pero webhook de Discord no configurado." };
  }

  // 3. Preparar WhatsApp Link
  const cleanPhone = data.telefono.replace(/\D/g, '');
  const whatsappUrl = `https://wa.me/${cleanPhone}`;

  // 4. Formatear campos del Embed
  const fields = [
    { name: "📋 Folio de Garantía", value: `**${generatedFolio}**`, inline: false },
    { name: "👤 Registrado Por", value: `**${userDisplayName}**`, inline: false },
    
    // Sección Cliente
    { name: "---------- Información del Cliente ----------", value: "", inline: false },
    { name: "👤 Nombre del Cliente", value: `**${data.nombre_cliente}**`, inline: false },
    { name: "📱 Teléfono", value: `[${data.telefono}](${whatsappUrl})`, inline: false },
    { name: "📍 Zona de Recepción", value: `**${data.zona}**`, inline: false },
    { name: "🏠 Ubicación", value: data.ubicacion, inline: false },
    
    // Sección Equipo
    { name: "---------- Información del Equipo ----------", value: "", inline: false },
    { name: "📱 Equipo", value: `**${data.modelo}**`, inline: false },
    { name: "🔢 IMEI", value: `\`${data.imei}\``, inline: false },
    { name: "🏷️ Tag", value: `\`${data.tag}\``, inline: false },

    // Sección Compra
    { name: "---------- Información de la Compra ----------", value: "", inline: false },
    { name: "📅 Fecha de entrega", value: data.fecha_entrega, inline: false },
    { name: "💰 Costo del equipo", value: `$${parseFloat(data.costo_equipo).toFixed(2)}`, inline: false },
    { name: "💰 Enganche registrado en sistema", value: `$${parseFloat(data.enganche_registrado).toFixed(2)}`, inline: false },
    { name: "💰 Enganche recibido", value: `$${parseFloat(data.enganche_recibido).toFixed(2)}`, inline: false },

    // Sección Garantía
    { name: "---------- Información de la Garantía ----------", value: "", inline: false },
    { name: "🔧 Motivo de la garantía", value: data.motivo_garantia, inline: false },
    { name: "📝 Descripción de la falla", value: data.descripcion_falla, inline: false },
    { name: "🎧 Accesorios entregados", value: data.accesorios_entregados, inline: false },
    { name: "📦 Estado físico del equipo al recibir", value: data.estado_fisico, inline: false },
    { name: "📝 Observaciones", value: data.observaciones, inline: false }
  ];

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://finvora.mx';
  const embedUrl = `${siteUrl}/empresa/webapp/ordenes-garantia`;

  // 5. Estructurar embeds
  const embeds: any[] = [];
  
  // Embed principal
  const mainEmbed: any = {
    title: `NUEVA ORDEN DE GARANTÍA 🔧`,
    url: embedUrl, // URL compartida para agrupar embeds
    description: `Registrado a través de la app web.`,
    color: 0xeab308, // Amarillo/Dorado llamativo
    fields: fields,
    timestamp: new Date().toISOString(),
  };

  // Si hay imágenes, agregamos un campo cabecera y las adjuntamos al final del embed utilizando su nombre nativo
  if (validFotos.length > 0) {
    fields.push({
      name: "📸 Fotos del equipo y fallo",
      value: "",
      inline: false
    });
    mainEmbed.image = { url: `attachment://${validFotos[0].name}` };
    embeds.push(mainEmbed);

    for (let i = 1; i < validFotos.length; i++) {
      embeds.push({
        url: embedUrl, // URL compartida idéntica para forzar la cuadrícula en un solo mensaje
        image: { url: `attachment://${validFotos[i].name}` }
      });
    }
  } else {
    embeds.push(mainEmbed);
  }

  const roleId = process.env.DISCORD_ROLE_ID_2;
  const content = roleId ? `🛎️ <@&${roleId}>` : undefined;

  // 6. Enviar a Discord
  try {
    const discordForm = new FormData();
    
    discordForm.append("payload_json", JSON.stringify({
      username: "Finvora Garantías",
      avatar_url: `${siteUrl}/brands/finvoralogo.webp`,
      content: content,
      embeds: embeds
    }));

    validFotos.forEach((file, index) => {
      discordForm.append(`files[${index}]`, file);
    });

    const response = await fetch(webhookUrl, {
      method: 'POST',
      body: discordForm
    });

    if (!response.ok) {
      throw new Error(`Discord API respondió con código ${response.status}`);
    }

    return { success: true, folio: generatedFolio };
  } catch (error) {
    console.error("Error enviando orden de garantía a Discord:", error);
    return { 
      success: true, 
      folio: generatedFolio, 
      warning: "La orden se guardó en la base de datos pero falló la notificación a Discord." 
    };
  }
}
