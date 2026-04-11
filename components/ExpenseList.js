'use client';

import { useState, useEffect, useCallback, useTransition } from 'react';
import { getExpenses, updateExpenseCategory, deleteExpense } from '@/app/actions/plaid-expenses';
import styles from './ExpenseList.module.css';

const CATEGORIES = [
  'Food & Drink', 'Dining', 'Groceries', 'Transport', 'Travel',
  'Shopping', 'Utilities', 'Entertainment', 'Healthcare', 'Personal Care',
  'Insurance', 'Loan', 'Bank Fees', 'Home', 'Government', 'Other',
];

const SOURCE_LABELS = { plaid: 'Bank', manual: 'Manual' };

/**
 * ExpenseList
 * Paginated, filterable expense table — shows both manual + Plaid transactions.
 *
 * Usage:
 *   <ExpenseList />
 */
export default function ExpenseList() {
  const [expenses, setExpenses] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [source, setSource] = useState('');
  const [category, setCategory] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 25;

  const fetchExpenses = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await getExpenses({
        source: source || undefined,
        category: category || undefined,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
        limit: PAGE_SIZE,
        offset: page * PAGE_SIZE,
      });
      setExpenses(result.expenses);
      setTotal(result.total);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [source, category, dateFrom, dateTo, page]);

  useEffect(() => { fetchExpenses(); }, [fetchExpenses]);

  // Reset to page 0 when filters change
  useEffect(() => { setPage(0); }, [source, category, dateFrom, dateTo]);

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div>
          <h2 className={styles.title}>Expenses</h2>
          {!loading && (
            <span className={styles.count}>{total.toLocaleString()} transactions</span>
          )}
        </div>
      </div>

      {/* Filter bar */}
      <div className={styles.filters}>
        <select
          className={styles.select}
          value={source}
          onChange={(e) => setSource(e.target.value)}
        >
          <option value="">All sources</option>
          <option value="plaid">Bank (Plaid)</option>
          <option value="manual">Manual</option>
        </select>

        <select
          className={styles.select}
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        >
          <option value="">All categories</option>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>

        <input
          type="date"
          className={styles.input}
          value={dateFrom}
          onChange={(e) => setDateFrom(e.target.value)}
          placeholder="From"
        />
        <input
          type="date"
          className={styles.input}
          value={dateTo}
          onChange={(e) => setDateTo(e.target.value)}
          placeholder="To"
        />

        {(source || category || dateFrom || dateTo) && (
          <button
            className={styles.clearBtn}
            onClick={() => { setSource(''); setCategory(''); setDateFrom(''); setDateTo(''); }}
          >
            Clear
          </button>
        )}
      </div>

      {error && <div className={styles.errorBanner}>{error}</div>}

      {/* Table */}
      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Date</th>
              <th>Description</th>
              <th>Category</th>
              <th>Account</th>
              <th>Source</th>
              <th className={styles.right}>Amount</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 8 }).map((_, i) => (
                <tr key={i} className={styles.skeletonRow}>
                  {Array.from({ length: 7 }).map((_, j) => (
                    <td key={j}><div className={styles.skeletonCell} /></td>
                  ))}
                </tr>
              ))
            ) : expenses.length === 0 ? (
              <tr>
                <td colSpan={7} className={styles.empty}>
                  No expenses found. Try adjusting your filters.
                </td>
              </tr>
            ) : (
              expenses.map((expense) => (
                <ExpenseRow
                  key={expense.id}
                  expense={expense}
                  onUpdate={fetchExpenses}
                />
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className={styles.pagination}>
          <button
            className={styles.pageBtn}
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page === 0}
          >
            ← Prev
          </button>
          <span className={styles.pageInfo}>
            Page {page + 1} of {totalPages}
          </span>
          <button
            className={styles.pageBtn}
            onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            disabled={page >= totalPages - 1}
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Individual row with inline category edit ─────────────────────────────────

function ExpenseRow({ expense, onUpdate }) {
  const [editing, setEditing] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleCategoryChange = (newCategory) => {
    startTransition(async () => {
      await updateExpenseCategory(expense.id, newCategory);
      setEditing(false);
      onUpdate();
    });
  };

  const handleDelete = () => {
    if (!confirm('Remove this expense?')) return;
    startTransition(async () => {
      await deleteExpense(expense.id);
      onUpdate();
    });
  };

  return (
    <tr className={`${styles.row} ${expense.pending ? styles.pending : ''} ${isPending ? styles.saving : ''}`}>
      {/* Date */}
      <td className={styles.date}>
        {formatDate(expense.date)}
        {expense.pending && <span className={styles.pendingTag}>Pending</span>}
      </td>

      {/* Description */}
      <td className={styles.description}>
        <div className={styles.descInner}>
          {expense.logo_url && (
            <img src={expense.logo_url} alt="" className={styles.merchantLogo} />
          )}
          <div>
            <span className={styles.descName}>{expense.description}</span>
            {expense.merchant_name && expense.merchant_name !== expense.description && (
              <span className={styles.descSub}>{expense.merchant_name}</span>
            )}
          </div>
        </div>
      </td>

      {/* Category — inline editable */}
      <td>
        {editing ? (
          <select
            className={styles.categorySelect}
            defaultValue={expense.category}
            onChange={(e) => handleCategoryChange(e.target.value)}
            onBlur={() => setEditing(false)}
            autoFocus
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        ) : (
          <button
            className={styles.categoryBadge}
            onClick={() => setEditing(true)}
            title="Click to change category"
          >
            {expense.category || 'Other'}
          </button>
        )}
      </td>

      {/* Account */}
      <td className={styles.account}>
        {expense.account_name
          ? `${expense.account_name}${expense.account_mask ? ` ••${expense.account_mask}` : ''}`
          : '—'}
      </td>

      {/* Source */}
      <td>
        <span className={`${styles.sourceBadge} ${styles[expense.source]}`}>
          {SOURCE_LABELS[expense.source] || expense.source}
        </span>
      </td>

      {/* Amount */}
      <td className={`${styles.amount} ${expense.amount < 0 ? styles.credit : ''}`}>
        {formatCurrency(Math.abs(expense.amount))}
      </td>

      {/* Actions */}
      <td className={styles.actions}>
        <button
          className={styles.deleteBtn}
          onClick={handleDelete}
          title="Remove expense"
          disabled={isPending}
        >
          ✕
        </button>
      </td>
    </tr>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(dateStr) {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  });
}

function formatCurrency(amount) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency', currency: 'USD',
  }).format(amount);
}
