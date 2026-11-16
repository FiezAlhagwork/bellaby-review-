"use client";

import { MagnifyingGlass, Notebook } from "@phosphor-icons/react";
import { DateTimeStackCell, TextCell } from "@/components/data/cells";
import { DataTable, type DataTableColumn } from "@/components/data/DataTable";
import { FilterBar, type ActiveFilter } from "@/components/data/FilterBar";
import { Pagination, type PaginationMeta } from "@/components/data/Pagination";
import { ratingScaleLabels } from "@/components/data/rating-scale";
import { PageHeader } from "@/components/layout/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Combobox } from "@/components/ui/Combobox";
import { DateRangePicker, type DateRange } from "@/components/ui/DateRangePicker";
import { EmptyState } from "@/components/ui/EmptyState";
import type { Option } from "@/components/ui/OptionList";
import type { Location } from "@/lib/api/types";
import { dayLabel, type IsoDate } from "@/lib/calendar";
import { isolate } from "@/lib/format";
import type { Loadable } from "@/lib/loadable";
import { ratingDeadline } from "@/lib/deadline";
import type { DailyReportRow } from "../deadline";

/** الفلاتر كما يرسلها العقد: `rep_id` و`from`/`to` و`rated`. تغيّرها يعيد الأب إلى الصفحة الأولى. */
export type DailyReportFilters = {
  /** معرّف المستخدم (المندوب). */
  repId: string | null;
  range: DateRange;
  /** `rated`: true مقيَّمة، false بانتظار التقييم، null الكل. */
  rated: boolean | null;
};

export const noDailyReportFilters: DailyReportFilters = { repId: null, range: { from: null, to: null }, rated: null };

/** صفحة من `GET /daily-reports` (`Paginated`): التقارير و`meta` بأسلوب Laravel. */
export type DailyReportsPage = { data: readonly DailyReportRow[]; meta: PaginationMeta };

type DailyReportsListViewProps = {
  reports: Loadable<DailyReportsPage>;
  /** مندوبو نطاق المستخدم كمواقع `GET /locations?type=REP`: خيارات فلتر المندوب (`location.user.id` = `rep_id`). */
  reps: readonly Location[];
  filters: DailyReportFilters;
  onFiltersChange: (filters: DailyReportFilters) => void;
  onPageChange: (page: number) => void;
  onPerPageChange: (perPage: number) => void;
  /** `daily_reports.rate`: السوبرفايزر يرى الوقت المتبقي من المهلة. من دونها (مدير المكتب العلمي) قراءة فقط. */
  canRate: boolean;
  /** الآن (ISO UTC) واليوم: للوقت المتبقي ولحدّ الفترة. تُمرَّر فيبقى الـ view نقياً. */
  now: string;
  today: IsoDate;
  /** يفتح التقرير (S03). بدونه الصفوف للقراءة فقط. */
  onOpenReport?: (report: DailyReportRow) => void;
  onRetry?: () => void;
};

const ratedOptions: Option[] = [
  { value: "pending", label: "بانتظار التقييم" },
  { value: "rated", label: "مقيَّمة" },
];

const rangeLabel = ({ from, to }: DateRange) => (from && to ? (from === to ? dayLabel(from) : `${dayLabel(from)} – ${dayLabel(to)}`) : from ? `من ${dayLabel(from)}` : to ? `حتى ${dayLabel(to)}` : "");

/**
 * التقارير اليومية (S02): المندوب ويوم العمل والاستلام والتقييم. غير المقيَّم «بانتظار التقييم» ومعه الوقت المتبقي من مهلة 24 ساعة عمل
 * (أو «متأخر»)، والمقيَّم بدرجته من السلّم الموحّد. للسوبرفايزر بانتظار تقييمه أولاً (ترتيب الخادم)، ولمدير المكتب العلمي كل المندوبين للقراءة.
 */
export function DailyReportsListView({ reports, reps, filters, onFiltersChange, onPageChange, onPerPageChange, canRate, now, today, onOpenReport, onRetry }: DailyReportsListViewProps) {
  const repOptions: Option[] = reps.flatMap((rep) => (rep.user?.id !== undefined && rep.name ? [{ value: String(rep.user.id), label: rep.name }] : []));

  const set = (patch: Partial<DailyReportFilters>) => onFiltersChange({ ...filters, ...patch });
  const clearAll = () => onFiltersChange(noDailyReportFilters);

  const active: ActiveFilter[] = [
    ...(filters.repId ? [{ key: "rep", label: `المندوب: ${repOptions.find((o) => o.value === filters.repId)?.label ?? ""}`, onRemove: () => set({ repId: null }) }] : []),
    ...(filters.range.from || filters.range.to ? [{ key: "range", label: `الفترة: ${rangeLabel(filters.range)}`, onRemove: () => set({ range: { from: null, to: null } }) }] : []),
    ...(filters.rated !== null ? [{ key: "rated", label: `الحالة: ${filters.rated ? "مقيَّمة" : "بانتظار التقييم"}`, onRemove: () => set({ rated: null }) }] : []),
  ];

  const columns: DataTableColumn<DailyReportRow>[] = [
    { key: "rep", header: "المندوب", cell: (row) => <TextCell value={row.rep?.name} />, width: "w-44", priority: "high", role: "primary" },
    { key: "work_date", header: "يوم العمل", cell: (row) => <span className="whitespace-nowrap">{row.work_date ? dayLabel(row.work_date) : "—"}</span>, width: "w-44", priority: "high" },
    {
      key: "received_at",
      header: "الاستلام",
      cell: (row) => (
        <span className="flex min-w-0 items-center gap-2">
          <DateTimeStackCell value={row.received_at} />
          {row.on_time === false ? <Badge color="warning">بعد الموعد</Badge> : null}
        </span>
      ),
      width: "w-52",
    },
    {
      key: "rating",
      header: "التقييم",
      cell: (row) => {
        if (row.rating?.score) {
          return (
            <span className="flex min-w-0 flex-col">
              <span className="truncate text-body text-fg">{`${ratingScaleLabels[row.rating.score]} · ${isolate(row.rating.score)}`}</span>
              {row.rating.within_24_work_hours === false ? <span className="text-caption text-warning">بعد المهلة</span> : null}
            </span>
          );
        }
        const deadline = canRate ? ratingDeadline(row.rating_due_at, now) : null;
        return (
          <span className="flex min-w-0 flex-col items-start gap-1">
            <Badge color="warning">بانتظار التقييم</Badge>
            {deadline ? (
              deadline.late ? <Badge color="danger">متأخر</Badge> : <span className={deadline.urgent ? "text-caption text-warning" : "text-caption text-fg-muted"}>{deadline.label}</span>
            ) : null}
          </span>
        );
      },
      width: "w-52",
      priority: "high",
      role: "status",
    },
  ];

  const empty =
    active.length > 0 ? (
      <EmptyState
        icon={MagnifyingGlass}
        title="لا نتائج للفلتر"
        description="لا توجد تقارير تطابق ما اخترته. غيّر الفلاتر أو امسحها."
        action={
          <Button variant="secondary" onClick={clearAll}>
            مسح الفلاتر
          </Button>
        }
      />
    ) : (
      <EmptyState icon={Notebook} title="لا تقارير بعد" description="تظهر هنا التقارير اليومية حين يرسلها المندوبون." />
    );

  return (
    <>
      <PageHeader
        title="التقارير اليومية"
        description={canRate ? "تقارير مندوبي محافظاتك: بانتظار تقييمك أولاً، ولكل تقرير مهلة 24 ساعة عمل." : "تقارير كل المندوبين للاطلاع."}
      />

      <div className="flex flex-col gap-4">
        <FilterBar
          quickFilters={[
            <Combobox key="rep" aria-label="المندوب" placeholder="كل المندوبين" options={repOptions} value={filters.repId} onValueChange={(repId) => set({ repId })} clearable />,
            <DateRangePicker key="range" aria-label="الفترة" placeholder="كل الأوقات" value={filters.range} onValueChange={(range) => set({ range })} max={today} today={today} />,
            <Combobox
              key="rated"
              aria-label="الحالة"
              placeholder="كل الحالات"
              options={ratedOptions}
              value={filters.rated === null ? null : filters.rated ? "rated" : "pending"}
              onValueChange={(value) => set({ rated: value === null ? null : value === "rated" })}
              clearable
            />,
          ]}
          active={active}
          onClearAll={clearAll}
        />

        <DataTable
          label="التقارير اليومية"
          columns={columns}
          rows={reports.status === "ready" ? reports.data.data : []}
          getRowKey={(row) => row.id ?? ""}
          loading={reports.status === "loading"}
          error={reports.status === "error" ? { code: reports.code, onRetry } : undefined}
          empty={empty}
          onRowOpen={onOpenReport}
        />

        {reports.status === "ready" ? <Pagination meta={reports.data.meta} onPageChange={onPageChange} onPerPageChange={onPerPageChange} /> : null}
      </div>
    </>
  );
}
