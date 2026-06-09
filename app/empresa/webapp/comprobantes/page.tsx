import React from "react";
import Link from "next/link";
import { getUserProfile, isAllowed } from "@/utils/auth-check";
import AccessDenied from "@/components/empresa/AccessDenied";
import { createClient } from "@/utils/supabase/server";
import ComprobantesClientPage from "./ComprobantesClientPage";
import { getComprobantes } from "./comprobantes-actions";

export const revalidate = 0;

const styles = {
  container: "max-w-4xl mx-auto space-y-8",
  header: "flex items-center justify-between",
  title: "text-xl md:text-3xl font-bold bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent",
  btnHome: "flex items-center justify-center px-4 py-2 bg-slate-800 text-slate-400 border border-slate-700 rounded-xl hover:bg-slate-700 hover:text-white transition-all cursor-pointer",
};

export default async function ComprobantesPage() {
  const { role: userRole } = await getUserProfile();

  // 1. Control de acceso a la sección
  if (!isAllowed(userRole, ["Developer"])) {
    return <AccessDenied role={userRole} sectionName="Comprobantes" />;
  }

  const supabase = await createClient();

  // 2. Obtener lista de Vendedores (todos los roles registrados)
  const { data: vendedoresRaw } = await supabase
    .from("perfiles")
    .select("id, username, role")
    .order("username", { ascending: true });

  // 3. Obtener lista de Repartidores (rol Repartidor)
  const { data: repartidoresRaw } = await supabase
    .from("perfiles")
    .select("id, username, role")
    .eq("role", "Repartidor")
    .order("username", { ascending: true });

  const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

  const vendedores = (vendedoresRaw || []).map((v: any) => ({
    id: v.id,
    display: `${v.role || "Sin rol"}: ${v.username ? capitalize(v.username) : "Sin nombre"}`
  }));

  const repartidores = (repartidoresRaw || []).map((r: any) => ({
    id: r.id,
    display: `${r.role}: ${r.username ? capitalize(r.username) : "Sin nombre"}`
  }));

  // 4. Obtener registros históricos si corresponde a roles superiores
  const showTable = isAllowed(userRole, ["Admin", "Supervisor", "Developer"]);
  let comprobantesList: any[] = [];

  if (showTable) {
    const res = await getComprobantes();
    if (res.success && res.data) {
      comprobantesList = res.data;
    }
  }

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h2 className={styles.title}>Comprobantes</h2>
        <Link href="/empresa/webapp" className={styles.btnHome} title="Volver al Inicio">
          <span className="material-symbols-outlined text-xl">home</span>
        </Link>
      </header>

      <ComprobantesClientPage
        vendedores={vendedores}
        repartidores={repartidores}
        comprobantesList={comprobantesList}
        showTable={showTable}
      />
    </div>
  );
}
