"use client";

import { useState } from "react";
import Link from "next/link";
import { useCurrency } from "./CurrencyProvider";
import { useExpenseTracker } from "../hooks/useExpenseTracker";
import ProModal from "./ProModal";
import styles from "./Hero.module.css";

const categoryOptions = [
  { icon: "🛒", name: "Groceries", category: "Essentials", bg: "rgba(255, 107, 107, 0.1)" },
  { icon: "☕", name: "Coffee", category: "Food & Drink", bg: "rgba(255, 165, 0, 0.1)" },
  { icon: "🚆", name: "Transport", category: "Transport", bg: "rgba(99, 102, 241, 0.1)" },
  { icon: "🎬", name: "Entertainment", category: "Entertainment", bg: "rgba(0, 212, 170, 0.1)" },
  { icon: "🏋️", name: "Fitness", category: "Health", bg: "rgba(0, 180, 216, 0.1)" },
  { icon: "🛫", name: "Travel", category: "Travel", bg: "rgba(255, 165, 0, 0.1)" },
  { icon: "💊", name: "Healthcare", category: "Health", bg: "rgba(255, 107, 107, 0.1)" },
  { icon: "🛍️", name: "Shopping", category: "Shopping", bg: "rgba(99, 102, 241, 0.1)" },
];

export default function Hero() {
  const { baseCurrency, currencyMeta, rateSource, convert, formatAmount } =
    useCurrency();
  const { expenses, freeExpensesUsed, canAddExpense, addExpense, limit, loading } =
    useExpenseTracker();
  const [showProModal, setShowProModal] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ name: "", amount: "", categoryIdx: 0, currency: "USD" });
  const [submitting, setSubmitting] = useState(false);

  const currentMeta = currencyMeta[baseCurrency] || currencyMeta.USD;

  // Live balance: sum of all expenses
  const totalSpent = expenses.reduce((sum, e) => sum + Math.abs(e.baseAmount), 0);

  const handleAddClick = () => {
    if (!canAddExpense) {
      setShowProModal(true);
      return;
    }
    setShowForm(true);
  };

  const handleSubmitExpense = async (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.amount) return;

    const cat = categoryOptions[formData.categoryIdx];
    const enteredAmount = parseFloat(formData.amount);
    // Convert entered amount to USD for storage (USD is pivot currency)
    const baseAmount = convert(enteredAmount, formData.currency, "USD");
    setSubmitting(true);
    await addExpense({
      icon: cat.icon,
      name: formData.name.trim(),
      category: cat.category,
      baseAmount,
      type: "neg",
      bg: cat.bg,
    });
    setSubmitting(false);
    setFormData({ name: "", amount: "", categoryIdx: 0, currency: "USD" });
    setShowForm(false);
  };

  const handleExportCSV = () => {
    if (!expenses.length) return;
    const rows = [
      ["Name", "Category", "Amount (USD)", `Amount (${baseCurrency})`, "Date"],
      ...expenses.map((e) => [
        e.name,
        e.category,
        e.baseAmount.toFixed(2),
        convert(e.baseAmount, "USD", baseCurrency).toFixed(2),
        new Date(e.date || e.created_at).toLocaleDateString(),
      ]),
    ];
    const csv = rows.map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "expenses.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const counterColor = !canAddExpense
    ? "var(--danger)"
    : freeExpensesUsed >= 2
      ? "var(--warning, #f59e0b)"
      : "var(--accent-start)";

  // Chart heights based on real expense data (last 7 entries, or placeholders)
  const chartData = [];
  for (let i = 0; i < 12; i++) {
    const exp = expenses[i];
    chartData.push(exp ? Math.min(Math.max((Math.abs(exp.baseAmount) / 100) * 80, 15), 95) : 20 + Math.random() * 15);
  }

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
            <a href="#pricing" className="btn-primary" id="hero-cta-primary">
              <span>Start Free Trial →</span>
            </a>
            <a href="#dashboard" className="btn-secondary" id="hero-cta-secondary">
              Watch Demo
            </a>
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

        {/* Right: Live Dashboard */}
        <div className={styles.heroVisual} id="dashboard">
          <div className={styles.dashboardCard}>
            <div className={styles.dashHeader}>
              <span className={styles.dashTitle}>
                {expenses.length > 0 ? "Your Dashboard" : "Portfolio Overview"}
              </span>
              <span className={styles.dashBadge}>
                {rateSource === "live" ? "Live" : "Offline"}
              </span>
            </div>

            {/* Current Base Currency Display linked to Settings */}
            <div className={styles.currencySelector}>
              <Link href="/settings" className={`${styles.currencyBtn} ${styles.currencyBtnActive}`} style={{ textDecoration: 'none' }}>
                <span className={styles.currencyFlag}>{currentMeta.flag}</span>
                Base: {baseCurrency} (Change ⚙️)
              </Link>
            </div>

            <div className={styles.dashBalance}>
              {formatAmount(
                convert(totalSpent, "USD", baseCurrency),
                baseCurrency
              )}
            </div>
            <div className={styles.dashChange}>
              {expenses.length > 0
                ? `${expenses.length} expense${expenses.length !== 1 ? "s" : ""} tracked`
                : "No expenses yet — add one below"}
            </div>

            <div className={styles.dashChart}>
              {chartData.map((h, i) => (
                <div
                  key={i}
                  className={styles.chartBar}
                  style={{ height: `${h}%` }}
                />
              ))}
            </div>

            {/* CSV Export */}
            {expenses.length > 0 && (
              <div style={{ textAlign: "right", marginBottom: 8 }}>
                <button
                  onClick={handleExportCSV}
                  className={styles.addExpenseBtn}
                  style={{ fontSize: "0.78rem", padding: "6px 12px" }}
                >
                  ↓ Export CSV
                </button>
              </div>
            )}

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
                onClick={handleAddClick}
                disabled={loading || submitting}
              >
                {!canAddExpense ? "Upgrade to Pro" : showForm ? "Cancel" : "+ Add Expense"}
              </button>
            </div>

            {/* Inline Expense Form */}
            {showForm && canAddExpense && (
              <form onSubmit={handleSubmitExpense} className={styles.expenseForm}>
                <div className={styles.formRow}>
                  <select
                    className={styles.formSelect}
                    value={formData.categoryIdx}
                    onChange={(e) => setFormData(prev => ({ ...prev, categoryIdx: parseInt(e.target.value) }))}
                  >
                    {categoryOptions.map((c, i) => (
                      <option key={i} value={i}>{c.icon} {c.category}</option>
                    ))}
                  </select>
                </div>
                <div className={styles.formRow}>
                  <input
                    className={styles.formInput}
                    type="text"
                    placeholder="Expense name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    required
                    autoFocus
                  />
                </div>
                <div className={styles.formRow}>
                  <input
                    className={styles.formInput}
                    type="number"
                    step="0.01"
                    min="0.01"
                    placeholder="Amount"
                    value={formData.amount}
                    onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                    required
                  />
                  <select
                    className={styles.formSelect}
                    value={formData.currency}
                    onChange={(e) => setFormData(prev => ({ ...prev, currency: e.target.value }))}
                    style={{ flex: "0 0 auto", width: "auto" }}
                  >
                    {Object.entries(currencyMeta).map(([code, meta]) => (
                      <option key={code} value={code}>{meta.flag} {code}</option>
                    ))}
                  </select>
                </div>
                <button
                  type="submit"
                  className={styles.formSubmitBtn}
                  disabled={submitting}
                >
                  {submitting ? "Saving..." : "Save Expense"}
                </button>
              </form>
            )}

            <div className={styles.dashItems}>
              {expenses.length > 0
                ? expenses.slice(0, 5).map((e, i) => (
                    <div key={e.id || i} className={styles.dashItem}>
                      <div className={styles.dashItemLeft}>
                        <div
                          className={styles.dashItemIcon}
                          style={{ background: e.bg || "rgba(255, 107, 107, 0.1)" }}
                        >
                          {e.icon}
                        </div>
                        <div>
                          <div className={styles.dashItemName}>{e.name}</div>
                          <div className={styles.dashItemCategory}>{e.category}</div>
                        </div>
                      </div>
                      <div className={styles.dashItemAmountNeg}>
                        {formatAmount(
                          -Math.abs(convert(e.baseAmount, "USD", baseCurrency)),
                          baseCurrency
                        )}
                      </div>
                    </div>
                  ))
                : (
                  <div className={styles.dashItem} style={{ justifyContent: "center", opacity: 0.5 }}>
                    <span>Your expenses will appear here</span>
                  </div>
                )
              }
            </div>
          </div>
        </div>
      </div>

      <ProModal isOpen={showProModal} onClose={() => setShowProModal(false)} />
    </section>
  );
}
