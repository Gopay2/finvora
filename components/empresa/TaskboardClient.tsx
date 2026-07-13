"use client";

import React, { useState, useEffect, useTransition, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { crearTarea, actualizarEstadoTarea, eliminarTarea } from "@/app/empresa/webapp/taskboard/actions";

interface Perfil {
  id: string;
  username: string;
  email: string;
  role: string;
}

interface Tarea {
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

interface TaskboardClientProps {
  perfiles: Perfil[];
  tareasIniciales: Tarea[];
  currentUser: {
    id: string | null;
    role: string;
    username: string | null;
  };
}

export default function TaskboardClient({
  perfiles,
  tareasIniciales,
  currentUser,
}: TaskboardClientProps) {
  const router = useRouter();
  const [tareas, setTareas] = useState<Tarea[]>(tareasIniciales);
  const [filtro, setFiltro] = useState<"todas" | "mias">("todas");
  const [modalAbierto, setModalAbierto] = useState(false);
  const [isPending, startTransition] = useTransition();

  // Estados para arrastre visual
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [dragOverCol, setDragOverCol] = useState<string | null>(null);

  // Formulario
  const [nuevoTitulo, setNuevoTitulo] = useState("");
  const [nuevaDesc, setNuevaDesc] = useState("");
  const [nuevoAsignado, setNuevoAsignado] = useState(currentUser.id || "");
  const [errorForm, setErrorForm] = useState("");

  // Configuración de Supabase Realtime
  useEffect(() => {
    const supabase = createClient();
    if (!supabase) return;

    const channel = supabase
      .channel("taskboard_realtime_changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "taskboard" },
        async (payload: any) => {
          if (payload.eventType === "INSERT") {
            const newRow = payload.new as any;
            const creadorPerfil = perfiles.find((p) => p.id === newRow.creado_por);
            const asignadoPerfil = perfiles.find((p) => p.id === newRow.asignado_a);

            const nuevaTarea: Tarea = {
              id: newRow.id,
              titulo: newRow.titulo,
              descripcion: newRow.descripcion,
              estado: newRow.estado,
              creado_por: newRow.creado_por,
              asignado_a: newRow.asignado_a,
              created_at: newRow.created_at,
              updated_at: newRow.updated_at,
              creador: creadorPerfil ? { username: creadorPerfil.username } : null,
              asignado: asignadoPerfil ? { username: asignadoPerfil.username } : null,
            };

            setTareas((prev) => {
              if (prev.some((t) => t.id === nuevaTarea.id)) return prev;
              return [...prev, nuevaTarea];
            });
          } else if (payload.eventType === "UPDATE") {
            const updatedRow = payload.new as any;
            const creadorPerfil = perfiles.find((p) => p.id === updatedRow.creado_por);
            const asignadoPerfil = perfiles.find((p) => p.id === updatedRow.asignado_a);

            setTareas((prev) =>
              prev.map((t) =>
                t.id === updatedRow.id
                  ? {
                      ...t,
                      titulo: updatedRow.titulo,
                      descripcion: updatedRow.descripcion,
                      estado: updatedRow.estado,
                      asignado_a: updatedRow.asignado_a,
                      updated_at: updatedRow.updated_at,
                      creador: creadorPerfil ? { username: creadorPerfil.username } : t.creador,
                      asignado: asignadoPerfil ? { username: asignadoPerfil.username } : t.asignado,
                    }
                  : t
              )
            );
          } else if (payload.eventType === "DELETE") {
            const oldRow = payload.old as any;
            setTareas((prev) => prev.filter((t) => t.id !== oldRow.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [perfiles]);

  // Filtrado y limitación
  const tareasFiltradas = useMemo(() => {
    let list = tareas;
    if (filtro === "mias") {
      list = list.filter((t) => t.asignado_a === currentUser.id);
    }

    const pendientes = list.filter((t) => t.estado === "Pendientes");
    const enProceso = list.filter((t) => t.estado === "En proceso");

    // Limitar "Terminado" a las 20 tareas más recientes en base a updated_at desc
    const terminado = list
      .filter((t) => t.estado === "Terminado")
      .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
      .slice(0, 20);

    return {
      Pendientes: pendientes,
      "En proceso": enProceso,
      Terminado: terminado,
    };
  }, [tareas, filtro, currentUser.id]);

  // Handlers para Drag and Drop
  const handleDragStart = (e: React.DragEvent, id: string) => {
    e.dataTransfer.setData("text/plain", id);
    setDraggedTaskId(id);
  };

  const handleDragEnd = () => {
    setDraggedTaskId(null);
    setDragOverCol(null);
  };

  const handleDragOver = (e: React.DragEvent, col: string) => {
    e.preventDefault();
    if (dragOverCol !== col) {
      setDragOverCol(col);
    }
  };

  const handleDrop = async (e: React.DragEvent, columnaDestino: "Pendientes" | "En proceso" | "Terminado") => {
    e.preventDefault();
    const id = e.dataTransfer.getData("text/plain");
    setDragOverCol(null);
    setDraggedTaskId(null);

    const tarea = tareas.find((t) => t.id === id);
    if (!tarea || tarea.estado === columnaDestino) return;

    // Actualización optimista local
    const copiaTareas = [...tareas];
    setTareas((prev) =>
      prev.map((t) =>
        t.id === id
          ? {
              ...t,
              estado: columnaDestino,
              updated_at: new Date().toISOString(),
            }
          : t
      )
    );

    try {
      await actualizarEstadoTarea(id, columnaDestino);
    } catch (error) {
      console.error(error);
      // Revertir en caso de fallo
      setTareas(copiaTareas);
    }
  };

  // Handler para agregar tarea
  const handleCrearTarea = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nuevoTitulo.trim()) {
      setErrorForm("El título es requerido.");
      return;
    }

    startTransition(async () => {
      try {
        await crearTarea({
          titulo: nuevoTitulo,
          descripcion: nuevaDesc,
          asignado_a: nuevoAsignado,
        });

        // Limpiar formulario y cerrar
        setNuevoTitulo("");
        setNuevaDesc("");
        setNuevoAsignado(currentUser.id || "");
        setErrorForm("");
        setModalAbierto(false);
      } catch (err: any) {
        setErrorForm(err.message || "Error al crear la tarea.");
      }
    });
  };

  // Handler para eliminar tarea
  const handleEliminarTarea = async (id: string) => {
    if (!confirm("¿Estás seguro de que quieres eliminar esta tarea?")) return;

    const copiaTareas = [...tareas];
    setTareas((prev) => prev.filter((t) => t.id !== id));

    try {
      await eliminarTarea(id);
    } catch (error) {
      console.error(error);
      setTareas(copiaTareas);
    }
  };

  return (
    <div className="space-y-6">
      {/* Barra de Controles */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-900/40 p-4 rounded-2xl border border-slate-800 backdrop-blur-xl">
        <div className="flex items-center gap-2 bg-slate-950 p-1.5 rounded-xl border border-slate-850">
          <button
            onClick={() => setFiltro("todas")}
            className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all cursor-pointer ${
              filtro === "todas"
                ? "bg-secondary text-slate-950 shadow-lg shadow-secondary/15"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Todas las Tareas
          </button>
          <button
            onClick={() => setFiltro("mias")}
            className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all cursor-pointer ${
              filtro === "mias"
                ? "bg-secondary text-slate-950 shadow-lg shadow-secondary/15"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Mis Tareas
          </button>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
          <Link
            href="/empresa/webapp/taskboard/historial"
            className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-sm font-medium transition-all flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-sm">history</span>
            <span>Ver Historial</span>
          </Link>
          <button
            onClick={() => setModalAbierto(true)}
            className="px-5 py-2.5 bg-secondary hover:bg-secondary-fixed text-slate-950 rounded-xl text-sm font-bold shadow-lg shadow-secondary/10 flex items-center gap-2 cursor-pointer transition-all hover:scale-[1.02]"
          >
            <span className="material-symbols-outlined text-md font-bold">add</span>
            <span>Nueva Tarea</span>
          </button>
        </div>
      </div>

      {/* Tablero Kanban */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {(["Pendientes", "En proceso", "Terminado"] as const).map((columna) => {
          const listaTareas = tareasFiltradas[columna];
          const isOver = dragOverCol === columna;

          return (
            <div
              key={columna}
              onDragOver={(e) => handleDragOver(e, columna)}
              onDragLeave={() => setDragOverCol(null)}
              onDrop={(e) => handleDrop(e, columna)}
              className={`flex flex-col min-h-[600px] bg-slate-900/20 backdrop-blur-xl border rounded-3xl p-5 transition-all duration-200 ${
                isOver ? "border-secondary/40 bg-slate-900/40" : "border-slate-800/80"
              }`}
            >
              {/* Header de columna */}
              <div className="flex justify-between items-center mb-5 pb-3 border-b border-slate-850">
                <div className="flex items-center gap-3">
                  <span
                    className={`w-2 h-2 rounded-full ${
                      columna === "Pendientes"
                        ? "bg-slate-400"
                        : columna === "En proceso"
                        ? "bg-amber-400"
                        : "bg-emerald-400"
                    }`}
                  />
                  <h3 className="font-bold text-slate-200">{columna}</h3>
                </div>
                <span className="px-2.5 py-0.5 bg-slate-950 border border-slate-850 rounded-full text-xs font-semibold text-slate-400">
                  {listaTareas.length}
                  {columna === "Terminado" && " (Max 20)"}
                </span>
              </div>

              {/* Lista de tarjetas */}
              <div className="flex-1 flex flex-col gap-4 overflow-y-auto max-h-[650px] pr-1">
                {listaTareas.length === 0 ? (
                  <div className="flex-1 flex flex-col items-center justify-center border border-dashed border-slate-850 rounded-2xl p-8 text-center text-slate-500">
                    <span className="material-symbols-outlined text-3xl mb-2 text-slate-600">
                      inbox
                    </span>
                    <p className="text-xs">No hay tareas en esta columna</p>
                  </div>
                ) : (
                  listaTareas.map((tarea) => {
                    const isDragged = draggedTaskId === tarea.id;
                    return (
                      <div
                        key={tarea.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, tarea.id)}
                        onDragEnd={handleDragEnd}
                        className={`group bg-slate-950 border p-4.5 rounded-2xl flex flex-col gap-3 transition-all duration-200 cursor-grab active:cursor-grabbing hover:border-slate-700 hover:shadow-lg ${
                          isDragged ? "opacity-40 border-dashed border-secondary" : "border-slate-850"
                        }`}
                      >
                        {/* Título y eliminación */}
                        <div className="flex justify-between items-start gap-2">
                          <h4 className="font-bold text-slate-100 text-sm leading-snug group-hover:text-white transition-colors">
                            {tarea.titulo}
                          </h4>
                          <button
                            onClick={() => handleEliminarTarea(tarea.id)}
                            className="opacity-0 group-hover:opacity-100 hover:bg-red-500/10 text-slate-500 hover:text-red-400 p-1 rounded-lg transition-all cursor-pointer"
                            title="Eliminar tarea"
                          >
                            <span className="material-symbols-outlined text-lg">delete</span>
                          </button>
                        </div>

                        {/* Descripción */}
                        {tarea.descripcion && (
                          <p className="text-xs text-slate-400 leading-relaxed whitespace-pre-line line-clamp-3">
                            {tarea.descripcion}
                          </p>
                        )}

                        {/* Pie de la tarjeta */}
                        <div className="mt-2 flex flex-wrap items-center justify-between gap-2 border-t border-slate-900 pt-3 text-[11px] text-slate-400">
                          {/* Creador */}
                          <div className="flex items-center gap-1.5" title={`Creado por: ${tarea.creador?.username || "Sistema"}`}>
                            <span className="material-symbols-outlined text-[14px] text-slate-650">edit_square</span>
                            <span className="truncate max-w-[80px]">
                              {tarea.creador?.username || "Sistema"}
                            </span>
                          </div>

                          {/* Asignado */}
                          <div className="flex items-center gap-1.5 bg-slate-900 px-2 py-0.5 rounded-full border border-slate-850" title={`Asignado a: ${tarea.asignado?.username || "Nadie"}`}>
                            <span className="material-symbols-outlined text-[13px] text-secondary">person</span>
                            <span className="font-semibold text-slate-300 truncate max-w-[80px]">
                              {tarea.asignado?.username || "Nadie"}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal Flotante de Creación */}
      {modalAbierto && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            {/* Cabecera */}
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

            {/* Formulario */}
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
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-secondary transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400">Descripción (Opcional)</label>
                <textarea
                  placeholder="Detalles sobre lo que se necesita hacer..."
                  value={nuevaDesc}
                  onChange={(e) => setNuevaDesc(e.target.value)}
                  rows={3}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-secondary transition-all resize-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400">Asignar a</label>
                <select
                  value={nuevoAsignado}
                  onChange={(e) => setNuevoAsignado(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-secondary transition-all"
                >
                  {perfiles.map((perfil) => (
                    <option key={perfil.id} value={perfil.id}>
                      {perfil.username} ({perfil.role})
                    </option>
                  ))}
                </select>
              </div>

              {/* Botones de acción */}
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
    </div>
  );
}
