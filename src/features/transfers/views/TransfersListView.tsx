"use client";

import { MagnifyingGlass, Truck } from "@phosphor-icons/react";
import { DateTimeStackCell, QuantityCell, StatusCell, TextCell } from "@/components/data/cells";
import { DataTable, type DataTableColumn } from "@/components/data/DataTable";
import { FilterBar, type ActiveFilter } from "@/components/data/FilterBar";
import { Pagination, type PaginationMeta } from "@/components/data/Pagination";
import { statusMap } from "@/components/data/status-map";
import { PageHeader, type PageAction } from "@/components/layout/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Checkbox } from "@/components/ui/Checkbox";
import { Combobox } from "@/components/ui/Combobox";
import { DateRangePicker, type DateRange } from "@/components/ui/DateRangePicker";
import { EmptyState } from "@/components/ui/EmptyState";
import type { Option } from "@/components/ui/OptionList";
import type { Location, Transfer } from "@/lib/api/types";
import { dayLabel, type IsoDate } from "@/lib/calendar";
import { CaptureRow } from "@/lib/design/CaptureMode";
import { isolate } from "@/lib/format";
import type { Loadable } from "@/lib/loadable";

type TransferStatus = NonNullable<Transfer["status"]>;

/**
 * الفلاتر كما يرسلها العقد: `status` و`to_location_id` و`from` و`to` و`in_transit_over_hours` (= `overdueHours` حين `overdue`).
 * `q` (بحث برقم الصرف أو اسم المستلم) غير موجود في العقد بعد، مضاف هنا بصفة مؤقتة وطلبه في docs/backend-requests.md §10.
 * تغيّرها يعيد الأب إلى الصفحة الأولى.
 */
export type TransferFilters = {
  q: string;
  status: TransferStatus | null;
  toLocationId: string | null;
  /** بالطريق أكثر من `overdueHours`: يفرض الحالة «بالطريق». */
  overdue: boolean;
  range: DateRange;
};

export const noTransferFilters: TransferFilters = { q: "", status: null, toLocationId: null, overdue: false, range: { from: null, to: null } };

/** صفحة من `GET /transfers` (`Paginated`): الصرفيات و`meta` بأسلوب Laravel. */
export type TransfersPage = { data: readonly Transfer[]; meta: PaginationMeta };

type TransfersListViewProps = {
  transfers: Loadable<TransfersPage>;
  /** المستلمون (وكلاء ومندوبون): `GET /locations?type=AGENT|REP`، لفلتر المستلم. */
  recipients: readonly Location[];
  filters: TransferFilters;
  onFiltersChange: (filters: TransferFilters) => void;
  onPageChange: (page: number) => void;
  onPerPageChange: (perPage: number) => void;
  /** اليوم (بتوقيت دمشق): حدّ منتقي الفترة. يُمرَّر فيبقى الـ view نقياً. */
  today: IsoDate;
  /** حدّ «غير مؤكَّد»: ساعات بالطريق (48 في العقد، وصف `hours_in_transit`). */
  overdueHours?: number;
  /** بحث المستلم من الخادم (`q` على `GET /locations`: مقترح). بدونه يصفّي المكوّن القائمة محلياً. */
  onRecipientQueryChange?: (query: string) => void;
  /** يفتح تفاصيل الصرف (W08). بدونه الصفوف للقراءة فقط. */
  onOpenTransfer?: (transfer: Transfer) => void;
  /** ينقل إلى W06. بدونه لا يظهر زر «صرف جديد». */
  onNewTransfer?: () => void;
  onRetry?: () => void;
};

const locationTypeLabels = { WAREHOUSE: "مستودع", AGENT: "وكيل", REP: "مندوب" } as const;

const statusOptions: Option[] = (Object.keys(statusMap.transfer) as TransferStatus[]).map((status) => ({ value: status, label: statusMap.transfer[status].label }));

/**
 * الصرف (W07): كل صرفية في صف (الرقم والمستلم والتاريخ والكمية والحالة وساعات بالطريق). ما مضى عليه أكثر من 48 ساعة بالطريق معلَّم
 * بشارة تحذير، ومعه فلتر «غير مؤكَّد» يعرضه وحده. بحث برقم الصرف أو المستلم، وفلاتر الحالة والمستلم والفترة، وترقيم. الصف يفتح W08.
 */
export function TransfersListView({
  transfers,
  recipients,
  filters,
  onFiltersChange,
  onPageChange,
  onPerPageChange,
  today,
  overdueHours = 48,
  onRecipientQueryChange,
  onOpenTransfer,
  onNewTransfer,
  onRetry,
}: TransfersListViewProps) {
  const recipientOptions: Option[] = recipients.flatMap((location) => (location.id !== undefined && location.name ? [{ value: String(location.id), label: location.name }] : []));

  const set = (patch: Partial<TransferFilters>) => onFiltersChange({ ...filters, ...patch });
  const clearAll = () => onFiltersChange(noTransferFilters);

  const { from, to } = filters.range;
  const rangeLabel = from === null ? null : to === null || to === from ? `الفترة: ${dayLabel(from)}` : `الفترة: ${dayLabel(from)} ← ${dayLabel(to)}`;

  const active: ActiveFilter[] = [
    ...(filters.overdue ? [{ key: "overdue", label: `بالطريق أكثر من ${isolate(overdueHours)} ساعة`, onRemove: () => set({ overdue: false }) }] : []),
    ...(filters.status && !filters.overdue ? [{ key: "status", label: `الحالة: ${statusMap.transfer[filters.status].label}`, onRemove: () => set({ status: null }) }] : []),
    ...(filters.toLocationId ? [{ key: "recipient", label: `المستلم: ${recipientOptions.find((o) => o.value === filters.toLocationId)?.label ?? ""}`, onRemove: () => set({ toLocationId: null }) }] : []),
    ...(rangeLabel ? [{ key: "range", label: rangeLabel, onRemove: () => set({ range: { from: null, to: null } }) }] : []),
  ];

  const columns: DataTableColumn<Transfer>[] = [
    {
      key: "reference",
      header: "الرقم",
      cell: (row) => (
        <span dir="ltr" className="block truncate text-end tabular-nums">
          {row.reference}
        </span>
      ),
      width: "w-32",
      priority: "high",
    },
    {
      key: "recipient",
      header: "المستلم",
      cell: (row) => (
        <span className="flex min-w-0 flex-col">
          <span className="truncate text-body text-fg">{row.to_location?.name}</span>
          <span className="truncate text-caption text-fg-muted">{row.to_location?.type ? locationTypeLabels[row.to_location.type] : ""}</span>
        </span>
      ),
      priority: "high",
      role: "primary",
    },
    { key: "created_at", header: "التاريخ", cell: (row) => <DateTimeStackCell value={row.created_at} />, width: "w-28" },
    { key: "quantity", header: "الكمية", cell: (row) => <QuantityCell value={row.total_quantity} />, align: "end", width: "w-24", priority: "high" },
    { key: "status", header: "الحالة", cell: (row) => (row.status ? <StatusCell entity="transfer" status={row.status} /> : <TextCell value={null} />), width: "w-32", priority: "high", role: "status" },
    {
      key: "hours",
      header: "ساعات بالطريق",
      cell: (row) =>
        row.hours_in_transit === null || row.hours_in_transit === undefined ? (
          <TextCell value={null} />
        ) : (
          <CaptureRow className="flex-wrap items-center gap-x-2 gap-y-1">
            <span className="tabular-nums">{`${isolate(row.hours_in_transit)} ساعة`}</span>
            {row.hours_in_transit >= overdueHours ? <Badge color="warning">{`أكثر من ${isolate(overdueHours)} ساعة`}</Badge> : null}
          </CaptureRow>
        ),
      width: "w-48",
      priority: "high",
    },
  ];

  const newTransferAction: PageAction[] = onNewTransfer ? [{ id: "new-transfer", label: "صرف جديد", primary: true, onSelect: onNewTransfer }] : [];

  const empty =
    active.length > 0 || filters.q.trim() !== "" ? (
      <EmptyState
        icon={MagnifyingGlass}
        title="لا نتائج للفلتر"
        description="لا توجد صرفيات تطابق ما اخترته. غيّر الفلاتر أو امسحها."
        action={
          <Button variant="secondary" onClick={clearAll}>
            مسح الفلاتر
          </Button>
        }
      />
    ) : (
      <EmptyState
        icon={Truck}
        title="لا صرفيات بعد"
        description="تظهر هنا كل صرفية تعتمدها من المستودع إلى وكيل أو مندوب."
        action={
          onNewTransfer ? (
            <Button variant="primary" onClick={onNewTransfer}>
              صرف جديد
            </Button>
          ) : undefined
        }
      />
    );

  return (
    <>
      <PageHeader title="الصرف" description="كل صرفية من المستودع إلى وكيل أو مندوب، من الأحدث إلى الأقدم." actions={newTransferAction} />

      <div className="flex flex-col gap-4">
        <FilterBar
          search={{ value: filters.q, onChange: (q) => set({ q }), placeholder: "ابحث برقم الصرف أو المستلم" }}
          quickFilters={[
            <Combobox
              key="status"
              aria-label="الحالة"
              placeholder="كل الحالات"
              options={statusOptions}
              value={filters.status}
              onValueChange={(status) => set({ status: status as TransferStatus | null, overdue: status === "IN_TRANSIT" ? filters.overdue : false })}
              clearable
            />,
            <Combobox
              key="recipient"
              aria-label="المستلم"
              placeholder="كل المستلمين"
              options={recipientOptions}
              value={filters.toLocationId}
              onValueChange={(toLocationId) => set({ toLocationId })}
              onQueryChange={onRecipientQueryChange}
              clearable
            />,
            <DateRangePicker key="range" aria-label="الفترة" placeholder="كل الأوقات" value={filters.range} onValueChange={(range) => set({ range })} max={today} today={today} />,
          ]}
          moreFilters={
            <Checkbox
              label={`بالطريق أكثر من ${isolate(overdueHours)} ساعة`}
              description="الصرف غير المؤكَّد استلامه."
              checked={filters.overdue}
              onCheckedChange={(overdue) => set({ overdue, status: overdue ? "IN_TRANSIT" : filters.status })}
            />
          }
          active={active}
          onClearAll={clearAll}
        />

        <DataTable
          label="الصرفيات"
          columns={columns}
          rows={transfers.status === "ready" ? transfers.data.data : []}
          getRowKey={(row) => row.id ?? row.reference ?? ""}
          loading={transfers.status === "loading"}
          error={transfers.status === "error" ? { code: transfers.code, onRetry } : undefined}
          empty={empty}
          onRowOpen={onOpenTransfer}
        />

        {transfers.status === "ready" ? <Pagination meta={transfers.data.meta} onPageChange={onPageChange} onPerPageChange={onPerPageChange} /> : null}
      </div>
    </>
  );
}
