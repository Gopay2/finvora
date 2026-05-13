import React from "react";
import Link from "next/link";
import { getUserProfile, isAllowed } from "@/utils/auth-check";
import AccessDenied from "@/components/empresa/AccessDenied";
import StockProductoForm from "@/components/empresa/StockProductoForm";
import { createClient } from "@/utils/supabase/server";
import DeleteProductButton from "@/components/empresa/DeleteProductButton";
import EditProductButton from "@/components/empresa/EditProductButton";

const styles = {
  container: "max-w-6xl mx-auto space-y-10 animate-in fade-in duration-500",
  header: "flex items-center justify-between",
  title: "text-3xl font-bold bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent",
  formCard: "bg-slate-900/40 backdrop-blur-xl border border-slate-800 p-8 rounded-3xl",
  tableWrapper: "bg-slate-900/20 border border-slate-800 rounded-2xl overflow-x-auto custom-scrollbar",
  table: "w-full min-w-[700px]",
  th: "px-6 py-4 text-slate-500 text-[10px] uppercase font-bold border-b border-slate-800 tracking-widest whitespace-nowrap text-center",
  td: "px-6 py-4 text-sm text-slate-300 border-b border-slate-800/50 whitespace-nowrap text-center",
  tr: "hover:bg-white/5 transition-colors",
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
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th className={styles.th}>Marca</th>
                <th className={styles.th}>Modelo</th>
                <th className={styles.th}>Color</th>
                <th className={styles.th}>RAM</th>
                <th className={styles.th}>Alm.</th>
                <th className={styles.th}>Precio</th>
                <th className={styles.th}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {productos && productos.length > 0 ? (
                productos.map((p: any) => (
                  <tr key={p.id} className={styles.tr}>
                    <td className={`${styles.td} font-bold text-white`}>{p.marca}</td>
                    <td className={styles.td}>{p.modelo}</td>
                    <td className={styles.td}>{p.color}</td>
                    <td className={styles.td}>{p.ram}</td>
                    <td className={styles.td}>{p.almacenamiento}</td>
                    <td className={styles.td}>
                      <span className="text-secondary font-mono font-bold">
                        ${new Intl.NumberFormat('es-AR').format(p.precio)}
                      </span>
                    </td>
                    <td className={styles.td}>
                      <div className="flex items-center justify-center gap-2">
                        <EditProductButton product={p} />
                        <DeleteProductButton id={p.id} />
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-6 py-10 text-center text-slate-500 italic">
                    No hay modelos registrados todavía.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
