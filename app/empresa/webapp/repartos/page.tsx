import React from "react";
import Link from "next/link";
import RepartosCalendar from "@/components/empresa/RepartosCalendar";
import { getUserProfile, isAllowed } from "@/utils/auth-check";
import AccessDenied from "@/components/empresa/AccessDenied";

export const revalidate = 0;

export default async function RepartosPage() {
  const { role: userRole } = await getUserProfile();
  const canEdit = isAllowed(userRole, ["Admin", "Supervisor", "Developer"]);

  if (!isAllowed(userRole, ["Admin", "Supervisor", "Closer", "Repartidor", "Developer"])) {
    return <AccessDenied role={userRole} sectionName="Logística y Repartos" />;
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-700">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-6">
        <div className="space-y-1">
          <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">Repartos</h1>
          <p className="text-slate-500 text-sm">Organización logística y entregas programadas</p>
        </div>
        <div className="flex items-center justify-center md:justify-end gap-3 flex-wrap">
          {canEdit && (
            <>
              <Link 
                href="/empresa/webapp/repartos/repartidores" 
                className="flex items-center justify-center gap-1.5 md:gap-2 px-3 md:px-5 py-2.5 bg-secondary text-slate-950 font-bold rounded-xl hover:bg-secondary/90 border border-transparent transition-all text-xs md:text-sm cursor-pointer whitespace-nowrap" 
                title="Configurar Repartidores"
              >
                <span className="material-symbols-outlined text-lg">badge</span>
                Repartidores
              </Link>
              <Link 
                href="/empresa/webapp/repartos/zonas" 
                className="flex items-center justify-center gap-1.5 md:gap-2 px-3 md:px-5 py-2.5 bg-slate-800 text-slate-200 border border-slate-700 rounded-xl hover:bg-slate-700 transition-all text-xs md:text-sm cursor-pointer whitespace-nowrap" 
                title="Configurar Zonas de Reparto"
              >
                <span className="material-symbols-outlined text-lg">map</span>
                Zonas
              </Link>
            </>
          )}
          <Link href="/empresa/webapp" className="flex items-center justify-center px-4 py-2.5 bg-slate-800 text-slate-400 border border-slate-700 rounded-xl hover:bg-slate-700 hover:text-white transition-all cursor-pointer" title="Volver al Inicio">
            <span className="material-symbols-outlined text-xl">home</span>
          </Link>
        </div>
      </header>

      {/* Contenedor principal del calendario con borde redondeado y sombra */}
      <div className="bg-slate-900/40 backdrop-blur-xl border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
        <RepartosCalendar />
      </div>
    </div>
  );
}
