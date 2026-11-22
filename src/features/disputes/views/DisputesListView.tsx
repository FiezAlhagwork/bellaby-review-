"use client";

import { MagnifyingGlass, Scales } from "@phosphor-icons/react";
import { ConfidentialBanner } from "@/components/data/ConfidentialBanner";
import { DateCell, StatusCell, TextCell } from "@/components/data/cells";
import { DataTable, type DataTableColumn } from "@/components/data/DataTable";
import { FilterBar, type ActiveFilter } from "@/components/data/FilterBar";
import { Pagination, type PaginationMeta } from "@/components/data/Pagination";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/Button";
import { Combobox } from "@/components/ui/Combobox";
import { EmptyState } from "@/components/ui/EmptyState";
import type { Option } from "@/components/ui/OptionList";
import type { Dispute } from "@/lib/api/types";
import { isolate } from "@/lib/format";
import type { Loadable } from "@/lib/loadable";

/** مرشّح الحالة: «قيد المعالجة» (المراحل 1 إلى 7) مشتق في الواجهة، والباقي قيم `Dispute.status`. العقد يقبل `status` نصاً حراً (§90). */
export type DisputeFilter = "IN_PROGRESS" | "AWAITING_DECISION" | "CLOSED" | "CLOSED_RESOLVED";
export type DisputeFilters = { status: DisputeFilter | null };
export const noDisputeFilters: DisputeFilters = { status: null };

/** صفحة من `GET /disputes` (`Paginated`). */
export type DisputesPage = { data: readonly Dispute[]; meta: PaginationMeta };

type DisputesListViewProps = {
  disputes: Loadable<DisputesPage>;
  filters: DisputeFilters;
  onFiltersChange: (filters: DisputeFilters) => void;
  onPageChange: (page: number) => void;
  onPerPageChange: (perPage: number) => void;
  /** `disputes.manage`: «فتح نزاع» (I19). */
  canCreate: boolean;
  onNewDispute?: () => void;
  /** يفتح الملف (I20). */
  onOpenDispute?: (dispute: Dispute) => void;
  onRetry?: () => void;
};

const filterLabels: Record<DisputeFilter, string> = {
  IN_PROGRESS: "قيد المعالجة",
  AWAITING_DECISION: "بانتظار القرار",
  CLOSED: "مغلق",
  CLOSED_RESOLVED: "زال السبب",
};
const filterOptions: Option[] = (Object.keys(filterLabels) as DisputeFilter[]).map((value) => ({ value, label: filterLabels[value] }));

const columns: DataTableColumn<Dispute>[] = [
  { key: "title", header: "العنوان", cell: (row) => <TextCell value={row.title} />, priority: "high", role: "primary" },
  { key: "customer", header: "العميل", cell: (row) => <TextCell value={row.customer?.name} />, width: "w-44", priority: "high" },
  {
    key: "delivery",
    header: "التسليم",
    cell: (row) => <TextCell value={row.delivery_id ? isolate(`#${row.delivery_id}`) : null} />,
    width: "w-28",
  },
  { key: "status", header: "المرحلة", cell: (row) => (row.status ? <StatusCell entity="dispute" status={row.status} /> : <TextCell value={null} />), width: "w-36", priority: "high", role: "status" },
  { key: "created", header: "التاريخ", cell: (row) => <DateCell value={row.created_at} />, width: "w-36" },
];

/**
 * النزاعات (I18): قائمة سرية بعنوان كل نزاع وعميله وتسليمه ومرحلته وتاريخ فتحه، بفلتر الحالة. كل اطلاع يُسجَّل، ولا يشملها التفويض.
 * القانوني يفتح نزاعاً (`disputes.manage`)، والمحال من مدير المبيعات يصل منشأً. الصف يفتح الملف.
 */
export function DisputesListView({ disputes, filters, onFiltersChange, onPageChange, onPerPageChange, canCreate, onNewDispute, onOpenDispute, onRetry }: DisputesListViewProps) {
  const active: ActiveFilter[] = filters.status ? [{ key: "status", label: `الحالة: ${filterLabels[filters.status]}`, onRemove: () => onFiltersChange(noDisputeFilters) }] : [];

  const empty =
    active.length > 0 ? (
      <EmptyState
        icon={MagnifyingGlass}
        title="لا نتائج للفلتر"
        description="لا نزاعات بهذه الحالة."
        action={
          <Button variant="secondary" onClick={() => onFiltersChange(noDisputeFilters)}>
            مسح الفلتر
          </Button>
        }
      />
    ) : (
      <EmptyState icon={Scales} title="لا نزاعات" description="تظهر هنا النزاعات التي تفتحها أو يحيلها مدير المبيعات." />
    );

  return (
    <>
      <PageHeader
        title="النزاعات"
        description="ملفات سرية بسبع مراحل، والقرار للمدير التنفيذي بين السادسة والسابعة."
        actions={canCreate && onNewDispute ? [{ id: "new", label: "فتح نزاع", primary: true, onSelect: onNewDispute }] : undefined}
      />

      <div className="flex flex-col gap-4">
        <ConfidentialBanner />

        <FilterBar
          quickFilters={[<Combobox key="status" aria-label="الحالة" placeholder="كل الحالات" options={filterOptions} value={filters.status} onValueChange={(status) => onFiltersChange({ status: status as DisputeFilter | null })} clearable />]}
          active={active}
          onClearAll={() => onFiltersChange(noDisputeFilters)}
        />

        <DataTable
          label="النزاعات"
          columns={columns}
          rows={disputes.status === "ready" ? disputes.data.data : []}
          getRowKey={(row) => row.id ?? ""}
          loading={disputes.status === "loading"}
          error={disputes.status === "error" ? { code: disputes.code, onRetry } : undefined}
          empty={empty}
          onRowOpen={onOpenDispute}
        />

        {disputes.status === "ready" ? <Pagination meta={disputes.data.meta} onPageChange={onPageChange} onPerPageChange={onPerPageChange} /> : null}
      </div>
    </>
  );
}
