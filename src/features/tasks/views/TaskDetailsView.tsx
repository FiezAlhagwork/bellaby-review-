"use client";

import { ArrowsLeftRight, CheckCircle, Gavel, PaperPlaneTilt, PlusCircle, XCircle } from "@phosphor-icons/react";
import { ActivityLog, type ActivityEvent } from "@/components/data/ActivityLog";
import { DecisionPanel, DecisionRecord } from "@/components/data/DecisionPanel";
import { DescriptionList } from "@/components/data/DescriptionList";
import { StatusBadge } from "@/components/data/StatusBadge";
import { taskSourceLabels } from "@/components/data/task-sources";
import { PageHeader } from "@/components/layout/PageHeader";
import { AttachmentList } from "@/components/ui/AttachmentList";
import { Badge } from "@/components/ui/Badge";
import { Banner } from "@/components/ui/Banner";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Combobox } from "@/components/ui/Combobox";
import { Dialog } from "@/components/ui/Dialog";
import { ErrorState } from "@/components/ui/ErrorState";
import { Field } from "@/components/ui/Field";
import { FileUpload, type UploadFile } from "@/components/ui/FileUpload";
import { MoneyInput } from "@/components/ui/MoneyInput";
import { NotFoundState } from "@/components/ui/NotFoundState";
import type { Option } from "@/components/ui/OptionList";
import { RadioCard, RadioGroup } from "@/components/ui/Radio";
import { ReasonDialog } from "@/components/ui/ReasonDialog";
import { Skeleton } from "@/components/ui/Skeleton";
import { Textarea } from "@/components/ui/Textarea";
import { errorMessage } from "@/lib/api/error-messages";
import type { Task, UserRef } from "@/lib/api/types";
import { formatDateTime, isolate } from "@/lib/format";
import type { Loadable } from "@/lib/loadable";

type Submission = NonNullable<Task["submissions"]>[number];

/** نافذة «تسليم»: `POST /tasks/{id}/submissions { note, attachments }`. */
export type SubmitForm = { note: string; attachments: UploadFile[] };
/** نافذة «إعادة إسناد»: `POST /tasks/{id}/reassign { assignee_id, reason }`. */
export type ReassignForm = { assigneeId: string | null; reason: string };
/** قرار المتأخرة: `POST /tasks/{id}/resolve`. NONE = «لا إجراء»، لا طلب. */
export type ResolveAction = "DEDUCT" | "DEDUCT_AND_CLOSE" | "CLOSE" | "NONE";
export type ResolveForm = { action: ResolveAction | null; amount: string; reason: string };
export const emptyResolveForm: ResolveForm = { action: null, amount: "", reason: "" };

type TaskDetailsViewProps = {
  task: Loadable<Task>;
  /** أنا المكلَّف: «بدء» و«تسليم». */
  isAssignee: boolean;
  /** أنا المُسند: قرار التسليم و«إعادة إسناد». */
  isAssigner: boolean;
  /** `tasks.resolve_overdue`: قرار المهمة المتأخرة (المدير التنفيذي، والمفوَّض للإغلاق دون خصم). */
  canResolveOverdue: boolean;
  /** الخصم للمدير التنفيذي وحده، والتفويض لا يشمله (القرار 15). */
  canDeduct: boolean;
  onStart?: () => void;
  submit: SubmitForm | null;
  onSubmitChange: (form: SubmitForm | null) => void;
  onSubmitFiles?: (files: File[]) => void;
  onConfirmSubmit?: () => void;
  onAccept?: (submission: Submission) => void;
  /** نافذة سبب الرفض: null مغلقة. */
  rejectReason: string | null;
  onRejectReasonChange: (reason: string | null) => void;
  onConfirmReject?: () => void;
  reassign: ReassignForm | null;
  onReassignChange: (form: ReassignForm | null) => void;
  /** `GET /me/assignees` دون المكلَّف الحالي. */
  assignees: readonly UserRef[];
  onConfirmReassign?: () => void;
  resolve: ResolveForm;
  onResolveChange: (form: ResolveForm) => void;
  onConfirmResolve?: () => void;
  busy?: boolean;
  errors?: Readonly<Record<string, string>>;
  /** رمز خطأ بلا حقل (`invalid_status`). */
  actionError?: string;
  onOpenRequest?: (id: number) => void;
  onOpenReport?: (id: number) => void;
  onDownload?: (uploadId: string) => void;
  onBack?: () => void;
  onRetry?: () => void;
};

const MONEY_PATTERN = /^\d+(\.\d{1,2})?$/;
const attachmentLimits = { accept: "application/pdf,image/*,.xlsx,.docx", acceptLabel: "PDF أو صورة أو Word أو Excel", maxSize: 10 * 1024 * 1024 } as const;
const toAttachment = (file: { upload_id?: string; name?: string }, index: number) => ({ id: file.upload_id ?? String(index), name: file.name ?? "مرفق" });

const resolveOptions: { value: ResolveAction; title: string; description: string; deduct: boolean }[] = [
  { value: "DEDUCT", title: "خصم وتبقى مفتوحة", description: "يُسجَّل خصم على المكلَّف، وتبقى المهمة عنده حتى يسلّمها.", deduct: true },
  { value: "DEDUCT_AND_CLOSE", title: "خصم وإغلاق", description: "يُسجَّل خصم وتُغلق المهمة بقرار.", deduct: true },
  { value: "CLOSE", title: "إغلاق دون خصم", description: "تُغلق المهمة بقرار وسبب، بلا خصم.", deduct: false },
  { value: "NONE", title: "لا إجراء", description: "تبقى المهمة كما هي متأخرة عند المكلَّف.", deduct: false },
];

const resolutionLabel = (task: Task) => (task.resolution?.deduction_id ? (task.status === "RESOLVED" ? "خصم وإغلاق" : "خصم") : "إغلاق دون خصم");

/** السجل مشتق من حقول المهمة: الإسناد، وإعادات الإسناد، والتسليمات وقراراتها، والقرار. لا endpoint سجل للمهام (§98). الأحدث أولاً. */
function buildEvents(task: Task): ActivityEvent[] {
  const events: ActivityEvent[] = [];
  if (task.created_at) events.push({ id: "created", icon: PlusCircle, sentence: `أسندها ${task.assigned_by?.name ?? "—"}`, at: task.created_at });
  (task.reassignments ?? []).forEach((entry, index) => {
    if (entry.at) events.push({ id: `re-${index}`, icon: ArrowsLeftRight, sentence: `أعاد ${entry.by?.name ?? "—"} إسنادها من ${entry.from?.name ?? "—"} إلى ${entry.to?.name ?? "—"}`, reason: entry.reason, at: entry.at });
  });
  (task.submissions ?? []).forEach((entry) => {
    if (entry.submitted_at) events.push({ id: `s-${entry.id}`, icon: PaperPlaneTilt, sentence: `سلّمها ${task.assignee?.name ?? "—"}`, reason: entry.note ?? undefined, at: entry.submitted_at });
    if (entry.decision && entry.decided_at)
      events.push({ id: `d-${entry.id}`, icon: entry.decision === "ACCEPTED" ? CheckCircle : XCircle, sentence: `${entry.decision === "ACCEPTED" ? "قبل" : "رفض"} ${entry.decided_by?.name ?? "—"} التسليم`, reason: entry.reject_reason ?? undefined, at: entry.decided_at });
  });
  if (task.resolution?.at) events.push({ id: "resolved", icon: Gavel, sentence: `قرّر ${task.resolution.by?.name ?? "—"}: ${resolutionLabel(task)}`, reason: task.resolution.reason, at: task.resolution.at, onBehalf: Boolean(task.resolution.on_behalf_of) });
  return events.sort((a, b) => b.at.localeCompare(a.at));
}

/**
 * تفاصيل المهمة (G07): الحالة وعلامة التأخير، والوصف والمرفقات، والمصدر، وسجل التسليمات وإعادات الإسناد، والسجل.
 * المكلَّف يبدأ ويسلّم (ملاحظة ومرفقات). المُسند يقبل التسليم أو يرفضه بسبب، ويعيد الإسناد. المهمة المتأخرة يقرّر فيها المدير التنفيذي (القراران 1 و14)،
 * والمفوَّض يغلقها دون خصم فقط.
 */
export function TaskDetailsView({
  task,
  isAssignee,
  isAssigner,
  canResolveOverdue,
  canDeduct,
  onStart,
  submit,
  onSubmitChange,
  onSubmitFiles,
  onConfirmSubmit,
  onAccept,
  rejectReason,
  onRejectReasonChange,
  onConfirmReject,
  reassign,
  onReassignChange,
  assignees,
  onConfirmReassign,
  resolve,
  onResolveChange,
  onConfirmResolve,
  busy = false,
  errors = {},
  actionError,
  onOpenRequest,
  onOpenReport,
  onDownload,
  onBack,
  onRetry,
}: TaskDetailsViewProps) {
  if (task.status === "loading") {
    return (
      <div className="flex flex-col gap-4" aria-busy="true">
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-56 w-full" />
      </div>
    );
  }
  if (task.status === "error") return task.code === "not_found" ? <NotFoundState onBack={onBack} /> : <ErrorState code={task.code} onRetry={onRetry} />;

  const data = task.data;
  const status = data.status ?? "NEW";
  const open = status === "NEW" || status === "IN_PROGRESS";
  const submissions = [...(data.submissions ?? [])].sort((a, b) => (b.submitted_at ?? "").localeCompare(a.submitted_at ?? ""));
  const pending = submissions.find((entry) => entry.decision === null || entry.decision === undefined);
  const lastRejected = status === "IN_PROGRESS" ? submissions.find((entry) => entry.decision === "REJECTED") : undefined;

  const actions = [
    ...(isAssigner && open ? [{ id: "reassign", label: "إعادة إسناد", disabled: busy, onSelect: () => onReassignChange({ assigneeId: null, reason: "" }) }] : []),
    ...(isAssignee && status === "NEW" ? [{ id: "start", label: "بدء", primary: true, disabled: busy, onSelect: () => onStart?.() }] : []),
    ...(isAssignee && status === "IN_PROGRESS" ? [{ id: "submit", label: "تسليم", primary: true, disabled: busy, onSelect: () => onSubmitChange({ note: "", attachments: [] }) }] : []),
  ];

  const selected = resolveOptions.find((option) => option.value === resolve.action);
  const amountInvalid = selected?.deduct === true && !MONEY_PATTERN.test(resolve.amount.trim());
  const resolveHint =
    resolve.action === null
      ? "اختر القرار."
      : resolve.action === "NONE"
        ? "«لا إجراء» لا يُرسل شيئاً: تبقى المهمة متأخرة."
        : amountInvalid
          ? `اكتب مبلغ الخصم بالدولار، مثل ${isolate("25.00")}.`
          : resolve.reason.trim() === ""
            ? "اكتب سبب القرار."
            : null;

  const submitHint = submit === null ? null : submit.note.trim() === "" && submit.attachments.length === 0 ? "اكتب ملاحظة أو أرفق ملفاً." : submit.attachments.some((file) => file.status === "uploading") ? "انتظر انتهاء رفع المرفقات." : null;
  const reassignHint = reassign === null ? null : reassign.assigneeId === null ? "اختر المكلَّف الجديد." : reassign.reason.trim() === "" ? "اكتب سبب إعادة الإسناد." : null;
  const assigneeOptions: Option[] = assignees.flatMap((user) => (user.id === undefined || user.id === data.assignee?.id ? [] : [{ value: String(user.id), label: user.name ?? "" }]));

  return (
    <>
      <PageHeader
        title={data.title ?? "مهمة"}
        badge={
          <span className="flex flex-wrap items-center gap-1">
            <StatusBadge entity="task" status={status} />
            {data.is_overdue ? <Badge color="danger">متأخرة</Badge> : null}
          </span>
        }
        description={`أسندها ${data.assigned_by?.name ?? "—"} إلى ${data.assignee?.name ?? "—"}${data.created_at ? ` · ${formatDateTime(data.created_at)}` : ""}`}
        actions={actions.length > 0 ? actions : undefined}
      />

      <div className="flex flex-col gap-4">
        {actionError ? (
          <Banner kind={actionError === "invalid_status" ? "warning" : "danger"} title={actionError === "invalid_status" ? "تغيّرت حالة المهمة" : "تعذّر تنفيذ الإجراء"}>
            {errorMessage(actionError)}
          </Banner>
        ) : null}

        {lastRejected && isAssignee ? (
          <Banner kind="warning" title="رُفض التسليم">
            {`${lastRejected.decided_by?.name ?? "المُسند"}: ${lastRejected.reject_reason ?? "—"} عدّل وسلّم من جديد.`}
          </Banner>
        ) : null}

        {status === "SUBMITTED" && !isAssigner ? (
          <Banner kind="info" title="بانتظار المراجعة">
            {`سُلّمت المهمة وتنتظر قرار ${data.assigned_by?.name ?? "المُسند"}.`}
          </Banner>
        ) : null}

        {status === "SUBMITTED" && isAssigner && pending ? (
          <DecisionPanel
            summary={`سلّم ${data.assignee?.name ?? "—"} المهمة${pending.submitted_at ? ` في ${formatDateTime(pending.submitted_at)}` : ""}. اقبل التسليم أو ارفضه بسبب فتعود إليه.`}
            approveLabel="قبول التسليم"
            approving={busy}
            onApprove={() => onAccept?.(pending)}
            onReject={() => onRejectReasonChange("")}
          />
        ) : null}

        {status === "APPROVED" ? (
          <Banner kind="success" title="معتمدة">
            {data.on_time === false ? "قُبل التسليم بعد الموعد." : "قُبل التسليم في الموعد."}
          </Banner>
        ) : null}

        {data.is_overdue && open && canResolveOverdue ? (
          <Card title="قرار المهمة المتأخرة">
            <div className="flex flex-col gap-4">
              <Field label="القرار" required error={errors.action}>
                <RadioGroup aria-label="قرار المهمة المتأخرة" value={resolve.action} onValueChange={(action) => onResolveChange({ ...resolve, action })} disabled={busy}>
                  {resolveOptions.map((option) => (
                    <RadioCard key={option.value} value={option.value} title={option.title} description={option.description} disabled={option.deduct && !canDeduct} reason={option.deduct && !canDeduct ? "الخصم للمدير التنفيذي وحده، والتفويض لا يشمله." : undefined} />
                  ))}
                </RadioGroup>
              </Field>
              {selected?.deduct ? (
                <Field label="مبلغ الخصم" required error={errors.deduction_amount}>
                  <MoneyInput aria-label="مبلغ الخصم" value={resolve.amount} invalid={resolve.amount.trim() !== "" && amountInvalid} onChange={(event) => onResolveChange({ ...resolve, amount: event.target.value })} disabled={busy} />
                </Field>
              ) : null}
              {resolve.action !== null && resolve.action !== "NONE" ? (
                <Field label="السبب" required error={errors.reason}>
                  <Textarea aria-label="سبب القرار" value={resolve.reason} onChange={(event) => onResolveChange({ ...resolve, reason: event.target.value })} disabled={busy} />
                </Field>
              ) : null}
              <div className="flex flex-col gap-2">
                <div>
                  <Button variant="primary" loading={busy} disabled={resolveHint !== null} onClick={onConfirmResolve}>
                    إصدار القرار
                  </Button>
                </div>
                {resolveHint ? <p className="text-label text-fg-muted">{resolveHint}</p> : null}
              </div>
            </div>
          </Card>
        ) : null}

        {data.resolution?.at ? (
          <DecisionRecord badge={<Badge color="neutral">{resolutionLabel(data)}</Badge>} decidedBy={data.resolution.by?.name ?? "—"} decidedAt={data.resolution.at} reason={data.resolution.reason} onBehalf={Boolean(data.resolution.on_behalf_of)} />
        ) : null}

        <Card title="المهمة">
          <div className="flex flex-col gap-4">
            <DescriptionList
              items={[
                { label: "الموعد", value: data.due_at ? <span className={data.is_overdue ? "text-danger" : undefined}>{formatDateTime(data.due_at)}</span> : null },
                { label: "الأولوية", value: data.priority ? <StatusBadge entity="priority" status={data.priority} /> : null },
                {
                  label: "المصدر",
                  value: (
                    <span className="flex flex-wrap items-center gap-2">
                      <span>{data.source ? taskSourceLabels[data.source] : "—"}</span>
                      {data.department_request_id ? (
                        <Button variant="ghost" size="sm" onClick={() => onOpenRequest?.(data.department_request_id ?? 0)}>
                          {`الطلب ${isolate(`#${data.department_request_id}`)}`}
                        </Button>
                      ) : null}
                      {data.periodic_report_id ? (
                        <Button variant="ghost" size="sm" onClick={() => onOpenReport?.(data.periodic_report_id ?? 0)}>
                          {`التقرير ${isolate(`#${data.periodic_report_id}`)}`}
                        </Button>
                      ) : null}
                    </span>
                  ),
                },
                { label: "المكلَّف", value: data.assignee?.name },
              ]}
            />
            <p className="text-body text-fg">{data.description ?? "بلا وصف."}</p>
            {(data.attachments ?? []).length > 0 ? <AttachmentList attachments={(data.attachments ?? []).map(toAttachment)} onDownload={(id) => onDownload?.(id)} /> : null}
          </div>
        </Card>

        {submissions.length > 0 ? (
          <Card title="التسليمات">
            <ul className="flex flex-col divide-y divide-border">
              {submissions.map((entry) => (
                <li key={entry.id} className="flex flex-col gap-2 py-4 first:pt-0 last:pb-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-body font-medium text-fg">{entry.submitted_at ? formatDateTime(entry.submitted_at) : "—"}</span>
                    {entry.decision === "ACCEPTED" ? <Badge color="success">مقبول</Badge> : entry.decision === "REJECTED" ? <Badge color="danger">مرفوض</Badge> : <Badge color="warning">بانتظار المراجعة</Badge>}
                  </div>
                  {entry.note ? <p className="text-body text-fg">{entry.note}</p> : null}
                  {(entry.attachments ?? []).length > 0 ? <AttachmentList attachments={(entry.attachments ?? []).map(toAttachment)} onDownload={(id) => onDownload?.(id)} /> : null}
                  {entry.decision === "REJECTED" && entry.reject_reason ? <p className="text-label text-fg-muted">{`سبب الرفض: ${entry.reject_reason}`}</p> : null}
                </li>
              ))}
            </ul>
          </Card>
        ) : null}

        {(data.reassignments ?? []).length > 0 ? (
          <Card title="إعادات الإسناد">
            <ul className="flex flex-col divide-y divide-border">
              {(data.reassignments ?? []).map((entry, index) => (
                <li key={index} className="flex flex-col gap-1 py-3 first:pt-0 last:pb-0">
                  <span className="text-body text-fg">{`من ${entry.from?.name ?? "—"} إلى ${entry.to?.name ?? "—"}`}</span>
                  <span className="text-label text-fg-muted">{entry.reason}</span>
                  <span className="text-caption text-fg-muted">{`${entry.by?.name ?? "—"}${entry.at ? ` · ${formatDateTime(entry.at)}` : ""}`}</span>
                </li>
              ))}
            </ul>
          </Card>
        ) : null}

        <Card title="السجل">
          <ActivityLog events={buildEvents(data)} />
        </Card>
      </div>

      <Dialog
        open={submit !== null}
        onOpenChange={(next) => (next ? undefined : onSubmitChange(null))}
        dismissible={!busy}
        size="md"
        title="تسليم المهمة"
        description={`تُرسل إلى ${data.assigned_by?.name ?? "المُسند"} للمراجعة.`}
        actions={[
          <Button key="cancel" variant="secondary" disabled={busy} onClick={() => onSubmitChange(null)}>
            تراجع
          </Button>,
          <Button key="send" variant="primary" loading={busy} disabled={submitHint !== null} onClick={() => onConfirmSubmit?.()}>
            تسليم
          </Button>,
        ]}
      >
        {submit ? (
          <div className="flex flex-col gap-4">
            <Field label="الملاحظة" optional error={errors.note}>
              <Textarea aria-label="ملاحظة التسليم" value={submit.note} onChange={(event) => onSubmitChange({ ...submit, note: event.target.value })} disabled={busy} />
            </Field>
            <Field label="المرفقات" optional hint={`${attachmentLimits.acceptLabel}.`} error={errors.attachments}>
              <FileUpload multiple files={submit.attachments} accept={attachmentLimits.accept} acceptLabel={attachmentLimits.acceptLabel} maxSize={attachmentLimits.maxSize} onSelect={(files) => onSubmitFiles?.(files)} onRemove={(id) => onSubmitChange({ ...submit, attachments: submit.attachments.filter((file) => file.id !== id) })} disabled={busy} />
            </Field>
            {submitHint ? <p className="text-label text-fg-muted">{submitHint}</p> : null}
          </div>
        ) : null}
      </Dialog>

      <Dialog
        open={reassign !== null}
        onOpenChange={(next) => (next ? undefined : onReassignChange(null))}
        dismissible={!busy}
        size="sm"
        title="إعادة إسناد"
        description="تعود المهمة «جديدة» عند المكلَّف الجديد، ولا يُحسب على السابق ما بعدها."
        actions={[
          <Button key="cancel" variant="secondary" disabled={busy} onClick={() => onReassignChange(null)}>
            تراجع
          </Button>,
          <Button key="save" variant="primary" loading={busy} disabled={reassignHint !== null} onClick={() => onConfirmReassign?.()}>
            إعادة الإسناد
          </Button>,
        ]}
      >
        {reassign ? (
          <div className="flex flex-col gap-4">
            <Field label="المكلَّف الجديد" required error={errors.assignee_id}>
              <Combobox aria-label="المكلَّف الجديد" placeholder="اختر من فريقك" options={assigneeOptions} value={reassign.assigneeId} onValueChange={(assigneeId) => onReassignChange({ ...reassign, assigneeId })} disabled={busy} />
            </Field>
            <Field label="السبب" required error={errors.reason}>
              <Textarea aria-label="سبب إعادة الإسناد" value={reassign.reason} onChange={(event) => onReassignChange({ ...reassign, reason: event.target.value })} disabled={busy} />
            </Field>
            {reassignHint ? <p className="text-label text-fg-muted">{reassignHint}</p> : null}
          </div>
        ) : null}
      </Dialog>

      <ReasonDialog
        open={rejectReason !== null}
        onOpenChange={(next) => (next ? undefined : onRejectReasonChange(null))}
        title="رفض التسليم؟"
        description={`تعود المهمة «قيد التنفيذ» عند ${data.assignee?.name ?? "المكلَّف"} ويرى السبب.`}
        confirmLabel="رفض التسليم"
        cancelLabel="تراجع"
        reason={rejectReason ?? ""}
        onReasonChange={(reason) => onRejectReasonChange(reason)}
        error={errors.reason}
        danger
        loading={busy}
        onConfirm={() => onConfirmReject?.()}
      />
    </>
  );
}
