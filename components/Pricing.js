"use client";

import { useState, useEffect } from "react";
import styles from "./Pricing.module.css";
import { createCheckoutSession, getStripePriceIds, getPaymentLinks } from "../app/actions/checkout";

export default function Pricing() {
  const [isAnnual, setIsAnnual] = useState(false);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(null);
  const [priceIds, setPriceIds] = useState({ monthlyPriceId: null, annualPriceId: null });
  const [paymentLinks, setPaymentLinks] = useState({ monthlyLink: null, annualLink: null });

  useEffect(() => {
    getStripePriceIds().then(setPriceIds);
    getPaymentLinks().then(setPaymentLinks);
  }, []);

  const handleCheckout = async (tierName) => {
    if (tierName !== "Pro") return;

    try {
      setLoading(true);
      const clientId = localStorage.getItem("finance_ai_client_id") || "anonymous";
      const priceId = isAnnual ? priceIds.annualPriceId : priceIds.monthlyPriceId;

      if (!priceId) {
        throw new Error("Price IDs not loaded. Please check your .env.local configuration.");
      }

      const url = await createCheckoutSession(priceId, clientId);

      if (url) {
        window.location.href = url;
      }
    } catch (err) {
      console.error(err);
      alert(err.message || "Checkout Failed. Please ensure your Stripe Secret Key is added to .env.local!");
    } finally {
      setLoading(false);
    }
  };

  const handleCopyLink = async () => {
    const link = isAnnual ? paymentLinks.annualLink : paymentLinks.monthlyLink;
    if (!link) return;
    try {
      await navigator.clipboard.writeText(link);
      setCopied(isAnnual ? "annual" : "monthly");
      setTimeout(() => setCopied(null), 2000);
    } catch {
      // Fallback for non-HTTPS contexts
      const textarea = document.createElement("textarea");
      textarea.value = link;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setCopied(isAnnual ? "annual" : "monthly");
      setTimeout(() => setCopied(null), 2000);
    }
  };

  const currentPaymentLink = isAnnual ? paymentLinks.annualLink : paymentLinks.monthlyLink;

  const tiers = [
    {
      name: "Free",
      price: "0",
      period: "forever",
      description: "Perfect for getting started with smart finance tracking.",
      features: [
        "3 expenses per 24 hours",
        "Connect up to 2 accounts",
        "Basic spending insights",
        "Monthly budget summaries",
        "Community support",
      ],
      cta: "Current Plan",
      popular: false,
    },
    {
      name: "Pro",
      price: isAnnual ? "99" : "12",
      period: isAnnual ? "/yr" : "/mo",
      description: "Advanced AI features for serious financial growth.",
      features: [
        "Unlimited expense tracking",
        "AI-powered spending analysis",
        "Custom budget alerts",
        "Investment tracking",
        "Weekly financial reports",
        "Priority support",
        "Export to CSV / PDF",
      ],
      cta: loading ? "Redirecting..." : (isAnnual ? "Start Annual Pro" : "Start Monthly Pro"),
      popular: true,
    },
    {
      name: "Enterprise",
      price: "39",
      period: "/user/mo",
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

          <div className={styles.toggleContainer}>
            <span className={`${styles.toggleLabel} ${!isAnnual ? styles.activeLabel : ""}`}>Monthly</span>
            <button
              className={styles.toggleSwitch}
              onClick={() => setIsAnnual(!isAnnual)}
              aria-pressed={isAnnual}
            >
              <div className={`${styles.toggleHandle} ${isAnnual ? styles.handleAnnual : ""}`} />
            </button>
            <span className={`${styles.toggleLabel} ${isAnnual ? styles.activeLabel : ""}`}>
              Annually <span className={styles.saveBadge}>Save 30%</span>
            </span>
          </div>
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
                <span className={styles.pricePeriod}>{tier.period}</span>
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

              {/* Pro tier: Stripe hosted checkout + payment link sharing */}
              {tier.popular ? (
                <div className={styles.proActions}>
                  <button
                    onClick={() => handleCheckout(tier.name)}
                    className={`${styles.cardCta} ${styles.ctaFilled} ${loading ? styles.ctaLoading : ""}`}
                    id={`pricing-cta-${tier.name.toLowerCase()}`}
                    disabled={loading}
                  >
                    {tier.cta}
                  </button>
                  {currentPaymentLink && (
                    <div className={styles.paymentLinkRow}>
                      <a
                        href={currentPaymentLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={styles.paymentLink}
                      >
                        Open Payment Page
                      </a>
                      <button
                        onClick={handleCopyLink}
                        className={styles.copyLinkBtn}
                        title="Copy shareable payment link"
                      >
                        {copied ? "Copied!" : "Copy Link"}
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <button
                  onClick={() => handleCheckout(tier.name)}
                  className={`${styles.cardCta} ${styles.ctaOutline}`}
                  id={`pricing-cta-${tier.name.toLowerCase()}`}
                >
                  {tier.cta}
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
