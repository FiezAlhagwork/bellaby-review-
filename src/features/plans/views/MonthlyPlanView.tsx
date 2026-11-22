"use client";

import { CalendarBlank } from "@phosphor-icons/react";
import { DataTable, type DataTableColumn } from "@/components/data/DataTable";
import { DecisionPanel } from "@/components/data/DecisionPanel";
import { departmentLabels } from "@/components/data/departments";
import { targetMetricLabels } from "@/components/data/report-kinds";
import { StatusBadge } from "@/components/data/StatusBadge";
import { Grid } from "@/components/layout/Grid";
import { PageHeader } from "@/components/layout/PageHeader";
import { Banner } from "@/components/ui/Banner";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Dialog } from "@/components/ui/Dialog";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { Field } from "@/components/ui/Field";
import { MonthPicker } from "@/components/ui/MonthPicker";
import { NumberInput } from "@/components/ui/NumberInput";
import type { Option } from "@/components/ui/OptionList";
import { ReasonDialog } from "@/components/ui/ReasonDialog";
import { Select } from "@/components/ui/Select";
import { Skeleton } from "@/components/ui/Skeleton";
import { Textarea } from "@/components/ui/Textarea";
import { errorMessage } from "@/lib/api/error-messages";
import type { Department, MonthlyPlan, PlanTarget } from "@/lib/api/types";
import { monthLabel, type IsoDate, type IsoMonth } from "@/lib/calendar";
import { formatDateTime, formatPercent, formatQuantity, isolate } from "@/lib/format";
import type { Loadable } from "@/lib/loadable";

/** نافذة «طلب تعديل»: قيمة جديدة لكل هدف بترتيب أهداف الخطة السارية، والسبب إلزامي. */
export type RevisionForm = { targets: readonly (number | null)[]; reason: string };

/** نموذج التعديل من الخطة السارية. */
export const revisionFromPlan = (plan: MonthlyPlan): RevisionForm => ({ targets: (plan.targets ?? []).map((target) => target.target ?? null), reason: "" });

/** جسم `POST /plans/{department}/{month}/revisions`: الأهداف كاملة بقيمها الجديدة. */
/** الهدف بحقوله المدخلة فقط (بلا `actual` و`achievement_pct` المحسوبين). */
export const targetInput = ({ type, metric, region_id, agent_id, item_id, visit_point_type_id, specialty_id, target }: PlanTarget): PlanTarget => ({ type, metric, region_id, agent_id, item_id, visit_point_type_id, specialty_id, target });

export const revisionTargets = (plan: MonthlyPlan, form: RevisionForm): PlanTarget[] => (plan.targets ?? []).map((target, index) => ({ ...targetInput(target), target: form.targets[index] ?? target.target }));

type MonthlyPlanViewProps = {
  /** `GET /plans/{department}/{month}`. `not_found` = لا خطة معتمدة لهذا الشهر. */
  plan: Loadable<MonthlyPlan>;
  month: IsoMonth;
  onMonthChange: (month: IsoMonth) => void;
  department: Department;
  /** المدير التنفيذي يختار القسم، ورئيس القسم يرى قسمه. */
  canPickDepartment: boolean;
  departments: readonly Department[];
  onDepartmentChange: (department: Department) => void;
  /** رئيس القسم صاحب الخطة. */
  canRequestRevision: boolean;
  /** `plans.approve`. */
  canApprove: boolean;
  revision: RevisionForm | null;
  onRevisionChange: (revision: RevisionForm | null) => void;
  onSubmitRevision?: () => void;
  submittingRevision?: boolean;
  revisionErrors?: Readonly<Record<string, string>>;
  /** نافذة رفض التعديل: السبب، أو null مغلقة. */
  rejectReason: string | null;
  onRejectReasonChange: (reason: string | null) => void;
  onApproveRevision?: () => void;
  onRejectRevision?: () => void;
  deciding?: boolean;
  /** رمز 409/422 بلا حقل: تعديل معلّق، `already_decided`، `invalid_status`. */
  actionError?: string;
  /** من قرّر أولاً ومتى (already_decided). */
  conflict?: { decidedBy: string; decidedAt: string };
  targetLabel: (target: PlanTarget) => string;
  today: IsoDate;
  onOpenReport?: (id: number) => void;
  onRetry?: () => void;
};

const num = (value: number | null | undefined) => (value === null || value === undefined ? "—" : formatQuantity(Math.round(value)));

/**
 * الخطة الشهرية (G16): أهداف القسم للشهر (من أهداف التقرير الشهري المعتمد للشهر السابق) بالمخطط والفعلي والنسبة.
 * «طلب تعديل» في منتصف الشهر نسخة جديدة بسبب إلزامي، والسارية لا تتغيّر حتى يعتمدها المدير التنفيذي.
 */
export function MonthlyPlanView({
  plan,
  month,
  onMonthChange,
  department,
  canPickDepartment,
  departments,
  onDepartmentChange,
  canRequestRevision,
  canApprove,
  revision,
  onRevisionChange,
  onSubmitRevision,
  submittingRevision = false,
  revisionErrors = {},
  rejectReason,
  onRejectReasonChange,
  onApproveRevision,
  onRejectRevision,
  deciding = false,
  actionError,
  conflict,
  targetLabel,
  today,
  onOpenReport,
  onRetry,
}: MonthlyPlanViewProps) {
  const ready = plan.status === "ready" ? plan.data : null;
  const pending = ready?.pending_revision ?? null;
  const targets = ready?.targets ?? [];
  const departmentOptions: Option<Department>[] = departments.map((value) => ({ value, label: departmentLabels[value] }));

  const targetCell = (target: PlanTarget) => (
    <span className="flex min-w-0 flex-col">
      <span className="truncate text-body text-fg">{targetLabel(target)}</span>
      <span className="text-label text-fg-muted">{target.metric ? targetMetricLabels[target.metric] : "—"}</span>
    </span>
  );

  const columns: DataTableColumn<PlanTarget>[] = [
    { key: "target", header: "الهدف", cell: targetCell, priority: "high", role: "primary" },
    { key: "planned", header: "المخطط", cell: (row) => num(row.target), align: "end", width: "w-28", priority: "high" },
    { key: "actual", header: "الفعلي", cell: (row) => num(row.actual), align: "end", width: "w-28", priority: "high" },
    { key: "pct", header: "النسبة", cell: (row) => (row.achievement_pct === null || row.achievement_pct === undefined ? "—" : formatPercent(row.achievement_pct)), align: "end", width: "w-24", priority: "high" },
  ];

  type Compare = { index: number; target: PlanTarget };
  const compareColumns: DataTableColumn<Compare>[] = [
    { key: "target", header: "الهدف", cell: (row) => targetCell(row.target), priority: "high", role: "primary" },
    { key: "current", header: "الساري", cell: (row) => num(targets[row.index]?.target), align: "end", width: "w-28", priority: "high" },
    { key: "proposed", header: "المقترح", cell: (row) => <span className={row.target.target !== targets[row.index]?.target ? "font-semibold text-fg" : "text-fg"}>{num(row.target.target)}</span>, align: "end", width: "w-28", priority: "high" },
  ];

  return (
    <>
      <PageHeader
        title={`الخطة الشهرية · ${departmentLabels[department]}`}
        badge={ready?.status ? <StatusBadge entity="monthlyPlan" status={ready.status} /> : undefined}
        description={ready ? `${monthLabel(month)} · النسخة ${ready.version ?? 1}` : monthLabel(month)}
        actions={canRequestRevision && ready ? [{ id: "revise", label: "طلب تعديل", primary: true, disabled: pending !== null, reason: "يوجد تعديل بانتظار القرار.", onSelect: () => onRevisionChange(revisionFromPlan(ready)) }] : undefined}
      />

      <div className="flex flex-col gap-4">
        <Grid cols={{ base: 1, tablet: 3 }} gap={4}>
          <Field label="الشهر">
            <MonthPicker aria-label="الشهر" value={month} onValueChange={onMonthChange} today={today} />
          </Field>
          {canPickDepartment ? (
            <Field label="القسم">
              <Select aria-label="القسم" options={departmentOptions} value={department} onValueChange={onDepartmentChange} />
            </Field>
          ) : null}
        </Grid>

        {actionError ? (
          <Banner kind="warning" title={actionError === "already_decided" ? "قرّر غيرك أولاً" : "تعذّر تنفيذ الإجراء"}>
            {conflict ? `${errorMessage(actionError)} قرّر ${conflict.decidedBy} ${formatDateTime(conflict.decidedAt)}.` : errorMessage(actionError)}
          </Banner>
        ) : null}

        {plan.status === "loading" ? (
          <div className="flex flex-col gap-4" aria-busy="true">
            <Skeleton className="h-48 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        ) : plan.status === "error" ? (
          plan.code === "not_found" ? (
            <EmptyState icon={CalendarBlank} title={`لا خطة معتمدة لـ${monthLabel(month)}`} description="الخطة أهداف التقرير الشهري المعتمد للشهر السابق، وتظهر هنا عند اعتماده." />
          ) : (
            <ErrorState code={plan.code} onRetry={onRetry} />
          )
        ) : (
          <>
            {pending ? (
              canApprove ? (
                <DecisionPanel
                  summary={`طلب ${pending.requested_by?.name ?? "رئيس القسم"} تعديل الخطة ${pending.requested_at ? formatDateTime(pending.requested_at) : ""}. السبب: ${pending.reason ?? "—"}`}
                  approving={deciding}
                  onApprove={() => onApproveRevision?.()}
                  onReject={() => onRejectReasonChange("")}
                />
              ) : (
                <Banner kind="warning" title="تعديل بانتظار قرار المدير التنفيذي">
                  الخطة السارية لا تتغيّر حتى يُعتمد التعديل.
                </Banner>
              )
            ) : null}

            <Card
              title="الأهداف"
              action={
                ready?.source_report_id ? (
                  <Button variant="ghost" size="sm" onClick={() => onOpenReport?.(ready.source_report_id ?? 0)}>
                    {`من التقرير ${isolate(`#${ready.source_report_id}`)}`}
                  </Button>
                ) : undefined
              }
            >
              <DataTable label="أهداف الخطة" columns={columns} rows={targets} getRowKey={(row) => targets.indexOf(row)} empty={<EmptyState icon={CalendarBlank} title="لا أهداف رقمية" description="خطة هذا القسم بلا أهداف." />} />
            </Card>

            {pending ? (
              <Card title="التعديل المقترح">
                <div className="flex flex-col gap-3">
                  <p className="text-body text-fg">{pending.reason}</p>
                  <DataTable label="التعديل المقترح" columns={compareColumns} rows={(pending.targets ?? []).map((target, index) => ({ index, target }))} getRowKey={(row) => row.index} />
                </div>
              </Card>
            ) : null}

            {ready?.versions && ready.versions.length > 0 ? (
              <Card title="نسخ الخطة">
                <ul className="flex flex-col gap-3">
                  {ready.versions.map((version) => (
                    <li key={version.version} className="flex flex-col gap-1">
                      <span className="text-body text-fg">{`النسخة ${isolate(version.version ?? 1)}${version.approved_by ? ` · اعتمدها ${version.approved_by.name}` : ""}${version.approved_at ? ` · ${formatDateTime(version.approved_at)}` : ""}`}</span>
                      <span className="text-label text-fg-muted">{version.reason ?? "الخطة الأصلية من التقرير الشهري."}</span>
                    </li>
                  ))}
                </ul>
              </Card>
            ) : null}
          </>
        )}
      </div>

      <Dialog
        open={revision !== null}
        onOpenChange={(next) => (next ? undefined : onRevisionChange(null))}
        dismissible={!submittingRevision}
        size="lg"
        title="طلب تعديل الخطة"
        description="نسخة جديدة بانتظار المدير التنفيذي. الخطة السارية لا تتغيّر حتى يعتمدها."
        actions={[
          <Button key="cancel" variant="secondary" disabled={submittingRevision} onClick={() => onRevisionChange(null)}>
            تراجع
          </Button>,
          <Button key="ok" variant="primary" loading={submittingRevision} disabled={!revision?.reason.trim()} onClick={() => onSubmitRevision?.()}>
            إرسال الطلب
          </Button>,
        ]}
      >
        {revision ? (
          <div className="flex flex-col gap-4">
            {targets.map((target, index) => (
              <div key={index} className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-3">
                <span className="flex min-w-0 flex-1 flex-col">
                  <span className="text-body text-fg">{targetLabel(target)}</span>
                  <span className="text-label text-fg-muted">{`${target.metric ? targetMetricLabels[target.metric] : ""} · الساري ${num(target.target)}`}</span>
                </span>
                <NumberInput
                  aria-label={`الهدف الجديد · ${targetLabel(target)}`}
                  value={revision.targets[index] ?? null}
                  onValueChange={(value) => onRevisionChange({ ...revision, targets: revision.targets.map((item, i) => (i === index ? value : item)) })}
                  min={0}
                  invalid={Boolean(revisionErrors[`targets.${index}.target`])}
                  disabled={submittingRevision}
                  className="w-40"
                />
              </div>
            ))}
            <Field label="السبب" required error={revisionErrors.reason}>
              <Textarea aria-label="السبب" value={revision.reason} onChange={(event) => onRevisionChange({ ...revision, reason: event.target.value })} disabled={submittingRevision} />
            </Field>
          </div>
        ) : null}
      </Dialog>

      <ReasonDialog
        open={rejectReason !== null}
        onOpenChange={(next) => (next ? undefined : onRejectReasonChange(null))}
        title="رفض تعديل الخطة؟"
        description="تبقى الخطة السارية كما هي، ويصل السبب إلى رئيس القسم."
        confirmLabel="رفض التعديل"
        cancelLabel="تراجع"
        reasonLabel="السبب"
        reason={rejectReason ?? ""}
        onReasonChange={onRejectReasonChange}
        danger
        loading={deciding}
        onConfirm={() => onRejectRevision?.()}
      />
    </>
  );
}
