"use client";

import { AgentReceiptsView } from "@/features/transfers/views/AgentReceiptsView";
import { agentTransfers } from "@/mocks/agent";

// غلاف لصفحة الرسم (A02): GET /transfers بنطاق الوكيل. لا يُنقل للإنتاج.

export function AgentReceiptsDemo({ mode = "ready" }: { mode?: "ready" | "loading" | "error" | "empty" }) {
  const rows = mode === "empty" ? [] : agentTransfers;
  return (
    <AgentReceiptsView
      transfers={mode === "loading" ? { status: "loading" } : mode === "error" ? { status: "error", code: "too_many_requests" } : { status: "ready", data: { data: rows, meta: { current_page: 1, last_page: 1, per_page: 15, total: rows.length } } }}
      onPageChange={() => {}}
      onPerPageChange={() => {}}
      onOpen={() => {}}
    />
  );
}
