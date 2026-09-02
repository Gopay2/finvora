'use client';

import React, { useEffect, useState, useCallback } from 'react';

interface ImageLightboxModalProps {
  images: string[];
  initialIndex?: number;
  isOpen: boolean;
  onClose: () => void;
}

export default function ImageLightboxModal({
  images,
  initialIndex = 0,
  isOpen,
  onClose,
}: ImageLightboxModalProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);

  useEffect(() => {
    setCurrentIndex(initialIndex);
  }, [initialIndex, isOpen]);

  const handlePrev = useCallback(() => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1));
  }, [images.length]);

  const handleNext = useCallback(() => {
    setCurrentIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0));
  }, [images.length]);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') handlePrev();
      if (e.key === 'ArrowRight') handleNext();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, handlePrev, handleNext]);

  if (!isOpen || images.length === 0) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-xl animate-in fade-in duration-200">
      {/* Botón cerrar */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-50 p-3 bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white rounded-full border border-slate-700 transition-all cursor-pointer"
        aria-label="Cerrar visor"
      >
        <span className="material-symbols-outlined text-2xl">close</span>
      </button>

      {/* Indicador de posición */}
      <div className="absolute top-5 left-6 text-sm font-semibold tracking-wider text-slate-300 bg-slate-900/80 px-4 py-1.5 rounded-full border border-slate-700">
        {currentIndex + 1} / {images.length}
      </div>

      {/* Botón Anterior */}
      {images.length > 1 && (
        <button
          onClick={handlePrev}
          className="absolute left-4 z-50 p-3 bg-slate-900/80 hover:bg-secondary hover:text-slate-950 text-white rounded-full border border-slate-700 transition-all cursor-pointer group"
          aria-label="Imagen anterior"
        >
          <span className="material-symbols-outlined text-3xl group-hover:-translate-x-0.5 transition-transform">chevron_left</span>
        </button>
      )}

      {/* Imagen Principal */}
      <div className="max-w-5xl max-h-[85vh] p-4 flex items-center justify-center">
        <img
          src={images[currentIndex]}
          alt={`Imagen ${currentIndex + 1} de la guía`}
          className="max-h-[80vh] max-w-full object-contain rounded-2xl shadow-2xl border border-slate-800"
        />
      </div>

      {/* Botón Siguiente */}
      {images.length > 1 && (
        <button
          onClick={handleNext}
          className="absolute right-4 z-50 p-3 bg-slate-900/80 hover:bg-secondary hover:text-slate-950 text-white rounded-full border border-slate-700 transition-all cursor-pointer group"
          aria-label="Imagen siguiente"
        >
          <span className="material-symbols-outlined text-3xl group-hover:translate-x-0.5 transition-transform">chevron_right</span>
        </button>
      )}

      {/* Miniaturas inferiores */}
      {images.length > 1 && (
        <div className="absolute bottom-6 flex gap-2 overflow-x-auto max-w-2xl px-4 py-2 bg-slate-950/70 border border-slate-800 rounded-2xl backdrop-blur-md">
          {images.map((img, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentIndex(idx)}
              className={`relative w-14 h-14 rounded-lg overflow-hidden border-2 transition-all cursor-pointer shrink-0 ${
                idx === currentIndex
                  ? 'border-secondary scale-105 ring-2 ring-secondary/30'
                  : 'border-slate-800 opacity-60 hover:opacity-100'
              }`}
            >
              <img src={img} alt="" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
