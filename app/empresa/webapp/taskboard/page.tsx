import React from "react";
import Link from "next/link";
import { getUserProfile, isAllowed } from "@/utils/auth-check";
import AccessDenied from "@/components/empresa/AccessDenied";
import { createClient } from "@/utils/supabase/server";
import TaskboardClient from "../../../../components/empresa/TaskboardClient";

export const revalidate = 0;

const styles = {
  container: "max-w-7xl mx-auto space-y-8 animate-in fade-in duration-700 pb-12",
  header: "flex flex-col md:flex-row md:items-center justify-between gap-4",
  titleGroup: "space-y-1",
  title: "text-2xl md:text-3xl font-bold bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent",
  subtitle: "text-slate-500 text-sm max-w-2xl",
  actions: "flex items-center gap-3",
  btnHome: "flex items-center justify-center px-4 py-2.5 bg-slate-800 text-slate-400 border border-slate-700 rounded-xl hover:bg-slate-700 hover:text-white transition-all cursor-pointer select-none",
};

export default async function TaskboardPage() {
  const currentUser = await getUserProfile();

  // Solo roles autorizados
  if (!isAllowed(currentUser.role, ["Admin", "Developer", "Supervisor"])) {
    return <AccessDenied role={currentUser.role} sectionName="Taskboard" />;
  }

  const supabase = await createClient();
  if (!supabase) {
    return (
      <div className="text-red-500 text-center py-10 font-bold">
        Error al inicializar la conexión con Supabase.
      </div>
    );
  }

  // 1. Obtener los perfiles con roles autorizados
  const { data: perfiles, error: perfilesError } = await supabase
    .from("perfiles")
    .select("id, username, email, role")
    .in("role", ["Admin", "Developer", "Supervisor"])
    .order("username", { ascending: true });

  if (perfilesError) {
    console.error("Error al cargar perfiles para Taskboard:", perfilesError);
  }

  // 2. Obtener tareas activas (Pendientes y En proceso)
  const { data: tareasActivas, error: activasError } = await supabase
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
    .in("estado", ["Pendientes", "En proceso"]);

  if (activasError) {
    console.error("Error al cargar tareas activas:", activasError);
  }

  // 3. Obtener las 20 tareas terminadas más recientes
  const { data: tareasTerminadas, error: terminadasError } = await supabase
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
    .order("updated_at", { ascending: false })
    .limit(20);

  if (terminadasError) {
    console.error("Error al cargar tareas terminadas:", terminadasError);
  }

  // Combinar los conjuntos de tareas
  const tareasIniciales = [
    ...(tareasActivas || []),
    ...(tareasTerminadas || [])
  ];

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.titleGroup}>
          <h1 className={styles.title}>Taskboard</h1>
          <p className={styles.subtitle}>
            Tablero Kanban de tareas. Asigna y gestiona el flujo de trabajo del equipo en tiempo real.
          </p>
        </div>
        <div className={styles.actions}>
          <Link href="/empresa/webapp" className={styles.btnHome} title="Volver al Inicio">
            <span className="material-symbols-outlined text-xl">home</span>
          </Link>
        </div>
      </header>

      <TaskboardClient
        perfiles={perfiles || []}
        tareasIniciales={tareasIniciales}
        currentUser={currentUser}
      />
    </div>
  );
}
