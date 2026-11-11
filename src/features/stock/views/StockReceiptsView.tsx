"use client";

import { MagnifyingGlass, Package } from "@phosphor-icons/react";
import { DateTimeStackCell, TextCell } from "@/components/data/cells";
import { DataTable, type DataTableColumn } from "@/components/data/DataTable";
import { DescriptionList } from "@/components/data/DescriptionList";
import { FilterBar, type ActiveFilter } from "@/components/data/FilterBar";
import { Pagination, type PaginationMeta } from "@/components/data/Pagination";
import { PageHeader, type PageAction } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/Button";
import { Combobox } from "@/components/ui/Combobox";
import { DateRangePicker, type DateRange } from "@/components/ui/DateRangePicker";
import { Drawer } from "@/components/ui/Drawer";
import { EmptyState } from "@/components/ui/EmptyState";
import type { Option } from "@/components/ui/OptionList";
import type { Location, StockReceipt } from "@/lib/api/types";
import { dayLabel, type IsoDate } from "@/lib/calendar";
import { formatDateTime, formatQuantity, isolate } from "@/lib/format";
import type { Loadable } from "@/lib/loadable";
import { ReceiptLinesList, receiptTotal } from "../components/ReceiptLinesList";

/** الفلاتر كما يرسلها العقد: `location_id` و`from` و`to` (لا فلتر صنف ولا دفعة في `GET /stock-receipts`). تغيّرها يعيد الأب إلى الصفحة الأولى. */
export type StockReceiptFilters = {
  locationId: string | null;
  range: DateRange;
};

export const noStockReceiptFilters: StockReceiptFilters = { locationId: null, range: { from: null, to: null } };

/** صفحة من `GET /stock-receipts` (`Paginated`): الإدخالات و`meta` بأسلوب Laravel. */
export type StockReceiptsPage = { data: readonly StockReceipt[]; meta: PaginationMeta };

type StockReceiptsViewProps = {
  receipts: Loadable<StockReceiptsPage>;
  /** `GET /locations`: خيارات فلتر الموقع. */
  locations: readonly Location[];
  filters: StockReceiptFilters;
  onFiltersChange: (filters: StockReceiptFilters) => void;
  onPageChange: (page: number) => void;
  onPerPageChange: (perPage: number) => void;
  /** الإدخال المفتوح في الدرج (يختاره الصف). null = مغلق. */
  selected: StockReceipt | null;
  onSelect: (receipt: StockReceipt | null) => void;
  /** اليوم (بتوقيت دمشق) لحالة الدفعات وحدّ منتقي الفترة. يُمرَّر فيبقى الـ view نقياً. */
  today: IsoDate;
  /** `expiry_alert_days` من الإعدادات. */
  expiryAlertDays?: number;
  /** ينقل إلى W04. بدونه لا يظهر زر «إدخال بضاعة». */
  onNewReceipt?: () => void;
  onRetry?: () => void;
};

/** «سطر واحد» · «سطران» · «3 أسطر». */
function linesPhrase(count: number): string {
  if (count === 1) return "سطر واحد";
  if (count === 2) return "سطران";
  return `${isolate(count)} أسطر`;
}

/**
 * سجل الإدخال (W05): كل إدخال في صف (الوقت والمرجع والموقع والأصناف ومجموع الكمية والمنفّذ)، يُفتح بالنقر في درج بأسطره ودفعاتها.
 * فلاتر الموقع والفترة، وترقيم. للقراءة فقط: التصحيح لا يتم من هنا (انظر docs/backend-requests.md).
 */
export function StockReceiptsView({
  receipts,
  locations,
  filters,
  onFiltersChange,
  onPageChange,
  onPerPageChange,
  selected,
  onSelect,
  today,
  expiryAlertDays = 60,
  onNewReceipt,
  onRetry,
}: StockReceiptsViewProps) {
  const locationOptions: Option[] = locations.flatMap((location) => (location.id !== undefined && location.name ? [{ value: String(location.id), label: location.name }] : []));

  const set = (patch: Partial<StockReceiptFilters>) => onFiltersChange({ ...filters, ...patch });
  const clearAll = () => onFiltersChange(noStockReceiptFilters);

  const { from, to } = filters.range;
  const rangeLabel = from === null ? null : to === null || to === from ? `الفترة: ${dayLabel(from)}` : `الفترة: ${dayLabel(from)} ← ${dayLabel(to)}`;

  const active: ActiveFilter[] = [
    ...(filters.locationId ? [{ key: "location", label: `الموقع: ${locationOptions.find((o) => o.value === filters.locationId)?.label ?? ""}`, onRemove: () => set({ locationId: null }) }] : []),
    ...(rangeLabel ? [{ key: "range", label: rangeLabel, onRemove: () => set({ range: { from: null, to: null } }) }] : []),
  ];

  const columns: DataTableColumn<StockReceipt>[] = [
    { key: "received_at", header: "الوقت", cell: (row) => <DateTimeStackCell value={row.received_at} />, width: "w-28", priority: "high" },
    {
      key: "reference",
      header: "المرجع",
      cell: (row) => (
        <span dir="ltr" className="block truncate text-end tabular-nums">
          {row.reference}
        </span>
      ),
      width: "w-32",
      priority: "high",
    },
    {
      key: "items",
      header: "الأصناف",
      cell: (row) => {
        const lines = row.lines ?? [];
        return (
          <span className="flex min-w-0 flex-col">
            <span className="truncate text-body text-fg">{lines[0]?.item?.name ?? "—"}</span>
            <span className="truncate text-caption text-fg-muted">{linesPhrase(lines.length)}</span>
          </span>
        );
      },
      priority: "high",
      role: "primary",
    },
    {
      key: "quantity",
      header: "الكمية",
      cell: (row) => (
        <span dir="ltr" className="tabular-nums">
          {formatQuantity(receiptTotal(row.lines ?? []))}
        </span>
      ),
      align: "end",
      width: "w-24",
      priority: "high",
    },
    { key: "location", header: "الموقع", cell: (row) => <TextCell value={row.location?.name} />, width: "w-44" },
    { key: "by", header: "المنفّذ", cell: (row) => <TextCell value={row.created_by?.name} />, width: "w-32" },
  ];

  const newReceiptAction: PageAction[] = onNewReceipt ? [{ id: "new-receipt", label: "إدخال بضاعة", primary: true, onSelect: onNewReceipt }] : [];

  const empty =
    active.length > 0 ? (
      <EmptyState
        icon={MagnifyingGlass}
        title="لا نتائج للفلتر"
        description="لا توجد إدخالات تطابق ما اخترته. غيّر الفلاتر أو امسحها."
        action={
          <Button variant="secondary" onClick={clearAll}>
            مسح الفلاتر
          </Button>
        }
      />
    ) : (
      <EmptyState
        icon={Package}
        title="لا إدخالات بعد"
        description="تظهر هنا كل بضاعة تُدخل إلى المستودع."
        action={
          onNewReceipt ? (
            <Button variant="primary" onClick={onNewReceipt}>
              إدخال بضاعة
            </Button>
          ) : undefined
        }
      />
    );

  return (
    <>
      <PageHeader title="سجل الإدخال" description="كل بضاعة أُدخلت إلى المستودع، من الأحدث إلى الأقدم." actions={newReceiptAction} />

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
            <DateRangePicker key="range" aria-label="الفترة" placeholder="كل الأوقات" value={filters.range} onValueChange={(range) => set({ range })} max={today} today={today} />,
          ]}
          active={active}
          onClearAll={clearAll}
        />

        <DataTable
          label="سجل الإدخال"
          columns={columns}
          rows={receipts.status === "ready" ? receipts.data.data : []}
          getRowKey={(row) => row.id ?? row.reference ?? ""}
          loading={receipts.status === "loading"}
          error={receipts.status === "error" ? { code: receipts.code, onRetry } : undefined}
          empty={empty}
          onRowOpen={onSelect}
        />

        {receipts.status === "ready" ? <Pagination meta={receipts.data.meta} onPageChange={onPageChange} onPerPageChange={onPerPageChange} /> : null}
      </div>

      <Drawer open={selected !== null} onOpenChange={(open) => (open ? undefined : onSelect(null))} title={selected?.reference ?? "تفاصيل الإدخال"} description={selected?.received_at ? formatDateTime(selected.received_at) : undefined} size="md">
        {selected ? (
          <div className="flex flex-col gap-6">
            <DescriptionList
              items={[
                { label: "الموقع", value: selected.location?.name },
                { label: "المنفّذ", value: selected.created_by?.name },
                { label: "ملاحظة", value: selected.note },
              ]}
            />
            <div className="flex flex-col gap-3">
              <h3 className="text-h3 font-semibold text-fg">الأسطر</h3>
              <ReceiptLinesList lines={selected.lines ?? []} today={today} expiryAlertDays={expiryAlertDays} />
            </div>
          </div>
        ) : null}
      </Drawer>
    </>
  );
}
