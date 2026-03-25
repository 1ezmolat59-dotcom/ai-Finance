"use client";

import { useState } from "react";
import styles from "./BudgetAlerts.module.css";
import { useCurrency } from "./CurrencyProvider";

const initialBudgets = [
  { category: "Groceries", icon: "🛒", spent: 420, limit: 500 },
  { category: "Dining Out", icon: "🍽️", spent: 310, limit: 300 },
  { category: "Transport", icon: "🚗", spent: 175, limit: 200 },
  { category: "Entertainment", icon: "🎬", spent: 95, limit: 150 },
  { category: "Shopping", icon: "🛍️", spent: 680, limit: 400 },
];

function getStatus(spent, limit) {
  const pct = (spent / limit) * 100;
  if (pct >= 100) return "exceeded";
  if (pct >= 80) return "warning";
  return "safe";
}

export default function BudgetAlerts() {
  const [budgets, setBudgets] = useState(initialBudgets);
  const { baseCurrency, convert, formatAmount } = useCurrency();

  const hasAlerts = budgets.some(
    (b) => getStatus(b.spent, b.limit) !== "safe"
  );

  const adjustSpending = (idx, delta) => {
    setBudgets((prev) =>
      prev.map((b, i) =>
        i === idx ? { ...b, spent: Math.max(0, b.spent + delta) } : b
      )
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
            Set budgets per category. Get instant visual alerts when spending
            approaches or exceeds your limits.
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
          {budgets.map((b, idx) => {
            const pct = Math.min((b.spent / b.limit) * 100, 120);
            const displayPct = Math.round((b.spent / b.limit) * 100);
            const status = getStatus(b.spent, b.limit);

            return (
              <div
                key={idx}
                className={`${styles.budgetCard} ${
                  status === "exceeded"
                    ? styles.cardExceeded
                    : status === "warning"
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
                        {formatAmount(convert(b.spent, "USD", baseCurrency), baseCurrency)} /{" "}
                        {formatAmount(convert(b.limit, "USD", baseCurrency), baseCurrency)}
                      </div>
                    </div>
                  </div>
                  <div
                    className={`${styles.percentBadge} ${
                      status === "exceeded"
                        ? styles.percentExceeded
                        : status === "warning"
                        ? styles.percentWarning
                        : styles.percentSafe
                    }`}
                  >
                    {displayPct}%
                  </div>
                </div>

                {/* Progress Bar */}
                <div className={styles.progressTrack}>
                  <div
                    className={`${styles.progressFill} ${
                      status === "exceeded"
                        ? styles.fillExceeded
                        : status === "warning"
                        ? styles.fillWarning
                        : styles.fillSafe
                    }`}
                    style={{ width: `${Math.min(pct, 100)}%` }}
                  />
                  {/* 80% threshold marker */}
                  <div className={styles.thresholdMarker} />
                </div>

                {/* Status label */}
                <div className={styles.statusRow}>
                  {status === "exceeded" && (
                    <span className={styles.alertLabel}>
                      <span className={styles.alertPulse} />
                      Over limit by {formatAmount(convert(b.spent - b.limit, "USD", baseCurrency), baseCurrency)}
                    </span>
                  )}
                  {status === "warning" && (
                    <span className={styles.warningLabel}>
                      <span className={styles.warningPulse} />⚠ Over 80% of
                      limit
                    </span>
                  )}
                  {status === "safe" && (
                    <span className={styles.safeLabel}>
                      ✓ {formatAmount(convert(b.limit - b.spent, "USD", baseCurrency), baseCurrency)} remaining
                    </span>
                  )}

                  {/* Adjust buttons */}
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

        <p className={styles.hint}>
          💡 Try the <strong>+ / −</strong> buttons to simulate spending changes
          and see how alerts update in real time.
        </p>
      </div>
    </section>
  );
}
