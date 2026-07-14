"use client";

import React, { useState, useMemo, useTransition } from "react";
import { useRouter } from "next/navigation";
import { actualizarEstadoTarea, eliminarTarea } from "@/app/empresa/webapp/taskboard/actions";

interface TareaTerminada {
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

interface Perfil {
  id: string;
  username: string;
  role: string;
}

interface HistorialClientProps {
  tareasTerminadas: TareaTerminada[];
  perfiles: Perfil[];
}

export default function HistorialClient({
  tareasTerminadas,
  perfiles,
}: HistorialClientProps) {
  const router = useRouter();
  const [tareas, setTareas] = useState<TareaTerminada[]>(tareasTerminadas);
  const [buscar, setBuscar] = useState("");
  const [filtroUsuario, setFiltroUsuario] = useState("");
  const [isPending, startTransition] = useTransition();

  // Estados para rehacer tarea con modal
  const [tareaARehacer, setTareaARehacer] = useState<TareaTerminada | null>(null);
  const [nuevaDescripcionRehacer, setNuevaDescripcionRehacer] = useState("");

  // Paginación
  const [paginaActual, setPaginaActual] = useState(1);
  const itemsPorPagina = 15;

  // Filtrar en el cliente
  const tareasFiltradas = useMemo(() => {
    let list = tareas;

    // Filtro por usuario asignado
    if (filtroUsuario) {
      list = list.filter((t) => t.asignado_a === filtroUsuario);
    }

    // Filtro por término de búsqueda (título o descripción)
    if (buscar.trim()) {
      const q = buscar.toLowerCase().trim();
      list = list.filter(
        (t) =>
          t.titulo.toLowerCase().includes(q) ||
          (t.descripcion && t.descripcion.toLowerCase().includes(q))
      );
    }

    return list;
  }, [tareas, filtroUsuario, buscar]);

  // Cálculo de paginación
  const totalPaginas = Math.ceil(tareasFiltradas.length / itemsPorPagina);
  const tareasPaginadas = useMemo(() => {
    const inicio = (paginaActual - 1) * itemsPorPagina;
    return tareasFiltradas.slice(inicio, inicio + itemsPorPagina);
  }, [tareasFiltradas, paginaActual]);

  const handleCambiarPagina = (nuevaPagina: number) => {
    if (nuevaPagina >= 1 && nuevaPagina <= totalPaginas) {
      setPaginaActual(nuevaPagina);
    }
  };

  // Acción de Rehacer Tarea (Click inicial)
  const handleRehacerClick = (tarea: TareaTerminada) => {
    setTareaARehacer(tarea);
    setNuevaDescripcionRehacer(tarea.descripcion || "");
  };

  const handleConfirmarRehacer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tareaARehacer) return;
    const id = tareaARehacer.id;
    const desc = nuevaDescripcionRehacer;
    setTareaARehacer(null);

    // Optimista
    setTareas((prev) => prev.filter((t) => t.id !== id));

    try {
      await actualizarEstadoTarea(id, "Pendientes", desc);
      router.refresh();
    } catch (error) {
      console.error("Error al rehacer tarea:", error);
      alert("Ocurrió un error al rehacer la tarea.");
      router.refresh();
    }
  };

  // Acción de Eliminar Tarea
  const handleEliminar = async (id: string) => {
    if (!confirm("¿Estás seguro de que quieres eliminar esta tarea permanentemente?")) return;

    // Optimista
    setTareas((prev) => prev.filter((t) => t.id !== id));

    try {
      await eliminarTarea(id);
      router.refresh();
    } catch (error) {
      console.error("Error al eliminar tarea:", error);
      alert("Ocurrió un error al eliminar la tarea.");
      router.refresh();
    }
  };

  // Formateador de fecha
  const formatearFecha = (fechaStr: string) => {
    try {
      const fecha = new Date(fechaStr);
      return new Intl.DateTimeFormat("es-MX", {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(fecha);
    } catch {
      return fechaStr;
    }
  };

  return (
    <div className="space-y-6">
      {/* Controles de Filtros y Búsqueda */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-900/40 p-5 rounded-3xl border border-slate-800 backdrop-blur-xl">
        {/* Buscador */}
        <div className="space-y-1.5 col-span-1 md:col-span-2">
          <label className="text-xs font-semibold text-slate-400">Buscar tarea</label>
          <div className="relative">
            <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-550 text-xl">
              search
            </span>
            <input
              type="text"
              placeholder="Buscar por título o descripción..."
              value={buscar}
              onChange={(e) => {
                setBuscar(e.target.value);
                setPaginaActual(1); // Resetear página al buscar
              }}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-11 pr-4 py-2.5 text-base md:text-sm text-white placeholder-slate-600 focus:outline-none focus:border-secondary transition-all"
            />
          </div>
        </div>

        {/* Selector de Usuario */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-400">Filtrar por Asignado</label>
          <div className="relative">
            <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-550 text-xl">
              filter_alt
            </span>
            <select
              value={filtroUsuario}
              onChange={(e) => {
                setFiltroUsuario(e.target.value);
                setPaginaActual(1); // Resetear página al cambiar filtro
              }}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-11 pr-10 py-2.5 text-base md:text-sm text-white focus:outline-none focus:border-secondary transition-all appearance-none"
            >
              <option value="">Todos los usuarios</option>
              {perfiles.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.username}
                </option>
              ))}
            </select>
            <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500 text-base">
              keyboard_arrow_down
            </span>
          </div>
        </div>
      </div>

      {/* Listado / Tabla */}
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
                        {/* Rehacer */}
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

      {/* Modal de Rehacer Tarea (Editar descripción) */}
      {tareaARehacer && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            {/* Cabecera */}
            <div className="flex justify-between items-center p-6 border-b border-slate-850">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <span className="material-symbols-outlined text-secondary">settings_backup_restore</span>
                Rehacer Tarea
              </h3>
              <button
                onClick={() => setTareaARehacer(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-all cursor-pointer"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {/* Formulario */}
            <form onSubmit={handleConfirmarRehacer} className="p-6 space-y-4">
              <div className="space-y-1.5 text-left">
                <div className="text-sm font-semibold text-slate-200">
                  Tarea: <span className="text-slate-400 font-normal">{tareaARehacer.titulo}</span>
                </div>
              </div>

              <div className="space-y-1.5 text-left">
                <label className="text-xs font-semibold text-slate-400">Editar Descripción (Opcional)</label>
                <textarea
                  placeholder="Detalles sobre lo que se necesita hacer..."
                  value={nuevaDescripcionRehacer}
                  onChange={(e) => setNuevaDescripcionRehacer(e.target.value)}
                  rows={4}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-base md:text-sm text-white placeholder-slate-600 focus:outline-none focus:border-secondary transition-all resize-none custom-scrollbar"
                />
              </div>

              {/* Botones de acción */}
              <div className="flex gap-3 pt-3 border-t border-slate-850 mt-6">
                <button
                  type="button"
                  onClick={() => setTareaARehacer(null)}
                  className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-sm font-semibold transition-all cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-secondary hover:bg-secondary-fixed text-slate-950 rounded-xl text-sm font-bold shadow-lg shadow-secondary/10 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  Rehacer Tarea
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
