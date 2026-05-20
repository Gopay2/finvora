import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import WhatsAppButton from "@/components/layout/WhatsAppButton";
import HeroSection from "@/components/home/HeroSection";
import WhyChooseUsSection from "@/components/home/WhyChooseUsSection";
import HowItWorksSection from "@/components/home/HowItWorksSection";
import BrandsSection from "@/components/home/BrandsSection";
import TestimonialsSection from "@/components/home/TestimonialsSection";
import FAQSection from "@/components/home/FAQSection";

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": "https://finvora.mx/#organization",
      "name": "Finvora",
      "url": "https://finvora.mx",
      "logo": "https://finvora.mx/brands/finvoralogo.webp",
      "description": "Compra tu celular a crédito con pagos semanales en México. Aprobación en 5 minutos con tu INE.",
      "address": {
        "@type": "PostalAddress",
        "addressCountry": "MX"
      }
    },
    {
      "@type": "WebSite",
      "@id": "https://finvora.mx/#website",
      "url": "https://finvora.mx",
      "name": "Finvora",
      "publisher": {
        "@id": "https://finvora.mx/#organization"
      }
    },
    {
      "@type": "FAQPage",
      "@id": "https://finvora.mx/#faq",
      "mainEntity": [
        {
          "@type": "Question",
          "name": "¿Qué requisitos necesito?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Solo necesitas tu INE original vigente y un número de teléfono celular activo. No requerimos aval ni historial crediticio."
          }
        },
        {
          "@type": "Question",
          "name": "¿Cuánto tendré que pagar en total?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "El monto total depende del equipo que elijas y el plazo de tu crédito. Siempre conocerás el monto exacto de tus pagos semanales antes de aceptar."
          }
        },
        {
          "@type": "Question",
          "name": "¿Qué sucede si me atraso en un pago?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "No cobramos intereses moratorios ni cargos por retraso. El equipo se bloqueará temporalmente hasta que realices tu pago, momento en el cual se desbloqueará de inmediato."
          }
        }
      ]
    }
  ]
};

export default function Home() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Header />
      <main>
        <HeroSection />
        <WhyChooseUsSection />
        <HowItWorksSection />
        <BrandsSection />
        <TestimonialsSection />
        <FAQSection />
      </main>
      <WhatsAppButton />
      <Footer />
    </>
  );
}
