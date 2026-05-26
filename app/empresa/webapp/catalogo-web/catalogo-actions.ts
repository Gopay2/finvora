'use server';

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { getUserProfile, isAllowed } from "@/utils/auth-check";

/**
 * Helper para extraer la ruta de archivo (path) de una URL pública de Supabase Storage.
 * Esto permite eliminar el archivo físico del bucket cuando se edita o borra un celular.
 */
function getStoragePathFromUrl(url: string): string | null {
  try {
    if (!url) return null;
    // Las URLs de Supabase Storage suelen ser de la forma:
    // https://[project-ref].supabase.co/storage/v1/object/public/catalogo-celulares/celulares/1716...png
    const searchString = "/storage/v1/object/public/catalogo-celulares/";
    const index = url.indexOf(searchString);
    if (index !== -1) {
      return url.substring(index + searchString.length);
    }
    return null;
  } catch (error) {
    console.error("Error al extraer path de URL:", error);
    return null;
  }
}

/**
 * Registra un nuevo equipo celular en el catálogo comercial web (tabla 'catalogo_celulares').
 * Sube la imagen proporcionada al bucket público 'catalogo-celulares' de Supabase Storage.
 * 
 * @security Permisos requeridos: Admin, Supervisor, Developer
 * @param formData Datos del formulario que incluye marca, modelo, colores (separados por comas), almacenamientos (separados por comas), descripcion e imagen (File)
 */
export async function crearCelular(formData: FormData) {
  const { role } = await getUserProfile();
  if (!isAllowed(role, ["Admin", "Supervisor", "Developer"])) {
    return { error: "No tienes permisos para realizar esta acción" };
  }

  const supabase = await createClient();

  const marca = formData.get('marca') as string;
  const modelo = formData.get('modelo') as string;
  const coloresRaw = formData.get('colores') as string;
  const almacenamientosRaw = formData.get('almacenamientos') as string;
  const ramsRaw = formData.get('rams') as string;
  const descripcion = formData.get('descripcion') as string;
  const file = formData.get('imagen') as File;

  if (!marca || !modelo || !descripcion || !file || file.size === 0) {
    return { error: "Todos los campos son obligatorios, incluyendo la imagen." };
  }

  // 1. Convertir las cadenas de colores, almacenamientos y rams en arrays
  const colores = coloresRaw.split(',').map(s => s.trim()).filter(Boolean);
  const almacenamientos = almacenamientosRaw.split(',').map(s => s.trim()).filter(Boolean);
  const rams = ramsRaw.split(',').map(s => s.trim()).filter(Boolean);

  if (colores.length === 0 || almacenamientos.length === 0 || rams.length === 0) {
    return { error: "Debes agregar al menos un color, un almacenamiento y una RAM." };
  }

  // 2. Subir imagen a Supabase Storage
  let imagenUrl = "";
  try {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
    const filePath = `celulares/${fileName}`;

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('catalogo-celulares')
      .upload(filePath, file, {
        contentType: file.type,
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) {
      console.error("Error al subir archivo a storage:", uploadError);
      return { error: `Error al subir la imagen: ${uploadError.message}` };
    }

    const { data: { publicUrl } } = supabase.storage
      .from('catalogo-celulares')
      .getPublicUrl(filePath);

    imagenUrl = publicUrl;
  } catch (error: any) {
    console.error("Excepción en la carga del archivo:", error);
    return { error: "Ocurrió un error inesperado al subir la imagen." };
  }

  // 3. Registrar celular en la tabla
  const { error } = await supabase
    .from('catalogo_celulares')
    .insert([{
      marca,
      modelo,
      colores,
      almacenamientos,
      rams,
      imagen_url: imagenUrl,
      descripcion,
      visible: true
    }]);

  if (error) {
    console.error("Error al registrar celular:", error);
    // Intentar borrar la imagen subida si falla el registro en DB
    const storagePath = getStoragePathFromUrl(imagenUrl);
    if (storagePath) {
      await supabase.storage.from('catalogo-celulares').remove([storagePath]);
    }
    return { error: `Error en la base de datos: ${error.message}` };
  }

  revalidatePath('/empresa/webapp/catalogo-web');
  revalidatePath('/catalogo');
  return { success: true };
}

/**
 * Modifica los atributos de un celular existente en el catálogo (tabla 'catalogo_celulares').
 * Si se incluye una nueva imagen, sube el nuevo archivo y elimina el anterior de Supabase Storage.
 * 
 * @security Permisos requeridos: Admin, Supervisor, Developer
 * @param formData Datos del formulario que incluye id, marca, modelo, colores (separados por comas), almacenamientos (separados por comas), descripcion, imagen (File opcional) e imagenUrlAnterior (string)
 */
export async function editarCelular(formData: FormData) {
  const { role } = await getUserProfile();
  if (!isAllowed(role, ["Admin", "Supervisor", "Developer"])) {
    return { error: "No tienes permisos para realizar esta acción" };
  }

  const supabase = await createClient();

  const id = formData.get('id') as string;
  const marca = formData.get('marca') as string;
  const modelo = formData.get('modelo') as string;
  const coloresRaw = formData.get('colores') as string;
  const almacenamientosRaw = formData.get('almacenamientos') as string;
  const ramsRaw = formData.get('rams') as string;
  const descripcion = formData.get('descripcion') as string;
  const file = formData.get('imagen') as File;
  const imagenUrlAnterior = formData.get('imagenUrlAnterior') as string;

  if (!id || !marca || !modelo || !descripcion) {
    return { error: "Todos los campos principales son obligatorios." };
  }

  const colores = coloresRaw.split(',').map(s => s.trim()).filter(Boolean);
  const almacenamientos = almacenamientosRaw.split(',').map(s => s.trim()).filter(Boolean);
  const rams = ramsRaw.split(',').map(s => s.trim()).filter(Boolean);

  if (colores.length === 0 || almacenamientos.length === 0 || rams.length === 0) {
    return { error: "Debes agregar al menos un color, un almacenamiento y una RAM." };
  }

  let imagenUrl = imagenUrlAnterior;

  // 1. Si el usuario subió una nueva foto (archivo con tamaño mayor a 0)
  if (file && file.size > 0) {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
      const filePath = `celulares/${fileName}`;

      // Subimos la nueva imagen
      const { error: uploadError } = await supabase.storage
        .from('catalogo-celulares')
        .upload(filePath, file, {
          contentType: file.type,
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        console.error("Error al subir archivo en edición:", uploadError);
        return { error: `Error al subir la nueva imagen: ${uploadError.message}` };
      }

      // Obtenemos la nueva URL
      const { data: { publicUrl } } = supabase.storage
        .from('catalogo-celulares')
        .getPublicUrl(filePath);

      imagenUrl = publicUrl;

      // Borramos la imagen anterior para no acumular basura
      const storagePathAnterior = getStoragePathFromUrl(imagenUrlAnterior);
      if (storagePathAnterior) {
        await supabase.storage.from('catalogo-celulares').remove([storagePathAnterior]);
      }
    } catch (error) {
      console.error("Excepción al reemplazar archivo:", error);
      return { error: "Error al cargar la nueva imagen." };
    }
  }

  // 2. Actualizar el registro en la base de datos
  const { error } = await supabase
    .from('catalogo_celulares')
    .update({
      marca,
      modelo,
      colores,
      almacenamientos,
      rams,
      imagen_url: imagenUrl,
      descripcion
    })
    .eq('id', id);

  if (error) {
    console.error("Error al actualizar celular:", error);
    // Si subimos una imagen nueva pero falló el update, intentamos borrar la nueva imagen para mantener limpia la nube
    if (imagenUrl !== imagenUrlAnterior) {
      const storagePathNuevo = getStoragePathFromUrl(imagenUrl);
      if (storagePathNuevo) {
        await supabase.storage.from('catalogo-celulares').remove([storagePathNuevo]);
      }
    }
    return { error: `Error al actualizar en base de datos: ${error.message}` };
  }

  revalidatePath('/empresa/webapp/catalogo-web');
  revalidatePath('/catalogo');
  return { success: true };
}

/**
 * Elimina de forma permanente un celular del catálogo comercial (tabla 'catalogo_celulares')
 * y su imagen física del storage asociado.
 * 
 * @security Permisos requeridos: Admin, Supervisor, Developer
 * @param id ID único del celular a eliminar
 * @param imagenUrl URL de la imagen en Supabase Storage para borrar el archivo físico
 */
export async function eliminarCelular(id: string, imagenUrl: string) {
  const { role } = await getUserProfile();
  if (!isAllowed(role, ["Admin", "Supervisor", "Developer"])) {
    return { error: "No tienes permisos para realizar esta acción" };
  }

  const supabase = await createClient();

  // 1. Eliminar el registro en la base de datos
  const { error } = await supabase
    .from('catalogo_celulares')
    .delete()
    .eq('id', id);

  if (error) {
    console.error("Error al eliminar celular en DB:", error);
    return { error: "No se pudo eliminar el celular del catálogo." };
  }

  // 2. Eliminar la imagen del storage si existe
  const storagePath = getStoragePathFromUrl(imagenUrl);
  if (storagePath) {
    const { error: storageError } = await supabase.storage
      .from('catalogo-celulares')
      .remove([storagePath]);

    if (storageError) {
      console.error("Error al eliminar archivo físico de storage:", storageError);
      // No bloqueamos el éxito porque el registro en DB ya fue eliminado
    }
  }

  revalidatePath('/empresa/webapp/catalogo-web');
  revalidatePath('/catalogo');
  return { success: true };
}

/**
 * Activa o desactiva la visibilidad pública de un celular en el catálogo de forma inmediata.
 * 
 * @security Permisos requeridos: Admin, Supervisor, Developer
 * @param id ID único del celular
 * @param nuevoEstado Boolean indicando el nuevo estado de visibilidad
 */
export async function actualizarVisibilidadCelular(id: string, nuevoEstado: boolean) {
  const { role } = await getUserProfile();
  if (!isAllowed(role, ["Admin", "Supervisor", "Developer"])) {
    return { error: "No autorizado" };
  }

  const supabase = await createClient();

  const { error } = await supabase
    .from('catalogo_celulares')
    .update({ visible: nuevoEstado })
    .eq('id', id);

  if (error) {
    console.error("Error al actualizar visibilidad:", error);
    return { error: error.message };
  }

  revalidatePath('/empresa/webapp/catalogo-web');
  revalidatePath('/catalogo');
  return { success: true };
}
