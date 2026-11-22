"use client";

import { useState } from "react";
import { AgentTransferView } from "@/features/transfers/views/AgentTransferView";
import type { Transfer } from "@/lib/api/types";
import type { Loadable } from "@/lib/loadable";
import { agentCancelled, agentInTransit, agentNow, agentReceived, agentToday } from "@/mocks/agent";

// غلاف تفاعلي لصفحة الرسم (A03): POST /transfers/{id}/receive محلياً ← RECEIVED. لا يُنقل للإنتاج.

const sources = { "in-transit": agentInTransit, received: agentReceived, cancelled: agentCancelled } as const;

type AgentTransferDemoProps = {
  state: keyof typeof sources;
  confirmOpen?: boolean;
  initialActionError?: string;
  mode?: "ready" | "loading" | "error" | "not-found";
};

export function AgentTransferDemo({ state, confirmOpen = false, initialActionError, mode = "ready" }: AgentTransferDemoProps) {
  const [data, setData] = useState<Transfer>(sources[state]);
  const [confirming, setConfirming] = useState(confirmOpen);
  const [actionError, setActionError] = useState(initialActionError);

  const loadable: Loadable<Transfer> = mode === "loading" ? { status: "loading" } : mode === "error" ? { status: "error", code: "too_many_requests" } : mode === "not-found" ? { status: "error", code: "not_found" } : { status: "ready", data };

  return (
    <AgentTransferView
      transfer={loadable}
      canReceive
      confirming={confirming}
      onConfirmingChange={setConfirming}
      onReceive={() => {
        if (initialActionError) {
          setActionError(initialActionError);
          setConfirming(false);
          return;
        }
        setData({ ...data, status: "RECEIVED", received_by: { id: 41, name: "ياسر الحمصي" }, received_at: agentNow, hours_in_transit: null });
        setConfirming(false);
      }}
      actionError={confirming ? undefined : actionError}
      today={agentToday}
      onBack={() => {}}
    />
  );
}
