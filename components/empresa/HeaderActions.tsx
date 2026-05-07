'use client';

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { logout } from "@/app/empresa/login/actions";

export default function HeaderActions() {
  const pathname = usePathname();
  
  // Solo mostramos el botón de perfil si estamos en la raíz del webapp
  const isMainMenu = pathname === "/empresa/webapp";

  return (
    <div className="flex items-center gap-3">
      <form action={logout}>
        <button className="px-6 py-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-xl text-sm font-medium transition-all flex items-center gap-2 cursor-pointer">
          <span className="material-symbols-outlined text-sm">logout</span>
          <span className="hidden md:inline">Cerrar Sesión</span>
        </button>
      </form>

      {isMainMenu && (
        <Link 
          href="/empresa/webapp/perfil"
          className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-sm font-medium transition-all flex items-center gap-2"
        >
          <span className="material-symbols-outlined text-sm text-secondary">person</span>
          Perfil
        </Link>
      )}
    </div>
  );
}
