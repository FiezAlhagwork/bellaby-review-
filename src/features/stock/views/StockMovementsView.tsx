"use client";

import { ArrowsLeftRight, MagnifyingGlass } from "@phosphor-icons/react";
import { BatchChip } from "@/components/data/BatchChip";
import { QuantityCell, StatusCell, TextCell } from "@/components/data/cells";
import { DataTable, type DataTableColumn } from "@/components/data/DataTable";
import { FilterBar, type ActiveFilter } from "@/components/data/FilterBar";
import { Pagination, type PaginationMeta } from "@/components/data/Pagination";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/Button";
import { Combobox } from "@/components/ui/Combobox";
import { DateRangePicker, type DateRange } from "@/components/ui/DateRangePicker";
import { EmptyState } from "@/components/ui/EmptyState";
import { Field } from "@/components/ui/Field";
import type { Option } from "@/components/ui/OptionList";
import type { BatchRef, ItemRef, Location, StockMovement } from "@/lib/api/types";
import { dayLabel, type IsoDate } from "@/lib/calendar";
import { formatDateShort, formatTime, isolate } from "@/lib/format";
import type { Loadable } from "@/lib/loadable";

/** الفلاتر كما يرسلها العقد: `location_id` و`item_id` و`batch_id` و`from` و`to`. تغيّرها يعيد الأب إلى الصفحة الأولى. */
export type StockMovementFilters = {
  locationId: string | null;
  itemId: string | null;
  batchId: string | null;
  range: DateRange;
};

export const noStockMovementFilters: StockMovementFilters = { locationId: null, itemId: null, batchId: null, range: { from: null, to: null } };

/** صفحة من `GET /stock/movements` (`Paginated`): السطور و`meta` بأسلوب Laravel. */
export type StockMovementsPage = { data: readonly StockMovement[]; meta: PaginationMeta };

type StockMovementsViewProps = {
  movements: Loadable<StockMovementsPage>;
  /** `GET /locations`: خيارات فلتر الموقع. */
  locations: readonly Location[];
  /** خيارات فلتر الصنف. */
  items: readonly ItemRef[];
  /** خيارات فلتر الدفعة (الأب يمرّر دفعات الصنف المختار إن وُجد). */
  batches: readonly BatchRef[];
  filters: StockMovementFilters;
  onFiltersChange: (filters: StockMovementFilters) => void;
  onPageChange: (page: number) => void;
  onPerPageChange: (perPage: number) => void;
  /** اليوم (بتوقيت دمشق) لحالة الدفعات وحدّ منتقي الفترة. يُمرَّر فيبقى الـ view نقياً. */
  today: IsoDate;
  onRetry?: () => void;
};

/** `10/11/2026` فوق `14:05`: عمود ضيق بسطرين (التاريخ المختصر للجداول الكثيفة). */
function TimeCell({ value }: { value: string | undefined }) {
  if (!value) return <TextCell value={null} />;
  return (
    <span className="flex min-w-0 flex-col">
      <span dir="ltr" className="block truncate text-end text-body text-fg">
        {formatDateShort(value)}
      </span>
      <span dir="ltr" className="block text-end text-caption text-fg-muted">
        {formatTime(value)}
      </span>
    </span>
  );
}

/** «من» و«إلى» بسطرين، والطرف الفارغ (تالف، إدخال) لا يُكتب. */
function RouteCell({ from, to }: { from: string | undefined; to: string | undefined }) {
  if (!from && !to) return <TextCell value={null} />;
  return (
    <span className="flex min-w-0 flex-col text-caption text-fg">
      {from ? (
        <span className="truncate">
          <span className="text-fg-muted">من </span>
          {from}
        </span>
      ) : null}
      {to ? (
        <span className="truncate">
          <span className="text-fg-muted">إلى </span>
          {to}
        </span>
      ) : null}
    </span>
  );
}

/** المرجع كما يصل (`ref_type` ورقمه). وللعكس يحل سطر «يعكس الحركة» محل نوع المرجع (يبقى في التلميح) فيبقى الصف سطرين. */
function ReferenceCell({ movement }: { movement: StockMovement }) {
  if (movement.ref_id === undefined) return <TextCell value={null} />;
  return (
    <span className="flex min-w-0 flex-col" title={movement.ref_type}>
      {movement.reverses_id ? (
        <span className="block truncate text-end text-caption text-fg-muted">{`يعكس الحركة ${isolate(`#${movement.reverses_id}`)}`}</span>
      ) : (
        <span dir="ltr" className="block truncate text-end text-caption text-fg-muted">
          {movement.ref_type}
        </span>
      )}
      <span dir="ltr" className="block text-end text-body text-fg">
        {`#${movement.ref_id}`}
      </span>
    </span>
  );
}

/**
 * حركات المخزون (W03): سجل «إضافة فقط» لكل ما غيّر المخزون. فلاتر الموقع والصنف والفترة (والدفعة في «فلاتر أخرى»)، وجدول مرقّم.
 * للقراءة فقط: لا شاشة تفاصيل للحركة في العقد فالصف غير قابل للفتح.
 */
export function StockMovementsView({ movements, locations, items, batches, filters, onFiltersChange, onPageChange, onPerPageChange, today, onRetry }: StockMovementsViewProps) {
  const locationOptions: Option[] = locations.flatMap((location) => (location.id !== undefined && location.name ? [{ value: String(location.id), label: location.name }] : []));
  const itemOptions: Option[] = items.flatMap((item) => (item.id !== undefined && item.name ? [{ value: String(item.id), label: item.name }] : []));
  const batchOptions: Option[] = batches.flatMap((batch) => (batch.id !== undefined && batch.batch_no ? [{ value: String(batch.id), label: batch.batch_no }] : []));

  const set = (patch: Partial<StockMovementFilters>) => onFiltersChange({ ...filters, ...patch });
  const clearAll = () => onFiltersChange(noStockMovementFilters);

  const { from, to } = filters.range;
  const rangeLabel = from === null ? null : to === null || to === from ? `الفترة: ${dayLabel(from)}` : `الفترة: ${dayLabel(from)} ← ${dayLabel(to)}`;

  const active: ActiveFilter[] = [
    ...(filters.locationId ? [{ key: "location", label: `الموقع: ${locationOptions.find((o) => o.value === filters.locationId)?.label ?? ""}`, onRemove: () => set({ locationId: null }) }] : []),
    ...(filters.itemId ? [{ key: "item", label: `الصنف: ${itemOptions.find((o) => o.value === filters.itemId)?.label ?? ""}`, onRemove: () => set({ itemId: null, batchId: null }) }] : []),
    ...(filters.batchId ? [{ key: "batch", label: `الدفعة: ${batchOptions.find((o) => o.value === filters.batchId)?.label ?? ""}`, onRemove: () => set({ batchId: null }) }] : []),
    ...(rangeLabel ? [{ key: "range", label: rangeLabel, onRemove: () => set({ range: { from: null, to: null } }) }] : []),
  ];

  const columns: DataTableColumn<StockMovement>[] = [
    { key: "occurred_at", header: "الوقت", cell: (row) => <TimeCell value={row.occurred_at} />, width: "w-28", priority: "high" },
    { key: "kind", header: "النوع", cell: (row) => (row.kind ? <StatusCell entity="stockMovementKind" status={row.kind} /> : <TextCell value={null} />), width: "w-32", priority: "high", role: "status" },
    {
      key: "item",
      header: "الصنف",
      cell: (row) => (
        <span className="flex min-w-0 flex-col">
          <span className="truncate text-body text-fg">{row.item?.name}</span>
          <span dir="ltr" className="block text-end text-caption text-fg-muted">
            {row.item?.sku}
          </span>
        </span>
      ),
      priority: "high",
      role: "primary",
    },
    { key: "batch", header: "الدفعة", cell: (row) => (row.batch ? <BatchChip batch={row.batch} today={today} hideExpiry /> : <TextCell value={null} />), width: "w-32" },
    { key: "quantity", header: "الكمية", cell: (row) => <QuantityCell value={row.quantity} />, align: "end", width: "w-20", priority: "high" },
    { key: "route", header: "الموقع", cell: (row) => <RouteCell from={row.from_location?.name} to={row.to_location?.name} />, width: "w-40", priority: "high" },
    { key: "by", header: "المنفّذ", cell: (row) => <TextCell value={row.by?.name} />, width: "w-32" },
    { key: "reference", header: "المرجع", cell: (row) => <ReferenceCell movement={row} />, align: "end", width: "w-36" },
  ];

  const empty =
    active.length > 0 ? (
      <EmptyState
        icon={MagnifyingGlass}
        title="لا نتائج للفلتر"
        description="لا توجد حركات تطابق ما اخترته. غيّر الفلاتر أو امسحها."
        action={
          <Button variant="secondary" onClick={clearAll}>
            مسح الفلاتر
          </Button>
        }
      />
    ) : (
      <EmptyState icon={ArrowsLeftRight} title="لا حركات بعد" description="تظهر هنا كل حركة تغيّر المخزون: إدخال وصرف واستلام وإرجاع وتسوية وتالف." />
    );

  return (
    <>
      <PageHeader title="الحركات" description="سجل كل ما غيّر المخزون، من الأحدث إلى الأقدم. للقراءة فقط." />

      <div className="flex flex-col gap-4">
        <FilterBar
          quickFilters={[
            <Combobox
              key="location"
              aria-label="الموقع"
              placeholder="كل المواقع"
              options={locationOptions}
              value={filters.locationId}
              onValueChange={(locationId) => set({ locationId })}
              clearable
            />,
            <Combobox
              key="item"
              aria-label="الصنف"
              placeholder="كل الأصناف"
              options={itemOptions}
              value={filters.itemId}
              onValueChange={(itemId) => set({ itemId, batchId: null })}
              clearable
            />,
            <DateRangePicker key="range" aria-label="الفترة" placeholder="كل الأوقات" value={filters.range} onValueChange={(range) => set({ range })} max={today} today={today} />,
          ]}
          moreFilters={
            <Field label="الدفعة" hint="دفعات الصنف المختار إن اخترت صنفاً.">
              <Combobox aria-label="الدفعة" placeholder="كل الدفعات" options={batchOptions} value={filters.batchId} onValueChange={(batchId) => set({ batchId })} clearable />
            </Field>
          }
          active={active}
          onClearAll={clearAll}
        />

        <DataTable
          label="حركات المخزون"
          columns={columns}
          rows={movements.status === "ready" ? movements.data.data : []}
          getRowKey={(row) => row.id ?? `${row.occurred_at}-${row.ref_id}`}
          loading={movements.status === "loading"}
          error={movements.status === "error" ? { code: movements.code, onRetry } : undefined}
          empty={empty}
        />

        {movements.status === "ready" ? <Pagination meta={movements.data.meta} onPageChange={onPageChange} onPerPageChange={onPerPageChange} /> : null}
      </div>
    </>
  );
}
