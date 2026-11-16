"use client";

import { MagnifyingGlass, Warning } from "@phosphor-icons/react";
import { DateTimeStackCell, StatusCell, TextCell } from "@/components/data/cells";
import { DataTable, type DataTableColumn } from "@/components/data/DataTable";
import { FilterBar, type ActiveFilter } from "@/components/data/FilterBar";
import { Pagination, type PaginationMeta } from "@/components/data/Pagination";
import { responsibilityLabels } from "@/components/data/responsibility";
import { statusMap } from "@/components/data/status-map";
import { PageHeader, type PageAction } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/Button";
import { Combobox } from "@/components/ui/Combobox";
import { EmptyState } from "@/components/ui/EmptyState";
import type { Option } from "@/components/ui/OptionList";
import type { DamageReport, Location } from "@/lib/api/types";
import { isolate } from "@/lib/format";
import type { Loadable } from "@/lib/loadable";

type DamageStatus = NonNullable<DamageReport["status"]>;

/** `RESTOCKED` لا تنطبق على التالف (وصف العقد: PENDING ← DAMAGED أو REJECTED)، فلا تدخل خيارات الفلتر. */
const filterStatuses: readonly DamageStatus[] = ["PENDING", "DAMAGED", "REJECTED"];

/** الفلاتر كما يرسلها العقد: `status` و`location_id`. تغيّرها يعيد الأب إلى الصفحة الأولى. */
export type DamageReportFilters = { status: DamageStatus | null; locationId: string | null };

export const noDamageReportFilters: DamageReportFilters = { status: null, locationId: null };

/** صفحة من `GET /damage-reports` (`Paginated`): التقارير و`meta` بأسلوب Laravel. */
export type DamageReportsPage = { data: readonly DamageReport[]; meta: PaginationMeta };

type DamageReportsListViewProps = {
  reports: Loadable<DamageReportsPage>;
  /** مواقع المستودع `GET /locations?type=WAREHOUSE`: خيارات فلتر الموقع. */
  locations: readonly Location[];
  filters: DamageReportFilters;
  onFiltersChange: (filters: DamageReportFilters) => void;
  onPageChange: (page: number) => void;
  onPerPageChange: (perPage: number) => void;
  /** رفع تقرير: `damage.create`. بدونها لا زر «تقرير تالف». */
  canCreate: boolean;
  onCreate?: () => void;
  /** يفتح التقرير للقراءة (M08). بدونه الصفوف للقراءة فقط. */
  onOpenReport?: (report: DamageReport) => void;
  onRetry?: () => void;
};

const statusOptions: Option[] = filterStatuses.map((status) => ({ value: status, label: statusMap.damageReport[status].label }));

/** «و N أخرى» تحت اسم أول صنف. */
function moreItemsPhrase(count: number): string {
  if (count <= 0) return "";
  if (count === 1) return "وصنف آخر";
  if (count === 2) return "وصنفان آخران";
  return `و${isolate(count)} أصناف أخرى`;
}

/**
 * تقارير تالف المستودع (W21): التاريخ والأصناف والسبب والحالة والمسؤولية. التقرير المعلّق ينتظر قرار مدير المبيعات،
 * والمقبول تالفاً يحمل مسؤوليته (للعلم، لا ذمة مالية)، والمرفوض سببه عند القارئ في M08. فلاتر الحالة والموقع وترقيم.
 */
export function DamageReportsListView({ reports, locations, filters, onFiltersChange, onPageChange, onPerPageChange, canCreate, onCreate, onOpenReport, onRetry }: DamageReportsListViewProps) {
  const locationOptions: Option[] = locations.flatMap((location) => (location.id !== undefined && location.name ? [{ value: String(location.id), label: location.name }] : []));

  const set = (patch: Partial<DamageReportFilters>) => onFiltersChange({ ...filters, ...patch });
  const clearAll = () => onFiltersChange(noDamageReportFilters);

  const active: ActiveFilter[] = [
    ...(filters.status ? [{ key: "status", label: `الحالة: ${statusMap.damageReport[filters.status].label}`, onRemove: () => set({ status: null }) }] : []),
    ...(filters.locationId ? [{ key: "location", label: `الموقع: ${locationOptions.find((o) => o.value === filters.locationId)?.label ?? ""}`, onRemove: () => set({ locationId: null }) }] : []),
  ];

  const actions: PageAction[] = canCreate ? [{ id: "create", label: "تقرير تالف", primary: true, onSelect: () => onCreate?.() }] : [];

  const columns: DataTableColumn<DamageReport>[] = [
    { key: "created_at", header: "التاريخ", cell: (row) => <DateTimeStackCell value={row.created_at} />, width: "w-28", priority: "high" },
    {
      key: "items",
      header: "الأصناف",
      cell: (row) => {
        const lines = row.lines ?? [];
        return (
          <span className="flex min-w-0 flex-col">
            <span className="truncate text-body text-fg">{lines[0]?.item?.name ?? "—"}</span>
            {lines.length > 1 ? <span className="truncate text-caption text-fg-muted">{moreItemsPhrase(lines.length - 1)}</span> : null}
          </span>
        );
      },
      priority: "high",
      role: "primary",
    },
    { key: "location", header: "الموقع", cell: (row) => <TextCell value={row.location?.name} />, width: "w-44" },
    { key: "reason", header: "السبب", cell: (row) => <TextCell value={row.reason?.name} />, width: "w-56" },
    { key: "status", header: "الحالة", cell: (row) => (row.status ? <StatusCell entity="damageReport" status={row.status} /> : <TextCell value={null} />), width: "w-36", priority: "high", role: "status" },
    { key: "responsibility", header: "المسؤولية", cell: (row) => <TextCell value={row.responsibility ? responsibilityLabels[row.responsibility] : null} />, width: "w-32", priority: "high" },
  ];

  const empty =
    active.length > 0 ? (
      <EmptyState
        icon={MagnifyingGlass}
        title="لا نتائج للفلتر"
        description="لا توجد تقارير تطابق ما اخترته. غيّر الفلاتر أو امسحها."
        action={
          <Button variant="secondary" onClick={clearAll}>
            مسح الفلاتر
          </Button>
        }
      />
    ) : (
      <EmptyState
        icon={Warning}
        title="لا تقارير تالف بعد"
        description={canCreate ? "ارفع تقريراً حين تجد بضاعة تالفة في المستودع." : "تظهر هنا تقارير التالف حين تُرفع."}
        action={
          canCreate ? (
            <Button variant="primary" onClick={onCreate}>
              تقرير تالف
            </Button>
          ) : undefined
        }
      />
    );

  return (
    <>
      <PageHeader title="تقارير تالف المستودع" description="تقارير التالف المرفوعة من مواقع المستودع، من الأحدث إلى الأقدم." actions={actions} />

      <div className="flex flex-col gap-4">
        <FilterBar
          quickFilters={[
            <Combobox key="status" aria-label="الحالة" placeholder="كل الحالات" options={statusOptions} value={filters.status} onValueChange={(status) => set({ status: status as DamageStatus | null })} clearable />,
            <Combobox key="location" aria-label="الموقع" placeholder="كل المواقع" options={locationOptions} value={filters.locationId} onValueChange={(locationId) => set({ locationId })} clearable />,
          ]}
          active={active}
          onClearAll={clearAll}
        />

        <DataTable
          label="تقارير التالف"
          columns={columns}
          rows={reports.status === "ready" ? reports.data.data : []}
          getRowKey={(row) => row.id ?? ""}
          loading={reports.status === "loading"}
          error={reports.status === "error" ? { code: reports.code, onRetry } : undefined}
          empty={empty}
          onRowOpen={onOpenReport}
        />

        {reports.status === "ready" ? <Pagination meta={reports.data.meta} onPageChange={onPageChange} onPerPageChange={onPerPageChange} /> : null}

        <p className="text-label text-fg-muted">المسؤولية للعلم، ولا ذمة مالية عليها.</p>
      </div>
    </>
  );
}
