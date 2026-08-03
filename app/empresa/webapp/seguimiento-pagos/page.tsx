import React from "react";
import Link from "next/link";
import { createClient } from "@/utils/supabase/server";
import { getUserProfile, isAllowed } from "@/utils/auth-check";
import AccessDenied from "@/components/empresa/AccessDenied";
import SeguimientoPagosClientPage from "@/components/empresa/SeguimientoPagosClientPage";
import { getSeguimientoPagos } from "./seguimiento-actions";
import type { OptionItem } from "@/components/empresa/comprobantes-types";

export const revalidate = 0;

const styles = {
  container: "max-w-6xl mx-auto space-y-8",
  header: "flex items-start justify-between gap-4",
  title: "text-xl md:text-3xl font-bold bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent",
  desc: "text-sm text-slate-400 mt-1",
  btnHome: "flex items-center justify-center px-4 py-2 bg-slate-800 text-slate-400 border border-slate-700 rounded-xl hover:bg-slate-700 hover:text-white transition-all cursor-pointer shrink-0",
};

export default async function SeguimientoPagosPage() {
  const { role: userRole } = await getUserProfile();

  // Control de acceso: Admin, Supervisor, Developer, Repartidor, Cambaceador, CambaCloser
  if (!isAllowed(userRole, ["Developer", "Admin", "Supervisor", "Repartidor", "Cambaceador", "CambaCloser"])) {
    return <AccessDenied role={userRole} sectionName="Seguimiento de Pagos" />;
  }

  const supabase = await createClient();

  // Obtener vendedores
  const { data: vendedoresRaw } = await supabase
    .from("perfiles")
    .select("id, username, role")
    .neq("role", "Sin rol")
    .order("username", { ascending: true });

  const vendedores: OptionItem[] = (vendedoresRaw || []).map((v: { id: string; username: string | null; role: string }) => ({
    id: v.id,
    display: `${v.username ? v.username.charAt(0).toUpperCase() + v.username.slice(1) : ''} (${v.role})`
  }));

  // Obtener repartidores
  const { data: repartidoresRaw } = await supabase
    .from("repartidores")
    .select("id, nombre")
    .order("nombre", { ascending: true });

  const repartidores: OptionItem[] = (repartidoresRaw || []).map((r: { id: string; nombre: string }) => ({
    id: r.id,
    display: r.nombre
  }));

  const { data: initialData = [], error } = await getSeguimientoPagos();

  if (error) {
    console.error("Error al cargar la página de seguimiento de pagos:", error);
  }

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div>
          <h2 className={styles.title}>Seguimiento de Pagos</h2>
          <p className={styles.desc}>
            Gestión y proyección matemática de saldo restante cuota a cuota por cliente.
          </p>
        </div>
        <Link href="/empresa/webapp" className={styles.btnHome} title="Volver al Inicio">
          <span className="material-symbols-outlined text-xl">home</span>
        </Link>
      </header>

      <SeguimientoPagosClientPage
        initialData={initialData}
        vendedores={vendedores}
        repartidores={repartidores}
        userRole={userRole || undefined}
      />
    </div>
  );
}
