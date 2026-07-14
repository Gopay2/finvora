import React from "react";
import Link from "next/link";
import { getUserProfile, isAllowed } from "@/utils/auth-check";
import AccessDenied from "@/components/empresa/AccessDenied";
import { createClient } from "@/utils/supabase/server";
import HistorialClient from "../../../../../components/empresa/HistorialClient";

export const revalidate = 0;

const styles = {
  container: "max-w-7xl mx-auto space-y-8 animate-in fade-in duration-700 pb-12",
  header: "flex flex-col md:flex-row md:items-center justify-between gap-4",
  titleGroup: "space-y-1",
  title: "text-2xl md:text-3xl font-bold bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent",
  subtitle: "text-slate-500 text-sm max-w-2xl",
  actions: "flex items-center gap-3",
  btnBack: "flex items-center justify-center px-4 py-2.5 bg-slate-800 text-slate-300 border border-slate-700 rounded-xl hover:bg-slate-700 hover:text-white transition-all cursor-pointer select-none gap-2 text-sm font-medium",
};

export default async function HistorialTaskboardPage() {
  const currentUser = await getUserProfile();

  // Solo roles autorizados
  if (!isAllowed(currentUser.role, ["Admin", "Developer", "Supervisor"])) {
    return <AccessDenied role={currentUser.role} sectionName="Historial de Tareas" />;
  }

  const supabase = await createClient();
  if (!supabase) {
    return (
      <div className="text-red-500 text-center py-10 font-bold">
        Error al inicializar la conexión con Supabase.
      </div>
    );
  }

  // 1. Obtener todas las tareas terminadas
  const { data: tareasTerminadas, error: tareasError } = await supabase
    .from("taskboard")
    .select(`
      id,
      titulo,
      descripcion,
      estado,
      creado_por,
      asignado_a,
      created_at,
      updated_at,
      creador:perfiles!taskboard_creado_por_fkey(username),
      asignado:perfiles!taskboard_asignado_a_fkey(username)
    `)
    .eq("estado", "Terminado")
    .order("updated_at", { ascending: false });

  if (tareasError) {
    console.error("Error al cargar historial de tareas:", tareasError);
  }

  // 2. Obtener perfiles de usuarios autorizados
  const { data: perfiles, error: perfilesError } = await supabase
    .from("perfiles")
    .select("id, username, role")
    .in("role", ["Admin", "Developer", "Supervisor"])
    .order("username", { ascending: true });

  if (perfilesError) {
    console.error("Error al cargar perfiles en HistorialTaskboardPage:", perfilesError);
  }

  return (
    <div className={styles.container}>
      <header className="flex flex-col md:flex-row md:items-start justify-between gap-4">
        <div className="space-y-1 flex-1 w-full">
          <div className="flex justify-between items-start md:block w-full mb-1.5 md:mb-0">
            <h1 className={styles.title}>Historial de Tareas</h1>
            <div className="md:hidden -mt-1">
              <Link href="/empresa/webapp/taskboard" className="text-slate-500 hover:text-slate-300 flex items-center gap-2 text-lg transition-colors">
                <span className="material-symbols-outlined text-xl">arrow_back</span>
                <span>Volver</span>
              </Link>
            </div>
          </div>
          <p className={styles.subtitle}>
            Consulta el archivo de tareas completadas del equipo.
          </p>
        </div>
        <div className="hidden md:block">
          <Link href="/empresa/webapp/taskboard" className="text-slate-500 hover:text-slate-300 flex items-center gap-2 text-lg transition-colors">
            <span className="material-symbols-outlined text-xl">arrow_back</span>
            Volver
          </Link>
        </div>
      </header>

      <HistorialClient
        tareasTerminadas={tareasTerminadas || []}
        perfiles={perfiles || []}
      />
    </div>
  );
}
