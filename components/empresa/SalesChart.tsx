'use client';

import React, { useState, useMemo } from 'react';

// ─── Interfaces y Tipos ──────────────────────────────────────────────────────
interface Sale {
  fecha_venta: string;
  [key: string]: any;
}

interface SalesChartProps {
  sales: Sale[];
  viewMode: 'semanal' | 'mensual' | 'anual' | 'historico';
  startDateStr?: string; // Fecha de inicio del filtro actual
  weekParam?: string; // El filtro de semana seleccionado ('actual', 'anterior', 'S1', etc.)
}

// ─── Helpers de Timezone Tijuana ──────────────────────────────────────────────
/** Devuelve la fecha YYYY-MM-DD en timezone de Tijuana (America/Tijuana) */
function toTijuanaDateStr(date: Date): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Tijuana',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(date);
}

/** Extrae año, mes (0-11) y día en timezone de Tijuana */
function getTijuanaParts(date: Date): { year: number; month: number; day: number } {
  const str = toTijuanaDateStr(date);
  const [y, m, d] = str.split('-').map(Number);
  return { year: y, month: m - 1, day: d };
}

// ─── Componente Principal ──────────────────────────────────────────────────
export default function SalesChart({ sales, viewMode, startDateStr, weekParam }: SalesChartProps) {
  // Estado local para controlar el punto sobre el que el usuario hace hover
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  // Agrupar y formatear los datos del gráfico según el período seleccionado
  const chartData = useMemo(() => {
    const rawData = (() => {
      // Si no hay fecha de inicio, es vista histórica
      if (!startDateStr || viewMode === 'historico') {
        const yearlyStats: Record<string, number> = {};
        
        sales.forEach(sale => {
          const year = toTijuanaDateStr(new Date(sale.fecha_venta)).slice(0, 4);
          yearlyStats[year] = (yearlyStats[year] || 0) + 1;
        });

        // Asegurar que si no hay datos, al menos mostramos años lógicos
        const years = Object.keys(yearlyStats);
        if (years.length === 0) {
          const currentYear = new Date().getFullYear();
          return [
            { label: (currentYear - 1).toString(), value: 0 },
            { label: currentYear.toString(), value: 0 },
          ];
        }

        return Object.entries(yearlyStats)
          .sort((a, b) => parseInt(a[0]) - parseInt(b[0]))
          .map(([year, count]) => ({ label: year, value: count }));
      }

      const startDate = new Date(startDateStr);

      // 1. VISTA SEMANAL: Detalle de Lunes a Domingo
      if (viewMode === 'semanal') {
        const days = ['Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab', 'Dom'];
        
        // Obtenemos los componentes de fecha del lunes en Tijuana (startDate)
        const startTijuanaStr = toTijuanaDateStr(startDate);
        const [startY, startM, startD] = startTijuanaStr.split('-').map(Number);

        // Creamos una fecha auxiliar de referencia puramente en UTC
        const refUtcDate = new Date(Date.UTC(startY, startM - 1, startD));
        const targetMonth = startM - 1; // Mes de la semana seleccionada en Tijuana

        const data = days.map((day, index) => {
          // Generamos el día sumando index de forma matemática en UTC
          const dayUtc = new Date(refUtcDate);
          dayUtc.setUTCDate(refUtcDate.getUTCDate() + index);
          
          // Ahora construimos el string YYYY-MM-DD en Tijuana
          const dayStr = `${dayUtc.getUTCFullYear()}-${String(dayUtc.getUTCMonth() + 1).padStart(2, '0')}-${String(dayUtc.getUTCDate()).padStart(2, '0')}`;
          
          return {
            label: `${day} ${String(dayUtc.getUTCDate()).padStart(2, '0')}`,
            dateStr: dayStr,
            monthIndex: dayUtc.getUTCMonth(),
            value: 0
          };
        });

        // Solo se filtra por mes si el filtro corresponde a una semana del calendario específica (S1-S6)
        const shouldFilterByMonth = weekParam && weekParam.startsWith('S');
        const filteredData = shouldFilterByMonth
          ? data.filter(d => d.monthIndex === targetMonth)
          : data;

        sales.forEach(sale => {
          const saleDateStr = toTijuanaDateStr(new Date(sale.fecha_venta));
          const found = filteredData.find(d => d.dateStr === saleDateStr);
          if (found) {
            found.value++;
          }
        });
        return filteredData;
      }

      // 2. VISTA MENSUAL: Detalle de los días del mes (1 al 28/30/31)
      if (viewMode === 'mensual') {
        const startParts = getTijuanaParts(startDate);
        const daysInMonth = new Date(startParts.year, startParts.month + 1, 0).getDate();
        const data = Array.from({ length: daysInMonth }, (_, i) => {
          return {
            label: `${i + 1}`,
            dateStr: `${startParts.year}-${String(startParts.month + 1).padStart(2, '0')}-${String(i + 1).padStart(2, '0')}`,
            value: 0
          };
        });

        sales.forEach(sale => {
          const saleDateStr = toTijuanaDateStr(new Date(sale.fecha_venta));
          const found = data.find(d => d.dateStr === saleDateStr);
          if (found) {
            found.value++;
          }
        });
        return data;
      }

      // 3. VISTA ANUAL: Detalle por meses (Enero a Diciembre)
      if (viewMode === 'anual') {
        const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
        const data = months.map((m, index) => ({
          label: m,
          monthIndex: index,
          value: 0
        }));

        const targetYear = getTijuanaParts(startDate).year;
        sales.forEach(sale => {
          const saleParts = getTijuanaParts(new Date(sale.fecha_venta));
          if (saleParts.year === targetYear) {
            data[saleParts.month].value++;
          }
        });
        return data;
      }

      return [];
    })();

    // Evitar divisiones por cero si hay exactamente 1 punto en los datos procesados
    if (rawData.length === 1) {
      const singleVal = rawData[0].value;
      const singleLabel = rawData[0].label;
      const numericLabel = parseInt(singleLabel);
      if (!isNaN(numericLabel)) {
        return [
          { label: (numericLabel - 1).toString(), value: 0 },
          { label: singleLabel, value: singleVal }
        ];
      }
      return [
        { label: '', value: 0 },
        { label: singleLabel, value: singleVal }
      ];
    }

    return rawData;
  }, [sales, viewMode, startDateStr, weekParam]);

  // Cálculos matemáticos de altura y proporciones para dibujar los polígonos del SVG
  const maxVal = Math.max(...chartData.map(d => d.value), 1);
  const points = chartData.map((d, i) => {
    const x = (i / (chartData.length - 1)) * 100;
    const y = 100 - (d.value / maxVal) * 80; // dejamos un margen del 20% arriba
    return `${x},${y}`;
  }).join(' ');

  const areaPoints = `0,100 ${points} 100,100`;

  // Manejar movimiento del ratón para actualizar el foco del Tooltip
  const handleMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const width = rect.width;
    const index = Math.round((x / width) * (chartData.length - 1));
    if (index >= 0 && index < chartData.length) {
      setHoveredIndex(index);
    }
  };

  const hoveredData = (hoveredIndex !== null && hoveredIndex >= 0 && hoveredIndex < chartData.length)
    ? chartData[hoveredIndex]
    : null;
  const hoveredX = (hoveredIndex !== null && chartData.length > 1)
    ? (hoveredIndex / (chartData.length - 1)) * 100
    : 0;
  const hoveredY = hoveredData
    ? 100 - (hoveredData.value / maxVal) * 80
    : 0;

  const totalPeriodSales = useMemo(() => {
    return chartData.reduce((sum, item) => sum + item.value, 0);
  }, [chartData]);

  // Texto abreviado para el Badge de Vista del gráfico
  const getBadgeLabel = () => {
    switch (viewMode) {
      case 'semanal': return 'Semanal';
      case 'mensual': return 'Mensual';
      case 'anual': return 'Anual';
      case 'historico': return 'Histórico';
      default: return viewMode;
    }
  };

  return (
    <div className={styles.wrapper}>
      <div className={styles.header}>
        <div className="flex items-baseline gap-2">
          <h3 className="text-2xl sm:text-3xl font-black text-white tracking-tight">Ventas</h3>
          <span className="text-2xl sm:text-3xl font-black text-secondary">
            {totalPeriodSales}
          </span>
        </div>
        <div className={styles.viewBadge}>
          <span className="w-2.5 h-2.5 rounded-full bg-secondary shadow-lg shadow-secondary/50 animate-pulse" />
          <span className="capitalize">{getBadgeLabel()}</span>
        </div>
      </div>

      {/* Área del Gráfico SVG */}
      <div 
        className={styles.chartArea}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setHoveredIndex(null)}
      >
        <svg viewBox="0 0 100 100" className="w-full h-full preserve-3d" preserveAspectRatio="none">
          <defs>
            <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--color-secondary)" stopOpacity="0.35" />
              <stop offset="100%" stopColor="var(--color-secondary)" stopOpacity="0" />
            </linearGradient>
          </defs>
          
          {/* Líneas de cuadrícula horizontales */}
          {[0, 25, 50, 75, 100].map(g => (
            <line key={g} x1="0" y1={g} x2="100" y2={g} stroke="white" strokeOpacity="0.04" strokeWidth="0.1" />
          ))}

          {/* Línea vertical de foco interactivo (Hover) */}
          {hoveredIndex !== null && (
            <line 
              x1={hoveredX} y1="0" x2={hoveredX} y2="100" 
              stroke="var(--color-secondary)" strokeOpacity="0.25" strokeWidth="0.3" 
              vectorEffect="non-scaling-stroke"
            />
          )}

          {/* Área sombreada bajo la línea */}
          <polyline
            points={areaPoints}
            fill="url(#chartGradient)"
            className="transition-all duration-700 ease-in-out"
          />

          {/* Línea principal de trazado */}
          <polyline
            points={points}
            fill="none"
            stroke="var(--color-secondary)"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="transition-all duration-700 ease-in-out drop-shadow-[0_0_8px_rgba(var(--color-secondary-rgb),0.5)]"
            vectorEffect="non-scaling-stroke"
          />
        </svg>

        {/* Marcador y Tooltip sobre el Hover */}
        {hoveredData && (
          <>
            <div 
              className={styles.hoverDot}
              style={{ 
                left: `${hoveredX}%`, 
                top: `${hoveredY}%`,
                transform: 'translate(-50%, -50%)'
              }}
            />
            
            <div 
              className={styles.tooltip}
              style={{ 
                left: `${Math.min(Math.max(hoveredX, 10), 90)}%`, 
                top: `${hoveredY - 8}%`,
                transform: 'translate(-50%, -100%)'
              }}
            >
              <div className="flex flex-col items-center gap-1">
                <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">{hoveredData.label}</span>
                <span className="text-xs text-secondary font-black">
                  {hoveredData.value} <span className="text-[9px] font-bold text-slate-400">UNIDADES</span>
                </span>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Etiquetas del eje X */}
      <div className={styles.axisX}>
        {chartData.map((d, i) => {
          let shouldShow = false;
          if (viewMode === 'semanal') shouldShow = true;
          else if (viewMode === 'mensual') shouldShow = i % 4 === 0 || i === chartData.length - 1;
          else if (viewMode === 'anual') shouldShow = true;
          else if (viewMode === 'historico') shouldShow = true;

          return shouldShow ? <span key={i}>{d.label}</span> : <span key={i} className="invisible">.</span>;
        })}
      </div>
    </div>
  );
}

// ─── Estilos Extraídos (Tailwind) ───────────────────────────────────────────
const styles = {
  wrapper: "flex flex-col h-full space-y-6 w-full",
  header: "flex items-center justify-between gap-3 w-full",
  title: "text-lg font-bold text-white tracking-tight sm:text-xl",
  badge: "bg-secondary/15 text-secondary border border-secondary/20 px-3 py-0.5 rounded-lg text-xs font-black tracking-normal",
  viewBadge: "flex items-center gap-2.5 px-4 py-2 bg-slate-950/60 border border-slate-800 rounded-xl text-xs sm:text-sm text-slate-300 font-extrabold uppercase tracking-widest shadow-lg",
  chartArea: "flex-1 min-h-0 relative group cursor-crosshair w-full",
  hoverDot: "absolute w-3.5 h-3.5 bg-secondary rounded-full border-2 border-slate-900 shadow-[0_0_15px_rgba(var(--color-secondary-rgb),0.85)] pointer-events-none z-10",
  tooltip: "absolute bg-slate-950/95 border border-slate-800 p-2 rounded-xl shadow-2xl pointer-events-none animate-in fade-in zoom-in-95 duration-150 z-20 backdrop-blur-md",
  axisX: "flex justify-between text-slate-500 text-[8px] sm:text-[9px] font-bold uppercase tracking-normal sm:tracking-widest px-1 w-full select-none",
};
