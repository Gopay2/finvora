'use client';

import React, { useState, useMemo } from 'react';

interface Sale {
  fecha_venta: string;
  [key: string]: any;
}

interface SalesChartProps {
  sales: Sale[];
}

type ViewType = 'diario' | 'semanal' | 'mensual' | 'anual';

export default function SalesChart({ sales }: SalesChartProps) {
  const [view, setView] = useState<ViewType>('semanal');
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const chartData = useMemo(() => {
    const now = new Date();
    const getMexicoDate = (date: Date) => new Date(date.toLocaleString('en-US', { timeZone: 'America/Mexico_City' }));
    const mexicoNow = getMexicoDate(now);

    if (view === 'diario') {
      const hours = Array.from({ length: 24 }, (_, i) => ({ label: `${i}h`, value: 0 }));
      const todayStr = mexicoNow.toISOString().split('T')[0];
      
      sales.forEach(sale => {
        const saleDate = getMexicoDate(new Date(sale.fecha_venta));
        if (saleDate.toISOString().split('T')[0] === todayStr) {
          const hour = saleDate.getHours();
          hours[hour].value++;
        }
      });
      return hours;
    }

    if (view === 'semanal') {
      const days = ['Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab', 'Dom'];
      const data = days.map(day => ({ label: day, value: 0 }));
      
      const dayOfWeek = mexicoNow.getDay();
      const diffToMonday = (dayOfWeek === 0 ? 6 : dayOfWeek - 1);
      const startOfWeek = new Date(mexicoNow);
      startOfWeek.setDate(mexicoNow.getDate() - diffToMonday);
      startOfWeek.setHours(0, 0, 0, 0);

      sales.forEach(sale => {
        const saleDate = getMexicoDate(new Date(sale.fecha_venta));
        if (saleDate >= startOfWeek) {
          const diff = Math.floor((saleDate.getTime() - startOfWeek.getTime()) / (1000 * 60 * 60 * 24));
          if (diff >= 0 && diff < 7) {
            data[diff].value++;
          }
        }
      });
      return data;
    }

    if (view === 'mensual') {
      const daysInMonth = new Date(mexicoNow.getFullYear(), mexicoNow.getMonth() + 1, 0).getDate();
      const data = Array.from({ length: daysInMonth }, (_, i) => ({ label: `${i + 1}`, value: 0 }));
      
      sales.forEach(sale => {
        const saleDate = getMexicoDate(new Date(sale.fecha_venta));
        if (saleDate.getMonth() === mexicoNow.getMonth() && saleDate.getFullYear() === mexicoNow.getFullYear()) {
          data[saleDate.getDate() - 1].value++;
        }
      });
      return data;
    }

    if (view === 'anual') {
      const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
      const data = months.map(m => ({ label: m, value: 0 }));
      
      sales.forEach(sale => {
        const saleDate = getMexicoDate(new Date(sale.fecha_venta));
        if (saleDate.getFullYear() === mexicoNow.getFullYear()) {
          data[saleDate.getMonth()].value++;
        }
      });
      return data;
    }

    return [];
  }, [sales, view]);

  const maxVal = Math.max(...chartData.map(d => d.value), 1);
  const points = chartData.map((d, i) => {
    const x = (i / (chartData.length - 1)) * 100;
    const y = 100 - (d.value / maxVal) * 80;
    return `${x},${y}`;
  }).join(' ');

  const areaPoints = `0,100 ${points} 100,100`;

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const width = rect.width;
    const index = Math.round((x / width) * (chartData.length - 1));
    if (index >= 0 && index < chartData.length) {
      setHoveredIndex(index);
    }
  };

  const hoveredData = hoveredIndex !== null ? chartData[hoveredIndex] : null;
  const hoveredX = hoveredIndex !== null ? (hoveredIndex / (chartData.length - 1)) * 100 : 0;
  const hoveredY = hoveredData !== null ? 100 - (hoveredData.value / maxVal) * 80 : 0;

  return (
    <div className="flex flex-col h-full space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold text-white tracking-tight">Ventas</h3>
        <div className="flex bg-slate-800/50 p-1 rounded-xl border border-slate-700">
          {(['diario', 'semanal', 'mensual', 'anual'] as ViewType[]).map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all ${
                view === v 
                  ? 'bg-secondary text-slate-950 shadow-lg shadow-secondary/20' 
                  : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              {v}
            </button>
          ))}
        </div>
      </div>

      <div 
        className="flex-1 min-h-0 relative group cursor-crosshair"
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setHoveredIndex(null)}
      >
        <svg viewBox="0 0 100 100" className="w-full h-full preserve-3d" preserveAspectRatio="none">
          <defs>
            <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--color-secondary)" stopOpacity="0.3" />
              <stop offset="100%" stopColor="var(--color-secondary)" stopOpacity="0" />
            </linearGradient>
          </defs>
          
          {[0, 25, 50, 75, 100].map(g => (
            <line key={g} x1="0" y1={g} x2="100" y2={g} stroke="white" strokeOpacity="0.05" strokeWidth="0.1" />
          ))}

          {hoveredIndex !== null && (
            <line 
              x1={hoveredX} y1="0" x2={hoveredX} y2="100" 
              stroke="var(--color-secondary)" strokeOpacity="0.2" strokeWidth="0.5" 
              vectorEffect="non-scaling-stroke"
            />
          )}

          <polyline
            points={areaPoints}
            fill="url(#chartGradient)"
            className="transition-all duration-700 ease-in-out"
          />

          <polyline
            points={points}
            fill="none"
            stroke="var(--color-secondary)"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="transition-all duration-700 ease-in-out drop-shadow-[0_0_8px_rgba(var(--color-secondary-rgb),0.5)]"
            vectorEffect="non-scaling-stroke"
          />

          {hoveredIndex !== null && (
            <line 
              x1={hoveredX} y1="0" x2={hoveredX} y2="100" 
              stroke="var(--color-secondary)" strokeOpacity="0.2" strokeWidth="0.5" 
              vectorEffect="non-scaling-stroke"
            />
          )}
        </svg>

        {hoveredData && (
          <>
            {/* Punto redondo (fuera del SVG para evitar deformación) */}
            <div 
              className="absolute w-3 h-3 bg-secondary rounded-full border-2 border-slate-900 shadow-[0_0_15px_rgba(var(--color-secondary-rgb),0.8)] pointer-events-none z-10"
              style={{ 
                left: `${hoveredX}%`, 
                top: `${hoveredY}%`,
                transform: 'translate(-50%, -50%)'
              }}
            />
            
            {/* Tooltip */}
            <div 
              className="absolute bg-slate-900/90 border border-slate-700 p-2 rounded-lg shadow-2xl pointer-events-none animate-in fade-in zoom-in duration-200 z-20"
              style={{ 
                left: `${Math.min(Math.max(hoveredX, 10), 90)}%`, 
                top: `${hoveredY - 10}%`,
                transform: 'translate(-50%, -100%)'
              }}
            >
            <div className="flex flex-col items-center gap-1">
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">{hoveredData.label}</span>
              <span className="text-sm text-secondary font-black">{hoveredData.value} <span className="text-[10px] font-bold text-slate-400">UNIDADES</span></span>
            </div>
          </div>
          </>
        )}

      </div>

      <div className="flex justify-between text-slate-600 text-[10px] font-bold uppercase tracking-widest px-1">
        {chartData.map((d, i) => {
          let shouldShow = false;
          if (view === 'diario') shouldShow = i % 4 === 0 || i === 23;
          else if (view === 'semanal') shouldShow = true;
          else if (view === 'mensual') shouldShow = i % 5 === 0 || i === chartData.length - 1;
          else if (view === 'anual') shouldShow = true;

          return shouldShow ? <span key={i}>{d.label}</span> : <span key={i} className="invisible">.</span>;
        })}
      </div>
    </div>
  );
}
