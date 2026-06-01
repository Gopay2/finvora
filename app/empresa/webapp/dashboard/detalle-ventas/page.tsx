import React from "react";
import Link from "next/link";
import { getUserProfile, isAllowed } from "@/utils/auth-check";
import AccessDenied from "@/components/empresa/AccessDenied";
import { createClient } from "@/utils/supabase/server";
import DownloadExcelButton from "@/components/empresa/DownloadExcelButton";

export const revalidate = 0;

const styles = {
  container: "max-w-7xl mx-auto space-y-8 animate-in fade-in duration-700 pb-12",
  header: "flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-6",
  titleGroup: "space-y-1",
  title: "text-2xl md:text-3xl font-bold bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent",
  actions: "flex items-center justify-end gap-3",
  btnHome: "flex items-center justify-center px-3 md:px-4 py-2.5 bg-slate-800 text-slate-400 border border-slate-700 rounded-xl hover:bg-slate-700 hover:text-white transition-all cursor-pointer",
  tableWrapper: "bg-slate-900/40 backdrop-blur-xl border border-slate-800 rounded-3xl overflow-hidden shadow-2xl",
  table: "w-full text-center border-collapse",
  th: "px-6 py-4 text-slate-500 text-xs uppercase tracking-wider font-bold border-b border-slate-800 text-center",
  td: "px-6 py-4 text-sm text-slate-300 border-b border-slate-800/50 text-center",
  tr: "hover:bg-slate-800/20 transition-colors",
  imeiBadge: "font-mono bg-slate-950 px-2 py-1 rounded border border-slate-800 text-secondary text-xs",
  zonaBadge: "inline-block px-2 py-1 rounded-lg text-[10px] font-bold uppercase bg-blue-500/10 text-blue-400 border border-blue-500/20 whitespace-nowrap",
  userBadge: "inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-slate-800 text-slate-400 text-[10px] font-medium border border-slate-700 whitespace-nowrap",
};

export default async function DetalleVentasPage() {
  const { role: userRole } = await getUserProfile();

  if (!isAllowed(userRole, ["Admin", "Developer", "Supervisor"])) {
    return <AccessDenied role={userRole} sectionName="Detalle de Ventas" />;
  }

  const supabase = await createClient();

  // Fetch ventas with joins
  const { data: ventas, error } = await supabase
    .from("ventas")
    .select(`
      id,
      imei,
      precio_costo,
      fecha_ingreso,
      fecha_venta,
      repartidor:repartidores!zona (
        nombre
      ),
      productos (
        marca,
        modelo,
        color,
        almacenamiento,
        ram
      ),
      vendedor:perfiles (
        username
      )
    `)
    .order('fecha_venta', { ascending: false });

  if (error) {
    console.error("Error cargando ventas:", error);
  }

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.titleGroup}>
          <h1 className={styles.title}>Historial de Ventas</h1>
          <p className="text-slate-500 text-sm">Registro detallado de unidades vendidas</p>
        </div>

        <div className={styles.actions}>
          <DownloadExcelButton 
            data={ventas || []}
            type="ventas"
          />

          <Link href="/empresa/webapp/dashboard" className={styles.btnHome} title="Volver al Dashboard">
            <span className="material-symbols-outlined text-xl">dashboard</span>
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
                <th className={`${styles.th} w-24 md:w-28 whitespace-nowrap`}>Vendedor</th>
                <th className={`${styles.th} w-44 md:w-52 whitespace-nowrap`}>Ubicación</th>
                <th className={styles.th}>Precio Costo</th>
                <th className={styles.th}>Fecha Venta</th>
              </tr>
            </thead>
            <tbody>
              {ventas && ventas.length > 0 ? (
                ventas.map((venta: any) => (
                  <tr key={venta.id} className={styles.tr}>
                    <td className={styles.td}>
                      <span className={styles.imeiBadge}>{venta.imei}</span>
                    </td>
                    <td className={styles.td}>
                      <div className="flex flex-col items-center">
                        <div className="font-bold text-white flex items-center gap-2 justify-center">
                          {venta.productos?.marca} {venta.productos?.modelo}
                          <span className="text-[10px] font-normal text-slate-500 uppercase tracking-widest border-l border-slate-700 pl-2 ml-1">{venta.productos?.color}</span>
                        </div>
                        <div className="flex items-center gap-2 mt-1.5 justify-center">
                          <span className="text-xs font-bold bg-slate-800 text-slate-300 px-2 py-0.5 rounded-md uppercase tracking-tight">RAM {venta.productos?.ram}</span>
                          <span className="text-xs font-bold bg-slate-800 text-slate-300 px-2 py-0.5 rounded-md uppercase tracking-tight">ALM {venta.productos?.almacenamiento}</span>
                        </div>
                      </div>
                    </td>
                    <td className={styles.td}>
                      <div className={styles.userBadge}>
                        <span className="material-symbols-outlined text-[12px]">person</span>
                        {venta.vendedor?.username || 'Desconocido'}
                      </div>
                    </td>
                    <td className={styles.td}>
                      <span className={styles.zonaBadge}>{venta.repartidor?.nombre || 'Sin Asignar'}</span>
                    </td>
                    <td className={styles.td}>
                      <span className="text-secondary font-mono font-bold">
                        ${new Intl.NumberFormat('es-AR').format(venta.precio_costo)}
                      </span>
                    </td>
                    <td className={styles.td}>
                      <div className="flex flex-col items-center gap-0.5">
                        <span className="text-slate-300 text-sm font-medium">
                          {new Date(venta.fecha_venta).toLocaleDateString('es-AR', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric'
                          })}
                        </span>
                        <span className="text-slate-500 text-[10px] uppercase">
                          {new Date(venta.fecha_venta).toLocaleTimeString('es-AR', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-20 text-center text-slate-500 italic text-sm">
                    No se han registrado ventas aún.
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


