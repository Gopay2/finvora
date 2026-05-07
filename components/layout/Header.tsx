"use client";

import React, { useState } from "react";
import Link from "next/link";

/**
 * Interface representing a navigation link item
 */
interface NavItem {
  label: string;
  href: string;
}

/**
 * Header Component
 * Displays the main navigation bar with the logo and desktop/mobile navigation links.
 */
const styles = {
  header: "fixed top-0 w-full z-50 bg-slate-950/80 backdrop-blur-xl shadow-2xl shadow-blue-900/20 font-[family-name:var(--font-outfit)]",
  container: "w-full max-w-[1920px] mx-auto px-4 md:px-8 lg:px-10 py-3 flex justify-between items-center relative z-10",
  logoContainer: "flex items-center",
  logo: "w-auto object-contain h-8 md:h-16 scale-[1.5] md:scale-[1.8] origin-left",
  desktopNavWrapper: "hidden lg:flex flex-col items-end gap-2",
  desktopNavMain: "flex items-center gap-10",
  desktopNavLink: "text-lg text-slate-400 font-medium transition-colors hover:text-secondary",
  desktopNavDivider: "w-full border-b border-slate-800/50",
  desktopNavSub: "block",
  desktopNavSubLink: "text-base text-slate-500 hover:text-secondary transition-colors",
  mobileButton: "lg:hidden text-slate-400 hover:text-secondary p-2 focus:outline-none transition-colors relative w-10 h-10 flex items-center justify-center",
  mobileDropdown: "lg:hidden absolute top-full left-0 w-full bg-slate-950/95 backdrop-blur-xl border-t border-slate-800/50 shadow-2xl transition-all duration-300 origin-top",
  mobileNav: "flex flex-col px-6 py-4",
  mobileNavLink: "text-slate-300 font-medium transition-colors hover:text-secondary py-4",
  mobileNavSubLink: "text-slate-500 text-sm font-medium transition-colors hover:text-secondary py-4 border-t border-slate-800/50 mt-2"
};

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const navItems: NavItem[] = [
    { label: "Inicio", href: "#" },
    { label: "Cómo funciona", href: "#como-funciona" },
    { label: "Marcas", href: "#marcas" },
    { label: "Testimonios", href: "#testimonios" },
    { label: "Preguntas Frecuentes", href: "#preguntas-frecuentes" }
  ];

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

  return (
    <header className={styles.header}>
      <div className={styles.container}>
        <div className={styles.logoContainer}>
          <img
            alt="GoPay Logo"
            className={styles.logo}
            src="/brands/gopaylogo.webp"
          />
        </div>

        {/* Desktop Navigation */}
        <div className={styles.desktopNavWrapper}>
          <nav className={styles.desktopNavMain}>
            {navItems.map((navItem, index) => (
              <a key={index} className={styles.desktopNavLink} href={navItem.href}>
                {navItem.label}
              </a>
            ))}
          </nav>
          <div className={styles.desktopNavDivider}></div>
          <nav className={styles.desktopNavSub}>
            <a href="/empresa" className={styles.desktopNavSubLink}>Empresa</a>
          </nav>
        </div>

        {/* Mobile Menu Button */}
        <button
          aria-label={isMenuOpen ? "Close menu" : "Open menu"}
          onClick={toggleMenu}
          className={styles.mobileButton}
        >
          <div className="w-6 h-3.5 relative">
            <span
              className={`absolute left-0 h-[2px] w-full bg-current rounded-full transition-all duration-300 ease-in-out ${isMenuOpen ? "top-1/2 -translate-y-1/2 rotate-45" : "top-0"
                }`}
            />
            <span
              className={`absolute left-0 h-[2px] w-full bg-current rounded-full transition-all duration-300 ease-in-out ${isMenuOpen ? "top-1/2 -translate-y-1/2 -rotate-45" : "bottom-0"
                }`}
            />
          </div>
        </button>
      </div>

      {/* Mobile Menu Dropdown */}
      <div
        className={`
          ${styles.mobileDropdown} 
          ${isMenuOpen ? "opacity-100 scale-y-100 visible" : "opacity-0 scale-y-0 invisible"}
        `}
      >
        <nav className={styles.mobileNav}>
          {navItems.map((navItem, index) => (
            <a
              key={index}
              className={styles.mobileNavLink}
              href={navItem.href}
              onClick={() => setIsMenuOpen(false)}
            >
              {navItem.label}
            </a>
          ))}
          <a
            className={styles.mobileNavSubLink}
            href="/empresa"
            onClick={() => setIsMenuOpen(false)}
          >
            Empresa
          </a>
        </nav>
      </div>
    </header>
  );
}
