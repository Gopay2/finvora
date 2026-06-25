'use client';

import React, { useState, useTransition } from "react";
import { crearZona, eliminarZona, editarZona } from "@/app/empresa/webapp/repartos/repartos-actions";

// ─── Interfaces y Tipos ──────────────────────────────────────────────────────

interface Repartidor {
  id: string;
  nombre: string;
}

interface Zona {
  id: string;
  repartidor_id: string;
  nombre_zona: string;
  sigla?: string;
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

// ─── Estilos (Tailwind CSS) ──────────────────────────────────────────────────

const styles = {
  container: "space-y-8 relative",
  alertError: "p-4 bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-2xl flex items-center gap-2 animate-pulse",
  alertIcon: "material-symbols-outlined text-lg",
  grid: "grid grid-cols-1 lg:grid-cols-3 gap-8",
  
  // Formulario
  formCard: "bg-slate-900/40 backdrop-blur-xl border border-slate-800 p-6 md:p-8 rounded-3xl lg:col-span-1 h-fit",
  formTitle: "text-lg font-bold text-white mb-4 ml-1 flex items-center gap-2",
  formTitleIcon: "material-symbols-outlined text-secondary text-lg",
  form: "space-y-4",
  formGroup: "space-y-1.5",
  label: "text-[10px] font-bold uppercase tracking-wider text-slate-500 ml-1",
  selectInput: "w-full bg-slate-950 border border-slate-800 rounded-xl py-3 px-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-secondary/50 focus:border-secondary transition-all appearance-none",
  input: "w-full bg-slate-950 border border-slate-800 rounded-xl py-3 px-4 text-sm text-white placeholder:text-slate-700 focus:outline-none focus:ring-2 focus:ring-secondary/50 focus:border-secondary transition-all",
  btnContainer: "flex gap-3 pt-2",
  btnCancel: "flex-1 py-3 bg-slate-800 hover:bg-slate-750 text-slate-300 font-bold rounded-xl transition-all text-sm cursor-pointer border border-slate-750 text-center",
  btnSubmit: "flex-1 py-3 bg-secondary text-slate-950 font-bold rounded-xl hover:bg-secondary/90 transition-all text-sm cursor-pointer shadow-[0_0_15px_rgba(16,185,129,0.15)] disabled:opacity-50 flex items-center justify-center gap-2",
  btnSpinner: "w-4 h-4 border-2 border-slate-950/30 border-t-slate-950 rounded-full animate-spin",

  // Tabla / Listado
  listContainer: "lg:col-span-2 space-y-4",
  listHeader: "flex items-center justify-between",
  listTitle: "text-xl font-bold text-white ml-2 flex items-center gap-2",
  listTitleIcon: "material-symbols-outlined text-slate-400 text-lg",
  tableWrapper: "bg-slate-900/20 border border-slate-800 rounded-2xl overflow-hidden shadow-xl",
  tableScroll: "overflow-x-auto custom-scrollbar",
  table: "w-full text-center border-collapse",
  thead: "bg-slate-950/40",
  thSigla: "w-20 px-2 py-4 text-slate-500 text-[10px] uppercase font-bold border-b border-slate-800 tracking-widest text-center",
  th: "px-6 py-4 text-slate-500 text-[10px] uppercase font-bold border-b border-slate-800 tracking-widest text-center",
  thLarge: "px-6 py-4 text-slate-500 text-[10px] uppercase font-bold border-b border-slate-800 tracking-widest text-center min-w-[200px] md:min-w-0",
  thMedium: "px-6 py-4 text-slate-500 text-[10px] uppercase font-bold border-b border-slate-800 tracking-widest text-center min-w-[180px] md:min-w-0",
  tr: "hover:bg-white/5 transition-colors group",
  tdSigla: "w-20 px-2 py-4 text-sm border-b border-slate-800/50 text-center",
  badgeSigla: "px-2.5 py-1 rounded-lg text-xs font-bold tracking-wider uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 whitespace-nowrap",
  textNa: "text-slate-500 text-xs italic",
  tdZona: "px-6 py-4 text-sm font-bold text-white border-b border-slate-800/50 text-center",
  tdDesc: "px-6 py-4 text-sm text-slate-400 border-b border-slate-800/50 text-center italic min-w-[200px] md:min-w-0 whitespace-nowrap md:whitespace-normal",
  tdRepartidor: "px-6 py-4 text-sm border-b border-slate-800/50 text-center min-w-[180px] md:min-w-0",
  badgeRepartidor: "px-2.5 py-1 rounded-lg text-xs font-bold uppercase bg-blue-500/10 text-blue-400 border border-blue-500/20 whitespace-nowrap",
  tdActions: "px-6 py-4 text-sm border-b border-slate-800/50 text-center",
  btnActionsContainer: "flex items-center justify-center gap-2",
  btnEdit: "p-2 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/20 hover:border-blue-500/30 transition-all flex items-center justify-center cursor-pointer",
  btnDelete: "p-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 hover:border-red-500/30 transition-all flex items-center justify-center cursor-pointer",
  btnIcon: "material-symbols-outlined text-base",
  tdEmpty: "px-6 py-12 text-center text-slate-500 italic",

  // Modal Confirmación
  modalOverlay: "fixed inset-0 z-[100] flex items-center justify-center p-4",
  modalBackdrop: "absolute inset-0 bg-slate-950/80 backdrop-blur-sm transition-opacity animate-in fade-in duration-300",
  modalContent: "relative bg-slate-900 border border-slate-800 p-6 md:p-8 rounded-3xl max-w-md w-full shadow-2xl animate-in fade-in zoom-in-95 duration-200 text-center space-y-6",
  modalIconWrapper: "mx-auto w-12 h-12 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400",
  modalIcon: "material-symbols-outlined text-2xl",
  modalTextGroup: "space-y-2",
  modalTitle: "text-lg font-bold text-white",
  modalDesc: "text-xs text-slate-400 leading-relaxed",
  modalBtnGroup: "flex items-center justify-center gap-3 pt-2",
  modalBtnCancel: "flex-1 py-3 bg-slate-800 hover:bg-slate-750 text-slate-300 font-bold rounded-xl transition-all text-xs cursor-pointer border border-slate-700",
  modalBtnConfirm: "flex-1 py-3 bg-red-500 hover:bg-red-600 text-white font-bold rounded-xl transition-all text-xs cursor-pointer shadow-[0_0_15px_rgba(239,68,68,0.2)]"
};

// ─── Componente Principal ────────────────────────────────────────────────────

export default function ZonasConfig({ initialZonas, repartidores }: Props) {
  const [zonas, setZonas] = useState<Zona[]>(initialZonas);
  const [repartidorId, setRepartidorId] = useState("");
  const [nombreZona, setNombreZona] = useState("");
  const [sigla, setSigla] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  // Estados para el Modal de Confirmación de Eliminación
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [deleteConfirmName, setDeleteConfirmName] = useState<string | null>(null);

  const startEditing = (zona: Zona) => {
    setEditingId(zona.id);
    setRepartidorId(zona.repartidor_id);
    setNombreZona(zona.nombre_zona);
    setSigla(zona.sigla || "");
    setDescripcion(zona.descripcion || "");
    setError(null);
  };

  const cancelEditing = () => {
    setEditingId(null);
    setRepartidorId("");
    setNombreZona("");
    setSigla("");
    setDescripcion("");
    setError(null);
  };

  // Sincronizar estado local si cambian las zonas iniciales enviadas por el Server Component
  React.useEffect(() => {
    setZonas(initialZonas);
  }, [initialZonas]);

  /**
   * Manejador del envío del formulario para registrar o editar una zona de reparto.
   * Realiza la validación básica, invoca la Server Action respectiva (`crearZona` o `editarZona`)
   * y limpia los estados de entrada tras un envío exitoso.
   */
  const handleCrear = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!repartidorId || !nombreZona.trim()) return;

    setLoading(true);
    setError(null);
    try {
      let actionResult;
      if (editingId) {
        actionResult = await editarZona(editingId, {
          repartidor_id: repartidorId,
          nombre_zona: nombreZona.trim(),
          sigla: sigla.trim().toUpperCase() || undefined,
          descripcion: descripcion.trim() || undefined
        });
      } else {
        actionResult = await crearZona({
          repartidor_id: repartidorId,
          nombre_zona: nombreZona.trim(),
          sigla: sigla.trim().toUpperCase() || undefined,
          descripcion: descripcion.trim() || undefined
        });
      }

      if (actionResult.success) {
        setRepartidorId("");
        setNombreZona("");
        setSigla("");
        setDescripcion("");
        setEditingId(null);
        startTransition(() => {
          // Revalida las rutas en el servidor
        });
      } else {
        setError(actionResult.error || (editingId ? "Error al editar zona" : "Error al crear zona"));
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

  /**
   * Ejecuta el borrado lógico/físico de la zona mediante una llamada asíncrona a la Server Action `eliminarZona`.
   * Aplica una actualización optimista sobre el estado local para asegurar una respuesta inmediata en UI,
   * y revierte la lista en caso de fallas de red o errores de backend.
   */
  const executeEliminar = async () => {
    if (!deleteConfirmId) return;

    const idToDelete = deleteConfirmId;
    setDeleteConfirmId(null);
    setDeleteConfirmName(null);
    setError(null);

    // Actualización optimista: removemos el item inmediatamente
    const oldList = [...zonas];
    setZonas(prev => prev.filter(zona => zona.id !== idToDelete));

    try {
      const actionResult = await eliminarZona(idToDelete);
      if (!actionResult.success) {
        // En caso de error, revertimos al listado anterior
        setZonas(oldList);
        setError(actionResult.error || "Error al eliminar zona");
      }
    } catch (err: any) {
      // Reversión optimista ante fallas de red
      setZonas(oldList);
      setError(err.message || "Error de red");
    }
  };

  return (
    <div className={styles.container}>
      {error && (
        <div className={styles.alertError}>
          <span className={styles.alertIcon}>error</span>
          {error}
        </div>
      )}

      {/* Grid: Formulario Izquierda, Tabla Derecha */}
      <div className={styles.grid}>
        {/* Formulario */}
        <div className={styles.formCard}>
          <h2 className={styles.formTitle}>
            <span className={styles.formTitleIcon}>
              {editingId ? "edit_location_alt" : "add_location_alt"}
            </span>
            {editingId ? "Editar Zona de Reparto" : "Nueva Zona de Reparto"}
          </h2>
          <form onSubmit={handleCrear} className={styles.form}>
            {/* Selector de Repartidor */}
            <div className={styles.formGroup}>
              <label className={styles.label}>
                Repartidor Asignado
              </label>
              <select
                value={repartidorId}
                onChange={(event) => setRepartidorId(event.target.value)}
                required
                className={styles.selectInput}
                style={{ colorScheme: 'dark' }}
              >
                <option value="">Seleccionar repartidor o local</option>
                {repartidores.map(repartidor => (
                  <option key={repartidor.id} value={repartidor.id}>
                    {repartidor.nombre}
                  </option>
                ))}
              </select>
            </div>

            {/* Nombre Zona */}
            <div className={styles.formGroup}>
              <label className={styles.label}>
                Nombre de Zona / Referencia
              </label>
              <input
                type="text"
                placeholder="Ej: Zona Norte, Centro, Zona A..."
                value={nombreZona}
                onChange={(event) => setNombreZona(event.target.value)}
                required
                className={styles.input}
              />
            </div>

            {/* Sigla de Zona */}
            <div className={styles.formGroup}>
              <label className={styles.label}>
                Sigla de Zona (Folios)
              </label>
              <input
                type="text"
                placeholder="Ej: MTY, TIJ, ROS..."
                value={sigla}
                onChange={(event) => setSigla(event.target.value.replace(/[^a-zA-Z]/g, '').toUpperCase().slice(0, 3))}
                maxLength={3}
                className={styles.input}
              />
            </div>

            {/* Descripción */}
            <div className={styles.formGroup}>
              <label className={styles.label}>
                Descripción / Detalles
              </label>
              <input
                type="text"
                placeholder="Ej: Turno Noche"
                value={descripcion}
                onChange={(event) => setDescripcion(event.target.value)}
                className={styles.input}
              />
            </div>

            {/* Controles de Acción */}
            <div className={styles.btnContainer}>
              {editingId && (
                <button
                  type="button"
                  onClick={cancelEditing}
                  className={styles.btnCancel}
                >
                  Cancelar
                </button>
              )}
              <button
                type="submit"
                disabled={loading || !repartidorId || !nombreZona.trim()}
                className={styles.btnSubmit}
              >
                {loading ? (
                  <>
                    <div className={styles.btnSpinner} />
                    Guardando...
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-lg">save</span>
                    {editingId ? "Guardar" : "Confirmar Zona"}
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Listado de Zonas */}
        <div className={styles.listContainer}>
          <div className={styles.listHeader}>
            <h2 className={styles.listTitle}>
              <span className={styles.listTitleIcon}>map</span>
              Zonas de Reparto Registradas
            </h2>
          </div>

          <div className={styles.tableWrapper}>
            <div className={styles.tableScroll}>
              <table className={styles.table}>
                <thead>
                  <tr className={styles.thead}>
                    <th className={styles.thSigla}>
                      Sigla
                    </th>
                    <th className={styles.th}>
                      Zona / Ref.
                    </th>
                    <th className={styles.thLarge}>
                      Detalles / Descripción
                    </th>
                    <th className={styles.thMedium}>
                      Repartidor Responsable
                    </th>
                    <th className={styles.th}>
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {zonas.length > 0 ? (
                    zonas.map((zona) => (
                      <tr key={zona.id} className={styles.tr}>
                        <td className={styles.tdSigla}>
                          {zona.sigla ? (
                            <span className={styles.badgeSigla}>
                              {zona.sigla}
                            </span>
                          ) : (
                            <span className={styles.textNa}>N/A</span>
                          )}
                        </td>
                        <td className={styles.tdZona}>
                          {zona.nombre_zona}
                        </td>
                        <td className={styles.tdDesc}>
                          {zona.descripcion || "Sin descripción"}
                        </td>
                        <td className={styles.tdRepartidor}>
                          <span className={styles.badgeRepartidor}>
                            {zona.repartidores?.nombre || "No asignado"}
                          </span>
                        </td>
                        <td className={styles.tdActions}>
                          <div className={styles.btnActionsContainer}>
                            <button
                              type="button"
                              onClick={() => startEditing(zona)}
                              className={styles.btnEdit}
                              title="Editar Zona"
                            >
                              <span className={styles.btnIcon}>edit</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => requestEliminar(zona.id, zona.nombre_zona)}
                              className={styles.btnDelete}
                              title="Eliminar Zona"
                            >
                              <span className={styles.btnIcon}>delete</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className={styles.tdEmpty}>
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
        <div className={styles.modalOverlay}>
          {/* Backdrop con Blur */}
          <div 
            className={styles.modalBackdrop}
            onClick={() => {
              setDeleteConfirmId(null);
              setDeleteConfirmName(null);
            }}
          />
          {/* Contenido del Modal */}
          <div className={styles.modalContent}>
            <div className={styles.modalIconWrapper}>
              <span className={styles.modalIcon}>warning</span>
            </div>
            
            <div className={styles.modalTextGroup}>
              <h3 className={styles.modalTitle}>¿Eliminar Zona?</h3>
              <p className={styles.modalDesc}>
                ¿Estás seguro de que deseas eliminar la zona <strong className="text-white">"{deleteConfirmName}"</strong>?<br/>
                Esta acción es irreversible y ya no estará disponible para la asignación de repartos.
              </p>
            </div>

            <div className={styles.modalBtnGroup}>
              <button
                type="button"
                onClick={() => {
                  setDeleteConfirmId(null);
                  setDeleteConfirmName(null);
                }}
                className={styles.modalBtnCancel}
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={executeEliminar}
                className={styles.modalBtnConfirm}
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
