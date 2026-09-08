import React from "react";
import Link from "next/link";
import { getUserProfile, isAllowed } from "@/utils/auth-check";
import AccessDenied from "@/components/empresa/AccessDenied";

export const revalidate = 0;

const styles = {
  container: "max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500",
  header: "flex items-center justify-between",
  titleGroup: "space-y-1",
  title: "text-2xl md:text-3xl font-bold bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent",
  subtitle: "text-slate-500 text-sm",
  btnHome: "flex items-center justify-center px-4 py-2 bg-slate-800 text-slate-400 border border-slate-700 rounded-xl hover:bg-slate-700 hover:text-white transition-all cursor-pointer",
  listContainer: "flex flex-col gap-3 pt-2",
  rowCard: "group flex items-center justify-between p-3.5 sm:p-4 px-5 sm:px-6 bg-[#060b18] hover:bg-[#0b1326] border border-[#16233a] hover:border-slate-700/80 rounded-2xl sm:rounded-[22px] min-h-[76px] sm:min-h-[84px] transition-all duration-200 cursor-pointer shadow-lg shadow-black/30",
  iconBox: "w-14 h-14 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl bg-[#0c1424] border border-[#1c2a44] flex items-center justify-center shrink-0 shadow-inner group-hover:border-sky-500/40 transition-colors",
  rowText: "text-lg sm:text-xl md:text-[22px] font-light tracking-wide text-slate-100 flex-1 ml-4 sm:ml-6 text-left group-hover:text-white transition-colors",
  chevronIcon: "w-5 h-5 text-slate-400 group-hover:text-white group-hover:translate-x-1 transition-all shrink-0 mr-1 sm:mr-2",
};

export default async function InventarioPage() {
  const { role: userRole } = await getUserProfile();

  if (!isAllowed(userRole, ["Admin", "Supervisor", "Closer", "Cambaceador", "Repartidor", "Developer", "CambaCloser", "Bodega", "JCI"])) {
    return <AccessDenied role={userRole} sectionName="Inventario" />;
  }

  const canAccessRecibo = isAllowed(userRole, ["Admin", "Supervisor", "Developer", "Bodega", "JCI"]);
  const canAccessStock = isAllowed(userRole, ["Admin", "Supervisor", "Closer", "Cambaceador", "Repartidor", "Developer", "CambaCloser", "JCI"]);
  const canAccessJci = isAllowed(userRole, ["Admin", "Supervisor", "Developer", "JCI"]);

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.titleGroup}>
          <h1 className={styles.title}>Inventario</h1>
          <p className={styles.subtitle}>Control centralizado de equipos, auditoría y recepción</p>
        </div>
        <Link href="/empresa/webapp" className={styles.btnHome} title="Volver al Inicio">
          <span className="material-symbols-outlined text-xl">home</span>
        </Link>
      </header>

      {/* Submenú en formato de filas con los iconos, proporciones y tipografía exacta de la referencia */}
      <div className={styles.listContainer}>
        
        {/* 1. Recibo */}
        {canAccessRecibo && (
          <Link href="/empresa/webapp/inventario/recibo" className={styles.rowCard}>
            <div className={styles.iconBox}>
              <svg
                className="w-8 h-8 sm:w-9 sm:h-9 text-[#a5c4ec] group-hover:text-sky-200 transition-colors"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.85"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                {/* Contorno exterior de la caja con tapa trapezoidal y esquinas redondeadas */}
                <path d="M3 9l3.4-5.2h11.2l3.4 5.2v8.8a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3V9z" />
                {/* Línea horizontal continua que separa la tapa del cuerpo */}
                <path d="M3 9h18" />
                {/* Solapa / listón central colgante con corte en V invertida */}
                <path d="M9.3 9v5l2.7-1.5 2.7 1.5V9" />
              </svg>
            </div>
            <span 
              className={styles.rowText} 
              style={{ fontFamily: "var(--font-outfit), sans-serif", fontWeight: 300 }}
            >
              Recibo
            </span>
            <svg className={styles.chevronIcon} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.75">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        )}

        {/* 2. Stock disponible */}
        {canAccessStock && (
          <Link href="/empresa/webapp/inventario/stock" className={styles.rowCard}>
            <div className={styles.iconBox}>
              <svg
                className="w-8 h-8 sm:w-9 sm:h-9 text-[#a5c4ec] group-hover:text-sky-200 transition-colors"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.85"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                {/* Contorno exterior del cubo y caras inferiores */}
                <path d="M20 7.8v8.4l-8 4.3-8-4.3V7.8" />
                <path d="M12 12.1v8.4" />
                {/* Cara superior */}
                <path d="M12 3.5l8 4.3-8 4.3-8-4.3z" />
                {/* Línea divisoria única en la cara superior */}
                <path d="M8 5.65l8 4.3" />
              </svg>
            </div>
            <span 
              className={styles.rowText} 
              style={{ fontFamily: "var(--font-outfit), sans-serif", fontWeight: 300 }}
            >
              Stock disponible
            </span>
            <svg className={styles.chevronIcon} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.75">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        )}

        {/* 3. JCI (Jefe de Control de Inventarios) */}
        {canAccessJci && (
          <Link href="/empresa/webapp/inventario/jci" className={styles.rowCard}>
            <div className={styles.iconBox}>
              <svg
                className="w-8 h-8 sm:w-9 sm:h-9 text-[#a5c4ec] group-hover:text-sky-200 transition-colors"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.85"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                {/* Contorno de tabla con esquinas redondeadas */}
                <rect x="4.5" y="5.5" width="15" height="15.5" rx="3" />
                {/* Clip superior con pestaña */}
                <path d="M9 5.5a1.5 1.5 0 0 1 1.5-1.5h3A1.5 1.5 0 0 1 15 5.5v.5H9v-.5z" />
                {/* Checkmark en el centro */}
                <path d="M9 13.5l2 2 4-4" />
              </svg>
            </div>
            <span 
              className={styles.rowText} 
              style={{ fontFamily: "var(--font-outfit), sans-serif", fontWeight: 300 }}
            >
              JCI (Jefe de Control de Inventarios)
            </span>
            <svg className={styles.chevronIcon} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.75">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        )}

      </div>
    </div>
  );
}
