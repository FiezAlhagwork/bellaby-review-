"use client";

import { useState } from "react";
import { emptyReview, ReportReviewView, type ReviewForm } from "@/features/periodic-reports/views/ReportReviewView";
import type { PeriodicReport } from "@/lib/api/types";
import type { Loadable } from "@/lib/loadable";
import { describeTarget, departmentMembers, reportAt, reportsNow } from "@/mocks/periodic-reports";

// غلاف تفاعلي لصفحة الرسم (G13): يملك التقرير ونموذج المراجعة. POST /review محلياً ← REVIEWED. لا يُنقل للإنتاج.

const filled: ReviewForm = { isComplete: "yes", needsVerification: "no", notes: "" };

type ReportReviewDemoProps = { state: "submitted" | "reviewed"; initialActionError?: string; mode?: "ready" | "loading" | "error" };

export function ReportReviewDemo({ state, initialActionError, mode = "ready" }: ReportReviewDemoProps) {
  const [data, setData] = useState<PeriodicReport>(() => reportAt(state));
  const [form, setForm] = useState<ReviewForm>(initialActionError ? filled : emptyReview);

  const people = (data.department ? departmentMembers[data.department] : undefined) ?? [];
  const memberName = (id: number) => people.find((user) => user.id === id)?.name ?? `#${id}`;
  const loadable: Loadable<PeriodicReport> = mode === "loading" ? { status: "loading" } : mode === "error" ? { status: "error", code: "too_many_requests" } : { status: "ready", data };

  return (
    <ReportReviewView
      report={loadable}
      canReview
      form={form}
      onFormChange={setForm}
      onSubmit={() => {
        if (initialActionError || !form.isComplete || !form.needsVerification) return;
        setData({ ...data, status: "REVIEWED", monitoring_review: { received_at: data.first_submitted_at ?? reportsNow, is_complete: form.isComplete === "yes", needs_verification: form.needsVerification === "yes", notes: form.notes, reviewed_by: { id: 50, name: "جمال الحكيم" } } });
      }}
      actionError={initialActionError}
      targetLabel={describeTarget}
      memberName={memberName}
      onBack={() => {}}
    />
  );
}
