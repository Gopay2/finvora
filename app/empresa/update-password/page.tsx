import React from "react";
import { updatePassword } from "../login/actions";
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
  error: "bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl text-xs text-center",
};

export default function UpdatePasswordPage({
  searchParams,
}: {
  searchParams: { error?: string };
}) {
  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.header}>
          <h1 className={styles.title}>Nueva Contraseña</h1>
          <p className={styles.subtitle}>Ingresa tu nueva clave de acceso.</p>
        </div>

        {searchParams.error && <div className={styles.error}>{searchParams.error}</div>}

        <form action={updatePassword} className={styles.form}>
          <div className={styles.inputGroup}>
            <label className={styles.label}>Contraseña Nueva</label>
            <input
              name="password"
              type="password"
              required
              minLength={6}
              className={styles.input}
              placeholder="••••••••"
            />
          </div>

          <SubmitButton pendingText="Actualizando..." className={styles.button}>Actualizar Contraseña</SubmitButton>
        </form>
      </div>
    </div>
  );
}
