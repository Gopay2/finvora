import React from "react";
import Link from "next/link";
import { getUserProfile, isAllowed } from "@/utils/auth-check";
import AccessDenied from "@/components/empresa/AccessDenied";

export const revalidate = 0;

const styles = {
  card: "w-full max-w-2xl mx-auto bg-slate-900/40 backdrop-blur-xl border border-slate-800 p-12 rounded-3xl text-center space-y-6",
  title: "text-2xl md:text-4xl font-bold bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent",
  message: "text-slate-400 text-lg",
};

export default async function StockPage() {
  const { role: userRole } = await getUserProfile();

  if (!isAllowed(userRole, ["Admin", "Supervisor", "Closer"])) {
    return <AccessDenied role={userRole} sectionName="Stock de Ventas" />;
  }

  return (
    <div className={styles.card}>
      <span className="material-symbols-outlined text-6xl text-secondary">inventory_2</span>
      <h1 className={styles.title}>Stock de Ventas</h1>
      <p className={styles.message}>Proximamente podrás ver y gestionar el stock de ventas.</p>
      <div className="bg-slate-950/50 border border-slate-800 rounded-2xl p-8 text-left">
         <p className="text-slate-400 italic">Contenido del stock cargando...</p>
      </div>
      <Link href="/empresa/webapp" className="text-slate-500 hover:text-slate-300 transition-colors block">
        Volver al Panel
      </Link>
    </div>
  );
}
