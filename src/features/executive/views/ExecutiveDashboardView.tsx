"use client";

import { MoneyCell, TextCell } from "@/components/data/cells";
import { DataTable, type DataTableColumn } from "@/components/data/DataTable";
import { KpiTile } from "@/components/data/KpiTile";
import { Grid } from "@/components/layout/Grid";
import { PageHeader } from "@/components/layout/PageHeader";
import { Section } from "@/components/layout/Section";
import { Badge } from "@/components/ui/Badge";
import { Banner } from "@/components/ui/Banner";
import { Card } from "@/components/ui/Card";
import { ErrorState } from "@/components/ui/ErrorState";
import type { ExecutiveDashboard, UserRef } from "@/lib/api/types";
import { monthLabel } from "@/lib/calendar";
import { formatMoney, formatPercent, formatRelative, isolate } from "@/lib/format";
import type { Loadable } from "@/lib/loadable";

type Dashboard = ExecutiveDashboard;
type TaskRow = NonNullable<Dashboard["task_completion"]>[number];
type ItemTarget = NonNullable<Dashboard["item_targets"]>[number];
type AgentTarget = NonNullable<Dashboard["agent_targets"]>[number];
type ExpenseLine = NonNullable<NonNullable<Dashboard["expenses"]>["lines"]>[number];

/** نقاط مجموعة مقارنة: موظفوها بمجموع نقاطهم (`GET /scores?month=` مجمّعة بالمجموعة في الحاوية: docs/backend-requests.md §56.1). */
export type ScoreGroup = { group: string; scores: readonly { user: UserRef; total: number }[] };

/** ما تجمعه الحاوية للوحة المدير التنفيذي. */
export type ExecutiveOverview = {
  dashboard: Dashboard;
  /** `GET /me/pending-decisions`: `meta.total` والأقدم (`waiting_since` لأول عنصر، الأقدم أولاً). */
  pending: { count: number; oldestAt: string | null };
  scoreGroups: readonly ScoreGroup[];
  /** أرقام الشهر مبدئية قبل إغلاقه: من `MonthlyScore.status = PROVISIONAL` و`expenses.locked = false` (§56.2). */
  provisional: boolean;
};

type ExecutiveDashboardViewProps = {
  overview: Loadable<ExecutiveOverview>;
  /** الآن (ISO UTC): لعمر أقدم قرار. يُمرَّر فيبقى الـ view نقياً. */
  now: string;
  onOpenPending?: () => void;
  onRetry?: () => void;
};

/** نسبة بشارة: تحت 80% تحذير، وتحت 50% خطر. النسبة من الخادم ولا تُحسب هنا. */
function PercentCell({ value }: { value: number | null | undefined }) {
  if (value === null || value === undefined) return <TextCell value={null} />;
  const color = value < 50 ? "danger" : value < 80 ? "warning" : "success";
  return <Badge color={color}>{formatPercent(value)}</Badge>;
}

/** نسبة المصروف من الميزانية: فوق 100% خطر، ومن 90% تحذير. */
function SpendCell({ value }: { value: number | null | undefined }) {
  if (value === null || value === undefined) return <TextCell value={null} />;
  return <Badge color={value > 100 ? "danger" : value >= 90 ? "warning" : "neutral"}>{formatPercent(value)}</Badge>;
}

const taskColumns: DataTableColumn<TaskRow>[] = [
  { key: "user", header: "الموظف", cell: (row) => <TextCell value={row.user?.name} />, priority: "high", role: "primary" },
  { key: "approved", header: "المعتمدة ÷ المستحقة", cell: (row) => <TextCell value={`${isolate(row.approved ?? 0)} ÷ ${isolate(row.due ?? 0)}`} />, width: "w-40", priority: "high" },
  { key: "completion", header: "الإنجاز", cell: (row) => <PercentCell value={row.completion_pct} />, width: "w-28", priority: "high", role: "status" },
  { key: "on_time", header: "بوقتها", cell: (row) => <PercentCell value={row.on_time_pct} />, width: "w-28", priority: "high" },
];

const itemColumns: DataTableColumn<ItemTarget>[] = [
  { key: "item", header: "المنتج", cell: (row) => <TextCell value={row.item?.name} />, priority: "high", role: "primary" },
  { key: "target", header: "الهدف", cell: (row) => <MoneyCell value={row.target} />, align: "end", width: "w-36", priority: "high" },
  { key: "actual", header: "الفعلي", cell: (row) => <MoneyCell value={row.actual} />, align: "end", width: "w-36", priority: "high" },
  { key: "pct", header: "الإنجاز", cell: (row) => <PercentCell value={row.achievement_pct} />, width: "w-28", role: "status" },
];

const agentColumns: DataTableColumn<AgentTarget>[] = [
  { key: "agent", header: "الوكيل", cell: (row) => <TextCell value={row.agent?.name} />, priority: "high", role: "primary" },
  { key: "target", header: "الهدف", cell: (row) => <MoneyCell value={row.target} />, align: "end", width: "w-36", priority: "high" },
  { key: "actual", header: "الفعلي", cell: (row) => <MoneyCell value={row.actual} />, align: "end", width: "w-36", priority: "high" },
  { key: "pct", header: "الإنجاز", cell: (row) => <PercentCell value={row.achievement_pct} />, width: "w-28", role: "status" },
];

const expenseColumns: DataTableColumn<ExpenseLine>[] = [
  { key: "category", header: "البند", cell: (row) => <TextCell value={row.category?.name} />, priority: "high", role: "primary" },
  { key: "actual", header: "المصروف", cell: (row) => <MoneyCell value={row.actual} />, align: "end", width: "w-36", priority: "high" },
  { key: "budget", header: "الميزانية", cell: (row) => <MoneyCell value={row.budget} />, align: "end", width: "w-36", priority: "high" },
  { key: "ratio", header: "من الميزانية", cell: (row) => <SpendCell value={row.ratio_pct} />, width: "w-28", role: "status" },
];

/**
 * لوحة المدير التنفيذي (E01): ما ينتظر قراري، وإنجاز كل موظف وأدنى موظف (بالمهام وبالنقاط في كل مجموعة)، والتارغيت لكل منتج ولكل وكيل،
 * والمصاريف مقابل الميزانية، والنقاط الشهرية لكل مجموعة. للعرض والمتابعة، لا تدخل في التقييم (القرار 15).
 */
export function ExecutiveDashboardView({ overview, now, onOpenPending, onRetry }: ExecutiveDashboardViewProps) {
  const ready = overview.status === "ready" ? overview.data : null;
  const header = <PageHeader title="لوحة المدير التنفيذي" description={ready ? `متابعة ${monthLabel(ready.dashboard.month ?? "")}: للعرض لا للتقييم.` : "متابعة الشهر: للعرض لا للتقييم."} />;

  if (overview.status === "error") {
    return (
      <>
        {header}
        <ErrorState code={overview.code} onRetry={onRetry} />
      </>
    );
  }

  const loading = overview.status === "loading";
  const d = ready?.dashboard;
  const expenses = d?.expenses;
  const provisional = ready?.provisional ?? false;

  return (
    <>
      {header}

      {provisional ? (
        <Banner kind="info" title="أرقام الشهر مبدئية">
          تُحتسب الأرقام من المسجَّل حتى اليوم، وتصير نهائية حين يُغلق الشهر.
        </Banner>
      ) : null}

      <Section>
        <Grid cols={{ base: 1, tablet: 2, desktop: 4 }} gap={4}>
          <KpiTile
            label="بانتظار قراري"
            value={ready ? String(ready.pending.count) : ""}
            context={ready ? (ready.pending.count === 0 ? "لا قرارات معلّقة" : ready.pending.oldestAt ? `الأقدم ${formatRelative(ready.pending.oldestAt, now)}` : undefined) : undefined}
            state={loading ? "loading" : "ready"}
            onClick={onOpenPending}
          />
          <KpiTile
            label="المصاريف"
            value={expenses?.total_actual ? formatMoney(expenses.total_actual) : ""}
            context={expenses?.total_budget ? `من ميزانية ${isolate(formatMoney(expenses.total_budget))}` : undefined}
            progress={expenses?.total_ratio_pct ?? undefined}
            provisional={provisional}
            state={loading ? "loading" : "ready"}
          />
          {(d?.lowest_by_tasks ?? []).slice(0, 1).map((row) => (
            <KpiTile key="tasks" label="أدنى إنجاز للمهام" value={row.user?.name ?? "—"} context={`${row.group ?? ""} · ${isolate(formatPercent(row.completion_pct ?? 0))}`} provisional={provisional} state="ready" />
          ))}
          {(d?.lowest_by_score ?? []).slice(0, 1).map((row) => (
            <KpiTile key="score" label="أدنى نقاط" value={row.user?.name ?? "—"} context={`${row.group ?? ""} · ${isolate(row.total ?? 0)} نقطة`} provisional={provisional} state="ready" />
          ))}
          {loading ? (
            <>
              <KpiTile label="أدنى إنجاز للمهام" value="" state="loading" />
              <KpiTile label="أدنى نقاط" value="" state="loading" />
            </>
          ) : null}
        </Grid>
      </Section>

      <Section title="إنجاز المهام" description="لكل موظف: المهام المعتمدة من المستحقة عليه، ونسبة ما أُنجز بوقته.">
        <DataTable label="إنجاز المهام" columns={taskColumns} rows={d?.task_completion ?? []} getRowKey={(row) => row.user?.id ?? ""} loading={loading} />
      </Section>

      <Section title="أدنى موظف في كل مجموعة" description="مرتين: بإنجاز المهام، وبالنقاط الشهرية في كل مجموعة مقارنة.">
        <Grid cols={{ base: 1, desktop: 2 }} gap={4}>
          <Card title="بإنجاز المهام">
            <ul className="flex flex-col divide-y divide-border">
              {(d?.lowest_by_tasks ?? []).map((row) => (
                <li key={`${row.group}-${row.user?.id}`} className="flex items-center justify-between gap-3 py-2">
                  <span className="flex min-w-0 flex-col">
                    <span className="truncate text-body text-fg">{row.user?.name}</span>
                    <span className="text-caption text-fg-muted">{row.group}</span>
                  </span>
                  <PercentCell value={row.completion_pct} />
                </li>
              ))}
            </ul>
          </Card>
          <Card title="بالنقاط">
            <ul className="flex flex-col divide-y divide-border">
              {(d?.lowest_by_score ?? []).map((row) => (
                <li key={`${row.group}-${row.user?.id}`} className="flex items-center justify-between gap-3 py-2">
                  <span className="flex min-w-0 flex-col">
                    <span className="truncate text-body text-fg">{row.user?.name}</span>
                    <span className="text-caption text-fg-muted">{row.group}</span>
                  </span>
                  <span className="text-body font-semibold text-fg">{isolate(row.total ?? 0)}</span>
                </li>
              ))}
            </ul>
          </Card>
        </Grid>
      </Section>

      <Section title="التارغيت لكل منتج" description="مبيعات الشهر مقابل هدف كل منتج.">
        <DataTable label="التارغيت لكل منتج" columns={itemColumns} rows={d?.item_targets ?? []} getRowKey={(row) => row.item?.id ?? ""} loading={loading} />
      </Section>

      <Section title="التارغيت لكل وكيل" description="مبيعات الشهر مقابل هدف كل وكيل.">
        <DataTable label="التارغيت لكل وكيل" columns={agentColumns} rows={d?.agent_targets ?? []} getRowKey={(row) => row.agent?.id ?? ""} loading={loading} />
      </Section>

      <Section title="المصاريف" description="كل بند مقابل ميزانيته، والإجمالي في البطاقة أعلاه.">
        <DataTable label="المصاريف" columns={expenseColumns} rows={expenses?.lines ?? []} getRowKey={(row) => row.category?.id ?? ""} loading={loading} />
      </Section>

      <Section title="النقاط الشهرية لكل مجموعة" description="مجموع نقاط كل موظف في مجموعته، من الأعلى.">
        <Grid cols={{ base: 1, tablet: 2, desktop: 3 }} gap={4}>
          {(ready?.scoreGroups ?? []).map((group) => (
            <Card key={group.group} title={group.group}>
              <ul className="flex flex-col divide-y divide-border">
                {group.scores.map(({ user, total }) => (
                  <li key={user.id} className="flex items-center justify-between gap-3 py-2">
                    <span className="truncate text-body text-fg">{user.name}</span>
                    <span className="text-body font-semibold text-fg">{isolate(total)}</span>
                  </li>
                ))}
              </ul>
            </Card>
          ))}
        </Grid>
      </Section>
    </>
  );
}
