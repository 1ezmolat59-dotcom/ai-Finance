"use client";

import { useState } from "react";
import { useCurrency } from "./CurrencyProvider";
import { useExpenseTracker } from "../hooks/useExpenseTracker";
import ProModal from "./ProModal";
import styles from "./Hero.module.css";

// Removed static currencies object

const chartHeights = [35, 55, 45, 70, 60, 85, 50, 75, 65, 90, 55, 80];

const baseTransactions = [
  {
    icon: "🛒",
    name: "Grocery Store",
    category: "Essentials",
    baseAmount: -84.32,
    type: "neg",
    bg: "rgba(255, 107, 107, 0.1)",
  },
  {
    icon: "💰",
    name: "Salary Deposit",
    category: "Income",
    baseAmount: 4500.0,
    type: "pos",
    bg: "rgba(0, 212, 170, 0.1)",
  },
  {
    icon: "☕",
    name: "AI Savings Tip",
    category: "Insight",
    baseAmount: 42,
    type: "tip",
    bg: "rgba(0, 180, 216, 0.1)",
  },
];

const baseBalance = 12847.63;

function formatAmountLocal(value, formatAmount, baseCurrency, isTip) {
  const formatted = formatAmount(value, baseCurrency);
  if (isTip) return `Save ${formatted}/mo`;
  return formatted;
}

function formatBalanceLocal(convert, formatAmount, baseCurrency) {
  const converted = convert(baseBalance, "USD", baseCurrency);
  return formatAmount(converted, baseCurrency);
}

export default function Hero() {
  const { baseCurrency, setBaseCurrency, currencyMeta, convert, formatAmount } = useCurrency();
  const { expenses, freeExpensesUsed, canAddExpense, addExpense, limit } = useExpenseTracker();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleAddExpense = () => {
    if (canAddExpense) {
      addExpense({
        icon: "🛍️",
        name: "Quick Purchase",
        category: "Shopping",
        baseAmount: -(Math.floor(Math.random() * 50) + 10),
        type: "neg",
        bg: "rgba(99, 102, 241, 0.1)",
      });
    } else {
      setIsModalOpen(true);
    }
  };

  const allTransactions = [...expenses, ...baseTransactions].slice(0, 4);

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
            you save more — effortlessly.
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
              <span className={styles.dashBadge}>Live</span>
            </div>

            {/* Currency Selector */}
            <div className={styles.currencySelector}>
              {Object.entries(currencyMeta).map(([code, meta]) => (
                <button
                  key={code}
                  className={`${styles.currencyBtn} ${
                    baseCurrency === code ? styles.currencyBtnActive : ""
                  }`}
                  onClick={() => setBaseCurrency(code)}
                  id={`currency-${code.toLowerCase()}`}
                >
                  <span className={styles.currencyFlag}>{meta.flag}</span>
                  {code}
                </button>
              ))}
            </div>

            <div className={styles.dashBalance}>{formatBalanceLocal(convert, formatAmount, baseCurrency)}</div>
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

            <div className={styles.addExpenseWrapper}>
              <div className={styles.expenseCounter}>
                <span className={styles.counterDot} style={{ background: canAddExpense ? 'var(--success)' : 'var(--danger)' }} />
                {freeExpensesUsed}/{limit} free expenses used
              </div>
              <button 
                className={`${styles.addExpenseBtn} ${!canAddExpense ? styles.addExpenseDisabled : ""}`}
                onClick={handleAddExpense}
              >
                <span>➕ Add Expense</span>
              </button>
            </div>

            <div className={styles.dashItems}>
              {allTransactions.map((tx, i) => (
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
                    {formatAmountLocal(
                      convert(tx.baseAmount, "USD", baseCurrency),
                      formatAmount,
                      baseCurrency,
                      tx.type === "tip"
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <ProModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </section>
  );
}
