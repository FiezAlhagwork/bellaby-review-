"use client";

import { useState } from "react";
import { DeliveryDetailsView, type DeliveryDialog } from "@/features/deliveries/views/DeliveryDetailsView";
import type { Delivery } from "@/lib/api/types";
import type { Loadable } from "@/lib/loadable";
import { agentDeliveryAt, deliveriesToday, type AgentDeliveryState } from "@/mocks/agent-deliveries";

// غلاف تفاعلي لصفحة الرسم (A10): POST /collect ← PAID، وPOST /request-approval ← APPROVAL_PENDING، محلياً. لا يُنقل للإنتاج.

const NOW = "2026-11-10T09:00:00Z";

type AgentDeliveryDemoProps = {
  state: AgentDeliveryState;
  initialDialog?: NonNullable<DeliveryDialog>;
  initialActionError?: string;
  mode?: "ready" | "loading" | "error" | "not-found";
};

export function AgentDeliveryDemo({ state, initialDialog, initialActionError, mode = "ready" }: AgentDeliveryDemoProps) {
  const [data, setData] = useState<Delivery>(() => agentDeliveryAt(state));
  const [dialog, setDialog] = useState<DeliveryDialog>(initialDialog ?? null);

  const loadable: Loadable<Delivery> = mode === "loading" ? { status: "loading" } : mode === "error" ? { status: "error", code: "too_many_requests" } : mode === "not-found" ? { status: "error", code: "not_found" } : { status: "ready", data };

  return (
    <DeliveryDetailsView
      delivery={loadable}
      today={deliveriesToday}
      canCollect
      canReturn
      dialog={dialog}
      onDialogChange={setDialog}
      onConfirm={() => {
        if (!dialog || initialActionError) return;
        if (dialog.kind === "collect") setData({ ...data, status: "PAID", collected_at: NOW, paid_on_time: !data.is_payment_overdue, is_payment_overdue: false });
        else if (dialog.type && dialog.reason.trim()) setData({ ...data, status: "APPROVAL_PENDING", pending_request: { type: dialog.type, reason: dialog.reason.trim(), requested_at: NOW }, decision: null });
        else return;
        setDialog(null);
      }}
      onReturn={() => {}}
      actionError={initialActionError}
      onBack={() => {}}
    />
  );
}
