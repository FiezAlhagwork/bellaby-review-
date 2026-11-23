"use client";

import { useState } from "react";
import { DamageReportFormView, emptyDamageReportForm, type DamageReportForm } from "@/features/damage/views/DamageReportFormView";
import type { DamageReport } from "@/lib/api/types";
import { agentDamageBatches, agentDamageLocationId, agentDamageOptions, agentDamageReports } from "@/mocks/agent-own-returns";
import { damageToday } from "@/mocks/damage-reports";

// غلاف تفاعلي لصفحة الرسم (A14): نموذج تالف W20 بموقع الوكيل وحده (مقفل). POST /damage-reports محلياً. لا يُنقل للإنتاج.

export function AgentDamageDemo({ saved = false }: { saved?: boolean }) {
  const [form, setForm] = useState<DamageReportForm>(emptyDamageReportForm(agentDamageLocationId));
  const [result, setResult] = useState<DamageReport | null>(saved ? agentDamageReports[0] : null);

  return (
    <DamageReportFormView
      options={{ status: "ready", data: agentDamageOptions }}
      batches={agentDamageBatches}
      form={form}
      onFormChange={setForm}
      saved={result}
      today={damageToday}
      onSubmit={() => setResult(agentDamageReports[0])}
      onCancel={() => {}}
      onReportAnother={() => {
        setResult(null);
        setForm(emptyDamageReportForm(agentDamageLocationId));
      }}
      onOpenReports={() => {}}
      onFilesSelect={() => {}}
      onFileRemove={() => {}}
      description="بلّغ عن بضاعة تالفة في رصيدك. يقرّر مدير المبيعات قبولها أو رفضها بعد الرفع."
    />
  );
}
