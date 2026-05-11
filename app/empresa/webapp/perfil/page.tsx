import React from "react";
import Link from "next/link";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import ProfileForm from "../../../../components/empresa/ProfileForm";

export default async function PerfilPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return redirect("/empresa/login");

  const { data: profile } = await supabase
    .from("perfiles")
    .select("role, username, email")
    .eq("id", user.id)
    .single();

  return (
    <div className="max-w-2xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <header className="flex items-center justify-between">
        <div className="space-y-1">
          <h2 className="text-3xl font-bold bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
            Mi Perfil
          </h2>
          <p className="text-slate-400 text-sm">Gestiona tu identidad en Finvora</p>
        </div>
        <Link href="/empresa/webapp" className="text-slate-500 hover:text-slate-300 flex items-center gap-2 text-sm transition-colors">
          <span className="material-symbols-outlined text-base">arrow_back</span>
          Volver
        </Link>
      </header>

      <div className="grid grid-cols-1 gap-6">
        {/* Card de Información Fija */}
        <div className="bg-slate-900/40 backdrop-blur-xl border border-slate-800 p-8 rounded-3xl space-y-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-secondary/10 rounded-2xl flex items-center justify-center border border-secondary/20">
              <span className="material-symbols-outlined text-secondary text-3xl">account_circle</span>
            </div>
            <div>
              <div className="flex items-center gap-3 mb-1">
                <span className={`px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wider border ${
                  profile?.role === "Admin" ? "bg-secondary/10 text-secondary border-secondary/20" : "bg-slate-800 text-slate-400 border-slate-700"
                }`}>
                  {profile?.role}
                </span>
                <p className="text-white font-bold text-2xl">
                  {profile?.username 
                    ? profile.username.charAt(0).toUpperCase() + profile.username.slice(1)
                    : "Usuario sin nombre"
                  }
                </p>
              </div>
              <p className="text-slate-400 text-xs italic ml-1">
                {profile?.email}
              </p>
            </div>
          </div>
        </div>

        {/* Formulario de Edición */}
        <div className="bg-slate-900/40 backdrop-blur-xl border border-slate-800 p-8 rounded-3xl">
          <ProfileForm initialUsername={profile?.username || ""} />
        </div>
      </div>
    </div>
  );
}
