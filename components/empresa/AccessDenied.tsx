import React from "react";
import Link from "next/link";

interface AccessDeniedProps {
  role: string;
  sectionName: string;
}

const styles = {
  cardRestrict: "w-full max-w-2xl mx-auto bg-slate-900/40 backdrop-blur-xl border border-slate-800 p-12 rounded-3xl text-center space-y-6",
  title: "text-xl md:text-3xl font-bold bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent",
  message: "text-slate-400 text-lg",
  unauthorized: "text-red-400 font-medium flex items-center justify-center gap-2",
  button: "inline-block px-8 py-3 bg-secondary text-slate-950 font-bold rounded-xl hover:bg-secondary/90 transition-all cursor-pointer",
  roleSpan: "text-slate-200 font-bold"
};

export default function AccessDenied({ role, sectionName }: AccessDeniedProps) {
  return (
    <div className={styles.cardRestrict}>
      <span className="material-symbols-outlined text-6xl text-red-500/50">lock</span>
      <h1 className={styles.title}>Acceso Restringido</h1>
      <p className={styles.message}>
        Lo sentimos, tu cuenta con rol <span className={styles.roleSpan}>{role}</span> no tiene permisos para acceder a <span className="text-slate-200">{sectionName}</span>.
      </p>
      <div className={styles.unauthorized}>
        <span className="material-symbols-outlined">warning</span>
        Requiere rol superior
      </div>
      <Link href="/empresa/webapp" className={styles.button}>
        Volver al Panel
      </Link>
    </div>
  );
}
