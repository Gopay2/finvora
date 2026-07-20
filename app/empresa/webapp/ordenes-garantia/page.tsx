import React from "react";
import Link from "next/link";
import { getUserProfile, isAllowed } from "@/utils/auth-check";
import AccessDenied from "@/components/empresa/AccessDenied";
import OrdenesGarantiaForm from "@/components/empresa/OrdenesGarantiaForm";
import { createClient } from "@/utils/supabase/server";

export const revalidate = 0;

const styles = {
  container: "max-w-4xl mx-auto space-y-8",
  header: "flex items-center justify-between",
  title: "text-xl md:text-3xl font-bold bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent",
  btnHome: "flex items-center justify-center px-4 py-2 bg-slate-800 text-slate-400 border border-slate-700 rounded-xl hover:bg-slate-700 hover:text-white transition-all cursor-pointer",
};

interface ZonaRepartoRaw {
  id: string;
  nombre_zona: string;
  repartidor_id: string;
  repartidores: {
    id: string;
    nombre: string;
    activo: boolean;
  } | null;
}

export default async function OrdenesGarantiaPage() {
  const { role: userRole } = await getUserProfile();

  if (!isAllowed(userRole, ["Admin", "Closer", "Cambaceador", "Supervisor", "Developer", "CambaCloser"])) {
    return <AccessDenied role={userRole} sectionName="Orden de Garantía" />;
  }

  const supabase = await createClient();

  // Obtenemos las zonas de reparto con sus repartidores asociados
  const { data: zonasRepartoRaw } = await supabase
    .from("zonas_reparto")
    .select(`
      id,
      nombre_zona,
      repartidor_id,
      repartidores (
        id,
        nombre,
        activo
      )
    `)
    .order("nombre_zona", { ascending: true });

  // Filtramos para conservar solo zonas con repartidores activos
  const zonasReparto = ((zonasRepartoRaw as unknown as ZonaRepartoRaw[]) || [])
    .filter((zonaInfo) => zonaInfo.repartidores && zonaInfo.repartidores.activo)
    .map((zonaInfo) => ({
      id: zonaInfo.id,
      nombre_zona: zonaInfo.nombre_zona,
      repartidor_id: zonaInfo.repartidor_id,
      repartidor_nombre: zonaInfo.repartidores!.nombre,
      repartidor_activo: zonaInfo.repartidores!.activo
    }));

  // Obtenemos todos los productos del catálogo para las sugerencias de marca y modelo
  const { data: productos } = await supabase
    .from("productos")
    .select("id, marca, modelo, color, almacenamiento, ram")
    .order("marca", { ascending: true });

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h2 className={styles.title}>Orden de Garantía</h2>
        <Link href="/empresa/webapp" className={styles.btnHome} title="Volver al Inicio">
          <span className="material-symbols-outlined text-xl">home</span>
        </Link>
      </header>

      <OrdenesGarantiaForm zonasReparto={zonasReparto} productos={productos || []} />
    </div>
  );
}
