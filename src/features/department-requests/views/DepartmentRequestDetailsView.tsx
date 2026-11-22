"use client";

import { DecisionPanel, DecisionRecord } from "@/components/data/DecisionPanel";
import { departmentLabels } from "@/components/data/departments";
import { DescriptionList } from "@/components/data/DescriptionList";
import { StatusBadge } from "@/components/data/StatusBadge";
import { PageHeader } from "@/components/layout/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { Banner } from "@/components/ui/Banner";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Dialog } from "@/components/ui/Dialog";
import { ErrorState } from "@/components/ui/ErrorState";
import { Field } from "@/components/ui/Field";
import { NotFoundState } from "@/components/ui/NotFoundState";
import { ReasonDialog } from "@/components/ui/ReasonDialog";
import { Skeleton } from "@/components/ui/Skeleton";
import { Textarea } from "@/components/ui/Textarea";
import { errorMessage } from "@/lib/api/error-messages";
import type { DepartmentRequest } from "@/lib/api/types";
import { dayLabel } from "@/lib/calendar";
import { countPhrase, formatDateTime, isolate } from "@/lib/format";
import type { Loadable } from "@/lib/loadable";

/** النافذة المفتوحة: «قبول» برد اختياري، أو «رفض» بسبب إلزامي، أو «إغلاق منجزاً» برد اختياري. */
export type RequestDialog = { kind: "accept" | "reject" | "complete"; reply: string } | null;

type DepartmentRequestDetailsViewProps = {
  request: Loadable<DepartmentRequest>;
  /** أنا في القسم المطلوب منه: أرى المهام المربوطة. */
  isRecipient: boolean;
  /** رئيس القسم المطلوب منه: يقبل ويرفض ويغلق. */
  canDecide: boolean;
  dialog: RequestDialog;
  onDialogChange: (dialog: RequestDialog) => void;
  /** `POST /decision` أو `/complete` بحسب النافذة. */
  onConfirm?: () => void;
  /** يفتح «إسناد مهمة» (G08) مربوطة بالطلب (`department_request_id`). */
  onCreateTask?: () => void;
  /** يفتح التقرير المصدر (G12). */
  onOpenReport?: (id: number) => void;
  busy?: boolean;
  errors?: Readonly<Record<string, string>>;
  /** رمز خطأ بلا حقل (`invalid_status`). */
  actionError?: string;
  onBack?: () => void;
  onRetry?: () => void;
};

const taskForms = ["مهمة مربوطة", "مهمتان مربوطتان", "مهام مربوطة"] as const;

/**
 * تفاصيل الطلب بين الأقسام (G10): الوصف، والقسمان، والتقرير المصدر، والموعد، والرد. رئيس القسم المطلوب منه يقبل أو يرفض بسبب،
 * ثم ينشئ مهاماً مربوطة ويغلقه منجزاً. القسم الطالب يرى الحالة والرد فقط، لا المهام (القرار 11).
 */
export function DepartmentRequestDetailsView({ request, isRecipient, canDecide, dialog, onDialogChange, onConfirm, onCreateTask, onOpenReport, busy = false, errors = {}, actionError, onBack, onRetry }: DepartmentRequestDetailsViewProps) {
  if (request.status === "loading") {
    return (
      <div className="flex flex-col gap-4" aria-busy="true">
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }
  if (request.status === "error") return request.code === "not_found" ? <NotFoundState onBack={onBack} /> : <ErrorState code={request.code} onRetry={onRetry} />;

  const data = request.data;
  const status = data.status ?? "OPEN";
  const from = data.from_department ? departmentLabels[data.from_department] : "—";
  const to = data.to_department ? departmentLabels[data.to_department] : "—";
  const decided = status === "DONE" || status === "REJECTED";
  const linked = data.linked_tasks_count ?? 0;

  return (
    <>
      <PageHeader
        title={`طلب ${isolate(`#${data.id}`)} من ${from} إلى ${to}`}
        badge={
          <span className="flex flex-wrap items-center gap-1">
            <StatusBadge entity="departmentRequest" status={status} />
            {data.is_overdue ? <Badge color="danger">متأخر</Badge> : null}
          </span>
        }
        description={data.created_at ? `أُرسل ${formatDateTime(data.created_at)}` : undefined}
      />

      <div className="flex flex-col gap-4">
        {actionError ? (
          <Banner kind={actionError === "invalid_status" ? "warning" : "danger"} title={actionError === "invalid_status" ? "تغيّرت حالة الطلب" : "تعذّر تنفيذ الإجراء"}>
            {errorMessage(actionError)}
          </Banner>
        ) : null}

        {data.is_overdue ? (
          <Banner kind="warning" title="تجاوز الطلب موعده">
            {`كان موعده ${data.due_date ? dayLabel(data.due_date) : "—"} ولم يُنجز بعد.`}
          </Banner>
        ) : null}

        {status === "OPEN" && canDecide ? (
          <DecisionPanel summary={`يطلب قسم ${from} من قسمك هذا الطلب. اقبله لتبدأ تنفيذه، أو ارفضه بسبب يصل إلى القسم الطالب.`} approveLabel="قبول" approving={busy} onApprove={() => onDialogChange({ kind: "accept", reply: "" })} onReject={() => onDialogChange({ kind: "reject", reply: "" })} />
        ) : null}

        {status === "OPEN" && !canDecide ? (
          <Banner kind="info" title="بانتظار رد القسم المطلوب منه">
            {`يقبله رئيس قسم ${to} أو يرفضه.`}
          </Banner>
        ) : null}

        {decided ? (
          <DecisionRecord badge={<StatusBadge entity="departmentRequest" status={status} />} decidedBy={data.handled_by?.name ?? "—"} decidedAt={data.updated_at ?? ""} reason={data.reply ?? undefined} />
        ) : null}

        <Card title="الطلب">
          <div className="flex flex-col gap-4">
            <p className="text-body text-fg">{data.description}</p>
            <DescriptionList
              items={[
                { label: "القسم الطالب", value: from },
                { label: "القسم المطلوب منه", value: to },
                { label: "الموعد", value: data.due_date ? <span className={data.is_overdue ? "text-danger" : undefined}>{dayLabel(data.due_date)}</span> : "بلا موعد" },
                {
                  label: "التقرير المصدر",
                  value: data.source_report_id ? (
                    <Button variant="ghost" size="sm" onClick={() => onOpenReport?.(data.source_report_id ?? 0)}>
                      {`التقرير ${isolate(`#${data.source_report_id}`)}`}
                    </Button>
                  ) : null,
                },
                ...(status === "IN_PROGRESS" ? [{ label: "الرد", value: data.reply }] : []),
              ]}
            />
          </div>
        </Card>

        {isRecipient && status === "IN_PROGRESS" ? (
          <Card
            title="المهام المربوطة"
            action={
              canDecide ? (
                <Button variant="secondary" size="sm" onClick={onCreateTask}>
                  إنشاء مهمة مربوطة
                </Button>
              ) : undefined
            }
          >
            <div className="flex flex-col gap-4">
              <p className="text-body text-fg">{linked > 0 ? `${countPhrase(linked, taskForms)} بهذا الطلب.` : "لا مهام مربوطة بعد. وزّع التنفيذ على فريقك بمهام مربوطة."}</p>
              {canDecide ? (
                <div>
                  <Button variant="primary" disabled={busy} onClick={() => onDialogChange({ kind: "complete", reply: "" })}>
                    إغلاق منجزاً
                  </Button>
                </div>
              ) : null}
            </div>
          </Card>
        ) : null}

        {!isRecipient && status === "IN_PROGRESS" ? (
          <Banner kind="info" title="قيد التنفيذ">
            {`قبله قسم ${to}${data.handled_by?.name ? ` (${data.handled_by.name})` : ""}. يصلك حين يُغلق منجزاً.`}
          </Banner>
        ) : null}
      </div>

      <Dialog
        open={dialog?.kind === "accept" || dialog?.kind === "complete"}
        onOpenChange={(next) => (next ? undefined : onDialogChange(null))}
        dismissible={!busy}
        size="sm"
        title={dialog?.kind === "complete" ? "إغلاق الطلب منجزاً؟" : "قبول الطلب؟"}
        description={dialog?.kind === "complete" ? `يصل إلى قسم ${from} أن الطلب أُنجز، ومعه ردك إن كتبته.` : "يصير الطلب «قيد التنفيذ»، وتنشئ له مهاماً مربوطة."}
        actions={[
          <Button key="cancel" variant="secondary" disabled={busy} onClick={() => onDialogChange(null)}>
            تراجع
          </Button>,
          <Button key="ok" variant="primary" loading={busy} onClick={() => onConfirm?.()}>
            {dialog?.kind === "complete" ? "إغلاق منجزاً" : "قبول"}
          </Button>,
        ]}
      >
        {dialog && dialog.kind !== "reject" ? (
          <Field label="الرد" optional error={errors.reply}>
            <Textarea aria-label="الرد" value={dialog.reply} onChange={(event) => onDialogChange({ ...dialog, reply: event.target.value })} disabled={busy} />
          </Field>
        ) : null}
      </Dialog>

      <ReasonDialog
        open={dialog?.kind === "reject"}
        onOpenChange={(next) => (next ? undefined : onDialogChange(null))}
        title="رفض الطلب؟"
        description={`يصل السبب إلى قسم ${from}، ولا يُنفَّذ الطلب.`}
        confirmLabel="رفض الطلب"
        cancelLabel="تراجع"
        reasonLabel="السبب"
        reason={dialog?.kind === "reject" ? dialog.reply : ""}
        onReasonChange={(reply) => onDialogChange({ kind: "reject", reply })}
        error={errors.reply}
        danger
        loading={busy}
        onConfirm={() => onConfirm?.()}
      />
    </>
  );
}
