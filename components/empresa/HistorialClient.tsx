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

  // Acción de Reabrir Tarea
  const handleReabrir = async (id: string) => {
    if (!confirm("¿Deseas reabrir esta tarea y moverla a 'Pendientes'?")) return;

    // Optimista
    setTareas((prev) => prev.filter((t) => t.id !== id));

    try {
      await actualizarEstadoTarea(id, "Pendientes");
      router.refresh();
    } catch (error) {
      console.error("Error al reabrir tarea:", error);
      alert("Ocurrió un error al reabrir la tarea.");
      // Recargar la página si falla para asegurar consistencia
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
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-11 pr-4 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-secondary transition-all"
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
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-11 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-secondary transition-all"
            >
              <option value="">Todos los usuarios</option>
              {perfiles.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.username}
                </option>
              ))}
            </select>
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
                      <div className="flex items-center justify-center gap-2">
                        {/* Reabrir */}
                        <button
                          onClick={() => handleReabrir(tarea.id)}
                          className="px-3 py-1.5 bg-slate-850 hover:bg-slate-800 text-secondary border border-slate-800 hover:border-secondary/20 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer"
                          title="Reabrir y mover a Pendientes"
                        >
                          <span className="material-symbols-outlined text-sm">settings_backup_restore</span>
                          <span>Reabrir</span>
                        </button>

                        {/* Eliminar */}
                        <button
                          onClick={() => handleEliminar(tarea.id)}
                          className="p-1.5 hover:bg-red-500/10 text-slate-500 hover:text-red-400 rounded-lg transition-all cursor-pointer"
                          title="Eliminar tarea"
                        >
                          <span className="material-symbols-outlined text-sm">delete</span>
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
                    className={`w-7 h-7 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      paginaActual === pag
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
    </div>
  );
}
