import React from "react";

/**
 * Styles configuration following Next.js Code Quality best practices.
 */
const styles = {
  sectionWrapper: "py-24 relative bg-surface overflow-hidden",
  container: "max-w-7xl mx-auto px-6 relative z-10",
  title: "font-display font-black text-4xl md:text-5xl mb-4 text-on-background text-center",
  subtitle: "text-on-surface-variant text-xl text-center max-w-2xl mx-auto mb-16",
  grid: "grid grid-cols-1 md:grid-cols-2 gap-8",
  cardStep1: "bg-surface-container-high rounded-xl p-8 md:p-10 flex flex-col relative overflow-hidden group flex-1 h-full min-h-[320px]",
  cardStep2: "bg-surface-container-highest rounded-xl p-8 md:p-10 flex flex-col relative overflow-hidden border border-outline-variant/10 group flex-1 h-full min-h-[320px]",
  cardWide: "md:col-span-2 bg-gradient-to-r from-primary-container to-surface-container-low rounded-xl p-10 flex flex-col md:flex-row items-center justify-between border border-outline-variant/5",
  stepNumber: "font-black text-6xl opacity-20 block mb-4",
  cardTitle: "font-headline font-bold mb-4 text-2xl",
  cardText: "text-on-surface-variant text-lg",
  glowOverlay: "absolute bottom-[-10%] right-[-10%] w-64 h-64 bg-secondary/5 rounded-full blur-3xl group-hover:bg-secondary/10 transition-colors",
  glowOverlayTertiary: "absolute bottom-[-10%] right-[-10%] w-64 h-64 bg-tertiary/5 rounded-full blur-3xl group-hover:bg-tertiary/10 transition-colors",
  iconWatermark: "material-symbols-outlined absolute right-8 top-12 text-9xl text-secondary/5 rotate-12 scale-[3]",
  iconWatermarkTertiary: "material-symbols-outlined absolute right-8 top-12 text-9xl text-tertiary/5 rotate-12 scale-[3]",
  boltButton: "bg-secondary text-on-secondary-fixed p-6 rounded-xl",
};

/**
 * HowItWorksSection Component
 * Explains the 3 simple steps to get a smartphone with GoPay.
 */
export default function HowItWorksSection() {
  return (
    <section id="como-funciona" className={styles.sectionWrapper}>
      <div className={styles.container}>
        <h2 className={styles.title}>Consigue tu celular con estas 2 opciones</h2>
        <p className={styles.subtitle}>
          Un proceso transparente diseñado para que dispongas de tu smartphone lo antes posible.
        </p>

        <div className={styles.grid}>
          {/* Card 01 */}
          <div className={styles.cardStep1}>
            <div className="z-10">
              <span className={`${styles.stepNumber} text-secondary`}>01</span>
              <h3 className={styles.cardTitle}>Compra en línea</h3>
              <p className={styles.cardText}>
                Elige tu celular, recíbelo en la puerta de tu casa en 1 a 5 días con envío gratis y paga un enganche.
              </p>
            </div>
            <div className={styles.glowOverlay}></div>
            <span className={styles.iconWatermark} data-icon="local_shipping">
              local_shipping
            </span>
          </div>

          {/* Card 02 */}
          <div className={styles.cardStep2}>
            <div className="z-10">
              <span className={`${styles.stepNumber} text-tertiary`}>02</span>
              <h3 className={styles.cardTitle}>Compra en tienda</h3>
              <p className={styles.cardText}>
                Visita una tienda, obtén tu aprobación y recibe tu celular.
              </p>
            </div>
            <div className={styles.glowOverlayTertiary}></div>
            <span className={styles.iconWatermarkTertiary} data-icon="storefront">
              storefront
            </span>
          </div>

          {/* Card 03 (Full width) */}
          <div className={styles.cardWide}>
            <div className="mb-6 md:mb-0">
              <span className={`${styles.stepNumber} text-secondary`}>✓</span>
              <h3 className={styles.cardTitle}>Proceso en 5 minutos</h3>
              <p className={`${styles.cardText} max-w-xl`}>
                Validamos tu perfil al instante. Sin burocracia, sin aval y sin complicaciones innecesarias.
              </p>
            </div>
            <div className={styles.boltButton}>
              <span className="material-symbols-outlined text-4xl" data-icon="bolt">bolt</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
