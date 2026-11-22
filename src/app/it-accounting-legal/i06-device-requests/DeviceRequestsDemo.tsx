"use client";

import { useState } from "react";
import { DeviceRequestsView, type DeviceDecision, type DeviceRequestsPage } from "@/features/devices/views/DeviceRequestsView";
import type { DeviceChangeRequest } from "@/lib/api/types";
import type { Loadable } from "@/lib/loadable";
import { deviceRequests, devicesNow } from "@/mocks/devices";

// غلاف تفاعلي لصفحة الرسم (I06): يملك الطلبات والفلتر ونافذة القرار. القرار كما تفعل POST /device-change-requests/{id}/decision.
// «لم يُزامن منذ مدة» هنا: قبل 24 ساعة من الآن (الحدّ سؤال للباك §78). لا يُنقل للإنتاج.

type RequestStatus = NonNullable<DeviceChangeRequest["status"]>;
type DeviceRequestsDemoProps = { initialStatus?: RequestStatus | null; initialDeciding?: { id: number; decision: "APPROVED" | "REJECTED" }; initialError?: string; mode?: "ready" | "loading" | "error" };

const tarek = { id: 9, name: "طارق النحاس" };
const staleBefore = "2026-11-17T10:00:00Z";

export function DeviceRequestsDemo({ initialStatus = null, initialDeciding, initialError, mode = "ready" }: DeviceRequestsDemoProps) {
  const [rows, setRows] = useState<readonly DeviceChangeRequest[]>(deviceRequests);
  const [status, setStatus] = useState<RequestStatus | null>(initialStatus);
  const [deciding, setDeciding] = useState<DeviceDecision | null>(() => {
    const request = deviceRequests.find((row) => row.id === initialDeciding?.id);
    return request && initialDeciding ? { request, decision: initialDeciding.decision } : null;
  });
  const [reason, setReason] = useState("");
  const [error, setError] = useState(initialError);

  const filtered = rows.filter((row) => !status || row.status === status).toSorted((a, b) => Number(b.status === "PENDING") - Number(a.status === "PENDING"));
  const result: DeviceRequestsPage = { data: filtered, meta: { current_page: 1, last_page: 1, per_page: 20, total: filtered.length } };
  const requests: Loadable<DeviceRequestsPage> = mode === "loading" ? { status: "loading" } : mode === "error" ? { status: "error", code: "too_many_requests" } : { status: "ready", data: result };

  return (
    <DeviceRequestsView
      requests={requests}
      status={status}
      onStatusChange={setStatus}
      canDecide
      staleBefore={staleBefore}
      deciding={deciding}
      onDecidingChange={(next) => {
        setDeciding(next);
        setReason("");
      }}
      reason={reason}
      onReasonChange={setReason}
      onDecide={() => {
        if (!deciding) return;
        setRows(rows.map((row) => (row.id === deciding.request.id ? { ...row, status: deciding.decision, decided_by: tarek, decided_at: devicesNow, reason: reason.trim() } : row)));
        setDeciding(null);
      }}
      decisionError={error}
      onDismissError={() => setError(undefined)}
      onPageChange={() => {}}
    />
  );
}
