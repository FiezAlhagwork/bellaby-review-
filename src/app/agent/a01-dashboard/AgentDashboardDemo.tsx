"use client";

import { AgentDashboardView } from "@/features/agents/views/AgentDashboardView";
import { agentNow, agentOverviewAt, agentToday, type AgentDashboardState } from "@/mocks/agent";

// غلاف لصفحة الرسم (A01): لوحة الوكيل من القوائم (§110). لا يُنقل للإنتاج.

export function AgentDashboardDemo({ state = "default", mode = "ready" }: { state?: AgentDashboardState; mode?: "ready" | "loading" | "error" }) {
  return (
    <AgentDashboardView
      overview={mode === "loading" ? { status: "loading" } : mode === "error" ? { status: "error", code: "too_many_requests" } : { status: "ready", data: agentOverviewAt(state) }}
      now={agentNow}
      today={agentToday}
      onOpenTransfer={() => {}}
      onOpenDelivery={() => {}}
    />
  );
}
