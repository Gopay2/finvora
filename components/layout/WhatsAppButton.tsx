import React from "react";

/**
 * WhatsAppButton Component
 * A floating action button that allows users to quickly start a WhatsApp chat for support.
 */
export default function WhatsAppButton() {
  const phoneNumber = process.env.NEXT_PUBLIC_WHATSAPP_PHONE || "";
  const message = "Hola, me gustaría saber más sobre el crédito de Finvora.";
  const whatsappUrl = phoneNumber ? `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}` : "#";

  return (
    <a
      className="fixed bottom-6 right-6 md:bottom-8 md:right-8 z-[60] flex items-center justify-center w-14 h-14 md:w-16 md:h-16 bg-[#25D366] text-white rounded-full shadow-[0_8px_30px_rgba(37,211,102,0.4)] hover:shadow-[0_8px_30px_rgba(37,211,102,0.6)] hover:scale-110 active:scale-95 transition-all duration-300 group"
      href={whatsappUrl}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Contactar por WhatsApp"
    >
      {/* Ripple/pulse effect */}
      <span className="absolute inset-0 rounded-full bg-[#25D366]/40 animate-ping pointer-events-none -z-10"></span>
      
      {/* Icon */}
      <i className="fa-brands fa-whatsapp text-3xl md:text-4xl transition-transform duration-300 group-hover:rotate-12"></i>
    </a>
  );
}
