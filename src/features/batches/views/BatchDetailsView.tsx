"use client";

import { Clock, Cube, LockOpen, Prohibit } from "@phosphor-icons/react";
import { ActivityLog, type ActivityEvent } from "@/components/data/ActivityLog";
import { QuantityCell, TextCell } from "@/components/data/cells";
import { DataTable, type DataTableColumn } from "@/components/data/DataTable";
import { DescriptionList } from "@/components/data/DescriptionList";
import { StatusBadge } from "@/components/data/StatusBadge";
import { itemTypeLabels } from "@/components/data/item-types";
import { PageHeader, type PageAction } from "@/components/layout/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { Banner } from "@/components/ui/Banner";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { NotFoundState } from "@/components/ui/NotFoundState";
import { ReasonDialog } from "@/components/ui/ReasonDialog";
import { Skeleton } from "@/components/ui/Skeleton";
import { errorMessage } from "@/lib/api/error-messages";
import type { BalanceLine, Batch, RecallEvent } from "@/lib/api/types";
import { dayLabel } from "@/lib/calendar";
import { formatQuantity, isolate } from "@/lib/format";
import type { Loadable } from "@/lib/loadable";

/** نافذة السبب المفتوحة: إيقاف أو فكّ، مع السبب المكتوب وحالة الطلب. null = مغلقة. */
export type BatchReasonDialogState = {
  kind: "suspend" | "unsuspend";
  reason: string;
  loading?: boolean;
  /** رمز خطأ العقد: 409 (موقوفة مسبقاً أو غير موقوفة) وvalidation_failed. */
  errorCode?: string;
};

type BatchDetailsViewProps = {
  /** `GET /batches/{id}`. خطأ `not_found` يعرض «غير موجود أو خارج نطاقك». */
  batch: Loadable<Batch>;
  /** `GET /stock/balances?batch_id=`: رصيدها في كل موقع. يُحمَّل مستقلاً عن بيانات الدفعة. */
  balances: Loadable<readonly BalanceLine[]>;
  /** `GET /recalls?batch_id=`: سجل الإيقاف والفك، الأحدث أولاً. */
  recalls: Loadable<readonly RecallEvent[]>;
  /** `batches.suspend`: اللوجستي والمدير التنفيذي. */
  canSuspend: boolean;
  /** `batches.unsuspend`: المدير التنفيذي وحده (يشمله التفويض). */
  canUnsuspend: boolean;
  dialog?: BatchReasonDialogState | null;
  onStartSuspend?: () => void;
  onStartUnsuspend?: () => void;
  onDialogReasonChange?: (reason: string) => void;
  onConfirmDialog?: () => void;
  onDismissDialog?: () => void;
  /** يفتح تقرير تتبع السحب (W19). */
  onOpenTrace?: () => void;
  onBack?: () => void;
  onRetry?: () => void;
  onRetryBalances?: () => void;
  onRetryRecalls?: () => void;
  /** مهلة تنبيه قرب الانتهاء بالأيام (`expiry_alert_days`). الافتراضي 60. */
  expiryAlertDays?: number;
};

const locationTypeLabels = { WAREHOUSE: "مستودع", AGENT: "وكيل", REP: "مندوب" } as const;

/** أحداث السجل من `RecallEvent`: «أوقف …» و«فكّ … الإيقاف»، وبالتفويض يُذكر المفوِّض. */
function buildEvents(events: readonly RecallEvent[]): ActivityEvent[] {
  return events.flatMap((event) => {
    if (event.id === undefined || !event.at) return [];
    const actor = event.by?.name ?? "—";
    const delegated = event.on_behalf_of !== null && event.on_behalf_of !== undefined;
    const suspend = event.type === "SUSPEND";
    return [
      {
        id: event.id,
        icon: suspend ? Prohibit : LockOpen,
        sentence: suspend ? `أوقف ${actor} الدفعة` : `فكّ ${actor} إيقاف الدفعة`,
        reason: event.reason,
        at: event.at,
        onBehalf: delegated,
      },
    ];
  });
}

/**
 * تفاصيل الدفعة (W18): بياناتها، ورصيدها في كل موقع، وسجل الإيقاف والفك. الإيقاف للوجستي والمدير التنفيذي بسبب إلزامي،
 * وفكّه للمدير التنفيذي وحده: عند غيره يظهر الزر معطّلاً وسببه ظاهر. الإيقاف لا ينقص رصيداً (القرار 2).
 */
export function BatchDetailsView({
  batch,
  balances,
  recalls,
  canSuspend,
  canUnsuspend,
  dialog = null,
  onStartSuspend,
  onStartUnsuspend,
  onDialogReasonChange,
  onConfirmDialog,
  onDismissDialog,
  onOpenTrace,
  onBack,
  onRetry,
  onRetryBalances,
  onRetryRecalls,
  expiryAlertDays = 60,
}: BatchDetailsViewProps) {
  if (batch.status === "loading") {
    return (
      <div className="flex flex-col gap-4" aria-busy="true">
        <div className="flex flex-col gap-2 pb-4">
          <Skeleton className="h-8 w-56" />
          <Skeleton className="h-5 w-96 max-w-full" />
        </div>
        <Skeleton className="h-44 w-full" />
        <Skeleton className="h-56 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (batch.status === "error") {
    return batch.code === "not_found" ? <NotFoundState onBack={onBack} /> : <ErrorState code={batch.code} onRetry={onRetry} />;
  }

  const data = batch.data;
  const suspended = data.status === "SUSPENDED";
  const days = data.days_to_expiry;
  const batchNo = data.batch_no ? isolate(data.batch_no) : "";

  const actions: PageAction[] = [
    ...(onOpenTrace ? [{ id: "trace", label: "تقرير التتبع", onSelect: () => onOpenTrace() }] : []),
    ...(!suspended && canSuspend ? [{ id: "suspend", label: "إيقاف الدفعة", danger: true, onSelect: () => onStartSuspend?.() }] : []),
    ...(suspended && (canUnsuspend || canSuspend)
      ? [
          canUnsuspend
            ? { id: "unsuspend", label: "فك الإيقاف", primary: true, onSelect: () => onStartUnsuspend?.() }
            : { id: "unsuspend", label: "فك الإيقاف", primary: true, disabled: true, reason: "فك الإيقاف للمدير التنفيذي وحده.", onSelect: () => {} },
        ]
      : []),
  ];

  const balanceRows = balances.status === "ready" ? balances.data : [];
  const total = balanceRows.reduce((sum, line) => sum + (line.quantity ?? 0), 0);

  const balanceColumns: DataTableColumn<BalanceLine>[] = [
    { key: "location", header: "الموقع", cell: (row) => <TextCell value={row.location?.name} />, priority: "high", role: "primary" },
    { key: "type", header: "النوع", cell: (row) => <TextCell value={row.location?.type ? locationTypeLabels[row.location.type] : null} />, width: "w-28", priority: "high" },
    { key: "quantity", header: "الكمية", cell: (row) => <QuantityCell value={row.quantity} />, align: "end", width: "w-32", priority: "high" },
    { key: "in-transit", header: "مصروف بالطريق", cell: (row) => (row.in_transit_out ? <QuantityCell value={row.in_transit_out} /> : <span className="text-fg-muted">—</span>), align: "end", width: "w-40" },
  ];

  const expiryNote =
    days === undefined ? null : days < 0 ? (
      <Badge color="danger">{`منتهية منذ ${isolate(-days)} يوماً`}</Badge>
    ) : days <= expiryAlertDays ? (
      <Badge color="warning" icon={Clock}>{`تنتهي بعد ${isolate(days)} يوماً`}</Badge>
    ) : null;

  return (
    <>
      <PageHeader
        title={`دفعة ${batchNo}`}
        badge={data.status ? <StatusBadge entity="batch" status={data.status} /> : undefined}
        description={`${data.item?.name ?? "—"}${data.item?.type ? ` · ${itemTypeLabels[data.item.type]}` : ""}`}
        actions={actions}
      />

      <div className="flex flex-col gap-4">
        {suspended ? (
          <Banner kind="danger" title="الدفعة موقوفة">
            {`${data.suspended_reason ?? "—"} حركتها متوقفة في كل المواقع، ولا ينقص أي رصيد.`}
          </Banner>
        ) : null}

        {suspended && !canUnsuspend ? (
          <Banner kind="info">فك الإيقاف للمدير التنفيذي وحده. إن لزم فكّها فارفع الأمر إليه.</Banner>
        ) : null}

        <Card title="بيانات الدفعة">
          <DescriptionList
            items={[
              { label: "الصنف", value: data.item?.name },
              { label: "رقم الدفعة", value: data.batch_no ? <span dir="ltr" className="tabular-nums">{data.batch_no}</span> : null },
              {
                label: "تاريخ الانتهاء",
                value: data.expiry_date ? (
                  <span className="flex flex-wrap items-center gap-2">
                    <span>{dayLabel(data.expiry_date)}</span>
                    {expiryNote}
                  </span>
                ) : null,
              },
              { label: "الحالة", value: data.status ? <StatusBadge entity="batch" status={data.status} /> : null },
              { label: "الكمية الكلية (المستلمة)", value: data.received_total === undefined ? null : <QuantityCell value={data.received_total} unit="علبة" /> },
              { label: "في المستودع", value: data.warehouse_on_hand === undefined ? null : <QuantityCell value={data.warehouse_on_hand} unit="علبة" /> },
              ...(suspended ? [{ label: "سبب الإيقاف", value: data.suspended_reason }] : []),
            ]}
          />
        </Card>

        <Card title="الكمية في كل موقع" action={balances.status === "ready" && balanceRows.length > 0 ? <span className="text-label text-fg-muted">{`المجموع ${isolate(formatQuantity(total))}`}</span> : undefined}>
          <DataTable
            label="رصيد الدفعة في المواقع"
            columns={balanceColumns}
            rows={balanceRows}
            getRowKey={(row) => row.location?.id ?? row.location?.name ?? ""}
            loading={balances.status === "loading"}
            error={balances.status === "error" ? { code: balances.code, onRetry: onRetryBalances } : undefined}
            empty={<EmptyState className="py-6" icon={Cube} title="لا رصيد في أي موقع" description="لم يبقَ من هذه الدفعة شيء في المستودع ولا عند وكيل أو مندوب." />}
          />
        </Card>

        <Card title="سجل الإيقاف والفك">
          {recalls.status === "error" ? <ErrorState code={recalls.code} onRetry={onRetryRecalls} /> : <ActivityLog events={recalls.status === "ready" ? buildEvents(recalls.data) : []} loading={recalls.status === "loading"} />}
        </Card>
      </div>

      <ReasonDialog
        open={dialog !== null}
        onOpenChange={(open) => (open ? undefined : onDismissDialog?.())}
        title={dialog?.kind === "unsuspend" ? `فك إيقاف الدفعة ${batchNo}؟` : `إيقاف الدفعة ${batchNo}؟`}
        description={
          dialog?.kind === "unsuspend"
            ? "تعود الدفعة إلى الحركة في كل المواقع، ويصل إشعار لكل من يحمل منها."
            : "ستتوقف حركتها في كل المواقع، ولا ينقص أي رصيد. يبقى مسموحاً ما يعيدها إلى المستودع أو يوثّقها، ويصل تنبيه لمن يحمل منها."
        }
        confirmLabel={dialog?.kind === "unsuspend" ? "فك الإيقاف" : "إيقاف الدفعة"}
        cancelLabel="تراجع"
        reason={dialog?.reason ?? ""}
        onReasonChange={(reason) => onDialogReasonChange?.(reason)}
        error={dialog?.errorCode ? errorMessage(dialog.errorCode) : undefined}
        danger={dialog?.kind !== "unsuspend"}
        loading={dialog?.loading}
        onConfirm={() => onConfirmDialog?.()}
      />
    </>
  );
}
