"use client";

import { useState } from "react";
import { noRepsFilters, RepsListView, type RepsFilters, type RepsPage } from "@/features/reps/views/RepsListView";
import type { Loadable } from "@/lib/loadable";
import { repGovernorates, repRows, repSupervisors } from "@/mocks/reps-list";

// غلاف تفاعلي لصفحة الرسم (M13): يملك الفلاتر والصفحة ويرشّح ويرقّم بيانات المعرض محلياً. في الإنتاج تحلّ محلّه حاوية تجمع
// GET /users (المندوبين) مع جلسات دوام اليوم وزياراته. لا يُنقل للإنتاج.

type RepsDemoProps = {
  /** حالة البيانات: جاهزة، أو تحميل، أو خطأ، أو لا مندوبين. */
  mode?: "ready" | "loading" | "error" | "empty";
};

export function RepsDemo({ mode = "ready" }: RepsDemoProps) {
  const [filters, setFilters] = useState<RepsFilters>(noRepsFilters);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(20);

  const matching =
    mode === "empty"
      ? []
      : repRows.filter(
          (row) =>
            (!filters.governorateId || (row.rep.governorates ?? []).some((governorate) => String(governorate.id) === filters.governorateId)) &&
            (!filters.supervisorId || String(row.rep.manager?.id) === filters.supervisorId),
        );
  const lastPage = Math.max(1, Math.ceil(matching.length / perPage));
  const current = Math.min(page, lastPage);
  const result: RepsPage = {
    data: matching.slice((current - 1) * perPage, current * perPage),
    meta: { current_page: current, last_page: lastPage, per_page: perPage, total: matching.length },
  };
  const reps: Loadable<RepsPage> = mode === "loading" ? { status: "loading" } : mode === "error" ? { status: "error", code: "too_many_requests" } : { status: "ready", data: result };

  return (
    <RepsListView
      reps={reps}
      governorates={repGovernorates}
      supervisors={repSupervisors}
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
      onOpenRep={() => {}}
    />
  );
}
