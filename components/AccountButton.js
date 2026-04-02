"use client";

import { useState, useEffect, useRef } from "react";
import { createSupabaseBrowserClient } from "../lib/supabase-browser";
import { useRouter } from "next/navigation";
import styles from "./AccountButton.module.css";

export default function AccountButton() {
  const [user, setUser] = useState(null);
  const [mounted, setMounted] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const router = useRouter();
  // Lazily create client — only on the client side, never during SSR
  const supabaseRef = useRef(null);

  useEffect(() => {
    setMounted(true);
    const supabase = createSupabaseBrowserClient();
    supabaseRef.current = supabase;

    supabase.auth.getUser().then(({ data }) => setUser(data.user ?? null));
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_, session) => setUser(session?.user ?? null)
    );
    return () => subscription.unsubscribe();
  }, []);

  const getSupabase = () => supabaseRef.current;

  const handleSignOut = async () => {
    await getSupabase().auth.signOut();
    router.push("/");
    router.refresh();
  };

  const handleExportData = async () => {
    const { data, error } = await getSupabase().rpc("export_my_data");
    if (error) { alert(error.message); return; }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "my-financeai-data.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDeleteData = async () => {
    if (!confirm("This will permanently delete ALL your expenses and profile data. This cannot be undone. Continue?")) return;
    setDeleting(true);
    const { error } = await getSupabase().rpc("delete_all_user_data");
    setDeleting(false);
    if (error) { alert(error.message); return; }
    alert("All your data has been deleted.");
    setShowMenu(false);
  };

  // Render nothing until mounted (prevents SSR mismatch and avoids creating client server-side)
  if (!mounted) return null;

  if (!user) {
    return (
      <a href="/auth" className={styles.signInBtn}>
        Sign In
      </a>
    );
  }

  return (
    <div className={styles.wrapper}>
      <button
        className={styles.avatarBtn}
        onClick={() => setShowMenu(!showMenu)}
        aria-label="Account menu"
      >
        <span className={styles.avatar}>
          {user.email?.[0]?.toUpperCase() ?? "U"}
        </span>
      </button>

      {showMenu && (
        <div className={styles.menu}>
          <div className={styles.menuEmail}>{user.email}</div>
          <div className={styles.menuDivider} />
          <button className={styles.menuItem} onClick={handleExportData}>
            📥 Export My Data
          </button>
          <button
            className={`${styles.menuItem} ${styles.menuItemDanger}`}
            onClick={handleDeleteData}
            disabled={deleting}
          >
            🗑 {deleting ? "Deleting…" : "Delete My Data"}
          </button>
          <div className={styles.menuDivider} />
          <button className={styles.menuItem} onClick={handleSignOut}>
            ← Sign Out
          </button>
        </div>
      )}
    </div>
  );
}
