import React from "react";
import Link from "next/link";

const styles = {
  container: "min-h-screen bg-slate-950 flex items-center justify-center p-6 font-[family-name:var(--font-outfit)]",
  card: "w-full max-w-md bg-slate-900/40 backdrop-blur-xl border border-slate-800 p-12 rounded-3xl text-center space-y-8",
  iconWrapper: "w-20 h-20 bg-secondary/10 rounded-full flex items-center justify-center mx-auto border border-secondary/20",
  icon: "material-symbols-outlined text-4xl text-secondary",
  title: "text-3xl font-bold bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent",
  message: "text-slate-400 leading-relaxed",
  button: "inline-block w-full bg-slate-800 hover:bg-slate-700 text-white font-bold py-3.5 rounded-xl transition-all cursor-pointer",
};

export default function VerifyPage() {
  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.iconWrapper}>
          <span className={styles.icon}>mail</span>
        </div>
        
        <div className="space-y-4">
          <h1 className={styles.title}>¡Casi listo!</h1>
          <p className={styles.message}>
            Hemos enviado un enlace de confirmación a tu correo electrónico. 
            Por favor, verificá tu bandeja de entrada (y la carpeta de spam) para activar tu cuenta.
          </p>
        </div>

        <div className="pt-4 border-t border-slate-800/50 space-y-4">
          <p className="text-xs text-slate-500">¿Ya confirmaste tu cuenta?</p>
          <Link href="/empresa/login" className={styles.button}>
            Ir al Inicio de Sesión
          </Link>
        </div>
      </div>
    </div>
  );
}
