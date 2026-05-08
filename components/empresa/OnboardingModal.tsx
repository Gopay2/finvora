'use client';

import React, { useState } from "react";
import { updateUsername } from "@/app/empresa/webapp/profile-actions";
import { useRouter } from "next/navigation";

interface OnboardingModalProps {
  isOpen: boolean;
}

export default function OnboardingModal({ isOpen }: OnboardingModalProps) {
  const [username, setUsername] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);
  const router = useRouter();

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsPending(true);

    const result = await updateUsername(username);

    if (result.success) {
      // Recargar la página para que el layout detecte el cambio de perfil
      router.refresh();
    } else {
      setError(result.error || "Ocurrió un error.");
      setIsPending(false);
    }
  };

  return (
    <div className="fixed inset-0 w-screen h-screen z-[9999] flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 overflow-y-auto">
      <div className="w-full max-w-md my-auto bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl animate-in fade-in zoom-in duration-300">
        <div className="text-center space-y-3 mb-8">
          <div className="w-16 h-16 bg-secondary/10 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-secondary/20">
            <span className="material-symbols-outlined text-secondary text-3xl">person_add</span>
          </div>
          <h2 className="text-2xl font-bold text-white">¡Bienvenido a Finvora!</h2>
          <p className="text-slate-400 text-sm">
            Antes de comenzar, por favor elige un nombre de usuario único. 
            Este nombre aparecerá en tus registros y notificaciones.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label htmlFor="username" className="text-xs font-semibold uppercase tracking-wider text-slate-500 ml-1">
              Nombre de Usuario
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-medium">@</span>
              <input
                id="username"
                type="text"
                placeholder="tu_usuario"
                value={username}
                onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/\s/g, ""))}
                required
                className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 pl-10 pr-4 text-white placeholder:text-slate-700 focus:outline-none focus:ring-2 focus:ring-secondary/50 focus:border-secondary transition-all"
                disabled={isPending}
              />
            </div>
            {error && (
              <p className="text-red-400 text-xs mt-2 ml-1 flex items-center gap-1 animate-pulse">
                <span className="material-symbols-outlined text-sm">error</span>
                {error}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={isPending || username.length < 3}
            className="w-full py-4 bg-secondary text-slate-950 font-bold rounded-xl hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:hover:scale-100 flex items-center justify-center gap-2"
          >
            {isPending ? (
              <>
                <div className="w-5 h-5 border-2 border-slate-950/30 border-t-slate-950 rounded-full animate-spin" />
                Guardando...
              </>
            ) : (
              "Comenzar ahora"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
