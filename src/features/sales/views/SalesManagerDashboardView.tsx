"use client";

import { Chart, type ChartRow } from "@/components/data/Chart";
import { KpiTile } from "@/components/data/KpiTile";
import { Grid } from "@/components/layout/Grid";
import { PageHeader } from "@/components/layout/PageHeader";
import { Section } from "@/components/layout/Section";
import { Banner } from "@/components/ui/Banner";
import { ErrorState } from "@/components/ui/ErrorState";
import { monthLabel, type IsoMonth } from "@/lib/calendar";
import { formatPercent, formatQuantity, formatRelative, isolate } from "@/lib/format";
import type { Loadable } from "@/lib/loadable";

/** عمود في رسم «مقابل الهدف»: `actual` و`target` من `PlanTarget` (أرقام لا مبالغ نصية). `label` اسم قصير للمحور تحسبه الحاوية. */
export type SalesBar = { label: string; actual: number; target: number };

/**
 * ما تجمعه الحاوية للوحة مدير المبيعات. `GET /dashboard/summary` بلا حقول في العقد، فتُحسب من القوائم المعرّفة:
 * - المبيعات لكل منتج ولكل وكيل والعملاء الجدد وزياراتي من `GET /plans/SALES/{month}` (`PlanTarget.metric` = `ITEM_SALES_VALUE` و`SALES_VALUE` و`NEW_CUSTOMERS` و`MANAGER_VISITS`، بـ`actual` و`target`).
 * - التحصيل من `GET /receivables`، وإعادة الطلب من `GET /dashboard/coverage`، وما ينتظر قراري من `GET /me/pending-decisions`.
 * docs/backend-requests.md §39.
 */
export type SalesOverview = {
  /** الشهر المعروض. */
  month: IsoMonth;
  /** أرقام الشهر مبدئية قبل إغلاقه: لا حقل في العقد، فتحسبه الحاوية (§39.2). */
  provisional: boolean;
  /** `GET /plans/SALES/{month}` أعاد 404: لا خطة معتمدة، فتفرغ بطاقات الخطة والرسمان. */
  hasPlan: boolean;
  /** نسبة التحصيل الكلية وعدد التسليمات المتأخرة. النسبة من الخادم لأن حسابها من المبالغ ممنوع في الواجهة (§39.1). */
  collection: { ratePct: number; overdueDeliveries: number };
  /** إعادة الطلب: متوسط محافظات نطاقك من `CoverageLine.reorder_rate_pct`. */
  reorderRatePct: number;
  newCustomers: { actual: number; target: number };
  managerVisits: { actual: number; target: number };
  pendingDecisions: { count: number; oldestAt: string | null };
  byItem: readonly SalesBar[];
  byAgent: readonly SalesBar[];
};

export type SalesDashboardTarget = "pending" | "receivables" | "visits" | "customers";

type SalesManagerDashboardViewProps = {
  overview: Loadable<SalesOverview>;
  /** الآن (ISO UTC): للأقدم بين القرارات المعلّقة. يُمرَّر فيبقى الـ view نقياً. */
  now: string;
  onRetry?: () => void;
  /** فتح القائمة الكاملة لبطاقة قابلة للضغط. */
  onOpen?: (target: SalesDashboardTarget) => void;
};

const percent = (actual: number, target: number) => (target > 0 ? Math.min(100, Math.round((actual / target) * 100)) : 0);

const dollars = (value: number) => `$${formatQuantity(Math.round(value))}`;

const toRows = (bars: readonly SalesBar[]): ChartRow[] => bars.map((bar) => ({ label: bar.label, sales: bar.actual, target: bar.target }));

/**
 * لوحة مدير المبيعات (M01): خمس بطاقات (التحصيل، والعملاء الجدد، وإعادة الطلب، وزياراتي، وما ينتظر قراري)، تحتها المبيعات لكل منتج ولكل وكيل مقابل أهدافها.
 * قبل إغلاق الشهر تحمل البطاقات شارة «مبدئي» وشريطاً يشرح. بلا خطة معتمدة تفرغ بطاقات الخطة والرسمان.
 */
export function SalesManagerDashboardView({ overview, now, onRetry, onOpen }: SalesManagerDashboardViewProps) {
  const loading = overview.status === "loading";
  const ready = overview.status === "ready" ? overview.data : null;

  const header = <PageHeader title="لوحة مدير المبيعات" description={ready ? `أداء ${monthLabel(ready.month)} مقابل خطة المبيعات.` : "أداء الشهر مقابل خطة المبيعات."} />;

  if (overview.status === "error") {
    return (
      <>
        {header}
        <ErrorState code={overview.code} onRetry={onRetry} />
      </>
    );
  }

  const provisional = ready?.provisional ?? false;
  const noPlan = ready !== null && !ready.hasPlan;
  const planState = loading ? "loading" : noPlan ? "empty" : "ready";
  const state = loading ? "loading" : "ready";
  const open = (target: SalesDashboardTarget) => (onOpen ? () => onOpen(target) : undefined);

  const oldest = ready?.pendingDecisions.oldestAt ? formatRelative(ready.pendingDecisions.oldestAt, now) : null;

  return (
    <>
      {header}

      {provisional ? (
        <Banner kind="info" title="أرقام الشهر مبدئية">
          تُحتسب الأرقام الآن من المسجَّل حتى اليوم، وتصير نهائية حين يُغلق الشهر.
        </Banner>
      ) : null}

      {noPlan ? (
        <Banner kind="warning" title="لا خطة معتمدة لهذا الشهر">
          تظهر المبيعات مقابل الأهداف حين تُعتمد خطة الشهر. التحصيل وإعادة الطلب وما ينتظر قراري تعمل بلا خطة.
        </Banner>
      ) : null}

      <Section>
        <Grid cols={{ base: 1, tablet: 2, desktop: 5 }} gap={4}>
          <KpiTile
            label="التحصيل"
            value={ready ? formatPercent(ready.collection.ratePct, 1) : ""}
            context={ready ? (ready.collection.overdueDeliveries === 0 ? "لا تسليمات متأخرة" : `${isolate(ready.collection.overdueDeliveries)} تسليمات متأخرة السداد`) : undefined}
            progress={ready ? Math.round(ready.collection.ratePct) : undefined}
            info="نسبة المسدَّد من المستحق على وكلائك حتى اليوم."
            provisional={provisional}
            state={state}
            onClick={open("receivables")}
          />
          <KpiTile
            label="العملاء الجدد"
            value={ready ? `${isolate(ready.newCustomers.actual)} من ${isolate(ready.newCustomers.target)}` : ""}
            context="مقابل هدف الشهر"
            progress={ready ? percent(ready.newCustomers.actual, ready.newCustomers.target) : undefined}
            info="العملاء الذين سُجّل أول تسليم لهم هذا الشهر."
            provisional={provisional}
            state={planState}
            onClick={open("customers")}
          />
          <KpiTile
            label="إعادة الطلب"
            value={ready ? formatPercent(ready.reorderRatePct, 1) : ""}
            context="متوسط المحافظات"
            info="نسبة العملاء الذين أعادوا الطلب، بمتوسط محافظات نطاقك."
            provisional={provisional}
            state={state}
          />
          <KpiTile
            label="زياراتي"
            value={ready ? `${isolate(ready.managerVisits.actual)} من ${isolate(ready.managerVisits.target)}` : ""}
            context="مقابل هدف الشهر"
            progress={ready ? percent(ready.managerVisits.actual, ready.managerVisits.target) : undefined}
            provisional={provisional}
            state={planState}
            onClick={open("visits")}
          />
          <KpiTile
            label="بانتظار قراري"
            value={ready ? String(ready.pendingDecisions.count) : ""}
            context={ready ? (ready.pendingDecisions.count === 0 ? "لا قرارات معلّقة" : oldest ? `الأقدم ${oldest}` : undefined) : undefined}
            state={state}
            onClick={open("pending")}
          />
        </Grid>
      </Section>

      {noPlan ? null : (
        <>
          <Section title="المبيعات لكل منتج" description="المبيعات الفعلية مقابل هدف كل منتج في خطة الشهر.">
            <Chart
              type="bar-target"
              label="المبيعات لكل منتج مقابل أهدافها"
              data={ready ? toRows(ready.byItem) : []}
              series={[{ key: "sales", label: "المبيعات" }]}
              targetKey="target"
              targetLabel="هدف المنتج"
              formatValue={dollars}
              state={state}
            />
          </Section>

          <Section title="المبيعات لكل وكيل" description="المبيعات الفعلية مقابل هدف كل وكيل في خطة الشهر.">
            <Chart
              type="bar-target"
              label="المبيعات لكل وكيل مقابل أهدافها"
              data={ready ? toRows(ready.byAgent) : []}
              series={[{ key: "sales", label: "المبيعات" }]}
              targetKey="target"
              targetLabel="هدف الوكيل"
              formatValue={dollars}
              state={state}
            />
          </Section>
        </>
      )}
    </>
  );
}
