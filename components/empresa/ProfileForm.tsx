'use client';

import React, { useState } from "react";
import { updateUsername } from "@/app/empresa/webapp/profile-actions";
import { useRouter } from "next/navigation";

interface ProfileFormProps {
  initialUsername: string;
}

export default function ProfileForm({ initialUsername }: ProfileFormProps) {
  const [username, setUsername] = useState(initialUsername);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (username === initialUsername) return;
    
    setError(null);
    setSuccess(false);
    setIsPending(true);

    const result = await updateUsername(username);

    if (result.success) {
      setSuccess(true);
      router.refresh();
      // Ocultar mensaje de éxito después de 3 segundos
      setTimeout(() => setSuccess(false), 3000);
    } else {
      setError(result.error || "Ocurrió un error.");
    }
    setIsPending(false);
  };

  return (
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
            placeholder="Ej. Juan Carlos"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 pl-10 pr-4 text-white placeholder:text-slate-700 focus:outline-none focus:ring-2 focus:ring-secondary/50 focus:border-secondary transition-all"
            disabled={isPending}
          />
        </div>
        
        {error && (
          <p className="text-red-400 text-xs mt-2 ml-1 flex items-center gap-1">
            <span className="material-symbols-outlined text-sm">error</span>
            {error}
          </p>
        )}

        {success && (
          <p className="text-green-400 text-xs mt-2 ml-1 flex items-center gap-1">
            <span className="material-symbols-outlined text-sm">check_circle</span>
            ¡Nombre actualizado correctamente!
          </p>
        )}
      </div>

      <button
        type="submit"
        disabled={isPending || username.trim().length < 3 || username.trim() === initialUsername.trim()}
        className="w-full py-3 bg-secondary text-slate-950 font-bold rounded-xl hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-30 disabled:hover:scale-100 flex items-center justify-center gap-2"
      >
        {isPending ? "Guardando..." : "Guardar Cambios"}
      </button>
    </form>
  );
}
