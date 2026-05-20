'use client';

import React, { useState, useTransition } from "react";
import { crearZona, eliminarZona } from "@/app/empresa/webapp/repartos/repartos-actions";

interface Repartidor {
  id: string;
  nombre: string;
}

interface Zona {
  id: string;
  repartidor_id: string;
  nombre_zona: string;
  descripcion: string;
  created_at: string;
  repartidores?: {
    nombre: string;
  };
}

interface Props {
  initialZonas: Zona[];
  repartidores: Repartidor[];
}

export default function ZonasConfig({ initialZonas, repartidores }: Props) {
  const [zonas, setZonas] = useState<Zona[]>(initialZonas);
  const [repartidorId, setRepartidorId] = useState("");
  const [nombreZona, setNombreZona] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // Estados para el Modal de Confirmación personalizado
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [deleteConfirmName, setDeleteConfirmName] = useState<string | null>(null);

  // Actualizar lista local cuando cambie la inicial
  React.useEffect(() => {
    setZonas(initialZonas);
  }, [initialZonas]);

  const handleCrear = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!repartidorId || !nombreZona.trim()) return;

    setLoading(true);
    setError(null);
    try {
      const res = await crearZona({
        repartidor_id: repartidorId,
        nombre_zona: nombreZona.trim(),
        descripcion: descripcion.trim() || undefined
      });

      if (res.success) {
        setRepartidorId("");
        setNombreZona("");
        setDescripcion("");
        startTransition(() => {
          // Gatilla revalidatePath en el servidor
        });
      } else {
        setError(res.error || "Error al crear zona");
      }
    } catch (err: any) {
      setError(err.message || "Error de red");
    } finally {
      setLoading(false);
    }
  };

  const requestEliminar = (id: string, nombreZ: string) => {
    setDeleteConfirmId(id);
    setDeleteConfirmName(nombreZ);
  };

  const executeEliminar = async () => {
    if (!deleteConfirmId) return;

    const idToDelete = deleteConfirmId;
    setDeleteConfirmId(null);
    setDeleteConfirmName(null);
    setError(null);

    const oldList = [...zonas];
    setZonas(prev => prev.filter(z => z.id !== idToDelete));

    try {
      const res = await eliminarZona(idToDelete);
      if (!res.success) {
        setZonas(oldList);
        setError(res.error || "Error al eliminar zona");
      }
    } catch (err: any) {
      setZonas(oldList);
      setError(err.message || "Error de red");
    }
  };



  return (
    <div className="space-y-8 relative">
      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-2xl flex items-center gap-2 animate-pulse">
          <span className="material-symbols-outlined text-lg">error</span>
          {error}
        </div>
      )}

      {/* Grid: Formulario Izquierda, Búsqueda Derecha */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Formulario */}
        <div className="bg-slate-900/40 backdrop-blur-xl border border-slate-800 p-6 md:p-8 rounded-3xl lg:col-span-1 h-fit">
          <h2 className="text-lg font-bold text-white mb-4 ml-1 flex items-center gap-2">
            <span className="material-symbols-outlined text-secondary text-lg">add_location_alt</span>
            Nueva Zona de Reparto
          </h2>
          <form onSubmit={handleCrear} className="space-y-4">
            {/* Repartidor */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 ml-1">
                Repartidor Asignado
              </label>
              <select
                value={repartidorId}
                onChange={(e) => setRepartidorId(e.target.value)}
                required
                className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 px-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-secondary/50 focus:border-secondary transition-all appearance-none"
                style={{ colorScheme: 'dark' }}
              >
                <option value="">Seleccionar Repartidor</option>
                {repartidores.map(r => (
                  <option key={r.id} value={r.id}>
                    {r.nombre}
                  </option>
                ))}
              </select>
            </div>

            {/* Nombre Zona */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 ml-1">
                Nombre de Zona / Referencia
              </label>
              <input
                type="text"
                placeholder="Ej: Zona Norte, Centro, Zona A..."
                value={nombreZona}
                onChange={(e) => setNombreZona(e.target.value)}
                required
                className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 px-4 text-sm text-white placeholder:text-slate-700 focus:outline-none focus:ring-2 focus:ring-secondary/50 focus:border-secondary transition-all"
              />
            </div>

            {/* Descripción */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 ml-1">
                Descripción / Detalles
              </label>
              <input
                type="text"
                placeholder="Ej: Turno Noche"
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 px-4 text-sm text-white placeholder:text-slate-700 focus:outline-none focus:ring-2 focus:ring-secondary/50 focus:border-secondary transition-all"
              />
            </div>

            <button
              type="submit"
              disabled={loading || !repartidorId || !nombreZona.trim()}
              className="w-full py-3 bg-secondary text-slate-950 font-bold rounded-xl hover:bg-secondary/90 transition-all text-sm cursor-pointer shadow-[0_0_15px_rgba(16,185,129,0.15)] disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-slate-950/30 border-t-slate-950 rounded-full animate-spin" />
                  Guardando...
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-lg">save</span>
                  Confirmar Zona
                </>
              )}
            </button>
          </form>
        </div>

        {/* Listado */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-white ml-2 flex items-center gap-2">
              <span className="material-symbols-outlined text-slate-400 text-lg">map</span>
              Zonas de Reparto Registradas
            </h2>
          </div>

          <div className="bg-slate-900/20 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full text-center border-collapse">
                <thead>
                  <tr className="bg-slate-950/40">
                    <th className="px-6 py-4 text-slate-500 text-[10px] uppercase font-bold border-b border-slate-800 tracking-widest text-center">
                      Zona / Ref.
                    </th>
                    <th className="px-6 py-4 text-slate-500 text-[10px] uppercase font-bold border-b border-slate-800 tracking-widest text-center">
                      Detalles / Descripción
                    </th>
                    <th className="px-6 py-4 text-slate-500 text-[10px] uppercase font-bold border-b border-slate-800 tracking-widest text-center">
                      Repartidor Responsable
                    </th>
                    <th className="px-6 py-4 text-slate-500 text-[10px] uppercase font-bold border-b border-slate-800 tracking-widest text-center">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {zonas.length > 0 ? (
                    zonas.map((z) => (
                      <tr key={z.id} className="hover:bg-white/5 transition-colors group">
                        <td className="px-6 py-4 text-sm font-bold text-white border-b border-slate-800/50 text-center">
                          {z.nombre_zona}
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-400 border-b border-slate-800/50 text-center italic">
                          {z.descripcion || "Sin descripción"}
                        </td>
                        <td className="px-6 py-4 text-sm border-b border-slate-800/50 text-center">
                          <span className="px-2.5 py-1 rounded-lg text-xs font-bold uppercase bg-blue-500/10 text-blue-400 border border-blue-500/20">
                            {z.repartidores?.nombre || "No asignado"}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm border-b border-slate-800/50 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              type="button"
                              onClick={() => requestEliminar(z.id, z.nombre_zona)}
                              className="p-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 hover:border-red-500/30 transition-all flex items-center justify-center cursor-pointer"
                              title="Eliminar Zona"
                            >
                              <span className="material-symbols-outlined text-base">delete</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="px-6 py-12 text-center text-slate-500 italic">
                        No hay zonas de reparto registradas.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de Confirmación de Eliminación Premium */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          {/* Backdrop con Blur */}
          <div 
            className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm transition-opacity animate-in fade-in duration-300"
            onClick={() => {
              setDeleteConfirmId(null);
              setDeleteConfirmName(null);
            }}
          />
          {/* Modal Content */}
          <div className="relative bg-slate-900 border border-slate-800 p-6 md:p-8 rounded-3xl max-w-md w-full shadow-2xl animate-in fade-in zoom-in-95 duration-200 text-center space-y-6">
            <div className="mx-auto w-12 h-12 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400">
              <span className="material-symbols-outlined text-2xl">warning</span>
            </div>
            
            <div className="space-y-2">
              <h3 className="text-lg font-bold text-white">¿Eliminar Zona?</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                ¿Estás seguro de que deseas eliminar la zona <strong className="text-white">"{deleteConfirmName}"</strong>?<br/>
                Esta acción es irreversible y ya no estará disponible para la asignación de repartos.
              </p>
            </div>

            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setDeleteConfirmId(null);
                  setDeleteConfirmName(null);
                }}
                className="flex-1 py-3 bg-slate-800 hover:bg-slate-750 text-slate-300 font-bold rounded-xl transition-all text-xs cursor-pointer border border-slate-700"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={executeEliminar}
                className="flex-1 py-3 bg-red-500 hover:bg-red-600 text-white font-bold rounded-xl transition-all text-xs cursor-pointer shadow-[0_0_15px_rgba(239,68,68,0.2)]"
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
