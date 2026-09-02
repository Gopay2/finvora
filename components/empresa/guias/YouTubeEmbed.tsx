'use client';

import React, { useState } from 'react';

interface YouTubeEmbedProps {
  url?: string | null;
  className?: string;
}

/**
 * Extrae el ID de video de cualquier formato de URL de YouTube:
 * - https://www.youtube.com/watch?v=VIDEO_ID
 * - https://youtu.be/VIDEO_ID
 * - https://youtube.com/shorts/VIDEO_ID
 * - https://www.youtube.com/embed/VIDEO_ID
 */
export function extractYouTubeId(url: string | null | undefined): string | null {
  if (!url) return null;

  const cleanUrl = url.trim();

  // 1. URLs directas de Shorts
  const shortsMatch = cleanUrl.match(/youtube\.com\/shorts\/([a-zA-Z0-9_-]+)/i);
  if (shortsMatch && shortsMatch[1]) return shortsMatch[1];

  // 2. URLs de formato corto youtu.be
  const shortMatch = cleanUrl.match(/youtu\.be\/([a-zA-Z0-9_-]+)/i);
  if (shortMatch && shortMatch[1]) return shortMatch[1];

  // 3. URLs de formato estándar watch?v=
  const standardMatch = cleanUrl.match(/[?&]v=([a-zA-Z0-9_-]+)/i);
  if (standardMatch && standardMatch[1]) return standardMatch[1];

  // 4. URLs de formato embed/
  const embedMatch = cleanUrl.match(/youtube\.com\/embed\/([a-zA-Z0-9_-]+)/i);
  if (embedMatch && embedMatch[1]) return embedMatch[1];

  // Si ya es directamente un ID de 11 caracteres
  if (/^[a-zA-Z0-9_-]{11}$/.test(cleanUrl)) {
    return cleanUrl;
  }

  return null;
}

export default function YouTubeEmbed({ url, className = '' }: YouTubeEmbedProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [imgError, setImgError] = useState(false);

  const videoId = extractYouTubeId(url);

  if (!videoId) return null;

  const thumbnailUrl = imgError
    ? `https://img.youtube.com/vi/${videoId}/0.jpg`
    : `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;

  return (
    <div className={`overflow-hidden rounded-2xl bg-slate-950 border border-slate-800 shadow-2xl transition-all duration-300 ${className}`}>
      {/* Contenedor del reproductor 16:9 directo y limpio */}
      <div className="relative w-full pb-[56.25%] bg-black">
        {isPlaying ? (
          <iframe
            src={`https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0`}
            title="Video de YouTube"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            className="absolute top-0 left-0 w-full h-full border-0"
          />
        ) : (
          <div
            onClick={() => setIsPlaying(true)}
            className="absolute inset-0 cursor-pointer group flex items-center justify-center bg-slate-950 overflow-hidden"
          >
            {/* Imagen de fondo con posicionamiento absoluto estricto */}
            <img
              src={thumbnailUrl}
              alt="Portada de video"
              onError={() => setImgError(true)}
              className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-80"
            />
            <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-colors" />

            {/* Botón de Play perfectamente centrado */}
            <div className="relative z-10 w-16 h-12 md:w-20 md:h-14 bg-red-600 group-hover:bg-red-500 rounded-2xl flex items-center justify-center shadow-2xl transition-all group-hover:scale-110">
              <span className="material-symbols-outlined text-3xl md:text-4xl text-white select-none">
                play_arrow
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
