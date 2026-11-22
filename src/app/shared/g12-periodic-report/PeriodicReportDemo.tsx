"use client";

import { useState } from "react";
import { formFromReport, PeriodicReportFormView, type ReportForm } from "@/features/periodic-reports/views/PeriodicReportFormView";
import type { PeriodicReport } from "@/lib/api/types";
import type { Loadable } from "@/lib/loadable";
import { describeTarget, departmentMembers, reportAt, reportsNow, reportsToday, type ReportState } from "@/mocks/periodic-reports";

// غلاف تفاعلي لصفحة الرسم (G12): يملك التقرير والنموذج. الحفظ PATCH والإرسال POST /submit محلياً: الإرسال بلا إقرار يُرجع declaration_required. لا يُنقل للإنتاج.


/** أخطاء 422 كما يرسلها الخادم في حالة validation. */
const validationErrors: Record<string, string> = {
  "executive_summary.summary": "الملخص مطلوب.",
  "overdue_work.0.action": "الإجراء مطلوب لكل عمل متأخر.",
  "overdue_work.1.reason": "السبب مطلوب لكل عمل متأخر.",
  "team_evaluation.1.overall": "التقييم العام مطلوب.",
  "head_evaluation.overall": "التقييم العام مطلوب.",
  declaration_confirmed: "أكّد الإقرار قبل الإرسال.",
};

/** ما يعيده الخادم بعد PATCH: الحقول اليدوية من النموذج فوق التقرير. */
function applyForm(report: PeriodicReport, form: ReportForm): PeriodicReport {
  return {
    ...report,
    executive_summary: { ...report.executive_summary, summary: form.summary, achievements: form.achievements, failures: (report.executive_summary?.failures ?? []).map((line, index) => ({ ...line, reason: form.failureReasons[index] || null })) },
    overdue_work: (report.overdue_work ?? []).map((line, index) => ({ ...line, reason: form.overdue[index]?.reason || null, action: form.overdue[index]?.action || null, new_due: form.overdue[index]?.newDue ?? null })),
    problems: form.problems.map((line) => ({ id: line.id ?? undefined, text: line.text, status: line.status, origin_report_id: report.problems?.find((problem) => problem.id === line.id)?.origin_report_id ?? null })),
    risks: form.risks.map((line) => ({ text: line.text, probability: line.probability ?? undefined, impact: line.impact ?? undefined })),
    needs_from_management: form.needsFromManagement,
    needs_from_departments: form.needsFromDepartments.map((line) => ({ to_department: line.toDepartment ?? undefined, description: line.description, due_date: line.dueDate })),
    cooperation: form.cooperation,
    team_evaluation: report.team_evaluation ? report.team_evaluation.map((line, index) => ({ ...line, quality: form.team[index]?.quality ?? undefined, productivity: form.team[index]?.productivity ?? undefined, overall: form.team[index]?.overall ?? undefined })) : null,
    head_evaluation: { ...report.head_evaluation, overall: form.headOverall ?? undefined, score_100: form.headScore ?? undefined },
    next_period_plan: form.plan.map((line) => ({ title: line.title, responsible_id: line.responsibleId ? Number(line.responsibleId) : undefined, due_date: line.dueDate ?? undefined })),
    next_period_targets: (report.next_period_targets ?? []).map((line, index) => ({ ...line, target: form.targets[index] ?? undefined })),
  };
}

type PeriodicReportDemoProps = { state: ReportState; mode?: "ready" | "loading" | "error" | "not-found" };

export function PeriodicReportDemo({ state, mode = "ready" }: PeriodicReportDemoProps) {
  const [data, setData] = useState<PeriodicReport>(() => reportAt(state));
  const [form, setForm] = useState(() => formFromReport(data));
  const [errors, setErrors] = useState<Record<string, string>>(state === "validation" ? validationErrors : {});

  const people = (data.department ? departmentMembers[data.department] : undefined) ?? [];
  const memberName = (id: number) => people.find((user) => user.id === id)?.name ?? `#${id}`;
  const loadable: Loadable<PeriodicReport> = mode === "loading" ? { status: "loading" } : mode === "error" ? { status: "error", code: "too_many_requests" } : mode === "not-found" ? { status: "error", code: "not_found" } : { status: "ready", data };

  return (
    <PeriodicReportFormView
      report={loadable}
      canEdit
      form={form}
      onFormChange={setForm}
      members={people.map((user) => ({ value: String(user.id), label: user.name ?? "" }))}
      targetLabel={describeTarget}
      memberName={memberName}
      now={reportsNow}
      today={reportsToday}
      onSave={() => setErrors({})}
      onSubmit={() => {
        if (!form.declaration) {
          setErrors({ declaration_confirmed: "أكّد الإقرار قبل الإرسال." });
          return;
        }
        setData({ ...applyForm(data, form), status: "SUBMITTED", declaration_confirmed: true, current_version: (data.current_version ?? 0) + 1, first_submitted_at: data.first_submitted_at ?? reportsNow, on_time: data.on_time ?? (data.deadline_at ? reportsNow <= data.deadline_at : true) });
        setErrors({});
      }}
      errors={errors}
      onOpenVersions={() => {}}
      onBack={() => {}}
    />
  );
}
