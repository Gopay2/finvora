import React from 'react';
import { Metadata } from 'next';
import { getUserProfile } from '@/utils/auth-check';
import AccessDenied from '@/components/empresa/AccessDenied';
import { createClient } from '@/utils/supabase/server';
import GuiasClientView from '@/components/empresa/guias/GuiasClientView';
import type { Guia } from '@/types/guias';

export const metadata: Metadata = {
  title: 'Guías y Base de Conocimiento | Finvora WebApp',
  description: 'Manuales, procesos y documentación de la empresa Finvora',
};

export const revalidate = 0;

export default async function GuiasPage() {
  const currentUser = await getUserProfile();

  // Control de acceso: Permitido para todos los roles excepto "Sin rol"
  if (!currentUser.id || currentUser.role === 'Sin rol') {
    return <AccessDenied role={currentUser.role} sectionName="Guía" />;
  }

  const supabase = await createClient();
  if (!supabase) {
    return (
      <div className="text-red-500 text-center py-10 font-bold">
        Error al conectar con la base de datos de Supabase.
      </div>
    );
  }

  // 1. Obtener guías con autor
  let guias: Guia[] = [];
  try {
    const { data, error } = await supabase
      .from('guias')
      .select(`
        id,
        titulo,
        slug,
        categoria,
        resumen,
        contenido,
        video_url,
        imagenes,
        autor_id,
        destacado,
        orden,
        created_at,
        updated_at,
        autor:perfiles!guias_autor_id_fkey(id, username, role)
      `)
      .order('destacado', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) {
      // Fallback si la relación de foreign key no tiene ese nombre específico
      const { data: fallbackData } = await supabase
        .from('guias')
        .select('*')
        .order('destacado', { ascending: false })
        .order('created_at', { ascending: false });

      guias = (fallbackData as Guia[]) || [];
    } else {
      guias = (data as any[]) || [];
    }
  } catch (err) {
    console.error('Error al consultar guías:', err);
  }

  // 2. Obtener categorías dinámicas guardadas
  let categorias: string[] = [];
  try {
    const { data: catData } = await supabase
      .from('guias_categorias')
      .select('nombre')
      .order('nombre', { ascending: true });

    if (catData && catData.length > 0) {
      categorias = catData.map((c: { nombre: string }) => c.nombre);
    }
  } catch (err) {
    console.error('Error al consultar categorías de guías:', err);
  }

  // Si no hay categorías registradas en la tabla de categorías, extraer de las guías existentes
  if (categorias.length === 0 && guias.length > 0) {
    const set = new Set<string>();
    guias.forEach((g) => g.categoria && set.add(g.categoria));
    categorias = Array.from(set);
  }

  if (categorias.length === 0) {
    categorias = ['General', 'Ventas', 'Logística', 'Garantías', 'Cobranza', 'Soporte'];
  }

  return (
    <GuiasClientView
      initialGuias={guias}
      categoriasExistentes={categorias}
      currentUserRole={currentUser.role}
    />
  );
}
