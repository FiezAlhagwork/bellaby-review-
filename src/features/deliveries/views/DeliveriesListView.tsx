"use client";

import { Handshake, MagnifyingGlass } from "@phosphor-icons/react";
import { DateCell, DateTimeStackCell, MoneyCell, StatusCell, TextCell } from "@/components/data/cells";
import { DataTable, type DataTableColumn } from "@/components/data/DataTable";
import { FilterBar, type ActiveFilter } from "@/components/data/FilterBar";
import { Pagination, type PaginationMeta } from "@/components/data/Pagination";
import { statusMap } from "@/components/data/status-map";
import { PageHeader } from "@/components/layout/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Checkbox } from "@/components/ui/Checkbox";
import { Combobox } from "@/components/ui/Combobox";
import { DateRangePicker, type DateRange } from "@/components/ui/DateRangePicker";
import { EmptyState } from "@/components/ui/EmptyState";
import type { Option } from "@/components/ui/OptionList";
import type { AgentRef, Delivery, DeliveryStatus } from "@/lib/api/types";
import { dayLabel, daysBetween, type IsoDate } from "@/lib/calendar";
import { countPhrase } from "@/lib/format";
import type { Loadable } from "@/lib/loadable";

/** الفلاتر كما يرسلها العقد: `status` و`agent_id` و`payment_overdue` و`from` و`to` (و`customer_id` من صفحة العميل). تغيّرها يعيد الأب إلى الصفحة الأولى. */
export type DeliveryFilters = { status: DeliveryStatus | null; agentId: string | null; overdueOnly: boolean; range: DateRange };

export const noDeliveryFilters: DeliveryFilters = { status: null, agentId: null, overdueOnly: false, range: { from: null, to: null } };

/** صفحة من `GET /deliveries` (`Paginated`). */
export type DeliveriesPage = { data: readonly Delivery[]; meta: PaginationMeta };

type DeliveriesListViewProps = {
  deliveries: Loadable<DeliveriesPage>;
  /** وكلاء الفلتر. بدونها (للوكيل نفسه) لا فلتر وكيل ولا عمود له. */
  agents?: readonly AgentRef[];
  filters: DeliveryFilters;
  onFiltersChange: (filters: DeliveryFilters) => void;
  onPageChange: (page: number) => void;
  onPerPageChange: (perPage: number) => void;
  /** اليوم (بتوقيت دمشق): حدّ منتقي الفترة وأيام التأخر. يُمرَّر فيبقى الـ view نقياً. */
  today: IsoDate;
  /** يفتح تفاصيل التسليم. */
  onOpenDelivery?: (delivery: Delivery) => void;
  onRetry?: () => void;
};

const dayForms = ["يوم", "يومين", "أيام"] as const;

const statusOptions: Option[] = (Object.keys(statusMap.delivery) as DeliveryStatus[]).map((status) => ({ value: status, label: statusMap.delivery[status].label }));

/**
 * التسليمات (A09 · M06): كل تسليم في صف (الرقم والتاريخ والعميل والقيمة التقديرية وموعد السداد والحالة)، والمتأخر معلَّم بأيام تأخره.
 * للقراءة: الأفعال (التحصيل، طلب الإلغاء أو الشطب) في صفحة التفاصيل بحسب الدور. فلاتر الحالة والوكيل والمتأخر والفترة، وترقيم.
 */
export function DeliveriesListView({ deliveries, agents, filters, onFiltersChange, onPageChange, onPerPageChange, today, onOpenDelivery, onRetry }: DeliveriesListViewProps) {
  const agentOptions: Option[] = (agents ?? []).flatMap((agent) => (agent.id !== undefined && agent.name ? [{ value: String(agent.id), label: agent.name }] : []));
  const showAgent = agents !== undefined;

  const set = (patch: Partial<DeliveryFilters>) => onFiltersChange({ ...filters, ...patch });
  const clearAll = () => onFiltersChange(noDeliveryFilters);

  const { from, to } = filters.range;
  const rangeLabel = from === null ? null : to === null || to === from ? `الفترة: ${dayLabel(from)}` : `الفترة: ${dayLabel(from)} ← ${dayLabel(to)}`;

  const active: ActiveFilter[] = [
    ...(filters.status ? [{ key: "status", label: `الحالة: ${statusMap.delivery[filters.status].label}`, onRemove: () => set({ status: null }) }] : []),
    ...(filters.agentId ? [{ key: "agent", label: `الوكيل: ${agentOptions.find((option) => option.value === filters.agentId)?.label ?? ""}`, onRemove: () => set({ agentId: null }) }] : []),
    ...(filters.overdueOnly ? [{ key: "overdue", label: "المتأخر فقط", onRemove: () => set({ overdueOnly: false }) }] : []),
    ...(rangeLabel ? [{ key: "range", label: rangeLabel, onRemove: () => set({ range: { from: null, to: null } }) }] : []),
  ];

  const lateDays = (delivery: Delivery) => (delivery.expected_payment_date ? daysBetween(delivery.expected_payment_date, today) : 0);

  const columns: DataTableColumn<Delivery>[] = [
    {
      key: "reference",
      header: "الرقم",
      cell: (row) => (
        <span dir="ltr" className="block truncate text-end tabular-nums">
          {row.reference}
        </span>
      ),
      width: "w-32",
    },
    { key: "delivered", header: "التاريخ", cell: (row) => <DateTimeStackCell value={row.delivered_at} />, width: "w-28" },
    { key: "customer", header: "العميل", cell: (row) => <TextCell value={row.customer?.name} />, priority: "high", role: "primary" },
    ...(showAgent ? [{ key: "agent", header: "الوكيل", cell: (row: Delivery) => <TextCell value={row.agent?.name} />, width: "w-48", priority: "high" as const }] : []),
    { key: "value", header: "القيمة التقديرية", cell: (row) => <MoneyCell value={row.estimated_value} />, align: "end", width: "w-36", priority: "high" },
    {
      key: "due",
      header: "موعد السداد",
      cell: (row) => (
        <span className="flex min-w-0 flex-col">
          <DateCell value={row.expected_payment_date} />
          {row.is_payment_overdue ? <span className="text-caption text-danger">{`متأخر ${countPhrase(lateDays(row), dayForms)}`}</span> : null}
        </span>
      ),
      width: "w-44",
    },
    {
      key: "status",
      header: "الحالة",
      cell: (row) => (
        <span className="flex flex-wrap items-center gap-1">
          {row.status ? <StatusCell entity="delivery" status={row.status} /> : <TextCell value={null} />}
          {row.dispute_id ? <Badge color="info">محال</Badge> : null}
        </span>
      ),
      width: "w-44",
      priority: "high",
      role: "status",
    },
  ];

  const empty =
    active.length > 0 ? (
      <EmptyState
        icon={MagnifyingGlass}
        title="لا نتائج للفلتر"
        description="لا توجد تسليمات تطابق ما اخترته. غيّر الفلاتر أو امسحها."
        action={
          <Button variant="secondary" onClick={clearAll}>
            مسح الفلاتر
          </Button>
        }
      />
    ) : (
      <EmptyState icon={Handshake} title="لا تسليمات بعد" description="تظهر هنا كل تسليم سُجّل للصيدليات." />
    );

  return (
    <>
      <PageHeader title="التسليمات" description="التسليمات المسجَّلة للصيدليات، من الأحدث إلى الأقدم." />

      <div className="flex flex-col gap-4">
        <FilterBar
          quickFilters={[
            <Combobox key="status" aria-label="الحالة" placeholder="كل الحالات" options={statusOptions} value={filters.status} onValueChange={(status) => set({ status: status as DeliveryStatus | null })} clearable />,
            ...(showAgent ? [<Combobox key="agent" aria-label="الوكيل" placeholder="كل الوكلاء" options={agentOptions} value={filters.agentId} onValueChange={(agentId) => set({ agentId })} clearable />] : []),
            <DateRangePicker key="range" aria-label="الفترة" placeholder="كل الأوقات" value={filters.range} onValueChange={(range) => set({ range })} max={today} today={today} />,
          ]}
          moreFilters={<Checkbox label="المتأخر فقط" description="التسليمات التي فات موعد سدادها." checked={filters.overdueOnly} onCheckedChange={(overdueOnly) => set({ overdueOnly })} />}
          active={active}
          onClearAll={clearAll}
        />

        <DataTable
          label="التسليمات"
          columns={columns}
          rows={deliveries.status === "ready" ? deliveries.data.data : []}
          getRowKey={(row) => row.id ?? row.reference ?? ""}
          loading={deliveries.status === "loading"}
          error={deliveries.status === "error" ? { code: deliveries.code, onRetry } : undefined}
          empty={empty}
          onRowOpen={onOpenDelivery}
        />

        {deliveries.status === "ready" ? <Pagination meta={deliveries.data.meta} onPageChange={onPageChange} onPerPageChange={onPerPageChange} /> : null}
      </div>
    </>
  );
}
