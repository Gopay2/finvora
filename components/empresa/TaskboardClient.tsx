"use client";

import React, { useState, useEffect, useTransition, useMemo } from "react";
import Link from "next/link";
import { createClient } from "@/utils/supabase/client";
import { crearTarea, actualizarEstadoTarea, eliminarTarea } from "@/app/empresa/webapp/taskboard/actions";
import type { Perfil, Tarea, EstadoTarea } from "@/types/taskboard";
import { TaskboardColumn } from "./taskboard/TaskboardColumn";
import { TaskboardModals } from "./taskboard/TaskboardModals";
import type { RealtimeChannel, RealtimePostgresChangesPayload } from "@supabase/supabase-js";

export type { Perfil, Tarea, EstadoTarea };

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
  const [tareas, setTareas] = useState<Tarea[]>(tareasIniciales);
  const [filtro, setFiltro] = useState<"todas" | "mias">("todas");
  const [modalAbierto, setModalAbierto] = useState(false);
  const [tareaDetalle, setTareaDetalle] = useState<Tarea | null>(null);
  const [isPending, startTransition] = useTransition();

  // Estados para arrastre visual
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [dragOverCol, setDragOverCol] = useState<string | null>(null);

  // Estado para eliminación de tarea
  const [tareaAEliminar, setTareaAEliminar] = useState<string | null>(null);

  // Formulario
  const [nuevoTitulo, setNuevoTitulo] = useState("");
  const [nuevaDesc, setNuevaDesc] = useState("");
  const [nuevoAsignado, setNuevoAsignado] = useState(currentUser.id || "");
  const [errorForm, setErrorForm] = useState("");

  // Sincronizar estado local si las tareas iniciales cambian desde el servidor
  useEffect(() => {
    setTareas(tareasIniciales);
  }, [tareasIniciales]);

  // Capturar y silenciar errores asíncronos internos de la librería supabase-js (ej. normalizeChannelError)
  useEffect(() => {
    const catchSupabaseCrash = (errorObj: unknown) => {
      const err = errorObj as { message?: string; stack?: string; reason?: { stack?: string } } | null;
      const errorStr = String(err?.message || errorObj || "");
      const stackStr = String(err?.stack || err?.reason?.stack || "");
      return (
        errorStr.includes("normalizeChannelError") || 
        errorStr.includes("realtime-js") ||
        errorStr.includes("phoenix") ||
        errorStr.includes("transport failure") ||
        errorStr.includes("channel error") ||
        stackStr.includes("normalizeChannelError") ||
        stackStr.includes("realtime-js") ||
        stackStr.includes("phoenix") ||
        stackStr.includes("transport failure") ||
        stackStr.includes("channel error")
      );
    };

    const handleGlobalError = (event: ErrorEvent) => {
      if (catchSupabaseCrash(event.error || event.message)) {
        event.preventDefault();
        console.warn("[Supabase Realtime] Error asíncrono de red capturado y silenciado:", event.error || event.message);
      }
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      if (catchSupabaseCrash(event.reason)) {
        event.preventDefault();
        console.warn("[Supabase Realtime] Rejection de red capturada y silenciada:", event.reason);
      }
    };

    window.addEventListener("error", handleGlobalError);
    window.addEventListener("unhandledrejection", handleUnhandledRejection);
    return () => {
      window.removeEventListener("error", handleGlobalError);
      window.removeEventListener("unhandledrejection", handleUnhandledRejection);
    };
  }, []);

  const perfilesRef = React.useRef(perfiles);
  useEffect(() => {
    perfilesRef.current = perfiles;
  }, [perfiles]);

  // Configuración de Supabase Realtime con desconexión y reconexión automática
  useEffect(() => {
    const supabase = createClient();
    if (!supabase) return;

    let channel: RealtimeChannel | null = null;

    const setupRealtime = async () => {
      if (channel) {
        try {
          await supabase.removeChannel(channel);
        } catch {}
        channel = null;
      }

      await supabase.auth.getSession();

      try {
        const channelName = `taskboard_realtime_${Date.now()}`;
        channel = supabase
          .channel(channelName)
          .on(
            "postgres_changes",
            { event: "*", schema: "public", table: "taskboard" },
            async (payload: RealtimePostgresChangesPayload<Record<string, unknown>>) => {
              if (payload.eventType === "INSERT") {
                const newRow = payload.new as unknown as Tarea;
                const creadorPerfil = perfilesRef.current.find((p) => p.id === newRow.creado_por);
                const asignadoPerfil = perfilesRef.current.find((p) => p.id === newRow.asignado_a);

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
                const updatedRow = payload.new as unknown as Tarea;
                const creadorPerfil = perfilesRef.current.find((p) => p.id === updatedRow.creado_por);
                const asignadoPerfil = perfilesRef.current.find((p) => p.id === updatedRow.asignado_a);

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
                const oldRow = payload.old as unknown as Partial<Tarea>;
                setTareas((prev) => prev.filter((t) => t.id !== oldRow.id));
              }
            }
          )
          .subscribe((status: string, err?: Error) => {
            if (err) {
              console.error("Realtime subscription error:", err);
            }
          });
      } catch (err) {
        console.warn("Supabase Realtime subscription block failed:", err);
      }
    };

    setupRealtime();

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        setupRealtime();
      } else if (document.visibilityState === "hidden") {
        if (channel) {
          try {
            supabase.removeChannel(channel);
            channel = null;
          } catch {}
        }
      }
    };

    window.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.removeEventListener("visibilitychange", handleVisibilityChange);
      if (channel) {
        try {
          supabase.removeChannel(channel);
        } catch {}
      }
    };
  }, []);

  const tareasFiltradas = useMemo(() => {
    let list = tareas;
    if (filtro === "mias") {
      list = list.filter((t) => t.asignado_a === currentUser.id);
    }

    const pendientes = list.filter((t) => t.estado === "Pendientes");
    const enProceso = list.filter((t) => t.estado === "En proceso");

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

  const boardRef = React.useRef<HTMLDivElement>(null);
  const scrollIntervalRef = React.useRef<NodeJS.Timeout | null>(null);

  const startAutoScroll = (direction: "left" | "right") => {
    if (scrollIntervalRef.current) return;
    scrollIntervalRef.current = setInterval(() => {
      if (boardRef.current) {
        const scrollAmount = direction === "left" ? -12 : 12;
        boardRef.current.scrollLeft += scrollAmount;
      }
    }, 16);
  };

  const stopAutoScroll = () => {
    if (scrollIntervalRef.current) {
      clearInterval(scrollIntervalRef.current);
      scrollIntervalRef.current = null;
    }
  };

  useEffect(() => {
    return () => stopAutoScroll();
  }, []);

  useEffect(() => {
    if (!draggedTaskId) {
      stopAutoScroll();
    }
  }, [draggedTaskId]);

  const handleBoardDragOver = (e: React.DragEvent) => {
    if (!draggedTaskId) return;

    const x = e.clientX;
    const width = window.innerWidth;
    const threshold = 70;

    if (x < threshold) {
      startAutoScroll("left");
    } else if (x > width - threshold) {
      startAutoScroll("right");
    } else {
      stopAutoScroll();
    }
  };

  const handleDragStart = (e: React.DragEvent, id: string) => {
    e.dataTransfer.setData("text/plain", id);
    setDraggedTaskId(id);
  };

  const handleDragEnd = () => {
    setDraggedTaskId(null);
    setDragOverCol(null);
    stopAutoScroll();
  };

  const handleDragOver = (e: React.DragEvent, col: string) => {
    e.preventDefault();
    if (dragOverCol !== col) {
      setDragOverCol(col);
    }
  };

  const handleDrop = async (e: React.DragEvent, columnaDestino: EstadoTarea) => {
    e.preventDefault();
    stopAutoScroll();
    const id = e.dataTransfer.getData("text/plain") || draggedTaskId || "";
    setDragOverCol(null);
    setDraggedTaskId(null);

    const tarea = tareas.find((t) => t.id === id);
    if (!tarea || tarea.estado === columnaDestino) return;

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
      setTareas(copiaTareas);
    }
  };

  const handleCrearTarea = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nuevoTitulo.trim()) {
      setErrorForm("El título es requerido.");
      return;
    }

    startTransition(async () => {
      try {
        const result = await crearTarea({
          titulo: nuevoTitulo,
          descripcion: nuevaDesc,
          asignado_a: nuevoAsignado,
        });

        if (result) {
          const creadorPerfil = perfiles.find((p) => p.id === result.creado_por);
          const asignadoPerfil = perfiles.find((p) => p.id === result.asignado_a);

          const nuevaTarea: Tarea = {
            id: result.id,
            titulo: result.titulo,
            descripcion: result.descripcion,
            estado: result.estado as EstadoTarea,
            creado_por: result.creado_por,
            asignado_a: result.asignado_a,
            created_at: result.created_at,
            updated_at: result.updated_at,
            creador: creadorPerfil ? { username: creadorPerfil.username } : null,
            asignado: asignadoPerfil ? { username: asignadoPerfil.username } : null,
          };

          setTareas((prev) => {
            if (prev.some((t) => t.id === nuevaTarea.id)) return prev;
            return [...prev, nuevaTarea];
          });
        }

        setNuevoTitulo("");
        setNuevaDesc("");
        setNuevoAsignado(currentUser.id || "");
        setErrorForm("");
        setModalAbierto(false);
      } catch (err: unknown) {
        const error = err as { message?: string };
        setErrorForm(error.message || "Error al crear la tarea.");
      }
    });
  };

  const handleEliminarTarea = (id: string) => {
    setTareaAEliminar(id);
  };

  const confirmarEliminarTarea = async () => {
    if (!tareaAEliminar) return;
    const id = tareaAEliminar;
    setTareaAEliminar(null);

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
        <div className="flex items-center gap-2 bg-slate-950 p-1 md:p-1.5 rounded-lg md:rounded-xl border border-slate-850 mx-0">
          <button
            onClick={() => setFiltro("todas")}
            className={`px-4 py-2 md:px-4 md:py-1.5 rounded-lg md:rounded-lg text-xs md:text-sm font-semibold transition-all cursor-pointer ${
              filtro === "todas"
                ? "bg-secondary text-slate-950 shadow-lg shadow-secondary/15"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Todas las Tareas
          </button>
          <button
            onClick={() => setFiltro("mias")}
            className={`px-4 py-2 md:px-4 md:py-1.5 rounded-lg md:rounded-lg text-xs md:text-sm font-semibold transition-all cursor-pointer ${
              filtro === "mias"
                ? "bg-secondary text-slate-950 shadow-lg shadow-secondary/15"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Mis Tareas
          </button>
        </div>

        <div className="flex items-center justify-between sm:justify-end gap-2 md:gap-3 w-full sm:w-auto">
          <Link
            href="/empresa/webapp/taskboard/historial"
            className="px-3 py-2 md:px-4 md:py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg md:rounded-xl text-xs md:text-sm font-medium transition-all flex items-center gap-1.5 md:gap-2"
          >
            <span className="material-symbols-outlined text-xs md:text-sm">history</span>
            <span>Ver Historial</span>
          </Link>
          <button
            onClick={() => setModalAbierto(true)}
            className="px-3.5 py-2 md:px-5 md:py-2.5 bg-secondary hover:bg-secondary-fixed text-slate-950 rounded-lg md:rounded-xl text-xs md:text-sm font-bold shadow-lg shadow-secondary/10 flex items-center gap-1.5 md:gap-2 cursor-pointer transition-all hover:scale-[1.02]"
          >
            <span className="material-symbols-outlined text-sm md:text-md font-bold">add</span>
            <span>Nueva Tarea</span>
          </button>
        </div>
      </div>

      {/* Tablero Kanban */}
      <div
        ref={boardRef}
        onDragOver={handleBoardDragOver}
        className={`flex lg:grid lg:grid-cols-3 gap-2 lg:gap-6 overflow-x-auto pb-4 custom-scrollbar ${
          draggedTaskId ? "" : "snap-x snap-mandatory scroll-smooth"
        }`}
      >
        {(["Pendientes", "En proceso", "Terminado"] as const).map((columna) => (
          <TaskboardColumn
            key={columna}
            columna={columna}
            listaTareas={tareasFiltradas[columna]}
            isOver={dragOverCol === columna}
            draggedTaskId={draggedTaskId}
            onDragOver={handleDragOver}
            onDragLeave={() => setDragOverCol(null)}
            onDrop={handleDrop}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            onEliminarTarea={handleEliminarTarea}
            onVerDetalles={setTareaDetalle}
          />
        ))}
      </div>

      {/* Modales Flotantes */}
      <TaskboardModals
        modalAbierto={modalAbierto}
        setModalAbierto={setModalAbierto}
        nuevoTitulo={nuevoTitulo}
        setNuevoTitulo={setNuevoTitulo}
        nuevaDesc={nuevaDesc}
        setNuevaDesc={setNuevaDesc}
        nuevoAsignado={nuevoAsignado}
        setNuevoAsignado={setNuevoAsignado}
        errorForm={errorForm}
        isPending={isPending}
        perfiles={perfiles}
        handleCrearTarea={handleCrearTarea}
        tareaDetalle={tareaDetalle}
        setTareaDetalle={setTareaDetalle}
        tareaAEliminar={tareaAEliminar}
        setTareaAEliminar={setTareaAEliminar}
        confirmarEliminarTarea={confirmarEliminarTarea}
      />
    </div>
  );
}
