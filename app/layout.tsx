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

export const metadata: Metadata = {
  title: "GoPay - Tu celular nuevo en 5 minutos",
  description: "Compra tu celular a crédito con pagos semanales. 9 de cada 10 personas son aprobadas.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" data-scroll-behavior="smooth" className={`dark scroll-smooth ${roboto.variable} ${outfit.variable}`}>
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
