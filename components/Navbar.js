"use client";

import { useState, useEffect } from "react";
import styles from "./Navbar.module.css";

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <>
      <nav
        className={`${styles.nav} ${scrolled ? styles.scrolled : ""}`}
        id="navbar"
      >
        <div className={styles.navInner}>
          <a href="#" className={styles.logo}>
            <span className={styles.logoIcon}>📊</span>
            <span>FinanceAI</span>
          </a>

          <div className={styles.navLinks}>
            <a href="#features" className={styles.navLink}>
              Features
            </a>
            <a href="#pricing" className={styles.navLink}>
              Pricing
            </a>
            <a href="#" className={styles.navLink}>
              About
            </a>
            <a href="#" className={styles.navLink}>
              Blog
            </a>
            <a href="/settings" className={styles.navLink} style={{ color: "var(--accent-start)" }}>
              ⚙️ Settings
            </a>
          </div>

          <div className={styles.navActions}>
            <a href="#hero" className={styles.navSignIn}>Dashboard</a>
            <a href="#pricing" className={`btn-primary ${styles.navCta}`}>
              <span>Get Started</span>
            </a>
          </div>

          <button
            className={`${styles.hamburger} ${mobileOpen ? styles.open : ""}`}
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
            id="menu-toggle"
          >
            <span />
            <span />
            <span />
          </button>
        </div>
      </nav>

      <div
        className={`${styles.mobileMenu} ${mobileOpen ? styles.open : ""}`}
      >
        <a
          href="#features"
          className={styles.mobileLink}
          onClick={() => setMobileOpen(false)}
        >
          Features
        </a>
        <a
          href="#pricing"
          className={styles.mobileLink}
          onClick={() => setMobileOpen(false)}
        >
          Pricing
        </a>
        <a
          href="#"
          className={styles.mobileLink}
          onClick={() => setMobileOpen(false)}
        >
          About
        </a>
        <a
          href="#"
          className={styles.mobileLink}
          onClick={() => setMobileOpen(false)}
        >
          Blog
        </a>
        <a
          href="#pricing"
          className="btn-primary"
          style={{ marginTop: 16, textDecoration: "none" }}
          onClick={() => setMobileOpen(false)}
        >
          <span>Get Started Free</span>
        </a>
      </div>
    </>
  );
}
