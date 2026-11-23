"use client";

import { MagnifyingGlass, Storefront } from "@phosphor-icons/react";
import { DateCell, MoneyCell } from "@/components/data/cells";
import { DataTable, type DataTableColumn } from "@/components/data/DataTable";
import { FilterBar, type ActiveFilter } from "@/components/data/FilterBar";
import { Pagination, type PaginationMeta } from "@/components/data/Pagination";
import { PageHeader } from "@/components/layout/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Combobox } from "@/components/ui/Combobox";
import { EmptyState } from "@/components/ui/EmptyState";
import type { Option } from "@/components/ui/OptionList";
import type { Customer, Governorate } from "@/lib/api/types";
import { formatPhone } from "@/lib/format";
import type { Loadable } from "@/lib/loadable";

/** فلاتر `GET /customers`: `q` و`governorate_id`. */
export type AgentCustomerFilters = { q: string; governorateId: string | null };
export const noAgentCustomerFilters: AgentCustomerFilters = { q: "", governorateId: null };

export type AgentCustomersPage = { data: readonly Customer[]; meta: PaginationMeta };

type AgentCustomersViewProps = {
  customers: Loadable<AgentCustomersPage>;
  /** محافظاتي: فلتر المحافظة يظهر حين تكون أكثر من واحدة. */
  governorates: readonly Governorate[];
  filters: AgentCustomerFilters;
  onFiltersChange: (filters: AgentCustomerFilters) => void;
  onPageChange: (page: number) => void;
  onPerPageChange: (perPage: number) => void;
  /** `customers.create`: «عميل جديد» (A06). */
  canCreate: boolean;
  onNewCustomer?: () => void;
  /** يفتح صفحة العميل (A07). */
  onOpen?: (customer: Customer) => void;
  onRetry?: () => void;
};

/**
 * عملائي (A05): صيدلياتي بالاسم والمحافظة والهاتف وأول تسليم والمستحق، و«مربوط» حين يطابق جهة زيارة. بحث بالاسم و«عميل جديد».
 */
export function AgentCustomersView({ customers, governorates, filters, onFiltersChange, onPageChange, onPerPageChange, canCreate, onNewCustomer, onOpen, onRetry }: AgentCustomersViewProps) {
  const set = (patch: Partial<AgentCustomerFilters>) => onFiltersChange({ ...filters, ...patch });
  const governorateOptions: Option[] = governorates.flatMap((governorate) => (governorate.id !== undefined && governorate.name ? [{ value: String(governorate.id), label: governorate.name }] : []));
  const governorateName = governorates.find((governorate) => String(governorate.id) === filters.governorateId)?.name;

  const active: ActiveFilter[] = governorateName ? [{ key: "governorate", label: `المحافظة: ${governorateName}`, onRemove: () => set({ governorateId: null }) }] : [];

  const columns: DataTableColumn<Customer>[] = [
    {
      key: "name",
      header: "الاسم",
      cell: (row) => (
        <span className="flex min-w-0 flex-wrap items-center gap-2">
          <span className="truncate text-body text-fg">{row.name}</span>
          {row.visit_point_id ? <Badge color="info">مربوط</Badge> : null}
        </span>
      ),
      priority: "high",
      role: "primary",
    },
    { key: "governorate", header: "المحافظة", cell: (row) => row.governorate?.name ?? "—", width: "w-32", priority: "high" },
    { key: "phone", header: "الهاتف", cell: (row) => <span dir="ltr" className="text-body text-fg tabular-nums">{row.phone ? formatPhone(row.phone) : "—"}</span>, width: "w-40" },
    { key: "first", header: "أول تسليم", cell: (row) => <DateCell value={row.first_delivery_at} />, width: "w-32" },
    { key: "unpaid", header: "المستحق", cell: (row) => <MoneyCell value={row.unpaid_value} />, align: "end", width: "w-32", priority: "high" },
  ];

  const searching = filters.q.trim() !== "" || active.length > 0;
  const empty = searching ? (
    <EmptyState
      icon={MagnifyingGlass}
      title="لا نتائج"
      description="لا عملاء يطابقون البحث."
      action={
        <Button variant="secondary" onClick={() => onFiltersChange(noAgentCustomerFilters)}>
          مسح البحث
        </Button>
      }
    />
  ) : (
    <EmptyState icon={Storefront} title="لا عملاء بعد" description="أضف صيدلية من «عميل جديد» قبل أول تسليم لها." />
  );

  return (
    <>
      <PageHeader title="عملائي" description="الصيدليات التي تسلّمها، ضمن محافظاتك." actions={canCreate ? [{ id: "new", label: "عميل جديد", primary: true, onSelect: () => onNewCustomer?.() }] : undefined} />

      <div className="flex flex-col gap-4">
        <FilterBar
          search={{ value: filters.q, onChange: (q) => set({ q }), placeholder: "ابحث باسم العميل" }}
          quickFilters={governorateOptions.length > 1 ? [<Combobox key="governorate" aria-label="المحافظة" placeholder="كل محافظاتي" options={governorateOptions} value={filters.governorateId} onValueChange={(governorateId) => set({ governorateId })} clearable />] : []}
          active={active}
          onClearAll={() => onFiltersChange(noAgentCustomerFilters)}
        />

        <DataTable
          label="عملائي"
          columns={columns}
          rows={customers.status === "ready" ? customers.data.data : []}
          getRowKey={(row) => row.id ?? ""}
          loading={customers.status === "loading"}
          error={customers.status === "error" ? { code: customers.code, onRetry } : undefined}
          empty={empty}
          onRowOpen={onOpen}
        />

        {customers.status === "ready" ? <Pagination meta={customers.data.meta} onPageChange={onPageChange} onPerPageChange={onPerPageChange} /> : null}
      </div>
    </>
  );
}
