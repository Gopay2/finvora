import Link from 'next/link';

const styles = {
  wrapper: "flex flex-col items-center py-20 px-4 gap-24",
  heroSection: "w-full max-w-5xl text-center",
  logoWrapper: "mb-12 flex justify-center",
  logo: "h-60 md:h-100 w-auto object-contain drop-shadow-[0_0_30px_rgba(30,58,138,0.4)]",
  heroSubtitle: "text-xl md:text-3xl font-light text-slate-400 max-w-3xl mx-auto leading-relaxed",
  ctaWrapper: "mt-12",
  primaryButton: "inline-block bg-primary text-slate-950 font-bold py-4 px-10 rounded-full shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all duration-300 hover:scale-105 text-lg",
  gridSection: "w-full max-w-4xl",
  gridWrapper: "grid grid-cols-1 md:grid-cols-2 gap-8 text-center",
  gridCard: "p-10 bg-slate-900/40 border border-slate-800 rounded-3xl shadow-xl hover:bg-slate-800/40 transition-all hover:-translate-y-2 group",
  cardEmoji: "text-6xl mb-6 group-hover:scale-110 transition-transform",
  cardTitle: "text-3xl font-bold text-slate-200 mb-4",
  cardText: "text-slate-400 text-lg",
  statsSection: "w-full max-w-6xl bg-slate-900/20 border border-slate-800/50 rounded-[3rem] py-16 px-8",
  statsGrid: "grid grid-cols-2 lg:grid-cols-4 gap-12",
  statItem: "text-center flex flex-col items-center",
  statIcon: "material-symbols-outlined text-4xl text-secondary mb-4 opacity-80",
  statValue: "text-4xl md:text-5xl font-black text-slate-100 mb-2",
  statLabel: "text-slate-500 font-medium uppercase tracking-widest text-xs md:text-sm",
  finalCtaSection: "w-full max-w-4xl text-center py-10",
  finalCtaTitle: "text-3xl font-bold text-slate-200 mb-6",
  secondaryLink: "text-secondary hover:text-secondary-hover font-bold text-xl transition-colors inline-flex items-center gap-2"
};

export default function EmpresaPage() {
  const stats = [
    { label: "Clientes Felices", value: "+3.000", icon: "groups" },
    { label: "Aprobación", value: "90%", icon: "verified" },
    { label: "Años de Trayectoria", value: "4", icon: "history_edu" },
    { label: "Puntos de Entrega", value: "+10", icon: "location_on" }
  ];

  return (
    <div className={styles.wrapper}>
      {/* Hero Section */}
      <section className={styles.heroSection}>
        <div className={styles.logoWrapper}>
          <img 
            src="/brands/gopaylogo.webp" 
            alt="GoPay Logo" 
            className={styles.logo}
          />
        </div>
        <p className={styles.heroSubtitle}>
          Transformamos la manera en que accedes a la tecnología, conectando personas con las herramientas que merecen.
        </p>
      </section>

      {/* Navegación Rápida */}
      <section className={styles.gridSection}>
        <div className={styles.gridWrapper}>
          <Link href="/empresa/nosotros" className={styles.gridCard}>
            <div className={styles.cardEmoji}>👥</div>
            <h3 className={styles.cardTitle}>Nosotros</h3>
            <p className={styles.cardText}>Nuestra historia, misión y los valores que nos guían cada día.</p>
          </Link>
          <Link href="/empresa/servicios" className={styles.gridCard}>
            <div className={styles.cardEmoji}>⚙️</div>
            <h3 className={styles.cardTitle}>Servicios</h3>
            <p className={styles.cardText}>Soluciones de crédito y logística diseñadas para tu comodidad.</p>
          </Link>
        </div>
      </section>

      {/* Stats Section */}
      <section className={styles.statsSection}>
        <div className={styles.statsGrid}>
          {stats.map((stat, index) => (
            <div key={index} className={styles.statItem}>
              <span className={styles.statIcon}>
                {stat.icon}
              </span>
              <div className={styles.statValue}>{stat.value}</div>
              <div className={styles.statLabel}>{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Final Call to Action */}
      <section className={styles.finalCtaSection}>
        <h2 className={styles.finalCtaTitle}>¿Listo para empezar?</h2>
        <Link href="/" className={styles.secondaryLink}>
          Volver a la tienda principal
          <span className="material-symbols-outlined">arrow_forward</span>
        </Link>
      </section>
    </div>
  );
}
