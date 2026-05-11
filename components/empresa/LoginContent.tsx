'use client';

import React from "react";
// Next.js
import { useSearchParams } from "next/navigation";
import Link from "next/link";
// Componentes y acciones internas
import { login } from "@/app/empresa/login/actions";
import SubmitButton from "@/components/empresa/SubmitButton";

/**
 * Define los estilos del componente utilizando Tailwind CSS.
 * Se agrupan en un objeto para mantener el JSX limpio y legible y facilitar el mantenimiento.
 */
const styles: Record<string, string> = {
  loginCard: "w-full max-w-md bg-slate-900/40 backdrop-blur-xl border border-slate-800 p-8 rounded-3xl shadow-2xl relative overflow-hidden group",
  glow: "absolute -top-24 -right-24 w-48 h-48 bg-secondary/10 rounded-full blur-3xl group-hover:bg-secondary/20 transition-colors",
  logo: "w-auto h-20 mb-10 mx-auto object-contain relative z-10 scale-[2.5]",
  title: "text-2xl font-bold text-slate-100 text-center mb-2 relative z-10",
  subtitle: "text-slate-400 text-center mb-8 text-sm relative z-10",
  form: "space-y-6 relative z-10",
  inputGroup: "space-y-2",
  label: "text-sm font-medium text-slate-300 ml-1",
  input: "w-full bg-slate-950/50 border border-slate-800 rounded-xl px-4 py-3 text-slate-100 focus:outline-none focus:border-secondary transition-all placeholder:text-slate-600 focus:ring-1 focus:ring-secondary/20",
  button: "w-full bg-secondary hover:bg-secondary/90 text-slate-950 font-bold py-4 rounded-xl transition-all shadow-lg shadow-secondary/20 mt-4 active:scale-[0.98] cursor-pointer",
  footerLink: "text-center mt-8 text-sm text-slate-500 relative z-10",
  link: "text-secondary hover:underline ml-1 transition-colors",
  error: "bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-xl text-xs text-center relative z-10 mb-4",
  success: "bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-3 rounded-xl text-xs text-center relative z-10 mb-4"
};

/**
 * Componente que renderiza el formulario de inicio de sesión para empleados.
 * Maneja estados de error y éxito provenientes de los parámetros de búsqueda de la URL.
 */
export default function LoginContent() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");
  const success = searchParams.get("success");

  return (
    <div className={styles.loginCard}>
      {/* Efecto de brillo sutil decorativo en la esquina superior */}
      <div className={styles.glow} />
      
      <Link href="/empresa">
        <img 
          src="/brands/finvoralogo.webp" 
          alt="Finvora Logo" 
          className={styles.logo}
        />
      </Link>
      
      <h1 className={styles.title}>Acceso Empleados</h1>
      <p className={styles.subtitle}>Ingresa tus credenciales para continuar</p>

      {/* Mensajes de feedback dinámicos */}
      {error && (
        <div className={styles.error}>
          {error}
        </div>
      )}

      {success && (
        <div className={styles.success}>
          {success}
        </div>
      )}
      
      <form className={styles.form} action={login}>
        <div className={styles.inputGroup}>
          <label className={styles.label}>Correo Electrónico</label>
          <input 
            name="email"
            type="email" 
            placeholder="tu@email.com" 
            className={styles.input}
            required
          />
        </div>
        
        <div className={styles.inputGroup}>
          <label className={styles.label}>Contraseña</label>
          <input 
            name="password"
            type="password" 
            placeholder="••••••••" 
            className={styles.input}
            required
          />
        </div>
        
        <div className="flex items-center justify-between px-1">
          <label className="flex items-center gap-2 cursor-pointer group">
            <input 
              type="checkbox" 
              className="w-4 h-4 rounded border-slate-800 bg-slate-950 text-secondary focus:ring-secondary/20" 
            />
            <span className="text-xs text-slate-400 group-hover:text-slate-300 transition-colors">Recordarme</span>
          </label>
          <Link 
            href="/empresa/forgot-password" 
            className="text-xs text-slate-500 hover:text-secondary transition-colors"
          >
            ¿Olvidaste tu contraseña?
          </Link>
        </div>
        
        <SubmitButton pendingText="Iniciando sesión..." className={styles.button}>
          Iniciar Sesión
        </SubmitButton>
      </form>
      
      <div className={styles.footerLink}>
        ¿No tienes cuenta? 
        <Link href="/empresa/register" className={styles.link}>Regístrate</Link>
      </div>
    </div>
  );
}
