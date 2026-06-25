'use client';

import React from "react";

export interface VentaDashboard {
  fecha_venta: string;
  vendedor: {
    username: string;
  } | null;
  productos: {
    marca: string;
    modelo: string;
  } | null;
}

interface PerformancePieChartProps {
  sales: VentaDashboard[];
}

export default function PerformancePieChart({ sales }: PerformancePieChartProps) {
  // Calcular rendimiento de vendedores para el período seleccionado
  const stats: Record<string, number> = {};
  sales.forEach((sale) => {
    const name = sale.vendedor?.username || "Desconocido";
    stats[name] = (stats[name] || 0) + 1;
  });

  const sortedStats = Object.entries(stats).sort((a, b) => b[1] - a[1]);
  const totalSales = sales.length;

  if (totalSales === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <span className="text-slate-500 text-sm font-bold uppercase tracking-wider">
          Sin ventas registradas en este período
        </span>
      </div>
    );
  }

  // Tomamos el mejor vendedor
  const topSalesName = sortedStats[0]?.[0] || "---";
  const topSalesCount = sortedStats[0]?.[1] || 0;
  const topPct = topSalesCount / totalSales;
  const restPct = 1 - topPct;
  
  const radius = 25;
  const circumference = 2 * Math.PI * radius;
  const topDash = topPct * circumference;

  const getLabelPos = (pct: number) => {
    const angle = pct * 2 * Math.PI;
    const x = 50 + Math.cos(angle) * 28;
    const y = 50 + Math.sin(angle) * 28;
    return { x, y };
  };

  const topPos = getLabelPos(topPct / 2);
  const restPos = getLabelPos(topPct + restPct / 2);

  return (
    <div className="flex flex-col md:flex-row items-center justify-around gap-8 w-full mt-4">
      {/* Gráfico SVG circular */}
      <div className="flex flex-col items-center justify-center">
        <div className="w-56 h-56 sm:w-64 sm:h-64 relative flex items-center justify-center">
          <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90 drop-shadow-2xl">
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
            
            {/* Textos de Porcentajes */}
            {restPct > 0.05 && (
              <text 
                x={restPos.x} y={restPos.y} 
                fill="#001c3a" fontSize="10" fontWeight="black" 
                textAnchor="middle" dominantBaseline="central"
                transform={`rotate(90 ${restPos.x} ${restPos.y})`} 
                className="pointer-events-none font-bold"
              >
                {Math.round(restPct * 100)}%
              </text>
            )}
            {topPct > 0.05 && (
              <text 
                x={topPos.x} y={topPos.y} 
                fill="#001f27" fontSize="10" fontWeight="black" 
                textAnchor="middle" dominantBaseline="central"
                transform={`rotate(90 ${topPos.x} ${topPos.y})`} 
                className="pointer-events-none font-bold"
              >
                {Math.round(topPct * 100)}%
              </text>
            )}
          </svg>
        </div>
        {/* Leyenda */}
        <div className="flex gap-4 sm:gap-6 mt-6">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 sm:w-4 sm:h-4 rounded-full bg-emerald-500 shadow-lg shadow-emerald-500/20"></div>
            <span className="text-[10px] sm:text-xs text-slate-400 font-bold uppercase tracking-wider">
              {topSalesName.substring(0, 15)} ({topSalesCount} U.)
            </span>
          </div>
          {restPct > 0 && (
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 sm:w-4 sm:h-4 rounded-full bg-blue-500 shadow-lg shadow-blue-500/20"></div>
              <span className="text-[10px] sm:text-xs text-slate-400 font-bold uppercase tracking-wider">
                Resto ({totalSales - topSalesCount} U.)
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Ranking de vendedores completo con barra de progreso */}
      <div className="flex-1 w-full max-w-sm space-y-4">
        <h5 className="text-slate-400 text-sm sm:text-base font-bold uppercase tracking-widest border-b border-slate-800/80 pb-2">
          Ranking de Vendedores
        </h5>
        <div className="space-y-4 max-h-64 overflow-y-auto custom-scrollbar pr-2">
          {sortedStats.map(([name, count], index) => {
            const percentage = Math.round((count / totalSales) * 100);
            const isTopOne = index === 0;
            return (
              <div key={name} className="flex flex-col gap-2">
                <div className="flex justify-between items-center text-sm sm:text-base">
                  <div className="flex items-center gap-3 text-slate-300 font-semibold">
                    <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs sm:text-sm font-black ${
                      isTopOne 
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                        : 'bg-slate-800 text-slate-400 border border-slate-700/50'
                    }`}>
                      {index + 1}
                    </span>
                    <span className="capitalize">{name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-white font-extrabold text-xs sm:text-sm">
                      {count} <span className="text-[10px] sm:text-xs text-slate-400 font-medium">U.</span>
                    </span>
                    <span className={`px-2 py-0.5 rounded-lg text-[10px] sm:text-xs font-black border ${
                      isTopOne 
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 shadow-[0_0_10px_rgba(16,185,129,0.05)]' 
                        : 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                    }`}>
                      {percentage}%
                    </span>
                  </div>
                </div>
                <div className="w-full h-3 bg-slate-950 rounded-full overflow-hidden border border-slate-800/80">
                  <div 
                    className={`h-full rounded-full transition-all duration-500 ${
                      isTopOne ? 'bg-gradient-to-r from-emerald-500 to-teal-400' : 'bg-blue-500'
                    }`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
