"use client";

import { Plus, Trash } from "@phosphor-icons/react";
import type { ReactNode } from "react";
import { departmentLabels } from "@/components/data/departments";
import { DescriptionList } from "@/components/data/DescriptionList";
import { ratingScaleLabels, ratingScaleOrder } from "@/components/data/rating-scale";
import { likelihoodLabels, likelihoodOrder, reportKindLabels, targetMetricLabels } from "@/components/data/report-kinds";
import { StatusBadge } from "@/components/data/StatusBadge";
import { Grid } from "@/components/layout/Grid";
import { PageHeader } from "@/components/layout/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { Banner } from "@/components/ui/Banner";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Checkbox } from "@/components/ui/Checkbox";
import { Combobox } from "@/components/ui/Combobox";
import { DatePicker } from "@/components/ui/DatePicker";
import { ErrorState } from "@/components/ui/ErrorState";
import { Field } from "@/components/ui/Field";
import { IconButton } from "@/components/ui/IconButton";
import { Input } from "@/components/ui/Input";
import { NotFoundState } from "@/components/ui/NotFoundState";
import { NumberInput } from "@/components/ui/NumberInput";
import type { Option } from "@/components/ui/OptionList";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { Select } from "@/components/ui/Select";
import { Skeleton } from "@/components/ui/Skeleton";
import { Textarea } from "@/components/ui/Textarea";
import { AutoBadge, periodLabel, ReportSections } from "@/features/periodic-reports/components/ReportSections";
import { errorMessage } from "@/lib/api/error-messages";
import type { Department, PeriodicReport, PeriodicReportUpdate, PlanTarget, RatingScale, ReportLikelihood } from "@/lib/api/types";
import type { IsoDate } from "@/lib/calendar";
import { formatDateShort, formatDateTime, formatPercent, formatQuantity, isolate } from "@/lib/format";
import type { Loadable } from "@/lib/loadable";

type ProblemStatus = "OPEN" | "CLOSED";

/**
 * حالة نموذج الأقسام اليدوية. السطور المرتبطة بأقسام تلقائية (`failureReasons` و`overdue` و`team` و`targets`) بترتيب سطور التقرير نفسها.
 * `toUpdate` يحوّلها إلى `PeriodicReportUpdate` كما يرسله `PATCH`.
 */
export type ReportForm = {
  summary: string;
  achievements: string;
  failureReasons: readonly string[];
  overdue: readonly { reason: string; action: string; newDue: IsoDate | null }[];
  problems: readonly { id: number | null; text: string; status: ProblemStatus }[];
  risks: readonly { text: string; probability: ReportLikelihood | null; impact: ReportLikelihood | null }[];
  needsFromManagement: string;
  needsFromDepartments: readonly { toDepartment: Department | null; description: string; dueDate: IsoDate | null }[];
  cooperation: string;
  team: readonly { quality: RatingScale | null; productivity: RatingScale | null; overall: RatingScale | null }[];
  headOverall: RatingScale | null;
  headScore: number | null;
  plan: readonly { title: string; responsibleId: string | null; dueDate: IsoDate | null }[];
  targets: readonly (number | null)[];
  declaration: boolean;
};

/** النموذج من التقرير كما وصل (`GET /periodic-reports/{id}`). */
export function formFromReport(report: PeriodicReport): ReportForm {
  return {
    summary: report.executive_summary?.summary ?? "",
    achievements: report.executive_summary?.achievements ?? "",
    failureReasons: (report.executive_summary?.failures ?? []).map((line) => line.reason ?? ""),
    overdue: (report.overdue_work ?? []).map((line) => ({ reason: line.reason ?? "", action: line.action ?? "", newDue: line.new_due ?? null })),
    problems: (report.problems ?? []).map((line) => ({ id: line.id ?? null, text: line.text ?? "", status: line.status ?? "OPEN" })),
    risks: (report.risks ?? []).map((line) => ({ text: line.text ?? "", probability: line.probability ?? null, impact: line.impact ?? null })),
    needsFromManagement: report.needs_from_management ?? "",
    needsFromDepartments: (report.needs_from_departments ?? []).map((line) => ({ toDepartment: line.to_department ?? null, description: line.description ?? "", dueDate: line.due_date ?? null })),
    cooperation: report.cooperation ?? "",
    team: (report.team_evaluation ?? []).map((line) => ({ quality: line.quality ?? null, productivity: line.productivity ?? null, overall: line.overall ?? null })),
    headOverall: report.head_evaluation?.overall ?? null,
    headScore: report.head_evaluation?.score_100 ?? null,
    plan: (report.next_period_plan ?? []).map((line) => ({ title: line.title ?? "", responsibleId: line.responsible_id ? String(line.responsible_id) : null, dueDate: line.due_date ?? null })),
    targets: (report.next_period_targets ?? []).map((line) => line.target ?? null),
    declaration: report.declaration_confirmed ?? false,
  };
}

const orUndefined = <T,>(value: T | null) => value ?? undefined;

/** جسم `PATCH /periodic-reports/{id}`: الحقول اليدوية فقط. */
export function toUpdate(report: PeriodicReport, form: ReportForm): PeriodicReportUpdate {
  return {
    executive_summary: { summary: form.summary, achievements: form.achievements, failure_reasons: form.failureReasons.map((reason, index) => ({ index, reason })) },
    overdue_work: (report.overdue_work ?? []).map((line, index) => ({ kind: line.kind, ref_id: line.ref_id, reason: form.overdue[index]?.reason, action: form.overdue[index]?.action, new_due: orUndefined(form.overdue[index]?.newDue ?? null) })),
    problems: form.problems.map((line) => ({ id: line.id, text: line.text, status: line.status })),
    risks: form.risks.map((line) => ({ text: line.text, probability: orUndefined(line.probability), impact: orUndefined(line.impact) })),
    needs_from_management: form.needsFromManagement,
    needs_from_departments: form.needsFromDepartments.map((line) => ({ to_department: orUndefined(line.toDepartment), description: line.description, due_date: orUndefined(line.dueDate) })),
    cooperation: form.cooperation,
    team_evaluation: (report.team_evaluation ?? []).map((line, index) => ({ user_id: line.user?.id, quality: orUndefined(form.team[index]?.quality ?? null), productivity: orUndefined(form.team[index]?.productivity ?? null), overall: orUndefined(form.team[index]?.overall ?? null) })),
    head_evaluation: { overall: orUndefined(form.headOverall), score_100: orUndefined(form.headScore) },
    next_period_plan: form.plan.map((line) => ({ title: line.title, responsible_id: line.responsibleId ? Number(line.responsibleId) : undefined, due_date: orUndefined(line.dueDate) })),
    next_period_targets: (report.next_period_targets ?? []).map((line, index) => ({ ...line, target: form.targets[index] ?? undefined })),
  };
}

type PeriodicReportFormViewProps = {
  report: Loadable<PeriodicReport>;
  /** كاتب التقرير (رئيس القسم): يحرّر في DRAFT وRETURNED. غيره يقرأ. */
  canEdit: boolean;
  form: ReportForm;
  onFormChange: (form: ReportForm) => void;
  /** أعضاء القسم لبند الخطة (المسؤول من القسم نفسه). */
  members: readonly Option[];
  targetLabel: (target: PlanTarget) => string;
  memberName: (id: number) => string;
  /** الآن (UTC) واليوم: المهلة الفائتة وحدود التواريخ. */
  now: string;
  today: IsoDate;
  onSave?: () => void;
  onSubmit?: () => void;
  saving?: boolean;
  submitting?: boolean;
  /** أخطاء `validation_failed` بمسار الحقل (`risks.0.text`، `declaration_confirmed`). */
  errors?: Readonly<Record<string, string>>;
  /** رمز خطأ بلا حقل (`invalid_status`، `declaration_required`، `plan_responsible_outside_department`). */
  actionError?: string;
  onOpenVersions?: () => void;
  onBack?: () => void;
  onRetry?: () => void;
};

const ratingOptions: Option<RatingScale>[] = ratingScaleOrder.map((value) => ({ value, label: ratingScaleLabels[value] }));
const likelihoodOptions: Option<ReportLikelihood>[] = likelihoodOrder.map((value) => ({ value, label: likelihoodLabels[value] }));
const teamRatings = [["quality", "الجودة"], ["productivity", "الإنتاجية"], ["overall", "التقييم العام"]] as const;
const num = (value: number | null | undefined) => (value === null || value === undefined ? "—" : formatQuantity(Math.round(value)));
const pct = (value: number | null | undefined) => (value === null || value === undefined ? "—" : formatPercent(value));

/**
 * التقرير الدوري: المسودة والتحرير (G12). الأقسام التلقائية (الأرقام، والأعمال المتأخرة، والمشاكل المنقولة) حيّة في المسودة،
 * ويكتب رئيس القسم الأقسام اليدوية ثم يقرّ ويرسل. بعد الإرسال تُثبّت الأرقام في نسخة ويُعرض التقرير للقراءة.
 * المعاد للتعديل يُحرَّر من جديد بملاحظات المدير التنفيذي. كل سطر في «الاحتياجات من الأقسام الأخرى» يصير طلباً عند الإرسال (القرار 11).
 */
export function PeriodicReportFormView({
  report,
  canEdit,
  form,
  onFormChange,
  members,
  targetLabel,
  memberName,
  now,
  today,
  onSave,
  onSubmit,
  saving = false,
  submitting = false,
  errors = {},
  actionError,
  onOpenVersions,
  onBack,
  onRetry,
}: PeriodicReportFormViewProps) {
  if (report.status === "loading") {
    return (
      <div className="flex flex-col gap-4" aria-busy="true">
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }
  if (report.status === "error") return report.code === "not_found" ? <NotFoundState onBack={onBack} /> : <ErrorState code={report.code} onRetry={onRetry} />;

  const data = report.data;
  const status = data.status ?? "DRAFT";
  const editing = canEdit && (status === "DRAFT" || status === "RETURNED");
  const busy = saving || submitting;
  const overdue = editing && data.deadline_at ? data.deadline_at < now : false;
  const kind = data.kind ? reportKindLabels[data.kind] : "";
  const department = data.department ? departmentLabels[data.department] : "—";
  const set = (patch: Partial<ReportForm>) => onFormChange({ ...form, ...patch });
  const at = <T,>(list: readonly T[], index: number, patch: Partial<T>) => list.map((item, i) => (i === index ? { ...item, ...patch } : item));
  const failures = data.executive_summary?.failures ?? [];
  const overdueWork = data.overdue_work ?? [];
  const team = data.team_evaluation;
  const targets = data.next_period_targets ?? [];
  const departmentOptions: Option<Department>[] = (Object.keys(departmentLabels) as Department[]).filter((value) => value !== data.department).map((value) => ({ value, label: departmentLabels[value] }));

  return (
    <>
      <PageHeader
        title={`تقرير ${kind} · ${department}`}
        badge={
          <span className="flex flex-wrap items-center gap-1">
            <StatusBadge entity="report" status={status} />
            {data.is_mandatory === false ? <Badge>اختياري</Badge> : null}
            {overdue ? <Badge color="danger">تجاوز المهلة</Badge> : null}
          </span>
        }
        description={`الفترة ${periodLabel(data.period_start, data.period_end)} · ${data.author?.name ?? ""}`}
        actions={data.current_version && onOpenVersions ? [{ id: "versions", label: "النسخ المرسلة", onSelect: onOpenVersions }] : undefined}
      />

      <div className="flex flex-col gap-4">
        {actionError ? (
          <Banner kind={actionError === "invalid_status" ? "warning" : "danger"} title={actionError === "invalid_status" ? "تغيّرت حالة التقرير" : "تعذّر الحفظ أو الإرسال"}>
            {errorMessage(actionError)}
          </Banner>
        ) : null}

        {status === "RETURNED" && data.executive_decision ? (
          <Banner kind="warning" title={`أعاده ${data.executive_decision.decided_by?.name ?? "المدير التنفيذي"} للتعديل${data.executive_decision.decided_at ? ` · ${formatDateTime(data.executive_decision.decided_at)}` : ""}`}>
            <span className="flex flex-col gap-1">
              {data.executive_decision.notes ? <span>{data.executive_decision.notes}</span> : null}
              {data.executive_decision.required_action ? <span>{`المطلوب: ${data.executive_decision.required_action}`}</span> : null}
            </span>
          </Banner>
        ) : null}

        {overdue ? (
          <Banner kind="danger" title="تجاوز التقرير مهلته">
            {`كانت المهلة ${data.deadline_at ? formatDateTime(data.deadline_at) : "—"}. أرسله الآن؛ يُسجَّل «متأخراً» في أول إرسال.`}
          </Banner>
        ) : null}

        {status === "SUBMITTED" ? (
          <Banner kind="info" title="أُرسل وينتظر مراجعة المراقبة">
            {`الأرقام مثبّتة في النسخة ${isolate(data.current_version ?? 1)}${data.first_submitted_at ? ` المرسلة ${formatDateTime(data.first_submitted_at)}` : ""}${data.on_time === false ? "، وسُجّل متأخراً" : ""}.`}
          </Banner>
        ) : null}

        <Card title="التقرير">
          <DescriptionList
            items={[
              { label: "النوع", value: kind },
              { label: "القسم", value: department },
              { label: "المهلة", value: data.deadline_at ? <span className={overdue ? "text-danger" : undefined}>{formatDateTime(data.deadline_at)}</span> : null },
              { label: "بوقته", value: data.on_time === true ? "نعم" : data.on_time === false ? <span className="text-danger">لا</span> : "يُحدَّد بأول إرسال" },
            ]}
          />
        </Card>

        {!editing ? (
          <ReportSections report={data} targetLabel={targetLabel} memberName={memberName} />
        ) : (
          <>
            <Card title="الملخص التنفيذي">
              <div className="flex flex-col gap-4">
                <Field label="الملخص" required error={errors["executive_summary.summary"]}>
                  <Textarea value={form.summary} onChange={(event) => set({ summary: event.target.value })} disabled={busy} />
                </Field>
                <Field label="الإنجازات" optional error={errors["executive_summary.achievements"]}>
                  <Textarea value={form.achievements} onChange={(event) => set({ achievements: event.target.value })} disabled={busy} />
                </Field>
                {failures.length > 0 ? (
                  <Block title="ما لم يتحقق من الخطة" badge={<AutoBadge />} hint="المخطط والفعلي والنسبة من النظام. اكتب سبب كل هدف.">
                    {failures.map((line, index) => (
                      <Row key={index}>
                        <RowHead title={line.target ? targetLabel(line.target) : "—"} meta={`${line.target?.metric ? targetMetricLabels[line.target.metric] : ""} · المخطط ${num(line.target?.target)} · الفعلي ${num(line.target?.actual)} · ${pct(line.target?.achievement_pct)}`} />
                        <Field label="السبب" required error={errors[`executive_summary.failure_reasons.${index}.reason`]}>
                          <Input value={form.failureReasons[index] ?? ""} onChange={(event) => set({ failureReasons: form.failureReasons.map((reason, i) => (i === index ? event.target.value : reason)) })} disabled={busy} />
                        </Field>
                      </Row>
                    ))}
                  </Block>
                ) : null}
              </div>
            </Card>

            <Card title="الأعمال المتأخرة" action={<AutoBadge />}>
              {overdueWork.length > 0 ? (
                <div className="flex flex-col gap-3">
                  <p className="text-label text-fg-muted">من المهام والطلبات المتأخرة. اكتب لكل عمل سببه وإجراءه وموعده الجديد.</p>
                  {overdueWork.map((line, index) => (
                    <Row key={`${line.kind}-${line.ref_id}`}>
                      <RowHead title={line.title ?? "—"} meta={`${line.kind === "DEPARTMENT_REQUEST" ? "طلب" : "مهمة"} ${isolate(`#${line.ref_id}`)} · ${line.responsible?.name ?? "—"} · الموعد ${line.original_due ? formatDateShort(line.original_due) : "—"} · متأخر ${isolate(line.delay_days ?? 0)} يوم`} />
                      <Grid cols={{ base: 1, tablet: 3 }} gap={4}>
                        <Field label="السبب" required error={errors[`overdue_work.${index}.reason`]}>
                          <Input value={form.overdue[index]?.reason ?? ""} onChange={(event) => set({ overdue: at(form.overdue, index, { reason: event.target.value }) })} disabled={busy} />
                        </Field>
                        <Field label="الإجراء" required error={errors[`overdue_work.${index}.action`]}>
                          <Input value={form.overdue[index]?.action ?? ""} onChange={(event) => set({ overdue: at(form.overdue, index, { action: event.target.value }) })} disabled={busy} />
                        </Field>
                        <Field label="الموعد الجديد" required error={errors[`overdue_work.${index}.new_due`]}>
                          <DatePicker aria-label="الموعد الجديد" value={form.overdue[index]?.newDue ?? null} onValueChange={(newDue) => set({ overdue: at(form.overdue, index, { newDue }) })} min={today} today={today} invalid={Boolean(errors[`overdue_work.${index}.new_due`])} disabled={busy} />
                        </Field>
                      </Grid>
                    </Row>
                  ))}
                </div>
              ) : (
                <p className="text-body text-fg-muted">لا أعمال متأخرة في الفترة.</p>
              )}
            </Card>

            <Card title="المشاكل والعوائق">
              <div className="flex flex-col gap-3">
                <p className="text-label text-fg-muted">المفتوحة تنتقل تلقائياً إلى التقرير التالي حتى تُغلق.</p>
                {form.problems.map((line, index) => {
                  const origin = line.id !== null ? data.problems?.find((problem) => problem.id === line.id)?.origin_report_id : null;
                  return (
                    <Row key={line.id ?? `new-${index}`}>
                      <div className="flex items-center justify-between gap-2">
                        <span className="flex flex-wrap items-center gap-2 text-label text-fg-muted">
                          {`مشكلة ${isolate(index + 1)}`}
                          {origin ? <Badge color="info">{`منقولة من التقرير ${isolate(`#${origin}`)}`}</Badge> : null}
                        </span>
                        {line.id === null ? <IconButton icon={Trash} aria-label={`حذف المشكلة ${index + 1}`} variant="ghost" size="sm" disabled={busy} onClick={() => set({ problems: form.problems.filter((_, i) => i !== index) })} /> : null}
                      </div>
                      <Field label="المشكلة" required error={errors[`problems.${index}.text`]}>
                        <Input value={line.text} onChange={(event) => set({ problems: at(form.problems, index, { text: event.target.value }) })} disabled={busy} />
                      </Field>
                      <SegmentedControl
                        aria-label={`حالة المشكلة ${index + 1}`}
                        options={[
                          { value: "OPEN", label: "مفتوحة" },
                          { value: "CLOSED", label: "مغلقة" },
                        ]}
                        value={line.status}
                        onValueChange={(next) => set({ problems: at(form.problems, index, { status: next }) })}
                        disabled={busy}
                      />
                    </Row>
                  );
                })}
                <AddButton label="إضافة مشكلة" disabled={busy} onClick={() => set({ problems: [...form.problems, { id: null, text: "", status: "OPEN" }] })} />
              </div>
            </Card>

            <Card title="المخاطر">
              <div className="flex flex-col gap-3">
                <p className="text-label text-fg-muted">مستوى الخطر يُحسب من الاحتمال والأثر.</p>
                {form.risks.map((line, index) => (
                  <Row key={index}>
                    <div className="flex items-start gap-2">
                      <Field label={`الخطر ${index + 1}`} required error={errors[`risks.${index}.text`]} className="min-w-0 flex-1">
                        <Input value={line.text} onChange={(event) => set({ risks: at(form.risks, index, { text: event.target.value }) })} disabled={busy} />
                      </Field>
                      <IconButton icon={Trash} aria-label={`حذف الخطر ${index + 1}`} variant="ghost" className="mt-7" disabled={busy} onClick={() => set({ risks: form.risks.filter((_, i) => i !== index) })} />
                    </div>
                    <Grid cols={{ base: 2 }} gap={4}>
                      <Field label="الاحتمال" required error={errors[`risks.${index}.probability`]}>
                        <Select aria-label="الاحتمال" options={likelihoodOptions} value={line.probability} onValueChange={(probability) => set({ risks: at(form.risks, index, { probability }) })} invalid={Boolean(errors[`risks.${index}.probability`])} disabled={busy} />
                      </Field>
                      <Field label="الأثر" required error={errors[`risks.${index}.impact`]}>
                        <Select aria-label="الأثر" options={likelihoodOptions} value={line.impact} onValueChange={(impact) => set({ risks: at(form.risks, index, { impact }) })} invalid={Boolean(errors[`risks.${index}.impact`])} disabled={busy} />
                      </Field>
                    </Grid>
                  </Row>
                ))}
                <AddButton label="إضافة خطر" disabled={busy} onClick={() => set({ risks: [...form.risks, { text: "", probability: null, impact: null }] })} />
              </div>
            </Card>

            <Card title="الاحتياجات">
              <div className="flex flex-col gap-4">
                <Field label="من الإدارة" optional error={errors.needs_from_management}>
                  <Textarea value={form.needsFromManagement} onChange={(event) => set({ needsFromManagement: event.target.value })} disabled={busy} />
                </Field>
                <Block title="من الأقسام الأخرى" hint="كل سطر يصير طلباً إلى القسم عند الإرسال.">
                  {form.needsFromDepartments.map((line, index) => (
                    <Row key={index}>
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-label text-fg-muted">{`طلب ${isolate(index + 1)}`}</span>
                        <IconButton icon={Trash} aria-label={`حذف الطلب ${index + 1}`} variant="ghost" size="sm" disabled={busy} onClick={() => set({ needsFromDepartments: form.needsFromDepartments.filter((_, i) => i !== index) })} />
                      </div>
                      <Grid cols={{ base: 1, tablet: 2 }} gap={4}>
                        <Field label="القسم" required error={errors[`needs_from_departments.${index}.to_department`]}>
                          <Select aria-label="القسم" options={departmentOptions} value={line.toDepartment} onValueChange={(toDepartment) => set({ needsFromDepartments: at(form.needsFromDepartments, index, { toDepartment }) })} disabled={busy} />
                        </Field>
                        <Field label="الموعد" optional error={errors[`needs_from_departments.${index}.due_date`]}>
                          <DatePicker aria-label="الموعد" value={line.dueDate} onValueChange={(dueDate) => set({ needsFromDepartments: at(form.needsFromDepartments, index, { dueDate }) })} min={today} today={today} disabled={busy} />
                        </Field>
                      </Grid>
                      <Field label="الوصف" required error={errors[`needs_from_departments.${index}.description`]}>
                        <Input value={line.description} onChange={(event) => set({ needsFromDepartments: at(form.needsFromDepartments, index, { description: event.target.value }) })} disabled={busy} />
                      </Field>
                    </Row>
                  ))}
                  <AddButton label="إضافة طلب" disabled={busy} onClick={() => set({ needsFromDepartments: [...form.needsFromDepartments, { toDepartment: null, description: "", dueDate: null }] })} />
                </Block>
                <Field label="التعاون مع الأقسام" optional error={errors.cooperation}>
                  <Textarea value={form.cooperation} onChange={(event) => set({ cooperation: event.target.value })} disabled={busy} />
                </Field>
              </div>
            </Card>

            {team ? (
              <Card title="تقييم الفريق">
                <div className="flex flex-col gap-3">
                  <p className="text-label text-fg-muted">نسبة المهام والالتزام من النظام. قيّم الجودة والإنتاجية والتقييم العام.</p>
                  {team.map((member, index) => (
                    <Row key={member.user?.id ?? index}>
                      <RowHead title={member.user?.name ?? "—"} meta={`المهام ${pct(member.tasks_auto)} · الالتزام ${pct(member.commitment_auto)}`} />
                      <Grid cols={{ base: 1, tablet: 3 }} gap={4}>
                        {teamRatings.map(([key, label]) => (
                          <Field key={key} label={label} required error={errors[`team_evaluation.${index}.${key}`]}>
                            <Select aria-label={`${label} · ${member.user?.name ?? ""}`} options={ratingOptions} value={form.team[index]?.[key] ?? null} onValueChange={(value) => set({ team: at(form.team, index, { [key]: value }) })} invalid={Boolean(errors[`team_evaluation.${index}.${key}`])} disabled={busy} />
                          </Field>
                        ))}
                      </Grid>
                    </Row>
                  ))}
                </div>
              </Card>
            ) : null}

            <Card title="تقييم رئيس القسم">
              <div className="flex flex-col gap-4">
                <DescriptionList
                  items={[
                    { label: "تحقيق الخطة", value: pct(data.head_evaluation?.plan_achievement_pct) },
                    { label: "درجة النظام", value: num(data.head_evaluation?.system_score) },
                  ]}
                />
                <Grid cols={{ base: 1, tablet: 2 }} gap={4}>
                  <Field label="التقييم العام" required error={errors["head_evaluation.overall"]}>
                    <Select aria-label="التقييم العام" options={ratingOptions} value={form.headOverall} onValueChange={(headOverall) => set({ headOverall })} disabled={busy} />
                  </Field>
                  <Field label="الدرجة من 100" required error={errors["head_evaluation.score_100"]}>
                    <NumberInput aria-label="الدرجة من 100" value={form.headScore} onValueChange={(headScore) => set({ headScore })} min={0} max={100} invalid={Boolean(errors["head_evaluation.score_100"])} disabled={busy} />
                  </Field>
                </Grid>
              </div>
            </Card>

            <Card title="خطة الفترة القادمة">
              <div className="flex flex-col gap-3">
                <p className="text-label text-fg-muted">تصير البنود مهاماً عند الاعتماد. المسؤول من قسمك، والعمل من قسم آخر يُكتب في «الاحتياجات من الأقسام الأخرى».</p>
                {form.plan.map((line, index) => (
                  <Row key={index}>
                    <div className="flex items-start gap-2">
                      <Field label={`البند ${index + 1}`} required error={errors[`next_period_plan.${index}.title`]} className="min-w-0 flex-1">
                        <Input value={line.title} onChange={(event) => set({ plan: at(form.plan, index, { title: event.target.value }) })} disabled={busy} />
                      </Field>
                      <IconButton icon={Trash} aria-label={`حذف البند ${index + 1}`} variant="ghost" className="mt-7" disabled={busy} onClick={() => set({ plan: form.plan.filter((_, i) => i !== index) })} />
                    </div>
                    <Grid cols={{ base: 1, tablet: 2 }} gap={4}>
                      <Field label="المسؤول" required error={errors[`next_period_plan.${index}.responsible_id`]}>
                        <Combobox aria-label="المسؤول" placeholder="من القسم" options={members} value={line.responsibleId} onValueChange={(responsibleId) => set({ plan: at(form.plan, index, { responsibleId }) })} invalid={Boolean(errors[`next_period_plan.${index}.responsible_id`])} disabled={busy} />
                      </Field>
                      <Field label="الموعد" required error={errors[`next_period_plan.${index}.due_date`]}>
                        <DatePicker aria-label="موعد البند" value={line.dueDate} onValueChange={(dueDate) => set({ plan: at(form.plan, index, { dueDate }) })} min={today} today={today} disabled={busy} />
                      </Field>
                    </Grid>
                  </Row>
                ))}
                <AddButton label="إضافة بند" disabled={busy} onClick={() => set({ plan: [...form.plan, { title: "", responsibleId: null, dueDate: null }] })} />
              </div>
            </Card>

            {targets.length > 0 ? (
              <Card title="أهداف الفترة القادمة">
                <div className="flex flex-col gap-3">
                  <p className="text-label text-fg-muted">تصير خطة الشهر التالي عند الاعتماد، والفعلي يُحسب آلياً.</p>
                  {targets.map((target, index) => (
                    <div key={index} className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-3 last:border-b-0 last:pb-0">
                      <span className="flex min-w-0 flex-1 flex-col">
                        <span className="text-body text-fg">{targetLabel(target)}</span>
                        <span className="text-label text-fg-muted">{target.metric ? targetMetricLabels[target.metric] : "—"}</span>
                      </span>
                      <NumberInput aria-label={`هدف ${targetLabel(target)}`} value={form.targets[index] ?? null} onValueChange={(value) => set({ targets: form.targets.map((item, i) => (i === index ? value : item)) })} min={0} invalid={Boolean(errors[`next_period_targets.${index}.target`])} disabled={busy} className="w-40" />
                    </div>
                  ))}
                </div>
              </Card>
            ) : null}

            <Card title="الإقرار">
              <div className="flex flex-col gap-4">
                <Checkbox
                  label="أقرّ بأن ما في التقرير صحيح وكامل بحسب علمي."
                  description="بعد الإرسال تُثبّت الأرقام في نسخة، وتُرسل الاحتياجات طلباتٍ إلى الأقسام."
                  checked={form.declaration}
                  onCheckedChange={(declaration) => set({ declaration })}
                  invalid={Boolean(errors.declaration_confirmed)}
                  disabled={busy}
                />
                {errors.declaration_confirmed ? <p className="text-label text-danger">{errors.declaration_confirmed}</p> : null}
                <div className="flex flex-wrap gap-2">
                  <Button variant="primary" loading={submitting} disabled={saving} onClick={onSubmit}>
                    إرسال التقرير
                  </Button>
                  <Button variant="secondary" loading={saving} disabled={submitting} onClick={onSave}>
                    حفظ المسودة
                  </Button>
                </div>
              </div>
            </Card>
          </>
        )}
      </div>
    </>
  );
}

function Block({ title, badge, hint, children }: { title: string; badge?: ReactNode; hint?: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-3">
      <span className="flex items-center gap-2 text-label text-fg">
        {title}
        {badge}
      </span>
      {hint ? <p className="text-label text-fg-muted">{hint}</p> : null}
      {children}
    </div>
  );
}

function Row({ children }: { children: ReactNode }) {
  return <div className="flex flex-col gap-3 rounded-lg border border-border p-4">{children}</div>;
}

function RowHead({ title, meta }: { title: string; meta: string }) {
  return (
    <span className="flex min-w-0 flex-col gap-1">
      <span className="text-body text-fg">{title}</span>
      <span className="text-label text-fg-muted">{meta}</span>
    </span>
  );
}

function AddButton({ label, disabled, onClick }: { label: string; disabled: boolean; onClick: () => void }) {
  return (
    <div>
      <Button variant="ghost" size="sm" icon={Plus} disabled={disabled} onClick={onClick}>
        {label}
      </Button>
    </div>
  );
}
