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
  // para evitar que bloqueen la interfaz con pantallas rojas de Next.js en desarrollo si hay cortes de red o CSP viejos
  useEffect(() => {
    const catchSupabaseCrash = (errorObj: any) => {
      const errorStr = String(errorObj?.message || errorObj || "");
      const stackStr = String(errorObj?.stack || errorObj?.reason?.stack || "");
      const isSupabase = 
        errorStr.includes("normalizeChannelError") || 
        errorStr.includes("realtime-js") ||
        errorStr.includes("phoenix") ||
        errorStr.includes("transport failure") ||
        errorStr.includes("channel error") ||
        stackStr.includes("normalizeChannelError") ||
        stackStr.includes("realtime-js") ||
        stackStr.includes("phoenix") ||
        stackStr.includes("transport failure") ||
        stackStr.includes("channel error");

      return isSupabase;
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

  // Guardar perfiles en un ref para evitar recrear la suscripción de Realtime en cambios de prop o hidratación
  const perfilesRef = React.useRef(perfiles);
  useEffect(() => {
    perfilesRef.current = perfiles;
  }, [perfiles]);

  // Configuración de Supabase Realtime con desconexión y reconexión automática en background/foreground (móvil)
  useEffect(() => {
    const supabase = createClient();
    if (!supabase) return;

    let channel: any = null;

    const setupRealtime = async () => {
      // Limpiar canal anterior si existe
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
            async (payload: any) => {
              console.log("Realtime event payload received:", payload);
              if (payload.eventType === "INSERT") {
                const newRow = payload.new as any;
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
                const updatedRow = payload.new as any;
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
                const oldRow = payload.old as any;
                setTareas((prev) => prev.filter((t) => t.id !== oldRow.id));
              }
            }
          )
          .subscribe((status: string, err?: any) => {
            if (err) {
              console.error("Realtime subscription error:", err);
            } else {
              console.log(`Realtime subscription status for 'taskboard': ${status}`);
            }
          });
      } catch (err) {
        console.warn("Supabase Realtime subscription block failed:", err);
      }
    };

    // Inicializar conexión
    setupRealtime();

    // Evento para detectar cuando la pestaña entra/sale de segundo plano en celular
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        console.log("[Taskboard] Pestaña visible, restableciendo canal de tiempo real...");
        setupRealtime();
      } else if (document.visibilityState === "hidden") {
        console.log("[Taskboard] Pestaña minimizada, cerrando canal para evitar transport failure...");
        if (channel) {
          try {
            supabase.removeChannel(channel);
            channel = null;
          } catch (err) {
            console.warn("Error removing channel on hide:", err);
          }
        }
      }
    };

    window.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.removeEventListener("visibilitychange", handleVisibilityChange);
      if (channel) {
        try {
          supabase.removeChannel(channel);
        } catch (err) {
          console.warn("Error removing Supabase Realtime channel:", err);
        }
      }
    };
  }, []);

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

  // Refs y lógica para auto-scroll durante arrastre
  const boardRef = React.useRef<HTMLDivElement>(null);
  const scrollIntervalRef = React.useRef<NodeJS.Timeout | null>(null);

  const startAutoScroll = (direction: "left" | "right") => {
    if (scrollIntervalRef.current) return;
    scrollIntervalRef.current = setInterval(() => {
      if (boardRef.current) {
        const scrollAmount = direction === "left" ? -12 : 12;
        boardRef.current.scrollLeft += scrollAmount;
      }
    }, 16); // ~60 FPS
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
    const threshold = 70; // 70px de zona de scroll activo en bordes de pantalla

    if (x < threshold) {
      startAutoScroll("left");
    } else if (x > width - threshold) {
      startAutoScroll("right");
    } else {
      stopAutoScroll();
    }
  };

  // Handlers para Drag and Drop
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

  const handleDrop = async (e: React.DragEvent, columnaDestino: "Pendientes" | "En proceso" | "Terminado") => {
    e.preventDefault();
    stopAutoScroll();
    const id = e.dataTransfer.getData("text/plain") || draggedTaskId || "";
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
            estado: result.estado as any,
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

  // Handler para eliminar tarea (gatilla el modal personalizado)
  const handleEliminarTarea = (id: string) => {
    setTareaAEliminar(id);
  };

  // Confirmación real de la eliminación
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
        {(["Pendientes", "En proceso", "Terminado"] as const).map((columna) => {
          const listaTareas = tareasFiltradas[columna];
          const isOver = dragOverCol === columna;

          return (
            <div
              key={columna}
              onDragOver={(e) => handleDragOver(e, columna)}
              onDragLeave={() => setDragOverCol(null)}
              onDrop={(e) => handleDrop(e, columna)}
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
                    <span className="material-symbols-outlined text-lg lg:text-3xl mb-1 lg:mb-2 text-slate-650">
                      inbox
                    </span>
                    <p className="text-[9px] lg:text-xs">No hay tareas</p>
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
                              onClick={() => handleEliminarTarea(tarea.id)}
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
                            onClick={() => setTareaDetalle(tarea)}
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

      {/* Modal de Detalle Completo de Tarea */}
      {tareaDetalle && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            {/* Cabecera */}
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

            {/* Contenido */}
            <div className="p-6 space-y-6">
              {/* Descripción */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Descripción</h4>
                <div className="bg-slate-950/50 border border-slate-850/80 rounded-2xl p-4 min-h-[120px] max-h-[250px] overflow-y-auto overflow-x-hidden break-words text-slate-350 text-sm leading-relaxed whitespace-pre-line custom-scrollbar">
                  {tareaDetalle.descripcion || (
                    <span className="text-slate-650 italic">Esta tarea no tiene descripción.</span>
                  )}
                </div>
              </div>

              {/* Detalles / Metadata Grid */}
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

            {/* Botones de acción */}
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
    </div>
  );
}
