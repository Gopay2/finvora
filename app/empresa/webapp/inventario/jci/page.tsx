import React from "react";
import Link from "next/link";
import { getUserProfile, isAllowed } from "@/utils/auth-check";
import AccessDenied from "@/components/empresa/AccessDenied";

export const revalidate = 0;

export default async function JciPage() {
  const { role: userRole } = await getUserProfile();

  if (!isAllowed(userRole, ["Admin", "Supervisor", "Closer", "Cambaceador", "Repartidor", "Developer", "CambaCloser"])) {
    return <AccessDenied role={userRole} sectionName="JCI" />;
  }

  return (
    <div className="max-w-xl mx-auto min-h-[60vh] flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-500">
      <div className="bg-[#060b18] border border-[#16233a] rounded-3xl p-10 sm:p-12 w-full flex flex-col items-center space-y-6 shadow-2xl">
        <div className="w-16 h-16 rounded-2xl bg-[#0c1424] border border-[#1c2a44] flex items-center justify-center text-[#a5c4ec]">
          <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.85" strokeLinecap="round" strokeLinejoin="round">
            <rect x="4.5" y="5.5" width="15" height="15.5" rx="3" />
            <path d="M9 5.5a1.5 1.5 0 0 1 1.5-1.5h3A1.5 1.5 0 0 1 15 5.5v.5H9v-.5z" />
            <path d="M9 13.5l2 2 4-4" />
          </svg>
        </div>

        <div className="space-y-2">
          <h1 
            className="text-2xl sm:text-3xl font-light text-white tracking-wide"
            style={{ fontFamily: "var(--font-outfit), sans-serif" }}
          >
            Módulo en construcción
          </h1>
          <p 
            className="text-slate-400 text-lg font-light tracking-wide"
            style={{ fontFamily: "var(--font-outfit), sans-serif" }}
          >
            Próximamente
          </p>
        </div>

        <Link
          href="/empresa/webapp/inventario"
          className="inline-flex items-center gap-2 px-6 py-3 bg-slate-800/90 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-sm font-medium transition-all cursor-pointer shadow-md hover:text-white"
        >
          <span className="material-symbols-outlined text-base">arrow_back</span>
          Volver
        </Link>
      </div>
    </div>
  );
}
