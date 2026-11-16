"use client";

import { useState } from "react";
import { AttendanceSessionsView, isShortDay, noAttendanceFilters, type AttendanceFilters, type AttendancePage, type AttendanceRow } from "@/features/attendance/views/AttendanceSessionsView";
import type { Loadable } from "@/lib/loadable";
import { attendanceRows } from "@/mocks/attendance";
import { supervisionReps, supervisionToday } from "@/mocks/supervision";

// غلاف تفاعلي لصفحة الرسم: يملك الفلاتر والصفحة ويرشّح ويرقّم بيانات المعرض محلياً (rep_id وfrom وto وclose_source وpage). مفتاح «العرض» مشتق عندنا
// ما عدا الإغلاق الآلي (docs/backend-requests.md §28.4). في الإنتاج تحلّ محلّه حاوية تطلب GET /attendance-sessions. لا يُنقل للإنتاج.

type AttendanceDemoProps = {
  /** حالة البيانات: جاهزة، أو تحميل، أو خطأ، أو لا جلسات إطلاقاً. */
  mode?: "ready" | "loading" | "error" | "empty";
  initialFilters?: AttendanceFilters;
};

const repIdOf = (row: AttendanceRow) => (row.kind === "session" ? row.session.rep?.id : row.rep.id);
const dateOf = (row: AttendanceRow) => (row.kind === "session" ? (row.session.work_date ?? "") : row.work_date);

function applyFilters(rows: readonly AttendanceRow[], { repId, range, view }: AttendanceFilters): AttendanceRow[] {
  return rows.filter((row) => {
    if (repId && String(repIdOf(row)) !== repId) return false;
    if (range.from && dateOf(row) < range.from) return false;
    if (range.to && dateOf(row) > range.to) return false;
    if (view === "absent") return row.kind === "absence";
    if (view === "short-day") return row.kind === "session" && isShortDay(row.session);
    if (view === "auto-closed") return row.kind === "session" && row.session.close_source === "AUTO";
    return true;
  });
}

export function AttendanceDemo({ mode = "ready", initialFilters = noAttendanceFilters }: AttendanceDemoProps) {
  const [filters, setFilters] = useState(initialFilters);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);

  const matching = mode === "empty" ? [] : applyFilters(attendanceRows, filters);
  const lastPage = Math.max(1, Math.ceil(matching.length / perPage));
  const current = Math.min(page, lastPage);
  const result: AttendancePage = {
    data: matching.slice((current - 1) * perPage, current * perPage),
    meta: { current_page: current, last_page: lastPage, per_page: perPage, total: matching.length },
  };

  const rows: Loadable<AttendancePage> = mode === "loading" ? { status: "loading" } : mode === "error" ? { status: "error", code: "too_many_requests" } : { status: "ready", data: result };

  return (
    <AttendanceSessionsView
      rows={rows}
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
      today={supervisionToday}
    />
  );
}
