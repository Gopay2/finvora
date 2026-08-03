'use client';

import React from 'react';
import type { Tarea, EstadoTarea } from '@/types/taskboard';
import { TaskboardCard } from './TaskboardCard';

interface TaskboardColumnProps {
  columna: EstadoTarea;
  listaTareas: Tarea[];
  isOver: boolean;
  draggedTaskId: string | null;
  onDragOver: (e: React.DragEvent, col: string) => void;
  onDragLeave: () => void;
  onDrop: (e: React.DragEvent, col: EstadoTarea) => void;
  onDragStart: (e: React.DragEvent, id: string) => void;
  onDragEnd: () => void;
  onEliminarTarea: (id: string) => void;
  onVerDetalles: (tarea: Tarea) => void;
}

export function TaskboardColumn({
  columna,
  listaTareas,
  isOver,
  draggedTaskId,
  onDragOver,
  onDragLeave,
  onDrop,
  onDragStart,
  onDragEnd,
  onEliminarTarea,
  onVerDetalles
}: TaskboardColumnProps) {
  return (
    <div
      onDragOver={(e) => onDragOver(e, columna)}
      onDragLeave={onDragLeave}
      onDrop={(e) => onDrop(e, columna)}
      className={`flex flex-col w-[45vw] max-w-[45vw] sm:w-[280px] sm:max-w-[280px] lg:w-auto lg:max-w-none shrink-0 snap-start min-h-[450px] lg:min-h-[600px] bg-slate-900/20 backdrop-blur-xl border rounded-2xl lg:rounded-3xl p-2.5 lg:p-5 transition-all duration-200 overflow-hidden min-w-0 ${
        isOver ? "border-secondary/40 bg-slate-900/40" : "border-slate-800/80"
      }`}
    >
      {/* Header de columna */}
      <div className="flex justify-between items-center mb-3 lg:mb-5 pb-2 lg:pb-3 border-b border-slate-850">
        <div className="flex items-center gap-1.5 lg:gap-3">
          <span
            className={`w-1.5 h-1.5 lg:w-2 lg:h-2 rounded-full ${
              columna === "Pendientes"
                ? "bg-slate-400"
                : columna === "En proceso"
                ? "bg-amber-400"
                : "bg-emerald-400"
            }`}
          />
          <h3 className="font-bold text-slate-200 text-[11px] lg:text-base leading-none">{columna}</h3>
        </div>
        <span className="px-1.5 lg:px-2.5 py-0.2 lg:py-0.5 bg-slate-950 border border-slate-850 rounded-full text-[9px] lg:text-xs font-semibold text-slate-400">
          {listaTareas.length}
          <span className="hidden lg:inline">{columna === "Terminado" && " (Max 20)"}</span>
        </span>
      </div>

      {/* Lista de tarjetas */}
      <div className="flex-1 space-y-2 lg:space-y-4 overflow-y-auto overflow-x-hidden max-h-[450px] lg:max-h-[650px] pr-0.5 lg:pr-1 w-full max-w-[calc(45vw-20px)] sm:max-w-[260px] lg:max-w-none min-w-0 block custom-scrollbar">
        {listaTareas.length === 0 ? (
          <div className="flex flex-col items-center justify-center border border-dashed border-slate-850 rounded-xl lg:rounded-2xl p-4 lg:p-8 text-center text-slate-500 min-h-[120px]">
            <span className="material-symbols-outlined text-lg lg:text-3xl mb-1 lg:mb-2 text-slate-655">
              inbox
            </span>
            <p className="text-[9px] lg:text-xs">No hay tareas</p>
          </div>
        ) : (
          listaTareas.map((tarea) => (
            <TaskboardCard
              key={tarea.id}
              tarea={tarea}
              columna={columna}
              isDragged={draggedTaskId === tarea.id}
              onDragStart={onDragStart}
              onDragEnd={onDragEnd}
              onEliminarTarea={onEliminarTarea}
              onVerDetalles={onVerDetalles}
            />
          ))
        )}
      </div>
    </div>
  );
}
