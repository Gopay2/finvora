import React from "react";
import Link from "next/link";
import { getUserProfile, isAllowed } from "@/utils/auth-check";
import AccessDenied from "@/components/empresa/AccessDenied";

export const revalidate = 60;

const styles = {
  container: "max-w-7xl mx-auto space-y-8 animate-in fade-in duration-700",
  header: "flex items-center justify-between",
  title: "text-2xl md:text-3xl font-bold bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent",
  btnHome: "flex items-center justify-center px-4 py-2 bg-slate-800 text-slate-400 border border-slate-700 rounded-xl hover:bg-slate-700 hover:text-white transition-all cursor-pointer",

  // KPI Cards Grid
  kpiGrid: "grid grid-cols-2 md:grid-cols-5 gap-6",
  kpiCard: "bg-slate-900/40 backdrop-blur-xl border border-slate-800 p-5 rounded-2xl flex flex-col items-center justify-center space-y-1 hover:border-secondary/30 transition-all",
  kpiValue: "text-xl font-bold text-white",
  kpiLabel: "text-[10px] uppercase tracking-widest text-slate-500 font-bold",

  // Main Dashboard Layout
  mainGrid: "grid grid-cols-1 lg:grid-cols-5 gap-6 items-stretch",
  largeCard: "lg:col-span-3 bg-slate-900/40 backdrop-blur-xl border border-slate-800 p-8 rounded-[2.5rem] relative overflow-hidden h-80 flex flex-col",
  sideColumn: "lg:col-span-2 flex flex-col",
  smallCard: "bg-slate-900/40 backdrop-blur-xl border border-slate-800 p-8 rounded-[2.5rem] flex flex-col items-center justify-center h-80",
};

// Componente para el gráfico de línea (Mock SVG)
const LineChartMock = () => (
  <svg viewBox="0 0 400 120" className="w-full h-full drop-shadow-2xl" preserveAspectRatio="none">
    <defs>
      <linearGradient id="lineGradient" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="var(--color-secondary)" stopOpacity="0.4" />
        <stop offset="100%" stopColor="var(--color-secondary)" stopOpacity="0" />
      </linearGradient>
    </defs>
    <path
      d="M0,100 L40,80 L80,95 L120,60 L160,75 L200,40 L240,55 L280,20 L320,35 L360,5 L400,20"
      fill="none"
      stroke="var(--color-secondary)"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="animate-pulse"
    />
    <path
      d="M0,100 L40,80 L80,95 L120,60 L160,75 L200,40 L240,55 L280,20 L320,35 L360,5 L400,20 L400,120 L0,120 Z"
      fill="url(#lineGradient)"
    />
  </svg>
);

// Componente para el gráfico de torta (Mock SVG)
const PieChartMock = ({ segments = 2 }: { segments?: number }) => {
  if (segments === 2) {
    return (
      <div className="flex-1 w-full flex items-center justify-center min-h-0">
        <svg viewBox="0 0 100 100" className="w-full h-full max-w-[220px] max-h-[220px] transform -rotate-90 drop-shadow-2xl">
          {/* Slice 1: 70% (252 degrees) - VERDE */}
          <path d="M 50 50 L 50 1 A 49 49 0 1 1 3.4 65.14 Z" fill="#10b981" className="hover:opacity-80 transition-opacity" />
          <text x="75" y="55" fill="#001f27" fontSize="11" fontWeight="black" transform="rotate(90 75 55)" className="pointer-events-none">70%</text>
          
          {/* Slice 2: 30% - AZUL */}
          <path d="M 50 50 L 3.4 65.14 A 49 49 0 0 1 50 1 Z" fill="#3b82f6" className="hover:opacity-80 transition-opacity" />
          <text x="25" y="25" fill="#001c3a" fontSize="11" fontWeight="black" transform="rotate(90 25 25)" className="pointer-events-none">30%</text>
        </svg>
      </div>
    );
  }
  return null;
};

export default async function DashboardPage() {
  const { role: userRole } = await getUserProfile();

  if (!isAllowed(userRole, ["Admin", "Developer", "Supervisor"])) {
    return <AccessDenied role={userRole} sectionName="Dashboard" />;
  }

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className="space-y-1">
          <h2 className={styles.title}>Panel de Control</h2>
          <p className="text-slate-500 text-sm">Resumen operativo y métricas en tiempo real</p>
        </div>
        <Link href="/empresa/webapp" className={styles.btnHome} title="Volver al Inicio">
          <span className="material-symbols-outlined text-xl">home</span>
        </Link>
      </header>

      {/* Fila Superior: 5 KPIs */}
      <div className={styles.kpiGrid}>
        <Link 
          href="/empresa/webapp/dashboard/detalle-ventas" 
          className={`${styles.kpiCard} group relative overflow-hidden border-emerald-500/40 shadow-[0_0_25px_rgba(16,185,129,0.15)] hover:shadow-[0_0_35px_rgba(16,185,129,0.25)] hover:bg-emerald-500/10 transition-all duration-500 cursor-pointer`}
        >
          {/* Brillo con movimiento CONSTANTE y suave */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-emerald-400/20 to-transparent -translate-x-full animate-shimmer-smooth pointer-events-none w-[200%]" />
          <span className={`${styles.kpiValue} text-emerald-400 group-hover:text-emerald-200 transition-colors`}>Detalle ventas</span>
          <span className="material-symbols-outlined text-emerald-500/50 absolute top-2 right-2 text-sm opacity-40 group-hover:opacity-100 transition-opacity">open_in_new</span>
        </Link>
        <div className={styles.kpiCard}>
          <span className={styles.kpiValue}>200</span>
          <span className={styles.kpiLabel}>Ventas Hoy</span>
        </div>
        <div className={styles.kpiCard}>
          <span className={styles.kpiValue}>2000</span>
          <span className={styles.kpiLabel}>Ventas Semana</span>
        </div>
        <div className={styles.kpiCard}>
          <span className={styles.kpiValue}>Juancho</span>
          <span className={styles.kpiLabel}>Mejor vendedor</span>
        </div>
        <div className={styles.kpiCard}>
          <span className={styles.kpiValue}>iPhone 15</span>
          <span className={styles.kpiLabel}>Celular mas vendido</span>
        </div>
      </div>

      {/* Cuerpo Principal: Gráficos */}
      <div className={styles.mainGrid}>
        
        {/* Gráfico de Línea Grande */}
        <div className={styles.largeCard}>
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xl font-bold text-white tracking-tight">Datos de ventas proximamente</h3>
            <div className="flex gap-2">
              <span className="px-3 py-1 bg-secondary/10 text-secondary text-[10px] font-bold rounded-full border border-secondary/20">Semanal</span>
            </div>
          </div>
          <div className="flex-1 min-h-0">
            <LineChartMock />
          </div>
          <div className="flex justify-between mt-6 text-slate-600 text-[10px] font-bold uppercase tracking-widest px-2">
            <span>Lun</span>
            <span>Mar</span>
            <span>Mie</span>
            <span>Jue</span>
            <span>Vie</span>
            <span>Sab</span>
            <span>Dom</span>
          </div>
        </div>

        {/* Columna Lateral: Tortas */}
        <div className={styles.sideColumn}>
          <div className={styles.smallCard}>
            <div className="text-center mb-4">
              <h4 className="text-slate-500 text-xs font-bold uppercase tracking-[0.2em] mb-1">Porcentaje de Ventas</h4>
              <p className="text-white font-black text-2xl">Closers</p>
            </div>
            <PieChartMock segments={2} />
            <div className="flex gap-10 mt-6">
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 rounded-full bg-emerald-500 shadow-lg shadow-emerald-500/20"></div>
                <span className="text-sm text-slate-400 font-bold uppercase">Juancho</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 rounded-full bg-blue-500 shadow-lg shadow-blue-500/20"></div>
                <span className="text-sm text-slate-400 font-bold uppercase">Mariano</span>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
