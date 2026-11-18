"use client";

import { MagnifyingGlass, TrendUp } from "@phosphor-icons/react";
import { DateCell, DateTimeStackCell, TextCell } from "@/components/data/cells";
import { DataTable, type DataTableColumn } from "@/components/data/DataTable";
import { FilterBar, type ActiveFilter } from "@/components/data/FilterBar";
import { intelColumns, intelTypeLabels, intelTypeOrder } from "@/components/data/intel-types";
import { Pagination, type PaginationMeta } from "@/components/data/Pagination";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/Button";
import { Combobox } from "@/components/ui/Combobox";
import { DateRangePicker, type DateRange } from "@/components/ui/DateRangePicker";
import { EmptyState } from "@/components/ui/EmptyState";
import type { Option } from "@/components/ui/OptionList";
import { Tabs, type TabItem } from "@/components/ui/Tabs";
import type { Governorate, IntelType, MarketIntel } from "@/lib/api/types";
import { dayLabel, type IsoDate } from "@/lib/calendar";
import { formatQuantity, isolate } from "@/lib/format";
import type { Loadable } from "@/lib/loadable";

/** الفلاتر كما يرسلها العقد: `type` (التبويب) و`governorate_id` («المنطقة») و`from`/`to`. تغيّرها يعيد الأب إلى الصفحة الأولى. */
export type MarketIntelFilters = {
  type: IntelType;
  governorateId: string | null;
  range: DateRange;
};

export const defaultMarketIntelFilters: MarketIntelFilters = { type: "COMPETITOR_PRICE", governorateId: null, range: { from: null, to: null } };

/** صفحة من `GET /market-intel` (`Paginated`) للنوع المختار. */
export type MarketIntelPage = { data: readonly MarketIntel[]; meta: PaginationMeta };

type MarketIntelViewProps = {
  reports: Loadable<MarketIntelPage>;
  /** خيارات فلتر المنطقة (المحافظات). */
  governorates: readonly Governorate[];
  filters: MarketIntelFilters;
  onFiltersChange: (filters: MarketIntelFilters) => void;
  onPageChange: (page: number) => void;
  onPerPageChange: (perPage: number) => void;
  /** اليوم (بتوقيت دمشق): حدّ منتقي الفترة. يُمرَّر فيبقى الـ view نقياً. */
  today: IsoDate;
  onRetry?: () => void;
};

const tabs: readonly TabItem<IntelType>[] = intelTypeOrder.map((type) => ({ value: type, label: intelTypeLabels[type] }));

/** نص حقل من `fields` (كائن مفتوح في العقد): نص أو رقم، وغير ذلك «—». السعر رقم صحيح بالليرة بفواصل الآلاف، بلا حساب عليه. */
function fieldCell(row: MarketIntel, key: string, kind: "price" | "date" | undefined) {
  const value = (row.fields as Record<string, unknown> | undefined)?.[key];
  if (value === null || value === undefined || value === "") return <TextCell value={null} />;
  if (kind === "date" && typeof value === "string") return <DateCell value={value} />;
  if (typeof value === "number") return <TextCell value={Number.isInteger(value) ? isolate(formatQuantity(value)) : isolate(value)} />;
  return <TextCell value={String(value)} />;
}

/**
 * تقرير معلومات السوق (M16): ما يسجّله المندوبون من أسعار المنافسين والمنتجات الجديدة والعروض والمطلوب والراكد. تبويب لكل نوع،
 * وأعمدة الجدول حقول النوع المختار. فلتر المنطقة والفترة، وترقيم. قراءة فقط.
 */
export function MarketIntelView({ reports, governorates, filters, onFiltersChange, onPageChange, onPerPageChange, today, onRetry }: MarketIntelViewProps) {
  const governorateOptions: Option[] = governorates.flatMap((governorate) => (governorate.id !== undefined && governorate.name ? [{ value: String(governorate.id), label: governorate.name }] : []));

  const set = (patch: Partial<MarketIntelFilters>) => onFiltersChange({ ...filters, ...patch });
  const clearAll = () => onFiltersChange({ ...filters, governorateId: null, range: { from: null, to: null } });

  const { from, to } = filters.range;
  const rangeLabel = from === null ? null : to === null || to === from ? `الفترة: ${dayLabel(from)}` : `الفترة: ${dayLabel(from)} ← ${dayLabel(to)}`;
  const active: ActiveFilter[] = [
    ...(filters.governorateId ? [{ key: "governorate", label: `المنطقة: ${governorateOptions.find((o) => o.value === filters.governorateId)?.label ?? ""}`, onRemove: () => set({ governorateId: null }) }] : []),
    ...(rangeLabel ? [{ key: "range", label: rangeLabel, onRemove: () => set({ range: { from: null, to: null } }) }] : []),
  ];

  const columns: DataTableColumn<MarketIntel>[] = [
    ...intelColumns[filters.type].map((column, index): DataTableColumn<MarketIntel> => ({
      key: column.key,
      header: column.header,
      cell: (row) => fieldCell(row, column.key, "kind" in column ? column.kind : undefined),
      priority: index < 2 ? "high" : "normal",
      role: index === 0 ? "primary" : undefined,
    })),
    { key: "governorate", header: "المنطقة", cell: (row) => <TextCell value={row.governorate?.name} />, width: "w-28" },
    { key: "rep", header: "المندوب", cell: (row) => <TextCell value={row.rep?.name} />, width: "w-36" },
    { key: "reported_at", header: "التاريخ", cell: (row) => <DateTimeStackCell value={row.reported_at} />, width: "w-28", priority: "high" },
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
      <EmptyState icon={TrendUp} title={`لا تقارير من نوع «${intelTypeLabels[filters.type]}»`} description="تصل هنا ما يسجّله المندوبون من السوق أثناء زياراتهم." />
    );

  return (
    <>
      <PageHeader title="معلومات السوق" description="ما يسجّله المندوبون من السوق: أسعار المنافسين، والمنتجات الجديدة والعروض، وما يُطلب منا وما يركد." />

      <div className="flex flex-col gap-4">
        <Tabs aria-label="نوع التقرير" tabs={tabs} value={filters.type} onValueChange={(type) => set({ type })} />

        <FilterBar
          quickFilters={[
            <Combobox key="governorate" aria-label="المنطقة" placeholder="كل المناطق" options={governorateOptions} value={filters.governorateId} onValueChange={(governorateId) => set({ governorateId })} clearable />,
            <DateRangePicker key="range" aria-label="الفترة" placeholder="كل الأوقات" value={filters.range} onValueChange={(range) => set({ range })} max={today} today={today} />,
          ]}
          active={active}
          onClearAll={clearAll}
        />

        <DataTable
          label={`معلومات السوق: ${intelTypeLabels[filters.type]}`}
          columns={columns}
          rows={reports.status === "ready" ? reports.data.data : []}
          getRowKey={(row) => row.id ?? ""}
          loading={reports.status === "loading"}
          error={reports.status === "error" ? { code: reports.code, onRetry } : undefined}
          empty={empty}
        />

        {reports.status === "ready" ? <Pagination meta={reports.data.meta} onPageChange={onPageChange} onPerPageChange={onPerPageChange} /> : null}
      </div>
    </>
  );
}
