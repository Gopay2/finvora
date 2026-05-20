import { MetadataRoute } from 'next';
 
export default function robots(): MetadataRoute.Robots {
  const isProduction = process.env.NEXT_PUBLIC_APP_ENV === 'production';

  if (!isProduction) {
    return {
      rules: {
        userAgent: '*',
        disallow: '/',
      },
    };
  }

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
