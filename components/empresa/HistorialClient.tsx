"use client";

import React, { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { actualizarEstadoTarea, eliminarTarea } from "@/app/empresa/webapp/taskboard/actions";
import { HistorialFilters } from "./taskboard/HistorialFilters";
import { HistorialTable, type TareaTerminada } from "./taskboard/HistorialTable";
import { HistorialRehacerModal } from "./taskboard/HistorialRehacerModal";

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

  // Estados para rehacer tarea con modal
  const [tareaARehacer, setTareaARehacer] = useState<TareaTerminada | null>(null);
  const [nuevaDescripcionRehacer, setNuevaDescripcionRehacer] = useState("");

  // Paginación
  const [paginaActual, setPaginaActual] = useState(1);
  const itemsPorPagina = 15;

  // ─── LÓGICA DE FILTRADO Y BÚSQUEDA ───

  /** Filtra las tareas según el usuario asignado seleccionado y el término de búsqueda */
  const tareasFiltradas = useMemo(() => {
    let list = tareas;

    if (filtroUsuario) {
      list = list.filter((tarea) => tarea.asignado_a === filtroUsuario);
    }

    if (buscar.trim()) {
      const q = buscar.toLowerCase().trim();
      list = list.filter(
        (tarea) =>
          tarea.titulo.toLowerCase().includes(q) ||
          (tarea.descripcion && tarea.descripcion.toLowerCase().includes(q))
      );
    }

    return list;
  }, [tareas, filtroUsuario, buscar]);

  // ─── PAGINACIÓN EN CLIENTE ───
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

    setTareas((prev) => prev.filter((tarea) => tarea.id !== id));

    try {
      await actualizarEstadoTarea(id, "Pendientes", desc);
      router.refresh();
    } catch (error) {
      console.error("Error al rehacer tarea:", error);
      alert("Ocurrió un error al rehacer la tarea.");
      router.refresh();
    }
  };

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
      <HistorialFilters
        buscar={buscar}
        setBuscar={setBuscar}
        filtroUsuario={filtroUsuario}
        setFiltroUsuario={setFiltroUsuario}
        setPaginaActual={setPaginaActual}
        perfiles={perfiles}
      />

      <HistorialTable
        tareasPaginadas={tareasPaginadas}
        tareasFiltradas={tareasFiltradas}
        paginaActual={paginaActual}
        totalPaginas={totalPaginas}
        itemsPorPagina={itemsPorPagina}
        handleCambiarPagina={handleCambiarPagina}
        handleRehacerClick={handleRehacerClick}
        formatearFecha={formatearFecha}
      />

      <HistorialRehacerModal
        tareaARehacer={tareaARehacer}
        setTareaARehacer={setTareaARehacer}
        nuevaDescripcionRehacer={nuevaDescripcionRehacer}
        setNuevaDescripcionRehacer={setNuevaDescripcionRehacer}
        handleConfirmarRehacer={handleConfirmarRehacer}
      />
    </div>
  );
}
