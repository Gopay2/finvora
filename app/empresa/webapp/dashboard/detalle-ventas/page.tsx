import React from "react";
import Link from "next/link";
import { getUserProfile, isAllowed } from "@/utils/auth-check";
import AccessDenied from "@/components/empresa/AccessDenied";

export default async function DetalleVentasPage() {
  const { role: userRole } = await getUserProfile();

  if (!isAllowed(userRole, ["Admin", "Developer", "Supervisor"])) {
    return <AccessDenied role={userRole} sectionName="Detalle de Ventas" />;
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in zoom-in duration-700 min-h-[60vh] flex flex-col items-center justify-center text-center">
      <div className="bg-slate-900/40 backdrop-blur-xl border border-slate-800 p-8 rounded-[2rem] shadow-2xl relative overflow-hidden group max-w-sm">
        {/* Efecto de brillo de fondo */}
        <div className="absolute -top-24 -left-24 w-32 h-32 bg-emerald-500/10 rounded-full blur-[60px]" />
        <div className="absolute -bottom-24 -right-24 w-32 h-32 bg-blue-500/10 rounded-full blur-[60px]" />
        
        <div className="relative space-y-4">
          <div className="w-16 h-16 bg-emerald-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-emerald-500/20 group-hover:scale-110 transition-transform duration-500">
            <span className="material-symbols-outlined text-3xl text-emerald-500 animate-pulse">analytics</span>
          </div>
          
          <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight">
            Próximamente
          </h1>
          
          <p className="text-slate-400 text-sm leading-relaxed">
            Estamos trabajando en un panel de análisis profundo para tus ventas. Muy pronto podrás ver métricas detalladas.
          </p>
          
          <div className="pt-4">
            <Link 
              href="/empresa/webapp/dashboard" 
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-slate-800 text-slate-300 border border-slate-700 rounded-xl hover:bg-slate-700 hover:text-white transition-all text-sm font-bold"
            >
              <span className="material-symbols-outlined text-sm">arrow_back</span>
              Volver
            </Link>
          </div>
        </div>
      </div>
      
      <div className="text-slate-600 text-xs uppercase tracking-[0.3em] font-bold">
        Finvora
      </div>
    </div>
  );
}
