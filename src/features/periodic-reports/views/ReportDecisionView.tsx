"use client";

import { DecisionPanel, DecisionRecord } from "@/components/data/DecisionPanel";
import { departmentLabels } from "@/components/data/departments";
import { execDecisionLabels, execDecisionOrder, reportKindLabels } from "@/components/data/report-kinds";
import { StatusBadge } from "@/components/data/StatusBadge";
import { PageHeader } from "@/components/layout/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { Banner } from "@/components/ui/Banner";
import { ErrorState } from "@/components/ui/ErrorState";
import { Field } from "@/components/ui/Field";
import { NotFoundState } from "@/components/ui/NotFoundState";
import { RadioCard, RadioGroup } from "@/components/ui/Radio";
import { Skeleton } from "@/components/ui/Skeleton";
import { Textarea } from "@/components/ui/Textarea";
import { MonitoringReviewCard, periodLabel, ReportSections } from "@/features/periodic-reports/components/ReportSections";
import { errorMessage } from "@/lib/api/error-messages";
import type { ExecReportDecision, PeriodicReport, PlanTarget } from "@/lib/api/types";
import { formatDateTime } from "@/lib/format";
import type { Loadable } from "@/lib/loadable";

/** نموذج القرار كما يرسله `POST /periodic-reports/{id}/decision`. */
export type ReportDecisionForm = { decision: ExecReportDecision | null; notes: string; requiredAction: string };
export const emptyReportDecision: ReportDecisionForm = { decision: null, notes: "", requiredAction: "" };

/** القرارات التي تحتاج «الإجراء المطلوب» (§105). */
const actionRequired: readonly ExecReportDecision[] = ["APPROVE_WITH_FOLLOW_UP", "RETURN_FOR_EDIT", "REQUEST_INFO"];
const returning: readonly ExecReportDecision[] = ["RETURN_FOR_EDIT", "REQUEST_INFO"];

/** عنوان حقل `required_action` بحسب القرار. */
const actionLabel = (decision: ExecReportDecision) => (decision === "APPROVE_WITH_ADMIN_DECISION" ? "القرار الإداري" : decision === "REQUEST_INFO" ? "المعلومات المطلوبة" : "الإجراء المطلوب");

/** القرار إن كان صحيحاً للإرسال: الإجراء المطلوب مكتوب حيث يلزم. */
export const decisionReady = (form: ReportDecisionForm) => form.decision !== null && (!actionRequired.includes(form.decision) || form.requiredAction.trim() !== "");

type ReportDecisionViewProps = {
  report: Loadable<PeriodicReport>;
  /** `periodic_reports.decide` (أو التفويض). */
  canDecide: boolean;
  /** المفوَّض على تقرير قسمه: لا يقرر (self_decision_forbidden). */
  isOwnReport: boolean;
  /** أقرر بالتفويض عن المدير التنفيذي: اسمه. */
  onBehalfOf?: string;
  form: ReportDecisionForm;
  onFormChange: (form: ReportDecisionForm) => void;
  onSubmit?: () => void;
  submitting?: boolean;
  errors?: Readonly<Record<string, string>>;
  actionError?: string;
  targetLabel: (target: PlanTarget) => string;
  memberName: (id: number) => string;
  onOpenVersions?: () => void;
  onBack?: () => void;
  onRetry?: () => void;
};

/**
 * قرار المدير التنفيذي على التقرير الدوري (G14): مراجعة المراقبة، ثم أحد ستة قرارات بملاحظاته والإجراء المطلوب، والتقرير للقراءة تحته.
 * الأربعة الأولى تعتمده (بنود الخطة مهام، والأهداف خطة الشهر التالي، والمتابعة مهمة لرئيس القسم)، والأخيران تعيده. يشمله التفويض.
 */
export function ReportDecisionView({ report, canDecide, isOwnReport, onBehalfOf, form, onFormChange, onSubmit, submitting = false, errors = {}, actionError, targetLabel, memberName, onOpenVersions, onBack, onRetry }: ReportDecisionViewProps) {
  if (report.status === "loading") {
    return (
      <div className="flex flex-col gap-4" aria-busy="true">
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }
  if (report.status === "error") return report.code === "not_found" ? <NotFoundState onBack={onBack} /> : <ErrorState code={report.code} onRetry={onRetry} />;

  const data = report.data;
  const status = data.status ?? "REVIEWED";
  const kind = data.kind ? reportKindLabels[data.kind] : "";
  const department = data.department ? departmentLabels[data.department] : "—";
  const decision = data.executive_decision;
  const set = (patch: Partial<ReportDecisionForm>) => onFormChange({ ...form, ...patch });
  const deciding = canDecide && status === "REVIEWED";
  const chosen = form.decision;

  return (
    <>
      <PageHeader
        title={`تقرير ${kind} · ${department}`}
        badge={<StatusBadge entity="report" status={status} />}
        description={`الفترة ${periodLabel(data.period_start, data.period_end)} · ${data.author?.name ?? ""}${data.current_version ? ` · النسخة ${data.current_version}` : ""}`}
        actions={data.current_version && data.current_version > 1 && onOpenVersions ? [{ id: "versions", label: "النسخ المرسلة", onSelect: onOpenVersions }] : undefined}
      />

      <div className="flex flex-col gap-4">
        {actionError ? (
          <Banner kind={actionError === "invalid_status" ? "warning" : "danger"} title={actionError === "invalid_status" ? "تغيّرت حالة التقرير" : "تعذّر إصدار القرار"}>
            {errorMessage(actionError)}
          </Banner>
        ) : null}

        {onBehalfOf && deciding && !isOwnReport ? (
          <Banner kind="info" title={`تقرر بالتفويض عن ${onBehalfOf}`}>
            يُسجَّل القرار باسمك «بالتفويض».
          </Banner>
        ) : null}

        {data.monitoring_review ? <MonitoringReviewCard review={data.monitoring_review} /> : null}

        {deciding ? (
          <DecisionPanel
            state={isOwnReport ? "self-decision-forbidden" : "awaiting-me"}
            summary={`روجع التقرير من المراقبة. اختر قرارك: الأربعة الأولى تعتمده، والأخيران تعيده إلى ${data.author?.name ?? "رئيس القسم"}.`}
            forbiddenNote="ينتظر قرار المدير التنفيذي."
            approveLabel="إصدار القرار"
            approveDisabled={!decisionReady(form)}
            approveHint={chosen === null ? "اختر القرار لتفعيل «إصدار القرار»." : `اكتب ${actionLabel(chosen)} لتفعيل «إصدار القرار».`}
            approving={submitting}
            onApprove={() => onSubmit?.()}
          >
            <div className="flex flex-col gap-4">
              <RadioGroup aria-label="القرار" value={chosen} onValueChange={(next) => set({ decision: next })} invalid={Boolean(errors.decision)} disabled={submitting}>
                {execDecisionOrder.map((value) => (
                  <RadioCard key={value} value={value} title={execDecisionLabels[value].title} description={execDecisionLabels[value].description} />
                ))}
              </RadioGroup>
              {chosen && chosen !== "APPROVE" ? (
                <Field label={actionLabel(chosen)} required={actionRequired.includes(chosen)} optional={!actionRequired.includes(chosen)} error={errors.required_action}>
                  <Textarea aria-label={actionLabel(chosen)} value={form.requiredAction} onChange={(event) => set({ requiredAction: event.target.value })} disabled={submitting} />
                </Field>
              ) : null}
              <Field label="الملاحظات" optional error={errors.notes}>
                <Textarea aria-label="الملاحظات" value={form.notes} onChange={(event) => set({ notes: event.target.value })} disabled={submitting} />
              </Field>
            </div>
          </DecisionPanel>
        ) : null}

        {status === "SUBMITTED" ? (
          <Banner kind="info" title="بانتظار مراجعة المراقبة">
            يصل إليك بعد أن تراجعه المراقبة.
          </Banner>
        ) : null}

        {decision?.decision && (status === "APPROVED" || status === "RETURNED") ? (
          <>
            <DecisionRecord
              badge={<Badge color={returning.includes(decision.decision) ? "warning" : "success"}>{execDecisionLabels[decision.decision].title}</Badge>}
              decidedBy={decision.decided_by?.name ?? "—"}
              decidedAt={decision.decided_at ?? ""}
              reason={[decision.required_action ? `${actionLabel(decision.decision)}: ${decision.required_action}` : null, decision.notes].filter(Boolean).join("\n") || undefined}
              onBehalf={Boolean(decision.on_behalf_of)}
            />
            {status === "APPROVED" ? (
              <Banner kind="success" title="اعتُمد التقرير">
                {decision.decision === "APPROVE_WITH_FOLLOW_UP" ? "بنود الخطة صارت مهاماً، والأهداف خطة الشهر التالي، وفُتح الإجراء المطلوب مهمةً لرئيس القسم." : "بنود الخطة صارت مهاماً، والأهداف خطة الشهر التالي."}
              </Banner>
            ) : (
              <Banner kind="warning" title="أُعيد إلى رئيس القسم">
                {`يعدّله ${data.author?.name ?? "رئيس القسم"} ويرسله بنسخة جديدة${decision.decided_at ? `، أُعيد ${formatDateTime(decision.decided_at)}` : ""}.`}
              </Banner>
            )}
          </>
        ) : null}

        <ReportSections report={data} targetLabel={targetLabel} memberName={memberName} />
      </div>
    </>
  );
}
