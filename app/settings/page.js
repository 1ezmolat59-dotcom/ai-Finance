"use client";

import { useCurrency } from "../../components/CurrencyProvider";
import Link from "next/link";
import styles from "./settings.module.css";

export default function SettingsPage() {
  const {
    baseCurrency,
    setBaseCurrency,
    rates,
    loading,
    lastUpdated,
    rateSource,
    currencyMeta,
    fallbackOnly,
  } = useCurrency();

  const currencies = Object.entries(currencyMeta);

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        {/* Header */}
        <div className={styles.header}>
          <Link href="/" className={styles.backLink}>
            ← Back to Dashboard
          </Link>
          <h1 className={styles.title}>
            <span className={styles.titleIcon}>⚙️</span>
            Settings
          </h1>
          <p className={styles.subtitle}>
            Configure your global currency preferences. All dashboard amounts
            will be automatically converted.
          </p>
        </div>

        {/* Base Currency Selector */}
        <div className={styles.card}>
          <h2 className={styles.cardTitle}>Global Base Currency</h2>
          <p className={styles.cardDesc}>
            Choose your preferred display currency. All expenses, budgets, and
            totals across the dashboard will be converted to this currency using
            live exchange rates.
          </p>

          <div className={styles.currencyGrid}>
            {currencies.map(([code, meta]) => (
              <button
                key={code}
                className={`${styles.currencyOption} ${
                  baseCurrency === code ? styles.currencyActive : ""
                }`}
                onClick={() => setBaseCurrency(code)}
                id={`setting-currency-${code.toLowerCase()}`}
              >
                <span className={styles.currencyFlag}>{meta.flag}</span>
                <div className={styles.currencyInfo}>
                  <span className={styles.currencyCode}>{code}</span>
                  <span className={styles.currencyName}>{meta.name}</span>
                </div>
                {baseCurrency === code && (
                  <span className={styles.checkmark}>✓</span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Live Rates */}
        <div className={styles.card}>
          <div className={styles.cardHeaderRow}>
            <h2 className={styles.cardTitle}>Live Exchange Rates</h2>
            <span
              className={`${styles.statusBadge} ${
                rateSource === "live" ? styles.statusLive : styles.statusFallback
              }`}
            >
              {rateSource === "live" ? "● Live" : "● Fallback"}
            </span>
          </div>
          <p className={styles.cardDesc}>
            Rates from{" "}
            <a
              href="https://api.frankfurter.app"
              target="_blank"
              rel="noopener noreferrer"
              className={styles.apiLink}
            >
              Frankfurter API
            </a>
            {lastUpdated && ` · Updated ${lastUpdated}`}
          </p>

          {loading ? (
            <div className={styles.loading}>
              <span className={styles.spinner} />
              Fetching live rates…
            </div>
          ) : (
            <div className={styles.ratesTable}>
              <div className={styles.rateHeader}>
                <span>Currency</span>
                <span>Rate (per 1 USD)</span>
                <span>Source</span>
              </div>
              {Object.entries(rates).map(([code, rate]) => {
                const meta = currencyMeta[code];
                if (!meta) return null;
                return (
                  <div
                    key={code}
                    className={`${styles.rateRow} ${
                      baseCurrency === code ? styles.rateRowActive : ""
                    }`}
                  >
                    <span className={styles.rateCurrency}>
                      {meta.flag} {meta.symbol} {code}
                    </span>
                    <span className={styles.rateValue}>
                      {(fallbackOnly?.has(code) || code === "NGN")
                        ? rate.toLocaleString("en-US", { maximumFractionDigits: 2 })
                        : rate.toFixed(5)}
                    </span>
                    <span
                      className={`${styles.rateSource} ${
                        fallbackOnly?.has(code) ? styles.rateFallback : ""
                      }`}
                    >
                      {fallbackOnly?.has(code) ? "Fallback" : "Frankfurter"}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Info Card */}
        <div className={`${styles.card} ${styles.infoCard}`}>
          <h3 className={styles.infoTitle}>💡 How Currency Conversion Works</h3>
          <ul className={styles.infoList}>
            <li>
              Each expense retains its <strong>original transaction currency</strong>
            </li>
            <li>
              When displayed, amounts are converted to your base currency using live rates
            </li>
            <li>
              NGN, JMD, KES, QAR, and SAR use fixed fallback rates — Frankfurter
              API does not support these currencies
            </li>
            <li>
              Rates refresh every time the dashboard loads
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
