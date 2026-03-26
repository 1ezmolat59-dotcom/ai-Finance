"use client";

import { useState } from "react";
import Link from "next/link";
import { useCurrency } from "./CurrencyProvider";
import { useExpenseTracker } from "../hooks/useExpenseTracker";
import ProModal from "./ProModal";
import styles from "./Hero.module.css";

const chartHeights = [35, 55, 45, 70, 60, 85, 50, 75, 65, 90, 55, 80];

const baseTransactions = [
  {
    icon: "🛒",
    name: "Grocery Store",
    category: "Essentials",
    baseAmount: -84.32,
    originalCurrency: "USD",
    type: "neg",
    bg: "rgba(255, 107, 107, 0.1)",
  },
  {
    icon: "🛫",
    name: "Flight to Paris",
    category: "Travel",
    baseAmount: -120.00,
    originalCurrency: "EUR",
    type: "neg",
    bg: "rgba(255, 165, 0, 0.1)",
  },
  {
    icon: "🚆",
    name: "London Tube",
    category: "Transport",
    baseAmount: -15.50,
    originalCurrency: "GBP",
    type: "neg",
    bg: "rgba(99, 102, 241, 0.1)",
  },
];

const sampleExpenses = [
  { icon: "☕", name: "Coffee Shop", category: "Food & Drink", baseAmount: 5.40, type: "neg", bg: "rgba(255, 165, 0, 0.1)" },
  { icon: "🎬", name: "Movie Tickets", category: "Entertainment", baseAmount: 24.00, type: "neg", bg: "rgba(99, 102, 241, 0.1)" },
  { icon: "🏋️", name: "Gym Membership", category: "Health", baseAmount: 45.00, type: "neg", bg: "rgba(0, 212, 170, 0.1)" },
];

const baseBalanceUSD = 12847.63;

export default function Hero() {
  const { baseCurrency, currencyMeta, rateSource, convert, formatAmount } =
    useCurrency();
  const { expenses, freeExpensesUsed, canAddExpense, addExpense, limit, loading } =
    useExpenseTracker();
  const [showProModal, setShowProModal] = useState(false);

  const currentMeta = currencyMeta[baseCurrency] || currencyMeta.USD;
  const convertedBalance = convert(baseBalanceUSD, "USD", baseCurrency);

  const handleAddExpense = async () => {
    if (!canAddExpense) {
      setShowProModal(true);
      return;
    }
    // Pick a random sample expense to add
    const sample = sampleExpenses[Math.floor(Math.random() * sampleExpenses.length)];
    await addExpense(sample);
  };

  // Combine user expenses with static preview transactions for display
  const displayTransactions = expenses.length > 0
    ? expenses.slice(0, 5).map((e) => ({
        icon: e.icon,
        name: e.name,
        category: e.category,
        baseAmount: -Math.abs(e.baseAmount),
        originalCurrency: "USD",
        type: "neg",
        bg: e.bg || "rgba(255, 107, 107, 0.1)",
      }))
    : baseTransactions;

  const counterColor = !canAddExpense
    ? "var(--danger)"
    : freeExpensesUsed >= 2
      ? "var(--warning, #f59e0b)"
      : "var(--accent-start)";

  return (
    <section className={styles.hero} id="hero">
      {/* Background Orbs */}
      <div className={`${styles.orb} ${styles.orb1}`} />
      <div className={`${styles.orb} ${styles.orb2}`} />
      <div className={`${styles.orb} ${styles.orb3}`} />

      <div className={styles.heroInner}>
        {/* Left: Text Content */}
        <div className={styles.heroContent}>
          <div className={styles.heroBadge}>
            <span className={styles.dot} />
            AI-Powered Finance
          </div>

          <h1 className={styles.heroTitle}>
            Your Money,{" "}
            <span className="gradient-text">Powered by AI</span>
          </h1>

          <p className={styles.heroDescription}>
            Stop guessing where your money goes. Our AI analyzes your spending,
            predicts upcoming bills, and delivers personalized insights to help
            you save more — effortlessly. Automatically converted globally.
          </p>

          <div className={styles.heroCtas}>
            <button className="btn-primary" id="hero-cta-primary">
              <span>Start Free Trial →</span>
            </button>
            <button className="btn-secondary" id="hero-cta-secondary">
              Watch Demo
            </button>
          </div>

          <div className={styles.heroStats}>
            <div className={styles.stat}>
              <span className={`${styles.statValue} gradient-text`}>50K+</span>
              <span className={styles.statLabel}>Active Users</span>
            </div>
            <div className={styles.stat}>
              <span className={`${styles.statValue} gradient-text`}>$2.4M</span>
              <span className={styles.statLabel}>Money Saved</span>
            </div>
            <div className={styles.stat}>
              <span className={`${styles.statValue} gradient-text`}>4.9★</span>
              <span className={styles.statLabel}>User Rating</span>
            </div>
          </div>
        </div>

        {/* Right: Dashboard Mockup */}
        <div className={styles.heroVisual}>
          <div className={styles.dashboardCard}>
            <div className={styles.dashHeader}>
              <span className={styles.dashTitle}>Portfolio Overview</span>
              <span className={styles.dashBadge}>
                {rateSource === "live" ? "Live Rates" : "Fallback Rates"}
              </span>
            </div>

            {/* Current Base Currency Display linked to Settings */}
            <div className={styles.currencySelector}>
              <Link href="/settings" className={`${styles.currencyBtn} ${styles.currencyBtnActive}`} style={{ textDecoration: 'none' }}>
                <span className={styles.currencyFlag}>{currentMeta.flag}</span>
                Base Currency: {baseCurrency} (Change ⚙️)
              </Link>
            </div>

            <div className={styles.dashBalance}>
              {formatAmount(convertedBalance, baseCurrency)}
            </div>
            <div className={styles.dashChange}>↑ +12.4% this month</div>

            <div className={styles.dashChart}>
              {chartHeights.map((h, i) => (
                <div
                  key={i}
                  className={styles.chartBar}
                  style={{ height: `${h}%` }}
                />
              ))}
            </div>

            {/* Free usage counter and Add Expense button */}
            <div className={styles.addExpenseWrapper}>
              <div className={styles.expenseCounter}>
                <span
                  className={styles.counterDot}
                  style={{ background: counterColor, color: counterColor }}
                />
                <span style={{ color: counterColor }}>
                  {freeExpensesUsed}/{limit} free expenses used
                </span>
              </div>
              <button
                className={`${styles.addExpenseBtn} ${!canAddExpense ? styles.addExpenseDisabled : ""}`}
                onClick={handleAddExpense}
                disabled={loading}
              >
                {!canAddExpense ? "Upgrade to Pro" : "+ Add Expense"}
              </button>
            </div>

            <div className={styles.dashItems}>
              {displayTransactions.map((tx, i) => {
                const convertedAmount = convert(
                  tx.baseAmount,
                  tx.originalCurrency,
                  baseCurrency
                );

                return (
                  <div key={i} className={styles.dashItem}>
                    <div className={styles.dashItemLeft}>
                      <div
                        className={styles.dashItemIcon}
                        style={{ background: tx.bg }}
                      >
                        {tx.icon}
                      </div>
                      <div>
                        <div className={styles.dashItemName}>{tx.name}</div>
                        <div className={styles.dashItemCategory}>
                          {tx.category}
                        </div>
                      </div>
                    </div>
                    <div
                      className={
                        tx.type === "neg"
                          ? styles.dashItemAmountNeg
                          : styles.dashItemAmountPos
                      }
                    >
                      {formatAmount(convertedAmount, baseCurrency)}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <ProModal isOpen={showProModal} onClose={() => setShowProModal(false)} />
    </section>
  );
}
