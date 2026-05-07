import React from "react";

/**
 * Interface representing a Frequently Asked Question
 */
interface FAQ {
  question: string;
  answer: string;
}

/**
 * FAQSection Component
 * Displays an accordion list of frequently asked questions.
 */
export default function FAQSection() {
  const faqs: FAQ[] = [
    {
      question: "¿Qué requisitos necesito?",
      answer: "Solo necesitas tu INE original vigente y un número de teléfono celular activo. No requerimos aval ni historial crediticio.",
    },
    {
      question: "¿Cuánto tendré que pagar en total?",
      answer: "El monto total depende del equipo que elijas y el plazo de tu crédito. Siempre conocerás el monto exacto de tus pagos semanales antes de aceptar.",
    },
    {
      question: "¿Qué sucede si me atraso en un pago?",
      answer: "No cobramos intereses moratorios ni cargos por retraso. El equipo se bloqueará temporalmente hasta que realices tu pago, momento en el cual se desbloqueará de inmediato.",
    },
  ];

  return (
    <section className="py-24 bg-surface-container-low" id="preguntas-frecuentes">
      <div className="max-w-3xl mx-auto px-6">
        <h2 className="font-headline text-3xl font-extrabold text-center mb-12">Preguntas frecuentes</h2>
        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <details key={index} className="bg-surface-container p-6 rounded-xl border border-outline-variant/10 group cursor-pointer">
              <summary className="flex justify-between items-center font-bold text-lg list-none">
                {faq.question}
                <span className="material-symbols-outlined transition-transform group-open:rotate-180" aria-hidden="true">
                  expand_more
                </span>
              </summary>
              <p className="mt-4 text-on-surface-variant">{faq.answer}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
