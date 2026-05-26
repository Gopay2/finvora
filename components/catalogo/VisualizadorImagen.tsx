'use client';

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";

interface VisualizadorImagenProps {
  imagenUrl: string;
  alt: string;
}

export default function VisualizadorImagen({ imagenUrl, alt }: VisualizadorImagenProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [touchStart, setTouchStart] = useState<{ x: number; y: number } | null>(null);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Bloquear el scroll de la página de fondo cuando el visualizador esté abierto
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  const handleOpen = () => setIsOpen(true);
  const handleClose = () => setIsOpen(false);

  // Optimización táctil para evitar aperturas accidentales al arrastrar/scrollear la página
  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    setTouchStart({ x: touch.clientX, y: touch.clientY });
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStart) return;
    const touch = e.changedTouches[0];
    const diffX = Math.abs(touch.clientX - touchStart.x);
    const diffY = Math.abs(touch.clientY - touchStart.y);

    // Solo se abre si el usuario dio un toque preciso (menos de 8px de movimiento),
    // ignorando arrastres de scroll de página en la pantalla.
    if (diffX < 8 && diffY < 8) {
      handleOpen();
    }
    setTouchStart(null);
  };

  const handleMouseClick = (e: React.MouseEvent) => {
    // Si el dispositivo tiene una pantalla táctil principal, omitimos el click
    // emulado para usar únicamente nuestro gestor de toque seguro handleTouchEnd
    if (window.matchMedia("(pointer: coarse)").matches) {
      return;
    }
    handleOpen();
  };

  return (
    <>
      {/* Contenedor de Imagen Normal (Gatillo) */}
      <div 
        onClick={handleMouseClick}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        className="relative w-full h-72 sm:h-96 md:h-auto md:min-h-[500px] bg-slate-900/30 backdrop-blur-xl border border-slate-800 rounded-3xl p-6 md:p-8 flex items-center justify-center overflow-hidden group shadow-2xl cursor-zoom-in transition-all duration-300 hover:border-secondary/30"
        title="Hacer clic para ampliar imagen"
      >
        {/* Resplandor trasero suave */}
        <div className="absolute inset-0 bg-gradient-to-tr from-slate-950/20 to-secondary/5 opacity-50 pointer-events-none" />
        
        {/* Badge flotante de indicación visual de zoom (Siempre visible en táctil, en hover para desktop) */}
        <div className="absolute top-4 right-4 bg-slate-950/80 border border-slate-850 p-2 rounded-xl text-slate-400 group-hover:text-secondary group-hover:scale-105 transition-all opacity-100 md:opacity-0 md:group-hover:opacity-100 duration-300 flex items-center justify-center z-10">
          <span className="material-symbols-outlined text-base">zoom_in</span>
        </div>

        <img 
          src={imagenUrl} 
          alt={alt} 
          className="max-h-[220px] sm:max-h-[300px] md:max-h-[420px] max-w-[85%] object-contain drop-shadow-[0_15px_30px_rgba(0,0,0,0.6)] transform group-hover:scale-[1.03] transition-transform duration-[500ms] ease-out select-none pointer-events-none"
        />
      </div>

      {/* Modal a Pantalla Completa (Lightbox) */}
      {isOpen && isMounted && createPortal(
        <div 
          onClick={handleClose}
          className="fixed inset-0 z-[99999] flex items-center justify-center bg-slate-950/95 backdrop-blur-md p-4 animate-in fade-in duration-300 cursor-zoom-out select-none"
        >
          {/* Botón Flotante para Cerrar */}
          <button 
            onClick={(e) => {
              e.stopPropagation();
              handleClose();
            }}
            className="absolute top-6 right-6 w-12 h-12 flex items-center justify-center rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-white transition-all cursor-pointer shadow-lg z-50"
            title="Cerrar visualizador"
          >
            <span className="material-symbols-outlined text-xl">close</span>
          </button>

          {/* Imagen Ampliada */}
          <div className="relative max-w-full max-h-[85vh] flex items-center justify-center animate-in zoom-in-95 duration-300">
            <img 
              src={imagenUrl} 
              alt={alt} 
              className="max-w-full max-h-[85vh] object-contain drop-shadow-[0_20px_50px_rgba(0,0,0,0.8)] pointer-events-none"
            />
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
