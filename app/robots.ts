import { MetadataRoute } from 'next';
 
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        '/empresa/login',
        '/empresa/webapp',
        '/empresa/register',
        '/empresa/forgot-password',
        '/empresa/update-password',
        '/auth/',
      ],
    },
    sitemap: 'https://finvora.mx/sitemap.xml',
  };
}
