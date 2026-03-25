"use client";

import { useEffect, useState } from "react";
import styles from "./ProModal.module.css";

export default function ProModal({ isOpen, onClose }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || !isOpen) return null;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div 
        className={styles.modal} 
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <button className={styles.closeBtn} onClick={onClose} aria-label="Close">
          ×
        </button>

        <div className={styles.modalHeader}>
          <div className={styles.iconContainer}>✨</div>
          <h2 className={styles.title}>Unlock Unlimited Tracking</h2>
          <p className={styles.subtitle}>
            You&apos;ve reached your daily limit of 3 free expenses. <br/>
            Upgrade to Pro to take full control of your finances.
          </p>
        </div>

        <ul className={styles.features}>
          <li>
            <span className={styles.check}>✓</span>
            <strong>Unlimited</strong> daily expense logging
          </li>
          <li>
            <span className={styles.check}>✓</span>
            Custom budget categories & advanced rules
          </li>
          <li>
            <span className={styles.check}>✓</span>
            AI-powered predictive forecasting
          </li>
          <li>
            <span className={styles.check}>✓</span>
            Priority customer support
          </li>
        </ul>

        <div className={styles.actions}>
          <button className={`btn-primary ${styles.upgradeBtn}`}>
            <span>Upgrade to Pro — $9.99/mo</span>
          </button>
          <button className={styles.cancelBtn} onClick={onClose}>
            Maybe later
          </button>
        </div>
      </div>
    </div>
  );
}
