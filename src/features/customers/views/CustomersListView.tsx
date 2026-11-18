"use client";

import { MagnifyingGlass, UsersThree } from "@phosphor-icons/react";
import { TextCell } from "@/components/data/cells";
import { DataTable, type DataTableColumn } from "@/components/data/DataTable";
import { FilterBar, type ActiveFilter } from "@/components/data/FilterBar";
import { Pagination, type PaginationMeta } from "@/components/data/Pagination";
import { PageHeader } from "@/components/layout/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Combobox } from "@/components/ui/Combobox";
import { EmptyState } from "@/components/ui/EmptyState";
import type { Option } from "@/components/ui/OptionList";
import type { AgentRef, Customer, Governorate } from "@/lib/api/types";
import type { Loadable } from "@/lib/loadable";

/** الفلاتر كما يقبلها العقد: `q` و`agent_id` و`governorate_id`. تغيّرها يعيد الأب إلى الصفحة الأولى. */
export type CustomerFilters = { q: string; agentId: string | null; governorateId: string | null };

export const noCustomerFilters: CustomerFilters = { q: "", agentId: null, governorateId: null };

/** صفحة من `GET /customers` (`Paginated`). */
export type CustomersPage = { data: readonly Customer[]; meta: PaginationMeta };

type CustomersListViewProps = {
  customers: Loadable<CustomersPage>;
  /** وكلاء الفلتر: `GET /agents`. */
  agents: readonly AgentRef[];
  governorates: readonly Governorate[];
  filters: CustomerFilters;
  onFiltersChange: (filters: CustomerFilters) => void;
  onPageChange: (page: number) => void;
  onPerPageChange: (perPage: number) => void;
  /** يفتح صفحة العميل (M05). بدونه الصفوف للقراءة فقط. */
  onOpenCustomer?: (customer: Customer) => void;
  onRetry?: () => void;
};

/**
 * العملاء (M04): صيدليات كل الوكلاء، لكل عميل وكيله ومحافظته، وهل هو مربوط بجهة زيارة (`visit_point_id`). للقراءة: الوكيل هو من يضيف عملاءه.
 * بحث بالاسم وفلاتر الوكيل والمحافظة وترقيم.
 */
export function CustomersListView({ customers, agents, governorates, filters, onFiltersChange, onPageChange, onPerPageChange, onOpenCustomer, onRetry }: CustomersListViewProps) {
  const agentOptions: Option[] = agents.flatMap((agent) => (agent.id !== undefined && agent.name ? [{ value: String(agent.id), label: agent.name }] : []));
  const governorateOptions: Option[] = governorates.flatMap((governorate) => (governorate.id !== undefined && governorate.name ? [{ value: String(governorate.id), label: governorate.name }] : []));

  const set = (patch: Partial<CustomerFilters>) => onFiltersChange({ ...filters, ...patch });
  const clearAll = () => onFiltersChange(noCustomerFilters);

  const active: ActiveFilter[] = [
    ...(filters.agentId ? [{ key: "agent", label: `الوكيل: ${agentOptions.find((option) => option.value === filters.agentId)?.label ?? ""}`, onRemove: () => set({ agentId: null }) }] : []),
    ...(filters.governorateId ? [{ key: "governorate", label: `المحافظة: ${governorateOptions.find((option) => option.value === filters.governorateId)?.label ?? ""}`, onRemove: () => set({ governorateId: null }) }] : []),
  ];

  const columns: DataTableColumn<Customer>[] = [
    {
      key: "customer",
      header: "العميل",
      cell: (row) => (
        <span className="flex min-w-0 flex-col">
          <span className="truncate text-body text-fg">{row.name}</span>
          <span className="truncate text-caption text-fg-muted">{row.address}</span>
        </span>
      ),
      priority: "high",
      role: "primary",
    },
    { key: "agent", header: "الوكيل", cell: (row) => <TextCell value={row.agent?.name} />, width: "w-56", priority: "high" },
    { key: "governorate", header: "المحافظة", cell: (row) => <TextCell value={row.governorate?.name} />, width: "w-36", priority: "high" },
    {
      key: "linked",
      header: "مربوط بجهة زيارة؟",
      cell: (row) => (row.visit_point_id ? <Badge color="success">مربوط</Badge> : <Badge>غير مربوط</Badge>),
      width: "w-44",
      priority: "high",
      role: "status",
    },
  ];

  const empty =
    active.length > 0 || filters.q.trim() !== "" ? (
      <EmptyState
        icon={MagnifyingGlass}
        title="لا نتائج للفلتر"
        description="لا يوجد عملاء يطابقون ما اخترته. غيّر الفلاتر أو امسحها."
        action={
          <Button variant="secondary" onClick={clearAll}>
            مسح الفلاتر
          </Button>
        }
      />
    ) : (
      <EmptyState icon={UsersThree} title="لا عملاء بعد" description="يظهر هنا كل عميل يضيفه الوكلاء." />
    );

  return (
    <>
      <PageHeader title="العملاء" description="صيدليات كل الوكلاء، وهل ربطها النظام بجهة زيارة." />

      <div className="flex flex-col gap-4">
        <FilterBar
          search={{ value: filters.q, onChange: (q) => set({ q }), placeholder: "ابحث باسم العميل" }}
          quickFilters={[
            <Combobox key="agent" aria-label="الوكيل" placeholder="كل الوكلاء" options={agentOptions} value={filters.agentId} onValueChange={(agentId) => set({ agentId })} clearable />,
            <Combobox key="governorate" aria-label="المحافظة" placeholder="كل المحافظات" options={governorateOptions} value={filters.governorateId} onValueChange={(governorateId) => set({ governorateId })} clearable />,
          ]}
          active={active}
          onClearAll={clearAll}
        />

        <DataTable
          label="العملاء"
          columns={columns}
          rows={customers.status === "ready" ? customers.data.data : []}
          getRowKey={(row) => row.id ?? row.name ?? ""}
          loading={customers.status === "loading"}
          error={customers.status === "error" ? { code: customers.code, onRetry } : undefined}
          empty={empty}
          onRowOpen={onOpenCustomer}
        />

        {customers.status === "ready" ? <Pagination meta={customers.data.meta} onPageChange={onPageChange} onPerPageChange={onPerPageChange} /> : null}
      </div>
    </>
  );
}
