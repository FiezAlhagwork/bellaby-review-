"use client";

import { DescriptionList } from "@/components/data/DescriptionList";
import { StatusBadge } from "@/components/data/StatusBadge";
import { StockLine } from "@/components/data/StockLine";
import { PageHeader } from "@/components/layout/PageHeader";
import { Banner } from "@/components/ui/Banner";
import { Card } from "@/components/ui/Card";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { ErrorState } from "@/components/ui/ErrorState";
import { NotFoundState } from "@/components/ui/NotFoundState";
import { Skeleton } from "@/components/ui/Skeleton";
import { errorMessage } from "@/lib/api/error-messages";
import type { Transfer } from "@/lib/api/types";
import type { IsoDate } from "@/lib/calendar";
import { formatDateTime, formatQuantity } from "@/lib/format";
import type { Loadable } from "@/lib/loadable";

type AgentTransferViewProps = {
  /** `GET /transfers/{id}`. */
  transfer: Loadable<Transfer>;
  /** `transfers.receive`: الوكيل المستلم. */
  canReceive: boolean;
  /** نافذة تأكيد الاستلام مفتوحة. */
  confirming: boolean;
  onConfirmingChange: (open: boolean) => void;
  /** `POST /transfers/{id}/receive`: الاستلام كامل حصراً. */
  onReceive?: () => void;
  receiving?: boolean;
  /** `invalid_status`: أُلغي الصرف أو استُلم قبل التأكيد. */
  actionError?: string;
  today: IsoDate;
  expiryAlertDays?: number;
  onBack?: () => void;
  onRetry?: () => void;
};

/**
 * تفاصيل الصرف للوكيل (A03): الأسطر بالصنف والدفعة وانتهائها والكمية، ومن صرف ومتى، و«تأكيد الاستلام» كاملاً.
 * لا يدخل الصرف رصيدي قبل تأكيدي، ولا استلام جزئي (ملف الوكيل ص3). الملغى يظهر بسببه.
 */
export function AgentTransferView({ transfer, canReceive, confirming, onConfirmingChange, onReceive, receiving = false, actionError, today, expiryAlertDays, onBack, onRetry }: AgentTransferViewProps) {
  if (transfer.status === "loading") {
    return (
      <div className="flex flex-col gap-4" aria-busy="true">
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }
  if (transfer.status === "error") return transfer.code === "not_found" ? <NotFoundState onBack={onBack} /> : <ErrorState code={transfer.code} onRetry={onRetry} />;

  const data = transfer.data;
  const status = data.status ?? "IN_TRANSIT";
  const lines = data.lines ?? [];
  const total = formatQuantity(data.total_quantity ?? 0);

  return (
    <>
      <PageHeader
        title={`صرف ${data.reference ?? ""}`}
        badge={<StatusBadge entity="transfer" status={status} />}
        description={`من ${data.from_location?.name ?? "المستودع"} · ${data.created_at ? formatDateTime(data.created_at) : ""}`}
        actions={canReceive && status === "IN_TRANSIT" ? [{ id: "receive", label: "تأكيد الاستلام", primary: true, onSelect: () => onConfirmingChange(true) }] : undefined}
      />

      <div className="flex flex-col gap-4">
        {actionError ? (
          <Banner kind="warning" title="تغيّرت حالة الصرف">
            {errorMessage(actionError)}
          </Banner>
        ) : null}

        {status === "IN_TRANSIT" ? (
          <Banner kind="info" title="بانتظار تأكيدك">
            {`عدّ الكميات عند وصولها. التأكيد للصرف كاملاً (${total} علبة)، وبعده يدخل رصيدك.`}
          </Banner>
        ) : null}

        {status === "RECEIVED" ? (
          <Banner kind="success" title="استلمته ودخل رصيدك">
            {`أكّده ${data.received_by?.name ?? ""}${data.received_at ? ` · ${formatDateTime(data.received_at)}` : ""}.`}
          </Banner>
        ) : null}

        {status === "CANCELLED" ? (
          <Banner kind="neutral" title="ألغاه المستودع">
            {`${data.cancel_reason ?? "بلا سبب مكتوب."}${data.cancelled_by?.name ? ` · ${data.cancelled_by.name}` : ""}${data.cancelled_at ? ` · ${formatDateTime(data.cancelled_at)}` : ""}`}
          </Banner>
        ) : null}

        <Card title={`الأسطر · ${total} علبة`}>
          <div className="flex flex-col divide-y divide-border">
            {lines.map((line, index) =>
              line.item ? <StockLine key={`${line.item.id}-${line.batch?.id ?? index}`} item={line.item} batch={line.batch} quantity={line.quantity ?? 0} today={today} expiryAlertDays={expiryAlertDays} className="py-3 first:pt-0 last:pb-0" /> : null,
            )}
          </div>
        </Card>

        <Card title="الصرف">
          <DescriptionList
            items={[
              { label: "من", value: data.from_location?.name },
              { label: "صرفه", value: data.created_by?.name },
              { label: "وقت الصرف", value: data.created_at ? formatDateTime(data.created_at) : null },
              { label: "ملاحظة", value: data.note },
            ]}
          />
        </Card>
      </div>

      <ConfirmDialog
        open={confirming}
        onOpenChange={onConfirmingChange}
        title="تأكيد الاستلام؟"
        description={`تؤكد أنك استلمت الصرف ${data.reference ?? ""} كاملاً: ${total} علبة. يدخل رصيدك ولا يُعدَّل بعد التأكيد.`}
        confirmLabel="تأكيد الاستلام"
        cancelLabel="تراجع"
        loading={receiving}
        onConfirm={() => onReceive?.()}
      />
    </>
  );
}
