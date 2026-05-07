import React from "react";

const styles = {
  brandSection: "pt-28 pb-12 bg-slate-950 flex items-center justify-center border-b border-white/5",
  brandContainer: "max-w-7xl mx-auto px-6 text-center animate-in fade-in slide-in-from-top-4 duration-1000 relative",
  brandGlow: "absolute w-72 h-72 bg-[#3CD7FF]/40 rounded-full blur-[100px] -z-10 left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2",
  brandLogo: "w-auto mx-auto object-contain drop-shadow-[0_0_40px_rgba(60,215,255,0.6)] relative z-10 h-55 md:h-65",
  brandLabelContainer: "mt-4 flex items-center justify-center gap-2",
  brandLine: "h-px w-8 bg-secondary/30",
  brandLabel: "text-secondary text-xs font-bold tracking-[0.3em] uppercase md:text-sm lg:text-base",
  
  heroSection: "relative pt-12 pb-20 md:pt-24 md:pb-40 overflow-hidden bg-gradient-to-b from-primary-container/30 to-surface",
  heroContainer: "max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center",
  heroTitle: "font-headline font-extrabold text-on-surface leading-tight tracking-tighter mb-6 text-center lg:text-left sm:text-4xl md:text-5xl lg:text-7xl text-[2.5rem]",
  heroDescription: "text-lg md:text-xl text-on-surface-variant mb-10 max-w-lg leading-relaxed text-center lg:text-left mx-auto lg:mx-0",
  heroButtonsContainer: "flex flex-col sm:flex-row gap-4 text-center lg:text-left justify-center lg:justify-start",
  heroApplyButton: "text-on-tertiary-fixed px-10 py-4 rounded-md font-bold text-lg hover:brightness-110 transition-all shadow-xl shadow-tertiary/20",
  
  heroImageContainer: "relative lg:h-[600px] flex items-center justify-center",
  heroImageGlow: "absolute w-[120%] h-[120%] bg-secondary/10 rounded-full blur-[100px] -z-10 animate-pulse",
  heroImage: "w-full max-w-sm md:max-w-md lg:max-w-none mx-auto h-full object-contain drop-shadow-[0_35px_35px_rgba(0,18,63,0.5)] transform hover:scale-105 transition-transform duration-700",
  
  counterWrapper: "flex flex-col justify-center lg:justify-start items-start gap-2 mt-6",
  counterPill: "inline-flex items-center gap-1.5 px-4 py-2 bg-surface-container-high border border-outline-variant/20 rounded-full animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-300 shadow-md font-extrabold text-secondary text-lg",
};

/**
 * BrandIntroduction Component
 * Displays the main GoPay logo and the slogan with glowing effects.
 */
function BrandIntroduction() {
  return (
    <section className={styles.brandSection}>
      <div className={styles.brandContainer}>
        <div className={styles.brandGlow}></div>
        <img
          alt="GoPay Brand Logo"
          className={styles.brandLogo}
          src="/brands/gopaylogo.webp"
        />
        <div className={styles.brandLabelContainer}>
          <span className={styles.brandLine}></span>
          <span className={styles.brandLabel}>Tu Crédito Inteligente</span>
          <span className={styles.brandLine}></span>
        </div>
      </div>
    </section>
  );
}

/**
 * HeroMain Component
 * Displays the main call to action, headline, and the showcase image.
 */
function HeroMain() {
  const phoneNumber = process.env.NEXT_PUBLIC_WHATSAPP_PHONE || "";
  const message = "Hola, me gustaría saber más sobre el crédito de GoPay.";
  const whatsappUrl = phoneNumber ? `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}` : "#";

  return (
    <section className={styles.heroSection}>
      <div className={styles.heroContainer}>
        <div className="z-10">
          <h1 className={styles.heroTitle}>
            <span className="block sm:inline">Tu celular nuevo</span>{" "}
            <span className="text-secondary whitespace-nowrap">en 5 minutos</span>,{" "}
            <span className="block lg:inline">sin salir de casa</span>
          </h1>
          <p className={styles.heroDescription}>
            9 de cada 10 personas son aprobadas con solo su INE. Adquiere hoy tu smartphone con pagos semanales y sin complicaciones.
          </p>
          <div className={styles.heroButtonsContainer}>
            <a
              className={styles.heroApplyButton}
              style={{ backgroundColor: "#FF9933", color: "#001C3A" }}
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              ¡Recibe tu equipo hoy en casa!
            </a>
          </div>

          <div className={styles.counterWrapper}>
            <div className={styles.counterPill}>
              <span className="material-symbols-outlined text-xl" aria-hidden="true">group</span>
              +3,000
            </div>
          </div>
        </div>
        <div className={styles.heroImageContainer}>
          <div className={styles.heroImageGlow}></div>
          <img
            alt="Smartphones premium"
            className={styles.heroImage}
            src="/brands/chica2.webp"
          />
        </div>
      </div>
    </section>
  );
}

/**
 * HeroSection Component
 * Combines the brand introduction and the main hero content into a single component for the landing page.
 */
export default function HeroSection() {
  return (
    <>
      <BrandIntroduction />
      <HeroMain />
    </>
  );
}
