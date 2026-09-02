'use server';

import { createClient } from "@/utils/supabase/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";
import { getUserProfile, isAllowed } from "@/utils/auth-check";

const STORAGE_BUCKET = 'guias';
const ALLOWED_ADMIN_ROLES = ["Admin", "Supervisor", "Developer"];

/**
 * Helper para extraer la ruta interna (path) de una URL pública de Supabase Storage.
 * Limpia cualquier hash (#size=...) o query param (?t=...) antes de extraer la ruta.
 */
function getStoragePathFromUrl(url: string): string | null {
  try {
    if (!url) return null;
    const cleanUrl = url.split('#')[0].split('?')[0].trim();
    const searchString = `/storage/v1/object/public/${STORAGE_BUCKET}/`;
    const index = cleanUrl.indexOf(searchString);
    if (index !== -1) {
      return cleanUrl.substring(index + searchString.length);
    }
    return null;
  } catch (error) {
    console.error("Error al extraer path de URL:", error);
    return null;
  }
}

/**
 * Registra una categoría en guias_categorias si no existe.
 */
export async function asegurarCategoria(nombreCategoria: string) {
  const nombreLimpio = nombreCategoria.trim();
  if (!nombreLimpio) return;

  const supabase = await createClient();
  if (!supabase) return;

  try {
    const { data: existente } = await supabase
      .from('guias_categorias')
      .select('id')
      .ilike('nombre', nombreLimpio)
      .maybeSingle();

    if (!existente) {
      await supabase
        .from('guias_categorias')
        .insert([{ nombre: nombreLimpio }]);
    }
  } catch (err) {
    console.error("Error al asegurar categoría:", err);
  }
}

export interface ActionResponse {
  success?: boolean;
  error?: string;
  id?: string;
  url?: string;
}

/**
 * Crea una nueva categoría explícitamente desde el modal de edición de categorías.
 */
export async function crearNuevaCategoria(nombreCategoria: string): Promise<ActionResponse> {
  const userProfile = await getUserProfile();
  if (!isAllowed(userProfile.role, ALLOWED_ADMIN_ROLES)) {
    return { error: "No tienes permisos para crear categorías." };
  }

  const nombreLimpio = nombreCategoria.trim();
  if (!nombreLimpio) {
    return { error: "El nombre de la categoría no puede estar vacío." };
  }

  const supabase = await createClient();
  if (!supabase) return { error: "Sin conexión a la base de datos." };

  const { data: existente } = await supabase
    .from('guias_categorias')
    .select('id')
    .ilike('nombre', nombreLimpio)
    .maybeSingle();

  if (existente) {
    return { error: "Ya existe una categoría con ese nombre." };
  }

  const { error } = await supabase
    .from('guias_categorias')
    .insert([{ nombre: nombreLimpio }]);

  if (error) {
    return { error: error.message };
  }

  revalidatePath('/empresa/webapp/guias');
  return { success: true };
}

/**
 * Renombra una categoría existente y actualiza las guías vinculadas.
 */
export async function renombrarCategoria(nombreAnterior: string, nuevoNombre: string): Promise<ActionResponse> {
  const userProfile = await getUserProfile();
  if (!isAllowed(userProfile.role, ALLOWED_ADMIN_ROLES)) {
    return { error: "No tienes permisos para renombrar categorías." };
  }

  const anterior = nombreAnterior.trim();
  const nuevo = nuevoNombre.trim();

  if (!anterior || !nuevo) {
    return { error: "Los nombres no pueden estar vacíos." };
  }

  if (anterior.toLowerCase() === nuevo.toLowerCase()) {
    return { success: true };
  }

  const supabase = await createClient();
  if (!supabase) return { error: "Sin conexión a la base de datos." };

  // 1. Actualizar tabla guias_categorias
  const { error: catError } = await supabase
    .from('guias_categorias')
    .update({ nombre: nuevo })
    .eq('nombre', anterior);

  if (catError) {
    return { error: `Error al renombrar categoría: ${catError.message}` };
  }

  // 2. Actualizar guías que tengan esa categoría
  await supabase
    .from('guias')
    .update({ categoria: nuevo })
    .eq('categoria', anterior);

  revalidatePath('/empresa/webapp/guias');
  return { success: true };
}

/**
 * Elimina una categoría.
 */
export async function eliminarCategoria(nombreCategoria: string): Promise<ActionResponse> {
  const userProfile = await getUserProfile();
  if (!isAllowed(userProfile.role, ALLOWED_ADMIN_ROLES)) {
    return { error: "No tienes permisos para eliminar categorías." };
  }

  const nombreLimpio = nombreCategoria.trim();
  if (!nombreLimpio) return { error: "Nombre inválido." };

  const supabase = await createClient();
  if (!supabase) return { error: "Sin conexión a la base de datos." };

  // 1. Eliminar de guias_categorias
  const { error } = await supabase
    .from('guias_categorias')
    .delete()
    .eq('nombre', nombreLimpio);

  if (error) {
    return { error: error.message };
  }

  // 2. Reasignar a 'General' las guías que tenían esta categoría eliminada
  await supabase
    .from('guias')
    .update({ categoria: 'General' })
    .eq('categoria', nombreLimpio);

  // Asegurar que exista 'General'
  await asegurarCategoria('General');

  revalidatePath('/empresa/webapp/guias');
  return { success: true };
}

/**
 * Helper interno para extraer imágenes y video de YouTube insertados inline en el texto markdown.
 */
function extraerMultimediaDeContenido(contenido: string): { imagenes: string[]; video_url: string | null } {
  const imageRegex = /!\[.*?\]\((https?:\/\/[^\s\)]+)\)/g;
  const imagenes: string[] = [];
  let match;
  while ((match = imageRegex.exec(contenido)) !== null) {
    const rawUrl = match[1];
    if (rawUrl && !imagenes.includes(rawUrl)) {
      imagenes.push(rawUrl);
    }
  }

  // Detectar primer video de YouTube insertado en el texto
  const ytRegex = /(https?:\/\/(?:www\.)?(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)[a-zA-Z0-9_-]+)/;
  const ytMatch = contenido.match(ytRegex);
  const video_url = ytMatch ? ytMatch[1] : null;

  return { imagenes, video_url };
}

/**
 * Server action para subir una imagen a Supabase Storage cuando se guarda o publica la guía.
 */
export async function subirImagenGuiaAction(formData: FormData): Promise<{ url?: string; error?: string }> {
  const userProfile = await getUserProfile();
  if (!isAllowed(userProfile.role, ALLOWED_ADMIN_ROLES)) {
    return { error: "No tienes permisos para subir imágenes." };
  }

  const file = formData.get('file') as File;
  if (!file || file.size === 0) {
    return { error: "Archivo inválido o vacío." };
  }

  const supabase = await createClient();
  if (!supabase) {
    return { error: "Error al conectar con Supabase." };
  }

  const resultado = await subirImagenAGuias(file, supabase);
  if (!resultado.success || !resultado.publicUrl) {
    return { error: resultado.error || "No se pudo subir la imagen al almacenamiento." };
  }

  return { url: resultado.publicUrl };
}

/**
 * Sube una imagen a Supabase Storage en el bucket 'guias'.
 */
async function subirImagenAGuias(
  file: File,
  supabase: SupabaseClient
): Promise<{ success: boolean; publicUrl?: string; error?: string }> {
  try {
    const fileExt = file.name.split('.').pop() || 'png';
    const cleanFileName = file.name.replace(/[^a-zA-Z0-9]/g, '_');
    const fileName = `${Date.now()}_${cleanFileName}.${fileExt}`;
    const filePath = `articulos/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(filePath, file, {
        contentType: file.type || 'image/png',
        cacheControl: '3600',
        upsert: true,
      });

    if (uploadError) {
      console.error("Error al subir imagen a Storage:", uploadError);
      return { success: false, error: `Error en Storage: ${uploadError.message}` };
    }

    const { data: { publicUrl } } = supabase.storage
      .from(STORAGE_BUCKET)
      .getPublicUrl(filePath);

    return { success: true, publicUrl };
  } catch (error: unknown) {
    console.error("Excepción al subir imagen:", error);
    const errorMessage = error instanceof Error ? error.message : "Excepción al subir imagen a Supabase.";
    return { success: false, error: errorMessage };
  }
}

/**
 * Crea una nueva guía con soporte para multimedia inline.
 */
export async function crearGuia(formData: FormData): Promise<ActionResponse> {
  const userProfile = await getUserProfile();
  if (!isAllowed(userProfile.role, ALLOWED_ADMIN_ROLES)) {
    return { error: "No tienes permisos para crear guías." };
  }

  const supabase = await createClient();
  if (!supabase) {
    return { error: "No se pudo conectar a la base de datos." };
  }

  const titulo = (formData.get('titulo') as string)?.trim();
  const categoria = (formData.get('categoria') as string)?.trim() || 'General';
  const resumen = (formData.get('resumen') as string)?.trim() || '';
  const contenido = (formData.get('contenido') as string)?.trim();
  const video_url_manual = (formData.get('video_url') as string)?.trim() || null;
  const destacado = formData.get('destacado') === 'true';

  if (!titulo || !contenido) {
    return { error: "El título y el contenido son obligatorios." };
  }

  // 1. Asegurar categoría en base de datos
  await asegurarCategoria(categoria);

  // 2. Extraer multimedia del contenido
  const { imagenes: imagenesDelContenido, video_url: videoDelContenido } = extraerMultimediaDeContenido(contenido);
  const video_url = video_url_manual || videoDelContenido;

  // 3. Subir imágenes si se adjuntaron mediante FormData adicional
  const files = formData.getAll('imagenes') as File[];
  const imagenesUrls: string[] = [...imagenesDelContenido];

  for (const file of files) {
    if (file && file.size > 0 && typeof file.name === 'string') {
      const res = await subirImagenAGuias(file, supabase);
      if (res.success && res.publicUrl && !imagenesUrls.includes(res.publicUrl)) {
        imagenesUrls.push(res.publicUrl);
      }
    }
  }

  // 4. Insertar guía en la base de datos
  const { data, error } = await supabase
    .from('guias')
    .insert([{
      titulo,
      categoria,
      resumen: resumen ? resumen.trim() : null,
      contenido,
      video_url: video_url || null,
      imagenes: imagenesUrls,
      autor_id: userProfile.id,
      destacado,
      orden: 0,
    }])
    .select('id')
    .single();

  if (error) {
    console.error("Error al crear la guía en BD:", error);
    return { error: `Error en la base de datos: ${error.message}` };
  }

  revalidatePath('/empresa/webapp/guias');
  return { success: true, id: data?.id };
}

/**
 * Edita una guía existente con soporte para multimedia inline y limpieza automática de imágenes eliminadas.
 */
export async function editarGuia(formData: FormData): Promise<ActionResponse> {
  const userProfile = await getUserProfile();
  if (!isAllowed(userProfile.role, ALLOWED_ADMIN_ROLES)) {
    return { error: "No tienes permisos para editar guías." };
  }

  const supabase = await createClient();
  if (!supabase) {
    return { error: "No se pudo conectar a la base de datos." };
  }

  const id = formData.get('id') as string;
  const titulo = (formData.get('titulo') as string)?.trim();
  const categoria = (formData.get('categoria') as string)?.trim() || 'General';
  const resumen = (formData.get('resumen') as string)?.trim() || '';
  const contenido = (formData.get('contenido') as string)?.trim();
  const video_url_manual = (formData.get('video_url') as string)?.trim() || null;
  const destacado = formData.get('destacado') === 'true';

  if (!id || !titulo || !contenido) {
    return { error: "ID, título y contenido son requeridos para actualizar." };
  }

  // 1. Obtener la versión anterior de la guía para verificar qué imágenes fueron borradas
  const { data: guiaAntigua } = await supabase
    .from('guias')
    .select('imagenes, contenido')
    .eq('id', id)
    .single();

  // 2. Extraer imágenes del nuevo contenido
  const { imagenes: imagenesDelNuevoContenido, video_url: videoDelContenido } = extraerMultimediaDeContenido(contenido);
  const video_url = video_url_manual || videoDelContenido;

  // 3. Eliminar de Supabase Storage las imágenes que ya no están presentes en la guía editada
  if (guiaAntigua) {
    const pathsAntiguos = new Set<string>();

    if (Array.isArray(guiaAntigua.imagenes)) {
      guiaAntigua.imagenes.forEach((url: string) => {
        const storagePath = getStoragePathFromUrl(url);
        if (storagePath) pathsAntiguos.add(storagePath);
      });
    }
    if (guiaAntigua.contenido) {
      const { imagenes: imgsAntiguas } = extraerMultimediaDeContenido(guiaAntigua.contenido);
      imgsAntiguas.forEach((url: string) => {
        const storagePath = getStoragePathFromUrl(url);
        if (storagePath) pathsAntiguos.add(storagePath);
      });
    }

    const pathsNuevos = new Set<string>();
    imagenesDelNuevoContenido.forEach((url: string) => {
      const storagePath = getStoragePathFromUrl(url);
      if (storagePath) pathsNuevos.add(storagePath);
    });

    // Imágenes eliminadas en esta edición
    const imagenesParaBorrar: string[] = [];
    pathsAntiguos.forEach((storagePath) => {
      if (!pathsNuevos.has(storagePath)) {
        imagenesParaBorrar.push(storagePath);
      }
    });

    if (imagenesParaBorrar.length > 0) {
      console.log(`[Storage Cleanup] Eliminando ${imagenesParaBorrar.length} imágenes huérfanas al editar guía ${id}:`, imagenesParaBorrar);
      await supabase.storage.from(STORAGE_BUCKET).remove(imagenesParaBorrar);
    }
  }

  // 4. Asegurar categoría
  await asegurarCategoria(categoria);

  // 5. Actualizar en base de datos
  const { error } = await supabase
    .from('guias')
    .update({
      titulo,
      categoria,
      resumen: resumen ? resumen.trim() : null,
      contenido,
      video_url: video_url || null,
      imagenes: imagenesDelNuevoContenido,
      destacado,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id);

  if (error) {
    console.error("Error al actualizar la guía:", error);
    return { error: `Error al actualizar: ${error.message}` };
  }

  revalidatePath('/empresa/webapp/guias');
  revalidatePath(`/empresa/webapp/guias/${id}`);
  return { success: true };
}

/**
 * Elimina una guía y todas sus imágenes asociadas en Supabase Storage.
 */
export async function eliminarGuia(id: string): Promise<ActionResponse> {
  const userProfile = await getUserProfile();
  if (!isAllowed(userProfile.role, ALLOWED_ADMIN_ROLES)) {
    return { error: "No tienes permisos para eliminar guías." };
  }

  const supabase = await createClient();
  if (!supabase) {
    return { error: "No se pudo conectar a la base de datos." };
  }

  // 1. Obtener registro de la guía para extraer todas las imágenes almacenadas
  const { data: guia } = await supabase
    .from('guias')
    .select('imagenes, contenido')
    .eq('id', id)
    .single();

  if (guia) {
    const pathsParaBorrar = new Set<string>();

    if (Array.isArray(guia.imagenes)) {
      guia.imagenes.forEach((url: string) => {
        const storagePath = getStoragePathFromUrl(url);
        if (storagePath) pathsParaBorrar.add(storagePath);
      });
    }

    if (guia.contenido) {
      const { imagenes } = extraerMultimediaDeContenido(guia.contenido);
      imagenes.forEach((url: string) => {
        const storagePath = getStoragePathFromUrl(url);
        if (storagePath) pathsParaBorrar.add(storagePath);
      });
    }

    if (pathsParaBorrar.size > 0) {
      const listaABorrar = Array.from(pathsParaBorrar);
      console.log(`[Storage Cleanup] Eliminando ${listaABorrar.length} imágenes de Storage al borrar la guía ${id}:`, listaABorrar);
      await supabase.storage.from(STORAGE_BUCKET).remove(listaABorrar);
    }
  }

  // 2. Eliminar registro de BD
  const { error } = await supabase
    .from('guias')
    .delete()
    .eq('id', id);

  if (error) {
    console.error("Error al eliminar guía:", error);
    return { error: `Error al eliminar: ${error.message}` };
  }

  revalidatePath('/empresa/webapp/guias');
  return { success: true };
}

/**
 * Alterna el estado de fijado / destacado de una guía.
 */
export async function toggleDestacadoGuia(id: string, nuevoEstado: boolean): Promise<ActionResponse> {
  const userProfile = await getUserProfile();
  if (!isAllowed(userProfile.role, ALLOWED_ADMIN_ROLES)) {
    return { error: "No tienes permisos para destacar guías." };
  }

  const supabase = await createClient();
  if (!supabase) return { error: "Sin conexión a la BD." };

  const { error } = await supabase
    .from('guias')
    .update({ destacado: nuevoEstado, updated_at: new Date().toISOString() })
    .eq('id', id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath('/empresa/webapp/guias');
  revalidatePath(`/empresa/webapp/guias/${id}`);
  return { success: true };
}
