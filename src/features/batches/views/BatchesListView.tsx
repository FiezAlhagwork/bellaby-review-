"use client";

import { Clock, MagnifyingGlass, Barcode } from "@phosphor-icons/react";
import { QuantityCell, StatusCell, TextCell } from "@/components/data/cells";
import { DataTable, type DataTableColumn } from "@/components/data/DataTable";
import { FilterBar, type ActiveFilter } from "@/components/data/FilterBar";
import { Pagination, type PaginationMeta } from "@/components/data/Pagination";
import { statusMap } from "@/components/data/status-map";
import { PageHeader } from "@/components/layout/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Checkbox } from "@/components/ui/Checkbox";
import { Combobox } from "@/components/ui/Combobox";
import { EmptyState } from "@/components/ui/EmptyState";
import type { Option } from "@/components/ui/OptionList";
import type { Batch, BatchRef, ItemRef } from "@/lib/api/types";
import { dayLabel } from "@/lib/calendar";
import { isolate } from "@/lib/format";
import type { Loadable } from "@/lib/loadable";

type BatchStatus = NonNullable<BatchRef["status"]>;

/** الفلاتر كما يرسلها العقد: `item_id` و`status` و`in_stock`. تغيّرها يعيد الأب إلى الصفحة الأولى. */
export type BatchFilters = {
  itemId: string | null;
  status: BatchStatus | null;
  /** `in_stock=true`: الدفعات التي ما زال لها رصيد. */
  inStock: boolean;
};

export const noBatchFilters: BatchFilters = { itemId: null, status: null, inStock: false };

/** صفحة من `GET /batches` (`Paginated`): الدفعات و`meta` بأسلوب Laravel. */
export type BatchesPage = { data: readonly Batch[]; meta: PaginationMeta };

type BatchesListViewProps = {
  batches: Loadable<BatchesPage>;
  /** أصناف فلتر الصنف (`GET /items`). */
  items: readonly ItemRef[];
  filters: BatchFilters;
  onFiltersChange: (filters: BatchFilters) => void;
  onPageChange: (page: number) => void;
  onPerPageChange: (perPage: number) => void;
  /** يفتح تفاصيل الدفعة (W18). بدونه الصفوف للقراءة فقط. */
  onOpenBatch?: (batch: Batch) => void;
  onRetry?: () => void;
  /** مهلة تنبيه قرب الانتهاء بالأيام (`expiry_alert_days` من الإعدادات). الافتراضي 60. */
  expiryAlertDays?: number;
};

const statusOptions: Option[] = (Object.keys(statusMap.batch) as BatchStatus[]).map((status) => ({ value: status, label: statusMap.batch[status].label }));

/** تاريخ الانتهاء ومعه تنبيه من `days_to_expiry` في العقد: منتهية (danger) أو تنتهي قريباً (warning). */
function ExpiryCell({ batch, expiryAlertDays }: { batch: Batch; expiryAlertDays: number }) {
  const days = batch.days_to_expiry;
  return (
    <span className="flex min-w-0 flex-col items-start gap-1">
      <span className="whitespace-nowrap text-body text-fg">{batch.expiry_date ? dayLabel(batch.expiry_date) : "—"}</span>
      {days === undefined ? null : days < 0 ? (
        <Badge color="danger">{`منتهية منذ ${isolate(-days)} يوماً`}</Badge>
      ) : days <= expiryAlertDays ? (
        <Badge color="warning" icon={Clock}>{`تنتهي بعد ${isolate(days)} يوماً`}</Badge>
      ) : null}
    </span>
  );
}

/**
 * الدفعات (W17): جدول بالصنف ورقم الدفعة وتاريخ الانتهاء والكمية الكلية (المستلمة) وما بقي منها في المستودع والحالة.
 * فلاتر الصنف والحالة و«المتوفرة فقط»، وترقيم. الصف يفتح التفاصيل (W18)، حيث الإيقاف وفكّه.
 */
export function BatchesListView({ batches, items, filters, onFiltersChange, onPageChange, onPerPageChange, onOpenBatch, onRetry, expiryAlertDays = 60 }: BatchesListViewProps) {
  const itemOptions: Option[] = items.flatMap((item) => (item.id !== undefined && item.name ? [{ value: String(item.id), label: item.name }] : []));

  const set = (patch: Partial<BatchFilters>) => onFiltersChange({ ...filters, ...patch });
  const clearAll = () => onFiltersChange(noBatchFilters);

  const active: ActiveFilter[] = [
    ...(filters.itemId ? [{ key: "item", label: `الصنف: ${itemOptions.find((o) => o.value === filters.itemId)?.label ?? ""}`, onRemove: () => set({ itemId: null }) }] : []),
    ...(filters.status ? [{ key: "status", label: `الحالة: ${statusMap.batch[filters.status].label}`, onRemove: () => set({ status: null }) }] : []),
    ...(filters.inStock ? [{ key: "in-stock", label: "المتوفرة فقط", onRemove: () => set({ inStock: false }) }] : []),
  ];

  const columns: DataTableColumn<Batch>[] = [
    {
      key: "item",
      header: "الصنف",
      cell: (row) => (
        <span className="flex min-w-0 flex-col">
          <span className="truncate text-body text-fg">{row.item?.name}</span>
          <span className="truncate text-caption text-fg-muted">{row.item?.sku ? isolate(row.item.sku) : ""}</span>
        </span>
      ),
      priority: "high",
      role: "primary",
    },
    { key: "batch_no", header: "رقم الدفعة", cell: (row) => (row.batch_no ? <span className="block truncate tabular-nums">{isolate(row.batch_no)}</span> : <TextCell value={null} />), width: "w-36", priority: "high" },
    { key: "expiry", header: "تاريخ الانتهاء", cell: (row) => <ExpiryCell batch={row} expiryAlertDays={expiryAlertDays} />, width: "w-52", priority: "high" },
    { key: "received", header: "الكمية الكلية", cell: (row) => <QuantityCell value={row.received_total} />, align: "end", width: "w-32" },
    { key: "on-hand", header: "في المستودع", cell: (row) => (row.warehouse_on_hand === 0 ? <span className="text-fg-muted">لا شيء</span> : <QuantityCell value={row.warehouse_on_hand} />), align: "end", width: "w-32", priority: "high" },
    { key: "status", header: "الحالة", cell: (row) => (row.status ? <StatusCell entity="batch" status={row.status} /> : <TextCell value={null} />), width: "w-28", priority: "high", role: "status" },
  ];

  const empty =
    active.length > 0 ? (
      <EmptyState
        icon={MagnifyingGlass}
        title="لا نتائج للفلتر"
        description="لا توجد دفعات تطابق ما اخترته. غيّر الفلاتر أو امسحها."
        action={
          <Button variant="secondary" onClick={clearAll}>
            مسح الفلاتر
          </Button>
        }
      />
    ) : (
      <EmptyState icon={Barcode} title="لا دفعات بعد" description="تظهر هنا الدفعات حين تُدخل بضاعة بأرقام دفعاتها." />
    );

  return (
    <>
      <PageHeader title="الدفعات" description="دفعات الأصناف بتواريخ انتهائها ومتبقّيها. افتح دفعة لرؤية توزّعها وإيقافها." />

      <div className="flex flex-col gap-4">
        <FilterBar
          quickFilters={[
            <Combobox key="item" aria-label="الصنف" placeholder="كل الأصناف" options={itemOptions} value={filters.itemId} onValueChange={(itemId) => set({ itemId })} clearable />,
            <Combobox key="status" aria-label="الحالة" placeholder="كل الحالات" options={statusOptions} value={filters.status} onValueChange={(status) => set({ status: status as BatchStatus | null })} clearable />,
            <Checkbox key="in-stock" label="المتوفرة فقط" checked={filters.inStock} onCheckedChange={(inStock) => set({ inStock })} />,
          ]}
          active={active}
          onClearAll={clearAll}
        />

        <DataTable
          label="الدفعات"
          columns={columns}
          rows={batches.status === "ready" ? batches.data.data : []}
          getRowKey={(row) => row.id ?? ""}
          loading={batches.status === "loading"}
          error={batches.status === "error" ? { code: batches.code, onRetry } : undefined}
          empty={empty}
          onRowOpen={onOpenBatch}
        />

        {batches.status === "ready" ? <Pagination meta={batches.data.meta} onPageChange={onPageChange} onPerPageChange={onPerPageChange} /> : null}
      </div>
    </>
  );
}
