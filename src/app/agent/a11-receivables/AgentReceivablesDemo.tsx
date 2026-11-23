"use client";

import { AgentReceivablesView } from "@/features/receivables/views/AgentReceivablesView";
import { agentReceivablesAt, deliveriesToday, type AgentReceivablesState } from "@/mocks/agent-deliveries";

// غلاف لصفحة الرسم (A11). لا يُنقل للإنتاج.

export function AgentReceivablesDemo({ state = "default", mode = "ready" }: { state?: AgentReceivablesState; mode?: "ready" | "loading" | "error" | "empty" }) {
  return (
    <AgentReceivablesView
      receivables={mode === "loading" ? { status: "loading" } : mode === "error" ? { status: "error", code: "too_many_requests" } : { status: "ready", data: mode === "empty" ? { ...agentReceivablesAt("default"), unpaid: [] } : agentReceivablesAt(state) }}
      today={deliveriesToday}
      onOpenDelivery={() => {}}
    />
  );
}
