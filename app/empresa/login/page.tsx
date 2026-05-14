import React, { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { Metadata } from "next";
import LoginContent from "@/components/empresa/LoginContent";

export const metadata: Metadata = {
  title: "Acceso Empleados | Finvora",
  robots: {
    index: false,
    follow: false,
  },
};

const styles = {
  wrapper: "min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 font-[family-name:var(--font-outfit)]",
};

export default async function LoginPage() {
  const supabase = await createClient();
  
  // 1. Verificar si ya hay una sesión activa
  const { data: { user } } = await supabase.auth.getUser();

  // 2. Si hay usuario, redirigir directo a la webapp
  if (user) {
    return redirect("/empresa/webapp");
  }

  return (
    <div className={styles.wrapper}>
      <Suspense fallback={<div className="text-slate-500">Cargando...</div>}>
        <LoginContent />
      </Suspense>
      
      <Link href="/" className="mt-8 text-slate-500 hover:text-slate-300 text-sm transition-colors flex items-center gap-2 group">
        <span className="material-symbols-outlined text-base group-hover:-translate-x-1 transition-transform">arrow_back</span>
        Volver al sitio principal
      </Link>
    </div>
  );
}
