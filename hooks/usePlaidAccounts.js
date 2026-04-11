'use client';

import { useEffect, useState, useCallback } from 'react';

/**
 * usePlaidAccounts
 * Lightweight hook to fetch account balances + trigger a sync.
 *
 * Usage:
 *   const { accounts, summary, loading, sync, syncing } = usePlaidAccounts();
 */
export function usePlaidAccounts() {
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

  const sync = useCallback(async () => {
    setSyncing(true);
    setError(null);
    try {
      const res = await fetch('/api/plaid/sync-transactions', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      await fetchBalances();
      return data; // { added, modified, removed }
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setSyncing(false);
    }
  }, [fetchBalances]);

  useEffect(() => { fetchBalances(); }, [fetchBalances]);

  return { accounts, summary, loading, syncing, error, sync, refetch: fetchBalances };
}
