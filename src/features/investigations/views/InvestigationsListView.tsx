"use client";

import { Detective, MagnifyingGlass } from "@phosphor-icons/react";
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
import type { Investigation } from "@/lib/api/types";
import type { Loadable } from "@/lib/loadable";

/**
 * مرشّح الحالة: «قيد التحقيق» (المراحل 1 إلى 7) مشتق في الواجهة، والباقي قيم `Investigation.status`.
 * العقد يقبل `status` نصاً حراً (docs/backend-requests.md §36.1).
 */
export type InvestigationFilter = "IN_PROGRESS" | "AWAITING_DECISION" | "DECIDED" | "CLOSED_NO_VIOLATION";

/** الفلتر الوحيد: تغيّره يعيد الأب إلى الصفحة الأولى. */
export type InvestigationFilters = { status: InvestigationFilter | null };

export const noInvestigationFilters: InvestigationFilters = { status: null };

/** صفحة من `GET /investigations` (`Paginated`). */
export type InvestigationsPage = { data: readonly Investigation[]; meta: PaginationMeta };

type InvestigationsListViewProps = {
  investigations: Loadable<InvestigationsPage>;
  filters: InvestigationFilters;
  onFiltersChange: (filters: InvestigationFilters) => void;
  onPageChange: (page: number) => void;
  onPerPageChange: (perPage: number) => void;
  /** `investigations.manage`: «فتح ملف» (S14). المدير التنفيذي يقرأ ويقرّر بلا فتح. */
  canOpen: boolean;
  onOpenNew?: () => void;
  /** يفتح الملف (S15). */
  onOpen?: (investigation: Investigation) => void;
  onRetry?: () => void;
};

const filterLabels: Record<InvestigationFilter, string> = {
  IN_PROGRESS: "قيد التحقيق",
  AWAITING_DECISION: "بانتظار القرار",
  DECIDED: "تم القرار",
  CLOSED_NO_VIOLATION: "أُغلق بلا مخالفة",
};

const filterOptions: Option[] = (Object.keys(filterLabels) as InvestigationFilter[]).map((value) => ({ value, label: filterLabels[value] }));

/**
 * ملفات التحقيق (S13): قائمة سرية بعنوان كل ملف وموظفه ومرحلته وتاريخ فتحه، بفلتر الحالة. كل اطلاع يُسجَّل (الشريط يذكر ذلك).
 * المراقبة تفتح ملفاً (`investigations.manage`)، والمدير التنفيذي يقرأ ويقرّر عند الرفع للقرار.
 */
export function InvestigationsListView({ investigations, filters, onFiltersChange, onPageChange, onPerPageChange, canOpen, onOpenNew, onOpen, onRetry }: InvestigationsListViewProps) {
  const set = (patch: Partial<InvestigationFilters>) => onFiltersChange({ ...filters, ...patch });
  const clearAll = () => onFiltersChange(noInvestigationFilters);

  const active: ActiveFilter[] = filters.status ? [{ key: "status", label: `الحالة: ${filterLabels[filters.status]}`, onRemove: () => set({ status: null }) }] : [];

  const columns: DataTableColumn<Investigation>[] = [
    { key: "title", header: "العنوان", cell: (row) => <TextCell value={row.title} />, priority: "high", role: "primary" },
    { key: "subject", header: "الموظف", cell: (row) => <TextCell value={row.subject_user?.name} />, width: "w-44", priority: "high" },
    { key: "status", header: "المرحلة", cell: (row) => (row.status ? <StatusCell entity="investigation" status={row.status} /> : <TextCell value={null} />), width: "w-44", priority: "high", role: "status" },
    { key: "created", header: "تاريخ الفتح", cell: (row) => <DateCell value={row.created_at} />, width: "w-48" },
  ];

  const empty =
    active.length > 0 ? (
      <EmptyState
        icon={MagnifyingGlass}
        title="لا نتائج للفلتر"
        description="لا توجد ملفات تطابق ما اخترته. غيّر الفلتر أو امسحه."
        action={
          <Button variant="secondary" onClick={clearAll}>
            مسح الفلاتر
          </Button>
        }
      />
    ) : (
      <EmptyState icon={Detective} title="لا ملفات تحقيق" description={canOpen ? "تظهر هنا الملفات التي تفتحها المراقبة، مباشرةً أو من علامة." : "تظهر هنا الملفات التي تفتحها المراقبة."} />
    );

  const ready = investigations.status === "ready" ? investigations.data : null;

  return (
    <>
      <PageHeader
        title="ملفات التحقيق"
        description="ملفات سرية بثماني مراحل. لا قفز بين المراحل، وكل اطلاع يُسجَّل."
        actions={canOpen ? [{ id: "new", label: "فتح ملف", primary: true, onSelect: () => onOpenNew?.() }] : []}
      />

      <div className="flex flex-col gap-4">
        <ConfidentialBanner />

        <FilterBar
          quickFilters={[<Combobox key="status" aria-label="الحالة" placeholder="كل الحالات" options={filterOptions} value={filters.status} onValueChange={(status) => set({ status: status as InvestigationFilter | null })} clearable />]}
          active={active}
          onClearAll={clearAll}
        />

        <DataTable
          label="ملفات التحقيق"
          columns={columns}
          rows={ready ? ready.data : []}
          getRowKey={(row) => row.id ?? ""}
          loading={investigations.status === "loading"}
          error={investigations.status === "error" ? { code: investigations.code, onRetry } : undefined}
          empty={empty}
          onRowOpen={onOpen}
        />

        {ready ? <Pagination meta={ready.meta} onPageChange={onPageChange} onPerPageChange={onPerPageChange} /> : null}
      </div>
    </>
  );
}
