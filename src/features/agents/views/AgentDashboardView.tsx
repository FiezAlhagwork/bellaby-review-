"use client";

import { Package } from "@phosphor-icons/react";
import { KpiTile } from "@/components/data/KpiTile";
import { Grid } from "@/components/layout/Grid";
import { PageHeader } from "@/components/layout/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { Banner } from "@/components/ui/Banner";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { Skeleton } from "@/components/ui/Skeleton";
import type { Delivery, Money, Receivable, Transfer } from "@/lib/api/types";
import { dayMonthLabel, type IsoDate } from "@/lib/calendar";
import { countPhrase, formatMoney, formatQuantity, formatRelative } from "@/lib/format";
import type { Loadable } from "@/lib/loadable";

/**
 * ما تجمعه الحاوية للوحة الوكيل. `GET /dashboard/summary` بلا حقول في العقد (§110)، فتُحسب من القوائم المعرّفة:
 * - `receivable`: صف الوكيل من `GET /receivables` (المستحق والمتأخر وعدد التسليمات المتأخرة).
 * - `pendingTransfers`: `GET /transfers?status=IN_TRANSIT`.
 * - `upcomingPayments`: `GET /deliveries?status=UNPAID` مرتّبة بـ`expected_payment_date`، المتأخر أولاً.
 * - `salesEstimate` و`newCustomers`: لا قائمة تعطيهما؛ null حتى يُعرّف `DashboardSummary`.
 */
export type AgentOverview = {
  salesEstimate: Money | null;
  newCustomers: number | null;
  receivable: Receivable | null;
  pendingTransfers: readonly Transfer[];
  upcomingPayments: readonly Delivery[];
};

type AgentDashboardViewProps = {
  overview: Loadable<AgentOverview>;
  /** الآن (UTC) لعمر الصرف. */
  now: string;
  today: IsoDate;
  onOpenTransfer?: (transfer: Transfer) => void;
  onOpenDelivery?: (delivery: Delivery) => void;
  onRetry?: () => void;
};

const transferForms = ["صرف واحد", "صرفان", "صرفيات"] as const;
const deliveryForms = ["تسليم متأخر", "تسليمان متأخران", "تسليمات متأخرة"] as const;

/**
 * لوحة الوكيل (A01): المبيعات هذا الشهر (القيمة التقديرية)، والمستحق، والمتأخر، والعملاء الجدد.
 * ثم «صرف بانتظار تأكيدك» (لا يدخل رصيدك قبل تأكيده) و«سداد مستحق قريباً» والمتأخر أولاً.
 */
export function AgentDashboardView({ overview, now, today, onOpenTransfer, onOpenDelivery, onRetry }: AgentDashboardViewProps) {
  const ready = overview.status === "ready" ? overview.data : null;
  const loading = overview.status === "loading";
  const tileState = loading ? "loading" : "ready";
  const receivable = ready?.receivable ?? null;
  const pending = ready?.pendingTransfers ?? [];
  const payments = ready?.upcomingPayments ?? [];
  const overdueCount = receivable?.overdue_deliveries ?? 0;

  return (
    <>
      <PageHeader title="الرئيسية" description="مؤشرات هذا الشهر، وما ينتظرك." />

      {overview.status === "error" ? (
        <ErrorState code={overview.code} onRetry={onRetry} />
      ) : (
        <div className="flex flex-col gap-6">
          {pending.length > 0 ? (
            <Banner kind="warning" title={`${countPhrase(pending.length, transferForms)} بانتظار تأكيدك`}>
              لا تدخل الكميات رصيدك قبل أن تؤكد استلامها.
            </Banner>
          ) : null}

          <Grid cols={{ base: 2, desktop: 4 }} gap={4}>
            <KpiTile label="المبيعات هذا الشهر" value={ready?.salesEstimate ? formatMoney(ready.salesEstimate) : "—"} context="القيمة التقديرية" info="بأسعار الأصناف وقت التسليم. القيمة الفعلية عند التحصيل." state={ready && ready.salesEstimate === null ? "empty" : tileState} size="md" />
            <KpiTile label="المستحق" value={receivable?.due_value ? formatMoney(receivable.due_value) : "—"} context={receivable?.paid_value ? `المدفوع ${formatMoney(receivable.paid_value)}` : undefined} state={tileState} size="md" />
            <KpiTile label="المتأخر" value={receivable?.overdue_value ? formatMoney(receivable.overdue_value) : "—"} context={overdueCount > 0 ? countPhrase(overdueCount, deliveryForms) : "لا تسليمات متأخرة"} state={tileState} size="md" />
            <KpiTile label="العملاء الجدد" value={ready?.newCustomers !== null && ready?.newCustomers !== undefined ? formatQuantity(ready.newCustomers) : "—"} context="هذا الشهر" state={ready && ready.newCustomers === null ? "empty" : tileState} size="md" />
          </Grid>

          <Grid cols={{ base: 1, desktop: 2 }} gap={4}>
            <Card title="صرف بانتظار تأكيدك">
              {loading ? (
                <Skeleton className="h-24 w-full" />
              ) : pending.length === 0 ? (
                <EmptyState icon={Package} title="لا صرف بانتظارك" description="يظهر هنا الصرف من المستودع حتى تؤكد استلامه." />
              ) : (
                <ul className="flex flex-col divide-y divide-border">
                  {pending.map((transfer) => (
                    <li key={transfer.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                      <span className="flex min-w-0 flex-1 flex-col">
                        <span className="text-body text-fg">{`${transfer.reference ?? ""} · ${formatQuantity(transfer.total_quantity ?? 0)} علبة`}</span>
                        <span className="text-label text-fg-muted">{`${transfer.from_location?.name ?? ""} · ${transfer.created_at ? formatRelative(transfer.created_at, now) : ""}`}</span>
                      </span>
                      <Button variant="secondary" size="sm" onClick={() => onOpenTransfer?.(transfer)}>
                        تأكيد
                      </Button>
                    </li>
                  ))}
                </ul>
              )}
            </Card>

            <Card title="سداد مستحق قريباً">
              {loading ? (
                <Skeleton className="h-24 w-full" />
              ) : payments.length === 0 ? (
                <p className="text-body text-fg-muted">لا سداد مستحق قريباً.</p>
              ) : (
                <ul className="flex flex-col divide-y divide-border">
                  {payments.map((delivery) => {
                    const overdue = delivery.is_payment_overdue === true;
                    return (
                      <li key={delivery.id}>
                        <button type="button" className="flex w-full items-center gap-3 py-3 text-start" onClick={() => onOpenDelivery?.(delivery)}>
                          <span className="flex min-w-0 flex-1 flex-col">
                            <span className="truncate text-body text-fg">{delivery.customer?.name ?? "—"}</span>
                            <span className={overdue ? "text-label text-danger" : "text-label text-fg-muted"}>
                              {`${delivery.reference ?? ""} · ${delivery.expected_payment_date ? (overdue ? `تأخر منذ ${dayMonthLabel(delivery.expected_payment_date)}` : `يستحق ${delivery.expected_payment_date === today ? "اليوم" : dayMonthLabel(delivery.expected_payment_date)}`) : "—"}`}
                            </span>
                          </span>
                          <span className="flex flex-col items-end gap-1">
                            <span className="text-body text-fg tabular-nums">{delivery.estimated_value ? formatMoney(delivery.estimated_value) : "—"}</span>
                            {overdue ? <Badge color="danger">متأخر</Badge> : null}
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </Card>
          </Grid>
        </div>
      )}
    </>
  );
}
