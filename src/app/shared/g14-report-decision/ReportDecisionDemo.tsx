"use client";

import { useState } from "react";
import { decisionReady, emptyReportDecision, ReportDecisionView, type ReportDecisionForm } from "@/features/periodic-reports/views/ReportDecisionView";
import type { PeriodicReport } from "@/lib/api/types";
import type { Loadable } from "@/lib/loadable";
import { departmentMembers, describeTarget, reportAt, reportsNow, type ReportState } from "@/mocks/periodic-reports";

// غلاف تفاعلي لصفحة الرسم (G14): يملك التقرير والقرار. POST /decision محلياً: الأربعة الأولى ← APPROVED، والأخيران ← RETURNED. لا يُنقل للإنتاج.

const returning = ["RETURN_FOR_EDIT", "REQUEST_INFO"];

type ReportDecisionDemoProps = {
  state: ReportState;
  initialForm?: ReportDecisionForm;
  /** المفوَّض (رنا الشامي) يقرر عن زياد المصري. */
  delegate?: boolean;
  initialActionError?: string;
  mode?: "ready" | "loading" | "error";
};

export function ReportDecisionDemo({ state, initialForm = emptyReportDecision, delegate = false, initialActionError, mode = "ready" }: ReportDecisionDemoProps) {
  const [data, setData] = useState<PeriodicReport>(() => reportAt(state));
  const [form, setForm] = useState(initialForm);
  const people = (data.department ? departmentMembers[data.department] : undefined) ?? [];
  const memberName = (id: number) => people.find((user) => user.id === id)?.name ?? `#${id}`;
  const actor = delegate ? { id: 6, name: "رنا الشامي" } : { id: 1, name: "زياد المصري" };

  const loadable: Loadable<PeriodicReport> = mode === "loading" ? { status: "loading" } : mode === "error" ? { status: "error", code: "too_many_requests" } : { status: "ready", data };

  return (
    <ReportDecisionView
      report={loadable}
      canDecide
      isOwnReport={delegate && data.department === "SALES"}
      onBehalfOf={delegate ? "زياد المصري" : undefined}
      form={form}
      onFormChange={setForm}
      onSubmit={() => {
        if (initialActionError || !decisionReady(form) || !form.decision) return;
        setData({
          ...data,
          status: returning.includes(form.decision) ? "RETURNED" : "APPROVED",
          executive_decision: { decision: form.decision, notes: form.notes.trim() || null, required_action: form.requiredAction.trim() || null, decided_by: actor, decided_at: reportsNow, on_behalf_of: delegate ? { id: 1, name: "زياد المصري" } : null },
        });
      }}
      actionError={initialActionError}
      targetLabel={describeTarget}
      memberName={memberName}
      onOpenVersions={() => {}}
      onBack={() => {}}
    />
  );
}
