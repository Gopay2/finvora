import React from "react";
import Link from "next/link";
import { getUserProfile, isAllowed } from "@/utils/auth-check";
import AccessDenied from "@/components/empresa/AccessDenied";
import { createClient } from "@/utils/supabase/server";
import StockStatusSelector from "@/components/empresa/StockStatusSelector";
import StockZoneSelector from "@/components/empresa/StockZoneSelector";
import DownloadExcelButton from "@/components/empresa/DownloadExcelButton";
import { getVendedores } from "@/app/empresa/webapp/stock/stock-actions";
import DeleteStockButton from "@/components/empresa/DeleteStockButton";

export const revalidate = 0;

const styles = {
  container: "max-w-6xl mx-auto space-y-8 animate-in fade-in duration-700",
  header: "flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-6",
  titleGroup: "space-y-1",
  title: "text-2xl md:text-3xl font-bold bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent",
  actions: "flex items-center justify-center md:justify-end gap-4 md:gap-3",
  btnPrimary: "flex items-center justify-center gap-1.5 md:gap-2 px-3 md:px-5 py-2.5 bg-secondary text-slate-950 font-bold rounded-xl hover:bg-secondary/90 border border-transparent transition-all text-xs md:text-sm cursor-pointer whitespace-nowrap",
  btnOutline: "flex items-center justify-center gap-1.5 md:gap-2 px-3 md:px-5 py-2.5 bg-slate-800 text-slate-200 border border-slate-700 rounded-xl hover:bg-slate-700 transition-all text-xs md:text-sm cursor-pointer whitespace-nowrap",
  btnHome: "flex items-center justify-center px-3 md:px-4 py-2.5 bg-slate-800 text-slate-400 border border-slate-700 rounded-xl hover:bg-slate-700 hover:text-white transition-all cursor-pointer",
  tableWrapper: "bg-slate-900/40 backdrop-blur-xl border border-slate-800 rounded-3xl overflow-hidden",
  table: "w-full text-center border-collapse",
  th: "px-6 py-4 text-slate-500 text-xs uppercase tracking-wider font-bold border-b border-slate-800 text-center",
  td: "px-6 py-4 text-sm text-slate-300 border-b border-slate-800/50 text-center",
  tr: "hover:bg-slate-800/20 transition-colors",
  imeiBadge: "font-mono bg-slate-950 px-2 py-1 rounded border border-slate-800 text-secondary text-xs",
  zonaBadge: "px-2 py-1 rounded-lg text-[10px] font-bold uppercase bg-blue-500/10 text-blue-400 border border-blue-500/20",
};

export default async function StockPage() {
  const { role: userRole } = await getUserProfile();
  const canEdit = isAllowed(userRole, ["Admin", "Supervisor", "Developer"]);

  if (!isAllowed(userRole, ["Admin", "Supervisor", "Closer", "Developer"])) {
    return <AccessDenied role={userRole} sectionName="Stock de Ventas" />;
  }

  const supabase = await createClient();
  const vendedores = await getVendedores();

  const query = supabase
    .from("stock")
    .select(`
      imei,
      zona,
      estado,
      fecha_ingreso,
      productos (
        marca,
        modelo,
        color,
        almacenamiento,
        ram
      )
    `)
    .order('fecha_ingreso', { ascending: false });

  if (userRole === "Closer") {
    query.neq('estado', 'A consultar').neq('estado', 'En envío');
  }

  const { data: unidades, error } = await query;

  if (error) {
    console.error("Error cargando inventario:", error);
  }

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.titleGroup}>
          <h1 className={styles.title}>Stock Disponible</h1>
          <p className="text-slate-500 text-sm">Listado detallado de unidades disponibles</p>
        </div>

        <div className={styles.actions}>
          {canEdit && (
            <>
              <Link href="/empresa/webapp/stock/productos" className={styles.btnPrimary} title="Catálogo de Productos">
                <span className="material-symbols-outlined text-lg">smartphone</span>
                Productos
              </Link>
              <Link href="/empresa/webapp/stock/cargar" className={styles.btnOutline} title="Cargar nuevo Stock">
                <span className="material-symbols-outlined text-lg">inventory_2</span>
                Stock
              </Link>
              <DownloadExcelButton 
                data={unidades || []}
                type="stock"
              />
            </>
          )}
          <Link href="/empresa/webapp" className={styles.btnHome} title="Volver al Inicio">
            <span className="material-symbols-outlined text-xl">home</span>
          </Link>
        </div>
      </header>

      <div className={styles.tableWrapper}>
        <div className="overflow-x-auto custom-scrollbar">
          <table className={styles.table}>
            <thead>
              <tr>
                <th className={styles.th}>IMEI</th>
                <th className={styles.th}>Producto</th>
                <th className={styles.th}>Ubicación</th>
                <th className={styles.th}>Estado</th>
                <th className={styles.th}>Fecha Ingreso</th>
                {canEdit && <th className={styles.th}>Acciones</th>}
              </tr>
            </thead>
            <tbody>
              {unidades && unidades.length > 0 ? (
                unidades.map((item: any) => (
                  <tr key={item.imei} className={styles.tr}>
                    <td className={styles.td}>
                      <span className={styles.imeiBadge}>{item.imei}</span>
                    </td>
                    <td className={styles.td}>
                      <div className="flex flex-col items-center">
                        <div className="font-bold text-white flex items-center gap-2 justify-center">
                          {item.productos?.marca} {item.productos?.modelo}
                          <span className="text-[10px] font-normal text-slate-500 uppercase tracking-widest border-l border-slate-700 pl-2 ml-1">{item.productos?.color}</span>
                        </div>
                        <div className="flex items-center gap-2 mt-1.5 justify-center">
                          <span className="text-xs font-bold bg-slate-800 text-slate-300 px-2 py-0.5 rounded-md uppercase tracking-tight">RAM {item.productos?.ram}</span>
                          <span className="text-xs font-bold bg-slate-800 text-slate-300 px-2 py-0.5 rounded-md uppercase tracking-tight">ALM {item.productos?.almacenamiento}</span>
                        </div>
                      </div>
                    </td>
                    <td className={styles.td}>
                      <StockZoneSelector
                        imei={item.imei}
                        zonaActual={item.zona}
                        disabled={!canEdit}
                      />
                    </td>
                    <td className={styles.td}>
                      <div className="flex flex-col items-center gap-1">
                        <StockStatusSelector
                          imei={item.imei}
                          estadoActual={item.estado}
                          disabled={!canEdit}
                          vendedores={vendedores}
                        />
                      </div>
                    </td>
                    <td className={styles.td}>
                      <span className="text-slate-500 text-xs">
                        {new Date(item.fecha_ingreso).toLocaleDateString('es-AR', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric'
                        })}
                      </span>
                    </td>
                    {canEdit && (
                      <td className={styles.td}>
                        <div className="flex items-center justify-center">
                          <DeleteStockButton imei={item.imei} />
                        </div>
                      </td>
                    )}
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={canEdit ? 6 : 5} className="px-6 py-20 text-center text-slate-500 italic">
                    No hay unidades cargadas. Agregue en la seccion Stock
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
