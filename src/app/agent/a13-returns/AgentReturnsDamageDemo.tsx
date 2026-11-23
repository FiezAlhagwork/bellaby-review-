"use client";

import { useState } from "react";
import { AgentReturnsDamageView, type ReturnsTab } from "@/features/returns/views/AgentReturnsDamageView";
import { agentCustomerReturns, agentDamageReports } from "@/mocks/agent-own-returns";

// غلاف تفاعلي لصفحة الرسم (A13): GET /customer-returns وGET /damage-reports بنطاق الوكيل. لا يُنقل للإنتاج.

const page = <T,>(rows: readonly T[]) => ({ status: "ready" as const, data: { data: rows, meta: { current_page: 1, last_page: 1, per_page: 15, total: rows.length } } });

export function AgentReturnsDamageDemo({ initialTab = "returns", mode = "ready" }: { initialTab?: ReturnsTab; mode?: "ready" | "loading" | "error" | "empty" }) {
  const [tab, setTab] = useState<ReturnsTab>(initialTab);
  const state = <T,>(rows: readonly T[]) => (mode === "loading" ? ({ status: "loading" } as const) : mode === "error" ? ({ status: "error", code: "too_many_requests" } as const) : page(mode === "empty" ? [] : rows));

  return (
    <AgentReturnsDamageView
      tab={tab}
      onTabChange={setTab}
      returns={state(agentCustomerReturns)}
      reports={state(agentDamageReports)}
      onPageChange={() => {}}
      onPerPageChange={() => {}}
      canCreate
      onNewReturn={() => {}}
      onNewDamage={() => {}}
    />
  );
}
