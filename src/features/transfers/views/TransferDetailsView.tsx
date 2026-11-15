"use client";

import { CheckCircle, PlusCircle, WarningCircle, XCircle } from "@phosphor-icons/react";
import { ActivityLog, type ActivityEvent } from "@/components/data/ActivityLog";
import { DescriptionList } from "@/components/data/DescriptionList";
import { StatusBadge } from "@/components/data/StatusBadge";
import { StockLine } from "@/components/data/StockLine";
import { PageHeader, type PageAction } from "@/components/layout/PageHeader";
import { Banner } from "@/components/ui/Banner";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ErrorState } from "@/components/ui/ErrorState";
import { NotFoundState } from "@/components/ui/NotFoundState";
import { ReasonDialog } from "@/components/ui/ReasonDialog";
import { Skeleton } from "@/components/ui/Skeleton";
import { errorMessage } from "@/lib/api/error-messages";
import type { Transfer, UserRef } from "@/lib/api/types";
import type { IsoDate } from "@/lib/calendar";
import { formatDateTime, formatQuantity, isolate } from "@/lib/format";
import type { Loadable } from "@/lib/loadable";

/** نافذة «إلغاء الصرف» المفتوحة: السبب المكتوب وحالة الطلب. null = مغلقة. */
export type TransferCancellation = { reason: string; loading?: boolean; /** رمز خطأ العقد (invalid_status وvalidation_failed…). */ errorCode?: string };

/**
 * محاولة تأكيد استلام رُفضت لأن الصرف مُلغى (المندوب أكّد بلا اتصال بعد الإلغاء؛ المزامنة تردّ `REJECTED` بالرمز `transfer_cancelled`).
 * غير موجودة في `Transfer` بعد: تُغذّيها الحاوية حين يوفّرها الباك (docs/backend-requests.md §11.4).
 */
export type RejectedReceipt = { by: UserRef; at: string };

type TransferDetailsViewProps = {
  /** `GET /transfers/{id}`. خطأ `not_found` يعرض «غير موجود أو خارج نطاقك». */
  transfer: Loadable<Transfer>;
  /** صلاحية الإلغاء (`transfers.create` في العقد): اللوجستي، قبل التأكيد. */
  canCancel: boolean;
  cancellation?: TransferCancellation | null;
  onStartCancel?: () => void;
  onCancelReasonChange?: (reason: string) => void;
  onConfirmCancel?: () => void;
  onDismissCancel?: () => void;
  /** تأكيدات استلام رُفضت بعد الإلغاء: حدث في السجل وشريط ينبّه اللوجستي. */
  rejectedReceipts?: readonly RejectedReceipt[];
  /** حدّ تنبيه الصرف غير المؤكَّد بالساعات: `transfer_unconfirmed_alert_hours` من `GET /settings` (48). */
  overdueHours?: number;
  /** اليوم (بتوقيت دمشق) لحالة الدفعات. يُمرَّر فيبقى الـ view نقياً. */
  today: IsoDate;
  /** يفتح طلب العينات المرتبط (W10). بدونه يظهر رقمه نصاً. */
  onOpenSampleRequest?: (sampleRequestId: number) => void;
  /** ينقل إلى W06: الحل بعد رفض تأكيد هو صرف جديد (الإلغاء نهائي). */
  onNewTransfer?: () => void;
  onBack?: () => void;
  onRetry?: () => void;
};

const locationTypeLabels = { WAREHOUSE: "مستودع", AGENT: "وكيل", REP: "مندوب" } as const;

/** أحداث السجل من حقول الصرف نفسها (لا endpoint للسجل): الأحدث أولاً. */
function buildEvents(transfer: Transfer, rejected: readonly RejectedReceipt[]): ActivityEvent[] {
  const events: ActivityEvent[] = [];
  if (transfer.created_at) {
    events.push({ id: "created", icon: PlusCircle, sentence: `أنشأ ${transfer.created_by?.name ?? "—"} الصرف إلى ${transfer.to_location?.name ?? "—"}`, at: transfer.created_at });
  }
  if (transfer.received_at) {
    events.push({ id: "received", icon: CheckCircle, sentence: `أكّد ${transfer.received_by?.name ?? "المستلم"} الاستلام`, at: transfer.received_at });
  }
  if (transfer.cancelled_at) {
    events.push({ id: "cancelled", icon: XCircle, sentence: `ألغى ${transfer.cancelled_by?.name ?? "—"} الصرف`, reason: transfer.cancel_reason ?? undefined, at: transfer.cancelled_at });
  }
  rejected.forEach((attempt, index) => {
    events.push({ id: `rejected-${index}`, icon: WarningCircle, sentence: `رُفض تأكيد استلام ${attempt.by.name ?? "المستلم"} لأن الصرف مُلغى`, at: attempt.at });
  });
  return events.sort((a, b) => Date.parse(b.at) - Date.parse(a.at));
}

/**
 * تفاصيل الصرف (W08): المرجع وحالته، والمستلم ومن صرف، والأسطر بدفعاتها، وطلب العينات المرتبط، والسجل. للوجستي «إلغاء الصرف» بسبب إلزامي ما دام
 * بالطريق (تعود الكمية للمستودع). الصرف الذي مضى عليه الحدّ بالطريق يُعلَّم بشريط تحذير. التأكيد من المستلم لا من هنا.
 */
export function TransferDetailsView({
  transfer,
  canCancel,
  cancellation = null,
  onStartCancel,
  onCancelReasonChange,
  onConfirmCancel,
  onDismissCancel,
  rejectedReceipts = [],
  overdueHours = 48,
  today,
  onOpenSampleRequest,
  onNewTransfer,
  onBack,
  onRetry,
}: TransferDetailsViewProps) {
  if (transfer.status === "loading") {
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

  if (transfer.status === "error") {
    return transfer.code === "not_found" ? <NotFoundState onBack={onBack} /> : <ErrorState code={transfer.code} onRetry={onRetry} />;
  }

  const data = transfer.data;
  const lines = data.lines ?? [];
  const inTransit = data.status === "IN_TRANSIT";
  const overdue = inTransit && (data.hours_in_transit ?? 0) >= overdueHours;

  const actions: PageAction[] = inTransit && canCancel ? [{ id: "cancel", label: "إلغاء الصرف", danger: true, onSelect: () => onStartCancel?.() }] : [];

  const sampleRequestLink =
    data.sample_request_id === null || data.sample_request_id === undefined ? null : onOpenSampleRequest ? (
      <button type="button" onClick={() => onOpenSampleRequest(data.sample_request_id as number)} className="text-link hover:underline">
        {`طلب عينات ${isolate(`#${data.sample_request_id}`)}`}
      </button>
    ) : (
      `طلب عينات ${isolate(`#${data.sample_request_id}`)}`
    );

  return (
    <>
      <PageHeader
        title={data.reference ?? "تفاصيل الصرف"}
        badge={data.status ? <StatusBadge entity="transfer" status={data.status} /> : undefined}
        description={`من ${data.from_location?.name ?? "—"} إلى ${data.to_location?.name ?? "—"} · أنشأه ${data.created_by?.name ?? "—"}${data.created_at ? ` · ${formatDateTime(data.created_at)}` : ""}`}
        actions={actions}
      />

      <div className="flex flex-col gap-4">
        {overdue ? (
          <Banner kind="warning" title="لم يؤكّد المستلم الاستلام">
            {`مضى على الصرف ${isolate(data.hours_in_transit ?? 0)} ساعة بالطريق (الحدّ ${isolate(overdueHours)} ساعة). تابع مع ${data.to_location?.name ?? "المستلم"}.`}
          </Banner>
        ) : null}

        {data.status === "CANCELLED" ? (
          <Banner kind="info" title="أُلغي الصرف">
            {`ألغاه ${data.cancelled_by?.name ?? "—"}${data.cancel_reason ? ` بسبب «${data.cancel_reason}»` : ""}. عادت الكمية إلى ${data.from_location?.name ?? "المستودع"}.`}
          </Banner>
        ) : null}

        {data.status === "CANCELLED" && rejectedReceipts.length > 0 ? (
          <Banner
            kind="warning"
            title="رُفض تأكيد استلام بعد الإلغاء"
            action={
              onNewTransfer ? (
                <Button variant="ghost" size="sm" onClick={onNewTransfer}>
                  صرف جديد
                </Button>
              ) : undefined
            }
          >
            {`رُفض تأكيد استلام ${rejectedReceipts.map((attempt) => attempt.by.name).join(" و")} لأن الصرف مُلغى. إن كانت البضاعة معه فعلاً فأنشئ صرفاً جديداً.`}
          </Banner>
        ) : null}

        <Card title="التفاصيل">
          <DescriptionList
            items={[
              { label: "المستلم", value: data.to_location ? `${data.to_location.name} · ${data.to_location.type ? locationTypeLabels[data.to_location.type] : ""}` : null },
              { label: "المستودع", value: data.from_location?.name },
              { label: "أنشأه", value: data.created_by?.name },
              { label: "الوقت", value: data.created_at ? formatDateTime(data.created_at) : null },
              { label: "ساعات بالطريق", value: inTransit && data.hours_in_transit !== null && data.hours_in_transit !== undefined ? `${isolate(data.hours_in_transit)} ساعة` : null },
              { label: "طلب العينات", value: sampleRequestLink },
              { label: "ملاحظة", value: data.note },
            ]}
          />
        </Card>

        <Card title="الأسطر">
          <div className="divide-y divide-border overflow-hidden rounded-lg border border-border bg-surface">
            {lines.map((line, index) => (
              <StockLine key={`${line.batch?.id}-${index}`} item={line.item ?? {}} batch={line.batch} quantity={line.quantity ?? 0} today={today} />
            ))}
          </div>
          <p className="text-body text-fg-muted">{`المجموع: ${formatQuantity(data.total_quantity ?? 0, "علبة")}`}</p>
        </Card>

        <Card title="السجل">
          <ActivityLog events={buildEvents(data, rejectedReceipts)} />
        </Card>
      </div>

      <ReasonDialog
        open={cancellation !== null}
        onOpenChange={(open) => (open ? undefined : onDismissCancel?.())}
        title={`إلغاء الصرف ${data.reference ?? ""}؟`}
        description="تعود الكميات إلى المستودع. يُلغى الصرف لخطأ في الإدخال وقبل تأكيد الاستلام فقط."
        confirmLabel="إلغاء الصرف"
        cancelLabel="تراجع"
        reason={cancellation?.reason ?? ""}
        onReasonChange={(reason) => onCancelReasonChange?.(reason)}
        error={cancellation?.errorCode ? errorMessage(cancellation.errorCode) : undefined}
        danger
        loading={cancellation?.loading}
        onConfirm={() => onConfirmCancel?.()}
      />
    </>
  );
}
