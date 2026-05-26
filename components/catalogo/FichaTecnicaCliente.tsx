'use client';

import React, { useState } from "react";

interface FichaTecnicaClienteProps {
  celular: any;
  whatsappPhone: string;
}

export default function FichaTecnicaCliente({ celular, whatsappPhone }: FichaTecnicaClienteProps) {
  const { marca, modelo, colores, almacenamientos, rams, descripcion } = celular;

  // Estados locales para las variantes elegidas
  const [colorSeleccionado, setColorSeleccionado] = useState<string>(colores[0] || "");
  const [almSeleccionado, setAlmSeleccionado] = useState<string>(almacenamientos[0] || "");
  const [ramSeleccionada, setRamSeleccionada] = useState<string>(rams?.[0] || "");

  // Redirección inteligente a WhatsApp
  const handleCotizar = () => {
    const promptMessage = `¡Hola Finvora! Me interesa adquirir a crédito el equipo *${marca} ${modelo}* de *${almSeleccionado}* de almacenamiento con *${ramSeleccionada}* de RAM en color *${colorSeleccionado}*. ¿Me podrían ayudar con una cotización personalizada?`;
    const encodedMessage = encodeURIComponent(promptMessage);
    const url = `https://wa.me/${whatsappPhone}?text=${encodedMessage}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-700">
      
      {/* Cabecera del Equipo */}
      <div className="space-y-3">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-secondary/10 border border-secondary/20 rounded-xl text-secondary text-xs font-bold uppercase tracking-wider">
          {marca}
        </span>
        <h1 className="text-3xl md:text-5xl font-black text-white tracking-tight leading-none">
          {modelo}
        </h1>
        <p className="text-sm md:text-base text-slate-400 leading-relaxed font-medium pt-2">
          {descripcion}
        </p>
      </div>

      {/* Selectores de Variantes */}
      <div className="space-y-6 pt-6 border-t border-slate-900">
        
        {/* Selector de Colores */}
        <div className="space-y-2">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-widest block">
            Elige tu Color Favorito
          </span>
          <div className="flex flex-wrap gap-2">
            {colores.map((color: string) => {
              const active = color === colorSeleccionado;
              return (
                <button
                  key={color}
                  type="button"
                  onClick={() => setColorSeleccionado(color)}
                  className={`px-4 py-2.5 rounded-xl text-xs md:text-sm font-bold border transition-all duration-300 cursor-pointer ${
                    active 
                      ? "bg-secondary/10 border-secondary text-secondary shadow-[0_0_15px_rgba(60,215,255,0.08)]" 
                      : "bg-slate-950/30 border-slate-850 text-slate-400 hover:border-slate-800 hover:text-slate-200"
                  }`}
                >
                  {color}
                </button>
              );
            })}
          </div>
        </div>

        {/* Selector de Almacenamiento */}
        <div className="space-y-2">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-widest block">
            Capacidad de Almacenamiento
          </span>
          <div className="flex flex-wrap gap-2">
            {almacenamientos.map((alm: string) => {
              const active = alm === almSeleccionado;
              return (
                <button
                  key={alm}
                  type="button"
                  onClick={() => setAlmSeleccionado(alm)}
                  className={`px-5 py-3 rounded-xl text-xs md:text-sm font-extrabold border transition-all duration-300 cursor-pointer font-mono ${
                    active 
                      ? "bg-secondary/10 border-secondary text-secondary shadow-[0_0_15px_rgba(60,215,255,0.08)]" 
                      : "bg-slate-950/30 border-slate-850 text-slate-400 hover:border-slate-800 hover:text-slate-200"
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
          <div className="space-y-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest block">
              Memoria RAM
            </span>
            <div className="flex flex-wrap gap-2">
              {rams.map((ram: string) => {
                const active = ram === ramSeleccionada;
                return (
                  <button
                    key={ram}
                    type="button"
                    onClick={() => setRamSeleccionada(ram)}
                    className={`px-5 py-3 rounded-xl text-xs md:text-sm font-extrabold border transition-all duration-300 cursor-pointer font-mono ${
                      active 
                        ? "bg-secondary/10 border-secondary text-secondary shadow-[0_0_15px_rgba(60,215,255,0.08)]" 
                        : "bg-slate-950/30 border-slate-850 text-slate-400 hover:border-slate-800 hover:text-slate-200"
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

      {/* Caja de Conversión de WhatsApp */}
      <div className="pt-8 border-t border-slate-900">
        <button
          onClick={handleCotizar}
          type="button"
          className="relative w-full py-4.5 bg-gradient-to-r from-[#FF9933] via-[#FFAE59] to-[#FF7700] hover:from-[#ffaa44] hover:via-[#ffb86b] hover:to-[#ff8811] text-slate-950 font-black rounded-2xl shadow-[0_0_20px_rgba(255,153,51,0.35)] hover:shadow-[0_0_35px_rgba(255,153,51,0.7)] hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 flex items-center justify-center cursor-pointer text-sm md:text-base tracking-wide overflow-hidden group"
        >
          {/* Shimmer de luz que pasa por el botón al hacer hover */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent -skew-x-12 translate-x-[-150%] group-hover:animate-shimmer-smooth pointer-events-none" />
          
          <span>Cotizar por WhatsApp</span>
        </button>
      </div>

    </div>
  );
}
