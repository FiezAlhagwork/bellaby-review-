"use client";

import { departmentLabels } from "@/components/data/departments";
import { reportKindLabels } from "@/components/data/report-kinds";
import { StatusBadge } from "@/components/data/StatusBadge";
import { PageHeader } from "@/components/layout/PageHeader";
import { Banner } from "@/components/ui/Banner";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ErrorState } from "@/components/ui/ErrorState";
import { Field } from "@/components/ui/Field";
import { NotFoundState } from "@/components/ui/NotFoundState";
import { Radio, RadioGroup } from "@/components/ui/Radio";
import { Skeleton } from "@/components/ui/Skeleton";
import { Textarea } from "@/components/ui/Textarea";
import { MonitoringReviewCard, periodLabel, ReportSections } from "@/features/periodic-reports/components/ReportSections";
import { errorMessage } from "@/lib/api/error-messages";
import type { PeriodicReport, PlanTarget } from "@/lib/api/types";
import { formatDateTime } from "@/lib/format";
import type { Loadable } from "@/lib/loadable";

type YesNo = "yes" | "no";

/** نموذج المراجعة كما يرسله `POST /periodic-reports/{id}/review`. */
export type ReviewForm = { isComplete: YesNo | null; needsVerification: YesNo | null; notes: string };
export const emptyReview: ReviewForm = { isComplete: null, needsVerification: null, notes: "" };

type ReportReviewViewProps = {
  report: Loadable<PeriodicReport>;
  /** `periodic_reports.review`. */
  canReview: boolean;
  form: ReviewForm;
  onFormChange: (form: ReviewForm) => void;
  onSubmit?: () => void;
  submitting?: boolean;
  errors?: Readonly<Record<string, string>>;
  /** `invalid_status`: روجع التقرير أو تغيّرت حالته. */
  actionError?: string;
  targetLabel: (target: PlanTarget) => string;
  memberName: (id: number) => string;
  onBack?: () => void;
  onRetry?: () => void;
};

/**
 * مراجعة المراقبة للتقرير الدوري (G13): التقرير للقراءة، ونموذج المراجعة (مكتمل؟ يحتاج تحققاً؟ والملاحظات).
 * المراقبة تراجع ولا تعتمد ولا تعيد؛ بعد المراجعة ينتقل التقرير إلى المدير التنفيذي («بانتظار الإدارة»).
 */
export function ReportReviewView({ report, canReview, form, onFormChange, onSubmit, submitting = false, errors = {}, actionError, targetLabel, memberName, onBack, onRetry }: ReportReviewViewProps) {
  if (report.status === "loading") {
    return (
      <div className="flex flex-col gap-4" aria-busy="true">
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }
  if (report.status === "error") return report.code === "not_found" ? <NotFoundState onBack={onBack} /> : <ErrorState code={report.code} onRetry={onRetry} />;

  const data = report.data;
  const status = data.status ?? "SUBMITTED";
  const kind = data.kind ? reportKindLabels[data.kind] : "";
  const department = data.department ? departmentLabels[data.department] : "—";
  const reviewing = canReview && status === "SUBMITTED";
  const set = (patch: Partial<ReviewForm>) => onFormChange({ ...form, ...patch });

  return (
    <>
      <PageHeader
        title={`مراجعة تقرير ${kind} · ${department}`}
        badge={<StatusBadge entity="report" status={status} />}
        description={`الفترة ${periodLabel(data.period_start, data.period_end)} · ${data.author?.name ?? ""}${data.first_submitted_at ? ` · أُرسل ${formatDateTime(data.first_submitted_at)}` : ""}`}
      />

      <div className="flex flex-col gap-4">
        {actionError ? (
          <Banner kind={actionError === "invalid_status" ? "warning" : "danger"} title={actionError === "invalid_status" ? "تغيّرت حالة التقرير" : "تعذّر إرسال المراجعة"}>
            {errorMessage(actionError)}
          </Banner>
        ) : null}

        {reviewing ? (
          <Card title="المراجعة">
            <div className="flex flex-col gap-4">
              <p className="text-label text-fg-muted">تراجع المراقبة التقرير ولا تعتمده ولا تعيده. بعد الإرسال ينتقل إلى المدير التنفيذي.</p>
              <Field label="هل التقرير مكتمل؟" required error={errors.is_complete}>
                <RadioGroup aria-label="هل التقرير مكتمل؟" orientation="horizontal" value={form.isComplete} onValueChange={(isComplete) => set({ isComplete })} invalid={Boolean(errors.is_complete)} disabled={submitting}>
                  <Radio value="yes" label="نعم" />
                  <Radio value="no" label="لا" />
                </RadioGroup>
              </Field>
              <Field label="هل يحتاج تحققاً؟" required error={errors.needs_verification}>
                <RadioGroup aria-label="هل يحتاج تحققاً؟" orientation="horizontal" value={form.needsVerification} onValueChange={(needsVerification) => set({ needsVerification })} invalid={Boolean(errors.needs_verification)} disabled={submitting}>
                  <Radio value="yes" label="نعم" />
                  <Radio value="no" label="لا" />
                </RadioGroup>
              </Field>
              <Field label="الملاحظات" optional error={errors.notes}>
                <Textarea value={form.notes} onChange={(event) => set({ notes: event.target.value })} disabled={submitting} />
              </Field>
              <div>
                <Button variant="primary" loading={submitting} disabled={form.isComplete === null || form.needsVerification === null} onClick={onSubmit}>
                  إرسال المراجعة
                </Button>
              </div>
            </div>
          </Card>
        ) : null}

        {data.monitoring_review ? <MonitoringReviewCard review={data.monitoring_review} /> : null}

        {status === "REVIEWED" ? (
          <Banner kind="info" title="روجع وانتقل للإدارة">
            ينتظر قرار المدير التنفيذي.
          </Banner>
        ) : null}

        <ReportSections report={data} targetLabel={targetLabel} memberName={memberName} />
      </div>
    </>
  );
}
