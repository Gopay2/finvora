import type { Metadata } from "next";
import { Roboto, Outfit } from "next/font/google";
import "./globals.css";

const roboto = Roboto({ 
  subsets: ["latin"], 
  weight: ["300", "400", "500", "700"], 
  variable: "--font-roboto" 
});

const outfit = Outfit({ 
  subsets: ["latin"], 
  variable: "--font-outfit" 
});

const isProduction = process.env.NEXT_PUBLIC_APP_ENV === "production";

export const metadata: Metadata = {
  metadataBase: new URL("https://finvora.mx"),
  title: "Finvora - Tu celular nuevo en 5 minutos",
  description: "Compra tu celular a crédito con pagos semanales. 9 de cada 10 personas son aprobadas.",
  alternates: {
    canonical: "./",
  },
  robots: {
    index: isProduction,
    follow: isProduction,
  },
  openGraph: {
    title: "Finvora - Tu celular nuevo en 5 minutos",
    description: "Compra tu celular a crédito con pagos semanales. 9 de cada 10 personas son aprobadas.",
    url: "https://finvora.mx",
    siteName: "Finvora",
    locale: "es_MX",
    type: "website",
    images: [
      {
        url: "/brands/finvoralogo.webp",
        width: 1200,
        height: 630,
        alt: "Finvora - Tu celular a crédito en 5 minutos",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Finvora - Tu celular nuevo en 5 minutos",
    description: "Compra tu celular a crédito con pagos semanales. 9 de cada 10 personas son aprobadas.",
    images: ["/brands/finvoralogo.webp"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es-MX" data-scroll-behavior="smooth" className={`dark scroll-smooth ${roboto.variable} ${outfit.variable}`} suppressHydrationWarning>
      <head>
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" />
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.2/css/all.min.css" />
      </head>
      <body className="font-body bg-background text-on-background selection:bg-tertiary/30 selection:text-tertiary antialiased">
        {children}
      </body>
    </html>
  );
}
