import React from "react";
import Link from "next/link";
import { getUserProfile, isAllowed } from "@/utils/auth-check";
import AccessDenied from "@/components/empresa/AccessDenied";
import StockProductoForm from "@/components/empresa/StockProductoForm";
import { createClient } from "@/utils/supabase/server";
import ProductosClientView from "@/components/empresa/ProductosClientView";

const styles = {
  container: "max-w-6xl mx-auto space-y-10 animate-in fade-in duration-500",
  header: "flex items-center justify-between",
  title: "text-3xl font-bold bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent",
  formCard: "bg-slate-900/40 backdrop-blur-xl border border-slate-800 p-8 rounded-3xl",
};

export default async function ProductosPage() {
  const { role: userRole } = await getUserProfile();

  if (!isAllowed(userRole, ["Admin", "Supervisor", "Developer"])) {
    return <AccessDenied role={userRole} sectionName="Productos" />;
  }

  const supabase = await createClient();
  const { data: productos } = await supabase
    .from("productos")
    .select("*")
    .order("marca", { ascending: true });

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className="space-y-1">
          <h1 className={styles.title}>Catálogo de Productos</h1>
          <p className="text-slate-500 text-sm">Gestiona los modelos base disponibles</p>
        </div>
        <Link href="/empresa/webapp/stock" className="text-slate-500 hover:text-slate-300 flex items-center gap-2 text-sm transition-colors">
          <span className="material-symbols-outlined text-base">arrow_back</span>
          Volver
        </Link>
      </header>

      <div className={styles.formCard}>
        <h2 className="text-lg font-bold text-white mb-6 ml-1">Agregar Nuevo Producto</h2>
        <StockProductoForm />
      </div>

      <div className="space-y-4">
        <h2 className="text-xl font-bold text-white ml-2 text-center md:text-left">Productos Registrados</h2>
        <ProductosClientView productos={productos || []} />
      </div>
    </div>
  );
}
