'use client';

import { useEffect, useState, useCallback } from 'react';
import PlaidLink from './PlaidLink';
import styles from './LinkedAccounts.module.css';

/**
 * LinkedAccounts
 * Displays all connected bank accounts with balances and a sync button.
 * Drop this anywhere in your dashboard.
 *
 * Usage:
 *   <LinkedAccounts />
 */
export default function LinkedAccounts() {
  const [accounts, setAccounts] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState(null);

  const fetchBalances = useCallback(async () => {
    try {
      setError(null);
      const res = await fetch('/api/plaid/balances');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setAccounts(data.accounts || []);
      setSummary(data.summary);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchBalances(); }, [fetchBalances]);

  const handleSync = async () => {
    setSyncing(true);
    try {
      const res = await fetch('/api/plaid/sync-transactions', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      await fetchBalances(); // refresh balances after sync
    } catch (err) {
      setError(err.message);
    } finally {
      setSyncing(false);
    }
  };

  const handleLinkSuccess = async () => {
    await handleSync(); // immediately sync after linking
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.skeleton} />
        <div className={styles.skeleton} />
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <h2 className={styles.title}>Linked Accounts</h2>
        <div className={styles.actions}>
          {accounts.length > 0 && (
            <button
              className={styles.syncButton}
              onClick={handleSync}
              disabled={syncing}
            >
              {syncing ? (
                <span className={styles.spinner} />
              ) : (
                <SyncIcon />
              )}
              {syncing ? 'Syncing…' : 'Sync'}
            </button>
          )}
          <PlaidLink
            label="Add Account"
            variant="primary"
            onSuccess={handleLinkSuccess}
          />
        </div>
      </div>

      {error && <div className={styles.errorBanner}>{error}</div>}

      {/* Summary strip */}
      {summary && accounts.length > 0 && (
        <div className={styles.summaryStrip}>
          <div className={styles.summaryItem}>
            <span className={styles.summaryLabel}>Total Cash</span>
            <span className={styles.summaryValue}>{formatCurrency(summary.total_cash)}</span>
          </div>
          {summary.total_credit_used > 0 && (
            <div className={styles.summaryItem}>
              <span className={styles.summaryLabel}>Credit Used</span>
              <span className={`${styles.summaryValue} ${styles.credit}`}>
                {formatCurrency(summary.total_credit_used)}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Account list */}
      {accounts.length === 0 ? (
        <div className={styles.empty}>
          <BankEmptyIcon />
          <p>No accounts connected yet.</p>
          <p className={styles.emptySubtext}>
            Connect your bank to automatically import transactions.
          </p>
          <PlaidLink onSuccess={handleLinkSuccess} />
        </div>
      ) : (
        <ul className={styles.accountList}>
          {accounts.map((acct) => (
            <AccountRow key={acct.id} account={acct} />
          ))}
        </ul>
      )}
    </div>
  );
}

function AccountRow({ account }) {
  const hasError = account.plaid_items?.status === 'error';
  const isDisconnected = account.plaid_items?.status === 'disconnected';

  return (
    <li className={`${styles.accountRow} ${hasError ? styles.accountError : ''}`}>
      <div className={styles.accountLeft}>
        <div className={styles.accountIcon}>
          {getAccountIcon(account.type)}
        </div>
        <div className={styles.accountInfo}>
          <span className={styles.accountName}>{account.name}</span>
          <span className={styles.accountMeta}>
            {account.plaid_items?.institution_name}
            {account.mask && ` •••• ${account.mask}`}
            {' · '}
            <span className={styles.accountType}>{account.subtype || account.type}</span>
          </span>
          {hasError && (
            <span className={styles.errorTag}>Reconnection needed</span>
          )}
          {isDisconnected && (
            <span className={styles.disconnectedTag}>Disconnected</span>
          )}
        </div>
      </div>

      <div className={styles.accountRight}>
        {account.available_balance != null && (
          <div className={styles.balanceRow}>
            <span className={styles.balanceLabel}>Available</span>
            <span className={styles.balanceAvailable}>
              {formatCurrency(account.available_balance, account.iso_currency_code)}
            </span>
          </div>
        )}
        {account.current_balance != null && (
          <div className={styles.balanceRow}>
            <span className={styles.balanceLabel}>Current</span>
            <span className={styles.balanceCurrent}>
              {formatCurrency(account.current_balance, account.iso_currency_code)}
            </span>
          </div>
        )}
        {account.last_synced_at && (
          <span className={styles.lastSynced}>
            Synced {timeAgo(account.last_synced_at)}
          </span>
        )}
      </div>
    </li>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatCurrency(amount, currency = 'USD') {
  if (amount == null) return '—';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(amount);
}

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function getAccountIcon(type) {
  if (type === 'credit') return '💳';
  if (type === 'investment') return '📈';
  if (type === 'loan') return '🏦';
  return '🏛';
}

function SyncIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <polyline points="23 4 23 10 17 10" />
      <polyline points="1 20 1 14 7 14" />
      <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
    </svg>
  );
}

function BankEmptyIcon() {
  return (
    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="1.5">
      <line x1="3" y1="22" x2="21" y2="22" />
      <line x1="6" y1="18" x2="6" y2="11" />
      <line x1="10" y1="18" x2="10" y2="11" />
      <line x1="14" y1="18" x2="14" y2="11" />
      <line x1="18" y1="18" x2="18" y2="11" />
      <polygon points="12 2 20 7 4 7" />
    </svg>
  );
}
