'use client';

import React from 'react';
import Link from 'next/link';
import type { Guia } from '@/types/guias';

interface GuiaCardProps {
  guia: Guia;
  isFeatured?: boolean;
}

const styles = {
  cardBase: "group relative flex flex-col justify-between rounded-3xl bg-slate-900/40 backdrop-blur-xl border transition-all duration-300 overflow-hidden hover:-translate-y-1",
  featuredBorder: "border-secondary/40 hover:border-secondary shadow-lg shadow-secondary/5",
  normalBorder: "border-slate-800 hover:border-secondary/40 hover:shadow-xl hover:shadow-slate-950/50",
  glow: "absolute -top-16 -right-16 w-36 h-36 bg-secondary/5 rounded-full blur-3xl group-hover:bg-secondary/15 transition-all duration-500 pointer-events-none",
  categoryBadge: "h-7.5 px-3 rounded-xl text-xs font-bold uppercase tracking-wider bg-secondary/10 text-secondary border border-secondary/20 flex items-center justify-center shrink-0",
  pinBadge: "w-7.5 h-7.5 rounded-xl bg-amber-500/10 text-amber-300 border border-amber-500/20 flex items-center justify-center shrink-0",
  videoBadge: "w-7.5 h-7.5 rounded-xl bg-red-500/10 text-red-400 border border-red-500/20 flex items-center justify-center shrink-0",
  imageBadge: "w-7.5 h-7.5 rounded-xl bg-slate-800 text-slate-300 border border-slate-700 flex items-center justify-center shrink-0",
  footer: "px-6 py-4 bg-slate-950/50 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400",
};

/**
 * Formatea una fecha en formato amigable (ej: "28 Feb, 2025" o "Hoy")
 */
function formatearFecha(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('es-MX', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return 'Reciente';
  }
}

export default function GuiaCard({ guia, isFeatured = false }: GuiaCardProps) {
  const tieneVideo =
    Boolean(guia.video_url) ||
    Boolean(guia.contenido && (guia.contenido.includes('youtube.com') || guia.contenido.includes('youtu.be')));

  const tieneImagenes =
    Boolean(guia.imagenes && guia.imagenes.length > 0) ||
    Boolean(guia.contenido && (guia.contenido.includes('![') || guia.contenido.includes('data-type="image"')));

  const autorNombre = guia.autor?.username
    ? guia.autor.username.charAt(0).toUpperCase() + guia.autor.username.slice(1)
    : 'Finvora';

  return (
    <Link
      href={`/empresa/webapp/guias/${guia.id}`}
      className={`${styles.cardBase} ${
        isFeatured || guia.destacado ? styles.featuredBorder : styles.normalBorder
      }`}
    >
      {/* Resplandor decorativo de fondo */}
      <div className={styles.glow} />

      {/* Cuerpo superior de la tarjeta */}
      <div className="p-6 space-y-4">
        {/* Cabecera: Categoría + Badges Multimedia (Contenedores amplios y uniformes) */}
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2">
            <span className={styles.categoryBadge}>
              {guia.categoria}
            </span>

            {guia.destacado && (
              <span className={styles.pinBadge} title="Guía fijada">
                <span
                  className="material-symbols-outlined text-[14px] leading-none select-none"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  push_pin
                </span>
              </span>
            )}
          </div>

          {/* Badges de Video / Imágenes (Mismo tamaño h-7.5 w-7.5, solo íconos sin texto ni contadores) */}
          <div className="flex items-center gap-2 text-xs">
            {tieneVideo && (
              <span className={styles.videoBadge} title="Incluye Video">
                <span className="material-symbols-outlined text-[16px] leading-none select-none">
                  play_circle
                </span>
              </span>
            )}

            {tieneImagenes && (
              <span className={styles.imageBadge} title="Incluye Imágenes">
                <span className="material-symbols-outlined text-[16px] leading-none select-none">
                  image
                </span>
              </span>
            )}
          </div>
        </div>

        {/* Título de la Guía */}
        <div>
          <h3 className="text-lg md:text-xl font-bold text-slate-100 group-hover:text-secondary transition-colors duration-200 line-clamp-2 leading-snug">
            {guia.titulo}
          </h3>

          {/* Resumen preliminar */}
          {guia.resumen && guia.resumen.trim() !== '' && (
            <p className="text-xs md:text-sm text-slate-400 mt-2 line-clamp-2 leading-relaxed">
              {guia.resumen}
            </p>
          )}
        </div>
      </div>

      {/* Pie de la tarjeta: Autor y Fecha */}
      <div className={styles.footer}>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-[10px] font-bold text-secondary uppercase">
            {autorNombre.charAt(0)}
          </div>
          <span className="font-medium text-slate-300">{autorNombre}</span>
          <span>•</span>
          <span>{formatearFecha(guia.created_at)}</span>
        </div>
      </div>
    </Link>
  );
}
