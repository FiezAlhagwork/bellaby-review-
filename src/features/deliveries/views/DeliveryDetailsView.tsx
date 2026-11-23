"use client";

import { CheckCircle, Gavel, HourglassMedium, PlusCircle } from "@phosphor-icons/react";
import { ActivityLog, type ActivityEvent } from "@/components/data/ActivityLog";
import { BatchCell, MoneyCell, QuantityCell, TextCell } from "@/components/data/cells";
import { DataTable, type DataTableColumn } from "@/components/data/DataTable";
import { DecisionRecord } from "@/components/data/DecisionPanel";
import { DescriptionList } from "@/components/data/DescriptionList";
import { StatusBadge } from "@/components/data/StatusBadge";
import { PageHeader } from "@/components/layout/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { Banner } from "@/components/ui/Banner";
import { Card } from "@/components/ui/Card";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Dialog } from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { RadioCard, RadioGroup } from "@/components/ui/Radio";
import { Textarea } from "@/components/ui/Textarea";
import { errorMessage } from "@/lib/api/error-messages";
import { ErrorState } from "@/components/ui/ErrorState";
import { NotFoundState } from "@/components/ui/NotFoundState";
import { Skeleton } from "@/components/ui/Skeleton";
import type { Delivery, DeliveryLine } from "@/lib/api/types";
import { daysBetween, type IsoDate } from "@/lib/calendar";
import { countPhrase, formatDate, formatDateTime, formatMoney, isolate } from "@/lib/format";
import type { Loadable } from "@/lib/loadable";

type RequestType = "CANCEL" | "WRITE_OFF";

/** نافذة الوكيل المفتوحة: تأكيد التحصيل الكامل، أو طلب إلغاء أو شطب بسبب إلزامي. */
export type DeliveryDialog = { kind: "collect" } | { kind: "request"; type: RequestType | null; reason: string } | null;

type DeliveryDetailsViewProps = {
  /** `GET /deliveries/{id}`. خطأ `not_found` يعرض «غير موجود أو خارج نطاقك». */
  delivery: Loadable<Delivery>;
  /** `deliveries.collect` (الوكيل صاحب التسليم): «تأكيد التحصيل» و«طلب إلغاء أو شطب» لغير المسدد. غائب في M06. */
  canCollect?: boolean;
  /** «مرتجع» (A12) حين يبقى قابل للإرجاع. */
  canReturn?: boolean;
  dialog?: DeliveryDialog;
  onDialogChange?: (dialog: DeliveryDialog) => void;
  /** `POST /collect` أو `/request-approval` بحسب النافذة. */
  onConfirm?: () => void;
  onReturn?: () => void;
  busy?: boolean;
  /** `validation_failed` للنافذة (`type`، `reason`). */
  errors?: Readonly<Record<string, string>>;
  /** رمز بلا حقل: `invalid_status` (لم يعد غير مسدد). */
  actionError?: string;
  /** اليوم (بتوقيت دمشق): لأيام التأخر. يُمرَّر فيبقى الـ view نقياً. */
  today: IsoDate;
  /** رجوع إلى القائمة (من «غير موجود»). */
  onBack?: () => void;
  onRetry?: () => void;
};

const dayForms = ["يوم", "يومين", "أيام"] as const;
const requestLabels = { CANCEL: "إلغاء", WRITE_OFF: "شطب" } as const;
const requestHints = {
  CANCEL: "التسليم لم يحدث: تعود البضاعة إلى رصيد الوكيل عند الاعتماد.",
  WRITE_OFF: "التسليم حدث ولن يُحصَّل: يُشطب عند الاعتماد.",
} as const;

/** أحداث السجل من حقول التسليم نفسها (لا endpoint للسجل): الأحدث أولاً. */
function buildEvents(delivery: Delivery): ActivityEvent[] {
  const events: ActivityEvent[] = [];
  if (delivery.delivered_at) {
    events.push({ id: "created", icon: PlusCircle, sentence: `سجّل ${delivery.created_by?.name ?? "—"} التسليم إلى ${delivery.customer?.name ?? "—"}`, at: delivery.delivered_at });
  }
  if (delivery.collected_at) {
    events.push({ id: "collected", icon: CheckCircle, sentence: `أكّد ${delivery.created_by?.name ?? "الوكيل"} تحصيل ${delivery.estimated_value ? formatMoney(delivery.estimated_value) : "القيمة"} كاملةً`, at: delivery.collected_at });
  }
  if (delivery.pending_request?.requested_at && delivery.pending_request.type) {
    events.push({
      id: "request",
      icon: HourglassMedium,
      sentence: `طلب ${delivery.created_by?.name ?? "الوكيل"} ${requestLabels[delivery.pending_request.type]} التسليم`,
      reason: delivery.pending_request.reason,
      at: delivery.pending_request.requested_at,
    });
  }
  if (delivery.decision?.decided_at && delivery.decision.type && delivery.decision.outcome) {
    const { type, outcome, decided_by: by, reason, on_behalf_of: onBehalf } = delivery.decision;
    events.push({
      id: "decision",
      icon: Gavel,
      sentence: `${outcome === "APPROVED" ? "اعتمد" : "رفض"} ${by?.name ?? "المدير التنفيذي"} طلب ${requestLabels[type]} التسليم`,
      reason: reason ?? undefined,
      at: delivery.decision.decided_at,
      onBehalf: Boolean(onBehalf),
    });
  }
  return events.sort((a, b) => Date.parse(b.at) - Date.parse(a.at));
}

const lineColumns: DataTableColumn<DeliveryLine>[] = [
  { key: "item", header: "الصنف", cell: (row) => <TextCell value={row.item?.name} />, priority: "high", role: "primary" },
  { key: "batch", header: "الدفعة", cell: (row) => <BatchCell batch={row.batch} />, width: "w-72" },
  { key: "quantity", header: "الكمية", cell: (row) => <QuantityCell value={row.quantity} unit="علبة" />, align: "end", width: "w-28", priority: "high" },
  { key: "price", header: "السعر", cell: (row) => <MoneyCell value={row.unit_price} />, align: "end", width: "w-24" },
  { key: "value", header: "القيمة", cell: (row) => <MoneyCell value={row.line_value} />, align: "end", width: "w-28", priority: "high" },
  { key: "accepted", header: "مرتجع مقبول", cell: (row) => <QuantityCell value={row.returned_accepted} />, align: "end", width: "w-28" },
  { key: "pending", header: "مرتجع معلّق", cell: (row) => <QuantityCell value={row.returned_pending} />, align: "end", width: "w-28" },
  { key: "returnable", header: "قابل للإرجاع", cell: (row) => <QuantityCell value={row.returnable_quantity} />, align: "end", width: "w-28", priority: "high" },
];

/**
 * تفاصيل التسليم (A10 · M06) للقراءة: العميل والوكيل، والأسطر بالسعر المنسوخ والقيمة والمرتجع المقبول والمعلّق والقابل للإرجاع، وموعد السداد وحالته،
 * والطلب المعلّق (إلغاء أو شطب) وقراره، والسجل. بلا أزرار: التحصيل وطلب الإلغاء أو الشطب للوكيل، وقرارهما للمدير التنفيذي (يشمله التفويض).
 * وللوكيل (A10) بأعلام الصلاحية: «تأكيد التحصيل» الكامل (لا دفعات جزئية، والوقت لحظة التأكيد على الخادم)، و«مرتجع»، و«طلب إلغاء أو شطب» بسبب.
 */
export function DeliveryDetailsView({ delivery, today, canCollect = false, canReturn = false, dialog = null, onDialogChange, onConfirm, onReturn, busy = false, errors = {}, actionError, onBack, onRetry }: DeliveryDetailsViewProps) {
  if (delivery.status === "loading") {
    return (
      <div className="flex flex-col gap-4" aria-busy="true">
        <div className="flex flex-col gap-2 pb-4">
          <Skeleton className="h-8 w-56" />
          <Skeleton className="h-5 w-96 max-w-full" />
        </div>
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-56 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (delivery.status === "error") {
    return delivery.code === "not_found" ? <NotFoundState onBack={onBack} /> : <ErrorState code={delivery.code} onRetry={onRetry} />;
  }

  const data = delivery.data;
  const lines = data.lines ?? [];
  const lateDays = data.expected_payment_date ? daysBetween(data.expected_payment_date, today) : 0;
  const pending = data.pending_request;
  const decision = data.decision;
  const open = data.status === "UNPAID" && !pending;
  const returnable = lines.some((line) => (line.returnable_quantity ?? 0) > 0);
  const actions = [
    ...(canCollect && open ? [{ id: "request", label: "طلب إلغاء أو شطب", onSelect: () => onDialogChange?.({ kind: "request", type: null, reason: "" }) }] : []),
    ...(canReturn && returnable && (data.status === "UNPAID" || data.status === "PAID") ? [{ id: "return", label: "مرتجع", onSelect: () => onReturn?.() }] : []),
    ...(canCollect && open ? [{ id: "collect", label: "تأكيد التحصيل", primary: true, onSelect: () => onDialogChange?.({ kind: "collect" }) }] : []),
  ];

  return (
    <>
      <PageHeader
        title={data.reference ?? "تفاصيل التسليم"}
        badge={data.status ? <StatusBadge entity="delivery" status={data.status} /> : undefined}
        description={`إلى ${data.customer?.name ?? "—"} · ${data.agent?.name ?? "—"}${data.delivered_at ? ` · ${formatDateTime(data.delivered_at)}` : ""}`}
        actions={actions.length > 0 ? actions : undefined}
      />

      <div className="flex flex-col gap-4">
        {actionError ? (
          <Banner kind="warning" title="تغيّرت حالة التسليم">
            {errorMessage(actionError)}
          </Banner>
        ) : null}

        {canCollect && data.status === "UNPAID" && decision?.outcome === "REJECTED" ? (
          <Banner kind="warning" title={`رُفض طلب ${decision.type ? requestLabels[decision.type] : ""}`}>
            عاد التسليم «غير مسدد». حصّله أو اطلب من جديد بسبب آخر.
          </Banner>
        ) : null}

        {canCollect && data.status === "CANCELLED" ? (
          <Banner kind="neutral" title="ألغي التسليم">
            عادت البضاعة إلى رصيدك.
          </Banner>
        ) : null}
        {data.is_payment_overdue ? (
          <Banner kind="warning" title="تجاوز موعد السداد">
            {`كان موعد السداد ${data.expected_payment_date ? formatDate(data.expected_payment_date) : "—"}، وتأخر ${countPhrase(lateDays, dayForms)} بلا تحصيل.`}
          </Banner>
        ) : null}

        {pending?.type ? (
          <Banner kind="info" title={`طلب ${requestLabels[pending.type]} بانتظار القرار`}>
            {`${requestHints[pending.type]} السبب: «${pending.reason}». القرار للمدير التنفيذي أو من فوّضه${canCollect ? "." : "، ولا قرار لك فيه."}`}
          </Banner>
        ) : null}

        {data.dispute_id ? (
          <Banner kind="info" title="أُحيل إلى القانوني">
            {`فُتح له ملف نزاع ${isolate(`#${data.dispute_id}`)} عند القسم القانوني.`}
          </Banner>
        ) : null}

        <Card title="التفاصيل">
          <DescriptionList
            items={[
              { label: "العميل", value: data.customer?.name },
              { label: "الوكيل", value: data.agent?.name },
              { label: "القيمة التقديرية", value: data.estimated_value ? <span dir="ltr">{formatMoney(data.estimated_value)}</span> : null },
              { label: "موعد السداد", value: data.expected_payment_date ? formatDate(data.expected_payment_date) : null },
              {
                label: "السداد",
                value: data.collected_at ? (
                  <span className="flex flex-wrap items-center gap-2">
                    <span>{formatDateTime(data.collected_at)}</span>
                    {data.paid_on_time === true ? <Badge color="success">في موعده</Badge> : data.paid_on_time === false ? <Badge color="warning">بعد الموعد</Badge> : null}
                  </span>
                ) : null,
              },
              { label: "سجّله", value: data.created_by?.name },
            ]}
          />
        </Card>

        <Card title="الأسطر">
          <DataTable label="أسطر التسليم" columns={lineColumns} rows={lines} getRowKey={(row) => row.id ?? `${row.item?.id}-${row.batch?.id}`} />
        </Card>

        {decision?.type && decision.outcome && decision.decided_by && decision.decided_at ? (
          <DecisionRecord
            badge={<Badge color={decision.outcome === "APPROVED" ? "success" : "danger"}>{`${decision.outcome === "APPROVED" ? "اعتُمد" : "رُفض"} ${requestLabels[decision.type]}`}</Badge>}
            decidedBy={decision.decided_by.name ?? "—"}
            decidedAt={decision.decided_at}
            reason={decision.reason ?? undefined}
            onBehalf={Boolean(decision.on_behalf_of)}
          />
        ) : null}

        <Card title="السجل">
          <ActivityLog events={buildEvents(data)} />
        </Card>
      </div>

      {onDialogChange ? (
        <>
          <ConfirmDialog
            open={dialog?.kind === "collect"}
            onOpenChange={(next) => (next ? undefined : onDialogChange(null))}
            title="تأكيد التحصيل؟"
            description={`تؤكد أنك حصّلت ${data.estimated_value ? formatMoney(data.estimated_value) : "القيمة"} كاملةً من ${data.customer?.name ?? "العميل"}. لا دفعات جزئية، ويُسجَّل وقت السداد لحظة التأكيد.`}
            confirmLabel="تأكيد التحصيل"
            cancelLabel="تراجع"
            loading={busy}
            onConfirm={() => onConfirm?.()}
          />
          <Dialog
            open={dialog?.kind === "request"}
            onOpenChange={(next) => (next ? undefined : onDialogChange(null))}
            dismissible={!busy}
            title="طلب إلغاء أو شطب"
            description="يصل إلى المدير التنفيذي، ويبقى التسليم «بانتظار الاعتماد» حتى قراره."
            actions={[
              <Button key="cancel" variant="secondary" disabled={busy} onClick={() => onDialogChange(null)}>
                تراجع
              </Button>,
              <Button key="ok" variant="primary" loading={busy} disabled={dialog?.kind !== "request" || !dialog.type || !dialog.reason.trim()} onClick={() => onConfirm?.()}>
                إرسال الطلب
              </Button>,
            ]}
          >
            {dialog?.kind === "request" ? (
              <div className="flex flex-col gap-4">
                <Field label="الطلب" required error={errors.type}>
                  <RadioGroup aria-label="الطلب" value={dialog.type} onValueChange={(type) => onDialogChange({ ...dialog, type })} invalid={Boolean(errors.type)} disabled={busy}>
                    <RadioCard value="CANCEL" title="إلغاء" description={requestHints.CANCEL} />
                    <RadioCard value="WRITE_OFF" title="شطب" description={requestHints.WRITE_OFF} />
                  </RadioGroup>
                </Field>
                <Field label="السبب" required error={errors.reason}>
                  <Textarea aria-label="السبب" value={dialog.reason} onChange={(event) => onDialogChange({ ...dialog, reason: event.target.value })} invalid={Boolean(errors.reason)} disabled={busy} />
                </Field>
              </div>
            ) : null}
          </Dialog>
        </>
      ) : null}
    </>
  );
}
