import React from "react";

/**
 * Interface defining the properties for a Benefit Card
 */
interface BenefitCardProps {
  icon: string;
  title: string;
  description: string;
  colorTheme?: "secondary" | "tertiary";
}

/**
 * Renders an individual benefit card with an icon, title, and description.
 * Uses dynamic Tailwind classes based on the chosen color theme.
 */
function BenefitCard({
  icon,
  title,
  description,
  colorTheme = "secondary",
}: BenefitCardProps) {
  // Define theme-specific classes to keep the JSX clean
  const hoverBorderClass =
    colorTheme === "secondary" ? "hover:border-secondary/30" : "hover:border-tertiary/30";
  const iconBgClass =
    colorTheme === "secondary" ? "bg-secondary/10 group-hover:bg-secondary/20" : "bg-tertiary/10 group-hover:bg-tertiary/20";
  const iconTextClass = colorTheme === "secondary" ? "text-secondary" : "text-tertiary";

  return (
    <div
      className={`p-8 rounded-xl bg-surface-container border border-outline-variant/10 ${hoverBorderClass} transition-colors group text-center flex flex-col items-center`}
    >
      <div className={`w-14 h-14 rounded-full flex items-center justify-center mb-6 transition-colors ${iconBgClass}`}>
        <span className={`material-symbols-outlined text-3xl ${iconTextClass}`} aria-hidden="true">
          {icon}
        </span>
      </div>
      <h3 className="font-headline text-xl font-bold mb-3">{title}</h3>
      <p className="text-on-surface-variant leading-relaxed">{description}</p>
    </div>
  );
}

/**
 * WhyChooseUsSection component displaying the main benefits of the service.
 */
export default function WhyChooseUsSection() {
  const benefits: BenefitCardProps[] = [
    {
      icon: "assignment_ind",
      title: "Requisitos sencillos",
      description: "Solo necesitas tu INE/Identificación oficial y un número de teléfono para comenzar.",
      colorTheme: "secondary",
    },
    {
      icon: "calendar_month",
      title: "Pagos semanales fijos",
      description: "Con miles de opciones donde pagar fácilmente cada semana sin sorpresas.",
      colorTheme: "tertiary",
    },
    {
      icon: "event_busy",
      title: "Sin cargos por retraso",
      description: "Ponte al día con tu pago semanal y continúa disfrutando de tu equipo sin penalizaciones.",
      colorTheme: "secondary",
    },
  ];

  return (
    <section className="py-24 bg-surface-container-low" id="why-choose-us">
      <div className="max-w-7xl mx-auto px-6">
        <header className="text-center mb-16">
          <h2 className="font-headline text-4xl font-extrabold tracking-tight mb-4">
            Compra con total confianza
          </h2>
          <p className="text-on-surface-variant text-lg">
            Beneficios diseñados para tu tranquilidad financiera.
          </p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {benefits.map((benefit, index) => (
            <BenefitCard key={index} {...benefit} />
          ))}
        </div>
      </div>
    </section>
  );
}
