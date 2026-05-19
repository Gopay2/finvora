import React from "react";
import Link from "next/link";
import RepartosCalendar from "@/components/empresa/RepartosCalendar";

export const revalidate = 60;

export default function RepartosPage() {
  return (
    <div className="max-w-[1600px] mx-auto space-y-8 animate-in fade-in duration-700 h-[calc(100vh-8rem)] min-h-[700px] flex flex-col">
      <header className="flex items-center justify-between shrink-0">
        <div className="space-y-1">
          <h2 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">Repartos</h2>
          <p className="text-slate-500 text-sm">Organización logística y entregas programadas</p>
        </div>
        <Link href="/empresa/webapp" className="flex items-center justify-center px-4 py-2 bg-slate-800 text-slate-400 border border-slate-700 rounded-xl hover:bg-slate-700 hover:text-white transition-all cursor-pointer" title="Volver al Inicio">
          <span className="material-symbols-outlined text-xl">home</span>
        </Link>
      </header>

      {/* Contenedor principal del calendario ocupando todo el espacio sobrante */}
      <div className="flex-1 bg-slate-900/40 backdrop-blur-xl border border-slate-800 rounded-3xl overflow-hidden flex flex-col shadow-2xl">
        <RepartosCalendar />
      </div>
    </div>
  );
}
