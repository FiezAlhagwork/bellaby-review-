"use client";

import { useState } from "react";
import { MonthlyPlanView, revisionFromPlan, revisionTargets, type RevisionForm } from "@/features/plans/views/MonthlyPlanView";
import type { Department, MonthlyPlan } from "@/lib/api/types";
import type { Loadable } from "@/lib/loadable";
import { describeTarget } from "@/mocks/periodic-reports";
import { planAt, plansMonth, plansNow, plansToday, type PlanState } from "@/mocks/plans";

// غلاف تفاعلي لصفحة الرسم (G16): يملك الشهر والقسم والنافذتين. POST …/revisions و…/decision محلياً. غير تشرين الثاني ← 404 (لا خطة). لا يُنقل للإنتاج.

type MonthlyPlanDemoProps = {
  state: PlanState;
  viewer: "head" | "executive";
  initialMonth?: string;
  openRevision?: boolean;
  initialActionError?: string;
  mode?: "ready" | "loading" | "error";
};

const departments: Department[] = ["SALES", "SCIENTIFIC_OFFICE"];

export function MonthlyPlanDemo({ state, viewer, initialMonth = plansMonth, openRevision = false, initialActionError, mode = "ready" }: MonthlyPlanDemoProps) {
  const [data, setData] = useState<MonthlyPlan>(() => planAt(state));
  const [month, setMonth] = useState(initialMonth);
  const [department, setDepartment] = useState<Department>("SALES");
  const [revision, setRevision] = useState<RevisionForm | null>(() => (openRevision ? { ...revisionFromPlan(planAt(state)), targets: [72000, 25000, 30000, 52000, 6, 12] } : null));
  const [rejectReason, setRejectReason] = useState<string | null>(null);

  const loadable: Loadable<MonthlyPlan> =
    mode === "loading" ? { status: "loading" } : mode === "error" ? { status: "error", code: "too_many_requests" } : month !== plansMonth || department !== "SALES" ? { status: "error", code: "not_found" } : { status: "ready", data };

  return (
    <MonthlyPlanView
      plan={loadable}
      month={month}
      onMonthChange={setMonth}
      department={department}
      canPickDepartment={viewer === "executive"}
      departments={departments}
      onDepartmentChange={setDepartment}
      canRequestRevision={viewer === "head"}
      canApprove={viewer === "executive"}
      revision={revision}
      onRevisionChange={setRevision}
      onSubmitRevision={() => {
        if (!revision?.reason.trim()) return;
        setData({ ...data, status: "REVISION_PENDING", pending_revision: { id: 5, reason: revision.reason, targets: revisionTargets(data, revision), requested_by: { id: 6, name: "رنا الشامي" }, requested_at: plansNow } });
        setRevision(null);
      }}
      rejectReason={rejectReason}
      onRejectReasonChange={setRejectReason}
      onApproveRevision={() => {
        if (initialActionError) return;
        setData(planAt("revised"));
      }}
      onRejectRevision={() => {
        if (!rejectReason?.trim()) return;
        setData({ ...data, status: "APPROVED", pending_revision: null });
        setRejectReason(null);
      }}
      actionError={initialActionError}
      conflict={initialActionError === "already_decided" ? { decidedBy: "رنا الشامي (بالتفويض)", decidedAt: "2026-11-21T08:00:00Z" } : undefined}
      targetLabel={describeTarget}
      today={plansToday}
      onOpenReport={() => {}}
    />
  );
}
