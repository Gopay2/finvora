'use client';

import React from 'react';
import type { Tarea, EstadoTarea } from '@/types/taskboard';

interface TaskboardCardProps {
  tarea: Tarea;
  columna: EstadoTarea;
  isDragged: boolean;
  onDragStart: (e: React.DragEvent, id: string) => void;
  onDragEnd: () => void;
  onEliminarTarea: (id: string) => void;
  onVerDetalles: (tarea: Tarea) => void;
}

export function TaskboardCard({
  tarea,
  columna,
  isDragged,
  onDragStart,
  onDragEnd,
  onEliminarTarea,
  onVerDetalles,
}: TaskboardCardProps) {
  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, tarea.id)}
      onDragEnd={onDragEnd}
      className={`group bg-slate-950 border p-2.5 lg:p-4.5 rounded-xl lg:rounded-2xl space-y-1.5 lg:space-y-3 transition-all duration-200 cursor-grab active:cursor-grabbing hover:border-slate-700 hover:shadow-lg overflow-hidden w-full max-w-[calc(45vw-20px)] sm:max-w-[260px] lg:max-w-none min-w-0 block ${
        isDragged ? "opacity-40 border-dashed border-secondary" : "border-slate-850"
      }`}
    >
      {/* Título y eliminación */}
      <div className="flex justify-between items-start gap-1 lg:gap-2 w-full min-w-0">
        <h4 className="font-bold text-slate-100 text-[10px] lg:text-sm leading-snug group-hover:text-white transition-colors h-4 lg:h-5 overflow-hidden truncate min-w-0 flex-1">
          {tarea.titulo}
        </h4>
        {columna !== "Terminado" && (
          <button
            onClick={() => onEliminarTarea(tarea.id)}
            className="opacity-100 lg:opacity-0 group-hover:opacity-100 hover:bg-red-500/10 text-slate-500 hover:text-red-400 p-0.5 lg:p-1 rounded-lg transition-all cursor-pointer shrink-0"
            title="Eliminar tarea"
          >
            <span className="material-symbols-outlined text-xs lg:text-lg">delete</span>
          </button>
        )}
      </div>

      {/* Descripción */}
      <p className="text-[9px] lg:text-xs text-slate-400 leading-relaxed h-3.5 lg:h-5 overflow-hidden truncate w-full min-w-0 block">
        {tarea.descripcion || "\u00A0"}
      </p>

      {/* Pie de la tarjeta */}
      <div className="mt-1.5 lg:mt-2 flex flex-col-reverse lg:flex-row lg:items-center justify-between gap-1.5 lg:gap-2 border-t border-slate-900 pt-1.5 lg:pt-3 text-[9px] lg:text-[11px] text-slate-400 w-full min-w-0">
        {/* Botón de detalles */}
        <button
          onClick={() => onVerDetalles(tarea)}
          className="text-secondary font-semibold flex items-center justify-center gap-1 bg-slate-900 border border-slate-850 px-2.5 py-0.5 rounded-full cursor-pointer transition-all hover:bg-slate-850 w-full lg:w-auto text-[8px] lg:text-[11px]"
        >
          <span className="material-symbols-outlined text-[10px] lg:text-[13px] shrink-0">visibility</span>
          <span>Detalles</span>
        </button>

        {/* Asignado */}
        <div className="flex items-center justify-center lg:justify-start gap-1 w-full lg:w-auto lg:max-w-[140px] lg:self-auto" title={`Asignado a: ${tarea.asignado?.username || "Nadie"}`}>
          <span className="material-symbols-outlined text-[10px] lg:text-[13px] text-secondary shrink-0">person</span>
          <span className="font-semibold text-slate-350 truncate text-[8px] lg:text-[11px]">
            {tarea.asignado?.username || "Nadie"}
          </span>
        </div>
      </div>
    </div>
  );
}
