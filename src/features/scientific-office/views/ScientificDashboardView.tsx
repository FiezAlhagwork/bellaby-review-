"use client";

import { Chart, type ChartRow } from "@/components/data/Chart";
import { KpiTile } from "@/components/data/KpiTile";
import { MapPlaceholder, type MapPoint } from "@/components/data/MapPlaceholder";
import { Grid } from "@/components/layout/Grid";
import { PageHeader } from "@/components/layout/PageHeader";
import { Section } from "@/components/layout/Section";
import { Banner } from "@/components/ui/Banner";
import { ErrorState } from "@/components/ui/ErrorState";
import { Skeleton } from "@/components/ui/Skeleton";
import type { CoverageLine } from "@/lib/api/types";
import { monthLabel, type IsoMonth } from "@/lib/calendar";
import { formatPercent, isolate } from "@/lib/format";
import type { Loadable } from "@/lib/loadable";

/** هدف من خطة الشهر: `actual` و`target` من `PlanTarget` (أرقام). */
export type PlanProgress = { actual: number; target: number };

/** زيارة على الخريطة: موقع بدء زيارة اليوم (`GET /visits` بـ`from`/`to` اليوم). */
export type MapVisit = { id: number; lat: number; lng: number; label: string; flagged: boolean };

/**
 * ما تجمعه الحاوية للوحة المكتب العلمي. `GET /dashboard/summary` بلا حقول في العقد، فتُحسب من القوائم المعرّفة (docs/backend-requests.md §50):
 * - الزيارات والفئات المستهدفة والمنتجات من `GET /plans/SCIENTIFIC_OFFICE/{month}` (`metric` = `VISITS` و`CATEGORY_VISITS` و`ITEM_DISCUSSIONS`).
 * - التغطية من `GET /dashboard/coverage?month=`، وزيارات الخريطة من `GET /visits`.
 */
export type ScientificOverview = {
  month: IsoMonth;
  /** `GET /plans/...` أعاد 404: لا خطة معتمدة، فتفرغ البطاقات الثلاث. */
  hasPlan: boolean;
  visits: PlanProgress;
  categoryVisits: PlanProgress;
  itemDiscussions: PlanProgress;
  coverage: readonly CoverageLine[];
  mapVisits: readonly MapVisit[];
};

type ScientificDashboardViewProps = {
  overview: Loadable<ScientificOverview>;
  onRetry?: () => void;
};

const percent = ({ actual, target }: PlanProgress) => (target > 0 ? Math.min(100, Math.round((actual / target) * 100)) : 0);
const ofTarget = ({ actual, target }: PlanProgress) => `${isolate(actual)} من ${isolate(target)}`;

/**
 * لوحة المكتب العلمي (M12): الزيارات والفئات المستهدفة والمنتجات مقابل خطة الشهر، والتغطية لكل محافظة (الجهات المزورة وتوفر المنتجات)،
 * وزيارات اليوم على الخريطة.
 */
export function ScientificDashboardView({ overview, onRetry }: ScientificDashboardViewProps) {
  const ready = overview.status === "ready" ? overview.data : null;
  const header = <PageHeader title="لوحة المكتب العلمي" description={ready ? `أداء ${monthLabel(ready.month)} مقابل خطة المكتب العلمي.` : "أداء الشهر مقابل خطة المكتب العلمي."} />;

  if (overview.status === "error") {
    return (
      <>
        {header}
        <ErrorState code={overview.code} onRetry={onRetry} />
      </>
    );
  }

  const loading = overview.status === "loading";
  const noPlan = ready !== null && !ready.hasPlan;
  const planState = loading ? "loading" : noPlan ? "empty" : "ready";
  const coverageRows: ChartRow[] = (ready?.coverage ?? []).map((line) => ({ label: line.governorate?.name ?? "", visited: line.visited_points_pct ?? 0, available: line.products_available_pct ?? 0 }));
  const points: MapPoint[] = (ready?.mapVisits ?? []).map((visit) => ({ id: String(visit.id), lat: visit.lat, lng: visit.lng, kind: "start", tone: visit.flagged ? "warning" : "default", label: visit.label }));

  return (
    <>
      {header}

      {noPlan ? (
        <Banner kind="warning" title="لا خطة معتمدة لهذا الشهر">
          تظهر الأرقام مقابل الأهداف حين تُعتمد خطة الشهر. التغطية والخريطة تعمل بلا خطة.
        </Banner>
      ) : null}

      <Section>
        <Grid cols={{ base: 1, tablet: 3 }} gap={4}>
          <KpiTile label="الزيارات" value={ready ? ofTarget(ready.visits) : ""} context="مقابل هدف الشهر" progress={ready ? percent(ready.visits) : undefined} info="زيارات المندوبين السليمة هذا الشهر." state={planState} />
          <KpiTile
            label="الفئات المستهدفة"
            value={ready ? ofTarget(ready.categoryVisits) : ""}
            context="زيارات الفئات في الخطة"
            progress={ready ? percent(ready.categoryVisits) : undefined}
            info="زيارات أنواع الجهات والاختصاصات المحدّدة في خطة الشهر."
            state={planState}
          />
          <KpiTile
            label="المنتجات"
            value={ready ? ofTarget(ready.itemDiscussions) : ""}
            context="مرات عرض المنتجات"
            progress={ready ? percent(ready.itemDiscussions) : undefined}
            info="مرات مناقشة منتجات الخطة مع الجهات أثناء الزيارات."
            state={planState}
          />
        </Grid>
      </Section>

      <Section title="التغطية لكل محافظة" description="نسبة الجهات المزورة ونسبة توفر المنتجات في كل محافظة هذا الشهر.">
        <Chart
          type="bar"
          label="التغطية لكل محافظة"
          data={coverageRows}
          series={[
            { key: "visited", label: "الجهات المزورة" },
            { key: "available", label: "توفر المنتجات" },
          ]}
          formatValue={(value) => formatPercent(value)}
          state={loading ? "loading" : "ready"}
        />
      </Section>

      <Section title="زيارات اليوم على الخريطة" description="مواقع بدء زيارات المندوبين اليوم. المعلَّمة بلون التحذير فيها علامة مفتوحة.">
        {loading ? <Skeleton className="h-96 w-full" /> : <MapPlaceholder points={points} aria-label="مواقع زيارات اليوم" legend={false} />}
      </Section>
    </>
  );
}
