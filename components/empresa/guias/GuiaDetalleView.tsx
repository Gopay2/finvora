'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { Guia } from '@/types/guias';
import YouTubeEmbed from './YouTubeEmbed';
import ImageLightboxModal from './ImageLightboxModal';
import MarkdownRenderer from './MarkdownRenderer';
import GuiaModalForm from './GuiaModalForm';
import ConfirmModal from '@/components/empresa/ConfirmModal';
import { eliminarGuia, toggleDestacadoGuia } from '@/app/empresa/webapp/guias/actions';

interface GuiaDetalleViewProps {
  guia: Guia;
  currentUserRole: string;
  categoriasExistentes: string[];
}

function formatearFechaCompleta(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('es-MX', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

export default function GuiaDetalleView({
  guia,
  currentUserRole,
  categoriasExistentes,
}: GuiaDetalleViewProps) {
  const router = useRouter();
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isTogglingDestacado, setIsTogglingDestacado] = useState(false);
  const [destacadoLocal, setDestacadoLocal] = useState(guia.destacado);

  const isPrivileged =
    currentUserRole === 'Admin' ||
    currentUserRole === 'Developer' ||
    currentUserRole === 'Supervisor';

  const autorNombre = guia.autor?.username
    ? guia.autor.username.charAt(0).toUpperCase() + guia.autor.username.slice(1)
    : 'Finvora';

  const handleToggleDestacado = async () => {
    if (isTogglingDestacado) return;
    setIsTogglingDestacado(true);
    const nuevoEstado = !destacadoLocal;
    setDestacadoLocal(nuevoEstado);

    try {
      const res = await toggleDestacadoGuia(guia.id, nuevoEstado);
      if (res.error) {
        setDestacadoLocal(!nuevoEstado);
        alert(`Error: ${res.error}`);
      }
    } catch (e) {
      setDestacadoLocal(!nuevoEstado);
    } finally {
      setIsTogglingDestacado(false);
    }
  };

  const handleConfirmarEliminar = async () => {
    setIsDeleting(true);
    try {
      const res = await eliminarGuia(guia.id);
      if (res.error) {
        alert(`Error al eliminar: ${res.error}`);
        setIsDeleting(false);
        return;
      }
      router.push('/empresa/webapp/guias');
    } catch (err) {
      alert('Error inesperado al eliminar la guía');
      setIsDeleting(false);
    }
  };

  return (
    <article className="max-w-4xl mx-auto space-y-10 animate-in fade-in duration-500 pb-20">
      {/* Navegación y Acciones */}
      <div className="flex items-center justify-between gap-4 pb-4 border-b border-slate-800/80">
        {/* Barra de Acciones (Pin, Editar, Eliminar) - Mismo tamaño exacto w-10 h-10 */}
        <div className="flex items-center gap-2.5">
          {isPrivileged && (
            <>
              {/* Botón Fijar Pin */}
              <button
                onClick={handleToggleDestacado}
                disabled={isTogglingDestacado}
                className={`w-10 h-10 rounded-xl border flex items-center justify-center transition-all cursor-pointer ${
                  destacadoLocal
                    ? 'bg-amber-500/15 border-amber-500/30 text-amber-300 shadow-sm shadow-amber-500/10'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
                title={destacadoLocal ? 'Desfijar guía' : 'Fijar como destacada'}
              >
                <span
                  className="material-symbols-outlined text-lg"
                  style={{ fontVariationSettings: destacadoLocal ? "'FILL' 1" : "'FILL' 0" }}
                >
                  push_pin
                </span>
              </button>

              {/* Botón Editar (Solo ícono, mismo tamaño) */}
              <button
                onClick={() => setIsEditModalOpen(true)}
                className="w-10 h-10 rounded-xl bg-slate-900 hover:bg-slate-800 text-secondary border border-slate-800 flex items-center justify-center transition-all cursor-pointer"
                title="Editar guía"
              >
                <span className="material-symbols-outlined text-lg">edit</span>
              </button>

              {/* Botón Eliminar (Mismo tamaño) */}
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="w-10 h-10 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 flex items-center justify-center transition-all cursor-pointer"
                title="Eliminar guía"
              >
                <span className="material-symbols-outlined text-lg">delete</span>
              </button>
            </>
          )}
        </div>

        {/* Botón Volver a la derecha (estilo limpio Finvora) */}
        <Link
          href="/empresa/webapp/guias"
          className="text-slate-400 hover:text-white flex items-center gap-2 text-sm font-medium transition-colors cursor-pointer select-none"
        >
          <span className="material-symbols-outlined text-base">arrow_back</span>
          <span>Volver</span>
        </Link>
      </div>

      {/* Encabezado del Artículo */}
      <header className="space-y-5">
        <div className="flex items-center gap-2.5 flex-wrap">
          <span className="h-8 px-4 rounded-full text-xs font-bold uppercase tracking-wider bg-secondary/10 text-secondary border border-secondary/20 flex items-center justify-center">
            {guia.categoria}
          </span>

          {destacadoLocal && (
            <span className="h-8 px-4 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-500/10 text-amber-300 border border-amber-500/20 flex items-center justify-center gap-1.5">
              <span
                className="material-symbols-outlined shrink-0"
                style={{ fontSize: '13px', lineHeight: 1, fontVariationSettings: "'FILL' 1" }}
              >
                push_pin
              </span>
              <span>Fijado</span>
            </span>
          )}
        </div>

        <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white tracking-tight leading-tight">
          {guia.titulo}
        </h1>

        {/* Resumen / Subtítulo */}
        {guia.resumen && guia.resumen.trim() !== '' && (
          <p className="text-base md:text-lg text-slate-300 leading-relaxed font-normal border-l-2 border-secondary/50 pl-4 bg-secondary/5 py-2 rounded-r-xl">
            {guia.resumen}
          </p>
        )}

        {/* Metadatos del Autor y Fecha */}
        <div className="flex items-center gap-3 pt-2 text-xs text-slate-400">
          <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-bold text-secondary uppercase">
            {autorNombre.charAt(0)}
          </div>
          <div>
            <div className="font-semibold text-slate-200">{autorNombre}</div>
            <div>Publicado el {formatearFechaCompleta(guia.created_at)}</div>
          </div>
        </div>
      </header>

      {/* Cuerpo del Artículo con Multimedia Inline */}
      <section className="p-6 md:p-10 rounded-3xl bg-slate-900/30 backdrop-blur-xl border border-slate-800 shadow-2xl">
        <MarkdownRenderer
          content={guia.contenido}
          onImageClick={(imgUrl) => {
            const allImages = guia.imagenes || [];
            const index = allImages.indexOf(imgUrl);
            setSelectedImageIndex(index >= 0 ? index : 0);
            setLightboxOpen(true);
          }}
        />
      </section>

      {/* Pie de Página del Lector */}
      <footer className="pt-6 border-t border-slate-800 flex items-center justify-end">
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="w-10 h-10 flex items-center justify-center bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-secondary rounded-xl border border-slate-800 transition-all cursor-pointer shadow-sm"
          title="Subir al inicio"
        >
          <span className="material-symbols-outlined text-lg leading-none">arrow_upward</span>
        </button>
      </footer>

      {/* Visor Lightbox para fotos */}
      {guia.imagenes && (
        <ImageLightboxModal
          isOpen={lightboxOpen}
          images={guia.imagenes}
          initialIndex={selectedImageIndex}
          onClose={() => setLightboxOpen(false)}
        />
      )}

      {/* Modal para Editar Guía */}
      <GuiaModalForm
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        guiaParaEditar={guia}
        categoriasExistentes={categoriasExistentes}
        onSuccess={() => {
          window.location.reload();
        }}
      />

      {/* Modal de Confirmación de Eliminación Estándar (Idéntico a Stock) */}
      <ConfirmModal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleConfirmarEliminar}
        title="¿Eliminar esta guía?"
        message={`¿Estás seguro de que quieres eliminar del sistema la guía "${guia.titulo}"? Esta acción es irreversible`}
      />
    </article>
  );
}
