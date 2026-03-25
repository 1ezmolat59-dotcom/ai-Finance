import styles from "./Pricing.module.css";

const tiers = [
  {
    name: "Free",
    price: "0",
    description: "Perfect for getting started with smart finance tracking.",
    features: [
      "Connect up to 2 accounts",
      "Basic spending insights",
      "Monthly budget summaries",
      "Bill reminders",
      "Community support",
    ],
    cta: "Get Started Free",
    popular: false,
  },
  {
    name: "Pro",
    price: "12",
    description: "Advanced AI features for serious financial growth.",
    features: [
      "Unlimited account connections",
      "AI-powered spending analysis",
      "Custom budget alerts",
      "Investment tracking",
      "Weekly financial reports",
      "Priority support",
      "Export to CSV / PDF",
    ],
    cta: "Start Pro Trial",
    popular: true,
  },
  {
    name: "Enterprise",
    price: "39",
    description: "Full-suite tools for teams and financial professionals.",
    features: [
      "Everything in Pro",
      "Multi-user access",
      "Custom API integrations",
      "Dedicated account manager",
      "Advanced forecasting models",
      "SOC-2 compliance",
      "White-label options",
    ],
    cta: "Contact Sales",
    popular: false,
  },
];

export default function Pricing() {
  return (
    <section className={`section-padding ${styles.pricing}`} id="pricing">
      <div className="container">
        <div className={styles.pricingHeader}>
          <div className="section-badge">💎 Pricing</div>
          <h2 className="section-title">
            Plans that <span className="gradient-text">scale with you</span>
          </h2>
          <p className="section-subtitle">
            Start free and upgrade as you grow. No hidden fees, cancel anytime.
          </p>
        </div>

        <div className={styles.cards}>
          {tiers.map((tier, idx) => (
            <div
              key={idx}
              className={`${styles.card} ${
                tier.popular ? styles.popular : ""
              }`}
            >
              {tier.popular && (
                <span className={styles.popularBadge}>Most Popular</span>
              )}
              <div className={styles.tierName}>{tier.name}</div>
              <div className={styles.price}>
                <span className={styles.priceCurrency}>$</span>
                <span className={styles.priceAmount}>{tier.price}</span>
                <span className={styles.pricePeriod}>/mo</span>
              </div>
              <p className={styles.priceDescription}>{tier.description}</p>
              <ul className={styles.featureList}>
                {tier.features.map((f, i) => (
                  <li key={i} className={styles.featureItem}>
                    <span className={styles.featureCheck}>✓</span>
                    {f}
                  </li>
                ))}
              </ul>
              <button
                className={`${styles.cardCta} ${
                  tier.popular ? styles.ctaFilled : styles.ctaOutline
                }`}
                id={`pricing-cta-${tier.name.toLowerCase()}`}
              >
                {tier.cta}
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
