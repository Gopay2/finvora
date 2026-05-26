import React from "react";
import { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import WhatsAppButton from "@/components/layout/WhatsAppButton";
import FichaTecnicaCliente from "@/components/catalogo/FichaTecnicaCliente";
import VisualizadorImagen from "@/components/catalogo/VisualizadorImagen";
import { createClient } from "@/utils/supabase/server";

interface PageProps {
  params: Promise<{ id: string }>;
}

// 1. Generación Dinámica de Metadatos SEO para cada Celular
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const supabase = await createClient();

  const { data: celular } = await supabase
    .from("catalogo_celulares")
    .select("marca, modelo, descripcion")
    .eq("id", id)
    .single();

  if (!celular) {
    return {
      title: "Celular No Encontrado | Finvora",
    };
  }

  const titleText = `${celular.marca} ${celular.modelo} a Crédito pagos semanales | Finvora`;
  const descText = `Adquiere tu ${celular.marca} ${celular.modelo} a crédito en Finvora. Aprobación en 5 minutos con tu INE, sin aval ni buro de crédito. ${celular.descripcion.substring(0, 80)}...`;

  return {
    title: titleText,
    description: descText,
    openGraph: {
      title: titleText,
      description: descText,
      url: `https://finvora.mx/catalogo/${id}`,
      siteName: "Finvora",
      images: [
        {
          url: "https://finvora.mx/brands/finvoralogo.webp",
          width: 800,
          height: 600,
          alt: `${celular.marca} ${celular.modelo}`,
        },
      ],
      locale: "es_MX",
      type: "website",
    },
  };
}

export const revalidate = 60; // ISR - Revalidar el detalle del celular cada 60 segundos si hay cambios en DB

export default async function DetalleCelularPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createClient();

  // Consultar en el servidor el celular solicitado y que esté visible
  const { data: celular } = await supabase
    .from("catalogo_celulares")
    .select("*")
    .eq("id", id)
    .eq("visible", true)
    .single();

  if (!celular) {
    return notFound(); // Si no existe o no está activo, Next.js renderizará el 404 por defecto
  }

  const whatsappPhone = process.env.NEXT_PUBLIC_WHATSAPP_PHONE || "521234567890";

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-[family-name:var(--font-outfit)] flex flex-col justify-between overflow-x-hidden w-full">
      {/* Cabecera unificada */}
      <Header />

      <main className="flex-1 pt-32 pb-20 relative">
        {/* Luces decorativas de fondo */}
        <div className="absolute w-[600px] h-[600px] bg-[#3CD7FF]/5 rounded-full blur-[140px] -z-10 left-[-200px] top-10 pointer-events-none" />
        <div className="absolute w-[500px] h-[500px] bg-secondary/5 rounded-full blur-[120px] -z-10 right-[-100px] bottom-10 pointer-events-none" />

        {/* Contenedor Principal */}
        <div className="max-w-6xl mx-auto px-6 space-y-8 relative z-10">
          
          {/* Botón de Retorno */}
          <Link 
            href="/catalogo" 
            className="inline-flex items-center gap-2 text-slate-500 hover:text-white transition-colors text-sm font-bold w-fit cursor-pointer animate-in fade-in slide-in-from-left-3 duration-500"
          >
            <span className="material-symbols-outlined text-base">arrow_back</span>
            Volver al Catálogo
          </Link>

          {/* Grilla a Dos Columnas */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 lg:gap-16 items-center">
            
            {/* Lado Izquierdo: Visualización de la Imagen Interactiva (Con Zoom/Lightbox) */}
            <VisualizadorImagen 
              imagenUrl={celular.imagen_url} 
              alt={`${celular.marca} ${celular.modelo}`} 
            />

            {/* Lado Derecho: Ficha Técnica & Controles Cliente */}
            <div className="bg-slate-900/10 backdrop-blur-md border border-slate-900/50 p-8 rounded-3xl md:bg-transparent md:border-none md:p-0">
              <FichaTecnicaCliente 
                celular={celular} 
                whatsappPhone={whatsappPhone} 
              />
            </div>

          </div>

        </div>
      </main>

      {/* Botón Flotante WhatsApp */}
      <WhatsAppButton />

      {/* Pie de página unificado */}
      <Footer />
    </div>
  );
}
