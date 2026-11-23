"use client";

import { Receipt } from "@phosphor-icons/react";
import { KpiTile } from "@/components/data/KpiTile";
import { Grid } from "@/components/layout/Grid";
import { PageHeader } from "@/components/layout/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { Skeleton } from "@/components/ui/Skeleton";
import type { Delivery, Receivable } from "@/lib/api/types";
import { dayMonthLabel, daysBetween, type IsoDate } from "@/lib/calendar";
import { countPhrase, formatMoney, formatPercent } from "@/lib/format";
import type { Loadable } from "@/lib/loadable";

/** ما تجمعه الحاوية: صف الوكيل من `GET /receivables`، وغير المسدد من `GET /deliveries?status=UNPAID` بالموعد والمتأخر أولاً. */
export type AgentReceivables = { summary: Receivable | null; unpaid: readonly Delivery[] };

type AgentReceivablesViewProps = {
  receivables: Loadable<AgentReceivables>;
  today: IsoDate;
  /** «قريب»: خلال 3 أيام. */
  dueSoonDays?: number;
  onOpenDelivery?: (delivery: Delivery) => void;
  onRetry?: () => void;
};

const dayForms = ["يوم", "يومان", "أيام"] as const;

/**
 * المستحقات (A11): غير المسدد مرتّباً بالموعد والمتأخر أولاً. لكل سطر العميل والتسليم والقيمة والموعد والأيام الباقية أو المتأخرة،
 * وفوقها نسبة التحصيل والمستحق والمتأخر.
 */
export function AgentReceivablesView({ receivables, today, dueSoonDays = 3, onOpenDelivery, onRetry }: AgentReceivablesViewProps) {
  if (receivables.status === "error") {
    return (
      <>
        <PageHeader title="المستحقات" />
        <ErrorState code={receivables.code} onRetry={onRetry} />
      </>
    );
  }
  const loading = receivables.status === "loading";
  const summary = receivables.status === "ready" ? receivables.data.summary : null;
  const unpaid = receivables.status === "ready" ? receivables.data.unpaid : [];
  const tile = loading ? "loading" : "ready";

  return (
    <>
      <PageHeader title="المستحقات" description="غير المسدد بالموعد، والمتأخر أولاً. التحصيل كامل من صفحة التسليم." />

      <div className="flex flex-col gap-6">
        <Grid cols={{ base: 1, tablet: 3 }} gap={4}>
          <KpiTile label="نسبة التحصيل" value={summary?.collection_rate_pct !== undefined ? formatPercent(summary.collection_rate_pct, 1) : "—"} progress={summary?.collection_rate_pct} info="المسدد من المستحق (§120)." state={tile} size="md" />
          <KpiTile label="المستحق" value={summary?.due_value ? formatMoney(summary.due_value) : "—"} context={summary?.paid_value ? `المسدد ${formatMoney(summary.paid_value)}` : undefined} state={tile} size="md" />
          <KpiTile label="المتأخر" value={summary?.overdue_value ? formatMoney(summary.overdue_value) : "—"} context={summary?.overdue_deliveries ? countPhrase(summary.overdue_deliveries, ["تسليم", "تسليمان", "تسليمات"]) : "لا متأخر"} state={tile} size="md" />
        </Grid>

        <Card title="غير المسدد">
          {loading ? (
            <Skeleton className="h-40 w-full" />
          ) : unpaid.length === 0 ? (
            <EmptyState icon={Receipt} title="لا مستحقات" description="كل تسليماتك مسددة." />
          ) : (
            <ul className="flex flex-col divide-y divide-border">
              {unpaid.map((delivery) => {
                const due = delivery.expected_payment_date;
                const left = due ? daysBetween(today, due) : null;
                const overdue = delivery.is_payment_overdue === true;
                const soon = !overdue && left !== null && left <= dueSoonDays;
                return (
                  <li key={delivery.id}>
                    <button type="button" className="flex w-full items-center gap-3 py-3 text-start" onClick={() => onOpenDelivery?.(delivery)}>
                      <span className="flex min-w-0 flex-1 flex-col">
                        <span className="truncate text-body text-fg">{delivery.customer?.name ?? "—"}</span>
                        <span className="text-label text-fg-muted">{`${delivery.reference ?? ""} · ${due ? dayMonthLabel(due) : "—"}`}</span>
                      </span>
                      <span className="flex flex-col items-end gap-1">
                        <span className="text-body text-fg tabular-nums">{delivery.estimated_value ? formatMoney(delivery.estimated_value) : "—"}</span>
                        {overdue && left !== null ? (
                          <Badge color="danger">{`متأخر ${countPhrase(-left, dayForms)}`}</Badge>
                        ) : soon && left !== null ? (
                          <Badge color="warning">{left === 0 ? "يستحق اليوم" : `باقي ${countPhrase(left, dayForms)}`}</Badge>
                        ) : left !== null ? (
                          <span className="text-label text-fg-muted">{`باقي ${countPhrase(left, dayForms)}`}</span>
                        ) : null}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>
      </div>
    </>
  );
}
