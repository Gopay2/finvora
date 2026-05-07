import React from "react";
import Link from "next/link";
import { resetPassword } from "../login/actions";
import SubmitButton from "@/components/empresa/SubmitButton";

const styles = {
  container: "min-h-screen bg-slate-950 flex items-center justify-center p-6 font-[family-name:var(--font-outfit)]",
  card: "w-full max-w-md bg-slate-900/40 backdrop-blur-xl border border-slate-800 p-10 rounded-3xl space-y-8",
  header: "text-center space-y-2",
  title: "text-3xl font-bold bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent",
  subtitle: "text-slate-400 text-sm",
  form: "space-y-6",
  inputGroup: "space-y-2",
  label: "text-sm font-medium text-slate-300 ml-1",
  input: "w-full bg-slate-950/50 border border-slate-800 rounded-xl px-4 py-3 text-slate-100 focus:outline-none focus:border-secondary transition-all",
  button: "w-full bg-secondary text-slate-950 font-bold py-3.5 rounded-xl hover:bg-secondary/90 transition-all shadow-lg shadow-secondary/20 cursor-pointer",
  link: "text-secondary hover:text-secondary/80 text-sm font-medium transition-colors",
  error: "bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl text-xs text-center",
  success: "bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-4 rounded-xl text-xs text-center",
};

export default function ForgotPasswordPage({
  searchParams,
}: {
  searchParams: { error?: string; success?: string };
}) {
  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.header}>
          <h1 className={styles.title}>Recuperar Cuenta</h1>
          <p className={styles.subtitle}>Te enviaremos un correo para restablecer tu contraseña.</p>
        </div>

        {searchParams.error && <div className={styles.error}>{searchParams.error}</div>}
        {searchParams.success && <div className={styles.success}>{searchParams.success}</div>}

        <form action={resetPassword} className={styles.form}>
          <div className={styles.inputGroup}>
            <label className={styles.label}>Email</label>
            <input
              name="email"
              type="email"
              required
              className={styles.input}
              placeholder="tunombre@email.com"
            />
          </div>

          <SubmitButton pendingText="Enviando..." className={styles.button}>Enviar email de recuperación</SubmitButton>
        </form>

        <div className="text-center pt-4 border-t border-slate-800/50">
          <Link href="/empresa/login" className={styles.link}>
            Volver al inicio de sesión
          </Link>
        </div>
      </div>
    </div>
  );
}
