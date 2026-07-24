// 1. React Core
import React from "react";

// 2. Next.js Core
import Link from "next/link";

// 3. Auth & Supabase Services
import { createClient } from "@/utils/supabase/server";
import { getUserProfile, isAllowed } from "@/utils/auth-check";

// 4. Components
import AccessDenied from "@/components/empresa/AccessDenied";
import StockCargarForm from "@/components/empresa/StockCargarForm";

const styles = {
  container: "max-w-2xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500",
  header: "flex items-center justify-between",
  title: "text-3xl font-bold bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent",
  formCard: "bg-slate-900/40 backdrop-blur-xl border border-slate-800 p-8 rounded-3xl space-y-6",
};

export default async function CargarStockPage() {
  const { role: userRole } = await getUserProfile();

  // Solo Admin, Supervisor y Developer pueden cargar stock
  if (!isAllowed(userRole, ["Admin", "Supervisor", "Developer"])) {
    return <AccessDenied role={userRole} sectionName="Carga de Stock" />;
  }

  const supabase = await createClient();

  // Obtenemos los productos para el dropdown del formulario
  const { data: productos } = await supabase
    .from("productos")
    .select("id, marca, modelo, color, almacenamiento, ram")
    .order('marca', { ascending: true });

  // Obtenemos los repartidores activos para asignar la ubicación inicial (zona)
  const { data: repartidores } = await supabase
    .from("repartidores")
    .select("id, nombre")
    .eq("activo", true)
    .order("nombre", { ascending: true });

  // Obtenemos las zonas de reparto con sus repartidores asociados y sus siglas
  const { data: zonasRepartoRaw } = await supabase
    .from("zonas_reparto")
    .select(`
      id,
      nombre_zona,
      sigla,
      repartidor_id,
      repartidores (
        id,
        nombre,
        activo
      )
    `)
    .order("nombre_zona", { ascending: true });

  interface ZonaRepartoRaw {
    id: string;
    nombre_zona: string;
    sigla?: string;
    repartidor_id: string;
    repartidores: {
      id: string;
      nombre: string;
      activo: boolean;
    } | null;
  }

  const zonasReparto = ((zonasRepartoRaw as unknown as ZonaRepartoRaw[]) || [])
    .filter((zonaInfo) => zonaInfo.repartidores && zonaInfo.repartidores.activo)
    .map((zonaInfo) => ({
      id: zonaInfo.id,
      nombre_zona: zonaInfo.nombre_zona,
      sigla: zonaInfo.sigla,
      repartidor_id: zonaInfo.repartidor_id,
      repartidor_nombre: zonaInfo.repartidores!.nombre,
    }));

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className="space-y-1">
          <h1 className={styles.title}>Cargar Stock</h1>
          <p className="text-slate-500 text-sm">Registra una unidad física (IMEI) al inventario</p>
        </div>
        <Link href="/empresa/webapp/stock" className="text-slate-500 hover:text-slate-300 flex items-center gap-2 text-sm transition-colors">
          <span className="material-symbols-outlined text-base">arrow_back</span>
          Volver
        </Link>
      </header>

      <div className={styles.formCard}>
        {/* Pasamos la lista de productos, repartidores y zonas de reparto al formulario de cliente */}
        <StockCargarForm 
          productos={productos || []} 
          repartidores={repartidores || []} 
          zonasReparto={zonasReparto}
        />
      </div>

      <div className="bg-amber-500/5 border border-amber-500/10 p-6 rounded-2xl flex gap-4 items-start text-amber-400/80">
        <span className="material-symbols-outlined mt-0.5">warning</span>
        <div className="text-sm space-y-1">
          <p className="font-bold text-amber-300">Importante</p>
          <p>Asegúrate de que el IMEI sea correcto. Este número es único por dispositivo y se usará para el seguimiento de la venta.</p>
        </div>
      </div>
    </div>
  );
}
