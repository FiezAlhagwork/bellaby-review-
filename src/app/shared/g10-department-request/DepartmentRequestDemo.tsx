"use client";

import { useState } from "react";
import { DepartmentRequestDetailsView, type RequestDialog } from "@/features/department-requests/views/DepartmentRequestDetailsView";
import type { DepartmentRequest } from "@/lib/api/types";
import type { Loadable } from "@/lib/loadable";
import { rami, requestAt, requestsNow } from "@/mocks/department-requests";

// غلاف تفاعلي لصفحة الرسم (G10): يملك الطلب والنافذة. القرار POST /decision والإنجاز POST /complete، محلياً. لا يُنقل للإنتاج.

type DepartmentRequestDemoProps = {
  state: Parameters<typeof requestAt>[0];
  initialDialog?: NonNullable<RequestDialog>["kind"];
  initialActionError?: string;
  mode?: "ready" | "loading" | "error" | "not-found";
};

export function DepartmentRequestDemo({ state, initialDialog, initialActionError, mode = "ready" }: DepartmentRequestDemoProps) {
  const [data, setData] = useState<DepartmentRequest>(() => requestAt(state));
  const [dialog, setDialog] = useState<RequestDialog>(initialDialog ? { kind: initialDialog, reply: "" } : null);
  const recipient = state !== "outgoing";

  const loadable: Loadable<DepartmentRequest> = mode === "loading" ? { status: "loading" } : mode === "error" ? { status: "error", code: "too_many_requests" } : mode === "not-found" ? { status: "error", code: "not_found" } : { status: "ready", data };

  return (
    <DepartmentRequestDetailsView
      request={loadable}
      isRecipient={recipient}
      canDecide={recipient}
      dialog={dialog}
      onDialogChange={setDialog}
      onConfirm={() => {
        if (!dialog || initialActionError) return;
        const reply = dialog.reply.trim() || null;
        if (dialog.kind === "reject" && !reply) return;
        const status = dialog.kind === "accept" ? "IN_PROGRESS" : dialog.kind === "reject" ? "REJECTED" : "DONE";
        setData({ ...data, status, reply: reply ?? data.reply, handled_by: rami, is_overdue: status === "IN_PROGRESS" ? data.is_overdue : false, updated_at: requestsNow });
        setDialog(null);
      }}
      onCreateTask={() => {}}
      onOpenReport={() => {}}
      actionError={initialActionError}
      onBack={() => {}}
    />
  );
}
