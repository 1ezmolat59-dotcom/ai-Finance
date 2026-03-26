"use server";

import { supabase } from "../../lib/supabase";

export async function getExpenses(clientId) {
  if (!clientId) return [];

  const { data, error } = await supabase
    .from("expenses")
    .select("*")
    .eq("client_id", clientId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching expenses from Supabase:", error);
    return [];
  }
  
  // Map Supabase rows back to the frontend's expected properties
  return (data || []).map(dbExp => ({
    id: dbExp.id,
    date: new Date(dbExp.created_at).getTime(),
    icon: dbExp.icon,
    name: dbExp.name,
    category: dbExp.category,
    baseAmount: dbExp.base_amount,
    type: dbExp.type,
    bg: dbExp.bg,
  }));
}

export async function addExpenseToDB(clientId, expenseParam) {
  if (!clientId) throw new Error("Client ID is missing.");

  // Check if user is Pro (skip limit for Pro users)
  const { data: profile } = await supabase
    .from("profiles")
    .select("is_pro")
    .eq("client_id", clientId)
    .single();

  const isPro = profile?.is_pro === true;

  // Check 24-hr limit strictly on the server side (free users only)
  if (!isPro) {
    const windowStart = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    const { data: recent, error: countError } = await supabase
      .from("expenses")
      .select("id")
      .eq("client_id", clientId)
      .gte("created_at", windowStart);

    if (!countError && recent && recent.length >= 3) {
      throw new Error("Freemium limit reached. You cannot add more than 3 expenses in 24 hours.");
    }
  }

  // Insert the expense record
  const { data, error } = await supabase
    .from("expenses")
    .insert([{
      client_id: clientId,
      icon: expenseParam.icon,
      name: expenseParam.name,
      category: expenseParam.category,
      base_amount: expenseParam.baseAmount,
      type: expenseParam.type,
      bg: expenseParam.bg
    }])
    .select()
    .single();

  if (error) {
    console.error("Error inserting expense into Supabase:", error);
    throw new Error(error.message);
  }

  // Return the correctly formatted object back to the client
  return {
    id: data.id,
    date: new Date(data.created_at).getTime(),
    icon: data.icon,
    name: data.name,
    category: data.category,
    baseAmount: data.base_amount,
    type: data.type,
    bg: data.bg,
  };
}
