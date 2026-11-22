"use client";

import { ConfidentialBanner } from "@/components/data/ConfidentialBanner";
import { DecisionRecord } from "@/components/data/DecisionPanel";
import { DescriptionList } from "@/components/data/DescriptionList";
import { currentDisputeStage, disputeStageHints, disputeStageLabels, riskLevelLabels, riskLevelOrder } from "@/components/data/dispute-stages";
import { StageTimeline, type Stage } from "@/components/data/StageTimeline";
import { StatusBadge } from "@/components/data/StatusBadge";
import { PageHeader } from "@/components/layout/PageHeader";
import { AttachmentList } from "@/components/ui/AttachmentList";
import { Badge } from "@/components/ui/Badge";
import { Banner } from "@/components/ui/Banner";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Dialog } from "@/components/ui/Dialog";
import { ErrorState } from "@/components/ui/ErrorState";
import { Field } from "@/components/ui/Field";
import { FileUpload, type FileRejection, type UploadFile } from "@/components/ui/FileUpload";
import { MoneyInput } from "@/components/ui/MoneyInput";
import { NotFoundState } from "@/components/ui/NotFoundState";
import { Radio, RadioGroup } from "@/components/ui/Radio";
import { ReasonDialog } from "@/components/ui/ReasonDialog";
import { Skeleton } from "@/components/ui/Skeleton";
import { Textarea } from "@/components/ui/Textarea";
import { errorMessage } from "@/lib/api/error-messages";
import type { Dispute, RiskLevel } from "@/lib/api/types";
import { formatDateTime, formatMoney, isolate } from "@/lib/format";
import type { Loadable } from "@/lib/loadable";

/** نموذج المرحلة الحالية 1–5 (`complete-stage`): ملخص إلزامي ومرفقات، ومستوى الخطر وقيمته في الرابعة. */
export type DisputeStageForm = { summary: string; attachments: UploadFile[]; riskLevel: RiskLevel | null; riskValue: string };
export const emptyDisputeStageForm: DisputeStageForm = { summary: "", attachments: [], riskLevel: null, riskValue: "" };

/** نافذة «حل آخر»: نص الحل وسببه (`POST /decision { type: OTHER_SOLUTION, text, reason }`). */
export type OtherSolutionForm = { text: string; reason: string };

/** نافذة «زال السبب» بسببها (حتى 1000). */
export type ResolvedDialog = { reason: string };

type DisputeDetailsViewProps = {
  /** `GET /disputes/{id}` (يُسجَّل الاطلاع). */
  dispute: Loadable<Dispute>;
  /** `disputes.manage` (القانوني): يكمل المراحل ويرفع التوصية وينفّذ ويغلق. */
  canManage: boolean;
  /** `disputes.decide` (المدير التنفيذي): يقرّر بانتظار القرار. لا تفويض فيه. */
  canDecide: boolean;
  stageForm: DisputeStageForm;
  onStageFormChange?: (form: DisputeStageForm) => void;
  onFilesSelect?: (files: File[]) => void;
  onFilesReject?: (rejections: FileRejection[]) => void;
  onFileRemove?: (id: string) => void;
  onCompleteStage?: () => void;
  recommendation: string;
  onRecommendationChange?: (text: string) => void;
  onSubmitRecommendation?: () => void;
  executeSummary: string;
  onExecuteSummaryChange?: (text: string) => void;
  onExecute?: () => void;
  /** تأكيد «اعتماد التوصية» مفتوح. */
  approving?: boolean;
  onStartApprove?: () => void;
  onConfirmApprove?: () => void;
  onDismissApprove?: () => void;
  /** نافذة «حل آخر»: null مغلقة. */
  otherSolution?: OtherSolutionForm | null;
  onOtherSolutionChange?: (form: OtherSolutionForm | null) => void;
  onConfirmOtherSolution?: () => void;
  resolvedDialog?: ResolvedDialog | null;
  onResolvedDialogChange?: (dialog: ResolvedDialog | null) => void;
  onConfirmResolved?: () => void;
  /** إجراء جارٍ: يعطّل الأزرار ويُظهر التحميل. */
  busy?: boolean;
  /** `errors` من `validation_failed` كما هي. */
  errors?: Readonly<Record<string, string>>;
  /** رمز خطأ إجراء بلا حقل (`invalid_status`). */
  actionError?: string;
  onDownloadAttachment?: (uploadId: string) => void;
  onBack?: () => void;
  onRetry?: () => void;
};

const REASON_MAX = 1000;
const MONEY_PATTERN = /^\d+(\.\d{1,2})?$/;
const attachmentLimits = { accept: "application/pdf,image/*,.docx", acceptLabel: "PDF أو صورة أو Word", maxSize: 10 * 1024 * 1024 } as const;

const toAttachment = (file: { upload_id?: string; name?: string }, index: number) => ({ id: file.upload_id ?? String(index), name: file.name ?? "مرفق" });
const decisionLabels = { APPROVED_RECOMMENDATION: "اعتماد التوصية", OTHER_SOLUTION: "حل آخر" } as const;

/** المراحل السبع والقرار بينها (معيّن بين السادسة والسابعة)، بحالتها وتفاصيل المكتملة. */
function buildStages(data: Dispute): Stage[] {
  const status = data.status ?? "STAGE_1";
  const current = currentDisputeStage(status);
  const done = (number: number) => (data.stages ?? []).find((entry) => entry.stage === number);
  const stageAt = (number: number): Stage => {
    const entry = done(number);
    const isDone = entry !== undefined || status === "CLOSED" || (typeof current === "number" && number < current) || (current === "decision" && number <= 6);
    return {
      key: `stage-${number}`,
      label: disputeStageLabels[number - 1],
      status: isDone ? "done" : current === number ? "current" : "upcoming",
      detail: entry ? { what: entry.summary ?? "", by: entry.done_by?.name ?? "—", at: entry.done_at ?? "" } : undefined,
    };
  };
  const decided = data.decision !== null && data.decision !== undefined;
  const decision: Stage = {
    key: "decision",
    label: "قرار المدير التنفيذي",
    kind: "decision",
    status: decided ? "done" : current === "decision" ? "current" : "upcoming",
    detail: decided && data.decision ? { what: data.decision.type ? decisionLabels[data.decision.type] : "", by: data.decision.decided_by?.name ?? "—", at: data.decision.decided_at ?? "" } : undefined,
  };
  return [1, 2, 3, 4, 5, 6].map(stageAt).concat(decision, stageAt(7));
}

/**
 * ملف النزاع (I20) وقرار المدير التنفيذي (I21): سري، بسبع مراحل لا قفز بينها، والقرار بين السادسة والسابعة (القرار 14).
 * المراحل 1–5 بملخص ومرفقات (والخطر في الرابعة)، والسادسة نموذج التوصية، ثم يقرّر المدير التنفيذي (اعتماد التوصية أو حل آخر بسبب، لا تفويض)، والسابعة تنفيذ القرار.
 * «زال السبب» يغلق الملف في المراحل 1–6 بسببه.
 */
export function DisputeDetailsView({
  dispute,
  canManage,
  canDecide,
  stageForm,
  onStageFormChange,
  onFilesSelect,
  onFilesReject,
  onFileRemove,
  onCompleteStage,
  recommendation,
  onRecommendationChange,
  onSubmitRecommendation,
  executeSummary,
  onExecuteSummaryChange,
  onExecute,
  approving = false,
  onStartApprove,
  onConfirmApprove,
  onDismissApprove,
  otherSolution = null,
  onOtherSolutionChange,
  onConfirmOtherSolution,
  resolvedDialog = null,
  onResolvedDialogChange,
  onConfirmResolved,
  busy = false,
  errors = {},
  actionError,
  onDownloadAttachment,
  onBack,
  onRetry,
}: DisputeDetailsViewProps) {
  if (dispute.status === "loading") {
    return (
      <div className="flex flex-col gap-4" aria-busy="true">
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-44 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }
  if (dispute.status === "error") return dispute.code === "not_found" ? <NotFoundState onBack={onBack} /> : <ErrorState code={dispute.code} onRetry={onRetry} />;

  const data = dispute.data;
  const status = data.status ?? "STAGE_1";
  const current = currentDisputeStage(status);
  const stageNumber = typeof current === "number" && current <= 5 ? current : null;
  const hint = stageNumber ? disputeStageHints[stageNumber] : null;
  const canResolve = canManage && typeof current === "number" && current <= 6;
  const stageHeading = (number: number) => `المرحلة ${isolate(number)}: ${disputeStageLabels[number - 1]}`;
  const summaryOf = (number: number) => (data.stages ?? []).find((entry) => entry.stage === number)?.summary ?? null;

  const uploading = stageForm.attachments.some((file) => file.status === "uploading");
  const riskInvalid = stageNumber === 4 && stageForm.riskValue.trim() !== "" && !MONEY_PATTERN.test(stageForm.riskValue.trim());
  const completeReason =
    stageForm.summary.trim() === ""
      ? `اكتب ${hint?.label ?? "الملخص"} لتفعيل «إكمال المرحلة».`
      : stageNumber === 4 && stageForm.riskLevel === null
        ? "اختر مستوى الخطر."
        : riskInvalid
          ? `اكتب قيمة الخطر مبلغاً بالدولار، مثل ${isolate("480.00")}.`
          : uploading
            ? "انتظر انتهاء رفع المرفقات."
            : null;

  const otherReason = otherSolution === null ? null : otherSolution.text.trim() === "" ? "اكتب الحل." : otherSolution.reason.trim() === "" ? "اكتب سبب اختيار حل آخر." : null;

  const description = [data.customer?.name, data.delivery_id ? `التسليم ${isolate(`#${data.delivery_id}`)}` : null, data.created_at ? `فُتح ${formatDateTime(data.created_at)}` : null, data.opened_by?.name ? `بواسطة ${data.opened_by.name}` : null].filter(Boolean).join(" · ");

  return (
    <>
      <PageHeader
        title={data.title ?? "ملف نزاع"}
        badge={data.status ? <StatusBadge entity="dispute" status={data.status} /> : undefined}
        description={description}
        actions={canResolve ? [{ id: "resolved", label: "زال السبب", onSelect: () => onResolvedDialogChange?.({ reason: "" }), disabled: busy }] : undefined}
      />

      <div className="flex flex-col gap-4">
        <ConfidentialBanner />

        {actionError ? (
          <Banner kind={actionError === "invalid_status" ? "warning" : "danger"} title={actionError === "invalid_status" ? "تغيّرت حالة الملف" : "تعذّر تنفيذ الإجراء"}>
            {errorMessage(actionError)}
          </Banner>
        ) : null}

        <Card title="المراحل">
          <StageTimeline stages={buildStages(data)} earlyClose={status === "CLOSED_RESOLVED" ? { atKey: `stage-${Math.max((data.stages ?? []).length, 1)}`, label: "زال السبب", reason: data.close_reason ?? "" } : undefined} />
        </Card>

        {stageNumber !== null && canManage && hint ? (
          <Card title={stageHeading(stageNumber)}>
            <div className="flex flex-col gap-4">
              <Field label={hint.label} required hint={hint.hint} error={errors.summary}>
                <Textarea aria-label={hint.label} value={stageForm.summary} onChange={(event) => onStageFormChange?.({ ...stageForm, summary: event.target.value })} disabled={busy} />
              </Field>
              {stageNumber === 4 ? (
                <>
                  <Field label="مستوى الخطر" required error={errors["risk.level"]}>
                    <RadioGroup aria-label="مستوى الخطر" orientation="horizontal" value={stageForm.riskLevel} onValueChange={(riskLevel) => onStageFormChange?.({ ...stageForm, riskLevel })} disabled={busy}>
                      {riskLevelOrder.map((level) => (
                        <Radio key={level} value={level} label={riskLevelLabels[level]} />
                      ))}
                    </RadioGroup>
                  </Field>
                  <Field label="القيمة المعرّضة للخطر" optional error={errors["risk.value"]}>
                    <MoneyInput aria-label="القيمة المعرّضة للخطر" value={stageForm.riskValue} invalid={riskInvalid} onChange={(event) => onStageFormChange?.({ ...stageForm, riskValue: event.target.value })} disabled={busy} />
                  </Field>
                </>
              ) : null}
              <Field label="المستندات" optional hint={`${attachmentLimits.acceptLabel}.`} error={errors.attachments}>
                <FileUpload multiple files={stageForm.attachments} accept={attachmentLimits.accept} acceptLabel={attachmentLimits.acceptLabel} maxSize={attachmentLimits.maxSize} onSelect={(files) => onFilesSelect?.(files)} onReject={onFilesReject} onRemove={(id) => onFileRemove?.(id)} disabled={busy} />
              </Field>
              <div className="flex flex-col gap-2">
                <div>
                  <Button variant="primary" size="lg" loading={busy} disabled={completeReason !== null} onClick={onCompleteStage}>
                    إكمال المرحلة
                  </Button>
                </div>
                <p className="text-label text-fg-muted">{completeReason ?? "يتقدّم الملف مرحلة واحدة، ولا قفز بين المراحل."}</p>
              </div>
            </div>
          </Card>
        ) : null}

        {current === 6 && canManage ? (
          <Card title={stageHeading(6)}>
            <div className="flex flex-col gap-4">
              <DescriptionList
                items={[
                  { label: "المخاطر", value: data.risk?.level ? `${riskLevelLabels[data.risk.level]}${data.risk.value ? ` · ${formatMoney(data.risk.value)}` : ""}` : null },
                  { label: "الحلول المقترحة", value: summaryOf(5) },
                ]}
              />
              <Field label="التوصية" required hint="الحل الذي توصي به للمدير التنفيذي." error={errors.recommendation}>
                <Textarea aria-label="التوصية" value={recommendation} onChange={(event) => onRecommendationChange?.(event.target.value)} disabled={busy} />
              </Field>
              <div className="flex flex-col gap-2">
                <div>
                  <Button variant="primary" size="lg" loading={busy} disabled={recommendation.trim() === ""} onClick={onSubmitRecommendation}>
                    رفع التوصية
                  </Button>
                </div>
                <p className="text-label text-fg-muted">{recommendation.trim() === "" ? "اكتب التوصية لتفعيل «رفع التوصية»." : "تُرفع للمدير التنفيذي ولا تُعدَّل بعدها."}</p>
              </div>
            </div>
          </Card>
        ) : null}

        {stageNumber !== null && !canManage ? (
          <Banner kind="info" title={stageHeading(stageNumber)}>
            الملف قيد المعالجة عند القانوني. يصلك حين تُرفع التوصية.
          </Banner>
        ) : null}

        {data.recommendation ? (
          <Card title="التوصية" action={data.risk?.level ? <Badge color={data.risk.level === "HIGH" ? "danger" : data.risk.level === "MEDIUM" ? "warning" : "neutral"}>{`خطر ${riskLevelLabels[data.risk.level]}`}</Badge> : undefined}>
            <p className="text-body text-fg">{data.recommendation}</p>
          </Card>
        ) : null}

        {status === "AWAITING_DECISION" && canDecide ? (
          <Card title="قرار المدير التنفيذي">
            <div className="flex flex-col gap-4">
              <Banner kind="info">نزاع سري ينتظر قرارك. القرار لك وحدك ولا يُفوَّض.</Banner>
              <div className="flex flex-wrap gap-2">
                <Button variant="primary" size="lg" disabled={busy} onClick={onStartApprove}>
                  اعتماد التوصية
                </Button>
                <Button variant="secondary" size="lg" disabled={busy} onClick={() => onOtherSolutionChange?.({ text: "", reason: "" })}>
                  حل آخر
                </Button>
              </div>
            </div>
          </Card>
        ) : null}

        {status === "AWAITING_DECISION" && !canDecide ? (
          <Banner kind="warning" title="بانتظار قرار المدير التنفيذي">
            رُفعت التوصية ولا تُعدَّل. القرار للمدير التنفيذي وحده ولا تفويض فيه.
          </Banner>
        ) : null}

        {data.decision ? (
          <DecisionRecord
            badge={<Badge color={data.decision.type === "OTHER_SOLUTION" ? "warning" : "success"}>{data.decision.type ? decisionLabels[data.decision.type] : ""}</Badge>}
            decidedBy={data.decision.decided_by?.name ?? "—"}
            decidedAt={data.decision.decided_at ?? ""}
            reason={data.decision.type === "OTHER_SOLUTION" ? `${data.decision.text ?? ""}${data.decision.reason ? ` · السبب: ${data.decision.reason}` : ""}` : (data.decision.text ?? undefined)}
          />
        ) : null}

        {current === 7 && canManage ? (
          <Card title={stageHeading(7)}>
            <div className="flex flex-col gap-4">
              <Field label="ما نُفّذ" required hint="كيف نُفّذ القرار ونتيجته." error={errors.summary}>
                <Textarea aria-label="ما نُفّذ" value={executeSummary} onChange={(event) => onExecuteSummaryChange?.(event.target.value)} disabled={busy} />
              </Field>
              <div className="flex flex-col gap-2">
                <div>
                  <Button variant="primary" size="lg" loading={busy} disabled={executeSummary.trim() === ""} onClick={onExecute}>
                    تنفيذ القرار وإغلاق الملف
                  </Button>
                </div>
                {executeSummary.trim() === "" ? <p className="text-label text-fg-muted">اكتب ما نُفّذ لتفعيل الإغلاق.</p> : null}
              </div>
            </div>
          </Card>
        ) : null}

        {status === "CLOSED_RESOLVED" ? (
          <Banner kind="neutral" title="أُغلق: زال السبب">
            {data.close_reason ?? "—"}
          </Banner>
        ) : null}

        {(data.stages ?? []).length > 0 ? (
          <Card title="ما جرى في المراحل">
            <ul className="flex flex-col divide-y divide-border">
              {(data.stages ?? []).map((entry) => (
                <li key={entry.stage} className="flex flex-col gap-2 py-4 first:pt-0 last:pb-0">
                  <p className="text-body font-medium text-fg">{stageHeading(entry.stage ?? 1)}</p>
                  <p className="text-body text-fg">{entry.summary}</p>
                  <p className="text-caption text-fg-muted">{`${entry.done_by?.name ?? "—"}${entry.done_at ? ` · ${formatDateTime(entry.done_at)}` : ""}`}</p>
                  {(entry.attachments ?? []).length > 0 ? <AttachmentList attachments={(entry.attachments ?? []).map(toAttachment)} onDownload={(id) => onDownloadAttachment?.(id)} /> : null}
                </li>
              ))}
            </ul>
          </Card>
        ) : null}
      </div>

      <ReasonDialog
        open={resolvedDialog !== null}
        onOpenChange={(open) => (open ? undefined : onResolvedDialogChange?.(null))}
        title="زال سبب النزاع؟"
        description="يُغلق الملف في مرحلته الحالية ولا تُكمل بقية المراحل. السبب يُحفظ في الملف."
        confirmLabel="إغلاق الملف"
        cancelLabel="تراجع"
        reason={resolvedDialog?.reason ?? ""}
        onReasonChange={(reason) => onResolvedDialogChange?.({ reason: reason.slice(0, REASON_MAX) })}
        error={errors.reason}
        loading={busy}
        onConfirm={() => onConfirmResolved?.()}
      />

      <ConfirmDialog
        open={approving}
        onOpenChange={(open) => (open ? undefined : onDismissApprove?.())}
        title="اعتماد التوصية؟"
        description="يصير القرار التوصية كما رُفعت، وينتقل الملف إلى «تنفيذ القرار». القرار لك وحدك ولا يُفوَّض."
        confirmLabel="اعتماد التوصية"
        cancelLabel="تراجع"
        loading={busy}
        onConfirm={() => onConfirmApprove?.()}
      />

      <Dialog
        open={otherSolution !== null}
        onOpenChange={(open) => (open ? undefined : onOtherSolutionChange?.(null))}
        dismissible={!busy}
        size="md"
        title="حل آخر"
        description="قرار بغير التوصية: اكتب الحل الذي يُنفَّذ وسببه."
        actions={[
          <Button key="cancel" variant="secondary" disabled={busy} onClick={() => onOtherSolutionChange?.(null)}>
            تراجع
          </Button>,
          <Button key="save" variant="primary" loading={busy} disabled={otherReason !== null} onClick={() => onConfirmOtherSolution?.()}>
            إصدار القرار
          </Button>,
        ]}
      >
        {otherSolution ? (
          <div className="flex flex-col gap-4">
            <Field label="الحل" required error={errors.text}>
              <Textarea aria-label="الحل" value={otherSolution.text} onChange={(event) => onOtherSolutionChange?.({ ...otherSolution, text: event.target.value })} disabled={busy} />
            </Field>
            <Field label="السبب" required error={errors.reason}>
              <Textarea aria-label="سبب الحل الآخر" value={otherSolution.reason} onChange={(event) => onOtherSolutionChange?.({ ...otherSolution, reason: event.target.value })} disabled={busy} />
            </Field>
            {otherReason ? <p className="text-label text-fg-muted">{otherReason}</p> : null}
          </div>
        ) : null}
      </Dialog>
    </>
  );
}
