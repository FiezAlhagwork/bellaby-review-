"use client";

import { useState } from "react";
import { MyLeavesView, type LeaveRequestForm } from "@/features/leaves/views/MyLeavesView";
import type { Leave } from "@/lib/api/types";
import { leavesMonthStart, leavesNow, leavesToday, myLeaves, rami, salim } from "@/mocks/leaves";

// غلاف تفاعلي لصفحة الرسم (G17): يملك السجل والنافذتين. POST /leaves و/cancel محلياً. لا يُنقل للإنتاج.

type MyLeavesDemoProps = {
  initialRequest?: LeaveRequestForm;
  initialRequestError?: string;
  /** يفتح تأكيد إلغاء الطلب المعلّق. */
  cancelOpen?: boolean;
  initialActionError?: string;
  mode?: "ready" | "loading" | "error" | "empty";
};

export function MyLeavesDemo({ initialRequest, initialRequestError, cancelOpen = false, initialActionError, mode = "ready" }: MyLeavesDemoProps) {
  const [rows, setRows] = useState<readonly Leave[]>(mode === "empty" ? [] : myLeaves);
  const [request, setRequest] = useState<LeaveRequestForm | null>(initialRequest ?? null);
  const [requestError, setRequestError] = useState(initialRequestError);
  const [cancelTarget, setCancelTarget] = useState<Leave | null>(cancelOpen ? myLeaves[0] : null);
  const [actionError, setActionError] = useState(initialActionError);

  return (
    <MyLeavesView
      leaves={mode === "loading" ? { status: "loading" } : mode === "error" ? { status: "error", code: "too_many_requests" } : { status: "ready", data: { data: rows, meta: { current_page: 1, last_page: 1, per_page: 15, total: rows.length } } }}
      onPageChange={() => {}}
      onPerPageChange={() => {}}
      request={request}
      onRequestChange={(next) => {
        setRequest(next);
        setRequestError(undefined);
      }}
      onSubmitRequest={() => {
        if (!request?.from || !request.to) return;
        if (request.from < leavesMonthStart) return setRequestError("leave_before_current_month");
        setRows([{ id: 70 + rows.length, client_uuid: null, employee: salim, approver: rami, from: request.from, to: request.to, reason: request.reason.trim() || null, status: "PENDING", decided_by: null, decided_at: null, decision_reason: null, created_at: leavesNow }, ...rows]);
        setRequest(null);
      }}
      requestError={requestError}
      today={leavesToday}
      monthStart={leavesMonthStart}
      cancelTarget={cancelTarget}
      onCancelTargetChange={setCancelTarget}
      onConfirmCancel={() => {
        if (!cancelTarget) return;
        if (initialActionError) {
          setActionError(initialActionError);
          setCancelTarget(null);
          return;
        }
        setRows(rows.map((row) => (row.id === cancelTarget.id ? { ...row, status: "CANCELLED" } : row)));
        setCancelTarget(null);
      }}
      actionError={cancelTarget ? undefined : actionError}
    />
  );
}
