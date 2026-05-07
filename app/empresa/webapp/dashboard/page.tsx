import React from "react";
import Link from "next/link";
import { getUserProfile, isAllowed } from "@/utils/auth-check";
import AccessDenied from "@/components/empresa/AccessDenied";

export const revalidate = 60;

const styles = {
  container: "max-w-6xl mx-auto space-y-10",
  header: "flex items-center justify-between",
  title: "text-xl md:text-3xl font-bold bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent",
  grid: "grid grid-cols-1 md:grid-cols-3 gap-6",
  statCard: "bg-slate-900/40 backdrop-blur-xl border border-slate-800 p-8 rounded-3xl space-y-2",
  statLabel: "text-slate-500 text-sm font-medium",
  statValue: "text-4xl font-bold text-secondary",
};

export default async function DashboardPage() {
  const { role: userRole } = await getUserProfile();

  if (!isAllowed(userRole, ["Admin"])) {
    return <AccessDenied role={userRole} sectionName="Dashboard" />;
  }

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h2 className={styles.title}>Métricas de Negocio</h2>
        <Link href="/empresa/webapp" className="text-slate-500 hover:text-slate-300 flex items-center gap-2 text-sm transition-colors">
          <span className="material-symbols-outlined text-base">arrow_back</span>
          Volver
        </Link>
      </header>

      <div className={styles.grid}>
        <div className={styles.statCard}>
          <p className={styles.statLabel}>Ventas del Mes</p>
          <p className={styles.statValue}>124</p>
        </div>
        <div className={styles.statCard}>
          <p className={styles.statLabel}>Ingresos Totales</p>
          <p className={styles.statValue}>$1.2M</p>
        </div>
        <div className={styles.statCard}>
          <p className={styles.statLabel}>Usuarios Activos</p>
          <p className={styles.statValue}>18</p>
        </div>
      </div>
      
      <div className="h-64 bg-slate-900/20 border border-dashed border-slate-800 rounded-3xl flex items-center justify-center text-slate-600">
         Gráfico de rendimiento (Próximamente)
      </div>
    </div>
  );
}
