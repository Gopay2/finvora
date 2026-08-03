'use client';

import React from 'react';
import type { Tarea, Perfil } from '@/types/taskboard';

interface TaskboardModalsProps {
  modalAbierto: boolean;
  setModalAbierto: (abierto: boolean) => void;
  nuevoTitulo: string;
  setNuevoTitulo: (titulo: string) => void;
  nuevaDesc: string;
  setNuevaDesc: (desc: string) => void;
  nuevoAsignado: string;
  setNuevoAsignado: (asignado: string) => void;
  errorForm: string;
  isPending: boolean;
  perfiles: Perfil[];
  handleCrearTarea: (e: React.FormEvent) => void;

  tareaDetalle: Tarea | null;
  setTareaDetalle: (tarea: Tarea | null) => void;

  tareaAEliminar: string | null;
  setTareaAEliminar: (id: string | null) => void;
  confirmarEliminarTarea: () => void;
}

export function TaskboardModals({
  modalAbierto,
  setModalAbierto,
  nuevoTitulo,
  setNuevoTitulo,
  nuevaDesc,
  setNuevaDesc,
  nuevoAsignado,
  setNuevoAsignado,
  errorForm,
  isPending,
  perfiles,
  handleCrearTarea,
  tareaDetalle,
  setTareaDetalle,
  tareaAEliminar,
  setTareaAEliminar,
  confirmarEliminarTarea
}: TaskboardModalsProps) {
  return (
    <>
      {/* Modal Flotante de Creación */}
      {modalAbierto && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center p-6 border-b border-slate-850">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <span className="material-symbols-outlined text-secondary">assignment_add</span>
                Nueva Tarea
              </h3>
              <button
                onClick={() => setModalAbierto(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-all cursor-pointer"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleCrearTarea} className="p-6 space-y-4">
              {errorForm && (
                <div className="p-3 bg-red-500/15 border border-red-500/30 rounded-xl text-red-300 text-xs font-semibold">
                  {errorForm}
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400">Título de la tarea</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Revisar stock de Tijuana"
                  value={nuevoTitulo}
                  onChange={(e) => setNuevoTitulo(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-base md:text-sm text-white placeholder-slate-600 focus:outline-none focus:border-secondary transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400">Descripción (Opcional)</label>
                <textarea
                  placeholder="Detalles sobre lo que se necesita hacer..."
                  value={nuevaDesc}
                  onChange={(e) => setNuevaDesc(e.target.value)}
                  rows={3}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-base md:text-sm text-white placeholder-slate-600 focus:outline-none focus:border-secondary transition-all resize-none custom-scrollbar"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400">Asignar a</label>
                <div className="relative">
                  <select
                    value={nuevoAsignado}
                    onChange={(e) => setNuevoAsignado(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-4 pr-10 py-2.5 text-base md:text-sm text-white focus:outline-none focus:border-secondary transition-all appearance-none"
                  >
                    {perfiles.map((perfil) => (
                      <option key={perfil.id} value={perfil.id}>
                        {perfil.username} ({perfil.role})
                      </option>
                    ))}
                  </select>
                  <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500 text-base">
                    keyboard_arrow_down
                  </span>
                </div>
              </div>

              <div className="flex gap-3 pt-3 border-t border-slate-850 mt-6">
                <button
                  type="button"
                  onClick={() => setModalAbierto(false)}
                  className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-sm font-semibold transition-all cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="flex-1 py-2.5 bg-secondary hover:bg-secondary-fixed text-slate-950 rounded-xl text-sm font-bold shadow-lg shadow-secondary/10 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isPending ? (
                    <span className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    "Crear Tarea"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Detalle Completo de Tarea */}
      {tareaDetalle && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-start p-6 border-b border-slate-850">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span
                    className={`w-2.5 h-2.5 rounded-full ${
                      tareaDetalle.estado === "Pendientes"
                        ? "bg-slate-400"
                        : tareaDetalle.estado === "En proceso"
                        ? "bg-amber-400"
                        : "bg-emerald-400"
                    }`}
                  />
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    {tareaDetalle.estado}
                  </span>
                </div>
                <h3 className="text-xl font-bold text-white leading-snug">
                  {tareaDetalle.titulo}
                </h3>
              </div>
              <button
                onClick={() => setTareaDetalle(null)}
                className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-all cursor-pointer"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Descripción</h4>
                <div className="bg-slate-950/50 border border-slate-850/80 rounded-2xl p-4 min-h-[120px] max-h-[250px] overflow-y-auto overflow-x-hidden break-words text-slate-350 text-sm leading-relaxed whitespace-pre-line custom-scrollbar">
                  {tareaDetalle.descripcion || (
                    <span className="text-slate-650 italic">Esta tarea no tiene descripción.</span>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 bg-slate-950/30 p-4 rounded-2xl border border-slate-850">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Asignada a</span>
                  <div className="flex items-center gap-2 text-sm text-slate-350">
                    <span className="material-symbols-outlined text-secondary text-base">person</span>
                    <span className="font-medium">{tareaDetalle.asignado?.username || "Nadie"}</span>
                  </div>
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Creada por</span>
                  <div className="flex items-center gap-2 text-sm text-slate-350">
                    <span className="material-symbols-outlined text-slate-500 text-base">edit_square</span>
                    <span className="font-medium">{tareaDetalle.creador?.username || "Sistema"}</span>
                  </div>
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Fecha de creación</span>
                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    <span className="material-symbols-outlined text-slate-500 text-sm">calendar_today</span>
                    <span>{new Date(tareaDetalle.created_at).toLocaleString("es-ES")}</span>
                  </div>
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Última actualización</span>
                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    <span className="material-symbols-outlined text-slate-500 text-sm">update</span>
                    <span>{new Date(tareaDetalle.updated_at).toLocaleString("es-ES")}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end p-6 border-t border-slate-850 bg-slate-900/50">
              <button
                type="button"
                onClick={() => setTareaDetalle(null)}
                className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-sm font-semibold transition-all cursor-pointer"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Confirmación de Eliminación */}
      {tareaAEliminar && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-[60] animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200 p-6 text-center space-y-4">
            <div className="mx-auto w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center text-red-500 mb-2">
              <span className="material-symbols-outlined text-2xl">delete_forever</span>
            </div>
            <div className="space-y-1.5">
              <h3 className="text-lg font-bold text-white">¿Eliminar tarea?</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                ¿Estás seguro de que quieres eliminar esta tarea? Esta acción no se puede deshacer.
              </p>
            </div>
            <div className="flex gap-3 pt-3 border-t border-slate-850">
              <button
                type="button"
                onClick={() => setTareaAEliminar(null)}
                className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-350 rounded-xl text-sm font-semibold transition-all cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={confirmarEliminarTarea}
                className="flex-1 py-2.5 bg-red-600 hover:bg-red-500 text-white rounded-xl text-sm font-bold shadow-lg shadow-red-900/20 transition-all cursor-pointer"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
