'use client';

import { useState, useEffect, useCallback } from 'react';
import { getExpenseSummary } from '@/app/actions/plaid-expenses';
import styles from './SpendingSummary.module.css';

const PERIOD_OPTIONS = [
  { label: 'This month',    getValue: () => thisMonth() },
  { label: 'Last 30 days',  getValue: () => lastNDays(30) },
  { label: 'Last 90 days',  getValue: () => lastNDays(90) },
  { label: 'This year',     getValue: () => thisYear() },
];

const CATEGORY_COLORS = [
  '#2563eb', '#7c3aed', '#db2777', '#ea580c',
  '#d97706', '#16a34a', '#0891b2', '#4f46e5',
  '#9333ea', '#dc2626', '#65a30d', '#0284c7',
];

/**
 * SpendingSummary
 * Category breakdown with mini bar chart + period selector.
 *
 * Usage:
 *   <SpendingSummary />
 */
export default function SpendingSummary() {
  const [periodIdx, setPeriodIdx] = useState(0);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchSummary = useCallback(async () => {
    setLoading(true);
    setError(null);
    const { dateFrom, dateTo } = PERIOD_OPTIONS[periodIdx].getValue();
    try {
      const result = await getExpenseSummary({ dateFrom, dateTo });
      setData(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [periodIdx]);

  useEffect(() => { fetchSummary(); }, [fetchSummary]);

  const maxCategoryTotal = data?.categories?.[0]?.total ?? 1;

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div>
          <h2 className={styles.title}>Spending by Category</h2>
          {data && !loading && (
            <span className={styles.subtitle}>
              Total: <strong>{formatCurrency(data.grandTotal)}</strong>
            </span>
          )}
        </div>

        {/* Period picker */}
        <div className={styles.periodTabs}>
          {PERIOD_OPTIONS.map((opt, i) => (
            <button
              key={opt.label}
              className={`${styles.tab} ${i === periodIdx ? styles.tabActive : ''}`}
              onClick={() => setPeriodIdx(i)}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {error && <div className={styles.errorBanner}>{error}</div>}

      {/* Content */}
      {loading ? (
        <div className={styles.skeletonList}>
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className={styles.skeletonRow}>
              <div className={styles.skeletonLabel} />
              <div className={styles.skeletonBar} style={{ width: `${80 - i * 10}%` }} />
              <div className={styles.skeletonAmount} />
            </div>
          ))}
        </div>
      ) : !data?.categories?.length ? (
        <div className={styles.empty}>
          No spending data for this period.
        </div>
      ) : (
        <>
          {/* Category bars */}
          <ul className={styles.categoryList}>
            {data.categories.map((cat, i) => {
              const pct = (cat.total / maxCategoryTotal) * 100;
              const color = CATEGORY_COLORS[i % CATEGORY_COLORS.length];
              return (
                <li key={cat.category} className={styles.categoryRow}>
                  <div className={styles.categoryMeta}>
                    <span className={styles.dot} style={{ background: color }} />
                    <span className={styles.categoryName}>{cat.category}</span>
                    <div className={styles.sourcePills}>
                      {cat.plaid > 0 && (
                        <span className={styles.pillBank}>
                          Bank {formatCurrency(cat.plaid)}
                        </span>
                      )}
                      {cat.manual > 0 && (
                        <span className={styles.pillManual}>
                          Manual {formatCurrency(cat.manual)}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className={styles.barTrack}>
                    <div
                      className={styles.barFill}
                      style={{ width: `${pct}%`, background: color }}
                    />
                  </div>
                  <span className={styles.categoryAmount}>
                    {formatCurrency(cat.total)}
                  </span>
                  <span className={styles.categoryPct}>
                    {((cat.total / data.grandTotal) * 100).toFixed(1)}%
                  </span>
                </li>
              );
            })}
          </ul>

          {/* Source breakdown footer */}
          <div className={styles.sourceBreakdown}>
            {data.categories.some((c) => c.plaid > 0) && (
              <div className={styles.sourceItem}>
                <span className={styles.sourceDot} style={{ background: '#2563eb' }} />
                <span>Bank imports</span>
                <span className={styles.sourceTotal}>
                  {formatCurrency(data.categories.reduce((s, c) => s + c.plaid, 0))}
                </span>
              </div>
            )}
            {data.categories.some((c) => c.manual > 0) && (
              <div className={styles.sourceItem}>
                <span className={styles.sourceDot} style={{ background: '#16a34a' }} />
                <span>Manual entries</span>
                <span className={styles.sourceTotal}>
                  {formatCurrency(data.categories.reduce((s, c) => s + c.manual, 0))}
                </span>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

// ─── Date helpers ─────────────────────────────────────────────────────────────

function thisMonth() {
  const now = new Date();
  const dateFrom = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
  const dateTo = toDateStr(now);
  return { dateFrom, dateTo };
}

function lastNDays(n) {
  const now = new Date();
  const from = new Date(now);
  from.setDate(from.getDate() - n);
  return { dateFrom: toDateStr(from), dateTo: toDateStr(now) };
}

function thisYear() {
  const now = new Date();
  return { dateFrom: `${now.getFullYear()}-01-01`, dateTo: toDateStr(now) };
}

function toDateStr(d) {
  return d.toISOString().split('T')[0];
}

function formatCurrency(amount) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency', currency: 'USD', maximumFractionDigits: 0,
  }).format(amount ?? 0);
}
