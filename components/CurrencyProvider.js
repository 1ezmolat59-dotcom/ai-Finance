"use client";

import { createContext, useContext, useState, useEffect, useCallback } from "react";

const CURRENCY_META = {
  USD: { symbol: "$", flag: "🇺🇸", name: "US Dollar" },
  EUR: { symbol: "€", flag: "🇪🇺", name: "Euro" },
  GBP: { symbol: "£", flag: "🇬🇧", name: "British Pound" },
  NGN: { symbol: "₦", flag: "🇳🇬", name: "Nigerian Naira" },
};

// Fallback rates (USD-based) when API is unavailable or for unsupported currencies
const FALLBACK_RATES = { USD: 1, EUR: 0.86, GBP: 0.75, NGN: 1580 };

const CurrencyContext = createContext(null);

export function CurrencyProvider({ children }) {
  const [baseCurrency, setBaseCurrencyState] = useState("USD");
  const [rates, setRates] = useState(FALLBACK_RATES); // rates relative to USD
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
        const res = await fetch(
          "https://api.frankfurter.app/latest?from=USD&to=EUR,GBP"
        );
        if (!res.ok) throw new Error("API error");
        const data = await res.json();

        if (!cancelled) {
          setRates({
            USD: 1,
            EUR: data.rates.EUR,
            GBP: data.rates.GBP,
            NGN: FALLBACK_RATES.NGN, // Frankfurter doesn't support NGN
          });
          setLastUpdated(data.date);
          setRateSource("live");
        }
      } catch {
        // Keep fallback rates
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
   * rates are all relative to USD, so:
   *   amountInUSD = amount / rates[from]
   *   amountInTo  = amountInUSD * rates[to]
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

    let formatted;
    if (currencyCode === "NGN" && abs >= 1000) {
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
