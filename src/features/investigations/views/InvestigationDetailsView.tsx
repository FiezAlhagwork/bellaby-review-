"use client";

import { ConfidentialBanner } from "@/components/data/ConfidentialBanner";
import { classificationHints, classificationLabels, classificationOrder } from "@/components/data/classification";
import { DecisionRecord } from "@/components/data/DecisionPanel";
import { DescriptionList } from "@/components/data/DescriptionList";
import { currentStageNumber, investigationStageLabels, stageSummaryHints } from "@/components/data/investigation-stages";
import { StageTimeline, type Stage } from "@/components/data/StageTimeline";
import { StatusBadge } from "@/components/data/StatusBadge";
import { PageHeader } from "@/components/layout/PageHeader";
import { AttachmentList } from "@/components/ui/AttachmentList";
import { Banner } from "@/components/ui/Banner";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Checkbox } from "@/components/ui/Checkbox";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { ErrorState } from "@/components/ui/ErrorState";
import { Field } from "@/components/ui/Field";
import { FileUpload, type FileRejection, type UploadFile } from "@/components/ui/FileUpload";
import { MoneyInput } from "@/components/ui/MoneyInput";
import { NotFoundState } from "@/components/ui/NotFoundState";
import { RadioCard, RadioGroup } from "@/components/ui/Radio";
import { ReasonDialog } from "@/components/ui/ReasonDialog";
import { Skeleton } from "@/components/ui/Skeleton";
import { Textarea } from "@/components/ui/Textarea";
import { errorMessage } from "@/lib/api/error-messages";
import type { Classification, Investigation, Money } from "@/lib/api/types";
import { formatDateTime, formatMoney, isolate } from "@/lib/format";
import type { Loadable } from "@/lib/loadable";

/** نموذج المرحلة الحالية (1 إلى 6): ملخص إلزامي ومرفقات، كما يقبلها `POST /complete-stage` (§38.1). */
export type StageForm = { summary: string; /** كل ملف يُرفع قبل الإرسال وتُرسل `upload_id`ات المرفوعة في `attachments`. */ attachments: UploadFile[] };

export const emptyStageForm: StageForm = { summary: "", attachments: [] };

/** نموذج الرفع للقرار (المرحلة 7): التصنيف والإجراء المقترح، وهما إلزاميان (`POST /submit-for-decision`). */
export type SubmitForm = { classification: Classification | null; proposedAction: string };

export const emptySubmitForm: SubmitForm = { classification: null, proposedAction: "" };

/** قرار المدير التنفيذي: نص إلزامي، وخصم اختياري بمبلغ وسبب (`POST /decision`). المبلغ نص عشري ولا حساب عليه. */
export type DecisionForm = { text: string; withDeduction: boolean; amount: string; reason: string };

export const emptyDecisionForm: DecisionForm = { text: "", withDeduction: false, amount: "", reason: "" };

/** نافذة «إغلاق: لا مخالفة» بسببها (حتى 1000). null مغلقة. */
export type CloseDialog = { reason: string; loading?: boolean; /** رمز خطأ العقد (invalid_status وvalidation_failed…). */ errorCode?: string };

type InvestigationDetailsViewProps = {
  /** `GET /investigations/{id}` (يُسجَّل الاطلاع). `not_found` يعرض «غير موجود أو خارج نطاقك». */
  investigation: Loadable<Investigation>;
  /** `investigations.manage` (المراقبة): يكمل المراحل ويغلق ويرفع للقرار. */
  canManage: boolean;
  /** `investigations.decide` (المدير التنفيذي): يقرّر عند الرفع للقرار. لا تفويض فيه (القرار 13). */
  canDecide: boolean;
  /** الخصم المقرَّر (مبلغه وسببه): `Investigation.decision` فيه `deduction_id` فقط (§38.7). */
  deduction?: { amount: Money; reason: string } | null;
  stageForm: StageForm;
  onStageFormChange?: (form: StageForm) => void;
  onFilesSelect?: (files: File[]) => void;
  onFilesReject?: (rejections: FileRejection[]) => void;
  onFileRemove?: (id: string) => void;
  /** خطأ منطقة المرفقات (رفض نوع أو حجم، أو من الخادم). */
  attachmentError?: string;
  onCompleteStage?: () => void;
  completing?: boolean;
  closeDialog?: CloseDialog | null;
  onStartClose?: () => void;
  onCloseReasonChange?: (reason: string) => void;
  onConfirmClose?: () => void;
  onDismissClose?: () => void;
  submitForm: SubmitForm;
  onSubmitFormChange?: (form: SubmitForm) => void;
  /** تأكيد الرفع للقرار مفتوح. */
  submitConfirming?: boolean;
  submitting?: boolean;
  onStartSubmit?: () => void;
  onConfirmSubmit?: () => void;
  onDismissSubmit?: () => void;
  decisionForm: DecisionForm;
  onDecisionFormChange?: (form: DecisionForm) => void;
  /** تأكيد إصدار القرار مفتوح. */
  decisionConfirming?: boolean;
  deciding?: boolean;
  onStartDecision?: () => void;
  onConfirmDecision?: () => void;
  onDismissDecision?: () => void;
  /** `errors` من `validation_failed` كما هي: `{ summary: "نص عربي", "deduction.amount": "نص" }`. */
  errors?: Readonly<Record<string, string>>;
  /** رمز خطأ إجراء بلا حقل (invalid_status وغيره): شريط فوق الأقسام. */
  actionError?: string;
  /** يفتح العلامة التي فُتح الملف منها (S09). */
  onOpenFlag?: (flagId: number) => void;
  onBack?: () => void;
  onRetry?: () => void;
};

const COMMENT_MAX = 1000;
const attachmentLimits = { accept: "application/pdf,image/*,.xlsx,.docx", acceptLabel: "PDF أو صورة أو Word أو Excel", maxSize: 10 * 1024 * 1024 } as const;

const toAttachment = (file: { upload_id?: string; name?: string }, index: number) => ({ id: file.upload_id ?? String(index), name: file.name ?? "مرفق" });

/** مراحل الملف الثماني بحالتها: المكتملة بتفاصيلها، والحالية، والقادمة. الثامنة (انتظار القرار) مكتملة بالقرار. */
function buildStages(data: Investigation): Stage[] {
  const status = data.status ?? "STAGE_1";
  const current = currentStageNumber(status);
  const closed = status === "CLOSED_NO_VIOLATION";
  const completed = data.stages ?? [];
  return investigationStageLabels.map((label, index): Stage => {
    const number = index + 1;
    const done = completed.find((entry) => entry.stage === number);
    if (number === 8) {
      const decided = status === "DECIDED" && data.decision;
      return {
        key: `stage-${number}`,
        label,
        status: decided ? "done" : status === "AWAITING_DECISION" ? "current" : "upcoming",
        detail: decided && data.decision ? { what: data.decision.text ?? "", by: data.decision.decided_by?.name ?? "—", at: data.decision.decided_at ?? "" } : undefined,
      };
    }
    const isDone = done !== undefined || (current === null && !closed) || (current !== null && number < current);
    return {
      key: `stage-${number}`,
      label,
      status: isDone ? "done" : current === number ? "current" : "upcoming",
      detail: done ? { what: done.summary ?? "", by: done.done_by?.name ?? "—", at: done.done_at ?? "" } : undefined,
    };
  });
}

/**
 * ملف التحقيق (S15): سري، بثماني مراحل لا قفز بينها (القرار 9). تحت المرحلة الحالية نموذجها (ملخص ومرفقات) و«إكمال المرحلة» و«إغلاق: لا مخالفة» بسبب؛
 * وفي السابعة «رفع للقرار» بالتصنيف والإجراء المقترح. بعد الرفع يقرّر المدير التنفيذي بنص إلزامي وخصم اختياري (لا تفويض: القرار 13)، ثم يُقفل الملف بسجل القرار.
 */
export function InvestigationDetailsView({
  investigation,
  canManage,
  canDecide,
  deduction = null,
  stageForm,
  onStageFormChange,
  onFilesSelect,
  onFilesReject,
  onFileRemove,
  attachmentError,
  onCompleteStage,
  completing = false,
  closeDialog = null,
  onStartClose,
  onCloseReasonChange,
  onConfirmClose,
  onDismissClose,
  submitForm,
  onSubmitFormChange,
  submitConfirming = false,
  submitting = false,
  onStartSubmit,
  onConfirmSubmit,
  onDismissSubmit,
  decisionForm,
  onDecisionFormChange,
  decisionConfirming = false,
  deciding = false,
  onStartDecision,
  onConfirmDecision,
  onDismissDecision,
  errors = {},
  actionError,
  onOpenFlag,
  onBack,
  onRetry,
}: InvestigationDetailsViewProps) {
  if (investigation.status === "loading") {
    return (
      <div className="flex flex-col gap-4" aria-busy="true">
        <div className="flex flex-col gap-2 pb-4">
          <Skeleton className="h-8 w-80" />
          <Skeleton className="h-5 w-96 max-w-full" />
        </div>
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-44 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (investigation.status === "error") {
    return investigation.code === "not_found" ? <NotFoundState onBack={onBack} /> : <ErrorState code={investigation.code} onRetry={onRetry} />;
  }

  const data = investigation.data;
  const status = data.status ?? "STAGE_1";
  const current = currentStageNumber(status);
  const closed = status === "CLOSED_NO_VIOLATION";
  const completedStages = data.stages ?? [];
  const lastDone = completedStages.length;

  const stageNumber = current !== null && current <= 6 ? current : null;
  const stageHint = stageNumber ? stageSummaryHints[stageNumber] : null;
  const canComplete = stageForm.summary.trim() !== "" && !stageForm.attachments.some((file) => file.status === "uploading");
  const completeReason = stageForm.summary.trim() === "" ? `اكتب ${stageHint?.label ?? "الملخص"} لتفعيل «إكمال المرحلة».` : stageForm.attachments.some((file) => file.status === "uploading") ? "انتظر انتهاء رفع المرفقات." : null;

  const canSubmit = submitForm.classification !== null && submitForm.proposedAction.trim() !== "";
  const submitReason = submitForm.classification === null ? "اختر التصنيف لتفعيل «رفع للقرار»." : submitForm.proposedAction.trim() === "" ? "اكتب الإجراء المقترح لتفعيل «رفع للقرار»." : null;

  const decisionComplete = decisionForm.text.trim() !== "" && (!decisionForm.withDeduction || (decisionForm.amount.trim() !== "" && decisionForm.reason.trim() !== ""));
  const decisionReason =
    decisionForm.text.trim() === ""
      ? "اكتب نص القرار لتفعيل «إصدار القرار»."
      : decisionForm.withDeduction && (decisionForm.amount.trim() === "" || decisionForm.reason.trim() === "")
        ? "أكمل مبلغ الخصم وسببه، أو ألغِ الخصم."
        : null;

  const earlyClose = closed ? { atKey: `stage-${Math.max(lastDone, 1)}`, label: "أُغلق بلا مخالفة", reason: data.close_reason ?? "" } : undefined;
  const stageHeading = (number: number) => `المرحلة ${isolate(number)}: ${investigationStageLabels[number - 1]}`;

  return (
    <>
      <PageHeader
        title={data.title ?? "ملف تحقيق"}
        badge={data.status ? <StatusBadge entity="investigation" status={data.status} /> : undefined}
        description={`${data.subject_user?.name ?? "—"}${data.created_at ? ` · فُتح ${formatDateTime(data.created_at)}` : ""}${data.created_by?.name ? ` بواسطة ${data.created_by.name}` : ""}`}
      />

      <div className="flex flex-col gap-4">
        <ConfidentialBanner />

        {actionError ? (
          <Banner kind={actionError === "invalid_status" ? "warning" : "danger"} title={actionError === "invalid_status" ? "تغيّرت حالة الملف" : "تعذّر تنفيذ الإجراء"}>
            {errorMessage(actionError)}
          </Banner>
        ) : null}

        {data.opened_from_flag_id ? (
          <Banner
            kind="info"
            title="فُتح من علامة"
            action={
              <Button variant="ghost" size="sm" onClick={() => onOpenFlag?.(data.opened_from_flag_id ?? 0)}>
                {`فتح العلامة ${isolate(`#${data.opened_from_flag_id}`)}`}
              </Button>
            }
          >
            هذا الملف مصدره علامة حوّلتها المراقبة إلى تحقيق.
          </Banner>
        ) : null}

        <Card title="المراحل">
          <StageTimeline stages={buildStages(data)} earlyClose={earlyClose} />
        </Card>

        {stageNumber !== null && canManage ? (
          <Card title={stageHeading(stageNumber)}>
            {stageHint ? (
              <>
                <Field label={stageHint.label} required hint={stageHint.hint} error={errors.summary}>
                  <Textarea aria-label={stageHint.label} value={stageForm.summary} onChange={(event) => onStageFormChange?.({ ...stageForm, summary: event.target.value })} disabled={completing} />
                </Field>
                <Field label="المستندات" optional hint={`${attachmentLimits.acceptLabel}.`} error={errors.attachments ?? attachmentError}>
                  <FileUpload
                    multiple
                    files={stageForm.attachments}
                    accept={attachmentLimits.accept}
                    acceptLabel={attachmentLimits.acceptLabel}
                    maxSize={attachmentLimits.maxSize}
                    onSelect={(files) => onFilesSelect?.(files)}
                    onReject={onFilesReject}
                    onRemove={(id) => onFileRemove?.(id)}
                    disabled={completing}
                  />
                </Field>
              </>
            ) : null}
            <div className="flex flex-col gap-2">
              <div className="flex flex-wrap items-center gap-2">
                <Button variant="primary" size="lg" loading={completing} disabled={!canComplete} onClick={onCompleteStage}>
                  إكمال المرحلة
                </Button>
                <Button variant="secondary" size="lg" disabled={completing} onClick={onStartClose}>
                  إغلاق: لا مخالفة
                </Button>
              </div>
              {completeReason ? <p className="text-label text-fg-muted">{completeReason}</p> : <p className="text-label text-fg-muted">يتقدّم الملف مرحلة واحدة، ولا قفز بين المراحل.</p>}
            </div>
          </Card>
        ) : null}

        {current === 7 && canManage ? (
          <Card title={stageHeading(7)}>
            <Field label="التصنيف" required error={errors.classification}>
              <RadioGroup aria-label="تصنيف المخالفة" value={submitForm.classification} onValueChange={(classification) => onSubmitFormChange?.({ ...submitForm, classification })} disabled={submitting}>
                {classificationOrder.map((value) => (
                  <RadioCard key={value} value={value} title={classificationLabels[value]} description={classificationHints[value]} />
                ))}
              </RadioGroup>
            </Field>
            <Field label="الإجراء المقترح" required hint="الإجراء الذي تقترحه على المدير التنفيذي." error={errors.proposed_action}>
              <Textarea aria-label="الإجراء المقترح" value={submitForm.proposedAction} onChange={(event) => onSubmitFormChange?.({ ...submitForm, proposedAction: event.target.value })} disabled={submitting} />
            </Field>
            <div className="flex flex-col gap-2">
              <div className="flex flex-wrap items-center gap-2">
                <Button variant="primary" size="lg" disabled={!canSubmit} loading={submitting} onClick={onStartSubmit}>
                  رفع للقرار
                </Button>
                <Button variant="secondary" size="lg" disabled={submitting} onClick={onStartClose}>
                  إغلاق: لا مخالفة
                </Button>
              </div>
              {submitReason ? <p className="text-label text-fg-muted">{submitReason}</p> : null}
            </div>
          </Card>
        ) : null}

        {stageNumber !== null && !canManage ? (
          <Banner kind="info" title={stageHeading(stageNumber)}>
            الملف قيد التحقيق عند المراقبة. يصلك حين يُرفع للقرار.
          </Banner>
        ) : null}
        {current === 7 && !canManage ? (
          <Banner kind="info" title={stageHeading(7)}>
            المراقبة تُعدّ التصنيف والإجراء المقترح. يصلك الملف حين يُرفع للقرار.
          </Banner>
        ) : null}

        {status === "AWAITING_DECISION" || status === "DECIDED" ? (
          <Card title="التصنيف والإجراء المقترح">
            <DescriptionList
              items={[
                { label: "التصنيف", value: data.classification ? classificationLabels[data.classification] : null },
                { label: "الإجراء المقترح", value: data.proposed_action },
              ]}
            />
          </Card>
        ) : null}

        {status === "AWAITING_DECISION" && canDecide ? (
          <Card title="قرار المدير التنفيذي">
            <Banner kind="info">ملف سري ينتظر قرارك. القرار لك وحدك ولا يُفوَّض.</Banner>
            <Field label="نص القرار" required error={errors.text}>
              <Textarea aria-label="نص القرار" value={decisionForm.text} onChange={(event) => onDecisionFormChange?.({ ...decisionForm, text: event.target.value })} disabled={deciding} />
            </Field>
            <Checkbox label="خصم من الراتب" description="قرار يدوي لا آلي: يُسجَّل في الخصومات." checked={decisionForm.withDeduction} onCheckedChange={(withDeduction) => onDecisionFormChange?.({ ...decisionForm, withDeduction })} disabled={deciding} />
            {decisionForm.withDeduction ? (
              <>
                <Field label="مبلغ الخصم" required error={errors["deduction.amount"]}>
                  <MoneyInput aria-label="مبلغ الخصم" value={decisionForm.amount} onChange={(event) => onDecisionFormChange?.({ ...decisionForm, amount: event.target.value })} disabled={deciding} />
                </Field>
                <Field label="سبب الخصم" required hint={`حتى ${isolate(COMMENT_MAX)} حرفاً.`} error={errors["deduction.reason"]}>
                  <Textarea aria-label="سبب الخصم" maxLength={COMMENT_MAX} value={decisionForm.reason} onChange={(event) => onDecisionFormChange?.({ ...decisionForm, reason: event.target.value })} disabled={deciding} />
                </Field>
              </>
            ) : null}
            <div className="flex flex-col gap-2">
              <div>
                <Button variant="primary" size="lg" loading={deciding} disabled={!decisionComplete} onClick={onStartDecision}>
                  إصدار القرار
                </Button>
              </div>
              {decisionReason ? <p className="text-label text-fg-muted">{decisionReason}</p> : null}
            </div>
          </Card>
        ) : null}

        {status === "AWAITING_DECISION" && !canDecide ? (
          <Banner kind="warning" title="بانتظار قرار المدير التنفيذي">
            رُفع الملف للقرار ولا يُعدَّل. القرار للمدير التنفيذي وحده ولا تفويض فيه.
          </Banner>
        ) : null}

        {status === "DECIDED" && data.decision ? (
          <>
            <DecisionRecord badge={<StatusBadge entity="investigation" status="DECIDED" />} decidedBy={data.decision.decided_by?.name ?? "—"} decidedAt={data.decision.decided_at ?? ""} reason={data.decision.text} />
            {data.decision.deduction_id ? (
              <Card title="الخصم">
                <DescriptionList
                  items={[
                    { label: "المبلغ", value: deduction ? <span dir="ltr">{formatMoney(deduction.amount)}</span> : `خصم رقم ${isolate(`#${data.decision.deduction_id}`)}` },
                    { label: "السبب", value: deduction?.reason },
                  ]}
                />
              </Card>
            ) : null}
          </>
        ) : null}

        {completedStages.length > 0 ? (
          <Card title="ما جرى في المراحل">
            <ul className="flex flex-col divide-y divide-border">
              {completedStages.map((entry) => (
                <li key={entry.stage} className="flex flex-col gap-2 py-4 first:pt-0 last:pb-0">
                  <p className="text-body font-medium text-fg">{stageHeading(entry.stage ?? 1)}</p>
                  <p className="text-body text-fg">{entry.summary}</p>
                  <p className="text-caption text-fg-muted">{`${entry.done_by?.name ?? "—"}${entry.done_at ? ` · ${formatDateTime(entry.done_at)}` : ""}`}</p>
                  {(entry.attachments ?? []).length > 0 ? <AttachmentList attachments={(entry.attachments ?? []).map(toAttachment)} onDownload={() => {}} /> : null}
                </li>
              ))}
            </ul>
          </Card>
        ) : null}
      </div>

      <ReasonDialog
        open={closeDialog !== null}
        onOpenChange={(open) => (open ? undefined : onDismissClose?.())}
        title="إغلاق الملف بلا مخالفة؟"
        description="يُغلق الملف في مرحلته الحالية ولا تُكمل بقية المراحل. السبب يُحفظ في الملف ولا يُعدَّل."
        confirmLabel="إغلاق الملف"
        cancelLabel="تراجع"
        reason={closeDialog?.reason ?? ""}
        onReasonChange={(reason) => onCloseReasonChange?.(reason)}
        error={closeDialog?.errorCode ? errorMessage(closeDialog.errorCode) : undefined}
        loading={closeDialog?.loading}
        onConfirm={() => onConfirmClose?.()}
      />

      <ConfirmDialog
        open={submitConfirming}
        onOpenChange={(open) => (open ? undefined : onDismissSubmit?.())}
        title="رفع الملف للقرار؟"
        description={`يُرفع الملف إلى المدير التنفيذي بتصنيف «${submitForm.classification ? classificationLabels[submitForm.classification] : ""}» ولا يُعدَّل بعده.`}
        confirmLabel="رفع للقرار"
        cancelLabel="تراجع"
        loading={submitting}
        onConfirm={() => onConfirmSubmit?.()}
      />

      <ConfirmDialog
        open={decisionConfirming}
        onOpenChange={(open) => (open ? undefined : onDismissDecision?.())}
        title="إصدار القرار؟"
        description={`يُقفل الملف بقرارك${decisionForm.withDeduction && decisionForm.amount.trim() !== "" ? ` ومعه خصم ${isolate(`$${decisionForm.amount}`)}` : ""} ولا يُعدَّل. القرار لك وحدك ولا يُفوَّض.`}
        confirmLabel="إصدار القرار"
        cancelLabel="تراجع"
        loading={deciding}
        onConfirm={() => onConfirmDecision?.()}
      />
    </>
  );
}
