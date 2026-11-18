"use client";

import { useState } from "react";
import { AgentReturnFormView, type AgentReturnForm } from "@/features/returns/views/AgentReturnFormView";
import type { AgentReturn } from "@/lib/api/types";
import type { Loadable } from "@/lib/loadable";
import { agentReturnBatches, agentReturnOptions, findAgent, salesToday, savedAgentReturn } from "@/mocks/sales";

// غلاف تفاعلي لنموذج الإرجاع عن الوكيل: يملك النموذج، و«إنشاء الإرجاع» يعرض الملخص (ما يفعله الخادم بـ POST /agent-returns). لا يُنقل للإنتاج.

type AgentReturnFormDemoProps = {
  agentId: number;
  initialForm: AgentReturnForm;
  /** أخطاء `validation_failed` على حقولها. */
  errors?: Readonly<Record<string, string>>;
  /** رمز خطأ 422 بلا حقل. */
  submitError?: string;
  /** طلب أُنشئ بالفعل: يعرض الملخص. */
  initiallySaved?: boolean;
  /** حالة الخيارات: جاهزة، أو تحميل، أو خطأ. */
  mode?: "ready" | "loading" | "error";
};

export function AgentReturnFormDemo({ agentId, initialForm, errors, submitError, initiallySaved = false, mode = "ready" }: AgentReturnFormDemoProps) {
  const [form, setForm] = useState(initialForm);
  const [saved, setSaved] = useState<AgentReturn | null>(initiallySaved ? savedAgentReturn : null);
  const agent = findAgent(agentId);

  const options: Loadable<typeof agentReturnOptions> = mode === "loading" ? { status: "loading" } : mode === "error" ? { status: "error", code: "too_many_requests" } : { status: "ready", data: agentReturnOptions };

  return (
    <AgentReturnFormView
      options={options}
      batches={agentReturnBatches}
      form={form}
      onFormChange={setForm}
      onBehalfOf={{ id: agent.id, name: agent.name, governorates: agent.governorates }}
      errors={errors}
      submitError={submitError}
      saved={saved}
      today={salesToday}
      onSubmit={() => setSaved(savedAgentReturn)}
      onCancel={() => {}}
      onOpenAgent={() => {}}
      onRetry={() => {}}
    />
  );
}
