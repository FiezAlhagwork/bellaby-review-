"use client";

import { useState } from "react";
import { DisputesListView, noDisputeFilters, type DisputeFilter } from "@/features/disputes/views/DisputesListView";
import type { Dispute } from "@/lib/api/types";
import { disputesList } from "@/mocks/disputes";

// غلاف تفاعلي لصفحة الرسم (I18): يملك الفلتر والصفحة، ويصفّي كما يفعل GET /disputes?status. لا يُنقل للإنتاج.

type DisputesDemoProps = { mode?: "ready" | "loading" | "error" | "empty" };

const PER_PAGE = 10;

const matches = (dispute: Dispute, filter: DisputeFilter | null) =>
  filter === null || (filter === "IN_PROGRESS" ? (dispute.status ?? "").startsWith("STAGE_") : dispute.status === filter);

export function DisputesDemo({ mode = "ready" }: DisputesDemoProps) {
  const [filters, setFilters] = useState(noDisputeFilters);
  const [page, setPage] = useState(1);
  const rows = (mode === "empty" ? [] : disputesList).filter((dispute) => matches(dispute, filters.status));

  return (
    <DisputesListView
      disputes={
        mode === "loading"
          ? { status: "loading" }
          : mode === "error"
            ? { status: "error", code: "too_many_requests" }
            : { status: "ready", data: { data: rows.slice((page - 1) * PER_PAGE, page * PER_PAGE), meta: { current_page: page, last_page: Math.max(1, Math.ceil(rows.length / PER_PAGE)), per_page: PER_PAGE, total: rows.length } } }
      }
      filters={filters}
      onFiltersChange={(next) => {
        setFilters(next);
        setPage(1);
      }}
      onPageChange={setPage}
      onPerPageChange={() => {}}
      canCreate
      onNewDispute={() => {}}
      onOpenDispute={() => {}}
    />
  );
}
