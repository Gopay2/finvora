import React from "react";

/**
 * Interface representing a brand to display
 */
interface Brand {
  name: string;
  icon: string;
}

/**
 * BrandsSection Component
 * Displays the supported brands available for the user to purchase.
 */
export default function BrandsSection() {
  const phoneNumber = process.env.NEXT_PUBLIC_WHATSAPP_PHONE || "";
  const message = "Hola, me gustaría saber más sobre el crédito de GoPay.";
  const whatsappUrl = phoneNumber ? `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}` : "#";

  const brands: Brand[] = [
    { name: "Apple", icon: "/brands/apple.webp" },
    { name: "Samsung", icon: "/brands/samsung.webp" },
    { name: "Xiaomi", icon: "/brands/xiaomi.webp" },
    { name: "Motorola", icon: "/brands/moto.webp" },
    { name: "HONOR", icon: "/brands/honor.webp" },
  ];

  return (
    <section className="py-32 bg-surface-container-lowest" id="marcas">
      <div className="max-w-7xl mx-auto px-6 text-center">
        <header className="max-w-3xl mx-auto mb-16">
          <h2 className="font-headline text-4xl md:text-6xl font-extrabold tracking-tight mb-6">
            Las mejores marcas a tu alcance
          </h2>
          <p className="text-lg md:text-xl text-on-surface-variant leading-relaxed">
            Accede a un amplio catálogo de los mejores fabricantes. Trabajamos con marcas líderes para garantizarte equipos originales con garantía total.
          </p>
        </header>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-20 opacity-60">
          {brands.map((brand, index) => (
            <div key={index} className="flex flex-col items-center gap-4 grayscale hover:grayscale-0 transition-all duration-500">
              <div className="w-28 h-28 bg-surface-container rounded-2xl flex items-center justify-center p-2">
                <img 
                  src={brand.icon} 
                  alt={`${brand.name} logo`} 
                  className="max-w-[80%] max-h-[80%] object-contain" 
                />
              </div>
              <span className="font-bold text-sm tracking-widest uppercase">{brand.name}</span>
            </div>
          ))}
        </div>

        <article className="p-10 bg-surface-container rounded-3xl border border-outline-variant/20 inline-block text-left max-w-4xl shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 text-secondary/10">
            <span className="material-symbols-outlined text-9xl" aria-hidden="true">lock_open</span>
          </div>
          <div className="relative z-10">
            <h3 className="font-headline text-2xl font-bold mb-4 text-secondary">Aprobación inmediata</h3>
            <p className="text-on-surface-variant mb-8 text-lg max-w-2xl">
              Obtén tu crédito GoPay hoy mismo y accede a más de 20 modelos disponibles de las marcas que más te gustan. El proceso es 100% digital y seguro.
            </p>
            <a 
              className="bg-secondary text-on-secondary-fixed px-8 py-3 rounded-md font-bold hover:scale-105 transition-all inline-flex items-center gap-2"
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              <span className="material-symbols-outlined text-xl" aria-hidden="true">bolt</span>
              Iniciar mi solicitud ahora
            </a>
          </div>
        </article>
      </div>
    </section>
  );
}
