'use client';

import React from 'react';

export interface TareaTerminada {
  id: string;
  titulo: string;
  descripcion: string | null;
  estado: "Pendientes" | "En proceso" | "Terminado";
  creado_por: string | null;
  asignado_a: string;
  created_at: string;
  updated_at: string;
  creador?: { username: string } | null;
  asignado?: { username: string } | null;
}

interface HistorialTableProps {
  tareasPaginadas: TareaTerminada[];
  tareasFiltradas: TareaTerminada[];
  paginaActual: number;
  totalPaginas: number;
  itemsPorPagina: number;
  handleCambiarPagina: (pag: number) => void;
  handleRehacerClick: (tarea: TareaTerminada) => void;
  formatearFecha: (fechaStr: string) => string;
}

export function HistorialTable({
  tareasPaginadas,
  tareasFiltradas,
  paginaActual,
  totalPaginas,
  itemsPorPagina,
  handleCambiarPagina,
  handleRehacerClick,
  formatearFecha
}: HistorialTableProps) {
  return (
    <div className="bg-slate-900/20 backdrop-blur-xl border border-slate-800/80 rounded-3xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-sm">
          <thead>
            <tr className="border-b border-slate-850 bg-slate-950/40 text-slate-400 font-semibold">
              <th className="py-4 px-6">Tarea</th>
              <th className="py-4 px-6">Creado Por</th>
              <th className="py-4 px-6">Completado Por</th>
              <th className="py-4 px-6">Fecha Finalización</th>
              <th className="py-4 px-6 text-center">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-850/60 bg-slate-950/10">
            {tareasPaginadas.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-12 text-center text-slate-550">
                  <span className="material-symbols-outlined text-4xl mb-2 text-slate-650">
                    folder_open
                  </span>
                  <p className="text-sm">No se encontraron tareas terminadas.</p>
                </td>
              </tr>
            ) : (
              tareasPaginadas.map((tarea) => (
                <tr key={tarea.id} className="hover:bg-slate-900/10 transition-colors">
                  {/* Tarea e Info */}
                  <td className="py-4 px-6 max-w-sm">
                    <div className="space-y-1">
                      <div className="font-bold text-slate-200">{tarea.titulo}</div>
                      {tarea.descripcion && (
                        <div className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                          {tarea.descripcion}
                        </div>
                      )}
                    </div>
                  </td>

                  {/* Creador */}
                  <td className="py-4 px-6 text-slate-300">
                    <span className="text-xs">{tarea.creador?.username || "Sistema"}</span>
                  </td>

                  {/* Asignado */}
                  <td className="py-4 px-6">
                    <span className="inline-flex items-center gap-1 bg-slate-900 border border-slate-800 text-slate-300 text-xs font-semibold px-2.5 py-0.5 rounded-full">
                      <span className="material-symbols-outlined text-[12px] text-secondary">
                        person
                      </span>
                      {tarea.asignado?.username || "Nadie"}
                    </span>
                  </td>

                  {/* Fecha de Finalización */}
                  <td className="py-4 px-6 text-slate-400 text-xs">
                    {formatearFecha(tarea.updated_at)}
                  </td>

                  {/* Acciones */}
                  <td className="py-4 px-6">
                    <div className="flex items-center justify-center">
                      <button
                        onClick={() => handleRehacerClick(tarea)}
                        className="px-3.5 py-1.5 bg-slate-850 hover:bg-slate-800 text-white border border-slate-800 hover:border-secondary/25 rounded-lg text-sm font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
                        title="Rehacer y mover a Pendientes"
                      >
                        <span className="material-symbols-outlined text-base text-secondary">settings_backup_restore</span>
                        <span>Rehacer</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Paginador */}
      {totalPaginas > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-5 bg-slate-950/40 border-t border-slate-850/80 text-xs text-slate-400">
          <div>
            Mostrando del{" "}
            <span className="font-semibold text-white">
              {(paginaActual - 1) * itemsPorPagina + 1}
            </span>{" "}
            al{" "}
            <span className="font-semibold text-white">
              {Math.min(paginaActual * itemsPorPagina, tareasFiltradas.length)}
            </span>{" "}
            de <span className="font-semibold text-white">{tareasFiltradas.length}</span> tareas
            terminadas
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handleCambiarPagina(paginaActual - 1)}
              disabled={paginaActual === 1}
              className="p-1.5 bg-slate-900 border border-slate-800 rounded-lg hover:bg-slate-850 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
            >
              <span className="material-symbols-outlined text-sm">chevron_left</span>
            </button>

            <div className="flex items-center gap-1">
              {Array.from({ length: totalPaginas }, (_, i) => i + 1).map((pag) => (
                <button
                  key={pag}
                  onClick={() => handleCambiarPagina(pag)}
                  className={`w-7 h-7 rounded-lg text-xs font-bold transition-all cursor-pointer ${paginaActual === pag
                      ? "bg-secondary text-slate-950"
                      : "bg-slate-900/60 border border-slate-850 text-slate-400 hover:text-white hover:bg-slate-850"
                    }`}
                >
                  {pag}
                </button>
              ))}
            </div>

            <button
              onClick={() => handleCambiarPagina(paginaActual + 1)}
              disabled={paginaActual === totalPaginas}
              className="p-1.5 bg-slate-900 border border-slate-800 rounded-lg hover:bg-slate-850 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
            >
              <span className="material-symbols-outlined text-sm">chevron_right</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
