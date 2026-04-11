'use client';

import { useCallback, useState } from 'react';
import { usePlaidLink } from 'react-plaid-link';
import styles from './PlaidLink.module.css';

/**
 * PlaidLink — the "Connect Bank" button.
 *
 * Usage:
 *   <PlaidLink onSuccess={() => router.refresh()} />
 *
 * Props:
 *   onSuccess  — called after a bank is successfully linked
 *   onExit     — called when user closes Link without connecting
 *   label      — button text (default: "Connect Bank Account")
 *   variant    — 'primary' | 'secondary' (default: 'primary')
 */
export default function PlaidLink({
  onSuccess,
  onExit,
  label = 'Connect Bank Account',
  variant = 'primary',
}) {
  const [linkToken, setLinkToken] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch a link token from our backend and open Plaid Link
  const openPlaidLink = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/plaid/create-link-token', { method: 'POST' });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Failed to create link token');

      setLinkToken(data.link_token);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  }, []);

  // Plaid Link callback — fires after user completes bank auth flow
  const handleSuccess = useCallback(
    async (public_token, metadata) => {
      setLoading(true);
      setError(null);

      try {
        const res = await fetch('/api/plaid/exchange-token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            public_token,
            institution: metadata.institution,
          }),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to link account');

        setLinkToken(null);
        onSuccess?.(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    },
    [onSuccess]
  );

  const handleExit = useCallback(
    (err) => {
      setLinkToken(null);
      setLoading(false);
      if (err) setError(err.display_message || err.error_message);
      onExit?.(err);
    },
    [onExit]
  );

  // Inner component that consumes the link token and opens the modal
  return (
    <>
      {linkToken ? (
        <PlaidLinkInner
          token={linkToken}
          onSuccess={handleSuccess}
          onExit={handleExit}
          label={label}
          variant={variant}
          loading={loading}
        />
      ) : (
        <button
          className={`${styles.button} ${styles[variant]}`}
          onClick={openPlaidLink}
          disabled={loading}
        >
          {loading ? (
            <span className={styles.spinner} />
          ) : (
            <BankIcon />
          )}
          {loading ? 'Connecting…' : label}
        </button>
      )}

      {error && <p className={styles.error}>{error}</p>}
    </>
  );
}

// Separate component so usePlaidLink only runs when we have a token
function PlaidLinkInner({ token, onSuccess, onExit, label, variant, loading }) {
  const { open, ready } = usePlaidLink({ token, onSuccess, onExit });

  // Auto-open once token is ready
  if (ready) open();

  return (
    <button
      className={`${styles.button} ${styles[variant]}`}
      onClick={() => open()}
      disabled={!ready || loading}
    >
      <span className={styles.spinner} />
      Opening bank portal…
    </button>
  );
}

function BankIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="3" y1="22" x2="21" y2="22" />
      <line x1="6" y1="18" x2="6" y2="11" />
      <line x1="10" y1="18" x2="10" y2="11" />
      <line x1="14" y1="18" x2="14" y2="11" />
      <line x1="18" y1="18" x2="18" y2="11" />
      <polygon points="12 2 20 7 4 7" />
    </svg>
  );
}
