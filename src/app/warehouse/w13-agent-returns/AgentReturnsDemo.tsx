"use client";

import { useState } from "react";
import { AgentReturnsListView, noAgentReturnFilters, type AgentReturnFilters, type AgentReturnsPage } from "@/features/returns/views/AgentReturnsListView";
import type { AgentReturn } from "@/lib/api/types";
import type { Loadable } from "@/lib/loadable";
import { agentReturnLocations, agentReturnsList, agentReturnsToday, receivedReturn } from "@/mocks/agent-returns";

// غلاف تفاعلي لصفحة الرسم: يملك الفلاتر والصفحة والإرجاع المفتوح ونافذة التأكيد. تأكيد الاستلام يحوّل الإرجاع إلى «مستلم» فيخرج من «بالطريق»
// ويبقى مفتوحاً في الدرج بحالته الجديدة. في الإنتاج تحلّ محلّه حاوية تطلب GET /agent-returns وترسل POST /agent-returns/{id}/receive. لا يُنقل للإنتاج.

type AgentReturnsDemoProps = {
  /** حالة البيانات: جاهزة، أو تحميل، أو خطأ، أو لا إرجاعات في الحالة المختارة. */
  mode?: "ready" | "loading" | "error" | "empty";
  initialStatus?: AgentReturnFilters["status"];
  /** الإرجاع المفتوح في الدرج عند العرض. */
  initialSelectedId?: number;
  /** نافذة التأكيد مفتوحة عند العرض. */
  initialConfirmOpen?: boolean;
};

export function AgentReturnsDemo({ mode = "ready", initialStatus = "IN_TRANSIT", initialSelectedId, initialConfirmOpen = false }: AgentReturnsDemoProps) {
  const [rows, setRows] = useState<readonly AgentReturn[]>(agentReturnsList);
  const [filters, setFilters] = useState<AgentReturnFilters>({ ...noAgentReturnFilters, status: initialStatus });
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(20);
  const [selectedId, setSelectedId] = useState<number | null>(initialSelectedId ?? null);
  const [confirmOpen, setConfirmOpen] = useState(initialConfirmOpen);

  const matching = mode === "empty" ? [] : rows.filter((row) => row.status === filters.status && (!filters.agentId || String(row.agent?.id) === filters.agentId));
  const lastPage = Math.max(1, Math.ceil(matching.length / perPage));
  const current = Math.min(page, lastPage);
  const result: AgentReturnsPage = {
    data: matching.slice((current - 1) * perPage, current * perPage),
    meta: { current_page: current, last_page: lastPage, per_page: perPage, total: matching.length },
  };

  const returns: Loadable<AgentReturnsPage> = mode === "loading" ? { status: "loading" } : mode === "error" ? { status: "error", code: "too_many_requests" } : { status: "ready", data: result };
  const selected = rows.find((row) => row.id === selectedId) ?? null;

  return (
    <AgentReturnsListView
      returns={returns}
      agents={agentReturnLocations}
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
      selected={selected}
      onOpenReturn={(item) => setSelectedId(item.id ?? null)}
      onCloseReturn={() => {
        setSelectedId(null);
        setConfirmOpen(false);
      }}
      canReceive
      confirmOpen={confirmOpen}
      onStartReceive={() => setConfirmOpen(true)}
      onConfirmReceive={() => {
        // في الإنتاج: POST /agent-returns/{id}/receive ثم إعادة جلب القائمة. هنا تُطبَّق النتيجة محلياً.
        setRows(rows.map((row) => (row.id === selectedId ? receivedReturn(row) : row)));
        setConfirmOpen(false);
      }}
      onDismissReceive={() => setConfirmOpen(false)}
      today={agentReturnsToday}
    />
  );
}
