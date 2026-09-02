import React from 'react';
import { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getUserProfile } from '@/utils/auth-check';
import AccessDenied from '@/components/empresa/AccessDenied';
import { createClient } from '@/utils/supabase/server';
import GuiaDetalleView from '@/components/empresa/guias/GuiaDetalleView';
import type { Guia } from '@/types/guias';

export const revalidate = 0;

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const supabase = await createClient();
  if (!supabase) return { title: 'Guía | Finvora WebApp' };

  const { data: guia } = await supabase
    .from('guias')
    .select('titulo, resumen')
    .eq('id', id)
    .maybeSingle();

  if (!guia) {
    return { title: 'Guía no encontrada | Finvora' };
  }

  return {
    title: `${guia.titulo} | Guía Finvora`,
    description: guia.resumen || 'Manual y guía de procesos de Finvora',
  };
}

export default async function GuiaDetallePage({ params }: PageProps) {
  const { id } = await params;
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

  // 1. Obtener la guía por ID
  let guia: Guia | null = null;
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
      .eq('id', id)
      .maybeSingle();

    if (error || !data) {
      const { data: fallback } = await supabase
        .from('guias')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      guia = fallback as Guia | null;
    } else {
      guia = data as any;
    }
  } catch (err) {
    console.error('Error al cargar detalle de guía:', err);
  }

  if (!guia) {
    return (
      <div className="max-w-xl mx-auto py-16 text-center space-y-6">
        <div className="w-16 h-16 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center mx-auto text-slate-400">
          <span className="material-symbols-outlined text-3xl">menu_book</span>
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-white">Guía no encontrada</h2>
          <p className="text-sm text-slate-400">
            La guía que estás intentando consultar no existe o ha sido eliminada.
          </p>
        </div>
        <div>
          <Link
            href="/empresa/webapp/guias"
            className="px-5 py-2.5 bg-secondary text-slate-950 rounded-xl text-sm font-bold hover:bg-secondary-fixed transition-colors inline-flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-base">arrow_back</span>
            <span>Volver a Guías</span>
          </Link>
        </div>
      </div>
    );
  }

  // 2. Obtener categorías para el modal de edición
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
    console.error('Error al consultar categorías:', err);
  }

  return (
    <GuiaDetalleView
      guia={guia}
      currentUserRole={currentUser.role}
      categoriasExistentes={categorias}
    />
  );
}
