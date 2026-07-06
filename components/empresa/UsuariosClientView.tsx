'use client';

import React, { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateUserRole } from "@/app/empresa/webapp/usuarios/actions";
import { ROLES_DISPONIBLES, UserRole } from "@/app/empresa/webapp/usuarios/constants";

interface Perfil {
  id: string;
  username: string | null;
  email: string | null;
  role: string;
}

interface UsuariosClientViewProps {
  perfiles: Perfil[];
  currentUserRole: string;
  currentUserId: string;
}

const styles = {
  controls: "flex flex-col sm:flex-row gap-4 justify-between items-stretch sm:items-center bg-slate-900/30 border border-slate-800/80 p-6 rounded-3xl backdrop-blur-xl mb-6",
  searchWrapper: "relative flex-1 max-w-md",
  searchIcon: "material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 text-xl",
  input: "w-full pl-12 pr-4 py-3 bg-slate-950/80 text-slate-100 border border-slate-800 rounded-xl focus:border-secondary focus:outline-none transition-all placeholder:text-slate-600 text-sm",
  selectFilter: "px-4 py-3 bg-slate-950 text-slate-200 border border-slate-800 rounded-lg focus:border-secondary focus:outline-none transition-all text-sm cursor-pointer",
  tableWrapper: "bg-slate-900/20 backdrop-blur-xl border border-slate-800/60 rounded-3xl overflow-hidden shadow-xl",
  table: "w-full border-collapse text-left text-sm",
  th: "px-6 py-4 border-b border-slate-800 text-slate-400 font-bold uppercase tracking-wider text-xs bg-slate-900/40",
  td: "px-6 py-4 border-b border-slate-800/40 text-slate-300 align-middle",
  tr: "hover:bg-slate-900/20 transition-all",
  trSelf: "bg-secondary/5 hover:bg-secondary/10 transition-all",
  badge: "px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wider border inline-block",
  selectRole: "px-3 py-2 bg-slate-950 text-slate-200 border border-slate-800 rounded-lg focus:border-secondary focus:outline-none transition-all text-xs font-semibold cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed min-w-[140px]",
  lockIcon: "material-symbols-outlined text-slate-500 text-lg",
  spinner: "w-4 h-4 border-2 border-slate-400 border-t-transparent rounded-full animate-spin inline-block",
};

// Paleta de colores para los badges de rol
const getBadgeStyles = (role: string) => {
  switch (role) {
    case "Admin":
      return "bg-red-500/10 text-red-400 border-red-500/20";
    case "Developer":
      return "bg-cyan-500/10 text-cyan-400 border-cyan-500/20";
    case "Supervisor":
      return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
    case "Repartidor":
      return "bg-amber-500/10 text-amber-400 border-amber-500/20";
    case "Closer":
    case "Cambaceador":
    case "CambaCloser":
      return "bg-violet-500/10 text-violet-400 border-violet-500/20";
    default:
      return "bg-slate-800 text-slate-400 border-slate-700";
  }
};

export default function UsuariosClientView({ perfiles, currentUserRole, currentUserId }: UsuariosClientViewProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRoleFilter, setSelectedRoleFilter] = useState("Todos");
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [, startTransition] = useTransition();

  const showToast = (message: string, type: "success" | "error") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const handleRoleChange = async (targetUserId: string, newRole: UserRole, targetUsername: string | null) => {
    if (updatingUserId) return;

    setUpdatingUserId(targetUserId);

    startTransition(async () => {
      try {
        const res = await updateUserRole(targetUserId, newRole);
        if (res.success) {
          showToast(`Rol de ${targetUsername || 'usuario'} actualizado a ${newRole} con éxito.`, "success");
          router.refresh();
        } else {
          showToast(res.error || "Ocurrió un error al actualizar el rol.", "error");
        }
      } catch (err: any) {
        showToast("Error de conexión al procesar el cambio.", "error");
      } finally {
        setUpdatingUserId(null);
      }
    });
  };

  // Filtrado de la lista de usuarios
  const filteredPerfiles = perfiles.filter((perfil) => {
    const query = searchQuery.toLowerCase();
    const username = (perfil.username || "").toLowerCase();
    const email = (perfil.email || "").toLowerCase();
    const matchesSearch = username.includes(query) || email.includes(query);

    const matchesRole = selectedRoleFilter === "Todos" || perfil.role === selectedRoleFilter;

    return matchesSearch && matchesRole;
  });

  return (
    <div className="space-y-6">
      {/* Notificación Toast Flotante */}
      {toast && (
        <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-6 py-4 rounded-2xl border backdrop-blur-xl shadow-2xl animate-in slide-in-from-bottom-5 duration-300 ${toast.type === "success"
            ? "bg-slate-900/90 text-emerald-400 border-emerald-500/30"
            : "bg-slate-900/90 text-red-400 border-red-500/30"
          }`}>
          <span className="material-symbols-outlined">
            {toast.type === "success" ? "check_circle" : "error"}
          </span>
          <span className="text-sm font-semibold text-slate-100">{toast.message}</span>
        </div>
      )}

      {/* Controles de Búsqueda y Filtros */}
      <div className={styles.controls}>
        <div className={styles.searchWrapper}>
          <span className={styles.searchIcon}>search</span>
          <input
            type="text"
            placeholder="Buscar por usuario o correo..."
            className={styles.input}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-3 mt-4 sm:mt-0">
          <span className="text-slate-500 text-xs font-bold uppercase tracking-wider">Filtrar por rol:</span>
          <div className="relative flex items-center">
            <select
              className={`${styles.selectFilter} appearance-none pr-10`}
              value={selectedRoleFilter}
              onChange={(e) => setSelectedRoleFilter(e.target.value)}
            >
              <option value="Todos">Todos</option>
              {ROLES_DISPONIBLES.map((role) => (
                <option key={role} value={role}>
                  {role}
                </option>
              ))}
            </select>
            <span className="material-symbols-outlined absolute right-4 pointer-events-none text-slate-500 text-base">
              keyboard_arrow_down
            </span>
          </div>
        </div>
      </div>

      {/* Tabla de Usuarios */}
      <div className={styles.tableWrapper}>
        <div className="overflow-x-auto">
          <table className={styles.table}>
            <thead>
              <tr>
                <th className={styles.th}>Usuario</th>
                <th className={styles.th}>Correo Electrónico</th>
                <th className={`${styles.th} text-center`}>Rol Actual</th>
                <th className={`${styles.th} text-center`}>Acción / Cambio de Rol</th>
              </tr>
            </thead>
            <tbody>
              {filteredPerfiles.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-slate-500">
                    No se encontraron usuarios que coincidan con la búsqueda o filtro.
                  </td>
                </tr>
              ) : (
                filteredPerfiles.map((perfil) => {
                  const isSelf = perfil.id === currentUserId;
                  const isProtected = perfil.role === "Admin" || perfil.role === "Developer";
                  const canEdit = !isSelf && (currentUserRole === "Admin" || currentUserRole === "Developer" || (currentUserRole === "Supervisor" && !isProtected));

                  // Opciones de rol seleccionables: si el logueado es Supervisor, no puede promover a Admin o Developer
                  const rolesOpciones = currentUserRole === "Supervisor"
                    ? ROLES_DISPONIBLES.filter(r => r !== "Admin" && r !== "Developer")
                    : ROLES_DISPONIBLES;

                  return (
                    <tr key={perfil.id} className={isSelf ? styles.trSelf : styles.tr}>
                      {/* Columna Usuario */}
                      <td className={styles.td}>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-200">
                            {perfil.username || (
                              <span className="text-slate-600 italic">Sin nombre de usuario</span>
                            )}
                          </span>
                          {isSelf && (
                            <span className="px-2 py-0.5 rounded bg-secondary/20 text-secondary border border-secondary/20 text-[10px] uppercase font-extrabold tracking-wider">
                              Tú
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Columna Correo */}
                      <td className={styles.td}>
                        <span className="text-slate-400 font-mono text-xs">
                          {perfil.email || <span className="text-slate-600 italic">Sin correo</span>}
                        </span>
                      </td>

                      {/* Columna Rol Actual */}
                      <td className={`${styles.td} text-center`}>
                        <span className={`${styles.badge} ${getBadgeStyles(perfil.role)}`}>
                          {perfil.role}
                        </span>
                      </td>

                      {/* Columna Acciones */}
                      <td className={`${styles.td} text-center`}>
                        <div className="flex items-center justify-center gap-3">
                          {updatingUserId === perfil.id ? (
                            <div className="flex items-center gap-2 text-slate-500">
                              <span className={styles.spinner} />
                              <span className="text-xs">Guardando...</span>
                            </div>
                          ) : !canEdit ? (
                            isSelf ? (
                              <div className="flex items-center gap-1.5 text-slate-500/80 py-1" title="No puedes cambiar tu propio rol para prevenir accidentes o pérdida de acceso.">
                                <span className={styles.lockIcon}>person_off</span>
                                <span className="text-xs font-semibold">(No editable)</span>
                              </div>
                            ) : (
                              <div className="flex items-center gap-1.5 text-slate-500 py-1" title="Protegido. No puedes modificar roles de Admin o Developer.">
                                <span className={styles.lockIcon}>lock</span>
                                <span className="text-xs font-semibold">Protegido</span>
                              </div>
                            )
                          ) : (
                            <div className="relative inline-flex items-center">
                              <select
                                className={`${styles.selectRole} appearance-none pr-8`}
                                value={perfil.role}
                                onChange={(e) => handleRoleChange(perfil.id, e.target.value as UserRole, perfil.username)}
                                disabled={updatingUserId !== null}
                              >
                                {/* Aseguramos que si el rol actual del usuario no está en las opciones filtradas del Supervisor,
                                    se renderice igual de forma temporal para que no rompa la visualización inicial */}
                                {!rolesOpciones.includes(perfil.role as any) && (
                                  <option value={perfil.role}>{perfil.role}</option>
                                )}
                                {rolesOpciones.map((role) => (
                                  <option key={role} value={role}>
                                    {role}
                                  </option>
                                ))}
                              </select>
                              <span className="material-symbols-outlined absolute right-3 pointer-events-none text-slate-500 text-xs">
                                keyboard_arrow_down
                              </span>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
