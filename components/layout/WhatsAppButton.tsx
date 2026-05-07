import React from "react";

/**
 * WhatsAppButton Component
 * A floating action button that allows users to quickly start a WhatsApp chat for support.
 */
export default function WhatsAppButton() {
  const phoneNumber = process.env.NEXT_PUBLIC_WHATSAPP_PHONE || "";
  const message = "Hola, me gustaría saber más sobre el crédito de GoPay.";
  const whatsappUrl = phoneNumber ? `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}` : "#";

  return (
    <a
      className="fixed bottom-8 right-8 z-[60] bg-[#25D366] text-white flex items-center gap-3 px-6 py-4 shadow-2xl hover:scale-110 transition-transform group aspect-square rounded-full flex items-center justify-center p-4"
      href={whatsappUrl}
      target="_blank"
      rel="noopener noreferrer"
    >
      <span className="material-symbols-outlined text-2xl" data-icon="chat">
        chat
      </span>
      <span className="font-bold hidden">Ayuda rápida</span>
    </a>
  );
}
