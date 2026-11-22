"use client";

import { MagnifyingGlass, Scroll } from "@phosphor-icons/react";
import { DateCell, StatusCell, TextCell } from "@/components/data/cells";
import { DataTable, type DataTableColumn } from "@/components/data/DataTable";
import { FilterBar, type ActiveFilter } from "@/components/data/FilterBar";
import { legalCategoryLabels, legalCategoryOrder } from "@/components/data/legal-categories";
import { Pagination, type PaginationMeta } from "@/components/data/Pagination";
import { statusMap } from "@/components/data/status-map";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/Button";
import { Checkbox } from "@/components/ui/Checkbox";
import { Combobox } from "@/components/ui/Combobox";
import { EmptyState } from "@/components/ui/EmptyState";
import type { Option } from "@/components/ui/OptionList";
import type { LegalDocument, LegalDocumentCategory, LegalDocumentStatus } from "@/lib/api/types";
import { isolate } from "@/lib/format";
import type { Loadable } from "@/lib/loadable";

/** الفلاتر كما يرسلها العقد: `category` و`status` و`expiring_within_days`. تغيّرها يعيد الأب إلى الصفحة الأولى. */
export type LegalDocumentFilters = { category: LegalDocumentCategory | null; status: LegalDocumentStatus | null; expiringOnly: boolean };
export const noLegalDocumentFilters: LegalDocumentFilters = { category: null, status: null, expiringOnly: false };

export type LegalDocumentsPage = { data: readonly LegalDocument[]; meta: PaginationMeta };

type LegalDocumentsViewProps = {
  documents: Loadable<LegalDocumentsPage>;
  filters: LegalDocumentFilters;
  onFiltersChange: (filters: LegalDocumentFilters) => void;
  /** أيام «قريبة الانتهاء» التي يرسلها الفلتر في `expiring_within_days`. */
  expiringWithinDays: number;
  onPageChange: (page: number) => void;
  onPerPageChange: (perPage: number) => void;
  /** `legal.manage`: «وثيقة جديدة». */
  canCreate: boolean;
  onNewDocument?: () => void;
  /** يفتح صفحة الوثيقة (I17). */
  onOpenDocument?: (document: LegalDocument) => void;
  onRetry?: () => void;
};

const categoryOptions: Option[] = legalCategoryOrder.map((value) => ({ value, label: legalCategoryLabels[value] }));
const statusOptions: Option[] = (Object.keys(statusMap.legalDocument) as LegalDocumentStatus[]).map((value) => ({ value, label: statusMap.legalDocument[value].label }));

const columns: DataTableColumn<LegalDocument>[] = [
  {
    key: "title",
    header: "الوثيقة",
    cell: (row) => (
      <span className="flex min-w-0 flex-col">
        <span className="truncate text-body text-fg">{row.title}</span>
        <span className="text-caption text-fg-muted">{`النسخة ${isolate(row.version ?? 1)}`}</span>
      </span>
    ),
    priority: "high",
    role: "primary",
  },
  { key: "category", header: "الفئة", cell: (row) => <TextCell value={row.category ? legalCategoryLabels[row.category] : null} />, width: "w-36", priority: "high" },
  { key: "parties", header: "الأطراف", cell: (row) => <TextCell value={(row.parties ?? []).join("، ") || null} /> },
  { key: "expires", header: "الانتهاء", cell: (row) => (row.expires_on ? <DateCell value={row.expires_on} /> : <TextCell value="بلا انتهاء" />), width: "w-36", priority: "high" },
  { key: "status", header: "الحالة", cell: (row) => (row.status ? <StatusCell entity="legalDocument" status={row.status} /> : <TextCell value={null} />), width: "w-32", priority: "high", role: "status" },
];

/**
 * الوثائق القانونية (I15): كل وثيقة بفئتها وأطرافها وانتهائها وحالتها (سارية، قريبة الانتهاء، منتهية، منتهية بقصد). فلاتر الفئة والحالة و«قريبة الانتهاء»، وترقيم.
 * «وثيقة جديدة» لمن يملك `legal.manage`. الصف يفتح صفحة الوثيقة. لا حذف.
 */
export function LegalDocumentsView({ documents, filters, onFiltersChange, expiringWithinDays, onPageChange, onPerPageChange, canCreate, onNewDocument, onOpenDocument, onRetry }: LegalDocumentsViewProps) {
  const set = (patch: Partial<LegalDocumentFilters>) => onFiltersChange({ ...filters, ...patch });
  const expiringLabel = `تنتهي خلال ${isolate(expiringWithinDays)} يوماً`;

  const active: ActiveFilter[] = [
    ...(filters.category ? [{ key: "category", label: `الفئة: ${legalCategoryLabels[filters.category]}`, onRemove: () => set({ category: null }) }] : []),
    ...(filters.status ? [{ key: "status", label: `الحالة: ${statusMap.legalDocument[filters.status].label}`, onRemove: () => set({ status: null }) }] : []),
    ...(filters.expiringOnly ? [{ key: "expiring", label: expiringLabel, onRemove: () => set({ expiringOnly: false }) }] : []),
  ];

  const empty =
    active.length > 0 ? (
      <EmptyState
        icon={MagnifyingGlass}
        title="لا نتائج للفلتر"
        description="لا وثائق تطابق ما اخترته."
        action={
          <Button variant="secondary" onClick={() => onFiltersChange(noLegalDocumentFilters)}>
            مسح الفلاتر
          </Button>
        }
      />
    ) : (
      <EmptyState icon={Scroll} title="لا وثائق بعد" description="أضف العقود والتراخيص والأوراق الرسمية لتُتابَع مواعيد انتهائها." />
    );

  return (
    <>
      <PageHeader
        title="الوثائق القانونية"
        description="العقود والتراخيص والأوراق الرسمية. كل تعديل نسخة جديدة، ولا حذف."
        actions={canCreate && onNewDocument ? [{ id: "new", label: "وثيقة جديدة", primary: true, onSelect: onNewDocument }] : undefined}
      />

      <div className="flex flex-col gap-4">
        <FilterBar
          quickFilters={[
            <Combobox key="category" aria-label="الفئة" placeholder="كل الفئات" options={categoryOptions} value={filters.category} onValueChange={(category) => set({ category: category as LegalDocumentCategory | null })} clearable />,
            <Combobox key="status" aria-label="الحالة" placeholder="كل الحالات" options={statusOptions} value={filters.status} onValueChange={(status) => set({ status: status as LegalDocumentStatus | null })} clearable />,
          ]}
          moreFilters={<Checkbox label="قريبة الانتهاء" description={`${expiringLabel}.`} checked={filters.expiringOnly} onCheckedChange={(expiringOnly) => set({ expiringOnly })} />}
          active={active}
          onClearAll={() => onFiltersChange(noLegalDocumentFilters)}
        />

        <DataTable
          label="الوثائق القانونية"
          columns={columns}
          rows={documents.status === "ready" ? documents.data.data : []}
          getRowKey={(row) => row.id ?? ""}
          loading={documents.status === "loading"}
          error={documents.status === "error" ? { code: documents.code, onRetry } : undefined}
          empty={empty}
          onRowOpen={onOpenDocument}
        />

        {documents.status === "ready" ? <Pagination meta={documents.data.meta} onPageChange={onPageChange} onPerPageChange={onPerPageChange} /> : null}
      </div>
    </>
  );
}
