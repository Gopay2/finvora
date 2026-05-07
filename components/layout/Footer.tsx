import React from "react";

/**
 * Styles configuration following Next.js Code Quality best practices.
 */
const styles = {
  footerWrapper: "bg-slate-950 border-t border-slate-800/50 pt-20",
  footerContainer: "max-w-7xl mx-auto px-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 md:gap-y-0 lg:gap-12 pb-16",
  brandColumn: "lg:col-span-2",
  logoWrapper: "mb-6",
  logoImage: "h-26 w-auto object-contain",
  brandDescription: "text-slate-400 text-sm max-w-sm mb-8 leading-relaxed",
  columnTitle: "text-white font-bold mb-6",
  contactList: "space-y-4",
  contactItem: "text-slate-500 text-sm flex items-center gap-2",
  socialWrapper: "flex gap-4",
  socialIcon: "w-10 h-10 rounded-full bg-slate-950/50 border border-slate-800 flex items-center justify-center text-slate-400 hover:text-secondary hover:bg-secondary/10 transition-all shadow-lg",
  bottomBar: "max-w-7xl mx-auto px-8 py-8 border-t border-slate-900 text-center",
  legalText: "text-slate-600 text-xs",
};

/**
 * Footer Component
 * Contains the company copyright info, contact details, and social media links.
 */
export default function Footer() {
  return (
    <footer className={styles.footerWrapper}>
      <div className={styles.footerContainer}>
        {/* Column 1 & 2: Brand */}
        <div className={styles.brandColumn}>
          <div className={styles.logoWrapper}>
            <img
              alt="GoPay Logo"
              className={styles.logoImage}
              src="/brands/gopaylogo.webp"
            />
          </div>
          <p className={styles.brandDescription}>
            © 2026 GoPay México. Tu celular nuevo en 5 minutos, sin salir de casa. Transformando el acceso a la tecnología en México.
          </p>
        </div>

        {/* Column 3: Contact */}
        <div className="md:pl-28 lg:pl-0">
          <h4 className={styles.columnTitle}>Contacto</h4>
          <ul className={styles.contactList}>
            <li className={styles.contactItem}>
              <span className="material-symbols-outlined text-sm" data-icon="mail">mail</span>
              contacto@gopay.mx
            </li>
          </ul>
        </div>

        {/* Responsive Spacer for Tablet (md) layout */}
        <div className="hidden md:block lg:hidden" aria-hidden="true"></div>

        {/* Column 4: Social Media */}
        <div className="md:-mt-8 md:pl-28 lg:mt-0 lg:pl-0">
          <h4 className={styles.columnTitle}>Síguenos</h4>
          <div className={styles.socialWrapper}>
            <a className={styles.socialIcon} href="#">
              <i className="fa-brands fa-facebook-f"></i>
            </a>
            <a className={styles.socialIcon} href="#">
              <i className="fa-brands fa-instagram"></i>
            </a>
            <a className={styles.socialIcon} href="#">
              <i className="fa-brands fa-tiktok"></i>
            </a>
          </div>
        </div>
      </div>
      <div className={styles.bottomBar}>
        <p className={styles.legalText}>GoPay es una marca registrada. Todos los derechos reservados 2026.</p>
      </div>
    </footer>
  );
}
