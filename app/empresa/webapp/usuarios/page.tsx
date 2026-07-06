import React from "react";
import Link from "next/link";
import { getUserProfile, isAllowed } from "@/utils/auth-check";
import AccessDenied from "@/components/empresa/AccessDenied";
import { createClient } from "@/utils/supabase/server";
import UsuariosClientView from "@/components/empresa/UsuariosClientView";

export const revalidate = 0;

const styles = {
  container: "max-w-6xl mx-auto space-y-8 animate-in fade-in duration-700 pb-12",
  header: "flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-6",
  titleGroup: "space-y-1",
  title: "text-2xl md:text-3xl font-bold bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent",
  actions: "flex items-center justify-center md:justify-end gap-4 md:gap-3",
  btnHome: "flex items-center justify-center px-4 py-2.5 bg-slate-800 text-slate-400 border border-slate-700 rounded-xl hover:bg-slate-700 hover:text-white transition-all cursor-pointer select-none",
};

export default async function UsuariosPage() {
  const { id: currentUserId, role: userRole } = await getUserProfile();

  // Solo roles superiores
  if (!isAllowed(userRole, ["Admin", "Developer", "Supervisor"])) {
    return <AccessDenied role={userRole} sectionName="Gestión de usuarios" />;
  }

  const supabase = await createClient();
  if (!supabase) {
    return (
      <div className="text-red-500 text-center py-10 font-bold">
        Error al inicializar la conexión con Supabase.
      </div>
    );
  }

  // Fetch de perfiles
  const { data: perfiles, error } = await supabase
    .from("perfiles")
    .select("id, username, email, role")
    .order("username", { ascending: true });

  if (error) {
    console.error("Error al cargar perfiles en UsuariosPage:", error);
  }

  return (
    <div className={styles.container}>
      <header className="space-y-2">
        <div className="flex items-center justify-between gap-4">
          <h1 className={styles.title}>Gestión de Usuarios</h1>
          <Link href="/empresa/webapp" className={styles.btnHome} title="Volver al Inicio">
            <span className="material-symbols-outlined text-xl">home</span>
          </Link>
        </div>
        <p className="text-slate-500 text-sm max-w-2xl">
          Visualiza todos los perfiles de la plataforma y administra sus roles y accesos.
        </p>
      </header>

      <UsuariosClientView
        perfiles={perfiles || []}
        currentUserRole={userRole}
        currentUserId={currentUserId || ""}
      />
    </div>
  );
}
