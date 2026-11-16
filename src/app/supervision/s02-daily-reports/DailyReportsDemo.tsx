"use client";

import { useState } from "react";
import type { DailyReportRow } from "@/features/daily-reports/deadline";
import { DailyReportsListView, noDailyReportFilters, type DailyReportFilters, type DailyReportsPage } from "@/features/daily-reports/views/DailyReportsListView";
import type { Loadable } from "@/lib/loadable";
import { dailyReportsList } from "@/mocks/daily-reports";
import { supervisionNow, supervisionReps, supervisionToday } from "@/mocks/supervision";

// غلاف تفاعلي لصفحة الرسم: يملك الفلاتر والصفحة ويرشّح ويرقّم بيانات المعرض محلياً (ما يفعله الخادم بـ rep_id وfrom وto وrated وpage).
// «بانتظار التقييم أولاً» للسوبرفايزر: الأقرب انتهاء مهلة أولاً. ترتيب الخادم غير موجود في العقد (docs/backend-requests.md §26.3).
// في الإنتاج تحلّ محلّه حاوية تطلب GET /daily-reports. لا يُنقل للإنتاج.

type DailyReportsDemoProps = {
  /** السوبرفايزر (true) أو مدير المكتب العلمي للقراءة فقط (false). */
  canRate: boolean;
  /** حالة البيانات: جاهزة، أو تحميل، أو خطأ، أو لا تقارير إطلاقاً. */
  mode?: "ready" | "loading" | "error" | "empty";
  initialFilters?: DailyReportFilters;
};

function applyFilters(rows: readonly DailyReportRow[], { repId, range, rated }: DailyReportFilters): DailyReportRow[] {
  return rows.filter(
    (row) =>
      (!repId || String(row.rep?.id) === repId) &&
      (!range.from || (row.work_date ?? "") >= range.from) &&
      (!range.to || (row.work_date ?? "") <= range.to) &&
      (rated === null || (rated ? row.rating !== null : row.rating === null)),
  );
}

/** بانتظار التقييم أولاً بأقرب موعد، ثم المقيَّمة بالأحدث. */
function pendingFirst(rows: readonly DailyReportRow[]): DailyReportRow[] {
  const pending = rows.filter((row) => !row.rating).sort((a, b) => (a.rating_due_at ?? "").localeCompare(b.rating_due_at ?? ""));
  return [...pending, ...rows.filter((row) => row.rating)];
}

export function DailyReportsDemo({ canRate, mode = "ready", initialFilters = noDailyReportFilters }: DailyReportsDemoProps) {
  const [filters, setFilters] = useState(initialFilters);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);

  const filtered = mode === "empty" ? [] : applyFilters(dailyReportsList, filters);
  const matching = canRate ? pendingFirst(filtered) : filtered;
  const lastPage = Math.max(1, Math.ceil(matching.length / perPage));
  const current = Math.min(page, lastPage);
  const result: DailyReportsPage = {
    data: matching.slice((current - 1) * perPage, current * perPage),
    meta: { current_page: current, last_page: lastPage, per_page: perPage, total: matching.length },
  };

  const reports: Loadable<DailyReportsPage> = mode === "loading" ? { status: "loading" } : mode === "error" ? { status: "error", code: "too_many_requests" } : { status: "ready", data: result };

  return (
    <DailyReportsListView
      reports={reports}
      reps={supervisionReps}
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
      canRate={canRate}
      now={supervisionNow}
      today={supervisionToday}
      onOpenReport={() => {}}
    />
  );
}
