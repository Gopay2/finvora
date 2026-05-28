import React from "react";
import Link from "next/link";
import { getUserProfile, isAllowed } from "@/utils/auth-check";
import AccessDenied from "@/components/empresa/AccessDenied";
import CatalogoForm from "@/components/empresa/CatalogoForm";
import DeleteCatalogoButton from "@/components/empresa/DeleteCatalogoButton";
import CatalogoVisibilityToggle from "@/components/empresa/CatalogoVisibilityToggle";
import { createClient } from "@/utils/supabase/server";

const styles = {
  container: "max-w-6xl mx-auto space-y-10 animate-in fade-in duration-500",
  header: "flex items-center justify-between",
  title: "text-3xl font-bold bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent",
  formCard: "bg-slate-900/40 backdrop-blur-xl border border-slate-800 p-8 rounded-3xl relative overflow-hidden",
  formCardGlow: "absolute -top-24 -right-24 w-48 h-48 bg-secondary/5 rounded-full blur-3xl",
  tableWrapper: "bg-slate-900/20 border border-slate-800 rounded-2xl overflow-x-auto custom-scrollbar",
  table: "w-full min-w-[800px]",
  th: "px-6 py-4 text-slate-500 text-[10px] uppercase font-bold border-b border-slate-800 tracking-widest whitespace-nowrap text-center",
  td: "px-6 py-4 text-sm text-slate-300 border-b border-slate-800/50 whitespace-nowrap text-center align-middle",
  tr: "hover:bg-white/5 transition-colors",
};

interface PageProps {
  searchParams: Promise<{ edit?: string }>;
}

export default async function CatalogoWebPage({ searchParams }: PageProps) {
  const { role: userRole } = await getUserProfile();

  if (!isAllowed(userRole, ["Admin", "Supervisor", "Developer"])) {
    return <AccessDenied role={userRole} sectionName="Catálogo Web" />;
  }

  const sParams = await searchParams;
  const editId = sParams.edit;

  const supabase = await createClient();

  // 1. Obtener la lista completa de celulares en el catálogo
  const { data: celulares } = await supabase
    .from("catalogo_celulares")
    .select("*")
    .order("created_at", { ascending: false });

  // 2. Si hay un ID de edición en la URL, cargar ese celular en particular
  let celularAEditar = null;
  if (editId) {
    const { data } = await supabase
      .from("catalogo_celulares")
      .select("*")
      .eq("id", editId)
      .single();
    if (data) {
      celularAEditar = data;
    }
  }

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className="space-y-1">
          <h1 className={styles.title}>Catálogo Comercial Web</h1>
          <p className="text-slate-500 text-sm">Gestiona los modelos y variantes que se muestran al público en Finvora.mx/catalogo</p>
        </div>
        <Link href="/empresa/webapp" className="text-slate-500 hover:text-slate-300 flex items-center gap-2 text-sm transition-colors">
          <span className="material-symbols-outlined text-base">arrow_back</span>
          Volver al Inicio
        </Link>
      </header>

      {/* Formulario de Carga / Edición */}
      <div className={styles.formCard}>
        <div className={styles.formCardGlow} />
        <div className="flex items-center justify-between mb-6 border-b border-slate-800/50 pb-4 relative z-10">
          <h2 className="text-lg font-bold text-white ml-1">
            {celularAEditar ? "Modificar Celular Registrado" : "Agregar Nuevo Celular al Catálogo Web"}
          </h2>
          {celularAEditar && (
            <Link 
              href="/empresa/webapp/catalogo-web"
              className="px-4 py-1.5 bg-slate-850 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800 hover:border-slate-700 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5"
            >
              <span className="material-symbols-outlined text-xs">close</span>
              Cancelar Edición
            </Link>
          )}
        </div>
        <div className="relative z-10">
          <CatalogoForm 
            celular={celularAEditar} 
            onSuccess={async () => {
              'use server';
              // Después de guardar con éxito, si estaba editando, limpiamos la URL para salir del modo edición
            }}
          />
        </div>
      </div>

      {/* Listado de Celulares Registrados */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-white ml-2 text-center md:text-left">Celulares Publicados</h2>
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th className={styles.th}>Vista</th>
                <th className={styles.th}>Celular</th>
                <th className={styles.th}>Colores Disponibles</th>
                <th className={styles.th}>Almacenamiento</th>
                <th className={styles.th}>Memoria RAM</th>
                <th className={styles.th}>Visible Web</th>
                <th className={styles.th}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {celulares && celulares.length > 0 ? (
                celulares.map((c: any) => (
                  <tr key={c.id} className={styles.tr}>
                    {/* Miniatura de Imagen */}
                    <td className={styles.td}>
                      <div className="flex justify-center">
                        <div className="w-12 h-12 rounded-xl border border-slate-800 bg-slate-950 overflow-hidden flex items-center justify-center">
                          <img 
                            src={c.imagen_url} 
                            alt={c.modelo} 
                            className="w-full h-full object-cover"
                          />
                        </div>
                      </div>
                    </td>

                    {/* Marca & Modelo */}
                    <td className={`${styles.td} font-bold text-white text-left max-w-[180px] truncate`}>
                      <span className="block text-xs uppercase tracking-wider text-slate-500 font-medium mb-0.5">{c.marca}</span>
                      <span className="text-sm">{c.modelo}</span>
                    </td>

                    {/* Colores */}
                    <td className={styles.td}>
                      <div className="flex flex-wrap justify-center gap-1.5 max-w-[200px] mx-auto">
                        {c.colores.map((color: string) => (
                          <span key={color} className="px-2 py-0.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-400 font-medium">
                            {color}
                          </span>
                        ))}
                      </div>
                    </td>

                    {/* Almacenamientos */}
                    <td className={styles.td}>
                      <div className="flex flex-wrap justify-center gap-1.5 max-w-[160px] mx-auto">
                        {c.almacenamientos.map((alm: string) => (
                          <span key={alm} className="px-2 py-0.5 bg-slate-900/50 border border-slate-800 rounded-lg text-xs text-secondary font-semibold font-mono">
                            {alm}
                          </span>
                        ))}
                      </div>
                    </td>

                    {/* Memorias RAM */}
                    <td className={styles.td}>
                       <div className="flex flex-wrap justify-center gap-1.5 max-w-[160px] mx-auto">
                         {c.rams ? c.rams.map((ram: string) => (
                           <span key={ram} className="px-2 py-0.5 bg-slate-900/30 border border-slate-800 rounded-lg text-xs text-slate-300 font-semibold font-mono">
                             {ram}
                           </span>
                         )) : (
                           <span className="text-xs text-slate-500 italic">No esp.</span>
                         )}
                       </div>
                    </td>



                    {/* Switch de Visibilidad */}
                    <td className={styles.td}>
                      <CatalogoVisibilityToggle id={c.id} initialVisible={c.visible} />
                    </td>

                    {/* Acciones */}
                    <td className={styles.td}>
                      <div className="flex items-center justify-center gap-2">
                        <Link
                          href={`/empresa/webapp/catalogo-web?edit=${c.id}`}
                          className="text-slate-400 hover:text-white transition-colors p-2 rounded-lg hover:bg-slate-800 cursor-pointer"
                          title="Editar información"
                        >
                          <span className="material-symbols-outlined text-xl">edit</span>
                        </Link>
                        <DeleteCatalogoButton id={c.id} imagenUrl={c.imagen_url} />
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-500 italic">
                    No hay celulares cargados en el catálogo web todavía.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
