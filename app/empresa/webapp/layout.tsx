import React from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { logout } from "../login/actions";
import Link from "next/link";
import OnboardingModal from "@/components/empresa/OnboardingModal";
import HeaderActions from "@/components/empresa/HeaderActions";

export const revalidate = 0;

const styles = {
  wrapper: "min-h-screen bg-slate-950 text-slate-100 font-[family-name:var(--font-outfit)]",
  container: "max-w-6xl mx-auto p-6 md:p-12",
  header: "flex flex-col md:flex-row md:items-center justify-between mb-12 gap-6",
  titleGroup: "space-y-1",
  title: "text-3xl font-bold bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent",
  subtitle: "text-slate-400",
  logoutBtn: "px-6 py-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-xl text-sm font-medium transition-all flex items-center gap-2 cursor-pointer",
};

export default async function WebAppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect("/empresa/login");
  }

  const { data: profile } = await supabase
    .from("perfiles")
    .select("role, username")
    .single();

  const userRole = profile?.role || "Closer";
  const username = profile?.username;
  const isAdmin = userRole === "Admin";

  // Mostramos el modal si no hay username definido
  const showOnboarding = !username;

  return (
    <div className={styles.wrapper}>
      {/* Modal de Bienvenida al máximo nivel para evitar conflictos de z-index y centrado */}
      <OnboardingModal isOpen={showOnboarding} />

      <div className={styles.container}>
        {/* Header Compartido */}
        <header className={styles.header}>
          <div className={styles.titleGroup}>
            <Link href="/empresa" className="flex items-center group">
              <div className="relative w-48 h-12 flex items-center">
                <img
                  src="/brands/finvoralogo.webp"
                  alt="Finvora Logo"
                  className="absolute -left-4 w-auto h-42 object-contain brightness-0 invert opacity-80 group-hover:opacity-100 transition-all duration-300 drop-shadow-[0_0_5px_rgba(255,255,255,0.1)] group-hover:drop-shadow-[0_0_20px_rgba(0,255,255,0.8)]"
                />
              </div>
            </Link>
            <div className="flex items-center gap-3">
              <div className={styles.subtitle}>
                {username ? (
                  <div className="flex items-center gap-3">
                    <span className={`px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wider border ${
                      isAdmin ? "bg-secondary/10 text-secondary border-secondary/20" : "bg-slate-800 text-slate-400 border-slate-700"
                    }`}>
                      {userRole}
                    </span>
                    <span className="text-white font-bold text-lg">
                      {username.charAt(0).toUpperCase() + username.slice(1)}
                    </span>
                  </div>
                ) : (
                  user.email
                )}
              </div>
            </div>
          </div>

          <HeaderActions />
        </header>

        {/* Contenido de las páginas */}
        <main>
          {children}
        </main>
      </div>
    </div>
  );
}
