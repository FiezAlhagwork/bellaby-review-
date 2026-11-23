"use client";

import { useState } from "react";
import { AgentReturnFormView, type AgentReturnForm } from "@/features/returns/views/AgentReturnFormView";
import type { AgentReturn } from "@/lib/api/types";
import { agentRecallReasonId, agentReturnFormBatches, agentReturnFormOptions, recallAgentReturnForm, savedOwnAgentReturn } from "@/mocks/agent-own-returns";
import { salesToday } from "@/mocks/sales";

// غلاف تفاعلي لصفحة الرسم (A15): النموذج المشترك مع M03 للوكيل نفسه. اختيار دفعة موقوفة يملأ «سحب دفعة» (§124). POST /agent-returns محلياً. لا يُنقل للإنتاج.

const blank: AgentReturnForm = { reasonId: null, note: "", lines: [{ id: "line-1", itemId: null, batchId: null, quantity: null }] };

export function AgentReturnDemo({ preset = "blank", saved = false }: { preset?: "blank" | "recall"; saved?: boolean }) {
  const [form, setForm] = useState<AgentReturnForm>(preset === "recall" ? recallAgentReturnForm : blank);
  const [result, setResult] = useState<AgentReturn | null>(saved ? savedOwnAgentReturn : null);

  const suspendedIds = new Set(Object.values(agentReturnFormBatches).flatMap((loadable) => (loadable.status === "ready" ? loadable.data.filter((batch) => batch.status === "SUSPENDED").map((batch) => batch.id) : [])));

  return (
    <AgentReturnFormView
      options={{ status: "ready", data: agentReturnFormOptions }}
      batches={agentReturnFormBatches}
      form={form}
      onFormChange={(next) => setForm(next.lines.some((line) => line.batchId !== null && suspendedIds.has(line.batchId)) ? { ...next, reasonId: agentRecallReasonId } : next)}
      onBehalfOf={null}
      recallReasonId={agentRecallReasonId}
      saved={result}
      today={salesToday}
      onSubmit={() => setResult(savedOwnAgentReturn)}
      onCancel={() => {}}
      onOpenRequests={() => {}}
    />
  );
}
