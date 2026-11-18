"use client";

import { useState } from "react";
import { KpiWeightsView, type CoefficientForm, type WeightDraft } from "@/features/settings/views/KpiWeightsView";
import type { ComparisonGroup, KpiWeightSet } from "@/lib/api/types";
import type { Loadable } from "@/lib/loadable";
import { comparisonGroups, kpiNextMonth, kpiRoles, kpiWeights, roleNames } from "@/mocks/settings";

// غلاف تفاعلي لصفحة الرسم (E16): يملك الدور والمسودة والمجموعات. الحفظ كما تفعل PUT /kpi-weights وPUT /comparison-groups:
// يسري من الشهر التالي فيظهر الشريط، والسارية تبقى كما هي هذا الشهر. لا يُنقل للإنتاج.

type RoleKey = keyof typeof kpiWeights;

type WeightsDemoProps = { initialDraft?: "current" | "sum-error"; scheduled?: boolean; mode?: "ready" | "loading" | "error" };

const draftOf = (set: KpiWeightSet): WeightDraft[] => (set.weights ?? []).map((row) => ({ kpi_key: row.kpi_key ?? "", label: row.label ?? "", weight: row.weight ?? null }));

export function WeightsDemo({ initialDraft, scheduled = false, mode = "ready" }: WeightsDemoProps) {
  const [roleKey, setRoleKey] = useState<RoleKey>("rep");
  const [draft, setDraft] = useState<readonly WeightDraft[] | null>(() => {
    if (!initialDraft) return null;
    const rows = draftOf(kpiWeights.rep);
    return initialDraft === "sum-error" ? rows.map((row) => (row.kpi_key === "confirmed_visits" ? { ...row, weight: 30 } : row)) : rows;
  });
  const [scheduledMonth, setScheduledMonth] = useState<string | undefined>(scheduled ? kpiNextMonth : undefined);
  const [groups, setGroups] = useState<readonly ComparisonGroup[]>(comparisonGroups);
  const [coefficientForm, setCoefficientForm] = useState<CoefficientForm | null>(null);

  const weights: Loadable<KpiWeightSet> = mode === "loading" ? { status: "loading" } : mode === "error" ? { status: "error", code: "too_many_requests" } : { status: "ready", data: kpiWeights[roleKey] };
  const groupsState: Loadable<readonly ComparisonGroup[]> = mode === "loading" ? { status: "loading" } : mode === "error" ? { status: "error", code: "too_many_requests" } : { status: "ready", data: groups };

  return (
    <KpiWeightsView
      roles={kpiRoles}
      roleKey={roleKey}
      onRoleChange={(key) => {
        setRoleKey(key as RoleKey);
        setScheduledMonth(undefined);
      }}
      weights={weights}
      nextMonth={kpiNextMonth}
      scheduledMonth={scheduledMonth}
      canManage
      draft={draft}
      onDraftChange={setDraft}
      onSave={() => {
        setDraft(null);
        setScheduledMonth(kpiNextMonth);
      }}
      groups={groupsState}
      roleNames={roleNames}
      coefficientForm={coefficientForm}
      onCoefficientFormChange={setCoefficientForm}
      onSaveCoefficient={() => {
        if (!coefficientForm) return;
        // المعامل الجديد يسري من الشهر التالي؛ يُعرض هنا بعد الحفظ للرسم فقط.
        setGroups(groups.map((group) => (group.id === coefficientForm.group.id ? { ...group, agent_coefficient: Number(coefficientForm.value.trim()), effective_month: kpiNextMonth } : group)));
        setCoefficientForm(null);
      }}
    />
  );
}
