import React from "react";
import Link from "next/link";
import { getUserProfile, isAllowed } from "@/utils/auth-check";
import AccessDenied from "@/components/empresa/AccessDenied";
import { getRepartidoresList } from "@/app/empresa/webapp/repartos/repartos-actions";
import HorariosConfig from "@/components/empresa/HorariosConfig";

export const revalidate = 0;

export default async function HorariosPage() {
  const { role: userRole } = await getUserProfile();

  if (!isAllowed(userRole, ["Admin", "Supervisor", "Developer"])) {
    return <AccessDenied role={userRole} sectionName="Configuración de Horarios" />;
  }

  const res = await getRepartidoresList();
  const repartidores = res.success ? res.data : [];

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-700">
      <div className="space-y-4">
        {/* Volver en Celular (arriba del título) */}
        <div className="flex justify-end sm:hidden">
          <Link 
            href="/empresa/webapp/repartos/repartidores" 
            className="text-slate-500 hover:text-slate-300 flex items-center gap-2 text-sm transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-base">arrow_back</span>
            Volver
          </Link>
        </div>

        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 md:gap-6">
          <div className="space-y-1">
            <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
              Horarios
            </h1>
            <p className="text-slate-500 text-sm">Configura los días y jornadas laborales de cada repartidor y ubicación</p>
          </div>

          {/* Volver en PC (a la altura del título) */}
          <div className="hidden sm:flex items-center">
            <Link 
              href="/empresa/webapp/repartos/repartidores" 
              className="text-slate-500 hover:text-slate-300 flex items-center gap-2 text-sm transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-base">arrow_back</span>
              Volver
            </Link>
          </div>
        </header>
      </div>

      <HorariosConfig initialRepartidores={repartidores} />
    </div>
  );
}
