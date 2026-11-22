"use client";

import { useState } from "react";
import { LeaveApprovalsView, noLeaveFilters, type LeaveDialog } from "@/features/leaves/views/LeaveApprovalsView";
import type { Leave } from "@/lib/api/types";
import { allLeaves, leavesNow, leavesToday, rami, teamLeaves } from "@/mocks/leaves";

// غلاف تفاعلي لصفحة الرسم (G18): يملك الفلتر والنافذة. POST /leaves/{id}/decision محلياً. لا يُنقل للإنتاج.

type LeaveApprovalsDemoProps = {
  viewer: "approver" | "accountant";
  initialDialog?: "approve" | "reject";
  initialActionError?: string;
  mode?: "ready" | "loading" | "error" | "empty";
};

export function LeaveApprovalsDemo({ viewer, initialDialog, initialActionError, mode = "ready" }: LeaveApprovalsDemoProps) {
  const [rows, setRows] = useState<readonly Leave[]>(mode === "empty" ? [] : viewer === "approver" ? teamLeaves : allLeaves);
  const [filters, setFilters] = useState(noLeaveFilters);
  const [dialog, setDialog] = useState<LeaveDialog>(initialDialog ? { kind: initialDialog, leave: teamLeaves[0], reason: "" } : null);
  const shown = rows.filter((row) => !filters.status || row.status === filters.status);

  return (
    <LeaveApprovalsView
      leaves={mode === "loading" ? { status: "loading" } : mode === "error" ? { status: "error", code: "too_many_requests" } : { status: "ready", data: { data: shown, meta: { current_page: 1, last_page: 1, per_page: 15, total: shown.length } } }}
      canDecide={viewer === "approver"}
      filters={filters}
      onFiltersChange={setFilters}
      onPageChange={() => {}}
      onPerPageChange={() => {}}
      today={leavesToday}
      dialog={dialog}
      onDialogChange={setDialog}
      onConfirm={() => {
        if (!dialog || initialActionError) return;
        const reason = dialog.reason.trim();
        if (dialog.kind === "reject" && !reason) return;
        setRows(rows.map((row) => (row.id === dialog.leave.id ? { ...row, status: dialog.kind === "approve" ? "APPROVED" : "REJECTED", decided_by: rami, decided_at: leavesNow, decision_reason: reason || null } : row)));
        setDialog(null);
      }}
      actionError={initialActionError}
      conflict={initialActionError === "already_decided" ? { decidedBy: "زياد المصري", decidedAt: "2026-11-22T08:40:00Z" } : undefined}
    />
  );
}
