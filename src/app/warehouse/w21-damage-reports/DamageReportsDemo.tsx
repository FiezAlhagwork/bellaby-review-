"use client";

import { useState } from "react";
import { DamageReportsListView, noDamageReportFilters, type DamageReportFilters, type DamageReportsPage } from "@/features/damage/views/DamageReportsListView";
import type { DamageReport } from "@/lib/api/types";
import type { Loadable } from "@/lib/loadable";
import { damageLocations, damageReportsList } from "@/mocks/damage-reports";

// غلاف تفاعلي لصفحة الرسم: يملك الفلاتر والصفحة ويرشّح ويرقّم بيانات المعرض محلياً (ما يفعله الخادم بـ status وlocation_id وpage).
// «تقرير تالف» ينقل في الإنتاج إلى W20، والصف إلى M08 للقراءة. في الإنتاج تحلّ محلّه حاوية تطلب GET /damage-reports. لا يُنقل للإنتاج.

type DamageReportsDemoProps = {
  /** حالة البيانات: جاهزة، أو تحميل، أو خطأ، أو لا تقارير إطلاقاً. */
  mode?: "ready" | "loading" | "error" | "empty";
  initialFilters?: DamageReportFilters;
  /** حجم الصفحة الابتدائي (للمعاينة بعدة صفحات). */
  initialPerPage?: number;
};

function applyFilters(rows: readonly DamageReport[], { status, locationId }: DamageReportFilters): DamageReport[] {
  return rows.filter((row) => (!status || row.status === status) && (!locationId || String(row.location?.id) === locationId));
}

export function DamageReportsDemo({ mode = "ready", initialFilters = noDamageReportFilters, initialPerPage = 20 }: DamageReportsDemoProps) {
  const [filters, setFilters] = useState(initialFilters);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(initialPerPage);

  const matching = mode === "empty" ? [] : applyFilters(damageReportsList, filters);
  const lastPage = Math.max(1, Math.ceil(matching.length / perPage));
  const current = Math.min(page, lastPage);
  const result: DamageReportsPage = {
    data: matching.slice((current - 1) * perPage, current * perPage),
    meta: { current_page: current, last_page: lastPage, per_page: perPage, total: matching.length },
  };

  const reports: Loadable<DamageReportsPage> = mode === "loading" ? { status: "loading" } : mode === "error" ? { status: "error", code: "too_many_requests" } : { status: "ready", data: result };

  return (
    <DamageReportsListView
      reports={reports}
      locations={damageLocations}
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
      canCreate
      onCreate={() => {}}
      onOpenReport={() => {}}
    />
  );
}
