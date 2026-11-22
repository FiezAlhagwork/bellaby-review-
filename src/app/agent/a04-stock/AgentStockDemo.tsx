"use client";

import { AgentStockView } from "@/features/stock/views/AgentStockView";
import { agentBalances, agentBalancesClean, agentBalancesNearExpiry, agentToday } from "@/mocks/agent";

// غلاف لصفحة الرسم (A04): GET /stock/balances لموقع الوكيل. لا يُنقل للإنتاج.

const sources = { default: agentBalancesClean, "suspended-batch": agentBalances, "near-expiry": agentBalancesNearExpiry } as const;

export function AgentStockDemo({ state = "default", mode = "ready" }: { state?: keyof typeof sources; mode?: "ready" | "loading" | "error" | "empty" }) {
  return (
    <AgentStockView
      balances={mode === "loading" ? { status: "loading" } : mode === "error" ? { status: "error", code: "too_many_requests" } : { status: "ready", data: mode === "empty" ? [] : sources[state] }}
      today={agentToday}
      expiryAlertDays={60}
    />
  );
}
