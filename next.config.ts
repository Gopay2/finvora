import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Oculta que estamos usando Next.js por seguridad
  poweredByHeader: false,
  
  // Permite acceso desde la red local para desarrollo en dispositivos físicos
  allowedDevOrigins: ['192.168.1.5', 'localhost:3000'],

  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },
  
  // Configuración de cabeceras HTTP de seguridad
  async headers() {
    return [
      {
        // Aplica a todas las rutas
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdnjs.cloudflare.com; font-src 'self' https://fonts.gstatic.com https://cdnjs.cloudflare.com; img-src 'self' blob: data: https://*.supabase.co; connect-src 'self' https://*.supabase.co https://*.discord.com; frame-ancestors 'none';"
          },
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload'
          },
          {
            // Evita ataques de Clickjacking (que incrusten la app en un iframe falso)
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN'
          },
          {
            // Evita MIME-Sniffing (ataques donde se sube un script con extensión de imagen)
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin'
          },
          {
            // Limita a qué APIs del navegador tiene acceso la web
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(), browsing-topics=()'
          }
        ]
      }
    ];
  }
};

export default nextConfig;
