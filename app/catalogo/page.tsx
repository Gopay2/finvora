import React from "react";
import { Metadata } from "next";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import WhatsAppButton from "@/components/layout/WhatsAppButton";
import CatalogoCliente from "@/components/catalogo/CatalogoCliente";
import { createClient } from "@/utils/supabase/server";

// Optimización SEO de la Página Pública del Catálogo
export const metadata: Metadata = {
  title: "Catálogo de Celulares a Crédito | Finvora",
  description: "Conoce los modelos de celulares disponibles para adquirir a crédito con pagos semanales a tu medida. Aprobación en 5 minutos con tu INE, sin aval.",
  keywords: ["celulares a credito", "finvora catalogo", "pagos semanales", "credito de celulares", "smartphone credito mexico"],
  alternates: {
    canonical: "https://finvora.mx/catalogo",
  },
  openGraph: {
    title: "Catálogo de Celulares a Crédito | Finvora",
    description: "Llévate tu smartphone a crédito con pagos semanales y aprobación en 5 minutos con tu INE.",
    url: "https://finvora.mx/catalogo",
    siteName: "Finvora",
    images: [
      {
        url: "https://finvora.mx/brands/finvoralogo.webp",
        width: 800,
        height: 600,
        alt: "Finvora Logo",
      },
    ],
    locale: "es_MX",
    type: "website",
  },
};

export const revalidate = 60; // Revalidar la caché de la página pública del catálogo cada 60 segundos (ISR)

export default async function CatalogoPublicoPage() {
  const supabase = await createClient();

  // Consultar en el servidor solo los celulares configurados como visibles
  const { data: celularesRaw } = await supabase
    .from("catalogo_celulares")
    .select("*")
    .eq("visible", true)
    .order("created_at", { ascending: false });

  const celulares = celularesRaw || [];
  const whatsappPhone = process.env.NEXT_PUBLIC_WHATSAPP_PHONE || "521234567890"; // Respaldo seguro

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-[family-name:var(--font-outfit)] flex flex-col justify-between overflow-x-hidden w-full">
      {/* Cabecera unificada de Finvora */}
      <Header />

      {/* Hero Comercial del Catálogo */}
      <main className="flex-1">
        <section className="relative pt-36 pb-12 overflow-hidden bg-gradient-to-b from-primary-container/20 to-slate-950 border-b border-slate-900">
          {/* Desenfoque de iluminación de marca */}
          <div className="absolute w-[600px] h-[600px] bg-[#3CD7FF]/10 rounded-full blur-[140px] -z-10 left-1/2 -translate-x-1/2 top-10 pointer-events-none" />
          
          <div className="max-w-5xl mx-auto px-6 text-center space-y-6">
            <span className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-900 border border-slate-800 rounded-full text-secondary text-xs font-bold tracking-[0.25em] uppercase shadow-md animate-in fade-in slide-in-from-top-3 duration-1000">
              <span className="material-symbols-outlined text-sm">auto_awesome</span>
              Modelos Seleccionados
            </span>
            
            <h1 className="text-4xl md:text-6xl font-extrabold tracking-tighter text-white leading-tight animate-in fade-in duration-1000">
              Encuentra tu próximo <br className="hidden sm:inline" />
              <span className="bg-gradient-to-r from-secondary to-blue-400 bg-clip-text text-transparent drop-shadow-lg">
                Celular a Crédito
              </span>
            </h1>
            
            <p className="text-base md:text-lg text-slate-400 max-w-xl mx-auto leading-relaxed animate-in fade-in duration-1000 delay-200">
              Elige el smartphone que siempre has querido. Selecciona tus variantes favoritas y recibe hoy una cotización a pagos semanales hecha a tu medida.
            </p>
          </div>
        </section>

        {/* Componente Contenedor Interactivo (Filtros + Grid de Tarjetas Compactas) */}
        <CatalogoCliente 
          celulares={celulares} 
          whatsappPhone={whatsappPhone} 
        />
      </main>

      {/* Botón flotante dinámico de WhatsApp */}
      <WhatsAppButton />

      {/* Pie de página unificado */}
      <Footer />
    </div>
  );
}
