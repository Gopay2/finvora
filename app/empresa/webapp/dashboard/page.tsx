import React from "react";
import Link from "next/link";
import { getUserProfile, isAllowed } from "@/utils/auth-check";
import AccessDenied from "@/components/empresa/AccessDenied";
import { createClient } from "@/utils/supabase/server";
import SalesChart from "@/components/empresa/SalesChart";

export const revalidate = 60;

const styles = {
  container: "max-w-7xl mx-auto space-y-8 animate-in fade-in duration-700",
  header: "flex items-center justify-between",
  title: "text-2xl md:text-3xl font-bold bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent",
  btnHome: "flex items-center justify-center px-4 py-2 bg-slate-800 text-slate-400 border border-slate-700 rounded-xl hover:bg-slate-700 hover:text-white transition-all cursor-pointer",

  // KPI Cards Grid
  kpiGrid: "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4 md:gap-6",
  kpiCard: "bg-slate-900/40 backdrop-blur-xl border border-slate-800 p-4 sm:p-5 rounded-2xl flex flex-col items-center justify-center space-y-1 hover:border-secondary/30 transition-all",
  kpiValue: "text-xs sm:text-sm md:text-base font-bold text-white text-center break-words line-clamp-2 w-full",
  kpiLabel: "text-[8px] sm:text-[10px] uppercase tracking-widest text-slate-500 font-bold text-center",

  // Main Dashboard Layout
  mainGrid: "grid grid-cols-1 lg:grid-cols-5 gap-6 items-stretch",
  largeCard: "lg:col-span-3 bg-slate-900/40 backdrop-blur-xl border border-slate-800 p-4 sm:p-8 rounded-[2rem] sm:rounded-[2.5rem] relative overflow-hidden h-[22rem] sm:h-80 flex flex-col",
  sideColumn: "lg:col-span-2 flex flex-col",
  smallCard: "bg-slate-900/40 backdrop-blur-xl border border-slate-800 p-4 sm:p-8 rounded-[2rem] sm:rounded-[2.5rem] flex flex-col items-center justify-center h-80",
};



// Componente para el gráfico de torta dinámico
const PerformancePieChart = ({ topSales, totalSales }: { topSales: number, totalSales: number }) => {
  if (totalSales === 0) {
    return (
      <div className="flex-1 w-full flex items-center justify-center min-h-0">
        <span className="text-slate-500 text-sm font-bold uppercase tracking-wider">Sin ventas</span>
      </div>
    );
  }

  const topPct = topSales / totalSales;
  const restPct = 1 - topPct;
  
  const radius = 25;
  const circumference = 2 * Math.PI * radius;
  const topDash = topPct * circumference;

  const getLabelPos = (pct: number) => {
    const angle = pct * 2 * Math.PI;
    const x = 50 + Math.cos(angle) * 28; // Radio para el texto ajustado a 28
    const y = 50 + Math.sin(angle) * 28;
    return { x, y };
  };

  const topPos = getLabelPos(topPct / 2);
  const restPos = getLabelPos(topPct + restPct / 2);

  return (
    <div className="flex-1 w-full flex items-center justify-center min-h-0">
      <svg viewBox="0 0 100 100" className="w-full h-full max-w-[220px] max-h-[220px] transform -rotate-90 drop-shadow-2xl">
        {/* Resto de vendedores (fondo completo) */}
        <circle 
          r={radius} cx="50" cy="50" 
          fill="transparent" 
          stroke="#3b82f6" 
          strokeWidth="50" 
          className="hover:opacity-80 transition-opacity" 
        />
        {/* Mejor vendedor (porción superior) */}
        {topPct > 0 && (
          <circle 
            r={radius} cx="50" cy="50" 
            fill="transparent" 
            stroke="#10b981" 
            strokeWidth="50" 
            strokeDasharray={`${topDash} ${circumference}`} 
            strokeDashoffset="0" 
            className="hover:opacity-80 transition-opacity" 
          />
        )}
        
        {/* Textos */}
        {restPct > 0.05 && (
          <text 
            x={restPos.x} y={restPos.y} 
            fill="#001c3a" fontSize="11" fontWeight="black" 
            textAnchor="middle" dominantBaseline="central"
            transform={`rotate(90 ${restPos.x} ${restPos.y})`} 
            className="pointer-events-none"
          >
            {Math.round(restPct * 100)}%
          </text>
        )}
        {topPct > 0.05 && (
          <text 
            x={topPos.x} y={topPos.y} 
            fill="#001f27" fontSize="11" fontWeight="black" 
            textAnchor="middle" dominantBaseline="central"
            transform={`rotate(90 ${topPos.x} ${topPos.y})`} 
            className="pointer-events-none"
          >
            {Math.round(topPct * 100)}%
          </text>
        )}
      </svg>
    </div>
  );
};

export default async function DashboardPage() {
  const { role: userRole } = await getUserProfile();

  if (!isAllowed(userRole, ["Admin", "Developer"])) {
    return <AccessDenied role={userRole} sectionName="Dashboard" />;
  }

  const supabase = await createClient();

  // 1. Obtener todas las ventas
  const { data: allSales } = await supabase
    .from("ventas")
    .select(`
      fecha_venta,
      vendedor:perfiles(username),
      productos(marca, modelo)
    `);

  const sales = allSales || [];

  // 2. Configurar Fechas (Zona Horaria México - America/Mexico_City)
  const now = new Date();
  
  const getMexicoDateString = (date: Date) => 
    new Intl.DateTimeFormat('en-CA', {
      timeZone: 'America/Mexico_City',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).format(date);

  const mexicoTodayStr = getMexicoDateString(now);

  // Calcular inicio de semana (Lunes) en México
  const mexicoNowStr = now.toLocaleString('en-US', { timeZone: 'America/Mexico_City' });
  const tempDate = new Date(mexicoNowStr);
  const dayOfWeek = tempDate.getDay(); // 0: Dom, 1: Lun, ...
  const diffToMonday = (dayOfWeek === 0 ? 6 : dayOfWeek - 1);
  const startOfWeek = new Date(tempDate);
  startOfWeek.setDate(tempDate.getDate() - diffToMonday);
  startOfWeek.setHours(0, 0, 0, 0);
  
  // 3. Procesar Métricas
  let ventasHoy = 0;
  let ventasSemana = 0;
  const vendedoresStats: Record<string, number> = {};
  const productosStats: Record<string, number> = {};

  sales.forEach((sale: any) => {
    const saleDate = new Date(sale.fecha_venta);
    const saleDateStr = getMexicoDateString(saleDate);
    
    // Hoy en México
    if (saleDateStr === mexicoTodayStr) {
      ventasHoy++;
    }

    // Esta Semana en México (desde el lunes a las 00:00)
    const saleDateMexicoStr = saleDate.toLocaleString('en-US', { timeZone: 'America/Mexico_City' });
    const saleDateMexico = new Date(saleDateMexicoStr);
    if (saleDateMexico >= startOfWeek) {
      ventasSemana++;
    }

    // Estadísticas para "Mejor"
    const vName = (sale.vendedor as any)?.username || "Desconocido";
    vendedoresStats[vName] = (vendedoresStats[vName] || 0) + 1;

    const pName = sale.productos ? `${(sale.productos as any).marca} ${(sale.productos as any).modelo}` : "Desconocido";
    productosStats[pName] = (productosStats[pName] || 0) + 1;
  });

  // Determinar ganadores
  const sortedVendedores = Object.entries(vendedoresStats).sort((a, b) => b[1] - a[1]);
  const mejorVendedorRaw = sortedVendedores[0]?.[0] || "---";
  const mejorVendedorCount = sortedVendedores[0]?.[1] || 0;

  const mejorVendedor = mejorVendedorRaw !== "---" 
    ? mejorVendedorRaw.charAt(0).toUpperCase() + mejorVendedorRaw.slice(1)
    : "---";
  const celularMasVendido = Object.entries(productosStats).sort((a, b) => b[1] - a[1])[0]?.[0] || "---";

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

      {/* Fila Superior: 5 KPIs con datos Reales */}
      <div className={styles.kpiGrid}>
        <Link 
          href="/empresa/webapp/dashboard/detalle-ventas" 
          className={`${styles.kpiCard} group relative overflow-hidden border-emerald-500/40 shadow-[0_0_25px_rgba(16,185,129,0.15)] hover:shadow-[0_0_35px_rgba(16,185,129,0.25)] hover:bg-emerald-500/10 transition-all duration-500 cursor-pointer`}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-emerald-400/20 to-transparent -translate-x-full animate-shimmer-smooth pointer-events-none w-[200%]" />
          <span className={`${styles.kpiValue} text-emerald-400 group-hover:text-emerald-200 transition-colors`}>Detalle ventas</span>
          <span className="material-symbols-outlined text-emerald-500/50 absolute top-2 right-2 text-sm opacity-40 group-hover:opacity-100 transition-opacity">open_in_new</span>
        </Link>
        
        <div className={styles.kpiCard}>
          <span className={styles.kpiValue}>{ventasHoy}</span>
          <span className={styles.kpiLabel}>Ventas Hoy</span>
        </div>
        
        <div className={styles.kpiCard}>
          <span className={styles.kpiValue}>{ventasSemana}</span>
          <span className={styles.kpiLabel}>Ventas Semana</span>
        </div>
        
        <div className={styles.kpiCard}>
          <span className={styles.kpiValue}>{mejorVendedor}</span>
          <span className={styles.kpiLabel}>Mejor vendedor</span>
        </div>
        
        <div className={styles.kpiCard}>
          <span className={styles.kpiValue}>{celularMasVendido}</span>
          <span className={styles.kpiLabel}>Celular mas vendido</span>
        </div>
      </div>

      {/* Cuerpo Principal: Gráficos (Mock por ahora) */}
      <div className={styles.mainGrid}>
        {/* Gráfico de Ventas Dinámico (Client Component) */}
        <div className={styles.largeCard}>
          <SalesChart sales={sales} />
        </div>

        <div className={styles.sideColumn}>
          <div className={styles.smallCard}>
            <div className="text-center mb-4">
              <h4 className="text-slate-500 text-xs font-bold uppercase tracking-[0.2em] mb-1">Top Closers</h4>
              <p className="text-white font-black text-2xl">Rendimiento</p>
            </div>
            <PerformancePieChart topSales={mejorVendedorCount} totalSales={sales.length} />
            <div className="flex gap-6 mt-6">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-emerald-500 shadow-lg shadow-emerald-500/20"></div>
                <span className="text-[10px] text-slate-400 font-bold uppercase">Mejor vendedor</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-blue-500 shadow-lg shadow-blue-500/20"></div>
                <span className="text-[10px] text-slate-400 font-bold uppercase">Resto de vendedores</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
