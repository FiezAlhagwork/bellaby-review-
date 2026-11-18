"use client";

import { MagnifyingGlass, MapPin } from "@phosphor-icons/react";
import { DateTimeStackCell, TextCell } from "@/components/data/cells";
import { DataTable, type DataTableColumn } from "@/components/data/DataTable";
import { FilterBar, type ActiveFilter } from "@/components/data/FilterBar";
import { KpiTile } from "@/components/data/KpiTile";
import { Pagination, type PaginationMeta } from "@/components/data/Pagination";
import { PageHeader, type PageAction } from "@/components/layout/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { DateRangePicker, type DateRange } from "@/components/ui/DateRangePicker";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import type { ManagerVisit } from "@/lib/api/types";
import { dayLabel, monthLabel, type IsoDate, type IsoMonth } from "@/lib/calendar";
import { isolate } from "@/lib/format";
import type { Loadable } from "@/lib/loadable";

/** الفلتر كما يقبله العقد: `from` و`to`. الافتراضي الشهر الجاري. تغيّره يعيد الأب إلى الصفحة الأولى. */
export type ManagerVisitFilters = { range: DateRange };

/** صفحة من `GET /manager-visits` (`Paginated`): الأحدث أولاً. */
export type ManagerVisitsPage = { data: readonly ManagerVisit[]; meta: PaginationMeta };

/** هدف الشهر وما أُنجز: `GET /plans/SALES/{month}` (`MANAGER_VISITS` بـ`target` و`actual`): §49.1. */
export type VisitGoal = { month: IsoMonth; target: number; actual: number };

type ManagerVisitsViewProps = {
  visits: Loadable<ManagerVisitsPage>;
  goal: Loadable<VisitGoal | null>;
  filters: ManagerVisitFilters;
  onFiltersChange: (filters: ManagerVisitFilters) => void;
  /** الفترة الافتراضية (الشهر الجاري): تُعاد إليها «مسح الفلاتر». */
  defaultFilters: ManagerVisitFilters;
  onPageChange: (page: number) => void;
  onPerPageChange: (perPage: number) => void;
  /** اليوم (بتوقيت دمشق): حدّ منتقي الفترة. يُمرَّر فيبقى الـ view نقياً. */
  today: IsoDate;
  /** علم `manager_visits.create`: زر «زيارة جديدة». */
  canCreate: boolean;
  onNewVisit?: () => void;
  onRetry?: () => void;
};

const percent = (actual: number, target: number) => (target > 0 ? Math.min(100, Math.round((actual / target) * 100)) : 0);

/**
 * زياراتي (M10، موبايل): عدد زياراتي هذا الشهر مقابل الهدف، وقائمتها من الأحدث: الجهة والهدف والنتيجة والوقت. فلتر الفترة وترقيم.
 * الزيارة تُسجَّل من «زيارة جديدة» بموقع وبوقت الخادم.
 */
export function ManagerVisitsView({ visits, goal, filters, onFiltersChange, defaultFilters, onPageChange, onPerPageChange, today, canCreate, onNewVisit, onRetry }: ManagerVisitsViewProps) {
  const { from, to } = filters.range;
  const isDefault = from === defaultFilters.range.from && to === defaultFilters.range.to;
  const rangeLabel = from === null ? null : to === null || to === from ? `الفترة: ${dayLabel(from)}` : `الفترة: ${dayLabel(from)} ← ${dayLabel(to)}`;
  const active: ActiveFilter[] = rangeLabel && !isDefault ? [{ key: "range", label: rangeLabel, onRemove: () => onFiltersChange(defaultFilters) }] : [];

  const columns: DataTableColumn<ManagerVisit>[] = [
    { key: "target", header: "الجهة", cell: (row) => <TextCell value={row.target_name} />, priority: "high", role: "primary" },
    { key: "kind", header: "النوع", cell: (row) => (row.customer_id ? <Badge color="success">عميل</Badge> : <Badge>جهة زيارة</Badge>), width: "w-32" },
    { key: "purpose", header: "الهدف", cell: (row) => <TextCell value={row.purpose?.name} />, width: "w-48", priority: "high" },
    { key: "outcome", header: "النتيجة", cell: (row) => <TextCell value={row.outcome?.name} />, width: "w-44", priority: "high" },
    { key: "notes", header: "الملاحظات", cell: (row) => <TextCell value={row.notes} /> },
    { key: "visited", header: "الوقت", cell: (row) => <DateTimeStackCell value={row.visited_at} />, width: "w-28", priority: "high", role: "status" },
  ];

  const empty =
    active.length > 0 ? (
      <EmptyState
        icon={MagnifyingGlass}
        title="لا زيارات في هذه الفترة"
        description="لم تسجّل زيارات ضمن الفترة التي اخترتها. غيّرها أو أعدها للشهر الجاري."
        action={
          <Button variant="secondary" onClick={() => onFiltersChange(defaultFilters)}>
            مسح الفلاتر
          </Button>
        }
      />
    ) : (
      <EmptyState
        icon={MapPin}
        title="لا زيارات بعد"
        description="تظهر هنا زياراتك لعملاء الوكلاء وللصيدليات."
        action={
          canCreate && onNewVisit ? (
            <Button variant="primary" onClick={onNewVisit}>
              زيارة جديدة
            </Button>
          ) : undefined
        }
      />
    );

  const actions: PageAction[] = canCreate && onNewVisit ? [{ id: "new-visit", label: "زيارة جديدة", primary: true, onSelect: onNewVisit }] : [];

  const header = <PageHeader title="زياراتي" description="زياراتك لعملاء الوكلاء وللصيدليات، من الأحدث إلى الأقدم." actions={actions} />;

  if (visits.status === "error") {
    return (
      <>
        {header}
        <ErrorState code={visits.code} onRetry={onRetry} />
      </>
    );
  }

  const goalData = goal.status === "ready" ? goal.data : null;

  return (
    <>
      {header}

      <div className="flex flex-col gap-4">
        <KpiTile
          label={goalData ? `زياراتي في ${monthLabel(goalData.month)}` : "زياراتي هذا الشهر"}
          value={goalData ? `${isolate(goalData.actual)} من ${isolate(goalData.target)}` : ""}
          context={goalData ? (goalData.actual >= goalData.target ? "حقّقت هدف الشهر" : `بقي ${isolate(goalData.target - goalData.actual)} للوصول إلى الهدف`) : undefined}
          progress={goalData ? percent(goalData.actual, goalData.target) : undefined}
          info="عدد زياراتك المسجَّلة هذا الشهر مقابل الهدف في خطة المبيعات."
          state={goal.status === "loading" ? "loading" : goal.status === "ready" && goal.data === null ? "empty" : "ready"}
          size="md"
        />

        <FilterBar
          quickFilters={[<DateRangePicker key="range" aria-label="الفترة" placeholder="كل الأوقات" value={filters.range} onValueChange={(range) => onFiltersChange({ range })} max={today} today={today} />]}
          active={active}
          onClearAll={() => onFiltersChange(defaultFilters)}
        />

        <DataTable
          label="زياراتي"
          columns={columns}
          rows={visits.status === "ready" ? visits.data.data : []}
          getRowKey={(row) => row.id ?? ""}
          loading={visits.status === "loading"}
          empty={empty}
        />

        {visits.status === "ready" ? <Pagination meta={visits.data.meta} onPageChange={onPageChange} onPerPageChange={onPerPageChange} /> : null}
      </div>
    </>
  );
}
