"use client";

import { useState } from "react";
import { AgentsListView, noAgentFilters, type AgentFilters, type AgentListRow, type AgentsPage } from "@/features/agents/views/AgentsListView";
import type { Loadable } from "@/lib/loadable";
import { agentListRows, salesGovernorates } from "@/mocks/sales";

// غلاف تفاعلي لصفحة الرسم: يملك الفلاتر والصفحة، ويرشّح ويرقّم بيانات المعرض محلياً (ما يفعله الخادم بـ q وgovernorate_id وpage).
// في الإنتاج تحلّ محلّه حاوية تطلب GET /agents وتضيف الرصيد والمبيعات (§40). لا يُنقل للإنتاج.

type AgentsDemoProps = {
  /** حالة البيانات: جاهزة، أو تحميل، أو خطأ، أو لا وكلاء. */
  mode?: "ready" | "loading" | "error" | "empty";
  initialFilters?: AgentFilters;
};

function applyFilters(rows: readonly AgentListRow[], { q, governorateId }: AgentFilters): AgentListRow[] {
  const query = q.trim();
  return rows.filter((row) => (!query || (row.name ?? "").includes(query) || (row.contact_name ?? "").includes(query)) && (!governorateId || (row.governorates ?? []).some((governorate) => String(governorate.id) === governorateId)));
}

export function AgentsDemo({ mode = "ready", initialFilters = noAgentFilters }: AgentsDemoProps) {
  const [filters, setFilters] = useState(initialFilters);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);

  const matching = mode === "empty" ? [] : applyFilters(agentListRows, filters);
  const lastPage = Math.max(1, Math.ceil(matching.length / perPage));
  const current = Math.min(page, lastPage);
  const result: AgentsPage = {
    data: matching.slice((current - 1) * perPage, current * perPage),
    meta: { current_page: current, last_page: lastPage, per_page: perPage, total: matching.length },
  };
  const agents: Loadable<AgentsPage> = mode === "loading" ? { status: "loading" } : mode === "error" ? { status: "error", code: "too_many_requests" } : { status: "ready", data: result };

  return (
    <AgentsListView
      agents={agents}
      governorates={salesGovernorates}
      filters={filters}
      onFiltersChange={(next) => {
        setFilters(next);
        setPage(1);
      }}
      onPageChange={setPage}
      onPerPageChange={(next) => {
        setPerPage(next);
        setPage(1);
      }}
      onOpenAgent={() => {}}
    />
  );
}
