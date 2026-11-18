"use client";

import { MagnifyingGlass, Package } from "@phosphor-icons/react";
import { BatchChip } from "@/components/data/BatchChip";
import { QuantityCell, TextCell } from "@/components/data/cells";
import { DataTable, type DataTableColumn } from "@/components/data/DataTable";
import { FilterBar, type ActiveFilter } from "@/components/data/FilterBar";
import { PageHeader } from "@/components/layout/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { Banner } from "@/components/ui/Banner";
import { Button } from "@/components/ui/Button";
import { Combobox } from "@/components/ui/Combobox";
import { EmptyState } from "@/components/ui/EmptyState";
import type { Option } from "@/components/ui/OptionList";
import type { BalanceLine, ItemRef, Location } from "@/lib/api/types";
import type { IsoDate } from "@/lib/calendar";
import { countPhrase } from "@/lib/format";
import type { Loadable } from "@/lib/loadable";

/** الفلاتر: المندوب (`location_id` لموقعه) والصنف (`item_id`). */
export type RepSampleBalanceFilters = { locationId: string | null; itemId: string | null };

export const noRepSampleBalanceFilters: RepSampleBalanceFilters = { locationId: null, itemId: null };

/** مفتاح «ما وزّعه هذا الشهر»: موقع المندوب والصنف (مجموع كمياته في زيارات الشهر، يحسبه الأب: docs/backend-requests.md §55). */
export const distributedKey = (line: BalanceLine) => `${line.location?.id}-${line.item?.id}`;

type RepSampleBalancesViewProps = {
  /** `GET /stock/balances?location_type=REP&group_by=batch` بالفلاتر الحالية. */
  balances: Loadable<readonly BalanceLine[]>;
  /** ما وزّعه كل مندوب هذا الشهر من كل صنف بمفتاح `distributedKey`. loading/error = عمود «وزّع هذا الشهر» بلا رقم. */
  distributed: Loadable<Readonly<Record<string, number>>>;
  /** `GET /locations?type=REP`: خيارات فلتر المندوب. */
  reps: readonly Location[];
  /** خيارات فلتر الصنف (العينات والمواد). */
  items: readonly ItemRef[];
  filters: RepSampleBalanceFilters;
  onFiltersChange: (filters: RepSampleBalanceFilters) => void;
  /** الحدّ الذي يُعدّ الرصيد تحته «منخفضاً». العقد لا يحدّده بعد (§55): بدونه لا يُعلَّم منخفض، ويبقى «سالب» (جائز لرصيد المندوب وحده). */
  lowBelow?: number;
  /** اليوم (بتوقيت دمشق) لحالة الدفعات. يُمرَّر فيبقى الـ view نقياً. */
  today: IsoDate;
  onRetry?: () => void;
};

/** حالة رصيد السطر: سالب، أو منخفض (تحت `lowBelow`)، أو عادي. */
function levelOf(line: BalanceLine, lowBelow: number | undefined): "negative" | "low" | "ok" {
  const quantity = line.quantity ?? 0;
  if (quantity < 0) return "negative";
  return lowBelow !== undefined && quantity < lowBelow ? "low" : "ok";
}

/**
 * أرصدة عينات المندوبين (M17): لكل مندوب الصنف والدفعة والكمية وما وزّعه هذا الشهر. قراءة فقط.
 * الرصيد السالب (بعد تعارض مزامنة) والمنخفض يُعلَّمان في الصف، ويلخّصهما شريط فوق الجدول.
 */
export function RepSampleBalancesView({ balances, distributed, reps, items, filters, onFiltersChange, lowBelow, today, onRetry }: RepSampleBalancesViewProps) {
  const repOptions: Option[] = reps.flatMap((rep) => (rep.id !== undefined && rep.name ? [{ value: String(rep.id), label: rep.name }] : []));
  const itemOptions: Option[] = items.flatMap((item) => (item.id !== undefined && item.name ? [{ value: String(item.id), label: item.name }] : []));

  const set = (patch: Partial<RepSampleBalanceFilters>) => onFiltersChange({ ...filters, ...patch });
  const clearAll = () => onFiltersChange(noRepSampleBalanceFilters);

  const active: ActiveFilter[] = [
    ...(filters.locationId ? [{ key: "rep", label: `المندوب: ${repOptions.find((o) => o.value === filters.locationId)?.label ?? ""}`, onRemove: () => set({ locationId: null }) }] : []),
    ...(filters.itemId ? [{ key: "item", label: `الصنف: ${itemOptions.find((o) => o.value === filters.itemId)?.label ?? ""}`, onRemove: () => set({ itemId: null }) }] : []),
  ];

  const lines = balances.status === "ready" ? balances.data : [];
  const negativeCount = lines.filter((line) => levelOf(line, lowBelow) === "negative").length;
  const lowCount = lines.filter((line) => levelOf(line, lowBelow) === "low").length;

  const columns: DataTableColumn<BalanceLine>[] = [
    { key: "rep", header: "المندوب", cell: (row) => <TextCell value={row.location?.name} />, width: "w-40", priority: "high", role: "primary" },
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
    },
    { key: "batch", header: "الدفعة", cell: (row) => (row.batch ? <BatchChip batch={row.batch} today={today} hideExpiry /> : <TextCell value={null} />), width: "w-40" },
    {
      key: "quantity",
      header: "الكمية",
      cell: (row) => {
        const level = levelOf(row, lowBelow);
        return (
          <span className="flex items-center justify-end gap-2">
            {level === "negative" ? <Badge color="danger">سالب</Badge> : level === "low" ? <Badge color="warning">منخفض</Badge> : null}
            <QuantityCell value={row.quantity} />
          </span>
        );
      },
      align: "end",
      width: "w-40",
      priority: "high",
    },
    {
      key: "distributed",
      header: "وزّع هذا الشهر",
      cell: (row) => (distributed.status === "ready" ? <QuantityCell value={distributed.data[distributedKey(row)] ?? 0} /> : <TextCell value={null} />),
      align: "end",
      width: "w-36",
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
      <EmptyState icon={Package} title="لا عينات عند المندوبين" description="تظهر هنا أرصدة العينات والمواد الدعائية حين تُصرف للمندوبين." />
    );

  return (
    <>
      <PageHeader title="أرصدة عينات المندوبين" description="ما بيد كل مندوب من العينات والمواد الدعائية، وما وزّعه هذا الشهر." />

      <div className="flex flex-col gap-4">
        <FilterBar
          quickFilters={[
            <Combobox key="rep" aria-label="المندوب" placeholder="كل المندوبين" options={repOptions} value={filters.locationId} onValueChange={(locationId) => set({ locationId })} clearable />,
            <Combobox key="item" aria-label="الصنف" placeholder="كل الأصناف" options={itemOptions} value={filters.itemId} onValueChange={(itemId) => set({ itemId })} clearable />,
          ]}
          active={active}
          onClearAll={clearAll}
        />

        {negativeCount + lowCount > 0 ? (
          <Banner kind="warning" title="أرصدة تحتاج انتباهاً">
            {[
              negativeCount > 0 ? `${countPhrase(negativeCount, ["رصيد سالب", "رصيدان سالبان", "أرصدة سالبة"])} بعد تعارض في المزامنة` : null,
              lowCount > 0 ? `${countPhrase(lowCount, ["رصيد منخفض", "رصيدان منخفضان", "أرصدة منخفضة"])}، فاطلب عينات للمندوب المعني` : null,
            ]
              .filter(Boolean)
              .join("، ")}
            .
          </Banner>
        ) : null}

        <DataTable
          label="أرصدة عينات المندوبين"
          columns={columns}
          rows={lines}
          getRowKey={(row) => `${row.location?.id}-${row.batch?.id}`}
          loading={balances.status === "loading"}
          error={balances.status === "error" ? { code: balances.code, onRetry } : undefined}
          empty={empty}
        />
      </div>
    </>
  );
}
