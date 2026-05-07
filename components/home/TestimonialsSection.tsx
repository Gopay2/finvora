"use client";
import React, { useEffect, useRef, useState } from "react";

/**
 * Interface representing a customer testimonial
 */
interface Testimonial {
  quote: string;
  authorName: string;
  authorInitial: string;
  authorRole: string;
  colorTheme: "secondary" | "tertiary";
}

/**
 * Component to display an individual testimonial
 */
function TestimonialCard({ quote, authorName, authorInitial, authorRole, colorTheme }: Testimonial) {
  const borderClass = colorTheme === "secondary" ? "border-secondary" : "border-tertiary";
  const iconColorClass = colorTheme === "secondary" ? "text-secondary/20" : "text-tertiary/20";
  const roleColorClass = colorTheme === "secondary" ? "text-secondary" : "text-tertiary";

  return (
    <article className={`relative p-10 bg-surface-container-low rounded-2xl border-l-4 ${borderClass} shadow-2xl h-full flex flex-col justify-between`}>
      <div>
        <span className={`material-symbols-outlined ${iconColorClass} text-6xl absolute top-6 right-8`} aria-hidden="true">
          format_quote
        </span>
        <p className="text-xl italic leading-relaxed mb-8 relative z-10">"{quote}"</p>
      </div>
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-full bg-slate-700 flex items-center justify-center font-bold text-white flex-shrink-0">
          {authorInitial}
        </div>
        <div>
          <h4 className="font-bold">{authorName}</h4>
          <p className={`text-sm ${roleColorClass}`}>{authorRole}</p>
        </div>
      </div>
    </article>
  );
}

/**
 * TestimonialsSection Component
 * Displays social proof and customer testimonials.
 */
export default function TestimonialsSection() {
  const [hasIntersected, setHasIntersected] = useState(false);
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setHasIntersected(true);
        observer.disconnect();
      }
    }, { threshold: 0.1 });

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  const testimonials: Testimonial[] = [
    {
      quote: "Es un proceso muy sencillo, rápido y fácil de entender. Solo necesitas tu INE y una foto para comenzar. Lo recomiendo al 100%.",
      authorName: "Carlos E.",
      authorInitial: "C",
      authorRole: "Cliente verificado",
      colorTheme: "secondary",
    },
    {
      quote: "El enganche es súper accesible y los pagos semanales también. Mi equipo llegó rápido y en excelentes condiciones.",
      authorName: "Miriam R.",
      authorInitial: "M",
      authorRole: "Cliente verificado",
      colorTheme: "tertiary",
    },
    {
      quote: "La atención al cliente es increíble. Tuve dudas con mi plan de pagos y me resolvieron todo por WhatsApp al instante. Muy buena experiencia.",
      authorName: "Roberto M.",
      authorInitial: "R",
      authorRole: "Cliente verificado",
      colorTheme: "secondary",
    },
    {
      quote: "Pensé que no me aprobarían por no tener historial crediticio, pero con mi INE fue suficiente. Ya tengo mi celular nuevo. ¡Mil gracias!",
      authorName: "Sofía L.",
      authorInitial: "S",
      authorRole: "Cliente verificado",
      colorTheme: "tertiary",
    },
  ];

  return (
    <section ref={sectionRef} className="py-32 bg-surface overflow-hidden" id="testimonios">
      <div className="max-w-7xl mx-auto px-6">
        <header className="text-center mb-20">
          <h2 className="font-headline text-4xl font-extrabold mb-4">Clientes satisfechos</h2>
          <p className="text-on-surface-variant">Testimonios de personas que confiaron en nuestro sistema de crédito.</p>
        </header>
        
        {/* Mobile Swipeable Carousel / Desktop Grid */}
        <div className={`flex md:grid md:grid-cols-2 gap-6 md:gap-12 overflow-x-auto md:overflow-visible snap-x snap-mandatory md:snap-none pb-6 md:pb-0 ${hasIntersected ? "animate-peek" : ""} md:animate-none [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]`}>
          {testimonials.map((testimonial, index) => (
            <div key={index} className="w-[85vw] sm:w-[75vw] md:w-full flex-shrink-0 snap-center">
              <TestimonialCard {...testimonial} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
