import React from "react";
import Link from "next/link";
import { getUserProfile, isAllowed } from "@/utils/auth-check";
import AccessDenied from "@/components/empresa/AccessDenied";
import VentasForm from "@/components/empresa/VentasForm";
import { createClient } from "@/utils/supabase/server";

export const revalidate = 0;

const styles = {
  container: "max-w-4xl mx-auto space-y-8",
  header: "flex items-center justify-between",
  title: "text-xl md:text-3xl font-bold bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent",
  btnHome: "flex items-center justify-center px-4 py-2 bg-slate-800 text-slate-400 border border-slate-700 rounded-xl hover:bg-slate-700 hover:text-white transition-all cursor-pointer",
};

export default async function VentasPage() {
  const { role: userRole } = await getUserProfile();

  if (!isAllowed(userRole, ["Admin", "Closer", "Supervisor", "Developer"])) {
    return <AccessDenied role={userRole} sectionName="Formulario de Ventas" />;
  }

  const supabase = await createClient();

  // Obtenemos los productos para el select del formulario
  const { data: productos } = await supabase
    .from("productos")
    .select("id, marca, modelo, color, almacenamiento, ram")
    .order('marca', { ascending: true });

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h2 className={styles.title}>Formulario de Ventas</h2>
        <Link href="/empresa/webapp" className={styles.btnHome} title="Volver al Inicio">
          <span className="material-symbols-outlined text-xl">home</span>
        </Link>
      </header>

      {/* Pasamos los productos al formulario */}
      <VentasForm productos={productos || []} />
    </div>
  );
}
