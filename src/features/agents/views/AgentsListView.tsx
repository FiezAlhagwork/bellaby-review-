"use client";

import { MagnifyingGlass, Storefront } from "@phosphor-icons/react";
import { MoneyCell, QuantityCell, TextCell } from "@/components/data/cells";
import { DataTable, type DataTableColumn } from "@/components/data/DataTable";
import { FilterBar, type ActiveFilter } from "@/components/data/FilterBar";
import { Pagination, type PaginationMeta } from "@/components/data/Pagination";
import { PageHeader } from "@/components/layout/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Combobox } from "@/components/ui/Combobox";
import { EmptyState } from "@/components/ui/EmptyState";
import type { Option } from "@/components/ui/OptionList";
import type { Agent, Governorate, Money } from "@/lib/api/types";
import type { Loadable } from "@/lib/loadable";

/**
 * صف في قائمة الوكلاء: `Agent` من `GET /agents` ومعه الرصيد والمبيعات اللذان تطلبهما الشاشة ولا يحملهما العقد:
 * `stock_total` (إجمالي الكمية في موقع الوكيل) و`sales_value` (مبيعات الشهر). مضافان في الواجهة بصفة مؤقتة، وطلبهما في docs/backend-requests.md §40.
 */
export type AgentListRow = Agent & { stock_total: number | null; sales_value: Money | null };

/** الفلاتر كما يقبلها العقد: `q` و`governorate_id`. تغيّرها يعيد الأب إلى الصفحة الأولى. */
export type AgentFilters = { q: string; governorateId: string | null };

export const noAgentFilters: AgentFilters = { q: "", governorateId: null };

/** صفحة من `GET /agents` (`Paginated`). */
export type AgentsPage = { data: readonly AgentListRow[]; meta: PaginationMeta };

type AgentsListViewProps = {
  agents: Loadable<AgentsPage>;
  /** محافظات الفلتر. */
  governorates: readonly Governorate[];
  filters: AgentFilters;
  onFiltersChange: (filters: AgentFilters) => void;
  onPageChange: (page: number) => void;
  onPerPageChange: (perPage: number) => void;
  /** يفتح صفحة الوكيل (M03). بدونه الصفوف للقراءة فقط. */
  onOpenAgent?: (agent: AgentListRow) => void;
  onRetry?: () => void;
};

/**
 * الوكلاء (M02): كل وكيل في صف (الاسم وجهة الاتصال، والمحافظات، والرصيد، والمبيعات، والمستحق). الوكيل المعطّل معلَّم بشارة.
 * بحث بالاسم وفلتر المحافظة وترقيم. الصف يفتح صفحة الوكيل.
 */
export function AgentsListView({ agents, governorates, filters, onFiltersChange, onPageChange, onPerPageChange, onOpenAgent, onRetry }: AgentsListViewProps) {
  const governorateOptions: Option[] = governorates.flatMap((governorate) => (governorate.id !== undefined && governorate.name ? [{ value: String(governorate.id), label: governorate.name }] : []));

  const set = (patch: Partial<AgentFilters>) => onFiltersChange({ ...filters, ...patch });
  const clearAll = () => onFiltersChange(noAgentFilters);

  const active: ActiveFilter[] = filters.governorateId
    ? [{ key: "governorate", label: `المحافظة: ${governorateOptions.find((option) => option.value === filters.governorateId)?.label ?? ""}`, onRemove: () => set({ governorateId: null }) }]
    : [];

  const columns: DataTableColumn<AgentListRow>[] = [
    {
      key: "agent",
      header: "الوكيل",
      cell: (row) => (
        <span className="flex min-w-0 flex-col">
          <span className="flex min-w-0 items-center gap-2">
            <span className="truncate text-body text-fg">{row.name}</span>
            {row.is_active === false ? <Badge>معطّل</Badge> : null}
          </span>
          <span className="truncate text-caption text-fg-muted">{row.contact_name}</span>
        </span>
      ),
      priority: "high",
      role: "primary",
    },
    { key: "governorates", header: "المحافظات", cell: (row) => <TextCell value={(row.governorates ?? []).map((governorate) => governorate.name).join("، ")} />, width: "w-48", priority: "high" },
    { key: "stock", header: "الرصيد", cell: (row) => <QuantityCell value={row.stock_total} unit="علبة" />, align: "end", width: "w-32" },
    { key: "sales", header: "المبيعات", cell: (row) => <MoneyCell value={row.sales_value} />, align: "end", width: "w-36" },
    { key: "unpaid", header: "المستحق", cell: (row) => <MoneyCell value={row.unpaid_value} />, align: "end", width: "w-36", priority: "high" },
  ];

  const empty =
    active.length > 0 || filters.q.trim() !== "" ? (
      <EmptyState
        icon={MagnifyingGlass}
        title="لا نتائج للفلتر"
        description="لا يوجد وكلاء يطابقون ما اخترته. غيّر الفلاتر أو امسحها."
        action={
          <Button variant="secondary" onClick={clearAll}>
            مسح الفلاتر
          </Button>
        }
      />
    ) : (
      <EmptyState icon={Storefront} title="لا وكلاء بعد" description="يظهر هنا كل وكيل أُضيف ملفه التجاري." />
    );

  return (
    <>
      <PageHeader title="الوكلاء" description="وكلاء التوزيع ومحافظاتهم وأرصدتهم ومبيعاتهم وما عليهم من مستحقات." />

      <div className="flex flex-col gap-4">
        <FilterBar
          search={{ value: filters.q, onChange: (q) => set({ q }), placeholder: "ابحث باسم الوكيل" }}
          quickFilters={[
            <Combobox key="governorate" aria-label="المحافظة" placeholder="كل المحافظات" options={governorateOptions} value={filters.governorateId} onValueChange={(governorateId) => set({ governorateId })} clearable />,
          ]}
          active={active}
          onClearAll={clearAll}
        />

        <DataTable
          label="الوكلاء"
          columns={columns}
          rows={agents.status === "ready" ? agents.data.data : []}
          getRowKey={(row) => row.id ?? row.name ?? ""}
          loading={agents.status === "loading"}
          error={agents.status === "error" ? { code: agents.code, onRetry } : undefined}
          empty={empty}
          onRowOpen={onOpenAgent}
        />

        {agents.status === "ready" ? <Pagination meta={agents.data.meta} onPageChange={onPageChange} onPerPageChange={onPerPageChange} /> : null}
      </div>
    </>
  );
}
