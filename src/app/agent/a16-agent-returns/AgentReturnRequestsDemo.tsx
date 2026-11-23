"use client";

import { AgentReturnRequestsView } from "@/features/returns/views/AgentReturnRequestsView";
import { agentReturnRequests } from "@/mocks/agent-own-returns";

// غلاف لصفحة الرسم (A16): GET /agent-returns بنطاق الوكيل. لا يُنقل للإنتاج.

export function AgentReturnRequestsDemo({ mode = "ready" }: { mode?: "ready" | "loading" | "error" | "empty" }) {
  const rows = mode === "empty" ? [] : agentReturnRequests;
  return (
    <AgentReturnRequestsView
      requests={mode === "loading" ? { status: "loading" } : mode === "error" ? { status: "error", code: "too_many_requests" } : { status: "ready", data: { data: rows, meta: { current_page: 1, last_page: 1, per_page: 15, total: rows.length } } }}
      onPageChange={() => {}}
      onPerPageChange={() => {}}
      canCreate
      onCreate={() => {}}
    />
  );
}
