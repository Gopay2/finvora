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

  if (!isAllowed(userRole, ["Admin", "Closer", "Cambaceador", "Supervisor", "Developer", "CambaCloser"])) {
    return <AccessDenied role={userRole} sectionName="Formulario de Ventas" />;
  }

  const supabase = await createClient();

  // 1. Obtenemos todos los productos del catálogo
  const { data: productos } = await supabase
    .from("productos")
    .select("id, marca, modelo, color, almacenamiento, ram")
    .order('marca', { ascending: true });

  // 2. Obtenemos el stock actual para contar disponibilidades, ubicación e IMEI
  const queryStock = supabase
    .from("stock")
    .select("producto_id, estado, zona, imei");

  if (userRole === "Closer" || userRole === "Cambaceador" || userRole === "CambaCloser") {
    queryStock.neq("estado", "En envío");
  }

  const { data: stockItems } = await queryStock;

  // 3. Obtenemos las zonas de reparto con sus repartidores asociados
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
  const zonasReparto = (zonasRepartoRaw || [])
    .filter((z: any) => z.repartidores && z.repartidores.activo)
    .map((z: any) => ({
      id: z.id,
      nombre_zona: z.nombre_zona,
      repartidor_id: z.repartidor_id,
      repartidor_nombre: z.repartidores.nombre,
      repartidor_activo: z.repartidores.activo
    }));

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h2 className={styles.title}>Formulario de Ventas</h2>
        <Link href="/empresa/webapp" className={styles.btnHome} title="Volver al Inicio">
          <span className="material-symbols-outlined text-xl">home</span>
        </Link>
      </header>

      {/* Pasamos los datos al formulario */}
      <VentasForm
        productos={productos || []}
        zonasReparto={zonasReparto}
        stockItems={stockItems || []}
      />
    </div>
  );
}
