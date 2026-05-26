'use client';

import React, { useState } from "react";

interface CatalogoCardProps {
  celular: any;
  whatsappPhone: string;
}

export default function CatalogoCard({ celular, whatsappPhone }: CatalogoCardProps) {
  const { marca, modelo, colores, almacenamientos, rams, imagen_url, descripcion } = celular;

  // Estados locales para la selección de variantes dentro de la tarjeta
  const [colorSeleccionado, setColorSeleccionado] = useState<string>(colores[0] || "");
  const [almSeleccionado, setAlmSeleccionado] = useState<string>(almacenamientos[0] || "");
  const [ramSeleccionada, setRamSeleccionada] = useState<string>(rams?.[0] || "");

  // Generar URL inteligente de WhatsApp
  const handleCotizar = () => {
    const promptMessage = `¡Hola Finvora! Me interesa tramitar mi crédito para el equipo *${marca} ${modelo}* de *${almSeleccionado}* de almacenamiento con *${ramSeleccionada}* de RAM en color *${colorSeleccionado}*. ¿Me podrían ayudar a realizar mi cotización personalizada?`;
    const encodedMessage = encodeURIComponent(promptMessage);
    const url = `https://wa.me/${whatsappPhone}?text=${encodedMessage}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="group relative bg-slate-900/40 backdrop-blur-xl border border-slate-800 p-6 rounded-3xl hover:border-secondary/40 transition-all duration-500 flex flex-col gap-5 overflow-hidden">
      {/* Resplandor de fondo al pasar el cursor */}
      <div className="absolute -bottom-16 -right-16 w-32 h-32 bg-secondary/5 rounded-full blur-3xl group-hover:bg-secondary/15 transition-colors duration-500" />
      
      {/* Contenedor de la Imagen */}
      <div className="relative w-full h-56 bg-slate-950/60 rounded-2xl border border-slate-800/40 overflow-hidden flex items-center justify-center p-4">
        <img 
          src={imagen_url} 
          alt={`${marca} ${modelo}`} 
          className="max-h-full max-w-full object-contain transform group-hover:scale-105 transition-transform duration-700 drop-shadow-[0_10px_20px_rgba(0,0,0,0.5)]"
        />
      </div>

      {/* Información del Celular */}
      <div className="space-y-2 relative z-10 flex-1">
        <span className="inline-block text-[10px] font-bold uppercase tracking-[0.2em] text-secondary bg-secondary/5 border border-secondary/10 px-2.5 py-1 rounded-lg">
          {marca}
        </span>
        <h3 className="text-xl font-bold text-white tracking-tight">{modelo}</h3>
        <p className="text-xs text-slate-400 leading-relaxed font-medium line-clamp-3">
          {descripcion}
        </p>
      </div>

      {/* Selectores de Variantes */}
      <div className="space-y-4 relative z-10 pt-2 border-t border-slate-800/50">
        
        {/* Selector de Colores */}
        <div className="space-y-1.5">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
            Color disponible:
          </span>
          <div className="flex flex-wrap gap-1.5">
            {colores.map((color: string) => {
              const active = color === colorSeleccionado;
              return (
                <button
                  key={color}
                  type="button"
                  onClick={() => setColorSeleccionado(color)}
                  className={`px-3 py-1 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                    active 
                      ? "bg-secondary/10 border-secondary text-secondary" 
                      : "bg-slate-950/30 border-slate-850 text-slate-400 hover:border-slate-800"
                  }`}
                >
                  {color}
                </button>
              );
            })}
          </div>
        </div>

        {/* Selector de Almacenamientos */}
        <div className="space-y-1.5">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
            Almacenamiento:
          </span>
          <div className="flex flex-wrap gap-1.5">
            {almacenamientos.map((alm: string) => {
              const active = alm === almSeleccionado;
              return (
                <button
                  key={alm}
                  type="button"
                  onClick={() => setAlmSeleccionado(alm)}
                  className={`px-3 py-1 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                    active 
                      ? "bg-secondary/10 border-secondary text-secondary" 
                      : "bg-slate-950/30 border-slate-850 text-slate-400 hover:border-slate-800"
                  }`}
                >
                  {alm}
                </button>
              );
            })}
          </div>
        </div>

        {/* Selector de RAMs */}
        {rams && rams.length > 0 && (
          <div className="space-y-1.5">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
              Memoria RAM:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {rams.map((ram: string) => {
                const active = ram === ramSeleccionada;
                return (
                  <button
                    key={ram}
                    type="button"
                    onClick={() => setRamSeleccionada(ram)}
                    className={`px-3 py-1 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                      active 
                        ? "bg-secondary/10 border-secondary text-secondary" 
                        : "bg-slate-950/30 border-slate-850 text-slate-400 hover:border-slate-800"
                    }`}
                  >
                    {ram}
                  </button>
                );
              })}
            </div>
          </div>
        )}

      </div>

      {/* Botón de Enlace a WhatsApp */}
      <button
        onClick={handleCotizar}
        type="button"
        className="w-full py-3.5 bg-[#FF9933] hover:brightness-110 text-[#001C3A] font-extrabold rounded-2xl shadow-lg hover:shadow-[#FF9933]/15 transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer relative z-10 text-sm tracking-wide"
      >
        <span className="material-symbols-outlined text-lg">call</span>
        Cotizar a Crédito
      </button>
    </div>
  );
}
