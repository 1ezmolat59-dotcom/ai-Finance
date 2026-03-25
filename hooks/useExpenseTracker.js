"use client";

import { useState, useEffect, useCallback } from "react";
import { getExpenses, addExpenseToDB } from "../app/actions/expenses";

const CLIENT_ID_KEY = "finance_ai_client_id";
const LIMIT = 3;
const WINDOW_MS = 24 * 60 * 60 * 1000; // 24 hours

export function useExpenseTracker() {
  const [expenses, setExpenses] = useState([]);
  const [clientId, setClientId] = useState(null);
  const [loading, setLoading] = useState(true);

  // Initialize or get Client ID to track the user securely
  useEffect(() => {
    let storedId = localStorage.getItem(CLIENT_ID_KEY);
    if (!storedId) {
      storedId = crypto.randomUUID();
      localStorage.setItem(CLIENT_ID_KEY, storedId);
    }
    setClientId(storedId);
  }, []);

  // Fetch initial expenses from Supabase DB on mount
  useEffect(() => {
    if (!clientId) return;
    
    let active = true;
    async function fetchFromDB() {
      try {
        const data = await getExpenses(clientId);
        if (active) setExpenses(data);
      } catch (err) {
        console.error("Failed to load DB expenses", err);
      } finally {
        if (active) setLoading(false);
      }
    }
    fetchFromDB();
    
    return () => { active = false; };
  }, [clientId]);

  // Calculate used expenses in the last 24 hours
  const now = Date.now();
  const recentExpenses = expenses.filter((e) => now - e.date < WINDOW_MS);
  const freeExpensesUsed = recentExpenses.length;
  const canAddExpense = freeExpensesUsed < LIMIT;

  const addExpense = useCallback(async (expenseParam) => {
    if (!clientId) return;
    
    // Ensure optimistic local limit check matches server expectation
    const currentNow = Date.now();
    const currentRecent = expenses.filter((e) => currentNow - e.date < WINDOW_MS);
    if (currentRecent.length >= LIMIT) return;

    try {
      // Insert natively via Next.js Server Action
      const newExpense = await addExpenseToDB(clientId, expenseParam);
      
      // Update local state smoothly
      setExpenses((prev) => [newExpense, ...prev]);
    } catch (e) {
      console.error("Failed to add expense:", e.message);
      alert(e.message); // Basic safeguard notice
    }
  }, [clientId, expenses]);

  return {
    expenses,
    freeExpensesUsed,
    canAddExpense,
    addExpense,
    limit: LIMIT,
    loading
  };
}
