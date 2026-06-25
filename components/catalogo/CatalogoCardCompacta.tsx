'use client';

import React from "react";
import Link from "next/link";
import type { CatalogoCelular } from "@/types/catalogo";

interface CatalogoCardCompactaProps {
  celular: CatalogoCelular;
}

export default function CatalogoCardCompacta({ celular }: CatalogoCardCompactaProps) {
  const { id, marca, modelo, colores, almacenamientos, imagen_url } = celular;

  return (
    <Link 
      href={`/catalogo/${id}`}
      className="group relative bg-slate-900/30 backdrop-blur-xl border border-slate-800/80 p-4 md:p-5 rounded-2xl hover:border-secondary/40 hover:bg-slate-900/50 hover:shadow-[0_10px_30px_rgba(0,0,0,0.4)] transition-all duration-300 flex flex-col justify-between gap-3 overflow-hidden cursor-pointer h-full"
    >
      {/* Resplandor suave interno en hover */}
      <div className="absolute -bottom-12 -right-12 w-24 h-24 bg-secondary/5 rounded-full blur-2xl group-hover:bg-secondary/10 transition-colors duration-500" />
      
      <div className="space-y-3">
        {/* Contenedor de la Imagen */}
        <div className="relative w-full h-36 md:h-44 bg-slate-950/60 rounded-xl border border-slate-800/40 overflow-hidden flex items-center justify-center p-3">
          <img 
            src={imagen_url} 
            alt={`${marca} ${modelo}`} 
            className="max-h-full max-w-full object-contain transform group-hover:scale-[1.03] transition-transform duration-500 drop-shadow-[0_5px_15px_rgba(0,0,0,0.4)]"
          />
        </div>

        {/* Marca & Modelo */}
        <div className="space-y-1">
          <span className="text-[9px] font-black uppercase tracking-widest text-slate-500 block">
            {marca}
          </span>
          <h3 className="text-sm md:text-base font-extrabold text-white group-hover:text-secondary transition-colors truncate">
            {modelo}
          </h3>
        </div>

        {/* Variantes Rápidas (Colores & Capacidad de forma compacta) */}
        <div className="space-y-2 pt-1">
          {/* Muestra de Colores (pequeños círculos/badges) */}
          <div className="flex flex-wrap gap-1 items-center">
            {colores.slice(0, 3).map((color: string) => (
              <span 
                key={color} 
                className="px-1.5 py-0.5 bg-slate-950/80 border border-slate-850 rounded-md text-[9px] font-semibold text-slate-400 truncate max-w-[80px]"
                title={color}
              >
                {color}
              </span>
            ))}
            {colores.length > 3 && (
              <span className="text-[9px] text-slate-500 font-black pl-0.5">
                +{colores.length - 3}
              </span>
            )}
          </div>

          {/* Muestra de Almacenamiento rápido */}
          <div className="flex gap-1 items-center">
            {almacenamientos.slice(0, 2).map((alm: string) => (
              <span 
                key={alm} 
                className="text-[9px] font-bold font-mono text-secondary/80"
              >
                {alm}
              </span>
            ))}
            {almacenamientos.length > 2 && (
              <span className="text-[9px] text-slate-500 font-bold font-mono">
                +
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Botón de Acción Minimalista */}
      <div className="pt-2 border-t border-slate-800/30 flex items-center justify-between mt-auto">
        <span className="text-[10px] font-bold text-slate-400 group-hover:text-white transition-colors">
          Ver detalles
        </span>
        <span className="material-symbols-outlined text-sm text-slate-500 group-hover:text-secondary group-hover:translate-x-0.5 transition-all">
          arrow_forward
        </span>
      </div>
    </Link>
  );
}
