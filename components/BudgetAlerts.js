"use client";

import { useState } from "react";
import { useCurrency } from "./CurrencyProvider";
import styles from "./BudgetAlerts.module.css";

const initialBudgets = [
  { category: "Groceries", icon: "🛒", spent: 420, spentCurrency: "USD", limitUSD: 500 },
  { category: "Paris Trip Dining", icon: "🍽️", spent: 280, spentCurrency: "EUR", limitUSD: 350 },
  { category: "London Tube", icon: "🚆", spent: 140, spentCurrency: "GBP", limitUSD: 200 },
  { category: "Entertainment", icon: "🎬", spent: 95, spentCurrency: "USD", limitUSD: 150 },
  { category: "Souvenirs (Lagos)", icon: "🛍️", spent: 85000, spentCurrency: "NGN", limitUSD: 400 },
];

function getStatus(spentBase, limitBase) {
  const pct = (spentBase / limitBase) * 100;
  // Account for floating point precision issues
  if (pct >= 99.99) return "exceeded";
  if (pct >= 80) return "warning";
  return "safe";
}

export default function BudgetAlerts() {
  const [budgets, setBudgets] = useState(initialBudgets);
  const { baseCurrency, currencyMeta, convert, formatAmount } = useCurrency();

  const budgetsWithConversion = budgets.map((b) => {
    const spentBase = Math.max(0, convert(b.spent, b.spentCurrency, baseCurrency));
    const limitBase = Math.max(0.01, convert(b.limitUSD, "USD", baseCurrency));
    const status = getStatus(spentBase, limitBase);
    const pct = Math.min((spentBase / limitBase) * 100, 120);
    const displayPct = Math.round((spentBase / limitBase) * 100);
    
    return { ...b, spentBase, limitBase, status, pct, displayPct };
  });

  const hasAlerts = budgetsWithConversion.some((b) => b.status !== "safe");

  const adjustSpending = (idx, deltaBase) => {
    setBudgets((prev) =>
      prev.map((b, i) => {
        if (i === idx) {
          // Convert the base currency delta back to the item's original currency to adjust its original amount
          const deltaOriginal = convert(deltaBase, baseCurrency, b.spentCurrency);
          return { ...b, spent: Math.max(0, b.spent + deltaOriginal) };
        }
        return b;
      })
    );
  };

  return (
    <section
      className={`section-padding ${styles.budgetSection}`}
      id="budget-alerts"
    >
      <div className="container">
        <div className={styles.header}>
          <div className="section-badge">🚨 Budget Alerts</div>
          <h2 className="section-title">
            Stay in control with{" "}
            <span className="gradient-text">smart limits</span>
          </h2>
          <p className="section-subtitle">
            Set expected budgets. Get instant visual alerts when spending
            approaches or exceeds your limits. Live currency conversions guarantee accuracy everywhere you go.
          </p>
        </div>

        {/* Alert Banner */}
        {hasAlerts && (
          <div className={styles.alertBanner}>
            <span className={styles.alertIcon}>⚠️</span>
            <span>
              <strong>Budget Alert:</strong> You have categories exceeding 80%
              of their limits. Review your spending below.
            </span>
          </div>
        )}

        {/* Budget Cards */}
        <div className={styles.budgetGrid}>
          {budgetsWithConversion.map((b, idx) => {
            return (
              <div
                key={idx}
                className={`${styles.budgetCard} ${
                  b.status === "exceeded"
                    ? styles.cardExceeded
                    : b.status === "warning"
                    ? styles.cardWarning
                    : ""
                }`}
              >
                <div className={styles.cardTop}>
                  <div className={styles.categoryInfo}>
                    <span className={styles.categoryIcon}>{b.icon}</span>
                    <div>
                      <div className={styles.categoryName}>{b.category}</div>
                      <div className={styles.categoryAmounts}>
                        {formatAmount(b.spentBase, baseCurrency)} /{" "}
                        {formatAmount(b.limitBase, baseCurrency)}
                        {b.spentCurrency !== baseCurrency && (
                          <span style={{ display: 'block', fontSize: '0.7em', marginTop: '2px', opacity: 0.7 }}>
                            (Spent: {currencyMeta[b.spentCurrency]?.symbol}{b.spent.toLocaleString(undefined, { maximumFractionDigits: 2 })})
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div
                    className={`${styles.percentBadge} ${
                      b.status === "exceeded"
                        ? styles.percentExceeded
                        : b.status === "warning"
                        ? styles.percentWarning
                        : styles.percentSafe
                    }`}
                  >
                    {b.displayPct}%
                  </div>
                </div>

                {/* Progress Bar */}
                <div className={styles.progressTrack}>
                  <div
                    className={`${styles.progressFill} ${
                      b.status === "exceeded"
                        ? styles.fillExceeded
                        : b.status === "warning"
                        ? styles.fillWarning
                        : styles.fillSafe
                    }`}
                    style={{ width: `${Math.min(b.pct, 100)}%` }}
                  />
                  {/* 80% threshold marker */}
                  <div className={styles.thresholdMarker} />
                </div>

                {/* Status label */}
                <div className={styles.statusRow}>
                  {b.status === "exceeded" && (
                    <span className={styles.alertLabel}>
                      <span className={styles.alertPulse} />
                      Over limit by {formatAmount(b.spentBase - b.limitBase, baseCurrency)}
                    </span>
                  )}
                  {b.status === "warning" && (
                    <span className={styles.warningLabel}>
                      <span className={styles.warningPulse} />⚠ Over 80% of
                      limit
                    </span>
                  )}
                  {b.status === "safe" && (
                    <span className={styles.safeLabel}>
                      ✓ {formatAmount(b.limitBase - b.spentBase, baseCurrency)} remaining
                    </span>
                  )}

                  {/* Adjust buttons (adjusting by $50 base currency equivalent) */}
                  <div className={styles.adjustBtns}>
                    <button
                      className={styles.adjustBtn}
                      onClick={() => adjustSpending(idx, -50)}
                      aria-label={`Decrease ${b.category} spending`}
                    >
                      −
                    </button>
                    <button
                      className={styles.adjustBtn}
                      onClick={() => adjustSpending(idx, 50)}
                      aria-label={`Increase ${b.category} spending`}
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
