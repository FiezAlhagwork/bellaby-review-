"use client";

import { Medal } from "@phosphor-icons/react";
import { TextCell } from "@/components/data/cells";
import { DataTable, type DataTableColumn } from "@/components/data/DataTable";
import { StatusBadge } from "@/components/data/StatusBadge";
import { PageHeader } from "@/components/layout/PageHeader";
import { Section } from "@/components/layout/Section";
import { Badge } from "@/components/ui/Badge";
import { Banner } from "@/components/ui/Banner";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { MonthPicker } from "@/components/ui/MonthPicker";
import { Skeleton } from "@/components/ui/Skeleton";
import type { MonthlyScore } from "@/lib/api/types";
import { type IsoDate, type IsoMonth } from "@/lib/calendar";
import { isolate } from "@/lib/format";
import type { Loadable } from "@/lib/loadable";

type ScoresViewProps = {
  month: IsoMonth;
  onMonthChange: (month: IsoMonth) => void;
  closedMonths: readonly IsoMonth[];
  /** `GET /scores?month=`: كل الموظفين، وتُجمَّع هنا بمجموعة المقارنة (`comparison_group`) مرتبة بالنقاط من الأعلى. */
  scores: Loadable<readonly MonthlyScore[]>;
  today: IsoDate;
  onRetry?: () => void;
};

/** تفصيل النقاط حسب الأوزان: «الزيارات 28 من 30». */
function Breakdown({ kpis }: { kpis: MonthlyScore["kpis"] }) {
  return (
    <span className="flex flex-wrap gap-x-3 gap-y-1">
      {(kpis ?? []).map((kpi) => (
        <span key={kpi.key} className="text-caption text-fg-muted">
          {`${kpi.label ?? kpi.key} ${isolate(kpi.score ?? 0)} من ${isolate(kpi.weight ?? 0)}`}
        </span>
      ))}
    </span>
  );
}

const columns: DataTableColumn<MonthlyScore>[] = [
  {
    key: "user",
    header: "الموظف",
    cell: (row) => (
      <span className="flex items-center gap-2">
        <span className="truncate text-body text-fg">{row.user?.name}</span>
        {row.has_deduction ? <Badge color="warning">عليه خصم</Badge> : null}
      </span>
    ),
    width: "w-56",
    priority: "high",
    role: "primary",
  },
  { key: "total", header: "النقاط", cell: (row) => <span className="text-body font-semibold text-fg">{isolate(row.total ?? 0)}</span>, align: "end", width: "w-24", priority: "high" },
  { key: "breakdown", header: "التفصيل حسب الأوزان", cell: (row) => <Breakdown kpis={row.kpis} />, priority: "high" },
  { key: "status", header: "الحالة", cell: (row) => (row.status ? <StatusBadge entity="score" status={row.status} /> : <TextCell value={null} />), width: "w-24", role: "status" },
];

/**
 * النقاط الشهرية (E08): لكل مجموعة مقارنة جدول بالموظف ونقاطه وتفصيلها حسب الأوزان، من الأعلى. قبل الإغلاق مبدئية، وبعده نهائية.
 * الخصم لا يُنقص النقاط، ويُعلَّم صاحبه لأنه يمنعه من ترشيح موظف الشهر.
 */
export function ScoresView({ month, onMonthChange, closedMonths, scores, today, onRetry }: ScoresViewProps) {
  const rows = scores.status === "ready" ? scores.data : [];
  const groups = new Map<string, MonthlyScore[]>();
  for (const row of rows) {
    const name = row.comparison_group?.name ?? "بلا مجموعة";
    groups.set(name, [...(groups.get(name) ?? []), row]);
  }
  const provisional = rows.some((row) => row.status === "PROVISIONAL");

  return (
    <>
      <PageHeader title="النقاط الشهرية" description="نقاط كل موظف في مجموعة مقارنته، وتفصيلها حسب أوزان دوره." />

      <div className="flex flex-col gap-4">
        <div className="w-full max-w-64">
          <MonthPicker aria-label="الشهر" value={month} onValueChange={onMonthChange} closedMonths={closedMonths} today={today} />
        </div>

        {scores.status === "ready" && rows.length > 0 ? (
          provisional ? (
            <Banner kind="info" title="نقاط مبدئية">
              تُحتسب من المسجَّل حتى اليوم، وتُثبَّت حين يُغلق الشهر.
            </Banner>
          ) : (
            <Banner kind="success" title="نقاط نهائية">
              أُغلق الشهر وثُبّتت النقاط.
            </Banner>
          )
        ) : null}

        {scores.status === "loading" ? <Skeleton className="h-64 w-full" /> : null}
        {scores.status === "error" ? <ErrorState code={scores.code} onRetry={onRetry} /> : null}
        {scores.status === "ready" && rows.length === 0 ? <EmptyState icon={Medal} title="لا نقاط لهذا الشهر" description="تظهر النقاط حين تُسجَّل أول بيانات الشهر." /> : null}
      </div>

      {[...groups.entries()].map(([name, list]) => (
        <Section key={name} title={name}>
          <DataTable label={`نقاط ${name}`} columns={columns} rows={[...list].sort((a, b) => (b.total ?? 0) - (a.total ?? 0))} getRowKey={(row) => row.user?.id ?? ""} />
        </Section>
      ))}
    </>
  );
}
