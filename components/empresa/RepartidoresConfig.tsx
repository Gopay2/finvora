'use client';

import React, { useState, useTransition } from "react";
import { crearRepartidor, toggleRepartidorActivo, eliminarRepartidor } from "@/app/empresa/webapp/repartos/repartos-actions";

interface Repartidor {
  id: string;
  nombre: string;
  activo: boolean;
  zona_horaria: string;
  created_at: string;
}

interface Props {
  initialRepartidores: Repartidor[];
}

export default function RepartidoresConfig({ initialRepartidores }: Props) {
  const [repartidores, setRepartidores] = useState<Repartidor[]>(initialRepartidores);
  const [nombre, setNombre] = useState("");
  const [zonaHoraria, setZonaHoraria] = useState("America/Mexico_City");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // Estados para el Modal de Confirmación personalizado
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [deleteConfirmName, setDeleteConfirmName] = useState<string | null>(null);

  // Actualizar lista local cuando cambie la inicial
  React.useEffect(() => {
    setRepartidores(initialRepartidores);
  }, [initialRepartidores]);

  const handleCrear = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim()) return;

    setLoading(true);
    setError(null);
    try {
      const res = await crearRepartidor(nombre.trim(), zonaHoraria);
      if (res.success) {
        setNombre("");
        setZonaHoraria("America/Mexico_City");
        startTransition(() => {
          // Esto gatilla revalidatePath en el servidor
        });
      } else {
        setError(res.error || "Error al crear repartidor");
      }
    } catch (err: any) {
      setError(err.message || "Error de red");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActivo = async (id: string, currentStatus: boolean) => {
    setError(null);
    // Optimistic update
    setRepartidores(prev =>
      prev.map(r => r.id === id ? { ...r, activo: !currentStatus } : r)
    );

    try {
      const res = await toggleRepartidorActivo(id, !currentStatus);
      if (!res.success) {
        // Revert on error
        setRepartidores(prev =>
          prev.map(r => r.id === id ? { ...r, activo: currentStatus } : r)
        );
        setError(res.error || "Error al cambiar estado");
      }
    } catch (err: any) {
      setRepartidores(prev =>
        prev.map(r => r.id === id ? { ...r, activo: currentStatus } : r)
      );
      setError(err.message || "Error de red");
    }
  };

  const requestEliminar = (id: string, nombreRep: string) => {
    setDeleteConfirmId(id);
    setDeleteConfirmName(nombreRep);
  };

  const executeEliminar = async () => {
    if (!deleteConfirmId) return;

    const idToDelete = deleteConfirmId;
    // Cerrar modal
    setDeleteConfirmId(null);
    setDeleteConfirmName(null);
    setError(null);

    const oldList = [...repartidores];
    setRepartidores(prev => prev.filter(r => r.id !== idToDelete));

    try {
      const res = await eliminarRepartidor(idToDelete);
      if (!res.success) {
        setRepartidores(oldList);
        setError(res.error || "Error al eliminar repartidor");
      }
    } catch (err: any) {
      setRepartidores(oldList);
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

      {/* Grid: Formulario Izquierda, Tabla Derecha */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Formulario */}
        <div className="bg-slate-900/40 backdrop-blur-xl border border-slate-800 p-6 md:p-8 rounded-3xl lg:col-span-1 h-fit">
          <h2 className="text-lg font-bold text-white mb-4 ml-1 flex items-center gap-2">
            <span className="material-symbols-outlined text-secondary text-lg">person_add</span>
            Nuevo Repartidor o Local
          </h2>
          <form onSubmit={handleCrear} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 ml-1">
                Nombre
              </label>
              <input
                type="text"
                placeholder="Ej: Repartidor Angel"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                required
                className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 px-4 text-sm text-white placeholder:text-slate-700 focus:outline-none focus:ring-2 focus:ring-secondary/50 focus:border-secondary transition-all"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 ml-1">
                Zona Horaria
              </label>
              <select
                value={zonaHoraria}
                onChange={(e) => setZonaHoraria(e.target.value)}
                required
                className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 px-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-secondary/50 focus:border-secondary transition-all appearance-none"
                style={{ colorScheme: 'dark' }}
              >
                <option value="America/Cancun">GMT-5 Hora del Sureste (Cancún)</option>
                <option value="America/Mexico_City">GMT-6 Hora del Centro (Monterrey)</option>
                <option value="America/Hermosillo">GMT-7 Hora del Pacífico (Sonora)</option>
                <option value="America/Tijuana">GMT-7 | GMT-8 Hora del Noroeste (Tijuana)</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={loading || !nombre.trim()}
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
                  Confirmar Registro
                </>
              )}
            </button>
          </form>
        </div>

        {/* Listado */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <h2 className="text-xl font-bold text-white ml-2 flex items-center gap-2">
              <span className="material-symbols-outlined text-slate-400 text-lg">badge</span>
              Repartidores y Locales registrados
            </h2>
          </div>

          <div className="bg-slate-900/20 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full text-center border-collapse">
                <thead>
                  <tr className="bg-slate-950/40">
                    <th className="px-6 py-4 text-slate-500 text-[10px] uppercase font-bold border-b border-slate-800 tracking-widest text-center">
                      Nombre
                    </th>
                    <th className="px-6 py-4 text-slate-500 text-[10px] uppercase font-bold border-b border-slate-800 tracking-widest text-center">
                      Zona Horaria
                    </th>
                    <th className="px-6 py-4 text-slate-500 text-[10px] uppercase font-bold border-b border-slate-800 tracking-widest text-center">
                      Estado
                    </th>
                    <th className="px-6 py-4 text-slate-500 text-[10px] uppercase font-bold border-b border-slate-800 tracking-widest text-center">
                      Fecha Registro
                    </th>
                    <th className="px-6 py-4 text-slate-500 text-[10px] uppercase font-bold border-b border-slate-800 tracking-widest text-center">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {repartidores.length > 0 ? (
                    repartidores.map((r) => (
                      <tr key={r.id} className="hover:bg-white/5 transition-colors group">
                        <td className="px-6 py-4 text-sm font-bold text-white border-b border-slate-800/50 text-center">
                          {r.nombre}
                        </td>
                        <td className="px-6 py-4 text-xs font-semibold text-slate-300 border-b border-slate-800/50 text-center">
                          {(() => {
                            let tzShort = 'GMT';
                            try {
                              const formatter = new Intl.DateTimeFormat('en-US', {
                                timeZone: r.zona_horaria,
                                timeZoneName: 'shortOffset'
                              });
                              tzShort = formatter.formatToParts(new Date()).find(p => p.type === 'timeZoneName')?.value || 'GMT';
                            } catch (e) { }

                            // Formatear bonito el nombre de la ciudad
                            let cityName = 'Monterrey';
                            if (r.zona_horaria === 'America/Cancun') cityName = 'Cancún';
                            else if (r.zona_horaria === 'America/Mexico_City' || r.zona_horaria === 'America/Monterrey') cityName = 'Monterrey';
                            else if (r.zona_horaria === 'America/Hermosillo' || r.zona_horaria === 'America/Mazatlan') cityName = 'Sonora';
                            else if (r.zona_horaria === 'America/Tijuana') cityName = 'Tijuana';
                            else cityName = r.zona_horaria.split('/').pop()?.replace('_', ' ') || r.zona_horaria;

                            return `🇲🇽 ${tzShort} (${cityName})`;
                          })()}
                        </td>
                        <td className="px-6 py-4 text-sm border-b border-slate-800/50 text-center">
                          <div className="flex items-center justify-center gap-2">
                            {/* Toggle Switch */}
                            <button
                              onClick={() => handleToggleActivo(r.id, r.activo)}
                              className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${r.activo ? 'bg-secondary' : 'bg-slate-800'
                                }`}
                            >
                              <span
                                className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-slate-950 shadow ring-0 transition duration-200 ease-in-out ${r.activo ? 'translate-x-4' : 'translate-x-0'
                                  }`}
                              />
                            </button>
                            <span
                              className={`text-[10px] font-bold uppercase tracking-wider ${r.activo ? 'text-secondary' : 'text-slate-500'
                                }`}
                            >
                              {r.activo ? 'Activo' : 'Inactivo'}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-xs text-slate-500 border-b border-slate-800/50 text-center">
                          {new Date(r.created_at).toLocaleDateString('es-AR', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric'
                          })}
                        </td>
                        <td className="px-6 py-4 text-sm border-b border-slate-800/50 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              type="button"
                              onClick={() => requestEliminar(r.id, r.nombre)}
                              className="p-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 hover:border-red-500/30 transition-all flex items-center justify-center cursor-pointer animate-in duration-200"
                              title="Eliminar Repartidor"
                            >
                              <span className="material-symbols-outlined text-base">delete</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-slate-500 italic">
                        No hay repartidores registrados.
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
          {/* Backdrop con Blur y oscurecimiento suave */}
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
              <h3 className="text-lg font-bold text-white">¿Eliminar Repartidor?</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                ¿Estás seguro de que deseas eliminar al repartidor <strong className="text-white">"{deleteConfirmName}"</strong>?<br />
                Esta acción es irreversible y se desvinculará de todas sus zonas asociadas.
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
