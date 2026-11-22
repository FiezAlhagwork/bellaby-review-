"use client";

import { Cube } from "@phosphor-icons/react";
import { StockLine } from "@/components/data/StockLine";
import { PageHeader } from "@/components/layout/PageHeader";
import { Banner } from "@/components/ui/Banner";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { Skeleton } from "@/components/ui/Skeleton";
import type { BalanceLine } from "@/lib/api/types";
import { daysBetween, type IsoDate } from "@/lib/calendar";
import { countPhrase, formatQuantity, isolate } from "@/lib/format";
import type { Loadable } from "@/lib/loadable";

type AgentStockViewProps = {
  /** `GET /stock/balances` لموقع الوكيل مجمّعاً بالدفعة. */
  balances: Loadable<readonly BalanceLine[]>;
  today: IsoDate;
  /** `expiry_alert_days` من الإعدادات (§113). */
  expiryAlertDays?: number;
  onRetry?: () => void;
};

const batchForms = ["دفعة", "دفعتان", "دفعات"] as const;

/**
 * رصيدي (A04): لكل صنف دفعاته بكمياتها وإجماليه. الدفعة الموقوفة لا تُسلَّم لصيدلية وتُرجَع بطلب إرجاع،
 * والقريبة الانتهاء بشارتها.
 */
export function AgentStockView({ balances, today, expiryAlertDays = 60, onRetry }: AgentStockViewProps) {
  if (balances.status === "loading") {
    return (
      <>
        <PageHeader title="رصيدي" />
        <div className="flex flex-col gap-4" aria-busy="true">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      </>
    );
  }
  if (balances.status === "error") {
    return (
      <>
        <PageHeader title="رصيدي" />
        <ErrorState code={balances.code} onRetry={onRetry} />
      </>
    );
  }

  const lines = balances.data.filter((line) => (line.quantity ?? 0) > 0);
  const suspended = lines.filter((line) => line.batch?.status === "SUSPENDED");
  const nearExpiry = lines.filter((line) => line.batch?.status !== "SUSPENDED" && line.batch?.expiry_date && daysBetween(today, line.batch.expiry_date) <= expiryAlertDays);
  const groups = [...new Map(lines.map((line) => [line.item?.id, lines.filter((other) => other.item?.id === line.item?.id)])).values()];

  return (
    <>
      <PageHeader title="رصيدي" description="ما في مستودعك بعد تأكيد الاستلام، لكل صنف ودفعة." />

      {lines.length === 0 ? (
        <EmptyState icon={Cube} title="لا رصيد لديك" description="يدخل الرصيد بعد تأكيد استلام الصرف من المستودع." />
      ) : (
        <div className="flex flex-col gap-4">
          {suspended.length > 0 ? (
            <Banner kind="danger" title={`${countPhrase(suspended.length, batchForms)} موقوفة`}>
              {`لا تُسلَّم لصيدلية، تُرجَع بطلب إرجاع: ${suspended.map((line) => isolate(line.batch?.batch_no ?? "")).join("، ")}.`}
            </Banner>
          ) : null}
          {nearExpiry.length > 0 ? (
            <Banner kind="warning" title={`${countPhrase(nearExpiry.length, batchForms)} قريبة الانتهاء`}>
              {`تنتهي خلال ${expiryAlertDays} يوماً. سلّمها أولاً.`}
            </Banner>
          ) : null}

          {groups.map((group) => {
            const item = group[0]?.item;
            const total = group.reduce((sum, line) => sum + (line.quantity ?? 0), 0);
            return (
              <Card key={item?.id} title={item?.name ?? "—"} action={<span className="text-body font-semibold text-fg tabular-nums">{`${formatQuantity(total)} علبة`}</span>}>
                <div className="flex flex-col divide-y divide-border">
                  {group.map((line) => (line.item ? <StockLine key={`${line.item.id}-${line.batch?.id}`} item={line.item} batch={line.batch} quantity={line.quantity ?? 0} today={today} expiryAlertDays={expiryAlertDays} className="py-3 first:pt-0 last:pb-0" /> : null))}
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </>
  );
}
