"use client";

import { createContext, useContext, useState, useEffect, useCallback } from "react";

const CURRENCY_META = {
  USD: { symbol: "$",  flag: "🇺🇸", name: "US Dollar" },
  EUR: { symbol: "€",  flag: "🇪🇺", name: "Euro" },
  GBP: { symbol: "£",  flag: "🇬🇧", name: "British Pound" },
  CAD: { symbol: "CA$",flag: "🇨🇦", name: "Canadian Dollar" },
  HKD: { symbol: "HK$",flag: "🇭🇰", name: "Hong Kong Dollar" },
  ILS: { symbol: "₪",  flag: "🇮🇱", name: "Israeli Shekel" },
  INR: { symbol: "₹",  flag: "🇮🇳", name: "Indian Rupee" },
  JMD: { symbol: "J$", flag: "🇯🇲", name: "Jamaican Dollar" },
  KES: { symbol: "KSh",flag: "🇰🇪", name: "Kenyan Shilling" },
  MXN: { symbol: "MX$",flag: "🇲🇽", name: "Mexican Peso" },
  NGN: { symbol: "₦",  flag: "🇳🇬", name: "Nigerian Naira" },
  QAR: { symbol: "QR", flag: "🇶🇦", name: "Qatari Riyal" },
  SAR: { symbol: "SR", flag: "🇸🇦", name: "Saudi Riyal" },
};

// Currencies supported by Frankfurter API (will be fetched live)
const FRANKFURTER_CURRENCIES = ["EUR", "GBP", "CAD", "HKD", "ILS", "INR", "MXN"];

// Fallback rates (USD-based) for unsupported / offline currencies
const FALLBACK_RATES = {
  USD: 1,
  EUR: 0.92,
  GBP: 0.79,
  CAD: 1.43,
  HKD: 7.78,
  ILS: 3.65,
  INR: 86.5,
  JMD: 157,
  KES: 130,
  MXN: 20.5,
  NGN: 1580,
  QAR: 3.64,
  SAR: 3.75,
};

// Currencies that always use fallback (not in Frankfurter)
const FALLBACK_ONLY = new Set(["NGN", "JMD", "KES", "QAR", "SAR"]);

const CurrencyContext = createContext(null);

export function CurrencyProvider({ children }) {
  const [baseCurrency, setBaseCurrencyState] = useState("USD");
  const [rates, setRates] = useState(FALLBACK_RATES);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [rateSource, setRateSource] = useState("fallback");

  // Read saved base currency from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem("baseCurrency");
      if (saved && CURRENCY_META[saved]) {
        setBaseCurrencyState(saved);
      }
    } catch {}
  }, []);

  // Fetch live rates from Frankfurter API
  useEffect(() => {
    let cancelled = false;

    async function fetchRates() {
      setLoading(true);
      try {
        const symbols = FRANKFURTER_CURRENCIES.join(",");
        const res = await fetch(
          `https://api.frankfurter.app/latest?from=USD&to=${symbols}`
        );
        if (!res.ok) throw new Error("API error");
        const data = await res.json();

        if (!cancelled) {
          setRates({
            ...FALLBACK_RATES,       // keep fallback-only currencies
            USD: 1,
            ...data.rates,           // overwrite with live data
          });
          setLastUpdated(data.date);
          setRateSource("live");
        }
      } catch {
        if (!cancelled) {
          setRateSource("fallback");
          setLastUpdated(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchRates();
    return () => { cancelled = true; };
  }, []);

  const setBaseCurrency = useCallback((code) => {
    if (CURRENCY_META[code]) {
      setBaseCurrencyState(code);
      try {
        localStorage.setItem("baseCurrency", code);
      } catch {}
    }
  }, []);

  /**
   * Convert an amount from one currency to another using USD as the pivot.
   */
  const convert = useCallback(
    (amount, from, to) => {
      if (from === to) return amount;
      const fromRate = rates[from] || 1;
      const toRate = rates[to] || 1;
      return (amount / fromRate) * toRate;
    },
    [rates]
  );

  /**
   * Format a numeric value in a given currency with symbol and locale.
   */
  const formatAmount = useCallback((value, currencyCode) => {
    const meta = CURRENCY_META[currencyCode] || CURRENCY_META.USD;
    const abs = Math.abs(value);

    const highValueCurrencies = new Set(["NGN", "JMD", "KES", "INR", "QAR"]);
    let formatted;
    if (highValueCurrencies.has(currencyCode) && abs >= 1000) {
      formatted = abs.toLocaleString("en-US", {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      });
    } else {
      formatted = abs.toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
    }

    const sign = value < 0 ? "-" : "";
    return `${sign}${meta.symbol}${formatted}`;
  }, []);

  return (
    <CurrencyContext.Provider
      value={{
        baseCurrency,
        setBaseCurrency,
        rates,
        loading,
        lastUpdated,
        rateSource,
        convert,
        formatAmount,
        currencyMeta: CURRENCY_META,
        fallbackOnly: FALLBACK_ONLY,
      }}
    >
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  const ctx = useContext(CurrencyContext);
  if (!ctx) throw new Error("useCurrency must be used within CurrencyProvider");
  return ctx;
}
