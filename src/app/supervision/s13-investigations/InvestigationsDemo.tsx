"use client";

import { useState } from "react";
import { InvestigationsListView, noInvestigationFilters, type InvestigationFilters, type InvestigationsPage } from "@/features/investigations/views/InvestigationsListView";
import type { Investigation } from "@/lib/api/types";
import type { Loadable } from "@/lib/loadable";
import { investigationsList } from "@/mocks/investigations";

// غلاف تفاعلي لصفحة الرسم: يملك الفلتر والصفحة ويرشّح ويرقّم بيانات المعرض محلياً (ما يفعله الخادم بـ status وpage). «قيد التحقيق» مشتق من المراحل 1 إلى 7.
// الصف يفتح S15 و«فتح ملف» يفتح S14 (في الإنتاج: تنقل). في الإنتاج تحلّ محلّه حاوية تطلب GET /investigations. لا يُنقل للإنتاج.

type InvestigationsDemoProps = {
  /** `investigations.manage` (المراقبة): «فتح ملف». المدير التنفيذي بلا فتح. */
  canOpen?: boolean;
  /** حالة البيانات: جاهزة، أو تحميل، أو خطأ، أو لا ملفات. */
  mode?: "ready" | "loading" | "error" | "empty";
  initialFilters?: InvestigationFilters;
};

function matches(row: Investigation, { status }: InvestigationFilters): boolean {
  if (!status) return true;
  if (status === "IN_PROGRESS") return (row.status ?? "").startsWith("STAGE_");
  return row.status === status;
}

export function InvestigationsDemo({ canOpen = true, mode = "ready", initialFilters = noInvestigationFilters }: InvestigationsDemoProps) {
  const [filters, setFilters] = useState(initialFilters);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);

  const matching = mode === "empty" ? [] : investigationsList.filter((row) => matches(row, filters));
  const lastPage = Math.max(1, Math.ceil(matching.length / perPage));
  const current = Math.min(page, lastPage);
  const result: InvestigationsPage = {
    data: matching.slice((current - 1) * perPage, current * perPage),
    meta: { current_page: current, last_page: lastPage, per_page: perPage, total: matching.length },
  };
  const investigations: Loadable<InvestigationsPage> = mode === "loading" ? { status: "loading" } : mode === "error" ? { status: "error", code: "too_many_requests" } : { status: "ready", data: result };

  return (
    <InvestigationsListView
      investigations={investigations}
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
      canOpen={canOpen}
      onOpenNew={() => {}}
      onOpen={() => {}}
    />
  );
}
