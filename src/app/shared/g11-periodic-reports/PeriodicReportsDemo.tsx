"use client";

import { useState } from "react";
import { emptyNewReport, noReportFilters, PeriodicReportsView, type NewReportForm, type ReportScope } from "@/features/periodic-reports/views/PeriodicReportsView";
import type { PeriodicReport } from "@/lib/api/types";
import { myReports, reportsNow, reportsToday, toDecideReports, toReviewReports } from "@/mocks/periodic-reports";

// غلاف تفاعلي لصفحة الرسم (G11): يملك النطاق والفلاتر والنافذة، ويصفّي كما يفعل GET /periodic-reports?scope&kind&status&department. الإنشاء POST محلياً. لا يُنقل للإنتاج.

type Viewer = "head" | "monitoring" | "executive";

const scopesFor: Record<Viewer, readonly ReportScope[]> = { head: ["mine"], monitoring: ["to_review", "all"], executive: ["to_decide", "all", "mine"] };
const all = [...new Map([...toDecideReports, ...toReviewReports, ...myReports].map((report) => [report.id, report])).values()];
const sourceFor: Record<ReportScope, readonly PeriodicReport[]> = { mine: myReports, to_review: toReviewReports, to_decide: toDecideReports, all };

type PeriodicReportsDemoProps = { viewer: Viewer; openDialog?: boolean; mode?: "ready" | "loading" | "error" | "empty" };

export function PeriodicReportsDemo({ viewer, openDialog = false, mode = "ready" }: PeriodicReportsDemoProps) {
  const scopes = scopesFor[viewer];
  const [scope, setScope] = useState<ReportScope>(scopes[0]);
  const [filters, setFilters] = useState(noReportFilters);
  const [created, setCreated] = useState<PeriodicReport[]>([]);
  const [newReport, setNewReport] = useState<NewReportForm | null>(openDialog ? { ...emptyNewReport, kind: "WEEKLY" } : null);
  const source = mode === "empty" ? [] : scope === "mine" ? [...created, ...(viewer === "head" ? sourceFor.mine : [])] : sourceFor[scope];
  const rows = source.filter((item) => (!filters.kind || item.kind === filters.kind) && (!filters.status || item.status === filters.status) && (!filters.department || item.department === filters.department));

  return (
    <PeriodicReportsView
      reports={mode === "loading" ? { status: "loading" } : mode === "error" ? { status: "error", code: "too_many_requests" } : { status: "ready", data: { data: rows, meta: { current_page: 1, last_page: 1, per_page: 15, total: rows.length } } }}
      scopes={scopes}
      scope={scope}
      onScopeChange={(next) => {
        setScope(next);
        setFilters(noReportFilters);
      }}
      filters={filters}
      onFiltersChange={setFilters}
      onPageChange={() => {}}
      onPerPageChange={() => {}}
      now={reportsNow}
      canCreate={viewer !== "monitoring"}
      newReport={newReport}
      onNewReportChange={setNewReport}
      onCreate={() => {
        if (!newReport?.kind || !newReport.periodStart || !newReport.periodEnd) return;
        setCreated([{ id: 90 + created.length, kind: newReport.kind, is_mandatory: false, period_start: newReport.periodStart, period_end: newReport.periodEnd, status: "DRAFT", department: viewer === "head" ? "LOGISTICS" : "EXECUTIVE", deadline_at: null, on_time: null }, ...created]);
        setScope("mine");
        setNewReport(null);
      }}
      today={reportsToday}
      onOpen={() => {}}
    />
  );
}
