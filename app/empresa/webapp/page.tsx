import React from "react";
import Link from "next/link";

export const revalidate = 10;

const styles = {
  grid: "grid grid-cols-1 md:grid-cols-3 gap-6",
  card: "group relative bg-slate-900/40 backdrop-blur-xl border border-slate-800 p-8 rounded-3xl hover:border-secondary/50 transition-all duration-300 flex flex-col items-center text-center gap-6 overflow-hidden",
  cardGlow: "absolute -bottom-12 -right-12 w-32 h-32 bg-secondary/5 rounded-full blur-3xl group-hover:bg-secondary/10 transition-colors",
  iconWrapper: "w-16 h-16 bg-slate-950 rounded-2xl border border-slate-800 flex items-center justify-center group-hover:scale-110 group-hover:border-secondary/30 transition-all",
  icon: "material-symbols-outlined text-3xl text-secondary",
  cardTitle: "text-xl font-bold text-slate-200",
  cardDesc: "text-sm text-slate-400 leading-relaxed",
  cardButton: "mt-auto w-full py-3 bg-slate-950 border border-slate-800 rounded-xl group-hover:bg-secondary group-hover:text-slate-950 group-hover:border-secondary font-semibold transition-all",
};

export default function WebAppPage() {
  return (
    <div className={styles.grid}>
      {/* Formulario de Ventas - Acceso para todos */}
      <Link href="/empresa/webapp/ventas" className={styles.card}>
        <div className={styles.cardGlow} />
        <div className={styles.iconWrapper}>
          <span className={styles.icon}>point_of_sale</span>
        </div>
        <div>
          <h2 className={styles.cardTitle}>Formulario de Ventas</h2>
          <p className={styles.cardDesc}>Registro de nuevos pedidos y notificaciones a repartidores</p>
        </div>
        <div className={styles.cardButton}>Acceder</div>
      </Link>

      {/* Stock de Ventas - Bloqueado para Closer en la subpágina */}
      <Link href="/empresa/webapp/stock" className={styles.card}>
        <div className={styles.cardGlow} />
        <div className={styles.iconWrapper}>
          <span className={styles.icon}>inventory_2</span>
        </div>
        <div>
          <h2 className={styles.cardTitle}>Stock disponible</h2>
          <p className={styles.cardDesc}>Consulta y actualiza stock de los productos.</p>
        </div>
        <div className={styles.cardButton}>Acceder</div>
      </Link>

      {/* Dashboard - Bloqueado para Closer en la subpágina */}
      <Link href="/empresa/webapp/dashboard" className={styles.card}>
        <div className={styles.cardGlow} />
        <div className={styles.iconWrapper}>
          <span className={styles.icon}>monitoring</span>
        </div>
        <div>
          <h2 className={styles.cardTitle}>Dashboard</h2>
          <p className={styles.cardDesc}>Visualiza métricas, reportes y el rendimiento de la empresa.</p>
        </div>
        <div className={styles.cardButton}>Acceder</div>
      </Link>
    </div>
  );
}
