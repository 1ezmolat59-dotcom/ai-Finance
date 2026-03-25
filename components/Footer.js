import styles from "./Footer.module.css";

const columns = [
  {
    title: "Product",
    links: ["Features", "Pricing", "Integrations", "Changelog", "Docs"],
  },
  {
    title: "Company",
    links: ["About", "Blog", "Careers", "Press", "Contact"],
  },
  {
    title: "Resources",
    links: ["Help Center", "Community", "Status", "API", "Partners"],
  },
];

export default function Footer() {
  return (
    <footer className={styles.footer} id="footer">
      <div className="container">
        <div className={styles.footerInner}>
          {/* Brand column */}
          <div className={styles.brand}>
            <div className={styles.brandLogo}>
              <span className={styles.brandLogoIcon}>📊</span>
              <span>FinanceAI</span>
            </div>
            <p className={styles.brandDescription}>
              Smarter money management powered by artificial intelligence. Take
              control of your finances and build the future you deserve.
            </p>
            <div className={styles.socials}>
              <a href="#" className={styles.socialLink} aria-label="Twitter">
                𝕏
              </a>
              <a href="#" className={styles.socialLink} aria-label="GitHub">
                ⌨
              </a>
              <a href="#" className={styles.socialLink} aria-label="LinkedIn">
                in
              </a>
              <a href="#" className={styles.socialLink} aria-label="YouTube">
                ▶
              </a>
            </div>
          </div>

          {/* Link columns */}
          {columns.map((col, idx) => (
            <div key={idx} className={styles.column}>
              <h4 className={styles.columnTitle}>{col.title}</h4>
              <div className={styles.columnLinks}>
                {col.links.map((link, i) => (
                  <a key={i} href="#" className={styles.columnLink}>
                    {link}
                  </a>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className={styles.footerBottom}>
          <span className={styles.copyright}>
            © 2026 FinanceAI. All rights reserved.
          </span>
          <div className={styles.bottomLinks}>
            <a href="#" className={styles.bottomLink}>
              Privacy Policy
            </a>
            <a href="#" className={styles.bottomLink}>
              Terms of Service
            </a>
            <a href="#" className={styles.bottomLink}>
              Cookie Policy
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
