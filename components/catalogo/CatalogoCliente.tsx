'use client';

import React, { useState, useMemo } from "react";
import CatalogoCard from "./CatalogoCard";

interface CatalogoClienteProps {
  celulares: any[];
  whatsappPhone: string;
}

export default function CatalogoCliente({ celulares, whatsappPhone }: CatalogoClienteProps) {
  const [marcaSeleccionada, setMarcaSeleccionada] = useState<string>("Todas");

  // 1. Obtener de forma dinámica todas las marcas únicas presentes en el catálogo
  const marcasDisponibles = useMemo(() => {
    const marcasUnicas = new Set<string>();
    celulares.forEach(c => {
      if (c.marca) {
        // Normalizamos la marca para evitar duplicados por minúsculas/mayúsculas (ej: 'Apple' vs 'apple')
        // pero conservamos el formato de título (ej: 'Apple')
        const normalized = c.marca.trim();
        if (normalized) {
          marcasUnicas.add(normalized);
        }
      }
    });
    return ["Todas", ...Array.from(marcasUnicas).sort()];
  }, [celulares]);

  // 2. Filtrar celulares basados en la marca seleccionada
  const celularesFiltrados = useMemo(() => {
    if (marcaSeleccionada === "Todas") {
      return celulares;
    }
    return celulares.filter(c => c.marca.trim() === marcaSeleccionada);
  }, [celulares, marcaSeleccionada]);

  return (
    <section className="relative py-12 bg-slate-950 min-h-[60vh] flex flex-col gap-12">
      {/* Resplandor de fondo general del catálogo */}
      <div className="absolute w-[500px] h-[500px] bg-[#3CD7FF]/5 rounded-full blur-[120px] -z-10 left-1/4 top-10 pointer-events-none" />
      <div className="absolute w-[400px] h-[400px] bg-secondary/5 rounded-full blur-[100px] -z-10 right-1/4 bottom-10 pointer-events-none" />

      {/* Contenedor de Filtros */}
      <div className="max-w-7xl mx-auto px-6 w-full space-y-4">
        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.25em] block text-center md:text-left">
          Filtrar por marca
        </span>
        
        {/* Barra horizontal de píldoras deslizable */}
        <div className="flex items-center gap-2 overflow-x-auto pb-4 pt-1 scrollbar-none justify-start md:justify-start -mx-6 px-6 md:-mx-0 md:px-0">
          {marcasDisponibles.map(marca => {
            const active = marca === marcaSeleccionada;
            return (
              <button
                key={marca}
                onClick={() => setMarcaSeleccionada(marca)}
                className={`px-5 py-2.5 rounded-full text-sm font-extrabold border transition-all duration-300 whitespace-nowrap cursor-pointer select-none ${
                  active 
                    ? "bg-secondary/15 border-secondary text-secondary shadow-[0_0_15px_rgba(60,215,255,0.15)]" 
                    : "bg-slate-900/40 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200"
                }`}
              >
                {marca}
              </button>
            );
          })}
        </div>
      </div>

      {/* Cuadrícula de Productos */}
      <div className="max-w-7xl mx-auto px-6 w-full flex-1">
        {celularesFiltrados.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {celularesFiltrados.map((celular) => (
              <CatalogoCard 
                key={celular.id} 
                celular={celular} 
                whatsappPhone={whatsappPhone} 
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center gap-4 bg-slate-900/10 border border-slate-900 rounded-3xl backdrop-blur-md">
            <span className="material-symbols-outlined text-5xl text-slate-600 animate-pulse">
              stay_current_portrait
            </span>
            <div className="space-y-1">
              <h4 className="text-lg font-bold text-slate-400">No hay modelos disponibles</h4>
              <p className="text-sm text-slate-600 max-w-sm">
                Actualmente no tenemos celulares activos para mostrar en esta marca. ¡Vuelve pronto o contáctanos por WhatsApp!
              </p>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
