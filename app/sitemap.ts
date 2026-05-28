import { MetadataRoute } from 'next';
import { createClient } from "@/utils/supabase/server";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://finvora.mx';

  // 1. Rutas estáticas de la plataforma (incluyendo la página principal del catálogo)
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/catalogo`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/empresa`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${baseUrl}/empresa/nosotros`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${baseUrl}/empresa/servicios`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
  ];

  // 2. Rutas dinámicas consultadas en Supabase (Equipos del catálogo configurados como visibles)
  try {
    const supabase = await createClient();
    const { data: celulares } = await supabase
      .from('catalogo_celulares')
      .select('id, created_at')
      .eq('visible', true);

    if (celulares && celulares.length > 0) {
      const dynamicRoutes: MetadataRoute.Sitemap = celulares.map((c: { id: string; created_at: string | null }) => ({
        url: `${baseUrl}/catalogo/${c.id}`,
        lastModified: c.created_at ? new Date(c.created_at) : new Date(),
        changeFrequency: 'weekly',
        priority: 0.8,
      }));

      return [...staticRoutes, ...dynamicRoutes];
    }
  } catch (error) {
    console.error("Error al generar las rutas dinámicas del sitemap:", error);
  }

  return staticRoutes;
}
