"use client";

import { useState } from "react";
import { noSampleRequestFilters, SampleRequestsListView, type SampleRequestFilters, type SampleRequestsPage } from "@/features/transfers/views/SampleRequestsListView";
import type { SampleRequest } from "@/lib/api/types";
import type { Loadable } from "@/lib/loadable";
import { sampleRequestReps, sampleRequestsList, sampleRequestsToday } from "@/mocks/sample-requests";

// غلاف تفاعلي لصفحة الرسم: يملك الفلاتر والصفحة ويرشّح ويرقّم بيانات المعرض محلياً.
// في الإنتاج تحلّ محلّه حاوية تطلب GET /sample-requests بالفلاتر والصفحة. لا يُنقل للإنتاج.

type SampleRequestsListDemoProps = {
  /** حالة البيانات: جاهزة، أو تحميل، أو خطأ، أو لا طلبات إطلاقاً. */
  mode?: "ready" | "loading" | "error" | "empty";
};

/** يوم الطلب بتوقيت دمشق: أوقات المعرض بين 07:00 و14:00 UTC فيطابق يومها يوم UTC. */
const dayOf = (request: SampleRequest) => request.created_at?.slice(0, 10) ?? "";

function applyFilters(rows: readonly SampleRequest[], { status, repUserId, range }: SampleRequestFilters): SampleRequest[] {
  return rows.filter(
    (row) =>
      (!status || row.status === status) &&
      (!repUserId || String(row.rep?.id) === repUserId) &&
      (range.from === null || dayOf(row) >= range.from) &&
      (range.to === null || dayOf(row) <= range.to),
  );
}

export function SampleRequestsListDemo({ mode = "ready" }: SampleRequestsListDemoProps) {
  const [filters, setFilters] = useState(noSampleRequestFilters);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(20);

  const matching = mode === "empty" ? [] : applyFilters(sampleRequestsList, filters);
  const lastPage = Math.max(1, Math.ceil(matching.length / perPage));
  const current = Math.min(page, lastPage);
  const result: SampleRequestsPage = {
    data: matching.slice((current - 1) * perPage, current * perPage),
    meta: { current_page: current, last_page: lastPage, per_page: perPage, total: matching.length },
  };

  const requests: Loadable<SampleRequestsPage> =
    mode === "loading" ? { status: "loading" } : mode === "error" ? { status: "error", code: "too_many_requests" } : { status: "ready", data: result };

  return (
    <SampleRequestsListView
      requests={requests}
      reps={sampleRequestReps}
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
      today={sampleRequestsToday}
      onOpenRequest={() => {}}
    />
  );
}
