"use client";

import { useState } from "react";
import { ManagerVisitsView, type ManagerVisitFilters, type ManagerVisitsPage, type VisitGoal } from "@/features/manager-visits/views/ManagerVisitsView";
import type { Loadable } from "@/lib/loadable";
import { managerVisits, visitGoal, visitsToday } from "@/mocks/manager-visits";

// غلاف تفاعلي لصفحة الرسم: يملك الفترة والصفحة، ويرشّح ويرقّم بيانات المعرض محلياً (ما يفعله الخادم بـ from وto وpage). الأحدث أولاً.
// في الإنتاج تحلّ محلّه حاوية تطلب GET /manager-visits وGET /plans/SALES/{month}. لا يُنقل للإنتاج.

/** الشهر الجاري حتى اليوم. */
export const defaultManagerVisitFilters: ManagerVisitFilters = { range: { from: "2026-11-01", to: visitsToday } };

type ManagerVisitsDemoProps = {
  /** حالة البيانات: جاهزة، أو تحميل، أو خطأ، أو لا زيارات. */
  mode?: "ready" | "loading" | "error" | "empty";
  /** بلا هدف في خطة الشهر: بطاقة الهدف «لا بيانات». */
  noGoal?: boolean;
  initialFilters?: ManagerVisitFilters;
};

export function ManagerVisitsDemo({ mode = "ready", noGoal = false, initialFilters = defaultManagerVisitFilters }: ManagerVisitsDemoProps) {
  const [filters, setFilters] = useState(initialFilters);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);

  const { from, to } = filters.range;
  const matching = mode === "empty" ? [] : managerVisits.filter((entry) => {
    const day = (entry.visited_at ?? "").slice(0, 10);
    return (!from || day >= from) && (!to || day <= to);
  });
  const lastPage = Math.max(1, Math.ceil(matching.length / perPage));
  const current = Math.min(page, lastPage);
  const result: ManagerVisitsPage = {
    data: matching.slice((current - 1) * perPage, current * perPage),
    meta: { current_page: current, last_page: lastPage, per_page: perPage, total: matching.length },
  };

  const visits: Loadable<ManagerVisitsPage> = mode === "loading" ? { status: "loading" } : mode === "error" ? { status: "error", code: "too_many_requests" } : { status: "ready", data: result };
  const goal: Loadable<VisitGoal | null> = mode === "loading" ? { status: "loading" } : { status: "ready", data: noGoal ? null : visitGoal };

  return (
    <ManagerVisitsView
      visits={visits}
      goal={goal}
      filters={filters}
      onFiltersChange={(next) => {
        setFilters(next);
        setPage(1);
      }}
      defaultFilters={defaultManagerVisitFilters}
      onPageChange={setPage}
      onPerPageChange={(next) => {
        setPerPage(next);
        setPage(1);
      }}
      today={visitsToday}
      canCreate
      onNewVisit={() => {}}
      onRetry={() => {}}
    />
  );
}
