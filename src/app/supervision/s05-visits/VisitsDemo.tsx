"use client";

import { useState } from "react";
import { noVisitFilters, VisitsListView, type VisitFilters, type VisitsMode, type VisitsPage } from "@/features/visits/views/VisitsListView";
import type { Visit } from "@/lib/api/types";
import type { Loadable } from "@/lib/loadable";
import { supervisionReps, supervisionToday } from "@/mocks/supervision";
import { allVisits } from "@/mocks/visits";

// غلاف تفاعلي لصفحة الرسم: يملك الفلاتر والصفحة والعرض (قائمة/خريطة) والنقطة المحددة، ويرشّح ويرقّم بيانات المعرض محلياً
// (ما يفعله الخادم بـ rep_id وfrom وto وverification_status وpage). الأحدث أولاً. في الإنتاج تحلّ محلّه حاوية تطلب GET /visits. لا يُنقل للإنتاج.

type VisitsDemoProps = {
  initialMode?: VisitsMode;
  initialFilters?: VisitFilters;
  /** زيارة محددة على الخريطة عند العرض. */
  initialSelectedVisitId?: number | null;
  /** حالة البيانات: جاهزة، أو تحميل، أو خطأ، أو لا زيارات إطلاقاً. */
  mode?: "ready" | "loading" | "error" | "empty";
};

function applyFilters(rows: readonly Visit[], { repId, range, verification }: VisitFilters): Visit[] {
  return rows.filter((row) => {
    const day = (row.started_at ?? "").slice(0, 10);
    return (!repId || String(row.rep?.id) === repId) && (!range.from || day >= range.from) && (!range.to || day <= range.to) && (!verification || row.verification_status === verification);
  });
}

const newestFirst = (rows: readonly Visit[]) => [...rows].sort((a, b) => (b.started_at ?? "").localeCompare(a.started_at ?? ""));

export function VisitsDemo({ initialMode = "list", initialFilters = noVisitFilters, initialSelectedVisitId = null, mode = "ready" }: VisitsDemoProps) {
  const [view, setView] = useState<VisitsMode>(initialMode);
  const [filters, setFilters] = useState(initialFilters);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [selected, setSelected] = useState<number | null>(initialSelectedVisitId);

  const matching = mode === "empty" ? [] : newestFirst(applyFilters(allVisits, filters));
  const lastPage = Math.max(1, Math.ceil(matching.length / perPage));
  const current = Math.min(page, lastPage);
  const result: VisitsPage = {
    data: matching.slice((current - 1) * perPage, current * perPage),
    meta: { current_page: current, last_page: lastPage, per_page: perPage, total: matching.length },
  };

  const visits: Loadable<VisitsPage> = mode === "loading" ? { status: "loading" } : mode === "error" ? { status: "error", code: "too_many_requests" } : { status: "ready", data: result };

  return (
    <VisitsListView
      visits={visits}
      reps={supervisionReps}
      filters={filters}
      onFiltersChange={(next) => {
        setFilters(next);
        setPage(1);
        setSelected(null);
      }}
      mode={view}
      onModeChange={setView}
      onPageChange={(next) => {
        setPage(next);
        setSelected(null);
      }}
      onPerPageChange={(next) => {
        setPerPage(next);
        setPage(1);
        setSelected(null);
      }}
      today={supervisionToday}
      selectedVisitId={selected}
      onSelectVisit={setSelected}
      onOpenVisit={() => {}}
    />
  );
}
