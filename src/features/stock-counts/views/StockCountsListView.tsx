"use client";

import { ClipboardText, MagnifyingGlass } from "@phosphor-icons/react";
import { DateTimeStackCell, StatusCell, TextCell } from "@/components/data/cells";
import { DataTable, type DataTableColumn } from "@/components/data/DataTable";
import { FilterBar, type ActiveFilter } from "@/components/data/FilterBar";
import { Pagination, type PaginationMeta } from "@/components/data/Pagination";
import { statusMap } from "@/components/data/status-map";
import { PageHeader, type PageAction } from "@/components/layout/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Combobox } from "@/components/ui/Combobox";
import { EmptyState } from "@/components/ui/EmptyState";
import type { Option } from "@/components/ui/OptionList";
import type { Location, StockCount, UserRef } from "@/lib/api/types";
import { isolate } from "@/lib/format";
import type { Loadable } from "@/lib/loadable";

type StockCountStatus = NonNullable<StockCount["status"]>;

/** الفلاتر كما يرسلها العقد: `status` و`location_id` و`assigned_to` (معرّف المستخدم). تغيّرها يعيد الأب إلى الصفحة الأولى. */
export type StockCountFilters = {
  status: StockCountStatus | null;
  locationId: string | null;
  assignedToId: string | null;
};

export const noStockCountFilters: StockCountFilters = { status: null, locationId: null, assignedToId: null };

/** صفحة من `GET /stock-counts` (`Paginated`): الجرود و`meta` بأسلوب Laravel. */
export type StockCountsPage = { data: readonly StockCount[]; meta: PaginationMeta };

type StockCountsListViewProps = {
  counts: Loadable<StockCountsPage>;
  /** مواقع المستودع `GET /locations?type=WAREHOUSE`: خيارات فلتر الموقع. */
  locations: readonly Location[];
  /** عمال المستودع: خيارات فلتر المكلَّف. */
  workers: readonly UserRef[];
  filters: StockCountFilters;
  onFiltersChange: (filters: StockCountFilters) => void;
  onPageChange: (page: number) => void;
  onPerPageChange: (perPage: number) => void;
  /** إنشاء جرد: `stock_counts.create`. بدونها لا زر «جرد جديد» (عامل المستودع). */
  canCreate: boolean;
  /**
   * فلتر المكلَّف يظهر لمن يرى كل الجرود. عامل المستودع يرى المسنَد إليه فقط (الخادم يحصرها)، فلا معنى له عنده.
   * العقد لا يذكر هذا الحصر صراحة: docs/backend-requests.md §17.2.
   */
  showAssigneeFilter: boolean;
  onCreate?: () => void;
  /** يفتح الجرد (W15). بدونه الصفوف للقراءة فقط. */
  onOpenCount?: (count: StockCount) => void;
  onRetry?: () => void;
};

const statusOptions: Option[] = (Object.keys(statusMap.stockCount) as StockCountStatus[]).map((status) => ({ value: status, label: statusMap.stockCount[status].label }));

/** الأسطر الحالية: ما بقي بعد إعادة العدّ (الأسطر القديمة `superseded` تبقى في السجل). */
export const currentLines = (count: StockCount) => (count.lines ?? []).filter((line) => !line.superseded);

/** عدد الأسطر التي فيها فرق عن المتوقع. */
export const differenceCount = (count: StockCount) => currentLines(count).filter((line) => (line.difference ?? 0) !== 0).length;

/**
 * الجرد (W14): جرود مواقع المستودع بحالاتها (قيد العدّ، مرسل، معتمد، ملغى) والمكلَّف وعدد الأسطر التي فيها فرق. فلاتر الحالة والموقع والمكلَّف، وترقيم.
 * الصف يفتح الجرد (W15). «جرد جديد» يفتح نافذة الإنشاء (للوجستي). عامل المستودع يرى المسنَد إليه فقط ولا ينشئ.
 */
export function StockCountsListView({ counts, locations, workers, filters, onFiltersChange, onPageChange, onPerPageChange, canCreate, showAssigneeFilter, onCreate, onOpenCount, onRetry }: StockCountsListViewProps) {
  const locationOptions: Option[] = locations.flatMap((location) => (location.id !== undefined && location.name ? [{ value: String(location.id), label: location.name }] : []));
  const workerOptions: Option[] = workers.flatMap((worker) => (worker.id !== undefined && worker.name ? [{ value: String(worker.id), label: worker.name }] : []));

  const set = (patch: Partial<StockCountFilters>) => onFiltersChange({ ...filters, ...patch });
  const clearAll = () => onFiltersChange(noStockCountFilters);

  const active: ActiveFilter[] = [
    ...(filters.status ? [{ key: "status", label: `الحالة: ${statusMap.stockCount[filters.status].label}`, onRemove: () => set({ status: null }) }] : []),
    ...(filters.locationId ? [{ key: "location", label: `الموقع: ${locationOptions.find((o) => o.value === filters.locationId)?.label ?? ""}`, onRemove: () => set({ locationId: null }) }] : []),
    ...(showAssigneeFilter && filters.assignedToId ? [{ key: "assigned", label: `المكلَّف: ${workerOptions.find((o) => o.value === filters.assignedToId)?.label ?? ""}`, onRemove: () => set({ assignedToId: null }) }] : []),
  ];

  const actions: PageAction[] = canCreate ? [{ id: "create", label: "جرد جديد", primary: true, onSelect: () => onCreate?.() }] : [];

  const columns: DataTableColumn<StockCount>[] = [
    { key: "location", header: "الموقع", cell: (row) => <TextCell value={row.location?.name} />, width: "w-48", priority: "high", role: "primary" },
    { key: "assigned", header: "المكلَّف", cell: (row) => <TextCell value={row.assigned_to?.name} />, width: "w-40" },
    { key: "created_at", header: "التاريخ", cell: (row) => <DateTimeStackCell value={row.created_at} />, width: "w-28", priority: "high" },
    {
      key: "differences",
      header: "الفروق",
      cell: (row) => {
        if (row.status === "CANCELLED") return <TextCell value={null} />;
        const diffs = differenceCount(row);
        return diffs > 0 ? <Badge color="warning">{`${isolate(diffs)} من ${isolate(currentLines(row).length)}`}</Badge> : <span className="text-fg-muted">{currentLines(row).length > 0 ? "لا فروق" : "—"}</span>;
      },
      width: "w-32",
      priority: "high",
    },
    { key: "status", header: "الحالة", cell: (row) => (row.status ? <StatusCell entity="stockCount" status={row.status} /> : <TextCell value={null} />), width: "w-36", priority: "high", role: "status" },
  ];

  const empty =
    active.length > 0 ? (
      <EmptyState
        icon={MagnifyingGlass}
        title="لا نتائج للفلتر"
        description="لا توجد جرود تطابق ما اخترته. غيّر الفلاتر أو امسحها."
        action={
          <Button variant="secondary" onClick={clearAll}>
            مسح الفلاتر
          </Button>
        }
      />
    ) : (
      <EmptyState
        icon={ClipboardText}
        title="لا جرود بعد"
        description={canCreate ? "ابدأ جرداً لموقع من مواقع المستودع، وأسنده لعامل إن شئت." : "تظهر هنا الجرود التي تُسند إليك."}
        action={
          canCreate ? (
            <Button variant="primary" onClick={onCreate}>
              جرد جديد
            </Button>
          ) : undefined
        }
      />
    );

  return (
    <>
      <PageHeader title="الجرد" description={showAssigneeFilter ? "جرود مواقع المستودع، من الأحدث إلى الأقدم." : "الجرود المسندة إليك، من الأحدث إلى الأقدم."} actions={actions} />

      <div className="flex flex-col gap-4">
        <FilterBar
          quickFilters={[
            <Combobox key="status" aria-label="الحالة" placeholder="كل الحالات" options={statusOptions} value={filters.status} onValueChange={(status) => set({ status: status as StockCountStatus | null })} clearable />,
            <Combobox key="location" aria-label="الموقع" placeholder="كل المواقع" options={locationOptions} value={filters.locationId} onValueChange={(locationId) => set({ locationId })} clearable />,
            ...(showAssigneeFilter
              ? [<Combobox key="assigned" aria-label="المكلَّف" placeholder="كل العمال" options={workerOptions} value={filters.assignedToId} onValueChange={(assignedToId) => set({ assignedToId })} clearable />]
              : []),
          ]}
          active={active}
          onClearAll={clearAll}
        />

        <DataTable
          label="الجرود"
          columns={columns}
          rows={counts.status === "ready" ? counts.data.data : []}
          getRowKey={(row) => row.id ?? ""}
          loading={counts.status === "loading"}
          error={counts.status === "error" ? { code: counts.code, onRetry } : undefined}
          empty={empty}
          onRowOpen={onOpenCount}
        />

        {counts.status === "ready" ? <Pagination meta={counts.data.meta} onPageChange={onPageChange} onPerPageChange={onPerPageChange} /> : null}
      </div>
    </>
  );
}
