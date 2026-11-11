"use client";

import { MagnifyingGlass, Package } from "@phosphor-icons/react";
import { BatchChip } from "@/components/data/BatchChip";
import { DateCell, QuantityCell, TextCell } from "@/components/data/cells";
import { DataTable, type DataTableColumn } from "@/components/data/DataTable";
import { FilterBar, type ActiveFilter } from "@/components/data/FilterBar";
import { itemTypeLabels } from "@/components/data/item-types";
import { PageHeader } from "@/components/layout/PageHeader";
import { Banner } from "@/components/ui/Banner";
import { Button } from "@/components/ui/Button";
import { Combobox } from "@/components/ui/Combobox";
import { DatePicker } from "@/components/ui/DatePicker";
import { EmptyState } from "@/components/ui/EmptyState";
import { Field } from "@/components/ui/Field";
import type { Option } from "@/components/ui/OptionList";
import { dayLabel, type IsoDate } from "@/lib/calendar";
import type { BalanceLine, ItemRef, ItemType, Location } from "@/lib/api/types";
import type { Loadable } from "@/lib/loadable";

/** الفلاتر كما يرسلها العقد: `location_id` و`item_id` و`item_type` و`at` (لحظة سابقة، بتاريخ اليوم المختار). */
export type StockBalanceFilters = {
  locationId: string | null;
  itemId: string | null;
  itemType: ItemType | null;
  /** الرصيد في لحظة سابقة: نهاية هذا اليوم بتوقيت دمشق. null = الآن. */
  at: IsoDate | null;
};

export const noStockBalanceFilters: StockBalanceFilters = { locationId: null, itemId: null, itemType: null, at: null };

type StockBalancesViewProps = {
  /** `GET /stock/balances` بالفلاتر الحالية (`group_by=batch`). */
  balances: Loadable<readonly BalanceLine[]>;
  /** `GET /locations`: خيارات فلتر الموقع. */
  locations: readonly Location[];
  /** خيارات فلتر الصنف. */
  items: readonly ItemRef[];
  filters: StockBalanceFilters;
  onFiltersChange: (filters: StockBalanceFilters) => void;
  /** يفتح الصف حركات هذا الصنف والدفعة. بدونه الجدول للقراءة فقط. */
  canOpenMovements: boolean;
  /** اليوم (بتوقيت دمشق) لحالة الدفعات وحدّ منتقي التاريخ. يُمرَّر فيبقى الـ view نقياً. */
  today: IsoDate;
  onRetry?: () => void;
  onOpenMovements?: (line: BalanceLine) => void;
};

const itemTypeOptions: readonly Option<ItemType>[] = (Object.keys(itemTypeLabels) as ItemType[]).map((type) => ({ value: type, label: itemTypeLabels[type] }));

/**
 * الأرصدة (W02): فلاتر الموقع والصنف والنوع، واختيار «الرصيد في لحظة سابقة»، ثم جدول الأرصدة مجمَّعة بالدفعة.
 * الرصيد في لحظة سابقة للقراءة فقط. عامل المستودع بلا فتح للصف.
 */
export function StockBalancesView({ balances, locations, items, filters, onFiltersChange, canOpenMovements, today, onRetry, onOpenMovements }: StockBalancesViewProps) {
  const locationOptions: Option[] = locations.flatMap((location) => (location.id !== undefined && location.name ? [{ value: String(location.id), label: location.name }] : []));
  const itemOptions: Option[] = items.flatMap((item) => (item.id !== undefined && item.name ? [{ value: String(item.id), label: item.name }] : []));

  const set = (patch: Partial<StockBalanceFilters>) => onFiltersChange({ ...filters, ...patch });
  const clearAll = () => onFiltersChange(noStockBalanceFilters);

  const active: ActiveFilter[] = [
    ...(filters.locationId ? [{ key: "location", label: `الموقع: ${locationOptions.find((o) => o.value === filters.locationId)?.label ?? ""}`, onRemove: () => set({ locationId: null }) }] : []),
    ...(filters.itemId ? [{ key: "item", label: `الصنف: ${itemOptions.find((o) => o.value === filters.itemId)?.label ?? ""}`, onRemove: () => set({ itemId: null }) }] : []),
    ...(filters.itemType ? [{ key: "type", label: `النوع: ${itemTypeLabels[filters.itemType]}`, onRemove: () => set({ itemType: null }) }] : []),
    ...(filters.at ? [{ key: "at", label: `الرصيد في: ${dayLabel(filters.at)}`, onRemove: () => set({ at: null }) }] : []),
  ];

  const columns: DataTableColumn<BalanceLine>[] = [
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
    { key: "batch", header: "الدفعة", cell: (row) => (row.batch ? <BatchChip batch={row.batch} today={today} hideExpiry /> : <TextCell value={null} />), width: "w-40", priority: "high" },
    { key: "expiry", header: "تاريخ الانتهاء", cell: (row) => <DateCell value={row.batch?.expiry_date} />, width: "w-40" },
    { key: "location", header: "الموقع", cell: (row) => <TextCell value={row.location?.name} />, width: "w-44", priority: "high" },
    { key: "quantity", header: "الكمية", cell: (row) => <QuantityCell value={row.quantity} />, align: "end", width: "w-24", priority: "high" },
    {
      key: "in_transit_out",
      header: "الخارج بالطريق",
      cell: (row) => (row.in_transit_out ? <QuantityCell value={row.in_transit_out} /> : <TextCell value={null} />),
      align: "end",
      width: "w-32",
    },
  ];

  const empty =
    active.length > 0 ? (
      <EmptyState
        icon={MagnifyingGlass}
        title="لا نتائج للفلتر"
        description="لا توجد أرصدة تطابق ما اخترته. غيّر الفلاتر أو امسحها."
        action={
          <Button variant="secondary" onClick={clearAll}>
            مسح الفلاتر
          </Button>
        }
      />
    ) : (
      <EmptyState icon={Package} title="لا أرصدة بعد" description="تظهر الأرصدة هنا حين تُدخل بضاعة إلى المستودع." />
    );

  return (
    <>
      <PageHeader title="الأرصدة" description="ما في المستودع وما خرج منه ولم يُؤكَّد استلامه." />

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
              onValueChange={(itemId) => set({ itemId })}
              clearable
            />,
            <Combobox
              key="type"
              aria-label="النوع"
              placeholder="كل الأنواع"
              options={itemTypeOptions}
              value={filters.itemType}
              onValueChange={(itemType) => set({ itemType })}
              clearable
            />,
          ]}
          moreFilters={
            <Field label="الرصيد في لحظة سابقة" hint="يعرض الأرصدة كما كانت في نهاية اليوم المختار.">
              <DatePicker aria-label="الرصيد في" placeholder="اختر تاريخاً" value={filters.at} onValueChange={(at) => set({ at })} max={today} today={today} />
            </Field>
          }
          active={active}
          onClearAll={clearAll}
        />

        {filters.at ? (
          <Banner
            kind="info"
            title="رصيد في لحظة سابقة"
            action={
              <Button variant="ghost" size="sm" onClick={() => set({ at: null })}>
                العودة للآن
              </Button>
            }
          >
            {`الأرصدة كما كانت في نهاية يوم ${dayLabel(filters.at)}. للقراءة فقط.`}
          </Banner>
        ) : null}

        <DataTable
          label="الأرصدة"
          columns={columns}
          rows={balances.status === "ready" ? balances.data : []}
          getRowKey={(row) => `${row.location?.id}-${row.batch?.id}`}
          loading={balances.status === "loading"}
          error={balances.status === "error" ? { code: balances.code, onRetry } : undefined}
          empty={empty}
          onRowOpen={canOpenMovements && onOpenMovements ? onOpenMovements : undefined}
        />
      </div>
    </>
  );
}
