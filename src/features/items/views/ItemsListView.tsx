"use client";

import { Cube, MagnifyingGlass } from "@phosphor-icons/react";
import { MoneyCell, NumberCell, TextCell } from "@/components/data/cells";
import { DataTable, type DataTableColumn } from "@/components/data/DataTable";
import { FilterBar, type ActiveFilter } from "@/components/data/FilterBar";
import { itemTypeLabels } from "@/components/data/item-types";
import { Pagination, type PaginationMeta } from "@/components/data/Pagination";
import { portfolioLabels } from "@/components/data/portfolio";
import { PageHeader } from "@/components/layout/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Combobox } from "@/components/ui/Combobox";
import { EmptyState } from "@/components/ui/EmptyState";
import type { Option } from "@/components/ui/OptionList";
import type { Item, ItemType } from "@/lib/api/types";
import type { Loadable } from "@/lib/loadable";

/** الفلاتر كما يرسلها العقد: `q` و`type` و`is_active`. تغيّرها يعيد الأب إلى الصفحة الأولى. */
export type ItemFilters = { q: string; type: ItemType | null; status: "active" | "inactive" | null };
export const noItemFilters: ItemFilters = { q: "", type: null, status: null };

export type ItemsPage = { data: readonly Item[]; meta: PaginationMeta };

type ItemsListViewProps = {
  items: Loadable<ItemsPage>;
  filters: ItemFilters;
  onFiltersChange: (filters: ItemFilters) => void;
  onPageChange: (page: number) => void;
  onPerPageChange: (perPage: number) => void;
  /** `items.manage`: «صنف جديد». */
  canCreate: boolean;
  onNewItem?: () => void;
  /** يفتح صفحة الصنف (E12). */
  onOpenItem?: (item: Item) => void;
  onRetry?: () => void;
};

const typeOptions: Option[] = (Object.keys(itemTypeLabels) as ItemType[]).map((type) => ({ value: type, label: itemTypeLabels[type] }));
const statusOptions: Option[] = [
  { value: "active", label: "مفعّل" },
  { value: "inactive", label: "معطّل" },
];

const columns: DataTableColumn<Item>[] = [
  {
    key: "name",
    header: "الصنف",
    cell: (row) => (
      <span className="flex min-w-0 flex-col">
        <span className="truncate text-body text-fg">{row.name}</span>
        <span dir="ltr" className="block text-end text-caption text-fg-muted">
          {row.sku}
        </span>
      </span>
    ),
    priority: "high",
    role: "primary",
  },
  { key: "type", header: "النوع", cell: (row) => <TextCell value={row.type ? itemTypeLabels[row.type] : null} />, width: "w-32", priority: "high" },
  { key: "portfolio", header: "المحفظة", cell: (row) => <TextCell value={row.portfolio ? portfolioLabels[row.portfolio] : null} />, width: "w-24" },
  {
    key: "price",
    header: "السعر أو التكلفة",
    cell: (row) => (
      <span className="flex flex-col items-end">
        <MoneyCell value={row.type === "PRODUCT" ? row.current_price : row.current_unit_cost} />
        <span className="text-caption text-fg-muted">{row.type === "PRODUCT" ? "سعر ساري" : "تكلفة الوحدة"}</span>
      </span>
    ),
    align: "end",
    width: "w-36",
    priority: "high",
  },
  { key: "min_stock", header: "الحد الأدنى", cell: (row) => <NumberCell value={row.min_stock} />, align: "end", width: "w-28" },
  { key: "site", header: "في الموقع", cell: (row) => (row.type === "PRODUCT" ? <TextCell value={row.show_on_site ? "يظهر" : "لا يظهر"} /> : <TextCell value={null} />), width: "w-24" },
  { key: "status", header: "الحالة", cell: (row) => <Badge color={row.is_active ? "success" : "neutral"}>{row.is_active ? "مفعّل" : "معطّل"}</Badge>, width: "w-24", role: "status" },
];

/**
 * الأصناف (E10): المنتجات والعينات والمواد الدعائية بسعرها الساري (للمنتج) أو تكلفة وحدتها (للعينة والمادة)، والحد الأدنى، وظهورها في الموقع، وحالتها.
 * بحث وفلتر النوع والحالة، وترقيم. الصف يفتح صفحة الصنف. لا حذف للأصناف (تعطيل فقط).
 */
export function ItemsListView({ items, filters, onFiltersChange, onPageChange, onPerPageChange, canCreate, onNewItem, onOpenItem, onRetry }: ItemsListViewProps) {
  const set = (patch: Partial<ItemFilters>) => onFiltersChange({ ...filters, ...patch });
  const active: ActiveFilter[] = [
    ...(filters.type ? [{ key: "type", label: `النوع: ${itemTypeLabels[filters.type]}`, onRemove: () => set({ type: null }) }] : []),
    ...(filters.status ? [{ key: "status", label: `الحالة: ${filters.status === "active" ? "مفعّل" : "معطّل"}`, onRemove: () => set({ status: null }) }] : []),
  ];

  const empty =
    active.length > 0 || filters.q !== "" ? (
      <EmptyState
        icon={MagnifyingGlass}
        title="لا نتائج"
        description="لا أصناف تطابق البحث أو الفلاتر."
        action={
          <Button variant="secondary" onClick={() => onFiltersChange(noItemFilters)}>
            مسح الفلاتر
          </Button>
        }
      />
    ) : (
      <EmptyState icon={Cube} title="لا أصناف بعد" description="أضف أول صنف ليظهر في المخزون والصرف والموقع." />
    );

  return (
    <>
      <PageHeader
        title="الأصناف"
        description="المنتجات بأسعارها السارية، والعينات والمواد الدعائية بتكلفة وحدتها. الصنف يُعطَّل ولا يُحذف."
        actions={canCreate && onNewItem ? [{ id: "new", label: "صنف جديد", primary: true, onSelect: onNewItem }] : undefined}
      />

      <div className="flex flex-col gap-4">
        <FilterBar
          search={{ value: filters.q, onChange: (q) => set({ q }), placeholder: "ابحث بالاسم أو الرمز" }}
          quickFilters={[
            <Combobox key="type" aria-label="النوع" placeholder="كل الأنواع" options={typeOptions} value={filters.type} onValueChange={(type) => set({ type: type as ItemType | null })} clearable />,
            <Combobox key="status" aria-label="الحالة" placeholder="كل الحالات" options={statusOptions} value={filters.status} onValueChange={(status) => set({ status: status as ItemFilters["status"] })} clearable />,
          ]}
          active={active}
          onClearAll={() => onFiltersChange(noItemFilters)}
        />

        <DataTable
          label="الأصناف"
          columns={columns}
          rows={items.status === "ready" ? items.data.data : []}
          getRowKey={(row) => row.id ?? ""}
          loading={items.status === "loading"}
          error={items.status === "error" ? { code: items.code, onRetry } : undefined}
          empty={empty}
          onRowOpen={onOpenItem}
        />

        {items.status === "ready" ? <Pagination meta={items.data.meta} onPageChange={onPageChange} onPerPageChange={onPerPageChange} /> : null}
      </div>
    </>
  );
}
